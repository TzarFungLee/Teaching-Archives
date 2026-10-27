# Generates the J Dictation audio pack with Google Gemini TTS (AI Studio key).
#
#   API key:  read from the GEMINI_API_KEY environment variable, or from the
#             file  %USERPROFILE%\.gemini-tts-key  (one line, just the key).
#             NEVER put the key inside the repository.
#
#   Usage:    powershell -File scratch\generate-dictation-audio.ps1              # build/refresh the pack
#             powershell -File scratch\generate-dictation-audio.ps1 -SampleOnly # 3 voice samples to choose from
#             powershell -File scratch\generate-dictation-audio.ps1 -Voice Puck # use a specific voice
#
#   Output:   assets/audio/dictations/*.wav + manifest.json
#             (manifest maps each exact spoken line -> its audio file; the
#              J Dictation runner uses it automatically and falls back to
#              browser TTS for any line not in the manifest.)
#
#   NOTE: the announcement strings below mirror jdBuildSteps() in
#         tools/j-dictation.html — keep the two in sync if wording changes.

param(
    [string]$Voice = "Kore",
    [switch]$SampleOnly,
    [int]$DelaySeconds = 7   # free-tier friendly spacing between API calls
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $repo "assets\audio\dictations"
$manifestPath = Join-Path $outDir "manifest.json"

# ---- API key (never from inside the repo) ----
$key = $env:GEMINI_API_KEY
if (-not $key) {
    $keyFile = Join-Path $env:USERPROFILE ".gemini-tts-key"
    if (Test-Path $keyFile) { $key = (Get-Content $keyFile -Raw).Trim() }
}
if (-not $key) { throw "No API key. Set GEMINI_API_KEY or create $env:USERPROFILE\.gemini-tts-key" }

# ---- Gemini TTS call -> WAV bytes ----
function Get-TTSWav([string]$Text, [string]$VoiceName) {
    $body = @{
        contents = @(@{ parts = @(@{ text = $Text }) })
        generationConfig = @{
            responseModalities = @("AUDIO")
            speechConfig = @{ voiceConfig = @{ prebuiltVoiceConfig = @{ voiceName = $VoiceName } } }
        }
    } | ConvertTo-Json -Depth 8
    $uri = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=$key"
    $resp = Invoke-RestMethod -Uri $uri -Method Post -ContentType "application/json" -Body $body
    $b64 = $resp.candidates[0].content.parts[0].inlineData.data
    if (-not $b64) { throw "No audio in response for: $Text" }
    $pcm = [Convert]::FromBase64String($b64)

    # wrap raw PCM (16-bit mono 24 kHz) in a WAV header
    $ms = New-Object System.IO.MemoryStream
    $w = New-Object System.IO.BinaryWriter($ms)
    $w.Write([Text.Encoding]::ASCII.GetBytes("RIFF")); $w.Write([int](36 + $pcm.Length))
    $w.Write([Text.Encoding]::ASCII.GetBytes("WAVEfmt ")); $w.Write([int]16)
    $w.Write([int16]1); $w.Write([int16]1)          # PCM, mono
    $w.Write([int]24000); $w.Write([int]48000)      # sample rate, byte rate
    $w.Write([int16]2); $w.Write([int16]16)         # block align, bits
    $w.Write([Text.Encoding]::ASCII.GetBytes("data")); $w.Write([int]$pcm.Length)
    $w.Write($pcm); $w.Flush()
    $ms.ToArray()
}

New-Item -ItemType Directory -Force $outDir | Out-Null

# ---- voice audition mode ----
if ($SampleOnly) {
    $sampleText = "Dictation 1. Part A. Memorised sentences. A1. Our shop will give you 5% off your purchase if you show your membership card."
    foreach ($v in @("Kore", "Puck", "Charon")) {
        Write-Host "Generating sample voice: $v"
        [IO.File]::WriteAllBytes((Join-Path $outDir "SAMPLE-$v.wav"), (Get-TTSWav $sampleText $v))
        Start-Sleep -Seconds $DelaySeconds
    }
    Write-Host "Done. Listen to SAMPLE-*.wav in assets\audio\dictations and pick a voice."
    exit
}

# ---- collect every line the runner will speak ----
$lines = New-Object System.Collections.Generic.List[string]

# paper content from _data/dictations.yml (simple line format parser)
$yaml = Get-Content (Join-Path $repo "_data\dictations.yml")
$papers = @(); $cur = $null; $curPart = $null
foreach ($ln in $yaml) {
    if ($ln -match '^- id: (.+)$') { $cur = @{ id = $Matches[1]; label = ""; A = @(); B = @(); C = @(); D = @() }; $papers += $cur; $curPart = $null }
    elseif ($ln -match '^  label: "(.*)"$') { $cur.label = $Matches[1] }
    elseif ($ln -match '^  part([ABCD]):$') { $curPart = $Matches[1] }
    elseif ($ln -match '^    - "(.*)"$' -and $curPart) { $cur[$curPart] += $Matches[1] }
    elseif ($ln -match '^    - (.+)$' -and $curPart) { $cur[$curPart] += $Matches[1].Trim() }
    elseif ($ln -match '^  #') { $curPart = $null }
}

$maxItems = 0
foreach ($p in $papers) {
    foreach ($k in @("A", "B", "C", "D")) {
        foreach ($item in $p[$k]) { $lines.Add($item) }
        if ($p[$k].Count -gt $maxItems) { $maxItems = $p[$k].Count }
    }
    # first-part intro carries the dictation number (mirror of jdBuildSteps)
    $num = ""
    if ($p.label -match 'Dictation (\d+)') { $num = $Matches[1] }
    $first = @("A", "B", "C", "D") | Where-Object { $p[$_].Count -gt 0 } | Select-Object -First 1
    $introOf = @{ A = "Part A. Memorised sentences."; B = "Part B. Vocabulary."; C = "Part C. Infinitives."; D = "Part D. Unseen sentences." }
    if ($first) { $lines.Add("Dictation $num. " + $introOf[$first]) }
}

# announcements shared by every paper
foreach ($intro in @("Part A. Memorised sentences.", "Part B. Vocabulary.", "Part C. Infinitives.", "Part D. Unseen sentences.")) { $lines.Add($intro) }
for ($i = 1; $i -le [Math]::Max($maxItems, 12); $i++) { $lines.Add("Number $i."); $lines.Add("A$i."); $lines.Add("D$i.") }
$lines.Add("Now the whole list, from the top.")
foreach ($part in @("Part A", "Part B", "Part C", "Part D")) {
    foreach ($secs in @(20, 30, 45, 60)) { $lines.Add("You now have $secs seconds to tidy up $part.") }
}
$lines.Add("This is the end of the dictation. Please put your pens down.")

# ---- generate anything not already in the manifest ----
$manifest = @{}
if (Test-Path $manifestPath) {
    (Get-Content $manifestPath -Raw | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $manifest[$_.Name] = $_.Value }
}

$todo = $lines | Sort-Object -Unique | Where-Object { -not $manifest.ContainsKey($_) }
Write-Host "Lines total: $($lines.Count) unique-new: $($todo.Count) (already have $($manifest.Count))"

$md5 = [System.Security.Cryptography.MD5]::Create()
$n = 0
foreach ($text in $todo) {
    $n++
    $hash = ([BitConverter]::ToString($md5.ComputeHash([Text.Encoding]::UTF8.GetBytes($text))) -replace '-', '').Substring(0, 10).ToLower()
    $fname = "$hash.wav"
    Write-Host "[$n/$($todo.Count)] $text"
    [IO.File]::WriteAllBytes((Join-Path $outDir $fname), (Get-TTSWav $text $Voice))
    $manifest[$text] = "/assets/audio/dictations/$fname"
    # save manifest after every file so an interrupted run loses nothing
    $manifest.GetEnumerator() | Sort-Object Name | ForEach-Object -Begin { $o = [ordered]@{} } -Process { $o[$_.Name] = $_.Value } -End { $o } |
        ConvertTo-Json | Set-Content -Encoding utf8 $manifestPath
    Start-Sleep -Seconds $DelaySeconds
}
Write-Host "Pack complete: $($manifest.Count) clips in $outDir"

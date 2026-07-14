console.log('🚀 LTF Archive Engine Loaded');

// Global Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Esc inside a form control should only leave the control, never the page
        const el = document.activeElement;
        if (el && (el.matches('input, textarea, select') || el.isContentEditable)) {
            el.blur();
            return;
        }

        // With pretty permalinks every page URL ends in '/', so home must be an exact match
        const path = window.location.pathname;
        const isHome = path === '/' || path === '/index.html';
        if (isHome) return;

        // Don't silently discard quiz progress (checkedQuestions comes from quiz-engine.js)
        if (typeof checkedQuestions !== 'undefined' && checkedQuestions.size > 0 &&
            !window.confirm('Leave this quiz? Your progress will be lost.')) {
            return;
        }

        e.preventDefault();
        const cat = window.pageCategory || '';
        const target = cat ? `/#cat=${encodeURIComponent(cat)}` : '/';
        window.location.assign(target);
    }
});

function togglePart(event, element, partNum) {
    if (event) event.stopPropagation();
    const row = element.closest('tr');
    const targetPart = row.querySelector('.part-' + partNum);
    if (!targetPart) return;
    const answer = targetPart.querySelector('.answer');
    const placeholder = targetPart.querySelector('.placeholder');
    const isShowing = answer.classList.contains('show');
    if (isShowing) {
        answer.classList.remove('show');
        placeholder.classList.remove('hide');
    } else {
        answer.classList.add('show');
        placeholder.classList.add('hide');
    }
}

function toggleFullRow(td) {
    const row = td.closest('tr');
    const parts = row.querySelectorAll('.part');
    const firstAnswer = row.querySelector('.part-1 .answer');
    if (!firstAnswer) return;
    const shouldShow = !firstAnswer.classList.contains('show');
    parts.forEach(part => {
        const answer = part.querySelector('.answer');
        const placeholder = part.querySelector('.placeholder');
        if (shouldShow) {
            answer.classList.add('show');
            placeholder.classList.add('hide');
        } else {
            answer.classList.remove('show');
            placeholder.classList.remove('hide');
        }
    });
}

// --- AUDIO ENGINE --- //
window.audioSpeed = 'normal';
function toggleAudioSpeed() {
    window.audioSpeed = window.audioSpeed === 'normal' ? 'slow' : 'normal';
    // Slow down song/audio players too, not just text-to-speech
    document.querySelectorAll('audio').forEach(a => {
        a.playbackRate = window.audioSpeed === 'slow' ? 0.8 : 1.0;
    });
    const btn = document.getElementById('speedToggleBtn');
    if (btn) {
        if (window.audioSpeed === 'normal') {
            btn.innerHTML = '<span style="font-size: 0.85rem; font-weight: 800; line-height: 1; letter-spacing: 0.05em; margin-bottom: 3px; color: var(--accent);">AUDIO</span><span style="font-size: 0.75rem; line-height: 1; opacity: 0.85;">Slower</span>';
            btn.classList.remove('active');
            btn.style.background = '';
            btn.style.color = '';
            btn.style.borderColor = '';
        } else {
            btn.innerHTML = '<span style="font-size: 0.85rem; font-weight: 800; line-height: 1; letter-spacing: 0.05em; margin-bottom: 3px; color: #fff;">AUDIO</span><span style="font-size: 0.75rem; line-height: 1; opacity: 1;">Slow: ON</span>';
            btn.classList.add('active');
            btn.style.background = 'rgba(110, 193, 228, 0.2)';
            btn.style.color = '#fff';
            btn.style.borderColor = 'rgba(110, 193, 228, 0.4)';
        }
    }
}

let cachedBestVoice = null;
function loadBestVoice() {
    if (cachedBestVoice) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return;
    
    // Preferred voices per platform: Serena (macOS), Google UK (Chrome),
    // Microsoft natural voices (Windows/Edge), then any local English voice
    cachedBestVoice = voices.find(v => v.name.includes("Serena")) ||
                      voices.find(v => v.name.includes("Google UK English Female")) ||
                      voices.find(v => /Microsoft.*(Sonia|Libby|Hazel|Mia|Susan)/i.test(v.name)) ||
                      voices.find(v => v.name.includes("Samantha")) ||
                      voices.find(v => v.lang === "en-GB" && v.localService) ||
                      voices.find(v => v.lang.startsWith("en") && v.localService) ||
                      voices.find(v => v.lang === "en-GB") ||
                      voices.find(v => v.lang.startsWith("en")) ||
                      voices[0];
}

if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = loadBestVoice;
    loadBestVoice();
}

function speakBubble(bubble) {
    if (!cachedBestVoice && window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => { loadBestVoice(); speakBubble(bubble); };
        return;
    } else if (!cachedBestVoice) {
        loadBestVoice();
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(bubble.textContent.trim());
    if (cachedBestVoice) {
        utterance.voice = cachedBestVoice;
        utterance.lang = cachedBestVoice.lang;
    } else {
        utterance.lang = 'en-GB';
    }
    
    // Default to a natural speed, or slow down if toggled
    utterance.rate = window.audioSpeed === 'slow' ? 0.55 : 0.9; 
    utterance.pitch = 1.0;
    
    const originalTransform = bubble.style.transform || 'none';
    bubble.style.transform = "scale(1.15)";
    setTimeout(() => bubble.style.transform = originalTransform, 150);
    
    window.speechSynthesis.speak(utterance);
}

function speakSentence(icon) {
    if (window.event) window.event.stopPropagation();
    const container = icon.parentElement;
    if (!cachedBestVoice && window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => { loadBestVoice(); speakSentence(icon); };
        return;
    } else if (!cachedBestVoice) {
        loadBestVoice();
    }

    let visibleTextParts = [];
    function extractVisibleText(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            visibleTextParts.push(node.textContent);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node === icon || window.getComputedStyle(node).display === 'none') return;
            if (node.classList.contains('placeholder')) {
                visibleTextParts.push(node.textContent.replace(/_{2,}/g, '|PAUSE|'));
                return;
            }
            for (let child of node.childNodes) extractVisibleText(child);
        }
    }
    extractVisibleText(container);

    let textToSpeak = visibleTextParts.join(' ').replace(/\s+/g, ' ').trim();
    window.speechSynthesis.cancel();

    const chunks = textToSpeak.split('|PAUSE|');

    function speakChunks(chunksToSpeak) {
        if (chunksToSpeak.length === 0) return;
        const chunk = chunksToSpeak.shift().trim();

        if (chunk) {
            const utterance = new SpeechSynthesisUtterance(chunk);
            if (cachedBestVoice) {
                utterance.voice = cachedBestVoice;
                utterance.lang = cachedBestVoice.lang;
            } else {
                utterance.lang = 'en-GB';
            }
            utterance.rate = window.audioSpeed === 'slow' ? 0.55 : 0.9;
            utterance.pitch = 1.0;

            utterance.onend = () => {
                if (chunksToSpeak.length > 0) {
                    setTimeout(() => speakChunks(chunksToSpeak), 500);
                }
            };

            window.speechSynthesis.speak(utterance);
        } else if (chunksToSpeak.length > 0) {
            setTimeout(() => speakChunks(chunksToSpeak), 500);
        }
    }

    speakChunks(chunks);

    icon.style.transform = "scale(1.3)";
    setTimeout(() => icon.style.transform = "scale(1.1)", 200);
}

// --- STICKY TOC LOGIC --- //

// --- STICKY TOC LOGIC --- //
function generateTOC() {
    const content = document.querySelector('.content');
    const tocContainer = document.getElementById('sidebarTOC');
    if (!content || !tocContainer) return;

    const headings = content.querySelectorAll('h3');
    if (headings.length < 2) {
        tocContainer.style.display = 'none';
        return;
    }

    const ul = tocContainer.querySelector('ul');
    ul.innerHTML = '';

    headings.forEach((h3, index) => {
        const id = 'heading-' + index;
        h3.id = id;
        
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#' + id;
        a.textContent = h3.textContent.replace(/[^\w\s\u4e00-\u9fa5]/g, '').trim(); // Keep text and Chinese
        
        li.appendChild(a);
        ul.appendChild(li);
    });

    // Highlight active heading on scroll using IntersectionObserver (Highly Performant)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentId = entry.target.id;
                tocContainer.querySelectorAll('a').forEach(a => {
                    a.classList.remove('active');
                    if (a.getAttribute('href') === '#' + currentId) {
                        a.classList.add('active');
                    }
                });
            }
        });
    }, { rootMargin: '-10% 0px -80% 0px' }); // Trigger when heading is near the top

    headings.forEach(h3 => observer.observe(h3));
}

// --- LESSON PREV/NEXT NAVIGATION (driven by _data/curriculum.yml) --- //
async function buildLessonNav() {
    const cat = (window.pageCategory || '').toLowerCase();
    const content = document.querySelector('.content');
    if (!cat || !content) return;
    try {
        const [curResp, resResp] = await Promise.all([
            fetch('/assets/js/curriculum.json'),
            fetch('/assets/js/search-data.json')
        ]);
        const curriculum = await curResp.json();
        const units = curriculum && curriculum[cat];
        if (!units) return;
        const resources = await resResp.json();
        const titleByUrl = {};
        resources.forEach(r => { titleByUrl[r.url] = r.title; });

        const flat = [];
        units.forEach(u => (u.lessons || []).forEach(l => flat.push({ slug: l.slug, unit: u.unit })));
        let path = window.location.pathname;
        if (!path.endsWith('/')) path += '/';
        const idx = flat.findIndex(l => l.slug === path);
        if (idx === -1) return;

        // Remember this lesson so the home portal can offer "Continue: …"
        try {
            localStorage.setItem('ltf-last-lesson', JSON.stringify({
                url: path,
                title: titleByUrl[path] || document.title.split('|')[0].trim(),
                when: Date.now()
            }));
        } catch (e) { /* best-effort */ }

        const nav = document.createElement('nav');
        nav.className = 'lesson-nav';
        nav.setAttribute('aria-label', 'Lesson sequence');

        const slot = (lesson, cls, arrowBefore) => {
            if (!lesson) {
                const spacer = document.createElement('span');
                nav.appendChild(spacer);
                return;
            }
            const a = document.createElement('a');
            a.className = 'lesson-nav-link ' + cls;
            a.href = lesson.slug;
            const title = titleByUrl[lesson.slug] || 'Lesson';
            a.textContent = arrowBefore ? '← ' + title : title + ' →';
            nav.appendChild(a);
        };

        slot(flat[idx - 1], 'prev', true);
        const mid = document.createElement('span');
        mid.className = 'lesson-nav-unit';
        mid.textContent = flat[idx].unit;
        nav.appendChild(mid);
        slot(flat[idx + 1], 'next', false);

        content.appendChild(nav);
    } catch (e) { /* nav is progressive enhancement; the page works without it */ }
}

// --- DOM READY --- //
document.addEventListener('DOMContentLoaded', function() {
    buildLessonNav();
    // Global bubble listener
    document.addEventListener('click', function(event) {
        const bubble = event.target.closest('.grammar-bubble, .v-bubble');
        if (bubble) {
            event.stopPropagation();
            speakBubble(bubble);
        }
    }, true);

    // Dynamic row handlers for revealing full answers
    document.querySelectorAll('.clickable-sentence').forEach(td => {
        td.onclick = function(event) {
            if (event.target.closest('.grammar-bubble, .v-bubble, .audio-icon')) return;
            toggleFullRow(this);
        };
    });

    // TOC
    generateTOC();

    // Tabbed pages must not load looking empty: activate the first tab
    // when the page has content sections but none is shown by default
    if (document.querySelector('.content-section') && !document.querySelector('.content-section.show')) {
        const firstTab = document.querySelector('.tense-card');
        if (firstTab) firstTab.click();
    }

    // Click-to-compare writing widget: clicking a highlight lights up its
    // twin (same data-pair) in the other column and shows the explanation
    // carried in the formal twin's data-note. Fully data-driven — any page
    // can add a .compare-block with no extra JS.
    const activateCmp = function(cmp) {
        const block = cmp.closest('.compare-block');
        if (!block) return;
        const pair = cmp.dataset.pair;
        block.classList.add('has-active');
        block.querySelectorAll('.cmp').forEach(el => {
            el.classList.toggle('active', el.dataset.pair === pair);
        });
        const note = block.querySelector('.compare-note');
        const src = block.querySelector(`.cmp[data-pair="${pair}"][data-note]`);
        if (note && src) note.innerHTML = '💡 ' + src.dataset.note;
    };

    // Keyboard access: highlights behave like buttons (Tab + Enter/Space)
    document.querySelectorAll('.compare-block .cmp').forEach(el => {
        el.tabIndex = 0;
        el.setAttribute('role', 'button');
    });

    document.addEventListener('click', function(event) {
        const cmp = event.target.closest('.cmp');
        if (cmp) activateCmp(cmp);
    });

    document.addEventListener('keydown', function(event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const cmp = event.target.closest ? event.target.closest('.cmp') : null;
        if (!cmp) return;
        event.preventDefault();
        activateCmp(cmp);
    });

    // --- AUTO-TOGGLE INJECTOR --- //
    // 1. Transform "A / B" situations into clickable triggers
    document.querySelectorAll('tr').forEach(row => {
        const situationTd = row.cells[0];
        const practiceTd = row.cells[1];
        if (situationTd && practiceTd && practiceTd.classList.contains('clickable-sentence')) {
            const rawText = situationTd.textContent.trim();
            if (rawText.includes('/') && !situationTd.querySelector('span[onclick]')) {
                const parts = rawText.split('/').map(p => p.trim());
                if (parts.length > 1) {
                    situationTd.classList.add('clickable-situation');
                    let newHtml = '';
                    parts.forEach((p, idx) => {
                        newHtml += `<span onclick="togglePart(event, this, ${idx + 1})">${p}</span>`;
                        if (idx < parts.length - 1) newHtml += ' / ';
                    });
                    situationTd.innerHTML = newHtml;
                }
            } else if (!rawText.includes('/') && rawText.length > 0 && !situationTd.querySelector('span[onclick]') && !situationTd.getAttribute('colspan')) {
                situationTd.classList.add('clickable-situation');
                situationTd.innerHTML = `<span onclick="togglePart(event, this, 1)">${situationTd.innerHTML}</span>`;
            }
        }
    });

    // 2. Transform "(word/word)" hints in placeholders into clickable triggers
    document.querySelectorAll('.clickable-sentence').forEach(sentenceTd => {
        let rowHintIndex = 0;
        sentenceTd.querySelectorAll('.placeholder').forEach(p => {
            const text = p.innerHTML;
            const regex = /\(([^)]+)\)/g;
            if (regex.test(text)) {
                regex.lastIndex = 0; 
                const newHtml = text.replace(regex, (match, content) => {
                    rowHintIndex++; 
                    const parts = content.split('/').map(part => part.trim());
                    let result = '(';
                    parts.forEach((part, idx) => {
                        result += `<span class="hint-toggle" onclick="togglePart(event, this, ${rowHintIndex})">${part}</span>`;
                        if (idx < parts.length - 1) result += '/';
                    });
                    result += ')';
                    return result;
                });
                p.innerHTML = newHtml;
            }
        });
    });
});


// Quiz Helpers
function renderSemanticFeedback(questionNum, isCorrect, explanation) {
    const feedbackEl = document.getElementById(`feedback${questionNum}`);
    const explanationEl = document.getElementById(`explanation${questionNum}`);
    
    if (!feedbackEl || !explanationEl) return;
    
    if (isCorrect) {
        feedbackEl.className = 'feedback correct';
        feedbackEl.innerHTML = `<span>✓ Correct!</span>`;
    } else {
        feedbackEl.className = 'feedback incorrect';
        feedbackEl.innerHTML = `<span>✗ Incorrect. Check the explanation.</span>`;
    }
    
    explanationEl.classList.add('show');
    explanationEl.style.marginTop = "10px";
    explanationEl.style.padding = "20px";
    explanationEl.style.background = "rgba(255,255,255,0.03)";
    explanationEl.style.borderLeft = "4px solid " + (isCorrect ? "#4ade80" : "#f87171");
}

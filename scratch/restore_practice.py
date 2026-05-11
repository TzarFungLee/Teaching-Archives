import re
import os

file_path = "./Listening/Listening Vocabulary.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Pattern for td.word
# We want to wrap the content of <td class="word">...</td>
def wrap_word(match):
    opening = match.group(1)
    content = match.group(2)
    closing = match.group(3)
    # Check if already wrapped
    if "speak-item" in content:
        return match.group(0)
    return f'{opening}<span class="speak-item" onclick="SpeechManager.speak(this.innerText)">{content}</span>{closing}'

content = re.sub(r'(<td class="word">)(.*?)(</td>)', wrap_word, content, flags=re.DOTALL)

# Pattern for td.forms
# Usage column often has multiple lines with <br>
# We might want to wrap each line or the whole thing.
# Looking at the CSS, .forms is also mentioned in line 9.
# Let's wrap the whole content of forms as well, but maybe without the icon (controlled by CSS).

def wrap_forms(match):
    opening = match.group(1)
    inner_content = match.group(2)
    closing = match.group(3)
    if "speak-item" in inner_content:
        return match.group(0)
    return f'{opening}<span class="speak-item" onclick="SpeechManager.speak(this.innerText)">{inner_content}</span>{closing}'

content = re.sub(r'(<td class="forms">)(.*?)(</td>)', wrap_forms, content, flags=re.DOTALL)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Restored speak-item spans to Listening Vocabulary.html")

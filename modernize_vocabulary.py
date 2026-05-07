import re
import os

filepath = '/Users/tfl/Documents/GitHub/Teaching-Archives/Reading/Reading Vocabulary.html'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add styles
styles = """
<style>
    .word-search-container {
        position: sticky;
        top: 20px;
        z-index: 100;
        margin-bottom: 30px;
        background: var(--bg-alt);
        padding: 15px;
        border-radius: 15px;
        border: 1px solid var(--border);
        box-shadow: var(--shadow);
    }
    
    .word-search-input {
        width: 100%;
        padding: 12px 20px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.1);
        background: rgba(0,0,0,0.2);
        color: white;
        font-size: 1.1rem;
    }

    .word {
        font-weight: 700;
        color: var(--primary) !important;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .word:hover {
        color: var(--accent) !important;
        text-decoration: underline;
    }

    .word::after {
        content: ' 🔊';
        font-size: 0.8em;
        opacity: 0.4;
    }

    .category-header {
        background: rgba(110, 193, 228, 0.1) !important;
    }
</style>

<div class="word-search-container">
    <input type="text" id="vocabSearch" class="word-search-input" placeholder="🔍 Search for a word or meaning..." onkeyup="filterVocab()">
</div>
"""

# Insert styles after front matter
content = re.sub(r'(---.*?---)', r'\1\n' + styles, content, flags=re.DOTALL)

# Add onclick to all td.word
content = content.replace('<td class="word">', '<td class="word" onclick="speakBubble(this)">')

# Add table ID
content = content.replace('<tbody>', '<tbody id="vocabTable">')

# Add filter script at the end
script = """
<script>
    function filterVocab() {
        const input = document.getElementById('vocabSearch');
        const filter = input.value.toLowerCase();
        const table = document.getElementById('vocabTable');
        const tr = table.getElementsByTagName('tr');

        for (let i = 0; i < tr.length; i++) {
            // Skip category headers in search or handle them
            if (tr[i].style.background && tr[i].style.background.includes('e3f2fd')) {
                 continue; 
            }
            
            let found = false;
            const tds = tr[i].getElementsByTagName('td');
            for (let j = 0; j < tds.length; j++) {
                if (tds[j].textContent.toLowerCase().includes(filter)) {
                    found = true;
                    break;
                }
            }
            tr[i].style.display = found ? "" : "none";
        }
    }
</script>
"""
content += script

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Reading Vocabulary modernized.")

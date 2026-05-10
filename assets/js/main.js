// --- GLOBAL ARCHIVE LOGIC --- //

// Disable right-click
document.addEventListener('contextmenu', event => event.preventDefault());

// Disable common copy shortcuts
document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey && e.key === 'c') || (e.metaKey && e.key === 'c')) {
        e.preventDefault();
        alert('Copying is disabled on this page.');
    }
});

// Disable text drag
document.addEventListener('dragstart', event => event.preventDefault());

// --- INTERACTIVE COMPONENTS --- //

// Table Interaction
function togglePart(element, partNum) {
    if (window.event) window.event.stopPropagation();
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
let cachedBestVoice = null;
function loadBestVoice() {
    if (cachedBestVoice) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return;
    const targets = ["Serena", "Google UK English Female", "Martha", "Google UK English Male", "Daniel", "Samantha"];
    for (let name of targets) {
        cachedBestVoice = voices.find(v => v.name.includes(name));
        if (cachedBestVoice) break;
    }
    if (!cachedBestVoice) cachedBestVoice = voices.find(v => v.lang.includes("en-GB"));
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
    
    // Pillar 1, Rec 1: Default to clear slow speed
    utterance.rate = 0.7; 
    utterance.pitch = 1.1;
    
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
            utterance.rate = 0.7;
            utterance.pitch = 1.1;

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

    // Highlight active heading on scroll
    window.addEventListener('scroll', () => {
        let current = '';
        headings.forEach(h3 => {
            const top = h3.offsetTop;
            if (pageYOffset >= top - 150) {
                current = h3.id;
            }
        });

        tocContainer.querySelectorAll('a').forEach(a => {
            a.classList.remove('active');
            if (a.getAttribute('href') === '#' + current) {
                a.classList.add('active');
            }
        });
    });
}

// --- DOM READY --- //
document.addEventListener('DOMContentLoaded', function() {
    // Global bubble listener
    document.addEventListener('click', function(event) {
        const bubble = event.target.closest('.grammar-bubble, .v-bubble');
        if (bubble) {
            event.stopPropagation();
            speakBubble(bubble);
        }
    }, true);

    // Dynamic row handlers
    document.querySelectorAll('.clickable-sentence').forEach(td => {
        td.onclick = function(event) {
            if (event.target.closest('.grammar-bubble, .v-bubble, .audio-icon')) return;
            toggleFullRow(this);
        };
    });

    // TOC
    generateTOC();
});


// Quiz Helpers
function renderSemanticFeedback(questionNum, isCorrect, explanation) {
    const feedbackEl = document.getElementById(`feedback${questionNum}`);
    const explanationEl = document.getElementById(`explanation${questionNum}`);
    
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

import os
import re

dir_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Quizzes')

def optimize_quiz(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update the checkQuestion function to use renderSemanticFeedback
    # Look for the checkQuestion function block
    content = re.sub(
        r'function checkQuestion\(questionNum\) \{.*?feedbackEl\.textContent = \'✓ Correct!\';.*?feedbackEl\.textContent = \'✗ Incorrect\. Check the explanation below\.\';.*?explanationEl\.classList\.add\(\'show\'\);.*?\}',
        r'''function checkQuestion(questionNum) {
        const question = `q${questionNum}`;
        const selected = document.querySelector(`input[name="${question}"]:checked`);
        
        if (!selected) {
            alert('Please select an answer first.');
            return;
        }

        const isCorrect = (selected.value === answers[question]);
        renderSemanticFeedback(questionNum, isCorrect);
        
        const button = event.target;
        button.disabled = true;
        button.textContent = 'Checked ✓';
        
        checkedQuestions.add(questionNum);
        updateProgress();
    }''',
        content, flags=re.DOTALL
    )

    # 2. Add audio icon to question template
    # Look for questionHTML string
    content = re.sub(
        r'<div class="question-text">\$\{questionNum\}\. \$\{q\.question\}</div>',
        r'<div class="question-text">${questionNum}. ${q.question} <span class="audio-icon" onclick="speakSentence(this)">🔊</span></div>',
        content
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root, dirs, files in os.walk(dir_path):
    for file in files:
        if file.endswith('.html'):
            optimize_quiz(os.path.join(root, file))

print("Quizzes optimized.")

/* LTF Teaching Archives — shared multiple-choice quiz engine.
 *
 * Each quiz page supplies its data in a <script> block BEFORE this file, either as:
 *   - `questionBank`: array of { question, options, correct, explanation }.
 *     The engine picks QUESTION_COUNT at random and shuffles each question's options.
 *   - `buildQuestions()`: a function returning a ready array of QUESTION_COUNT
 *     questions whose options are already in final order (`correct` = index).
 *
 * The page markup must contain #quizForm, #progressText and a reset button
 * calling resetQuiz(). renderSemanticFeedback() is provided by main.js.
 */

const QUESTION_COUNT = 12;

let checkedQuestions = new Set();
let currentQuestions = [];
let answers = {};

function shuffle(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function generateQuiz() {
    if (typeof buildQuestions === 'function') {
        currentQuestions = buildQuestions();
    } else {
        currentQuestions = shuffle(questionBank).slice(0, QUESTION_COUNT).map(q => {
            const opts = shuffle(q.options.map((opt, idx) => ({ text: opt, isCorrect: idx === q.correct })));
            return {
                question: q.question,
                options: opts.map(o => o.text),
                correct: opts.findIndex(o => o.isCorrect),
                explanation: q.explanation
            };
        });
    }

    const quizForm = document.getElementById('quizForm');
    quizForm.innerHTML = '';

    currentQuestions.forEach((q, index) => {
        const questionNum = index + 1;
        const questionId = `q${questionNum}`;
        answers[questionId] = String.fromCharCode(97 + q.correct); // 'a', 'b', 'c', ...

        const questionHTML = `
        <div class="question">
            <div class="question-text">${questionNum}. ${q.question} <span class="audio-icon" onclick="speakSentence(this)">🔊</span></div>
            <div class="options">
                ${q.options.map((opt, idx) => `
                <label class="option">
                    <input type="radio" name="${questionId}" value="${String.fromCharCode(97 + idx)}">
                    ${opt}
                </label>`).join('')}
            </div>
            <div class="feedback" id="feedback${questionNum}"></div>
            <div class="explanation" id="explanation${questionNum}">
                ${q.explanation}
            </div>
            <button type="button" class="check-btn" onclick="checkQuestion(${questionNum})">Check Answer</button>
        </div>`;

        quizForm.innerHTML += questionHTML;
    });
}

window.addEventListener('DOMContentLoaded', generateQuiz);

function checkQuestion(questionNum) {
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
}

function updateProgress() {
    const totalQuestions = Object.keys(answers).length;
    const checked = checkedQuestions.size;
    const progressText = document.getElementById('progressText');

    if (checked === 0) {
        progressText.textContent = 'Answer the questions below';
    } else if (checked === totalQuestions) {
        const correctCount = Array.from(checkedQuestions).filter(num => {
            const question = `q${num}`;
            const selected = document.querySelector(`input[name="${question}"]:checked`);
            return selected && selected.value === answers[question];
        }).length;

        progressText.textContent = `Quiz Complete! Score: ${correctCount}/${totalQuestions}`;
    } else {
        progressText.textContent = `Progress: ${checked}/${totalQuestions} questions checked`;
    }
}

function resetQuiz() {
    generateQuiz();
    checkedQuestions.clear();
    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

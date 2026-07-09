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
const STORAGE_KEY = 'ltf-quiz:' + window.location.pathname;

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
        <div class="question" id="question${questionNum}">
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

    showLastAttempt();
}

window.addEventListener('DOMContentLoaded', generateQuiz);

function checkQuestion(questionNum) {
    const question = `q${questionNum}`;
    const selected = document.querySelector(`input[name="${question}"]:checked`);
    const feedbackEl = document.getElementById(`feedback${questionNum}`);

    if (!selected) {
        feedbackEl.className = 'feedback nudge';
        feedbackEl.innerHTML = '<span>👆 Choose an answer first.</span>';
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

function isQuestionCorrect(num) {
    const selected = document.querySelector(`input[name="q${num}"]:checked`);
    return selected && selected.value === answers[`q${num}`];
}

function updateProgress() {
    const totalQuestions = Object.keys(answers).length;
    const checked = checkedQuestions.size;
    const progressText = document.getElementById('progressText');
    const summary = getSummaryEl();

    if (checked === 0) {
        progressText.textContent = 'Answer the questions below';
        summary.innerHTML = '';
    } else if (checked === totalQuestions) {
        const missed = Array.from(checkedQuestions).filter(num => !isQuestionCorrect(num)).sort((a, b) => a - b);
        const correctCount = totalQuestions - missed.length;
        progressText.textContent = `Quiz Complete! Score: ${correctCount}/${totalQuestions}`;
        saveAttempt(correctCount, totalQuestions);

        if (missed.length === 0) {
            summary.innerHTML = '<span class="quiz-perfect">🌟 Perfect score — well done!</span>';
        } else {
            summary.innerHTML = 'Review your mistakes: ' + missed.map(num =>
                `<button type="button" class="missed-q-btn" onclick="goToQuestion(${num})">Q${num}</button>`
            ).join(' ');
        }
    } else {
        progressText.textContent = `Progress: ${checked}/${totalQuestions} questions checked`;
        summary.innerHTML = '';
    }
}

function goToQuestion(num) {
    const el = document.getElementById(`question${num}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function getSummaryEl() {
    let summary = document.getElementById('quizSummary');
    if (!summary) {
        summary = document.createElement('div');
        summary.id = 'quizSummary';
        summary.className = 'quiz-summary';
        const container = document.getElementById('progressContainer') ||
            document.getElementById('progressText').parentElement;
        container.appendChild(summary);
    }
    return summary;
}

function saveAttempt(score, total) {
    try {
        let prev = {};
        try { prev = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (e) { }
        // Keep the best run separately: the home portal shows it on the quiz chip
        const best = (prev.best && prev.best.score >= score) ? prev.best : { score, total };
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ score, total, when: Date.now(), best }));
    } catch (e) { /* private mode: persistence is best-effort */ }
}

function showLastAttempt() {
    if (checkedQuestions.size > 0) return;
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved && typeof saved.score === 'number') {
            getSummaryEl().innerHTML =
                `<span class="last-attempt">Last attempt: ${saved.score}/${saved.total}</span>`;
        }
    } catch (e) { /* no saved attempt */ }
}

function resetQuiz() {
    checkedQuestions.clear();
    generateQuiz();
    updateProgress();
    showLastAttempt();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

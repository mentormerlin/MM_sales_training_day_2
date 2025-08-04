// Main quiz logic for Mentor Merlin site

/* global questions */

// Utility function to shuffle an array in place
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

let quizQuestions = [];
let currentIndex = 0;
let answers = [];
let timerInterval;
const QUIZ_DURATION_SECONDS = 1800;

const ADMIN_PASSWORD = 'MM@123';

// Main DOM Ready Handler
document.addEventListener('DOMContentLoaded', () => {
    // Quiz Start Logic
    const startBtn = document.getElementById('startBtn');
    if (startBtn) startBtn.addEventListener('click', startQuiz);

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => navigateQuestion(-1));
        nextBtn.addEventListener('click', () => navigateQuestion(1));
    }

    // Admin Login Protection
    const adminContent = document.getElementById('adminContent');
    const leaderboardEl = document.getElementById('leaderboardTable');
    if (!leaderboardEl || !adminContent) return;

    const loginModal = document.getElementById('adminLoginModal');
    const loginBtn = document.getElementById('adminLoginBtn');
    const passwordInput = document.getElementById('adminPasswordInput');
    const errorMsg = document.getElementById('loginError');

    // Hide admin content and show login modal on load
    loginModal.classList.remove('hidden');
    adminContent.classList.add('hidden');

    loginBtn.addEventListener('click', () => {
        const entered = passwordInput.value;
        if (entered === ADMIN_PASSWORD) {
            loginModal.classList.add('hidden');
            adminContent.classList.remove('hidden');
            errorMsg.classList.add('hidden');
            loadLeaderboard();
        } else {
            errorMsg.classList.remove('hidden');
        }
    });
});

function startQuiz() {
    const nameInput = document.getElementById('traineeName');
    const emailInput = document.getElementById('traineeEmail');
    const name = nameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    if (!name || !email) {
        alert('Please enter your name and email to start the quiz.');
        return;
    }
    if (localStorage.getItem(`attempted_${email}`)) {
        alert('You have already attempted this quiz. Only one attempt is allowed.');
        return;
    }

    document.getElementById('quiz-start').classList.add('hidden');
    document.getElementById('quiz-content').classList.remove('hidden');

    quizQuestions = questions.map((q) => {
        const qCopy = JSON.parse(JSON.stringify(q));
        if (qCopy.type === 'mcq') {
            const optionIndices = qCopy.options.map((_, idx) => idx);
            const shuffledIndices = shuffleArray(optionIndices);
            const shuffledOptions = shuffledIndices.map((i) => qCopy.options[i]);
            const newCorrectIndex = shuffledIndices.indexOf(qCopy.correctIndex);
            qCopy.options = shuffledOptions;
            qCopy.correctIndex = newCorrectIndex;
        }
        return qCopy;
    });

    quizQuestions = shuffleArray(quizQuestions);
    answers = new Array(quizQuestions.length).fill(null);
    currentIndex = 0;
    startTimer(QUIZ_DURATION_SECONDS);
    displayQuestion();
    updateProgressBar();

    sessionStorage.setItem('quiz_userName', name);
    sessionStorage.setItem('quiz_userEmail', email);
}

function startTimer(duration) {
    let timeLeft = duration;
    const timerEl = document.getElementById('timer');
    timerEl.textContent = formatTime(timeLeft);
    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = formatTime(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            submitQuiz();
        }
    }, 1000);
}

function displayQuestion() {
    const questionArea = document.getElementById('question-area');
    const question = quizQuestions[currentIndex];
    let html = `<h3>Question ${currentIndex + 1} of ${quizQuestions.length}</h3>`;
    html += `<p class="question-text">${question.question}</p>`;
    if (question.type === 'mcq') {
        html += '<div class="options">';
        question.options.forEach((opt, idx) => {
            const checked = answers[currentIndex] === idx ? 'checked' : '';
            html += `<label class="option-label"><input type="radio" name="option" value="${idx}" ${checked}/><span>${opt}</span></label>`;
        });
        html += '</div>';
    }
    questionArea.innerHTML = html;

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    prevBtn.classList.toggle('hidden', currentIndex === 0);
    nextBtn.textContent = currentIndex === quizQuestions.length - 1 ? 'Submit' : 'Next';

    document.querySelectorAll('input[name="option"]').forEach((input) => {
        input.addEventListener('change', (e) => {
            const value = parseInt(e.target.value, 10);
            answers[currentIndex] = value;
        });
    });
}

function navigateQuestion(step) {
    if (step === 1 && answers[currentIndex] === null) {
        alert('Please select an answer before proceeding.');
        return;
    }
    currentIndex += step;
    if (currentIndex < 0) currentIndex = 0;
    if (currentIndex >= quizQuestions.length) {
        submitQuiz();
    } else {
        displayQuestion();
        updateProgressBar();
    }
}

function updateProgressBar() {
    const progressBar = document.getElementById('progressBar');
    const progress = (currentIndex / quizQuestions.length) * 100;
    progressBar.style.width = `${progress}%`;
}

function submitQuiz() {
    clearInterval(timerInterval);
    document.getElementById('quiz-content').classList.add('hidden');

    let score = 0;
    const detailed = [];
    quizQuestions.forEach((question, idx) => {
        const userAnswer = answers[idx];
        const correct = userAnswer === question.correctIndex;
        if (correct) score++;
        detailed.push({
            id: question.id,
            question: question.question,
            userAnswer: userAnswer,
            correctAnswerIndex: question.correctIndex,
            options: question.options,
            explanation: question.explanation,
            correct: correct
        });
    });

    const percentage = (score / quizQuestions.length) * 100;
    const status = percentage >= 60 ? 'Passed' : 'Failed';

    const resultEl = document.getElementById('quiz-result');
    let resultHtml = `<h2>Quiz Results</h2>`;
    resultHtml += `<p>Your Score: ${score} out of ${quizQuestions.length}</p>`;
    resultHtml += `<p>Percentage: ${percentage.toFixed(2)}%</p>`;
    resultHtml += `<p>Status: <span class="${status === 'Passed' ? 'pass' : 'fail'}">${status}</span></p>`;
    resultHtml += `<h3>Review</h3>`;
    detailed.forEach((item, idx) => {
        resultHtml += `<div class="result-item ${item.correct ? 'correct' : 'incorrect'}">`;
        resultHtml += `<p><strong>Q${idx + 1}:</strong> ${item.question}</p>`;
        resultHtml += `<p>Your answer: <strong>${item.options[item.userAnswer] ?? 'No answer'}</strong></p>`;
        resultHtml += `<p>Correct answer: <strong>${item.options[item.correctAnswerIndex]}</strong></p>`;
        resultHtml += `<p class="explanation">${item.explanation}</p>`;
        resultHtml += `</div>`;
    });
    resultEl.innerHTML = resultHtml;
    resultEl.classList.remove('hidden');

    const name = sessionStorage.getItem('quiz_userName');
    const email = sessionStorage.getItem('quiz_userEmail');
    const timestamp = new Date().toISOString();
    const result = {
        name,
        email,
        score,
        percentage: percentage.toFixed(2),
        status,
        timestamp,
        answers: detailed
    };

    localStorage.setItem(`attempted_${email}`, 'true');
    const storedResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
    storedResults.push(result);
    localStorage.setItem('quizResults', JSON.stringify(storedResults));

    sendResultToSheet(result);
}

function sendResultToSheet(result) {
    const scriptURL = 'https://script.google.com/macros/s/AKfycbymDXctgi7nYqAGXBrEcuSeqd5DB7tpQHAZjz2oB3EmZeNDjCwhjonV4BWxst1VjObf/exec';
    if (!scriptURL) return;

    fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
    }).catch((error) => {
        console.error('Error sending result to sheet:', error);
    });
}

function loadLeaderboard() {
    fetchLeaderboardData()
        .then((data) => {
            data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            populateLeaderboardTable(data);
        })
        .catch(() => {
            const local = JSON.parse(localStorage.getItem('quizResults') || '[]');
            local.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            populateLeaderboardTable(local);
        });
}

function fetchLeaderboardData() {
    return new Promise((resolve, reject) => {
        const readURL = 'https://script.google.com/macros/s/AKfycbymDXctgi7nYqAGXBrEcuSeqd5DB7tpQHAZjz2oB3EmZeNDjCwhjonV4BWxst1VjObf/exec?action=get';
        if (!readURL) {
            reject();
            return;
        }
        fetch(readURL)
            .then((res) => res.json())
            .then((data) => resolve(data))
            .catch((err) => reject(err));
    });
}

function populateLeaderboardTable(data) {
    const tbody = document.querySelector('#leaderboardTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    data.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.name}</td>
            <td>${item.email}</td>
            <td>${item.score}</td>
            <td>${item.percentage}%</td>
            <td>${item.status || item.result}</td>
            <td>${new Date(item.timestamp).toLocaleString()}</td>
        `;
        tbody.appendChild(tr);
    });
}

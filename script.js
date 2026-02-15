class OlympiaGame {
    constructor() {
        this.questions = [
            {
                content: "\"Đạo đức tốt\", \"Học tập tốt\", \"Thể lực tốt\" là những tiêu chí của phong trào thi đua nào do Trung ương Đoàn Thanh niên Cộng sản Hồ Chí Minh phát động dành cho học sinh cấp THPT?",
                answer: "Học sinh 3 tốt",
                time: 15
            },
            {
                content: "Trong truyện Kiều, Kim Trọng đã tặng vật gì cho Thúy Kiều để làm tin?",
                answer: "Khăn tay và quạt",
                time: 10
            },
            {
                content: "Số tự nhiên nhỏ nhất có 3 chữ số khác nhau là số nào?",
                answer: "102",
                time: 10
            },
            {
                content: "Thành phố nào là thủ đô của nước Úc?",
                answer: "Canberra",
                time: 15
            },
            {
                content: "Loại hình nghệ thuật sân khấu dân gian nào được UNESCO công nhận là di sản văn hóa phi vật thể của nhân loại (2009)?",
                answer: "Quan họ Bắc Ninh",
                time: 15
            },
            {
                content: "Ai là người đầu tiên đặt chân lên mặt trăng?",
                answer: "Neil Armstrong",
                time: 15
            }
        ];

        this.contestants = [
            { id: 1, name: "Trân Châu", score: 0, active: false },
            { id: 2, name: "Thanh Tâm", score: 0, active: false },
            { id: 3, name: "Minh Khánh", score: 0, active: false },
            { id: 4, name: "Nguyên Anh", score: 0, active: false }
        ];

        this.currentQuestionIndex = 0;
        this.timerValue = 15;
        this.timerInterval = null;
        this.isTimerRunning = false;
        this.buzzerLocked = false;
        this.audioContext = null;

        this.ui = {
            questionText: document.querySelector('#question-text'),
            questionImage: document.querySelector('#question-image'),
            questionIndex: document.querySelector('.q_idx'),
            questionTotal: document.querySelector('.q_total'),
            timerDisplay: document.querySelector('.tl_time'),
            contestants: document.querySelectorAll('.contestant'),
            buzzerStatus: document.querySelector('#buzzer-status'),
            gradingBtns: document.querySelector('.grading-btns'),

            btnPrev: document.getElementById('btn-prev'),
            btnNext: document.getElementById('btn-next'),
            btnStartTimer: document.getElementById('btn-timer'),
            btnShowAnswer: document.getElementById('btn-answer'),
            btnResetBuzzer: document.getElementById('btn-reset-buzzer'),
            btnCorrect: document.getElementById('btn-correct'),
            btnWrong: document.getElementById('btn-wrong')
        };

        this.currentContestantId = null;

        this.sounds = {
            buzzer: new Audio('sounds/buzzer.ogg'),
            correct: new Audio('sounds/correct.ogg'),
            wrong: new Audio('sounds/wrong.ogg'),
            timeout: new Audio('sounds/timeout.ogg'),
            timer: new Audio('sounds/timeout.ogg')
        };

        this.init();
    }

    init() {
        this.renderQuestion();
        this.renderContestants();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.ui.questionTotal.textContent = this.questions.length;
    }

    renderQuestion() {
        const currentQ = this.questions[this.currentQuestionIndex];
        this.ui.questionText.textContent = currentQ.content;
        this.ui.questionIndex.textContent = this.currentQuestionIndex + 1;

        if (currentQ.image) {
            this.ui.questionImage.style.display = 'flex';
            this.ui.questionImage.querySelector('img').src = currentQ.image;
        } else {
            this.ui.questionImage.style.display = 'none';
        }

        this.timerValue = currentQ.time;
        this.updateTimerDisplay();
        this.ui.questionText.classList.remove('reveal');
        this.resetBuzzerState();
    }

    renderContestants() {
        const sortedContestants = [...this.contestants].sort((a, b) => b.score - a.score);

        this.contestants.forEach((contestant, index) => {
            const el = this.ui.contestants[index];
            el.querySelector('.name').textContent = contestant.name;
            el.querySelector('.point').textContent = contestant.score;

            const wasActive = el.classList.contains('buzzer');
            const isActive = contestant.active;

            if (isActive !== wasActive) {
                if (isActive) el.classList.add('buzzer');
                else el.classList.remove('buzzer');
            }

            const rank = sortedContestants.findIndex(c => c.id === contestant.id);
            el.style.transform = `translateY(${rank * 85}px)`;
            el.style.zIndex = isActive ? 100 : 1;
        });
    }

    updateTimerDisplay() {
        this.ui.timerDisplay.textContent = this.timerValue;
    }

    startTimer() {
        if (this.isTimerRunning) {
            clearInterval(this.timerInterval);
            this.isTimerRunning = false;
            this.ui.btnStartTimer.innerHTML = '<i class="fas fa-play"></i>';
            return;
        }

        if (this.timerValue <= 0) return;

        this.isTimerRunning = true;
        this.ui.btnStartTimer.innerHTML = '<i class="fas fa-pause"></i>';

        if (this.buzzerLocked && !this.currentContestantId) {
            this.setBuzzerListening();
        }

        this.timerInterval = setInterval(() => {
            this.timerValue--;
            this.updateTimerDisplay();

            if (this.timerValue <= 0) {
                this.stopTimer();
                this.playSound('timeout');
                this.lockBuzzer();
                this.showAnswer();
            }
        }, 1000);
    }

    stopTimer() {
        clearInterval(this.timerInterval);
        this.isTimerRunning = false;
        this.ui.btnStartTimer.innerHTML = '<i class="fas fa-play"></i>';
    }

    toggleAnswer() {
        const currentQ = this.questions[this.currentQuestionIndex];
        if (this.ui.questionText.innerHTML.includes('ĐÁP ÁN:')) {

            this.ui.questionText.textContent = currentQ.content;
        } else {
            this.showAnswer();
        }
    }

    showAnswer() {
        const currentQ = this.questions[this.currentQuestionIndex];
        if (!this.ui.questionText.innerHTML.includes('ĐÁP ÁN:')) {
            this.ui.questionText.innerHTML = `${currentQ.content}<br><br><strong style="color: #2e7d32; display: block; margin-top: 10px;">ĐÁP ÁN: ${currentQ.answer}</strong>`;
        }
    }

    handleBuzzer(contestantId) {
        if (this.buzzerLocked) return;

        this.buzzerLocked = true;
        this.currentContestantId = contestantId;
        this.contestants.forEach(c => c.active = (c.id === contestantId));
        this.renderContestants();

        const winner = this.contestants.find(c => c.id === contestantId);
        this.ui.buzzerStatus.textContent = `${winner.name} giành quyền!`;
        this.ui.buzzerStatus.className = 'buzzer_btn active';
        this.ui.gradingBtns.style.display = 'flex';

        this.stopTimer();
        this.playSound('buzzer');

        this.ui.questionText.parentElement.scrollTop = this.ui.questionText.parentElement.scrollHeight;
    }

    setBuzzerListening() {
        this.buzzerLocked = false;
        this.currentContestantId = null;
        this.ui.buzzerStatus.textContent = 'Mời trả lời';
        this.ui.buzzerStatus.className = 'buzzer_btn listening';
    }

    lockBuzzer() {
        this.buzzerLocked = true;
        this.ui.buzzerStatus.textContent = 'Hết giờ / Khóa';
        this.ui.buzzerStatus.className = 'buzzer_btn locked';
    }

    resetBuzzerState() {
        this.buzzerLocked = true;
        this.currentContestantId = null;
        this.contestants.forEach(c => c.active = false);
        this.renderContestants();
        this.ui.buzzerStatus.textContent = 'Chuẩn bị';
        this.ui.buzzerStatus.className = 'buzzer_btn locked';
        this.ui.gradingBtns.style.display = 'none';

        this.stopTimer();
    }

    gradeAnswer(isCorrect) {
        if (!this.currentContestantId) return;

        const idx = this.contestants.findIndex(c => c.id === this.currentContestantId);
        if (idx === -1) return;

        const points = isCorrect ? 10 : -5;
        this.contestants[idx].score += points;
        this.renderContestants();

        this.resetBuzzerState();
        this.showAnswer();

        if (isCorrect) this.playSound('correct');
        else this.playSound('wrong');
    }

    changeScore(contestantIndex) {
        let newScore = prompt(`Nhập điểm mới cho ${this.contestants[contestantIndex].name}:`, this.contestants[contestantIndex].score);
        if (newScore !== null && !isNaN(newScore)) {
            this.contestants[contestantIndex].score = parseInt(newScore);
            this.renderContestants();
        }
    }

    playSound(type) {
        if (this.sounds[type]) {
            this.sounds[type].currentTime = 0;
            this.sounds[type].play().catch(e => console.log("Audio play failed interaction required"));
        }
    }

    setupEventListeners() {
        this.ui.btnPrev.addEventListener('click', () => {
            if (this.currentQuestionIndex > 0) {
                this.currentQuestionIndex--;
                this.renderQuestion();
            }
        });

        this.ui.btnNext.addEventListener('click', () => {
            if (this.currentQuestionIndex < this.questions.length - 1) {
                this.currentQuestionIndex++;
                this.renderQuestion();
            }
        });

        this.ui.btnStartTimer.addEventListener('click', () => this.startTimer());
        this.ui.btnShowAnswer.addEventListener('click', () => this.toggleAnswer());
        this.ui.btnResetBuzzer.addEventListener('click', () => this.resetBuzzerState());

        this.ui.btnCorrect.addEventListener('click', () => this.gradeAnswer(true));
        this.ui.btnWrong.addEventListener('click', () => this.gradeAnswer(false));
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (['1', '2', '3', '4'].includes(e.key)) {
                this.handleBuzzer(parseInt(e.key));
            }
            if (e.code === 'Space') {
                e.preventDefault();
                this.startTimer();
            }
            if (e.key === 'ArrowRight') this.ui.btnNext.click();
            if (e.key === 'ArrowLeft') this.ui.btnPrev.click();
            if (e.key.toLowerCase() === 'r') this.resetBuzzerState();
            if (e.key.toLowerCase() === 'a') this.toggleAnswer();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new OlympiaGame();
});

(function () {
    'use strict';

    const COLS = 20;
    const ROWS = 20;
    const CELL = 20; // pixels per grid cell
    const CANVAS_W = COLS * CELL;
    const CANVAS_H = ROWS * CELL;

    const SPEEDS = {
        initial: 150,   // ms per frame
        min: 60,        // fastest allowed
        decrement: 5    // speed up every apple eaten
    };

    const DIR = {
        UP:    { x:  0, y: -1 },
        DOWN:  { x:  0, y:  1 },
        LEFT:  { x: -1, y:  0 },
        RIGHT: { x:  1, y:  0 }
    };

    const KEY_MAP = {
        ArrowUp:    DIR.UP,
        ArrowDown:  DIR.DOWN,
        ArrowLeft:  DIR.LEFT,
        ArrowRight: DIR.RIGHT
    };

    // ── DOM refs ──────────────────────────────────────────────────────────────
    const canvas    = document.getElementById('gameCanvas');
    const ctx       = canvas.getContext('2d');
    const overlay   = document.getElementById('overlay');
    const overlayH2 = document.getElementById('overlayTitle');
    const overlayMsg= document.getElementById('overlayMsg');
    const finalScore= document.getElementById('finalScore');
    const startBtn  = document.getElementById('startBtn');
    const scoreEl   = document.getElementById('score');
    const highEl    = document.getElementById('highScore');

    canvas.width  = CANVAS_W;
    canvas.height = CANVAS_H;

    // ── State ─────────────────────────────────────────────────────────────────
    let snake, dir, nextDir, food, interval, running;

    let highScore = 0;
    let score = 0;

    // ── Init / Reset ──────────────────────────────────────────────────────────
    function initGame() {
        const midX = Math.floor(COLS / 2);
        const midY = Math.floor(ROWS / 2);
        snake   = [
            { x: midX,     y: midY },
            { x: midX - 1, y: midY },
            { x: midX - 2, y: midY }
        ];
        dir     = DIR.RIGHT;
        nextDir = DIR.RIGHT;
        score   = 0;
        updateScoreDisplay();
        placeFood();
    }

    // ── Food placement ────────────────────────────────────────────────────────
    function placeFood() {
        let pos;
        do {
            pos = {
                x: Math.floor(Math.random() * COLS),
                y: Math.floor(Math.random() * ROWS)
            };
        } while (snake.some(seg => seg.x === pos.x && seg.y === pos.y));
        food = pos;
    }

    // ── Game loop ─────────────────────────────────────────────────────────────
    function startLoop(speed) {
        clearInterval(interval);
        interval = setInterval(tick, speed);
    }

    function tick() {
        dir = nextDir;

        const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

        // Wall collision
        if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
            return endGame();
        }

        // Self collision
        if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
            return endGame();
        }

        snake.unshift(head);

        // Food eaten
        if (head.x === food.x && head.y === food.y) {
            score++;
            if (score > highScore) {
                highScore++;
            }
            if (score < highScore) highScore = highScore;
            updateScoreDisplay();
            placeFood();
            // Speed up slightly
            const newSpeed = Math.max(SPEEDS.min, SPEEDS.initial - score * SPEEDS.decrement);
            startLoop(newSpeed);
        } else {
            snake.pop();
        }

        draw();
    }

    // ── Drawing ───────────────────────────────────────────────────────────────
    function draw() {
        // Background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Optional subtle grid
        ctx.strokeStyle = 'rgba(0, 80, 0, 0.25)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= COLS; x++) {
            ctx.beginPath();
            ctx.moveTo(x * CELL, 0);
            ctx.lineTo(x * CELL, CANVAS_H);
            ctx.stroke();
        }
        for (let y = 0; y <= ROWS; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * CELL);
            ctx.lineTo(CANVAS_W, y * CELL);
            ctx.stroke();
        }

        // Food (bright red square with glow)
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur  = 8;
        ctx.fillStyle   = '#ff2222';
        ctx.fillRect(
            food.x * CELL + 2,
            food.y * CELL + 2,
            CELL - 4,
            CELL - 4
        );
        ctx.shadowBlur = 0;

        // Snake body
        snake.forEach((seg, i) => {
            const isHead = i === 0;
            ctx.shadowColor = '#00ff00';
            ctx.shadowBlur  = isHead ? 12 : 4;
            ctx.fillStyle   = isHead ? '#00ff00' : '#00cc00';
            ctx.fillRect(
                seg.x * CELL + 1,
                seg.y * CELL + 1,
                CELL - 2,
                CELL - 2
            );
        });
        ctx.shadowBlur = 0;
    }

    // ── Score display ─────────────────────────────────────────────────────────
    function updateScoreDisplay() {
        scoreEl.textContent = 'SCORE: ' + score;
        highEl.textContent  = 'BEST: '  + highScore;
    }

    // ── Game over ─────────────────────────────────────────────────────────────
    function endGame() {
        clearInterval(interval);
        running = false;
        overlayH2.textContent  = 'GAME OVER';
        overlayMsg.textContent = '';
        finalScore.textContent = 'Score: ' + score;
        startBtn.textContent   = 'PLAY AGAIN';
        overlay.style.display  = 'flex';
    }

    // ── Start / Restart ───────────────────────────────────────────────────────
    function startGame() {
        overlay.style.display = 'none';
        initGame();
        draw();
        running = true;
        startLoop(SPEEDS.initial);
    }

    // ── Input ─────────────────────────────────────────────────────────────────
    document.addEventListener('keydown', function (e) {
        const newDir = KEY_MAP[e.key];
        if (!newDir) return;

        // Prevent page scrolling with arrow keys
        e.preventDefault();

        if (!running) return;

        // Prevent reversing directly into self
        if (newDir.x === -dir.x && newDir.y === -dir.y) return;

        nextDir = newDir;
    });

    startBtn.addEventListener('click', startGame);

    // ── Initial draw (show title screen behind overlay) ───────────────────────
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    updateScoreDisplay();

})();

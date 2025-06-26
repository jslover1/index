const canvas = document.querySelector("canvas");
canvas.width = 400;
canvas.height = 400;
const ctx = canvas.getContext("2d");

class Timer {
    constructor() {
        this.startTime = Date.now();
    }

    getElapsedTime() {
        return (Date.now() - this.startTime) / 1000;
    }

    reset() {
        this.startTime = Date.now();
    }
}

class Texture {
    constructor(imageSrc) {
        this.image = new Image();
        this.image.src = imageSrc;
        this.image.onload = () => {
            this.loaded = true;
        };
        this.loaded = false;
    }

    _draw(x, y, width, height) {
        if (this.loaded) {
            ctx.drawImage(this.image, x, y, width, height);
        }
    }

    render(x, y, width, height, angle = 0) {
        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);
        ctx.rotate(angle);
        ctx.drawImage(this.image, -width / 2, -height / 2, width, height);
        ctx.restore();
    }
}

class Snake {
    constructor() {
        this._size = 20;
        this.timer = new Timer();
        this.direction = { x: 0, y: 0 };

        this.rewardAmount = 0;
        this.health = 3;

        this._headTexture = new Texture("head.png");
        this._bodyTexture = new Texture("body.png");
        this._tailTexture = new Texture("tail.png");
        this._foodTexture = new Texture("coin.png");
        this._jomanTrapTexture = new Texture("trap.png");

        this.foodPosition = { x: 4, y: 4 };
        this.trapPosition = { x: -4, y: 4 };

        this._onHold = false;

        this.body = [
            { x: 0, y: -3 },
            { x: 0, y: -2 },
            { x: 0, y: -1 },
        ];
    }

    _getCanvasCoordinates(x, y) {
        return {
            x: 200 + x * this._size,
            y: 200 - y * this._size,
        };
    }

    moveForward() {
        if (this.direction.x === 0 && this.direction.y === 0) {
            return;
        }

        const head = this.body[this.body.length - 1];

        for (let i = 0; i < this.body.length - 1; i++) {
            this.body[i] = { ...this.body[i + 1] };
        }
        this.body[this.body.length - 1] = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y,
        };
    }

    _checkCollisionWithBody(x, y, body) {
        let i;

        for (i = 0; i < body.length; i++) {
            if (Math.abs(body[i].x - x) < 2 && Math.abs(body[i].y - y) < 2) {
                break;
            }
        }

        if (i === body.length) {
            return false;
        }
        return true;
    }

    _getRandomPositionOutsideBody(_body) {
        let position = { x: 0, y: 0 };

        let attempts = 0;

        while (attempts < 100) {
            position = {
                x: Math.floor(Math.random() * 16) - 8,
                y: Math.floor(Math.random() * 16) - 8,
            };

            if (!this._checkCollisionWithBody(position.x, position.y, _body)) {
                return position;
            }

            attempts++;
        }

        return position;
    }

    _invokeGameOverScreen() {
        this.direction = { x: 0, y: 0 };
        this._onHold = true;
        playAudioFromFile("gameover.mp3");
    }

    _decreaseHealth() {
        this.health--;
        const imgs = document.querySelectorAll(".health-bar img");
        for (let i = 0; i < 3; i++) {
            if (i >= this.health) {
                imgs[i].style.display = "none";
            }
        }
        if (this.health <= 0) {
            this._invokeGameOverScreen();
        }
        else {
            this.trapPosition = this._getRandomPositionOutsideBody([
                ...this.body,
                this.foodPosition,
            ]);
        }
    }

    update() {
        this.render();
        if (this._onHold) {
            return;
        }
        const dt = this.timer.getElapsedTime();
        if (dt > 0.1) {
            this.moveForward();
            this.timer.reset();
        }

        let headPosition = this.body[this.body.length - 1];

        if (
            this._checkCollisionWithBody(headPosition.x, headPosition.y, [
                this.foodPosition,
            ])
        ) {
            this.body.push({ ...headPosition });
            this.foodPosition = this._getRandomPositionOutsideBody(this.body);
            this.trapPosition = this._getRandomPositionOutsideBody([
                ...this.body,
                this.foodPosition,
            ]);

            this.rewardAmount += 200;
            document.getElementById("amount").innerText = this.rewardAmount;
            playAudioFromFile("t3amwlma.mp3");
        }

        let i;

        for (i = 0; i < this.body.length - 2; i++) {
            if (
                this.body[i].x === headPosition.x &&
                this.body[i].y === headPosition.y
            ) {
                this._invokeGameOverScreen();
            }
        }

        if (headPosition.x < -9 || headPosition.x > 9 ||
            headPosition.y < -9 || headPosition.y > 9) {
            this._invokeGameOverScreen();
        }

        if (
            this._checkCollisionWithBody(headPosition.x, headPosition.y, [
                this.trapPosition,
            ])
        ) {
            this._decreaseHealth();
        }
    }

    render() {
        const foodPos = this._getCanvasCoordinates(
            this.foodPosition.x,
            this.foodPosition.y
        );

        this._foodTexture.render(foodPos.x - 10, foodPos.y - 10, 40, 40);

        const trapPos = this._getCanvasCoordinates(
            this.trapPosition.x,
            this.trapPosition.y
        );

        this._jomanTrapTexture.render(trapPos.x - 10, trapPos.y - 10, 40, 40);

        const tail = this.body[0];
        const { x: tailX, y: tailY } = this._getCanvasCoordinates(
            tail.x,
            tail.y
        );

        let v = {
            x: this.body[1].x - tail.x,
            y: this.body[1].y - tail.y,
        };

        this._tailTexture.render(
            tailX - 6,
            tailY - 6,
            30,
            30,
            Math.atan2(v.x, v.y)
        );

        for (let i = 1; i < this.body.length - 1; i++) {
            let v = {
                x: this.body[i + 1].x - this.body[i - 1].x,
                y: this.body[i + 1].y - this.body[i - 1].y,
            };

            const segment = this.body[i];
            const { x, y } = this._getCanvasCoordinates(segment.x, segment.y);
            // ctx.fillRect(x, y, this._size, this._size);
            this._bodyTexture.render(
                x - 6,
                y - 6,
                30,
                30,
                Math.atan2(v.x, v.y)
            );
        }

        const head = this.body[this.body.length - 1];
        const { x, y } = this._getCanvasCoordinates(head.x, head.y);
        // ctx.fillStyle = "red";
        // ctx.fillRect(x, y, this._size, this._size);
        this._headTexture.render(
            x - 10,
            y - 10,
            40,
            40,
            Math.atan2(this.direction.x, this.direction.y)
        );
    }
}

const playAudioFromFile = (src) => {
    const audio = new Audio(src);
    audio.play().catch((error) => {
        console.error("Error playing audio:", error);
    });
}

let snake = new Snake();

window.addEventListener("keydown", (event) => {
    switch (event.key) {
        case "d":
            if (snake.direction.x !== -1) snake.direction = { x: 1, y: 0 };
            break;
        case "a":
            if (snake.direction.x !== 1) snake.direction = { x: -1, y: 0 };
            break;
        case "w":
            if (snake.direction.y !== -1) snake.direction = { x: 0, y: 1 };
            break;
        case "s":
            if (snake.direction.y !== 1) snake.direction = { x: 0, y: -1 };
            break;
    }
});

document.getElementById("w-button").addEventListener("click", () => {
    if (snake.direction.y !== -1) snake.direction = { x: 0, y: 1 };
});

document.getElementById("a-button").addEventListener("click", () => {
    if (snake.direction.x !== 1) snake.direction = { x: -1, y: 0 };
});

document.getElementById("s-button").addEventListener("click", () => {
    if (snake.direction.y !== 1) snake.direction = { x: 0, y: -1 };
});

document.getElementById("d-button").addEventListener("click", () => {
    if (snake.direction.x !== -1) snake.direction = { x: 1, y: 0 };
});

document.getElementById("play-button").addEventListener("click", () => {
    snake = new Snake();
    document.getElementById("amount").innerText = "0";
    const imgs = document.querySelectorAll(".health-bar img");
    imgs.forEach((img) => {
        img.style.display = "";
    });
    snake.direction = { x: 0, y: 1 };
});

const animate = () => {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    snake.update();
};

animate();

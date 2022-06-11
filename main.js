import game from "./engine.js";
import {
    PhysicalObject
} from "./engine.js";

function rounding(position) {
    if (position.x < 0) position.x = 0;
    if (position.y < 0) position.y = 0;
    if (position.x > 640) position.x = 640;
    if (position.y > 480) position.y = 480;
}

class Explosion {
    constructor(position) {
        this.position = position;
        this.t = 0;
        this.SIZE = Math.random()*32;
    }

    live() {
        this.t++;
        if (this.t > 20)
            objects.delete(this);
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(255, 0, 0, 0.2)`;
        ctx.circle(this.position.x, this.position.y, this.SIZE * Math.sin(this.t / 5));
        ctx.fill();
    }
}


class Beam extends PhysicalObject {
    constructor(x, y, angle) {
        const SPEED = 8;
        super(x, y, SPEED * Math.cos(angle), SPEED * Math.sin(angle));
        this.t = 60;
    }

    live() {
        super.live();
        this.t--;
        if (this.t <= 0)
            objects.delete(this);
    }

    draw(ctx) {
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 3;
        ctx.circle(this.position.x, this.position.y, 1);
        ctx.stroke();
    }
}


class PlayerBeam extends Beam {}
class EnnemyBeam extends Beam {}

const STEP = 0.05;
const SPEED = 4;

class Arrow {
    constructor() {
        this.position = {
            x: Math.random() * 640,
            y: Math.random() * 480
        };
        this.angle = 0;
        this.color = "#0055FF";
        this.counterFire = 0;
    }

    left() {
        this.angle -= STEP;
    }

    right() {
        this.angle += STEP;
    }

    move() {
        this.position = {
            x: this.position.x + SPEED * Math.cos(this.angle),
            y: this.position.y + SPEED * Math.sin(this.angle)
        };
        rounding(this.position);
    }


    moveBack() {
        this.position = {
            x: this.position.x - SPEED * Math.cos(this.angle),
            y: this.position.y - SPEED * Math.sin(this.angle)
        };
        rounding(this.position);
    }

    shoot() {
        objects.add(new PlayerBeam(this.position.x, this.position.y, this.angle));
    }

    live() {
        this.counterFire++;
        if (this.counterFire > 10)
            this.counterFire = 0;
    }

    draw(ctx) {
        ctx.lineWidth = 5;
        ctx.strokeStyle = this.color;
        const A = 0.3 + Math.cos(game.time() / 40) * 0.05;
        const S = 16;
        ctx.arrow(this.position.x, this.position.y, this.angle, S, A);
        ctx.stroke();


    }
}


class Player extends Arrow {
    live() {
        super.live();
        if (game.keys["ArrowLeft"])
            this.left();
        if (game.keys["ArrowRight"])
            this.right();
        if (game.keys["ArrowUp"])
            this.move();
        if (game.keys[' '] && this.counterFire == 0)
            this.shoot();
        if (game.keys["ArrowDown"])
            this.moveBack();
    }

    shoot() {
        objects.add(new PlayerBeam(this.position.x, this.position.y, this.angle));
    }
}


class Enemy extends Arrow {
    constructor() {
        super();
        this.color = "#888888";
        this.turnDirection = 1;
        this.isMoving = false;
    }


    shoot() {
        objects.add(new EnnemyBeam(this.position.x, this.position.y, this.angle));
    }


    live() {
        super.live();
        let dx = this.position.x - player.position.x;
        let dy = this.position.y - player.position.y;

        const relangle = this.angle - Math.atan2(-dy, -dx);
        if (Math.abs(relangle) < 0.1 && this.counterFire == 0)
            this.shoot();

        if (this.isMoving)
            this.move();

        if (Math.random() < 0.1)
            this.isMoving = !this.isMoving;
        if (Math.random() < 0.1)
            this.turnDirection = relangle > 0 ? 1 : -1;
        if (Math.random() < 0.1)
            this.turnDirection = 0;

        this.angle -= this.turnDirection * STEP;

        this.angle = this.angle % (2 * Math.PI);
        if (this.angle > Math.PI)
            this.angle = this.angle - 2 * Math.PI;

        if (this.angle < -Math.PI)
            this.angle = this.angle + 2 * Math.PI;
    }
}

const objects = new Set();
const player = new Player();
objects.add(player);

for (let i = 0; i < 3; i++)
    objects.add(new Enemy());

const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

let score = 0;
let life = 100;

const initialTime = 100;

const time = () => initialTime - Math.floor(game.time() / 1000);

setInterval(() => objects.add(new Enemy()), 2000);

function interactionBetweenObjects() {
    for (const p of objects)
        for (const b of objects)
            if (dist(p.position, b.position) < 16) {
                if (p instanceof Enemy && b instanceof PlayerBeam) {
                    objects.delete(p);
                    score += 1;
                    objects.add(new Explosion(p.position));
                }
                if (p instanceof Player && b instanceof EnnemyBeam) {
                    objects.delete(b);
                    objects.add(new Explosion(p.position));
                    life -= 1;
                }
                if (p instanceof Player && b instanceof Enemy) {
                    objects.delete(b);
                    objects.add(new Explosion(p.position));
                    life -= 20;
                }
            }
}


function drawScoreAndTime(ctx) {
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText("time: " + Math.max(0, time()), 640 - 300, 16);
    ctx.fillText("score: " + score, 16, 16);
    ctx.fillText("life: " + life, 96, 16);
}

function drawGameOver(ctx) {
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText("Game Over", 240, 240);
    ctx.fillText("score: " + score, 280, 280);
}


function randInt(n) {
    return Math.round(Math.random() * n);
}

game.setBackground((ctx) => {
    ctx.fillStyle = "white";
    for (let i = 0; i < 300; i++)
        ctx.point(Math.random() * 640, Math.random() * 480);

    for (let i = 0; i < 3; i++) {
        ctx.fillStyle = `rgb(${randInt(128)}, ${randInt(128)}, ${randInt(128)})`;
        ctx.circle(Math.random() * 640, Math.random() * 480, Math.random() * 128);
        ctx.fill();
    }

});


game.draw = (ctx) => {
    ctx.clearRect(0, 0, 640, 480);

    if (time() >= 0 && life > 0) {
        for (const o of objects) o.live();
        interactionBetweenObjects();
    } else {
        life = 0;
        drawGameOver(ctx);
    }

    for (const o of objects) o.draw(ctx);
    drawScoreAndTime(ctx);
}
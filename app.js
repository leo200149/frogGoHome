
let width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
let height = (window.innerHeight > 0) ? window.innerHeight : screen.height;
let sizeUp = height / 250;
const CONFIGS = {
    WIDTH: width,
    HEIGHT: height,
    CENTER: width / 2,
    BOTTOM: height,
    BULLET_SIZE: 4 * sizeUp,
    ENEMY_SIZE: 10 * sizeUp,
    TARGET_SIZE: 100 * sizeUp,
    GUN_WIDTH: 5 * sizeUp,
    GUN_HEIGHT: 20 * sizeUp,
    GUN_TOP: 230 * sizeUp,
    GEN_ENEMY_MARGIN_LEFT: 150 * sizeUp,
    GEN_ENEMY_WIDTH: 200 * sizeUp,
    BULLET_SPEED: 1.5 * sizeUp,
    ENEMY_SPEED: 1 * sizeUp,
    SCORE_BOARD_POSITION:{x: 0 , y: 40 * sizeUp ,height:25*sizeUp},
    SCORE_POSITION: { x: width / 2 , y: 40 * sizeUp },
    WAIT_START_POSITION: { x: width / 2, y: height / 2 },
    GAME_OVER_POSITION: { x: width / 2, y: height / 2},
    OVER_SCORE_POSITION: { x: width / 2, y: height / 2+20*sizeUp },
    TARGET_POSITION: { x: 0, y: 0 },
    ENEMY_POSITION: { x: width / 2, startY: 60 * sizeUp, interval: 45 * sizeUp, count: 3, limit: 70 * sizeUp, randLimit: 50 * sizeUp },
    GEN_ENEMY_SPEED: 150,
    SHOOT_SPEED: 300,
    FPS: 60,
    GAME_TME: 0,
};

const tools = function () {
    const instance = {
        getRandomT: function () {
            let t = Math.random() * 3;
            return Math.random() * 10 >= 5 ? t : -t;
        },
        setInterval: function (f, time, fin) {
            setTimeout(() => {
                f();
                if (!fin()) {
                    instance.setInterval(f, time, fin);
                }
            }, time);
        },
        onTouch: function (evt) {
            evt.preventDefault();
            if (evt.touches.length > 1 || (evt.type == "touchend" && evt.touches.length > 0))
                return;
            var newEvt = document.createEvent("MouseEvents");
            var type = null;
            var touch = null;
            switch (evt.type) {
                case "touchstart":
                    type = "mousedown";
                    touch = evt.changedTouches[0];
                    break;
                case "touchmove":
                    type = "mousemove";
                    touch = evt.changedTouches[0];
                    break;
                case "touchend":
                    type = "mouseup";
                    touch = evt.changedTouches[0];
                    break;
            }
            newEvt.initMouseEvent(type, true, true, evt.target.ownerDocument.defaultView, 0,
                touch.screenX, touch.screenY, touch.clientX, touch.clientY,
                evt.ctrlKey, evt.altKey, evt.shiftKey, evt.metaKey, 0, null);
            evt.target.dispatchEvent(newEvt);
        }
    };
    return instance;
}();


// 直接拿現成的效果來放
const hitEffect = function () {
    const balls = [];
    //创建对象
    function ball() {
        this.x = null;
        this.y = null;
        this.color = null;
        this.r = null;
        this.angle = null;//小球偏移量
        this.anglex = null;
        this.angley = null;
        //初始状态的小球
        this.int = function (X, Y) {
            this.x = X;
            this.y = Y;
            this.color = this.randomcolor();
            this.r = this.randomR(5, 10);
            this.angle = Math.random() * (Math.PI * 2);
            this.anglex = this.randomR(1, 3) * Math.cos(this.angle);
            this.angley = this.randomR(1, 3) * Math.sin(this.angle);
        }
        //随机颜色
        this.randomcolor = function () {
            return "#acdffce3";
        }
        //随机数字 可控制半径或xy移动量
        this.randomR = function (min, max) {
            return Math.random() * max + min;
        }
        //小球的运动及偏移量
        this.move = function () {
            this.x += this.anglex;
            this.y += this.angley;
            this.r -= 0.1;
            this.anglex *= 0.97;
            this.angley *= 0.97;
        }

    }
    //创建小球
    function createball(X, Y) {
        var count = parseInt(Math.random() * 30 + 20);
        for (var i = 0; i < count; i++) {
            var Ball = new ball();
            Ball.int(X, Y);
            balls.push(Ball);
        }
    }
    //在canvas上绘制小球
    function draw(ctx) {
        for (var i = 0; i < balls.length; i++) {
            var b = balls[i];
            b.move();
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2, true);
            ctx.fillStyle = b.color;
            ctx.fill();
            ctx.closePath();
        }
        remove();
    }
    //移除小球
    function remove() {
        for (var i = 0; i < balls.length; i++) {
            var b = balls[i];
            if (b.r < 0.3) {
                balls.splice(i, 1);
                i--;
            }
        }
    }
    return {
        createBall: createball,
        draw: draw,
    }
}();

const UIController = function (tools,hitEffect) {
    var model;
    var modelStart = false;
    const canvas = document.getElementById('board');
    const ctx = canvas.getContext('2d');
    const bulletImg = document.getElementById('bullet');
    const targetImg = document.getElementById('target');
    const gunImg = document.getElementById('gun');
    const scoreImg = document.getElementById('score_board');

    canvas.width = width;
    canvas.height = height;
    const instance = {
        draw: function () {
            instance.cleanCanvas();
            if (model != null) {
                instance.paintWaitStart(model.first());
                instance.paintGun(model.first());
                instance.paintTarget(model.target());
                instance.paintEnemys(model.enemys());
                instance.paintBullets(model.bullets());
                instance.paintEffect();
                instance.paintScore(model.first(),model.gameOver(), model.score());
                instance.checkModelState();
            }
        },
        checkModelState: function () {
            if (model.gameOver()) {
                instance.paintGameOver();
                modelStart = false;
            }
        },
        cleanCanvas: function () {
            ctx.fillStyle = "green";
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        },
        paintEffect:function(){
            hitEffect.draw(ctx);
        },
        paintWaitStart: function (first) {
            if (!first) {
                return
            }
            ctx.font = "42px monospace";
            ctx.fillStyle = "white";
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.drawImage(scoreImg, 0, CONFIGS.SCORE_BOARD_POSITION.y, width, width);
            ctx.fillText("點擊開始", CONFIGS.WAIT_START_POSITION.x, CONFIGS.WAIT_START_POSITION.y);
        },
        paintScore: function (first,over, score) {
            if (first||over) {
                return
            }
            ctx.font = "84px monospace";
            ctx.fillStyle = "white";
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.fillText(score, CONFIGS.SCORE_POSITION.x, CONFIGS.SCORE_POSITION.y);
        },
        paintGameOver() {
            ctx.font = "64px monospace";
            ctx.fillStyle = "white";
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.drawImage(scoreImg, 0, CONFIGS.SCORE_BOARD_POSITION.y, width, width);
            ctx.fillText('成功回家', CONFIGS.GAME_OVER_POSITION.x, CONFIGS.GAME_OVER_POSITION.y);
            ctx.font = "36px monospace";
            ctx.fillText("青蛙"+model.score()+"隻", CONFIGS.OVER_SCORE_POSITION.x, CONFIGS.OVER_SCORE_POSITION.y);
        },
        paintGun: function (first) {
            if (first) {
                return
            }
            // ctx.beginPath();
            // ctx.moveTo(CONFIGS.CENTER - CONFIGS.GUN_WIDTH, CONFIGS.BOTTOM);
            // ctx.lineTo(CONFIGS.CENTER, CONFIGS.GUN_TOP);
            // ctx.lineTo(CONFIGS.CENTER + CONFIGS.GUN_WIDTH, CONFIGS.BOTTOM);
            // ctx.fillStyle = CONFIGS.ITEM_COLOR;
            // ctx.fill();
            ctx.drawImage(gunImg, CONFIGS.CENTER - CONFIGS.BULLET_SIZE*4, CONFIGS.GUN_TOP, CONFIGS.BULLET_SIZE * 8, CONFIGS.BULLET_SIZE * 8);
            ctx.drawImage(bulletImg, CONFIGS.CENTER - CONFIGS.BULLET_SIZE*2, CONFIGS.GUN_TOP, CONFIGS.BULLET_SIZE * 4, CONFIGS.BULLET_SIZE * 4);
        },
        paintBullet: function (x, y) {
            //   let ctx = canvas.getContext('2d');
            //   ctx.fillStyle = CONFIGS.ITEM_COLOR;
            //   ctx.fillRect(x-CONFIGS.BULLET_SIZE, y, CONFIGS.BULLET_SIZE*2 , CONFIGS.BULLET_SIZE*4);
            //   ctx.beginPath();
            let ctx = canvas.getContext('2d');
            ctx.drawImage(bulletImg, x - CONFIGS.BULLET_SIZE*2, y, CONFIGS.BULLET_SIZE * 4, CONFIGS.BULLET_SIZE * 4);
        },
        paintBullets: function (bullets) {
            for (let i in bullets) {
                let bullet = bullets[i];
                instance.paintBullet(bullet.x, bullet.y);
            }
        },
        paintEnemy: function (target) {
            let x = target.x, y = target.y, color = target.color;
            let ctx = canvas.getContext('2d');
            ctx.fillStyle = color;
            ctx.fillRect(CONFIGS.CENTER + x, y, CONFIGS.ENEMY_SIZE * 7, CONFIGS.ENEMY_SIZE);
            ctx.beginPath();
            ctx.strokeStyle = 'black';
            ctx.rect(CONFIGS.CENTER + x, y, CONFIGS.ENEMY_SIZE * 7, CONFIGS.ENEMY_SIZE);
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.fillRect(CONFIGS.CENTER - CONFIGS.ENEMY_SIZE * 7 - x, y, CONFIGS.ENEMY_SIZE * 7, CONFIGS.ENEMY_SIZE);
            ctx.beginPath();
            ctx.strokeStyle = 'black';
            ctx.rect(CONFIGS.CENTER - CONFIGS.ENEMY_SIZE * 7 - x, y, CONFIGS.ENEMY_SIZE * 7, CONFIGS.ENEMY_SIZE);
            ctx.stroke();
        },
        paintEnemys: function (enemys) {
            for (let i in enemys) {
                let enemy = enemys[i];
                instance.paintEnemy(enemy);
            }
        },
        paintTarget: function (target) {
            let x = target.x, y = target.y, color = target.color;
            // let circle = new Path2D();
            // circle.arc(x, y, CONFIGS.TARGET_SIZE, 0, 2 * Math.PI);
            // circle.closePath();
            // ctx.fillStyle = color;
            // ctx.fill(circle);
            let ctx = canvas.getContext('2d');
            ctx.drawImage(targetImg, x, y, CONFIGS.WIDTH, CONFIGS.TARGET_SIZE);
        },
        bindEventListener: function () {
            let keepShoot = false;
            let currentE = null;
            canvas.addEventListener("mousedown", function (e) {
                if (!modelStart) {
                    modelStart = true;
                    model.start();
                }
                keepShoot = true;
                function shoot() {
                    if (keepShoot) {
                        model.newBullet(currentE);
                        setTimeout(shoot, CONFIGS.SHOOT_SPEED);
                    }
                }
                shoot();
            }, false);
            canvas.addEventListener("mousemove", function (e) {
                currentE = e;
            }, false);
            canvas.addEventListener("mouseup", function (e) {
                keepShoot = false;
            }, false);
            canvas.addEventListener("touchstart", tools.onTouch, false);
            canvas.addEventListener("touchmove", tools.onTouch, false);
            canvas.addEventListener("touchend", tools.onTouch, false);
        },
        start: function (dataController) {
            model = dataController;
            instance.bindEventListener();
            setInterval(instance.draw, 1000 / CONFIGS.FPS);
        }
    };
    return instance;
}(tools,hitEffect);

var DataController = function (tools,hitEffect) {
    let score = 0;
    let time = CONFIGS.GAME_TME;
    let target = {};
    let enemys = [];
    let bullets = [];
    let gameOver = false;
    let first = true;
    let nextPlayTime = 0;
    const instance = {
        score: function () {
            return score;
        },
        time: function () {
            return time;
        },
        bullets: function () {
            return bullets;
        },
        enemys: function () {
            return enemys;
        },
        gameOver: function () {
            return gameOver;
        },
        target: function () {
            return target;
        },
        first: function () {
            return first;
        },
        genEnemys: function () {
            for (let i = 1; i <= 3; i++) {
                let enemy = { x: 0, y: CONFIGS.ENEMY_POSITION.interval * i + CONFIGS.ENEMY_POSITION.startY, t: 1, speed: 1 };
                enemy.color = enemy.isStrong ? CONFIGS.STRONG_ENEMY_COLOR : CONFIGS.ENEMY_COLOR;
                enemy.health = enemy.isStrong ? 2 : 1;
                enemys.push(enemy);
            }
        },
        genTarget: function () {
            target = { x: CONFIGS.TARGET_POSITION.x, y: CONFIGS.TARGET_POSITION.y, t: 0, speed: 0, isStrong: true, health: 1 };
            target.color = target.isStrong ? CONFIGS.TARGET_COLOR : CONFIGS.TARGET_COLOR;
            target.health = target.isStrong ? 2 : 1;
        },
        moveEnemys: function () {
            for (let i in enemys) {
                let enemy = enemys[i];
                let move = CONFIGS.ENEMY_SPEED * Math.random();
                if (enemy.x >= CONFIGS.ENEMY_POSITION.limit + Math.random() * CONFIGS.ENEMY_POSITION.randLimit) {
                    enemy.back = true;
                } else if (enemy.x <= 0) {
                    enemy.back = false;
                }
                if (enemy.back) {
                    move = -move;
                }
                enemy.x += move;
            }
        },
        newBullet: function (e) {
            let t = Math.atan2(CONFIGS.GUN_TOP, CONFIGS.CENTER);
            let bullet = { x: CONFIGS.CENTER, y: CONFIGS.GUN_TOP, t: t };
            bullets.push(bullet);
        },
        moveBullets: function () {
            for (let i in bullets) {
                let bullet = bullets[i];
                bullet.x = bullet.x;
                bullet.y = bullet.y - CONFIGS.BULLET_SPEED * Math.sin(bullet.t);
            }
            let newBullets = [];
            for (let i in bullets) {
                let bullet = bullets[i];
                if (bullet.x >= CONFIGS.WIDTH || bullet.x <= 0) {
                    continue;
                } else if (bullet.y >= CONFIGS.HEIGHT || bullet.y <= 0) {
                    continue;
                } else if (instance.checkHitTarget(bullet)) {
                    continue;
                } else if (instance.checkHit(bullet)) {
                    continue;
                }
                newBullets.push(bullet);
            }
            bullets = newBullets;
        },
        checkHit: function (bullet) {
            for (let i in enemys) {
                let enemy = enemys[i];
                if (enemy.x <= CONFIGS.BULLET_SIZE && Math.abs(bullet.y - enemy.y) <= CONFIGS.BULLET_SIZE) {
                    gameOver = true;
                    nextPlayTime = new Date().getTime()+500;
                }
            }
            return false;
        },
        checkHitTarget: function (bullet) {
            let enemy = target;
            //   if(Math.abs(enemy.x-bullet.x)<CONFIGS.TARGET_SIZE/2 && Math.abs(enemy.y-bullet.y)<CONFIGS.TARGET_SIZE/2){
            //     score++;
            //     return true;
            //   }
            if (bullet.y <= CONFIGS.TARGET_SIZE *3/5) {
                hitEffect.createBall(bullet.x+CONFIGS.BULLET_SIZE,bullet.y);
                score++;
                return true;
            }
            return false;
        },
        countdownTime: function () {
            time++;
        },
        init: function () {
            score = 0;
            time = CONFIGS.GAME_TME;
            target = {};
            enemys = [];
            bullets = [];
            gameOver = false;
            first = false;
            nextPlayTime = 0;
        },
        start: function () {
            if(new Date().getTime()<nextPlayTime){
                return
            }
            instance.init();
            instance.genTarget();
            instance.genEnemys();
            tools.setInterval(instance.moveEnemys, 5, () => gameOver);
            tools.setInterval(instance.moveBullets, 5, () => gameOver);
        }
    };
    return instance;
};

function start() {
    UIController.start(new DataController(tools,hitEffect));
}

start();
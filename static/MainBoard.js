import CORDS from "./positionsCords.js";
export default class Board {
    constructor(className, background) {
        this.boardRef = document.querySelector(className);
        this.background = document.createElement('img');
        this.background.src = background;
        this.pawns = new Pawns();
    }

    update({ queue, player }) {
        this.boardRef.innerHTML = "";
        if (queue.active) {
            this.boardRef.appendChild(this.background);

            this.boardRef.appendChild(this.pawns.ref);
            this.pawns.update({ queue, player });
        }
    }
}

class Pawns {
    constructor() {
        this.ref = document.createElement('div');
        this.ref.classList.add('pawns');
        this.pawns = [];
    }

    update({ queue, player }) {
        this.ref.innerHTML = '';
        this.pawns = [];
        queue.players.forEach(p => {
            p.pawns.forEach(pawn => {
                const pawnObject = new Pawn(pawn, p.color);
                this.ref.appendChild(pawnObject.ref);
                this.pawns.push(pawnObject);
            });
        });

        if (player.movesToMake) {
            this.displayAnimations(player.movesToMake, player.color);
        }
    }

    displayAnimations(moves, color) {
        const onMove = () => {
            this.pawns.forEach(p => p.indicator.style.display = 'none');
        }
        this.pawns
            .filter(p => p.color == color)
            .forEach(p => {
                p.showAnim(moves, onMove);
                this.ref.appendChild(p.indicator);
            });
    }
}

class Pawn {
    constructor({ field, home, id }, color) {
        this.id = id;
        this.ref = document.createElement('div');
        this.ref.classList.add('pawn');
        this.ref.style.backgroundColor = color;
        this.field = field;
        this.home = home;
        this.color = color;
        this.posSet();

        this.indicator = document.createElement('div');
        this.indicator.classList.add('indicator');
    }

    posSet() {
        let x,y;
        if (this.home) {
            [x, y] = CORDS[this.color].home[this.id];
        } else {
            let cordIndex = this.field + CORDS[this.color].offset;
            if (cordIndex >= CORDS.fields.length) {
                cordIndex -= CORDS.fields.length-1;
            }
            [x, y] = CORDS.fields[cordIndex];
        }
        this.ref.style.left = `${x}%`;
        this.ref.style.top = `${y}%`;
    }

    pawnChoose(moves, onClick) {
        fetch('/player/makeMove', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: this.id
            })
        }).then(() => {
            if (this.home) this.home = false;
            else this.field += moves;
            this.posSet();
            onClick();
        });
    }

    showAnim(moves, onClick) {
        this.indicator.style.display = 'none';
        let x,y;
        if (this.home) {
            [x, y] = CORDS.fields[CORDS[this.color].offset];
        } else {
            let cordIndex = this.field + moves + CORDS[this.color].offset;
            if (cordIndex >= CORDS.fields.length) {
                cordIndex -= CORDS.fields.length-1;
            }
            [x, y] = CORDS.fields[cordIndex];
        }

        this.indicator.style.left = `${x}%`;
        this.indicator.style.top = `${y}%`;
        this.indicator.style.backgroundColor = this.color;

        this.ref.addEventListener('click', () => this.pawnChoose(moves, onClick));
        this.ref.onmouseover = () => {
            if (this.home) {
                if (moves != 1 && moves != 6) {
                    this.indicator.style.display = 'none';
                    return;
                }
            }

            this.indicator.style.display = 'block';
        };

        this.ref.onmouseleave = () => {
            this.indicator.style.display = 'none';
        };
    }
}

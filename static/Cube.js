
export default class Cube {
    constructor(className, imgs) {
        this.playersPlaceHolder = document.querySelector(className);
        this.imgsPath = imgs;


        this.button = document.createElement('button');
        this.button.innerHTML = "Throw Dice!"
        this.button.addEventListener('click', () => this.buttonHandler());
        this.img = document.createElement('img');
        this.canRemoveImage = false;

    }

    update({ queue, player }) {
        if (queue.focusPlayer && queue.focusPlayer.color == player.color) {
            this.playersPlaceHolder.innerHTML = '';
            this.isRolling = true;
            if (queue.focusPlayer.movesToMake) {
                this.img.src = `${this.imgsPath}${queue.focusPlayer.movesToMake}.png`;
                this.playersPlaceHolder.appendChild(this.img);
            } else {
                this.playersPlaceHolder.appendChild(this.button);
            }
        } else {
            if (this.canRemoveImage) {
                this.playersPlaceHolder.innerHTML = '';
                this.canRemoveImage = false;
            }
        }
    }


    async buttonHandler() {
        const data = await fetch('/queue/cubeSystem');
        const { movesToMake } = await data.json();
        this.img.src = `${this.imgsPath}${movesToMake}.png`;
        this.playersPlaceHolder.prepend(this.img);
        this.button.remove();
        setTimeout(() => this.canRemoveImage = true, 2000);
    }
}
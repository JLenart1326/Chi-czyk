export default class Players {
    constructor(className) {
        this.playerRefs = document.querySelector(className);
        this.ready = false;
    }


    update({ queue, player }) {
        const playerRefs = this.playerRefs.querySelectorAll('.player');



        playerRefs.forEach(playerRefs => {
            playerRefs.remove();
        });


        const vala = document.createDocumentFragment();
        queue.players.forEach(p => {
            const playerContainer = document.createElement('div');
            playerContainer.classList.add('player');
            playerContainer.style.backgroundColor = '#FB3737';

            if (p.ready) {
                playerContainer.style.backgroundColor = p.color;
            }

            playerContainer.innerHTML = p.nickname;
            vala.appendChild(playerContainer);
        });
        
        this.playerRefs.appendChild(vala);
        this.ready = player.ready;

    }
}
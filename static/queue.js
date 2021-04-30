import MainBoard from "./MainBoard.js";
import Cube from "./Cube.js";
import PlayerSlots from "./Players.js";

class Main {
    constructor() {
        this.board = new MainBoard('.mainBoard', '/img/board.png');


        this.cube = new Cube('.cube', '/img/cubeImgs/');


        this.playerSlot = new PlayerSlots(".listPlayers");


    }

    mainFunction() {
        const reply = async () => {

            const data = await fetch('/queue/serverInfo');
            const serverInfo = await data.json();
            this.cube.update(serverInfo);
            this.board.update(serverInfo);
            this.playerSlot.update(serverInfo);
        }
        reply();
        this.interval = setInterval(reply, 1000);
    }
}

const main = new Main();
main.mainFunction();



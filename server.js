const { v4: uuid } = require('uuid');


function getEmptyQueue() {
    let queue = availableQueues.find(function(queue) {
        return queue.players.length < 4 && !queue.active
    });
    if (!queue) {
        queue = new Queue();
        availableQueues.push(queue);
    }
    
    return queue;    
}
const fieldsBias = {
    green: 0,
    yellow: 10,
    red: 20,
    blue: 30
}

class Player {
    constructor(nickname) {
        this.id = uuid();
        this.nickname = nickname;
        this.color = "";
        this.ready = false;
        this.movesToMake = null;
        this.pawns = [];
        for (let i=0; i<4; i++) {
            this.pawns[i] = {
                id: i,
                field: 0,
                home: true,
                finish: false
            }
        }
    }

    makeMove(pawnID) {
        const pawn = this.pawns.find(function(p)
        {
            return p.id == pawnID
        });
        if (pawn.home) {
            pawn.home = false;
        } else {
            pawn.field += this.movesToMake;
        }
        this.movesToMake = null;
    }
}


class Queue {
    constructor() {
        this.id = uuid();
        this.players = [];
        this.availableColors = ['red', 'blue', 'green', 'yellow'];
        this.active = false;
        this.focusPlayer = null;
    }
    
    getPlayer(id) {
        const player = this.players.find(function(player) 
        {
            return id == player.id
        });
        
        const result = ((({ id, ...obj }) => obj))(player);
        return result;
    }

    addPlayer(player) {
        player.color = this.availableColors.pop();
        this.players.push(player);

        if (!(this.players.length < 4 && !this.active)) {
            this.active = true;
            this.players.forEach(function(p) { 
                p.ready = true
            });
            this.nextPlayerRound();
        }
    }
    updatePlayerInfo(playerid, status) {
        if (this.active) return;

        const player = this.players.find(function(player)
        {
            return player.id == playerid
        });
        player.ready = status;

        if (this.players.every(function(player) 
        {
            player.ready
        }) && this.players.length >= 2) {
            this.active = true;
            this.nextPlayerRound();
        }
    }

    nextPlayerRound() {
        if (!this.focusPlayer) {
            this.focusPlayer = this.players[0];
            return;
        }

        let currentIndex = this.players.findIndex(p => p.id == this.focusPlayer.id) + 1;
        if (currentIndex >= this.players.length) {
            currentIndex = 0;
        }

        this.focusPlayer = this.players[currentIndex];
    }
    
    
    
    throwCube() {
        const dicenum = Math.floor(Math.random() * 6) + 1;
        if (!this.focusPlayer.movesToMake) {
            this.focusPlayer.movesToMake = dicenum;
        }
        
        if (this.focusPlayer.pawns.every(p => p.home || p.finished)) {
            if (this.focusPlayer.movesToMake != 6 && this.focusPlayer.movesToMake != 1) {
                const buf = this.focusPlayer.movesToMake;
                this.focusPlayer.movesToMake = null;
                this.nextPlayerRound();
                return buf;
            }
        }   
        
        return this.focusPlayer.movesToMake;
    }
    movePlayer(pawnID) {
        this.focusPlayer.makeMove(pawnID);
        this.offsetsCheck(pawnID);
        this.nextPlayerRound();
    }
    getStatus() {
        return {
            players: this.players.map(({ id }) => this.getPlayer(id)),
            active: this.active,
            focusPlayer: this.focusPlayer ? this.getPlayer(this.focusPlayer.id) : null
        }
    }
    offsetsCheck(pawnID) {
        const pawn = this.focusPlayer.pawns.find(function(p) { 
            return p.id == pawnID
        });
        this.players.forEach(p => {
            p.pawns.forEach(pn => {
                if (p.id == this.focusPlayer.id) return;
                let offset1 = pn.field + fieldsBias[p.color]
                if (offset1 >= 40) offset1 -= 39;
                let offset2 = pawn.field + fieldsBias[this.focusPlayer.color];
                if (offset2 >= 40) offset2 -= 39;
                if (!pn.home && offset1 == offset2) {
                    pn.field = 0;
                    pn.home = true;
                }
            });
        });
    }
}

const availableQueues = [];

const express = require('express');
const session = require('express-session');
const path = require('path');
const MemoryStore = require('memorystore')(session);
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true
    },
    store: new MemoryStore() 
}))


//start
app.get('/', function(req, res) {
    if (req.session.nickname) {
        res.redirect('/queue');
    } else {
        res.sendFile(path.join(__dirname + '/static/index.html'));
    }
});

//wejscie do pokoju
app.get('/queue', function(req, res) {
    if (!req.session.nickname) {
        res.redirect('/');
    } else {
        res.sendFile(path.join(__dirname + '/static/queue.html'));
    }
});

app.use(express.static(path.join(__dirname, 'static')));

//setup nicku
app.post('/enter', function(req, res) {
    const { nickname } = req.body;
    if (nickname) {
        req.session.nickname = nickname;
        const player = new Player(nickname);
        req.session.playerid = player.id;
        const queue = getEmptyQueue(availableQueues);
        req.session.queueId = queue.id;
        queue.addPlayer(player);
        res.send({status: "Enter Succes!"})
        return;
    }
    res.status(400)
    res.send({
        status: "Enter Failed"
    });
});








app.get('/queue/serverInfo', function(req, res) {
    const { queueId } = req.session;

    if (!queueId) {
        res.status(400);
        res.send("Nie udało się nigdzie dołączyć");
        return;
    }

    const queue = availableQueues.find(function(queue) { 
        return queue.id == queueId
    });
    
    if (queue) {
        
        const player = queue.getPlayer(req.session.playerid);
        const status = { player, queue: queue.getStatus() };
        res.send(JSON.stringify(status));
        return;
    }

    res.send("Nie znalezione żadnego pokoju queue");
});

app.post('/player/makeMove', function(req, res) {
    const { queueId } = req.session;
    if (!queueId) {
        res.status(400);
        res.send("Nie udało się nigdzie dołączyć");
    }

    const queue = availableQueues.find(function(g) { 
       return g.id == queueId
    });
    if (queue) {
        if (queue.focusPlayer.id == req.session.playerid) {
            queue.movePlayer(req.body.id);
            res.send({ status: "OK" });
            return;
        }
    }

    res.send("Failed");
});

app.get('/queue/cubeSystem', function(req, res) {
    const { queueId } = req.session;
    if (!queueId) {
        res.status(400);
        res.send("Nie udało się nigdzie dołączyć");
        return;
    }

    const queue = availableQueues.find(function(queue) {
        return queue.id == queueId
    });
    if (queue) {
        if (queue.focusPlayer.id == req.session.playerid) {
            const dicenum = queue.throwCube();
            res.send(JSON.stringify({
                movesToMake: dicenum
            }));
            return;
        }
    }

    res.send("Failed");
});

app.listen(PORT, () => console.log(`Server starts on  ${PORT}`));
 
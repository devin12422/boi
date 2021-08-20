const Dungeon = require('@mikewesthad/dungeon');
var express = require('express');
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const fs = require("fs");
var users
fs.readFile("public/assets/jsons/enemies.json", function(err, data) {
    if(err) throw err;
    users = JSON.parse(data);
});
var players = {};
var bullets = {};
var enemies = {};
var items = {};
var newEnemyId = 0;
var playerNum = 0;
var level = 0;
setInterval(function() {
    for(enemy in enemies) {
        if(!enemies[enemy].dead) {
            var closestPlayerDist = 400;
            var closestPlayer;
            var playerFound = false;
            for(player in players) {
                if(Math.sqrt(Math.pow(enemies[enemy].x - players[player].x, 2) + Math.pow(enemies[enemy].y - players[player].y, 2)) < closestPlayerDist && players[player].room.x == enemies[enemy].room.x && players[player].room.y == enemies[enemy].room.y) {
                    closestPlayer = players[player];
                    playerFound = true;
                    closestPlayerDist = Math.sqrt(Math.pow(enemies[enemy].x - players[player].x, 2) + Math.pow(enemies[enemy].y - players[player].y, 2));
                }
            }
            if(playerFound && eval("users." + enemies[enemy].type + ".ai") == "lerp") {
                enemies[enemy].x += Math.sign(closestPlayer.x - enemies[enemy].x) * eval("users." + enemies[enemy].type + ".speed") * 3;
                enemies[enemy].y += Math.sign(closestPlayer.y - enemies[enemy].y) * eval("users." + enemies[enemy].type + ".speed") * 3;
                enemies[enemy].frame += 1;
                if(Math.abs(closestPlayer.y - enemies[enemy].y) >= Math.abs(closestPlayer.x - enemies[enemy].x)) {
                    if(Math.sign(closestPlayer.y - enemies[enemy].y) == 1 && enemies[enemy].frame != 0 && enemies[enemy].frame != 1 && enemies[enemy].frame != 2) {
                        enemies[enemy].frame = 0;
                    } else if(Math.sign(closestPlayer.y - enemies[enemy].y) == -1 && enemies[enemy].frame != 9 && enemies[enemy].frame != 10 && enemies[enemy].frame != 11) {
                        enemies[enemy].frame = 9;
                    }
                } else {
                    if(Math.sign(closestPlayer.x - enemies[enemy].x) == 1 && enemies[enemy].frame != 3 && enemies[enemy].frame != 4 && enemies[enemy].frame != 5) {
                        enemies[enemy].frame = 3;
                    } else if(Math.sign(closestPlayer.x - enemies[enemy].x) == -1 && enemies[enemy].frame != 6 && enemies[enemy].frame != 7 && enemies[enemy].frame != 8) {
                        enemies[enemy].frame = 6;
                    }
                }
                io.emit('enemyMoved', enemies[enemy]);
            } else if(eval("users." + enemies[enemy].type + ".ai") == "wander") {
                var xChange = (Math.round(Math.random()) * 2 - 1) * eval("users." + enemies[enemy].type + ".speed") * 3;
                var yChange = (Math.round(Math.random()) * 2 - 1) * eval("users." + enemies[enemy].type + ".speed") * 3;
                enemies[enemy].x += xChange;
                enemies[enemy].y += yChange;
                enemies[enemy].frame += 1;
                if(Math.abs(yChange) >= Math.abs(xChange)) {
                    if(Math.sign(yChange) == 1 && enemies[enemy].frame != 0 && enemies[enemy].frame != 1 && enemies[enemy].frame != 2) {
                        enemies[enemy].frame = 0;
                    } else if(Math.sign(yChange) == -1 && enemies[enemy].frame != 9 && enemies[enemy].frame != 10 && enemies[enemy].frame != 11) {
                        enemies[enemy].frame = 9;
                    }
                } else {
                    if(Math.sign(xChange) == 1 && enemies[enemy].frame != 3 && enemies[enemy].frame != 4 && enemies[enemy].frame != 5) {
                        enemies[enemy].frame = 3;
                    } else if(Math.sign(xChange) == -1 && enemies[enemy].frame != 6 && enemies[enemy].frame != 7 && enemies[enemy].frame != 8) {
                        enemies[enemy].frame = 6;
                    }
                }
                io.emit('enemyMoved', enemies[enemy]);
            }
        }
    }
}, 120);
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});
var character;
var username;
const dungeon = new Dungeon({
    width: 80,
    height: 30,
    doorPadding: 1,
    rooms: {
        width: {
            min: 8,
            max: 16
        },
        height: {
            min: 5,
            max: 10
        },
        maxArea: 160,
        maxRooms: 21
    }
});

function bruhhh() {
    for(var i = 0; i < dungeon.rooms.length; i++) {
        dungeon.rooms[i].type = Math.floor(Math.random() * 5) + 3;
        if(dungeon.rooms[i].type == 3) {
            //             if(Math.floor(Math.random() * 5) <= 1) {
            enemies[newEnemyId] = {
                x: dungeon.rooms[i].centerX * 156,
                y: dungeon.rooms[i].centerY * 156,
                id: newEnemyId,
                type: "gaper",
                health: eval("users.gaper.health"),
                frame: 0,
                damage: eval("users.gaper.damage"),
                dead: false,
                room: dungeon.rooms[i]
            };
            //             io.emit('newEnemy', enemies[newEnemyId]);
            newEnemyId += 1;
            //             }
        }
    }
    //         Spawn Room:0, Boss Room : 1, Loot Room : 2,Normal Room : 3,
    //         Devil Room, Angel Room, Secret Room, Arcade OR Shop: 3, Challenge Room, Curse Room, Miniboss Room, Miniboss Room
    dungeon.rooms[0].type = 0; //Spawn Room
    dungeon.rooms[1].type = 1; //Boss Room
    dungeon.rooms[2].type = 2; //Loot Room
}
io.on('connection', socket => {
    character = socket.handshake.query.character;
    username = socket.handshake.query.username;
    console.log('a user connected: ', socket.id);
    playerNum += 1;
    if(playerNum == 1) {
        bruhhh();
    }
    players[socket.id] = {
        rotation: 0,
        x: dungeon.rooms[0].centerX * 156,
        y: dungeon.rooms[0].centerY * 156,
        playerId: socket.id,
        frame: 1,
        character: character,
        username: username,
        room: dungeon.rooms[0]
    };
    bullets[socket.id];
    socket.emit('currentLevel', dungeon);
    socket.emit('currentPlayers', players);
    socket.emit('currentEnemies', enemies);
    socket.broadcast.emit('newPlayer', players[socket.id]);
    socket.on('disconnect', (reason) => {
        console.log('user disconnected: ', socket.id);
        delete players[socket.id];
        io.emit('disconnected', socket.id);
    });
    socket.on('playerMovement', function(movementData) {
        players[socket.id].x = movementData.x;
        players[socket.id].y = movementData.y;
        players[socket.id].rotation = movementData.rotation;
        players[socket.id].frame = movementData.frame;
        players[socket.id].room = movementData.room;
        socket.broadcast.emit('playerMoved', players[socket.id]);
    });
    socket.on('enemyDamaged', function(damageData) {
        enemies[damageData.id].health -= damageData.damage;
        if(enemies[damageData.id].health <= 0) {
            if(enemies[damageData.id].type == "gaper") {
                enemies[newEnemyId] = {
                    x: enemies[damageData.id].x,
                    y: enemies[damageData.id].y,
                    id: newEnemyId,
                    type: "pacer",
                    health: eval("users.pacer.health"),
                    frame: 0,
                    damage: eval("users.pacer.damage"),
                    dead: false,
                    room: enemies[damageData.id].room
                };
                io.emit('newEnemy', enemies[newEnemyId]);
                newEnemyId += 1;
            }
            enemies[damageData.id].x = 0;
            enemies[damageData.id].y = 0;
            enemies[damageData.id].dead = true;
            io.emit('enemyMoved', enemies[damageData.id]);
        }
    });
    socket.on('playerDamaged', function(damageData) {
        socket.broadcast.emit('playerDamage', damageData);
        //         var j = Math.floor(Math.random() * 5);
        //         if(j <= 2) {
        //             enemies[newEnemyId] = {
        //                 x: dungeon.rooms[0].centerX * 156,
        //                 y: dungeon.rooms[0].centerY * 156,
        //                 id: newEnemyId,
        //                 type: "gaper",
        //                 health: eval("users.gaper.health"),
        //                 frame: 0,
        //                 damage: eval("users.gaper.damage"),
        //                 dead: false
        //             };
        //             io.emit('newEnemy', enemies[newEnemyId]);
        //             newEnemyId += 1;
        //         }
    });
    socket.on('bulletMovement', function(movementData) {
        bullets[socket.id] = {
            x: movementData.x,
            y: movementData.y,
            id: socket.id + movementData.id,
            dir: movementData.dir,
            destroy: movementData.destroy,
            visible: movementData.visible
        };
        socket.broadcast.emit('bulletMoved', bullets[socket.id]);
    });
});
server.listen(9966, function() {
    console.log("9966");
});
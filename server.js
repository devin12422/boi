var express = require('express');
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

var players = {};
var bullets = {};
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});
io.on('connection', socket => {
    console.log('a user connected: ', socket.id);
    players[socket.id] = {
        rotation: 0,
        x: 0,
        y:0,
        playerId: socket.id,
        frame:1,
        character:"jakub"
    };
    socket.emit('currentPlayers', players);
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
        socket.broadcast.emit('playerMoved', players[socket.id]);
    });
    socket.on('newBullet', function(movementData) {
        bullets[socket.id].x = movementData.x;
        bullets[socket.id].y = movementData.y;
        bullets[socket.id].rotation = movementData.rotation;
        socket.broadcast.emit('newBullet', bullets[socket.id]);
    });
});
server.listen(9966, function() {
    console.log("9966");
});
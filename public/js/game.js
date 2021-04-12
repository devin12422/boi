var config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 1280,
    height: 720,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: {
                y: 0
            }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};
var speed = 3;
var bulletSpeed = 5;
var fireRate = 25;
var nextShotIn = 0;
var health = 3;
var numBullets = 0;
var char;

function start() {
//     document.getElementById("yee").innerHTML = "";
    var game = new Phaser.Game(config);
    var radios = document.getElementsByName("character");
    char = Array.from(radios).find(radio => radio.checked);
}

function preload() {
    this.load.tilemapTiledJSON('map', 'assets/jsons/map.json');
    this.load.image('tiles', 'assets/tile.png');
    this.load.image('tear', 'assets/tear.png');
    this.load.image('andesite', 'assets/andesite.png');
    this.load.spritesheet("jakub", "assets/jakub.png", {
        frameWidth: 96,
        frameHeight: 64
    });
    this.load.spritesheet("aaron", "assets/aaron.png", {
        frameWidth: 96,
        frameHeight: 64
    });
}

function create() {
    var self = this;
    this.socket = io();
    this.otherPlayers = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.socket.on('currentPlayers', function(players) {
        Object.keys(players).forEach(function(id) {
            if(players[id].playerId === self.socket.id) {
                addPlayer(self, players[id]);
            } else {
                addOtherPlayers(self, players[id]);
            }
        });
    });
    this.socket.on('newPlayer', function(playerInfo) {
        addOtherPlayers(self, playerInfo);
    });
    this.socket.on('newBullet', function(bulletInfo) {
        addOtherBullets(self, bulletInfo);
    });
    this.socket.on('disconnected', function(playerId) {
        self.otherPlayers.getChildren().forEach(function(otherPlayer) {
            if(playerId === otherPlayer.playerId) {
                otherPlayer.destroy();
            }
        });
    });
    this.socket.on('playerMoved', function(playerInfo) {
        self.otherPlayers.getChildren().forEach(function(otherPlayer) {
            if(playerInfo.playerId === otherPlayer.playerId) {
                otherPlayer.setRotation(playerInfo.rotation);
                otherPlayer.setPosition(playerInfo.x, playerInfo.y);
                otherPlayer.setFrame(playerInfo.frame);
            }
        });
    });
    this.socket.on('bulletMoved', function(bulletInfo) {
        self.bullets.getChildren().forEach(function(otherBullet) {
            if(bulletInfo.playerId === otherBullet.playerId) {
                otherBullet.setRotation(bulletInfo.rotation);
                otherBullet.setPosition(bulletInfo.x, playerInfo.y);
            }
        });
    });
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    var i;
    for(i = 0; i < 4; i++) {
        var i3 = 3 * i;
        var movementAnimation = {
            key: "walkAnim" + i,
            frames: this.anims.generateFrameNumbers(char.value, {
                start: 0 + i3,
                end: 2 + i3,
                first: 1 + i3
            }),
            frameRate: 10,
            repeat: -1
        }
        this.anims.create(movementAnimation);
    }
    const level = [
        [2, 2, 2, 2, 2, 2],
        [2, 1, 1, 1, 1, 2],
        [2, 1, 1, 1, 1, 2],
        [2, 1, 1, 1, 1, 2],
        [2, 1, 1, 1, 1, 2],
        [2, 2, 2, 2, 2, 2],
    ];
    const obst = [
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1]
    ];
    const map = this.make.tilemap({
        data: level,
        tileWidth: 128,
        tileHeight: 128
    });
    const obstMap = this.make.tilemap({
        data: obst,
        tileWidth: 128,
        tileHeight: 128
    });
    const tiles = map.addTilesetImage("tiles");
    const layer = map.createStaticLayer(0, tiles, 0, 0);
    const obstLayer = obstMap.createStaticLayer(1, tiles, 0, 0);
}

function shoot(self, dir) {
    nextShotIn = fireRate;
    numBullets += 1;
    var tear = self.physics.add.sprite(self.player.x, self.player.y, 'tear').setOrigin(0.5, 0.5).setDisplaySize(24, 24);
    tear.dir = dir;
    tear.tearId = numBullets;
    self.bullets.add(tear);
}

function addPlayer(self, playerInfo) {
    self.player = self.physics.add.sprite(playerInfo.x, playerInfo.y, char.value).setOrigin(0.5, 0.5).setDisplaySize(192, 128);
    self.player.setFrame(1);
    self.player.character = char.value;
    self.cameras.main.startFollow(self.player);
}

function addBullet(self, bulletInfo) {
    var bullet = self.physics.add.sprite(bulletInfo.x, bulletInfo.y, 'tear').setOrigin(0.5, 0.5).setDisplaySize(24, 24);
    bullet.bulletId = bulletInfo.bulletId;
    self.bullets.add(bullet);
}

function addOtherPlayers(self, playerInfo) {
    var otherPlayer = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'jakub').setOrigin(0.5, 0.5).setDisplaySize(192, 128);
    otherPlayer.playerId = playerInfo.playerId;
    self.otherPlayers.add(otherPlayer);
}

function update() {
    if(this.player) {
        var self = this;
        if(nextShotIn > 0) {
            nextShotIn -= 1;
        }
        var moved = false;
        if(this.wKey.isDown) {
            this.player.y -= speed;
            this.player.play("walkAnim3", true);
            moved = true;
        } else if(this.sKey.isDown) {
            this.player.y += speed;
            this.player.play("walkAnim0", true);
            moved = true;
        }
        if(this.aKey.isDown) {
            this.player.x -= speed;
            if(!moved) {
                this.player.play("walkAnim2", true);
            }
            moved = true;
        } else if(this.dKey.isDown) {
            this.player.x += speed;
            if(!moved) {
                this.player.play("walkAnim1", true);
            }
            moved = true;
        }
        if(!moved) {
            this.player.anims.stop();
        }
        if(this.cursors.down.isDown && nextShotIn == 0) {
            shoot(self, 0);
        } else if(this.cursors.up.isDown && nextShotIn == 0) {
            shoot(self, 1);
        } else if(this.cursors.right.isDown && nextShotIn == 0) {
            shoot(self, 2);
        } else if(this.cursors.left.isDown && nextShotIn == 0) {
            shoot(self, 3);
        }
        if(moved) {
            this.socket.emit('playerMovement', {
                x: this.player.x,
                y: this.player.y,
                rotation: this.player.rotation,
                frame: parseInt(this.player.frame.name, 10)
            });
        }
        this.bullets.children.iterate(function(child) {
            if(child.dir == 0) {
                child.y += bulletSpeed;
            } else if(child.dir == 1) {
                child.y -= bulletSpeed;
            } else if(child.dir == 2) {
                child.x += bulletSpeed;
            } else if(child.dir == 3) {
                child.x -= bulletSpeed;
            }
        });
    }
}
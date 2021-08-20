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

var char, username,
    nextShotIn = 0,
    nextDoorIn = 0,
    nextHitIn = 0,
    numBullets = 0,
    h, d, s, fR, range, game, mapData;
// document.addEventListener('contextmenu', function(e) {
//     e.preventDefault();
// });
function start() {
    game = new Phaser.Game(config);
    var radios = document.getElementsByName("character");
    char = Array.from(radios).find(radio => radio.checked);
    username = document.getElementById("user").value;
    var charValue = char.value;
    eval("var charData = playerData." + charValue);
    document.getElementById("yee").innerHTML = "";
    h = 3, d = 3, s = 6 * 3, fR = 40 / 3, range = 3;
}

function preload() {
    var imgList = ["lvl1", "lvl2", "lvl3", "lvl4", "mapTile", "tear", "heart", "halfHeart", "hud"];
    for(var q = 0; q < imgList.length; q++) {
        this.load.image(imgList[q], "assets/" + imgList[q] + ".png");
    }
    this.load.image('mapCoverTile', 'assets/mapCover.png');
    var characterList = ["jakub", "aaron", "coco", "gaper", "pacer"];
    for(var q = 0; q < characterList.length; q++) {
        this.load.spritesheet(characterList[q], "assets/" + characterList[q] + ".png", {
            frameWidth: 96,
            frameHeight: 64
        });
    }
    //     this.load.spritesheet("jakub", "assets/jakub.png", {
    //         frameWidth: 96,
    //         frameHeight: 64
    //     });
    this.load.spritesheet("doors", "assets/doors.png", {
        frameWidth: 60,
        frameHeight: 45
    });
    this.load.spritesheet("host", "assets/host.png", {
        frameWidth: 32,
        frameHeight: 64
    });
}
var currentRoom;

function create() {
    var self = this;
    this.socket = io(window.location.origin, {
        query: {
            "character": char.value,
            "username": username
        }
    });
    this.h = h, this.d = d, this.s = s, this.fR = fR, this.range = range, this.mh = h, this.hearts = this.physics.add.group();
    var z = 0,
        hud = self.physics.add.sprite(640, 360, "hud").setOrigin(0.5, 0.5).setDisplaySize(1280, 720),
        lifeText = self.add.text(1136, 28, "-LIFE-", {
            fontFamily: '"Coming Soon"',
            fontSize: '24px',
            fill: '#ff0000'
        });
    hud.setScrollFactor(0, 0);
    hud.depth = 1;
    lifeText.depth = 1;
    lifeText.setOrigin(0.5, 0.5);
    lifeText.setScrollFactor(0, 0);
    updateHealth(self);
    this.otherPlayers = this.physics.add.group(), this.bullets = this.physics.add.group(), this.otherBullets = this.physics.add.group(), this.enemies = this.physics.add.group(), this.walls = this.physics.add.group(), this.doors = this.physics.add.group(), this.minimap = this.physics.add.group();
    this.socket.on('currentPlayers', function(players) {
        Object.keys(players).forEach(function(id) {
            if(players[id].playerId === self.socket.id) {
                addPlayer(self, players[id]);
            } else {
                addOtherPlayers(self, players[id]);
            }
        });
    });
    this.socket.on('currentLevel', function(level) {
        mapData = level;
        const map = self.make.tilemap({
            data: level.tiles,
            tileWidth: 156,
            tileHeight: 156
        });
        currentRoom = mapData.rooms[0];
        mapData.rooms[0].explored = true;
        for(var i = 0; i < mapData.tiles.length; i++) {
            for(var x = 0; x < mapData.tiles[i].length; x++) {
                if(mapData.tiles[i][x] != 0) {
                    var blockk = self.physics.add.sprite((x * 3) + 200, (i * 3) + 20, "mapTile").setDisplaySize(3, 3);
                    blockk.setScrollFactor(0, 0);
                    blockk.depth = 1, blockk.fakeX = x, blockk.fakeY = i, blockk.type = mapData.tiles[i][x];
                    blockk.setTint(blockk.type == 3 ? 0xff0000 : blockk.type == 1 ? 0x000000 : blockk.tint);
                    for(var b = 0; b < mapData.rooms.length; b++) {
                        if(blockk.fakeX > mapData.rooms[b].left && blockk.fakeX < mapData.rooms[b].right && blockk.fakeY > mapData.rooms[b].top && blockk.fakeY < mapData.rooms[b].bottom) {
                            if(mapData.rooms[b].type == 3) {
                                blockk.setTint(0xff00ff);
                            }
                            if(!mapData.rooms[b].explored) {
                                //                                 blockk.visible = false;
                            }
                        }
                    }
                    if(x > currentRoom.left && x < currentRoom.right && i > currentRoom.top && i < currentRoom.bottom) {
                        blockk.setTint(0xffffff);
                        blockk.tintFill = true;
                    }
                    self.minimap.add(blockk);
                }
            }
        }
        const tiles = map.addTilesetImage("lvl3"),
            layer = map.createDynamicLayer(0, tiles, 0, 0);
        shadowLayer = map.createBlankDynamicLayer("Shadow", tiles);
        shadowLayer.depth = 0.5;
        shadowLayer.fill(4);
        shadowLayer.forEachTile(function(bruh) {
            if(bruh.x > currentRoom.left - 1 && bruh.x < currentRoom.right + 1 && bruh.y + 1 > currentRoom.top && bruh.y < currentRoom.bottom + 1) {
                bruh.index = -1;
            } else {
                bruh.index = 4;
            }
        });
        layer.forEachTile(function(bruh) {
            if(bruh.index == 0) {
                bruh.visible = false;
            }
        });
        for(var i = 0; i < level.rooms.length; i++) {
            var cornerTilesPos = [
                [level.rooms[i].x, level.rooms[i].y],
                [level.rooms[i].x + level.rooms[i].width - 1, level.rooms[i].y],
                [level.rooms[i].x + level.rooms[i].width - 1, level.rooms[i].y + level.rooms[i].height - 1],
                [level.rooms[i].x, level.rooms[i].y + level.rooms[i].height - 1]
            ];
            //             for(var z = 0; z < 2; z++) {
            //                 for(var m = 0; m < 2; m++) {
            //                     var wall = self.physics.add.sprite((level.rooms[i].x + (z * level.rooms[i].width)) * 156, (level.rooms[i].y) * 156, null).setVisible(false).setOrigin(0, 0);
            //                     if(m == 1) {
            //                         wall.body.height = level.rooms[i].height * 156;
            //                         wall.body.width = 78;
            //                     } else {
            //                         wall.body.width = (level.rooms[i].width-2) * 156;
            //                         wall.body.height = 78;
            //                     }
            //                     wall.body.setOffset(0, 0);
            //                     wall.body.pushable = false;
            //                     self.walls.add(wall);
            //                 }
            //             }
            for(var q = 1; q < level.rooms[i].width - 1; q++) {
                layer.getTileAt(level.rooms[i].x + q, level.rooms[i].y + level.rooms[i].height - 1).rotation -= 3.1416;
            }
            for(var z = 1; z < level.rooms[i].height - 1; z++) {
                layer.getTileAt(level.rooms[i].x, level.rooms[i].y + z).rotation -= 1.5708;
                layer.getTileAt(level.rooms[i].x + level.rooms[i].width - 1, level.rooms[i].y + z).rotation += 1.5708;
            }
            for(var z = 0; z < cornerTilesPos.length; z++) {
                layer.getTileAt(cornerTilesPos[z][0], cornerTilesPos[z][1]).rotation += 1.5708 * z;
                layer.getTileAt(cornerTilesPos[z][0], cornerTilesPos[z][1]).index = 0;
            }
        }
        var door;
        layer.forEachTile(function(bruh) {
            if(bruh.index == 3) {
                door = self.physics.add.sprite((bruh.x * 156) + 78, (bruh.y * 156) + 78, "doors");
                door.setDisplaySize(120, 90);
                if(Math.abs(bruh.rotation) == 1.5708) {
                    door.body.setSize(30, 70);
                } else {
                    door.body.setSize(70, 30);
                }
                door.rotation = bruh.rotation;
                self.doors.add(door);
            }
        });
    });
    this.socket.on('currentEnemies', function(players) {
        Object.keys(players).forEach(function(id) {
            if(players[id].dead == false) {
                var enemy = self.physics.add.sprite(players[id].x, players[id].y, players[id].type).setOrigin(0.5, 0.5).setDisplaySize(192, 128);
                if(players[id].type == "pacer") {
                    enemy.body.setSize(30, 28);
                } else {
                    enemy.body.setSize(30, 38);
                }
                enemy.id = players[id].id;
                enemy.damage = players[id].damage;
                self.enemies.add(enemy);
            }
        });
    });
    this.socket.on('newPlayer', function(playerInfo) {
        addOtherPlayers(self, playerInfo);
    });
    this.socket.on('newEnemy', function(playerInfo) {
        var enemy = self.physics.add.sprite(playerInfo.x, playerInfo.y, playerInfo.type).setOrigin(0.5, 0.8).setDisplaySize(192, 128);
        if(playerInfo.type == "pacer") {
            enemy.body.setSize(30, 28);
            //             enemy.body.setOffset(8, 12);
        } else {
            enemy.body.setSize(30, 38);
            //                         enemy.body.setOffset(8, 0);
        }
        enemy.id = playerInfo.id;
        enemy.damage = playerInfo.damage;
        self.enemies.add(enemy);
        //         addOtherPlayers(self, playerInfo);
    });
    this.socket.on('playerDamage', function(damageInfo) {
        if(self.socket.id == damageInfo.id) {
            self.h -= damageInfo.damage;
            updateHealth(self);
        }
    });
    this.socket.on('newBullet', function(bulletInfo) {
        addBullet(self, bulletInfo);
    });
    this.socket.on('disconnected', function(playerId) {
        self.otherPlayers.getChildren().forEach(function(otherPlayer) {
            if(playerId === otherPlayer.playerId) {
                otherPlayer.destroy();
                otherPlayer.username.destroy();
            }
        });
    });
    this.socket.on('playerMoved', function(playerInfo) {
        self.otherPlayers.getChildren().forEach(function(otherPlayer) {
            if(playerInfo.playerId === otherPlayer.playerId) {
                otherPlayer.setRotation(playerInfo.rotation);
                otherPlayer.setPosition(playerInfo.x, playerInfo.y);
                otherPlayer.username.setPosition(playerInfo.x - 40, playerInfo.y + 64);
                otherPlayer.setFrame(playerInfo.frame);
            }
        });
    });
    this.socket.on('enemyMoved', function(playerInfo) {
        self.enemies.getChildren().forEach(function(otherPlayer) {
            if(playerInfo.id === otherPlayer.id) {
                otherPlayer.setPosition(playerInfo.x, playerInfo.y);
                otherPlayer.setFrame(playerInfo.frame);
                //                 if(playerInfo.dead) {
                //                     otherPlayer.destroy();
                //                 }
            }
        });
    });
    this.socket.on('bulletMoved', function(bulletInfo) {
        var bulletFound = false;
        self.otherBullets.getChildren().forEach(function(otherBullet) {
            if(otherBullet && bulletInfo.id === otherBullet.id) {
                bulletFound = true;
                otherBullet.setPosition(bulletInfo.x, bulletInfo.y);
                otherBullet.shouldDestroy = bulletInfo.destroy;
                otherBullet.visible = bulletInfo.visible;
                if(otherBullet.shouldDestroy) {
                    //                     otherBullet.destroy();
                }
            }
        });
        if(!bulletFound) {
            addBullet(self, bulletInfo);
        }
    });
    this.cursors = this.input.keyboard.createCursorKeys(), this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W), this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S), this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A), this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    for(var i = 0; i < 4; i++) {
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
}
var changed = false;

function updateMap(self) {
    if(self.player) {
        for(var i = 0; i < mapData.rooms.length; i++) {
            if(self.player.x / 156 > mapData.rooms[i].left - 1 && self.player.x / 156 < mapData.rooms[i].right + 1 && self.player.y / 156 > mapData.rooms[i].top - 1 && self.player.y / 156 < mapData.rooms[i].bottom + 1) {
                currentRoom = mapData.rooms[i];
                mapData.rooms[i].explored = true;
            }
        }
        self.cameras.main.setBounds(currentRoom.left * 156, (currentRoom.top - 0.5) * 156, currentRoom.width * 156, (currentRoom.height + 0.5) * 156);
        shadowLayer.fill(4);
        shadowLayer.fill(-1, currentRoom.left, currentRoom.top, currentRoom.width, currentRoom.height);
        self.minimap.getChildren().forEach(function(miniBlock) {
            for(var b = 0; b < mapData.rooms.length; b++) {
                if(miniBlock.fakeX > mapData.rooms[b].left - 1 && miniBlock.fakeX < mapData.rooms[b].right + 1 && miniBlock.fakeY + 1 > mapData.rooms[b].top && miniBlock.fakeY < mapData.rooms[b].bottom + 1) {
                    if(mapData.rooms[b].explored) {
                        miniBlock.visible = true;
                    }
                }
                if(miniBlock.fakeX > currentRoom.left && miniBlock.fakeX < currentRoom.right && miniBlock.fakeY > currentRoom.top && miniBlock.fakeY < currentRoom.bottom) {
                    miniBlock.tintFill = true;
                    miniBlock.setTint(0xededed);
                } else {
                    //                     miniBlock.tintFill = false;
                    //                     if(miniBlock.type == 3) {
                    //                         miniBlock.setTint(0xff0000);
                    //                     } else if(miniBlock.type == 1) {
                    //                         miniBlock.setTint(0x000000);
                    //                     } else {
                    //                         miniBlock.setTint(0xffffff);
                    //                     }
                }
            }
        });
    }
}

function updateHealth(self) {
    self.hearts.children.iterate(function(child) {
        //         if(child) {
        child.visible = false;
        //             child.destroy();
        //         }
    });
    if(self.h <= 0) {
        location.reload();
    }
    let health = self.h,
        x = 1154;
    x -= Math.ceil(self.h) * 18;
    for(var z = 0; z <= self.h; z--) {
        //         if() {
        var heart = self.physics.add.sprite(x, 56, 'heart').setDisplaySize(36, 28);
        //         }
        //         health -= z - health >= 0 ? 1 : 0.5;
        //         heart.half = z == 0.5 ? true : false;
        heart.depth = 1;
        heart.setScrollFactor(0, 0);
        self.hearts.add(heart);
        x += 36;
    }
}

function shoot(self, dir) {
    nextShotIn = Math.round(self.fR);
    numBullets += 1;
    var tear = self.physics.add.sprite(self.player.x, self.player.y, 'tear').setDisplaySize(26, 26);
    tear.body.setSize(26, 26);
    //     tear.body.setOffset(8, 0);
    tear.dir = dir;
    tear.count = 0;
    tear.id = numBullets;
    self.socket.emit('newBullet', {
        x: self.player.x,
        y: self.player.y,
        dir: dir,
        id: numBullets
    });
    self.bullets.add(tear);
}

function addPlayer(self, playerInfo) {
    self.player = self.physics.add.sprite(playerInfo.x, playerInfo.y, char.value).setDisplaySize(192, 128);
    self.player.body.setSize(30, 38);
    self.player.setBounce(0.2);
    self.player.setMaxVelocity(self.s * 60);
    self.player.setFrame(1);
    self.player.character = char.value;
    self.cameras.main.startFollow(self.player);
}

function addBullet(self, bulletInfo) {
    var bullet = self.physics.add.sprite(bulletInfo.x, bulletInfo.y, 'tear').setDisplaySize(24, 24);
    bullet.body.setSize(26, 26);
    bullet.id = bulletInfo.id;
    bullet.dir = bulletInfo.dir;
    bullet.shouldDestroy = bulletInfo.destroy;
    bullet.visible = bulletInfo.visible;
    self.otherBullets.add(bullet);
}

function addOtherPlayers(self, playerInfo) {
    var otherPlayer = self.physics.add.sprite(playerInfo.x, playerInfo.y, playerInfo.character).setOrigin(0.5, 0.5).setDisplaySize(192, 128);
    var otherUsername = self.add.text(playerInfo.x, playerInfo.y, playerInfo.username, {
        font: '18px Arial',
        fill: '#000000'
    });
    otherPlayer.body.setSize(30, 38);
    otherPlayer.username = otherUsername;
    otherPlayer.playerId = playerInfo.playerId;
    self.otherPlayers.add(otherPlayer);
}

function damageTint(gameObj) {
    gameObj.setTint(0xff0000);
    setTimeout(() => {
        gameObj.setTint(0xffffff);
    }, 150);
}

function update() {
    if(this.player) {
        var self = this;
        self.physics.add.collider(self.player, self.walls);
        nextShotIn -= 1;
        nextDoorIn -= 1;
        nextHitIn -= 1;
        self.enemies.children.iterate(function(child2) {
            if(self.physics.overlap(self.player, child2) && nextHitIn <= 0) {
                damageTint(self.player);
                nextHitIn = 50;
                self.h -= child2.damage;
                updateHealth(self);
            }
        });
        self.doors.children.iterate(function(child2) {
            if(self.physics.overlap(self.player, child2) && nextDoorIn <= 0) {
                if(Math.round(child2.rotation) == 0) {
                    self.player.y -= 312;
                } else if(Math.round(child2.rotation) == 2) {
                    self.player.x += 312;
                } else if(Math.round(child2.rotation) == 3) {
                    self.player.y += 312;
                } else if(Math.round(child2.rotation) == -2) {
                    self.player.x -= 312;
                }
                self.cameras.main.flash(1500, 0, 0, 0);
                updateMap(self);
                nextDoorIn = 30;
            }
        });
        var Ymoved = false,
            Xmoved = false;
        if(this.wKey.isDown) {
            this.player.setVelocityY(-self.s * 60);
            this.player.play("walkAnim3", true);
            Ymoved = true;
        } else if(this.sKey.isDown) {
            this.player.setVelocityY(self.s * 60);
            this.player.play("walkAnim0", true);
            Ymoved = true;
        } else {
            this.player.setVelocityY(0);
        }
        if(this.aKey.isDown) {
            this.player.setVelocityX(-self.s * 60);
            if(!Ymoved) {
                this.player.play("walkAnim2", true);
            }
            Xmoved = true;
        } else if(this.dKey.isDown) {
            this.player.setVelocityX(self.s * 60);
            if(!Ymoved) {
                this.player.play("walkAnim1", true);
            }
            Xmoved = true;
        } else {
            this.player.setVelocityX(0);
            if(!Ymoved) {
                this.player.anims.stop();
            }
        }
        if(this.cursors.down.isDown && nextShotIn <= 0) {
            shoot(self, 0);
        } else if(this.cursors.up.isDown && nextShotIn <= 0) {
            shoot(self, 1);
        } else if(this.cursors.right.isDown && nextShotIn <= 0) {
            shoot(self, 2);
        } else if(this.cursors.left.isDown && nextShotIn <= 0) {
            shoot(self, 3);
        }
        if(Ymoved || Xmoved) {
            this.socket.emit('playerMovement', {
                x: this.player.x,
                y: this.player.y,
                rotation: this.player.rotation,
                frame: parseInt(this.player.frame.name, 10),
                room: currentRoom
            });
        }
        this.bullets.children.iterate(function(child) {
            if(child) {
                child.count += 2;
                var destroy = false;
                if(child.dir == 0) {
                    child.y += 5;
                } else if(child.dir == 1) {
                    child.y -= 5;
                } else if(child.dir == 2) {
                    child.x += 5;
                    //                     child.setVelocityY(child.count / range * 50);
                } else if(child.dir == 3) {
                    child.x -= 5;
                    //                     child.setVelocityY(child.count / range * 50);
                }
                self.otherPlayers.children.iterate(function(child2) {
                    if(self.physics.overlap(child, child2)) {
                        damageTint(child2);
                        self.socket.emit('playerDamaged', {
                            id: child2.playerId,
                            damage: self.d
                        });
                        destroy = true;
                    }
                });
                self.walls.children.iterate(function(child2) {
                    if(self.physics.overlap(child, child2)) {
                        destroy = true;
                    }
                });
                self.enemies.children.iterate(function(child2) {
                    if(self.physics.overlap(child, child2)) {
                        damageTint(child2);
                        self.socket.emit('enemyDamaged', {
                            id: child2.id,
                            damage: self.d
                        });
                        destroy = true;
                    }
                });
                if(child.count > self.range) {
                    destroy = true;
                }
                self.socket.emit('bulletMovement', {
                    x: child.x,
                    y: child.y,
                    id: child.id,
                    dir: child.dir,
                    visible: child.visible,
                    destroy: destroy
                });
                if(destroy) {
                    //                     child.visible = false;
                    //                     child.destroy();
                    //                     bullets.remove(child);
                    //                     return;
                }
            }
        });
    }
}
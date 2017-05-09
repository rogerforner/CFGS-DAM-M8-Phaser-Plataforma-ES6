/* globals __DEV__ */
import Phaser from 'phaser'
import Mushroom from '../sprites/Mushroom'

export default class extends Phaser.State {
  init () {}
  preload () {}

  create () {
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.cursor = this.input.keyboard.createCursorKeys();
    this.input.keyboard.addKeyCapture([Phaser.Keyboard.UP, Phaser.Keyboard.DOWN, Phaser.Keyboard.RIGHT, Phaser.Keyboard.LEFT]);

    this.level = 0;
    this.sound.mute = true;
    this.deadSound = this.add.audio('dead', 0.1);
    this.jumpSound = this.add.audio('jump', 0.1);
    this.dustSound = this.add.audio('dust', 0.1);
    this.coinSound = this.add.audio('coin', 0.1);

    this.player = this.add.sprite(250, 50, 'player');
    this.player.anchor.setTo(0.5, 0.5);
    this.physics.arcade.enable(this.player);
    this.player.body.gravity.y = 600;
    this.player.animations.add('idle', [3, 4, 5, 4], 5, true);
    this.player.body.setSize(20, 20, 0, 0);
    this.player.anchor.setTo(0.5, 0.5);
    this.playerDead = false;

    this.loadLevel();
    this.setParticles();
    this.spawnPlayer();
  }

  update () {
    this.physics.arcade.collide(this.player, this.level);
    this.physics.arcade.overlap(this.player, this.enemy, this.spawnPlayer, null, this);
    this.physics.arcade.overlap(this.player, this.coins, this.takeCoin, null, this);

    this.inputs();
    this.exp.forEachAlive(function(p){
      p.alpha = this.math.clamp(p.lifespan / 100, 0, 1);
    }, this);
  }

  inputs () {
    if (this.cursor.left.isDown || this.moveLeft) {
      this.player.body.velocity.x = -200;
      this.player.frame = 2;
      this.sound.mute = false;
    }
    else if (this.cursor.right.isDown || this.moveRight) {
      this.player.body.velocity.x = 200;
      this.player.frame = 1;
      this.sound.mute = false;
    }
    else {
      this.player.body.velocity.x = 0;
    }

    if (this.player.body.velocity.x == 0)
      this.player.animations.play('idle');

    if (this.player.body.touching.down && this.player.y > 100) {
      if (this.hasJumped) {
        this.dustSound.play();
        this.dust.x = this.player.x;
        this.dust.y = this.player.y+10;
        this.dust.start(true, 300, null, 8);
      }

      this.hasJumped = false;
    }

    if (this.cursor.up.isDown) {
      this.jumpPlayer();
    }
  }

  jumpPlayer () {
    if (this.player.body.touching.down && this.player.y > 100) {
      this.sound.mute = false;
      this.hasJumped = true;
      this.jumpSound.play();
      this.player.body.velocity.y = -220;
    }
  }

  spawnPlayer () {
    if (this.playerDead) {
      this.exp.x = this.player.x;
      this.exp.y = this.player.y+10;
      this.exp.start(true, 300, null, 20);

      this.shakeEffect(this.level);
      this.shakeEffect(this.enemy);

      this.deadSound.play();
    }

    this.player.scale.setTo(0, 0);
    this.add.tween(this.player.scale).to({x:1, y:1}, 300).start();
    this.player.reset(250, 50);

    this.hasJumped = true;
    this.playerDead = true;

    this.moveLeft = false;
    this.moveRight = false;

    this.addCoins();
  }

  loadLevel (coins, enemies) {
    this.level = this.add.group();
    this.level.enableBody = true;
    this.add.sprite(90, 200/2 -50, 'wall', 0, this.level);
    this.add.sprite(390, 200/2 -50, 'wall', 0, this.level);
    this.add.sprite(500/2 - 160, 200/2 +30, 'ground', 0, this.level);
    this.level.setAll('body.immovable', true);

    this.enemy = this.add.sprite(360, 120, 'enemy');
    this.physics.arcade.enable(this.enemy);
    this.enemy.anchor.setTo(0.5, 0.5);
  }

  addCoins () {
    if (!this.coins) {
      this.coins = this.add.group();
      this.coins.enableBody = true;
    }
    else {
      this.coins.forEachAlive(function(e){
        e.kill();
      }, this);
    }

    this.add.sprite(140, 120, 'coin', 0, this.coins);
    this.add.sprite(170, 120, 'coin', 0, this.coins);
    this.add.sprite(200, 120, 'coin', 0, this.coins);

    this.coins.forEachAlive(function(e){
      e.isTaken = false;
      e.scale.setTo(0,0);
      e.anchor.setTo(0.5);
      this.add.tween(e.scale).to({x:1, y:1}, 200).start();
    }, this);
  }

  takeCoin (a, b) {
    b.body.enable = false;
    this.add.tween(b.scale).to({x:0}, 150).start();
    this.add.tween(b).to({y:50}, 150).start();
    this.coinSound.play();
  }

  setParticles () {
    this.dust = this.add.emitter(0, 0, 20);
    this.dust.makeParticles('dust');
    this.dust.setYSpeed(-100, 100);
    this.dust.setXSpeed(-100, 100);
    this.dust.gravity = 0;

    this.exp = this.add.emitter(0, 0, 20);
    this.exp.makeParticles('exp');
    this.exp.setYSpeed(-150, 150);
    this.exp.setXSpeed(-150, 150);
    this.exp.gravity = 0;
  }

  shakeEffect (g) {
    var move = 5;
    var time = 20;

    this.add.tween(g)
        .to({y:"-"+move}, time).to({y:"+"+move*2}, time*2).to({y:"-"+move}, time)
        .to({y:"-"+move}, time).to({y:"+"+move*2}, time*2).to({y:"-"+move}, time)
        .to({y:"-"+move/2}, time).to({y:"+"+move}, time*2).to({y:"-"+move/2}, time)
        .start();

    this.add.tween(g)
        .to({x:"-"+move}, time).to({x:"+"+move*2}, time*2).to({x:"-"+move}, time)
        .to({x:"-"+move}, time).to({x:"+"+move*2}, time*2).to({x:"-"+move}, time)
        .to({x:"-"+move/2}, time).to({x:"+"+move}, time*2).to({x:"-"+move/2}, time)
        .start();
  }

  addMobileInputs () {
    this.jumpButton = this.add.sprite(430, 130, 'jump');
    this.jumpButton.inputEnabled = true;
    this.jumpButton.events.onInputDown.add(this.jumpPlayer, this);
    this.jumpButton.alpha = 0.5;

    this.moveLeft = false;
    this.moveRight = false;

    this.leftButton = this.add.sprite(10, 130, 'left');
    this.leftButton.inputEnabled = true;
    this.leftButton.events.onInputOver.add(function(){this.moveLeft=true;}, this);
    this.leftButton.events.onInputOut.add(function(){this.moveLeft=false;}, this);
    this.leftButton.events.onInputDown.add(function(){this.moveLeft=true;}, this);
    this.leftButton.events.onInputUp.add(function(){this.moveLeft=false;}, this);
    this.leftButton.alpha = 0.5;

    this.rightButton = this.add.sprite(110, 130, 'right');
    this.rightButton.inputEnabled = true;
    this.rightButton.events.onInputOver.add(function(){this.moveRight=true;}, this);
    this.rightButton.events.onInputOut.add(function(){this.moveRight=false;}, this);
    this.rightButton.events.onInputDown.add(function(){this.moveRight=true;}, this);
    this.rightButton.events.onInputUp.add(function(){this.moveRight=false;}, this);
    this.rightButton.alpha = 0.5;
  }

  render () {
    if (__DEV__) {
    }
  }
}

function unlerpUnclamped(a, b, v) {
  return (v - a) / (b - a);
};
function unlerp(a, b, v) {
  return Math.min(1, Math.max(0, unlerpUnclamped(a, b, v)));
}
function lerp(a, b, u) {
  if (a <= b) {
    return a + (b - a) * u;
  } else {
    return b + (a - b) * (1 - u);
  }
};

/*
 * #########################################################
 * ####                                                 ####
 * ####       EDIT FROM HERE                            ####
 * ####                                                 ####
 * #########################################################
 */
var Drawer = function() {
  this.debug = false;
  this.showMyMessages = true;
  this.showOthersMessages = true;
  this.view = 'LARGE';
};

Drawer.DEFAULT_FRAME_SPEED = 3;
Drawer.COUNTDOWN_DURATION = 3;

Drawer.EASE_OUT = function(t) {
  t--;
  return (t * t * t) + 1;
};

Drawer.prototype.getResources = function() {
  return {
    baseUrl: 'https://cdn-games.codingame.com/coders-strike-back/',
    //    baseUrl : 'http://localhost/tmp/Img/',
    images: {
      backgroundStart: 'background_startscreen.jpg',
      background: 'background.jpg',
      background_leaderboard: 'background_leaderboard.png',
      sandstorm: 'sandstorm.png',
      avatar_leaderboard: 'avatar_leaderboard.png',
      hudLapBackground: 'hud_background_lap.png'
    },
    sprites: ['spritesheet.json'],
    bitmapFonts: ['Font/AmericanCaptain.fnt', 'Font/AmericanCountdown.fnt'],
    others: []
  };
};

Drawer.prototype.getOptions = function() {
  var drawer = this;
  return [{
    get: function() {
      return drawer.debug;
    },
    set: function(value) {
      drawer.debug = value;
      drawer.relaunchAsynchronousAnimations();
    },
    title: 'DEBUG',
    values: {
      'ON': true,
      'OFF': false
    }
  }, {
    get: function() {
      return drawer.showMyMessages;
    },
    set: function(value) {
      drawer.showMyMessages = value;
      drawer.relaunchAsynchronousAnimations();
    },
    title: 'MY MESSAGES',
    values: {
      'ON': true,
      'OFF': false
    }
  }, {
    get: function() {
      return drawer.showOthersMessages;
    },
    set: function(value) {
      drawer.showOthersMessages = value;
      drawer.relaunchAsynchronousAnimations();
    },
    title: 'OTHERS MESSAGES',
    values: {
      'ON': true,
      'OFF': false
    }
  }, {
    get: function() {
      return drawer.view;
    },
    set: function(value) {
      drawer.view = value;
      drawer.relaunchAsynchronousAnimations();
    },
    title: 'VIEW',
    values: {
      'LARGE': 'LARGE',
      'CENTERED': 'CENTERED',
      'ACTION': 'ACTION'
    }
  }];

};

Drawer.requirements = {
  PIXI: 'PIXI3'
};
Drawer.VERSION = 2;

/** Mandatory */
Drawer.prototype.getGameName = function() {
  return "CodersStrikeBack";
};

Drawer.getGameRatio = function() {
  return 1920 / 1080;
};

/** Mandatory */
Drawer.prototype.getBackground = function() {
  return 0xFFFFFF;
};

/** Mandatory */
Drawer.prototype.initPreload = function(scope, container, progress, canvasSize) {
  scope.canvasSize = canvasSize;
  scope.loaderProgress = new Drawer.PIXI.Text("100", {
    font: "900 " + (canvasSize.height * 0.117) + "px Lato",
    fill: "white",
    align: "center"
  });

  scope.loaderProgress.anchor.y = 1;
  scope.loaderProgress.anchor.x = 1.3;
  scope.progress = scope.realProgress = progress;
  scope.loaderProgress.position.y = canvasSize.height;

  scope.progressBar = new Drawer.PIXI.Graphics();
  container.addChild(scope.progressBar);
  container.addChild(scope.loaderProgress);
};
/** Mandatory */
Drawer.prototype.preload = function(scope, container, progress, canvasSize, obj) {
  scope.progress = progress;
};

/** Mandatory */
Drawer.prototype.renderPreloadScene = function(scope, step) {
  var stepFactor = Math.pow(0.998, step);
  scope.realProgress = stepFactor * scope.realProgress + (1 - stepFactor) * scope.progress;
  scope.loaderProgress.text = (scope.realProgress * 100).toFixed(0);
  scope.loaderProgress.position.x = scope.realProgress * scope.canvasSize.width;

  scope.progressBar.clear();

  scope.progressBar.beginFill(0x0, 1);
  scope.progressBar.drawRect(0, 0, scope.canvasSize.width * scope.realProgress + 1, scope.canvasSize.height);
  scope.progressBar.endFill();

  scope.progressBar.beginFill(0x3f4446, 1);
  scope.progressBar.drawRect(scope.canvasSize.width * scope.realProgress, 0, scope.canvasSize.width, scope.canvasSize.height);
  scope.progressBar.endFill();
  return true;
};

Drawer.prototype.initDefaultFrames = function(playerCount, frames, playerMapper, playerNames, avatars, playerTypes) {
  var drawer = this;
  this.playerInfos = playerNames.slice(0, playerCount).map(function(name, index) {
    return {
      name: name || 'Anonymous',
      color: drawer.colors[playerMapper[index]],
      number: index,
      index: playerMapper[index],
      type: playerTypes[index]
    };
  });
  var firstFrame = frames[0];
  this._frames = frames;
  this.playerCount = playerCount;
  this.reasons = [];
  this.frames = [];

  var frameParser = this.getFrameParser();
  this.frames.push(frameParser.parseInputs(this.handleInitFrame(firstFrame), true, this.frames, this.initData, this.playerCount));
  for (var i = 1; i < this._frames.length; ++i) {
    var temp = this._frames[i];
    var header = temp[0].split(" ");
    if (header.length > 2) {
      this.reasons[i] = header[2];
    }
    this.frames.push(frameParser.parseInputs(temp.slice(1, -1), header[0] == 'KEY_FRAME', this.frames, this.initData, this.playerCount));
  }
  this.relaunchAsynchronousAnimations();
  this.currentFrame = -1;
};

/** Mandatory */
Drawer.prototype.initDefaultScene = function(scope, container, canvasSize) {
  var scene = new Drawer.PIXI.Container();
  //  scope.background = Drawer.PIXI.Sprite.fromFrame('backgroundStart');
  //  scene.addChild(scope.background);

  var logo = Drawer.PIXI.Sprite.fromFrame('logoStart');
  logo.anchor.x = logo.anchor.y = 0.5;
  logo.position.x = 1920 / 2;
  logo.position.y = 1080 / 2;
  logo.alpha = 0.5;
  logo.scale.x = logo.scale.y = 3;
  scope.logo = logo;
  scene.addChild(logo);

  scene.scale.x = canvasSize.width / 1880;
  scene.scale.y = canvasSize.height / 1040;

  var demoContainer = new Drawer.PIXI.Container();

  this.initDefaultFrames(Drawer.DEMO.playerCount, Drawer.DEMO.frames, Drawer.DEMO.playerMapper, Drawer.DEMO.playerNames, Drawer.DEMO.avatars, Drawer.DEMO.playerTypes);
  /** **************************************************************************************************************************************** */
  this.initScene(this.initData, this.scope, this.question, demoContainer, this.initSize, this.oversampling, this.frames, this.playerInfos, true);
  this.updateScene(this.scope, this.question, this.frames, 0, this.progress, 1, this.reasons[this.currentFrame], true);
  /** **************************************************************************************************************************************** */

  container.addChild(demoContainer);
  container.addChild(scene);

  scope.demo = demoContainer;
  scope.demotime = 0;
  scope.updateTime = 0;
  scope.frameTime = 0;

  scope.time = 0;
};

/** Mandatory */
Drawer.prototype.renderDefaultScene = function(scope, step) {
  this.currentFrame = this.currentFrameTemp || 0;
  step = Math.min(80, step);

  scope.frameTime += step;
  scope.updateTime += step;
  scope.demotime += step / 1000;

  var animProgress = Math.max(0, Math.min(1, (scope.demotime - 1) / 0.5));
  scope.logo.alpha = animProgress;
  scope.logo.scale.x = scope.logo.scale.y = 3 - animProgress * 2;

  if (scope.demotime > 1.5 && scope.demotime <= 2.2) {
    var amplitude = Math.max(0, 1 - (scope.demotime - 1.5) / 0.7) * 15;
    scope.demo.position.x = (Math.random() * 2 - 1) * amplitude;
    scope.demo.position.y = (Math.random() * 2 - 1) * amplitude;
  } else {
    scope.demo.position.x = scope.demo.position.y = 0;
  }
  var updateInterval = 30;
  var frameInterval = 120;

  if (scope.updateTime >= updateInterval) {
    scope.updateTime -= updateInterval;
    this.progress = unlerp(0, frameInterval, scope.frameTime);
    this.updateScene(this.scope, this.question, this.frames, this.currentFrame, this.progress, 1, this.reasons[this.currentFrame], true);
  }
  if (scope.frameTime >= frameInterval) {
    scope.frameTime -= frameInterval;
    this.currentFrame = (this.currentFrame + this.playerCount) % this.frames.length;
  }
  this.renderScene(this.scope, this.question, this.frames, this.currentFrame, this.progress, 1, this.reasons[this.currentFrame], step, true);

  this.currentFrameTemp = this.currentFrame;
  this.currentFrame = -1;
  return true;
};

/** Mandatory */
Drawer.prototype.getInitDataParser = function(question, playerCount) {
  return {
    parseInputs: function(inputs) {
      var arr;
      arr = inputs[0].split(' ');
      var size = {
        width: parseInt(arr[0]),
        height: parseInt(arr[1])
      };
      var podRadius = parseInt(arr[2]);
      var checkPointRadius = parseInt(arr[3]);
      var podCount = parseInt(arr[4]);
      var maxRotationPerTurn = parseFloat(arr[5]);

      arr = inputs[1].split(' ');
      var checkPoints = [];
      for (var i = 0; i < arr.length; i += 2) {
        checkPoints.push({
          id: i/2,
          x: parseInt(arr[i]),
          y: parseInt(arr[i + 1])
        });
      }

      arr = inputs[2].split(' ');
      var pods = [];
      for (var i = 0; i < arr.length; i += 3) {
        pods.push({
          pid: parseInt(arr[i]),
          x: parseInt(arr[i + 1]),
          y: parseInt(arr[i + 2])
        });
      }
      return {
        size: size,
        checkPoints: checkPoints,
        pods: pods,
        podRadius: podRadius,
        checkPointRadius: checkPointRadius,
        podCount: podCount,
        playerCount: playerCount,
        maxRotationPerTurn: maxRotationPerTurn
      }
    },
    getLineCount: function() {
      return 3;
    }
  };
};

Drawer.prototype.getFrameParser = function() {
  return {
    parseInt: function(val) {
      if (val === 'null') {
        return null;
      } else {
        return parseInt(val);
      }
    },
    parseFloat: function(val) {
      if (val === 'null') {
        return null;
      } else {
        return parseFloat(val);
      }
    },
    parseInputs: function(inputs, keyFrame, previousFrames, initData, playerCount) {
      var i;
      if (keyFrame) {
        
        var previousKeyFrame = null;
        for(i = previousFrames.length ; i >= 0 && !previousKeyFrame; --i) {
          if(previousFrames[i] && previousFrames[i].keyFrame) {
            previousKeyFrame = previousFrames[i];
          }
        }
        
        var pods = [];
        var line = 0;
        for (i = 0; i < initData.podCount; ++i) {
          var splitted = inputs[line].split(' ');
          var pod = {
            position: {
              x: this.parseInt(splitted[0]),
              y: this.parseInt(splitted[1])
            },
            speed: {
              x: this.parseInt(splitted[2]),
              y: this.parseInt(splitted[3])
            },
            power: this.parseInt(splitted[4]),
            dead: splitted[5] == '1',
            target: splitted[6] != 'null' ? {
              x: this.parseInt(splitted[6]),
              y: this.parseInt(splitted[7])
            } : null,
            angle: this.parseFloat(splitted[8]),
            shieldMode: this.parseFloat(splitted[9]),
            nextCheckPoint: initData.checkPoints[this.parseInt(splitted[10])],
            rank: this.parseInt(splitted[11]),
            wayPoints: [],
            lap: previousKeyFrame ? (previousKeyFrame.pods[i].lap) : 0
          };
          if(previousKeyFrame) {
            if(previousKeyFrame.pods[i].nextCheckPoint.id === 0 && pod.nextCheckPoint.id === 1) {
              pod.lap++;
            }
          }
          
          
          line++;
          pod.message = inputs[line].slice(1, -1) || null;
          line++;
          pods.push(pod);
        }
        

        var players = inputs[line++].split(' ').map(function(player) {
          var split = player.split(':');

          return {
            rank: parseInt(split[0]),
            timeout: parseInt(split[1])
          };
        });

        var collisions = [];
        for (; line < inputs.length; ++line) {
          var splitted = inputs[line].split(' ');
          var collision = {
            id: parseInt(splitted[0]),
            time: parseFloat(splitted[1]),
            p1: {
              id: parseInt(splitted[2]),
              x: parseInt(splitted[3]),
              y: parseInt(splitted[4])
            },
            p2: {
              id: parseInt(splitted[5]),
              x: parseInt(splitted[6]),
              y: parseInt(splitted[7])
            },
            force: parseFloat(splitted[8]),
            speed: {
              x: parseInt(splitted[9]),
              y: parseInt(splitted[10])
            }
          };
          collision.center = {
            x: (collision.p1.x + collision.p2.x) / 2,
            y: (collision.p1.y + collision.p2.y) / 2
          };
          collision.angle = Math.atan2(collision.p1.y - collision.p2.y, collision.p1.x - collision.p2.x);

          pods[collision.p1.id].wayPoints.push({
            position: {
              x: collision.p1.x,
              y: collision.p1.y
            },
            time: collision.time
          });
          pods[collision.p2.id].wayPoints.push({
            position: {
              x: collision.p2.x,
              y: collision.p2.y
            },
            time: collision.time
          });

          collisions.push(collision);
        }
        pods.forEach(function(pod) {
          var pos = pod.position;
          var lastTime = 1;
          for (var i = pod.wayPoints.length - 1; i >= 0; i--) {
            var wp = pod.wayPoints[i];
            wp.speed = {
              x: (pos.x - wp.position.x) / (lastTime - wp.time),
              y: (pos.y - wp.position.y) / (lastTime - wp.time)
            };
            pos = wp.position;
            lastTime = wp.time;
          }

        });
        return {
          pods: pods,
          keyFrame: true,
          collisions: collisions,
          players: players,
          lap: Math.max.apply(null, pods.map(function(pod) {
            return pod.lap;
          }))
        };
      }
      return {
        keyFrame: false
      };
    }
  };
};

Drawer.prototype.destroyResources = function(scope) {
  if (scope.toDestroy) {
    scope.toDestroy.forEach(function(item) {
      item.destroy(true);
    });
  }
};

/** Mandatory */
Drawer.prototype.initScene = function(initData, scope, question, container, canvasSize, oversampling, frames, playerInfos, demo) {
  scope.playerInfos = playerInfos;
  scope.endTime = 0;
  scope.config = {
    messageBox: {
      size: {
        width: 2200,
        height: 830
      },
      margin: {
        x: 500,
        y: 200
      }
    },
    map: {
      size: initData.size
    },
    maxRotationPerTurn: initData.maxRotationPerTurn,
    podRadius: initData.podRadius,
    canvasSize: canvasSize
  };

  scope.generateText = function(text, size, color) {
    var captain = canvasSize.width / oversampling > 1200;
    var texttextEl;
    if (captain) {
      var textEl = new Drawer.PIXI.extras.BitmapText(text.toUpperCase(), {
        font: size + 'px AmericanCaptain',
        tint: color
      });
      textEl.lineHeight = size;
    } else {
      var weight = 700;
      textEl = new Drawer.PIXI.Text(text, {
        font: weight + " " + Math.round(size / 1.2) + "px Lato",
        fill: color,
        align: "left"
      });
      textEl.lineHeight = Math.round(size / 1.2);
    }
    return textEl;
  };

  var i, j, k;
  scope.toDestroy = [];
  scope.generateTexture = function(graphics) {
    var texture = graphics.generateTexture();
    this.toDestroy.push(graphics);
    this.toDestroy.push(texture);
    return texture;
  };
  var drawer = this;

  scope.asyncUpdatables = [];
  scope.syncUpdatables = [];

  scope.Particle = function(sprite, direction, defaultScale, duration, onRemove, fadeInDuration, maxOpacity) {
    this.sprite = sprite;
    this.direction = direction;
    this.time = 0;
    this.onRemove = onRemove;
    this.defaultScale = defaultScale;
    this.duration = duration;
    this.fadeInDuration = fadeInDuration;
    this.maxOpacity = maxOpacity;
  };

  scope.Particle.prototype.update = function(step) {
    var _step = step * Math.max(1, scope.speed || 1) * Drawer.DEFAULT_FRAME_SPEED;
    this.time += _step;
    this.sprite.position.x += this.direction.x / (1 + this.time / 2) * _step;
    this.sprite.position.y += this.direction.y / (1 + this.time / 2) * _step;
    this.sprite.scale.x = this.sprite.scale.y = this.defaultScale * ((this.duration - this.time) / this.duration + 1);
    this.sprite.alpha = this.maxOpacity * (1 - this.time / this.duration) * Math.min(1, this.time / this.fadeInDuration);
    if (this.time > this.duration) {
      this.remove();
    }

  };
  scope.Particle.prototype.remove = function() {
    var index = scope.asyncUpdatables.indexOf(this);
    if (index >= 0) {
      scope.asyncUpdatables.splice(index, 1);
    }
    if (this.onRemove) {
      this.onRemove(this.sprite);
    }
  };

  scope.throwParticle = function(texture, position, angle, size, speedVect, particleSpeed, duration, blendMode, fadeInDuration, maxOpacity) {
    var particle;
    var count = Math.max(scope.speed || 1, 1);
    for (var i = 0; i < count; i++) {
      particle = new Drawer.PIXI.Sprite(texture);
      particle.anchor.x = particle.anchor.y = 0.5;
      particle.position = new Drawer.PIXI.Point(position.x + 10 - Math.random() * 20, position.y + 10 - Math.random() * 20);
      particle.blendMode = (blendMode !== undefined) ? blendMode : Drawer.PIXI.BLEND_MODES.ADD;
      scope.particleContainer.addChild(particle);
      //      particleSpeed = particleSpeed * (Math.random()/2 + 0.75);

      var particleManager = new scope.Particle(particle, {
        x: Math.cos(angle) * particleSpeed + speedVect.x * 2 * Math.min(scope.speed, 1),
        y: Math.sin(angle) * particleSpeed + speedVect.y * 2 * Math.min(scope.speed, 1)
      }, size, duration || 1, function(particle) {
        scope.particleContainer.removeChild(particle);
      }, fadeInDuration || 0, maxOpacity || 1);
      scope.asyncUpdatables.push(particleManager);
      particleManager.update(i);
    }

  };

  scope.scale = canvasSize.width / initData.size.width;

  var background = Drawer.PIXI.Sprite.fromFrame('background');
  background.width = initData.size.width;
  background.height = initData.size.height;

  var checkPoints = new Drawer.PIXI.Container();

  //  var checkPointG = new Drawer.PIXI.Graphics();
  //  checkPointG.beginFill(0xff00000);
  //  checkPointG.drawCircle(0, 0, initData.checkPointRadius);
  //  checkPointG.endFill();
  //  var checkPointTexture = scope.generateTexture(checkPointG);

  var balls = [{
    prefix: 'orange-ball-',
    count: 36
  }, {
    prefix: 'pink-ball-',
    count: 47
  }].map(function(config) {
    var list = [];
    for (var i = 0; i < config.count; ++i) {
      list.push(config.prefix + i);
    }
    return list;
  });

  scope.checkPointsOverlay = new Drawer.PIXI.Container();

  scope.checkPoints = initData.checkPoints;
  initData.checkPoints.forEach(function(checkPoint, index) {
    var previousIndex = (index + initData.checkPoints.length - 1) % initData.checkPoints.length;
    var nextIndex = (index + 1) % initData.checkPoints.length;
    var angle1 = Math.atan2(initData.checkPoints[previousIndex].y - checkPoint.y, initData.checkPoints[previousIndex].x - checkPoint.x);
    var angle2 = Math.atan2(initData.checkPoints[nextIndex].y - checkPoint.y, initData.checkPoints[nextIndex].x - checkPoint.x);

    var gcheckPoint = new Drawer.PIXI.Container();

    var signalSprite = Drawer.PIXI.Sprite.fromFrame('signal');
    signalSprite.anchor.x = 1.12;
    signalSprite.anchor.y = 0.1;
    gcheckPoint.addChild(signalSprite);

    var checkpointSprite = Drawer.PIXI.Sprite.fromFrame('checkpoint');
    checkpointSprite.anchor.x = 0.415;
    checkpointSprite.anchor.y = 0.435;
    gcheckPoint.addChild(checkpointSprite);

    if (index <= 0) {
      var visual = Drawer.PIXI.Sprite.fromFrame('checkpointVisualStart');
      visual.anchor.x = visual.anchor.y = 0.5;
      gcheckPoint.addChild(visual);
    } else {
      var visual = Drawer.PIXI.Sprite.fromFrame('checkpointVisual');
      visual.anchor.x = visual.anchor.y = 0.5;
      gcheckPoint.addChild(visual);
      scope.asyncUpdatables.push({
        sprite: visual,
        random: Math.random() * 2 - 1,
        update: function(sstep) {
          this.sprite.rotation += this.random * sstep * Math.PI / 2;
        }
      });
    }

    var createBalls = function(textures) {
      var balls = Drawer.PIXI.extras.MovieClip.fromFrames(textures);
      balls.anchor.x = balls.anchor.y = 0.5;
      balls.animationSpeed = 1;
      balls.play();
      balls.scale.x = balls.scale.y = 1;
      balls.blendMode = Drawer.PIXI.BLEND_MODES.ADD;
      return balls;
    };

    var balls1 = createBalls(balls[0]);
    balls1.position.x = -252;
    balls1.position.y = 95;
    balls1.alpha = 0;
    gcheckPoint.addChild(balls1);

    var balls2 = createBalls(balls[1]);
    balls2.position.x = -165;
    balls2.position.y = 95;
    balls2.alpha = 0;
    gcheckPoint.addChild(balls2);

    checkPoint.indicators = [balls1, balls2];

    gcheckPoint.position.x = checkPoint.x;
    gcheckPoint.position.y = checkPoint.y;
    gcheckPoint.scale.x = gcheckPoint.scale.y = initData.checkPointRadius / 98;

    var checkPointBoundsG = new Drawer.PIXI.Graphics();
    checkPointBoundsG.lineStyle(15, 0xffffff);
    checkPointBoundsG.drawCircle(0, 0, initData.checkPointRadius);

    var checkPointBoundsContainer = new Drawer.PIXI.Container();
    checkPointBoundsContainer.position.x = checkPoint.x;
    checkPointBoundsContainer.position.y = checkPoint.y;
    var checkPointBounds = new Drawer.PIXI.Sprite(scope.generateTexture(checkPointBoundsG));
    checkPointBounds.anchor.x = checkPointBounds.anchor.y = 0.5;
    checkPointBoundsContainer.addChild(checkPointBounds)
    checkPoint.checkPointBounds = checkPointBoundsContainer;

    if (!demo) {
      var checkPointPositionText = new Drawer.PIXI.Text('(' + checkPoint.x + ', ' + checkPoint.y + ')', {
        font: "700 22px Lato",
        fill: "white"
      });
      checkPointPositionText.anchor.x = 0.5;
      checkPointPositionText.anchor.y = 0;
      checkPointPositionText.position.y = 180;
      checkPointPositionText.scale.x = checkPointPositionText.scale.y = 7;
      checkPointBoundsContainer.addChild(checkPointPositionText);
      scope.checkPointsOverlay.addChild(checkPointBoundsContainer);
    }

    var number = scope.generateText(index.toString(), 72, 0xffffff);
    number.scale.x = number.scale.y = 1.2;
    number.alpha = 0;
    if (index > 0) {
      scope.asyncUpdatables.push({
        time: 0,
        minTime: index / 4,
        fadeDuration: 0.5,
        text: number,
        update: function(sstep) {
          this.time += sstep;
          var rtime = this.time - this.minTime;
          if (rtime > 0) {
            if (rtime <= this.fadeDuration) {
              this.text.alpha = rtime / this.fadeDuration;
            } else {
              this.text.alpha = 1;
              return true;
            }
          }
        }
      });
    }

    checkPoint.number = number;

    number.scale.x = number.scale.y = initData.checkPointRadius / 98;

    number.position.x = checkPoint.x - (number.width / 2 * number.scale.x) / number.scale.x;
    number.position.y = checkPoint.y - (number.height / 2 * number.scale.y) / number.scale.y;
    scope.checkPointsOverlay.addChild(number);

    checkPoints.addChild(gcheckPoint);

  });

  scope.particleContainer = new Drawer.PIXI.Container();

  scope.graphics = {
    pods: []
  };

  var podConfigs = [{
    linkPosition: -200,
    linkScale: 1.4,
    enginePosition: {
      x: 80,
      y: 80
    },
    engineImgAnchor: {
      x: 0.5,
      y: 0.46
    },
    engineImgPosition: {
      x: 80,
      y: -250
    },
    engineParticlePosition: {
      x: 160,
      y: -100
    },
    linkShift: 90
  }, {
    linkPosition: -60,
    linkScale: 1.5,
    enginePosition: {
      x: 80,
      y: 110
    },
    engineImgAnchor: {
      x: 0.6,
      y: 0.75
    },
    engineImgPosition: {
      x: 90,
      y: -160
    },
    engineParticlePosition: {
      x: 170,
      y: 20
    },
    linkShift: 50
  }];

  scope.pods = [];
  scope.players = [];

  scope.messageLayer = new Drawer.PIXI.Container();

  scope.podsContainer = new Drawer.PIXI.Container();
  initData.pods.forEach(function(pod, index) {

    var podc = new Drawer.PIXI.Container();

    if (!demo) {
      var debugShield = new Drawer.PIXI.Graphics();
      debugShield.lineStyle(initData.podRadius / 10, playerInfos[pod.pid].color);
      debugShield.drawCircle(0, 0, initData.podRadius);
      debugShield.lineStyle(Math.ceil(1 / scope.scale), playerInfos[pod.pid].color);
      debugShield.moveTo(-initData.podRadius, 0);
      debugShield.lineTo(initData.podRadius, 0);
      debugShield.moveTo(0, initData.podRadius);
      debugShield.lineTo(0, -initData.podRadius);
      var debugShieldTexture = scope.generateTexture(debugShield);

      var debugShieldSprite = new Drawer.PIXI.Sprite(debugShieldTexture);
      debugShieldSprite.anchor.x = debugShieldSprite.anchor.y = 0.5;
      podc.addChild(debugShieldSprite);

      var debugGhostShieldSprite = new Drawer.PIXI.Sprite(debugShieldTexture);
      debugGhostShieldSprite.alpha = 0.5;
      debugGhostShieldSprite.anchor.x = debugGhostShieldSprite.anchor.y = 0.5;
      scope.podsContainer.addChild(debugGhostShieldSprite);
    }

    var podScale = initData.podRadius * 2 / 180;

    var podConfig = podConfigs[pod.pid % 2];
    var shield = Drawer.PIXI.Sprite.fromFrame('player' + (pod.pid % 2 + 1) + 'Shield');
    shield.anchor.x = shield.anchor.y = 0.5;
    shield.scale.x = shield.scale.y = initData.podRadius * 2 / shield.height;
    podc.addChild(shield);

    var link = new Drawer.PIXI.extras.MovieClip(['player' + (pod.pid % 2 + 1) + 'Link1', 'player' + (pod.pid % 2 + 1) + 'Link2', 'player' + (pod.pid % 2 + 1) + 'Link3', 'player' + (pod.pid % 2 + 1) + 'Link4'].map(function(frame) {
      return Drawer.PIXI.Texture.fromFrame(frame);
    }));
    link.blendMode = Drawer.PIXI.BLEND_MODES.ADD;
    link.play();
    link.animationSpeed = 0.5;
    link.anchor.x = link.anchor.y = 0.5;
    link.position.y = podConfig.linkPosition;
    link.scale.x = link.scale.y = podScale * podConfig.linkScale;
    podc.addChild(link);

    var leftEngine = new Drawer.PIXI.Container();
    leftEngine.position.x = -podConfig.enginePosition.x;
    leftEngine.position.y = podConfig.enginePosition.y;

    var leftEngineImg = Drawer.PIXI.Sprite.fromFrame('player' + (pod.pid % 2 + 1) + 'LeftEngine');
    leftEngineImg.anchor.x = 1 - podConfig.engineImgAnchor.x;
    leftEngineImg.anchor.y = podConfig.engineImgAnchor.y;
    leftEngineImg.position.x = 1 - podConfig.engineImgPosition.x;
    leftEngineImg.position.y = podConfig.engineImgPosition.y;
    leftEngineImg.scale.x = leftEngineImg.scale.y = podScale;
    leftEngine.addChild(leftEngineImg);

    var leftLineGraphics = new Drawer.PIXI.Graphics();
    leftLineGraphics.lineStyle(1 / scope.scale);
    leftLineGraphics.moveTo(0, 0);
    leftLineGraphics.lineTo(-podConfig.engineImgPosition.x, podConfig.engineImgPosition.y);
    leftEngine.addChild(leftLineGraphics);

    podc.addChild(leftEngine);

    var rightEngine = new Drawer.PIXI.Container();
    rightEngine.position.x = podConfig.enginePosition.x;
    rightEngine.position.y = podConfig.enginePosition.y;

    var rightEngineImg = Drawer.PIXI.Sprite.fromFrame('player' + (pod.pid % 2 + 1) + 'RightEngine');
    rightEngineImg.anchor.x = podConfig.engineImgAnchor.x;
    rightEngineImg.anchor.y = podConfig.engineImgAnchor.y;
    rightEngineImg.position.x = podConfig.engineImgPosition.x;
    rightEngineImg.position.y = podConfig.engineImgPosition.y;
    rightEngineImg.scale.x = rightEngineImg.scale.y = podScale;
    rightEngine.addChild(rightEngineImg);

    var rightLineGraphics = new Drawer.PIXI.Graphics();
    rightLineGraphics.lineStyle(1 / scope.scale);
    rightLineGraphics.moveTo(0, 0);
    rightLineGraphics.lineTo(podConfig.engineImgPosition.x, podConfig.engineImgPosition.y);
    rightEngine.addChild(rightLineGraphics);

    podc.addChild(rightEngine);

    var cockpit = Drawer.PIXI.Sprite.fromFrame('player' + (pod.pid % 2 + 1) + 'Cockpit');
    cockpit.anchor.x = 0.5;
    cockpit.anchor.y = -0.1;
    cockpit.scale.x = cockpit.scale.y = podScale;
    podc.addChild(cockpit);

    var podContainer = new Drawer.PIXI.Container();
    podContainer.steer = function(rotation) {
      this.link.alpha = 1;
      this.rightEngine.scale.y = this.rightEngine.scale.x = this.leftEngine.scale.y = this.leftEngine.scale.x = 1;
      this.rightEngineImg.scale.x = this.rightEngineImg.scale.y = this.leftEngineImg.scale.x = this.leftEngineImg.scale.y = podScale;

      this.link.position.x = rotation * this.config.linkShift;
      this.leftEngine.rotation = rotation * Math.PI / 12;
      this.rightEngine.rotation = rotation * Math.PI / 12;

      if (rotation < 0) {
        this.leftEngineImg.rotation = rotation * Math.PI / 15;
        this.rightEngineImg.rotation = 0;
      } else {
        this.rightEngineImg.rotation = rotation * Math.PI / 15;
        this.leftEngineImg.rotation = 0;
      }
    };

    podContainer.deathAnimation = function(progress) {
      var _progress = Math.sqrt(progress);
      this.rightEngine.scale.y = this.rightEngine.scale.x = this.leftEngine.scale.y = this.leftEngine.scale.x = 1 - progress / 2;
      this.rightEngineImg.scale.x = this.rightEngineImg.scale.y = this.leftEngineImg.scale.x = this.leftEngineImg.scale.y = 1 / this.leftEngine.scale.y * podScale;
      this.link.alpha = 1 - _progress;
      this.cockpit.position.y = -_progress * 120;
      //      
      //      this.cockpit.rotation = _progress * Math.PI/5;

      //      this.leftEngine.rotation = _progress * -Math.PI/12;
      //      this.rightEngine.rotation = _progress * Math.PI/3;
      //      this.leftEngineImg.rotation = _progress * -Math.PI*2
      //      this.rightEngineImg.rotation = _progress * Math.PI*1.23
    };

    if (!scope.players[pod.pid]) {
      scope.players[pod.pid] = {
        pods: []
      };
    }

    var podSpeedVector = new Drawer.PIXI.Graphics();
    podSpeedVector.setSpeed = function(speedVect) {
      var speed = Math.sqrt(speedVect.x * speedVect.x + speedVect.y * speedVect.y);

      this.rotation = Math.atan2(speedVect.y, speedVect.x);

      this.clear();
      this.lineStyle(30, 0x22a1e4);
      this.moveTo(0, 0);
      this.lineTo(speed, 0);
      this.moveTo(speed - 50, 0);
      this.lineTo(speed - 50, -50);
      this.lineTo(speed, 0);
      this.lineTo(speed - 50, 50);
      this.lineTo(speed - 50, 0);
    };

    podContainer.leftEngine = leftEngine;
    podContainer.rightEngine = rightEngine;
    podContainer.leftEngineImg = leftEngineImg;
    podContainer.rightEngineImg = rightEngineImg;
    podContainer.leftLineGraphics = leftLineGraphics;
    podContainer.rightLineGraphics = rightLineGraphics;
    podContainer.link = link;
    podContainer.cockpit = cockpit;
    podContainer.config = podConfig;
    podContainer.podc = podc;
    podContainer.podSpeedVector = podSpeedVector;
    podContainer.addChild(podc);
    podContainer.addChild(podSpeedVector);

    if (!demo) {
      podContainer.interactive = true;
      podContainer.mouseover = function() {
        if(scope.pods[index].debugHud) {
          scope.pods[index].debugHud.highLightBackground.visible = true;
          drawer.relaunchAsynchronousAnimations();
        }
      };
      podContainer.mouseout = function(mouseData) {
        if (scope.pods[index].debugHud) {
          scope.pods[index].debugHud.highLightBackground.visible = false;
          drawer.relaunchAsynchronousAnimations();
        }
      }

      var messageContainer = new Drawer.PIXI.Container();
      var messageBackground = Drawer.PIXI.Sprite.fromFrame('messagesBackground');
      messageBackground.anchor.x = messageBackground.anchor.y = 0.5;
      messageContainer.addChild(messageBackground);

      var avatar = new Drawer.PIXI.Sprite(playerInfos[pod.pid].avatar);
      avatar.anchor.x = avatar.anchor.y = 0.5;
      avatar.width = avatar.height = 84;
      avatar.position.x = -89;
      messageContainer.addChild(avatar);
      var messageText = new Drawer.PIXI.Text("", {
        font: "700 22px Lato",
        fill: "white",
        align: "left",
        wordWrap: true,
        wordWrapWidth: 180
      });

      messageText._wordWrap = messageText.wordWrap;
      messageText.wordWrap = function(text) {
        var wordWrapWidth = this._style.wordWrapWidth;
        var self = this;
        text = text.replace(/\w+/g, function(text) {
          if (self.context.measureText(text).width > wordWrapWidth) {
            var list = [];
            while (text.length > 0) {
              var length = 1;
              while (length <= text.length && self.context.measureText(text.slice(0, length)).width < wordWrapWidth) {
                length++;
              }
              list.push(text.slice(0, length - 1));
              text = text.slice(length - 1);
            }
            return list.join('
');
          }
          return text;
        });
        return this._wordWrap(text);
      };

      messageText.position.x = -40;
      messageText.anchor.x = 0;
      messageText.anchor.y = 0.5;
      messageContainer.update = function() {
        this.position.x = this.pod.x;
        this.position.y = this.pod.y + 100 * this.scale.y;
      };
      scope.asyncUpdatables.push(messageContainer);
      messageContainer.pod = podContainer;
      messageContainer.addChild(messageText);
      messageContainer.scale.x = scope.config.messageBox.size.width / messageContainer.width;
      messageContainer.scale.y = scope.config.messageBox.size.height / messageContainer.height;

      scope.messageLayer.addChild(messageContainer);

      var podNumber = new Drawer.PIXI.Text('0' + (scope.players[pod.pid].pods.length + 1).toString(), {
        font: "700 36px Lato",
        fill: playerInfos[pod.pid].color,
        stroke: 0x000000,
        strokeThickness: 2
      });
      podNumber.position.x = initData.podRadius / 2;
      podNumber.position.y = -initData.podRadius / 2;
      podNumber.anchor.x = podNumber.anchor.y = 0.5;
      podNumber.scale.x = podNumber.scale.y = 5;
      podContainer.addChild(podNumber);
    }
    var dpod = {
      deathTime: null,
      id: index,
      playerInfo: playerInfos[pod.pid],
      pid: pod.pid,
      graphics: podContainer,
      messageBox: messageContainer,
      messageText: messageText,
      shield: shield,
      debugShield: debugShieldSprite,
      debugGhostShield: debugGhostShieldSprite,
      podNumber: podNumber
    };
    scope.players[pod.pid].pods.push(dpod);
    scope.pods.push(dpod);
    dpod.targetOrientation = dpod.orientation = 0;

    scope.podsContainer.addChild(podContainer);
  });

  var collisionContainer = new Drawer.PIXI.Container();

  var previousKeyFrame = frames[0];
  var currentKeyFrame = frames[0];
  var keyFrameIndex = 0;

  frames.forEach(function(frame, frameIndex) {
    if (frame.keyFrame) {
      currentKeyFrame = frame;
    }
    frame.keyFrameIndex = keyFrameIndex;
    frame.previousKeyFrame = previousKeyFrame;
    frame.currentKeyFrame = currentKeyFrame;
    if (frame.keyFrame) {
      frame.collisions.forEach(function(collision) {
        var impact = new Drawer.PIXI.ParticleContainer();
        impact.position.x = collision.center.x;
        impact.position.y = collision.center.y;
        var particles = [];
        var particleCount = Math.sqrt(collision.force);
        for (var k = 0; k < particleCount; k++) {
          var particle = new Drawer.PIXI.Sprite.fromFrame('impactParticle');
          particle.anchor.x = particle.anchor.y = 0.5;
          particle.scale.x = particle.scale.y = 2 + Math.random() * 5;
          particle.speed = Math.random() * 800;
          particle.blendMode = Drawer.PIXI.BLEND_MODES.ADD;

          var random = Math.sqrt(Math.random()) * Math.PI / 5;
          if (Math.random() < 0.5) {
            random = -random;
          }
          var angle = ((Math.random() < 0.5) ? Math.PI : 0);

          var rotation = collision.angle + Math.PI / 2 + angle + random;
          particle.cos = Math.cos(rotation);
          particle.sin = Math.sin(rotation);
          particle.rotation = rotation + Math.PI / 2;
          impact.addChild(particle);
          particles.push(particle);
        }

        scope.syncUpdatables.push({
          impact: impact,
          time: keyFrameIndex + collision.time,
          particles: particles,
          min: -0.2,
          max: 2,
          collision: collision,
          speed: collision.speed,
          update: function(time) {
            var diff = time - this.time;
            this.impact.visible = (diff > this.min) && (diff < this.max);
            this.impact.position.x = collision.center.x + collision.speed.x * diff;
            this.impact.position.y = collision.center.y + collision.speed.y * diff;
            if (this.impact.visible) {
              if (diff < 0) {
                this.impact.alpha = (this.min - diff) / this.min;
              } else {
                this.impact.alpha = (this.max - diff) / this.max;
              }
              var progress = (diff - this.min) / (this.max - this.min);
              this.particles.forEach(function(particle) {
                particle.position.x = progress * particle.speed * particle.cos;
                particle.position.y = progress * particle.speed * particle.sin;
              });
            }
          }
        });

        collisionContainer.addChild(impact);

      });

      frame.pods.forEach(function(pod, index) {
        var previousPod = previousKeyFrame.pods[index];
        if (pod.dead && scope.pods[index].deathTime == null) {
          scope.pods[index].deathTime = keyFrameIndex;
        }

        if (pod.angle == null) {
          if (pod.target) {
            if (pod.target.x !== previousPod.position.x || pod.target.y !== previousPod.position.y) {
              pod.angle = Math.atan2(pod.target.y - previousPod.position.y, pod.target.x - previousPod.position.x);
            } else {
              pod.angle = previousPod.angle || 0;
              pod.power = 0;
            }
          } else {
            pod.angle = Math.atan2(pod.nextCheckPoint.y - pod.position.y, pod.nextCheckPoint.x - pod.position.x);
          }
        }

        if (previousPod.nextCheckPoint !== pod.nextCheckPoint) {
          pod.capturedCheckPoint = previousPod.nextCheckPoint;
        }
      });

      previousKeyFrame = frame;
    }

    if (frame.keyFrame) {
      keyFrameIndex++;
    }
  });

  var bestPod = null;
  var bestPodId = 0;
  frames[frames.length - 1].pods.forEach(function(pod, index) {
    if (playerInfos[scope.pods[index].pid].isMe && (!bestPod || pod.rank < bestPod.rank)) {
      bestPod = pod;
      bestPodId = index;
    }
  });
  scope.pods[bestPodId].winner = true;

  scope.targetGraphics = new Drawer.PIXI.Graphics();

  var createPodHud = function(index, playerInfo, pod) {
    var podHud = new Drawer.PIXI.Container();

    var podName = scope.generateText('POD_0' + (index + 1), 25, playerInfo.color);
    podHud.addChild(podName);

    var podRank = scope.generateText('1ST', 25, 0xffffff);
    podRank.position.x = podName.width + 5;
    podHud.addChild(podRank);

    pod.hud = {
      rank: podRank
    };
    return podHud;
  };

  if (!demo && scope.players.length > 1) {
    var createHud = function(playerInfo, player) {
      var hud = new Drawer.PIXI.Container();
      var hudBackGround = Drawer.PIXI.Sprite.fromFrame('hudP' + (playerInfo.index % 2 + 1));
      hud.addChild(hudBackGround);

      var hudRank = scope.generateText('1ST', 32, 0xffffff);
      hudRank.position.x = 85;
      hudRank.position.y = 15;
      hud.addChild(hudRank);

      var hudName = scope.generateText(playerInfo.name, 32, playerInfo.color);
      hudName.position.x = 85;
      hudName.position.y = 45;
      hud.addChild(hudName);

      var hudAvatar = new Drawer.PIXI.Sprite(playerInfo.avatar);
      hudAvatar.width = hudAvatar.height = 63;
      hudAvatar.position.x = hudAvatar.position.y = 14;
      hud.addChild(hudAvatar);

      player.hud = {
        name: hudName,
        rank: hudRank,
        pods: []
      };

      var height = 10;
      player.pods.forEach(function(pod, index) {
        var hudPod = createPodHud(index, playerInfo, pod);
        hudPod.position.x = 85;
        hudPod.position.y = 95 + height;

        height += hudPod.height + 5;
        hud.addChild(hudPod);
      });

      return hud;
    };

    var hudDebugBackgroundG = new Drawer.PIXI.Graphics();
    hudDebugBackgroundG.beginFill(0x000000);
    hudDebugBackgroundG.drawRect(0, 0, 1, 1);
    hudDebugBackgroundG.endFill();
    var hudDebugBackgroundTexture = scope.generateTexture(hudDebugBackgroundG);

    var hudDebugHighlightBackgroundG = new Drawer.PIXI.Graphics();
    hudDebugHighlightBackgroundG.beginFill(0xff0000);
    hudDebugHighlightBackgroundG.drawRect(0, 0, 1, 1);
    hudDebugHighlightBackgroundG.endFill();
    var hudDebugHighlightBackgroundTexture = scope.generateTexture(hudDebugHighlightBackgroundG);

    var createPlayerDebugHud = function(player, playerInfo) {
      var container = new Drawer.PIXI.Container();

      var hudDebugBackground = new Drawer.PIXI.Sprite(hudDebugBackgroundTexture);
      hudDebugBackground.alpha = 0.5;
      container.addChild(hudDebugBackground);

      var timeout = new Drawer.PIXI.Text('Timeout: 100', {
        font: '900 25px Inconsolata',
        fill: 'white',
        align: 'left'
      });
      container.addChild(timeout);
      player.debugHud = {
        timeout: timeout
      };
      player.pods.forEach(function(pod, index) {
        var hud = createPodDebugHud(playerInfo, pod, index);
        hud.position.y = index * 120 + 35;
        container.addChild(hud);
      });

      hudDebugBackground.width = container.width + 40;
      hudDebugBackground.height = container.height + 40;
      hudDebugBackground.position.x = -20;
      hudDebugBackground.position.y = -20;
      return container;
    };
    var createPodDebugHud = function(playerInfo, pod, index) {
      var container = new Drawer.PIXI.Container();

      var highLightBackground = new Drawer.PIXI.Sprite(hudDebugHighlightBackgroundTexture);
      container.addChild(highLightBackground);

      var name = new Drawer.PIXI.Text('POD_0' + (index + 1), {
        font: '900 18px Inconsolata',
        fill: playerInfo.color,
        align: 'left'
      });
      container.addChild(name);
      var position = new Drawer.PIXI.Text('Position: 00000, 0000', {
        font: '900 25px Inconsolata',
        fill: 'white',
        align: 'left'
      });
      position.position.y = 20;
      container.addChild(position);
      var speed = new Drawer.PIXI.Text('Speed:    00000, 0000', {
        font: '900 25px Inconsolata',
        fill: 'white',
        align: 'left'
      });
      speed.position.y = 45;
      container.addChild(speed);
      var target = new Drawer.PIXI.Text('Target:   00000, 0000', {
        font: '900 25px Inconsolata',
        fill: 'white',
        align: 'left'
      });
      target.position.y = 70;
      container.addChild(target);

      pod.debugHud = {
        position: position,
        speed: speed,
        target: target,
        highLightBackground: highLightBackground
      };

      highLightBackground.alpha = 0.5;
      highLightBackground.visible = false;
      highLightBackground.position.x = -5;
      highLightBackground.position.y = -5;
      highLightBackground.width = container.width;
      highLightBackground.height = container.height + 10;

      return container;
    };

    scope.hudDebug = new Drawer.PIXI.Container();

    scope.players.forEach(function(player, index) {
      var hud = createPlayerDebugHud(player, playerInfos[index]);
      hud.position.y = 20 + index * 180 + (index + 1) * 220 + 110;
      hud.position.x = 20;
      scope.hudDebug.addChild(hud);
    });

    scope.hudDebug.position.x = 1920 / 60;
    scope.hudDebug.position.y = 0;

    var hud = new Drawer.PIXI.Container();
    hud.addChild(scope.hudDebug);
    
    var hudLaps = new Drawer.PIXI.Container();
    hudLaps.position.x = hudLaps.position.y = 1920 / 60;
    hudLaps.addChild(Drawer.PIXI.Sprite.fromFrame('hudLapBackground'));
    var lap = new Drawer.PIXI.extras.BitmapText('LAP 1 / 3', {
      font: "60px AmericanCaptain"
    });
    scope.graphics.lapText = lap;
    lap.position.y = (98 - lap.height) / 2 - 5;
    lap.position.x = 90;
    hudLaps.addChild(lap);
    hud.addChild(hudLaps);
    
    scope.players.forEach(function(player, index) {
      var phud = createHud(playerInfos[index], player);
      hud.addChild(phud);

      scope.asyncUpdatables.push({
        position: {
          x: 1920 / 60,
          y: 190 * index + 1920 / 60 + 110
        },
        debugPosition: {
          x: 1920 / 60,
          y: 400 * index + 1920 / 60 + 110
        },
        update: function(step, stepFactor) {
          if (drawer.debug) {
            phud.position.x = phud.position.x * stepFactor + this.debugPosition.x * (1 - stepFactor);
            phud.position.y = phud.position.y * stepFactor + this.debugPosition.y * (1 - stepFactor);
          } else {
            phud.position.x = phud.position.x * stepFactor + this.position.x * (1 - stepFactor);
            phud.position.y = phud.position.y * stepFactor + this.position.y * (1 - stepFactor);
          }

        }
      });
    });

    hud.scale.x = canvasSize.width / 1920;
    hud.scale.y = canvasSize.height / 1080;
    
    
    var hudScale = new Drawer.PIXI.Container();
    var hudScaleValue = new Drawer.PIXI.Text("1000", {
      font: "900 25px Inconsolata",
      fill: "white"
    });
    hudScaleValue.anchor.y = 0.5;
    hudScale.addChild(hudScaleValue);
    
    var hugScaleGraphics = new Drawer.PIXI.Graphics();
    hugScaleGraphics.lineStyle(5, 0xffffff, 1);
    hugScaleGraphics.moveTo(0, -5);
    hugScaleGraphics.lineTo(0, 5);
    hugScaleGraphics.lineTo(1920 / scope.config.map.size.width * 1000, 5);
    hugScaleGraphics.lineTo(1920 / scope.config.map.size.width * 1000, -5);
    hugScaleGraphics.position.x = hudScaleValue.width + 10;
    hudScale.addChild(hugScaleGraphics);

    hudScale.position.x = 1920 - hudScale.width - 10;
    hudScale.position.y = 1080 - hudScale.height;
    hud.addChild(hudScale);
  }
  var map = new Drawer.PIXI.Container();
  map.scale.x = canvasSize.width / initData.size.width;
  map.scale.y = canvasSize.height / initData.size.height;
  if (!demo) {
    var debugMaskG = new Drawer.PIXI.Graphics();
    debugMaskG.beginFill(0x20252a, 1);
    debugMaskG.drawRect(0, 0, 1, 1);
    debugMaskG.endFill();
    scope.debugMask = new Drawer.PIXI.Sprite(scope.generateTexture(debugMaskG));
    scope.debugMask.position.x = -initData.size.width;
    scope.debugMask.position.y = -initData.size.height;
    scope.debugMask.width = initData.size.width * 3;
    scope.debugMask.height = initData.size.height * 3;
    scope.debugMask.alpha = 0;

    scope.podTargetLayout = new Drawer.PIXI.Graphics();
  }
  map.addChild(background);

  for (var x = -1; x <= 1; ++x) {
    for (var y = -1; y <= 1; ++y) {
      if (x != 0 || y != 0) {
        var background = Drawer.PIXI.Sprite.fromFrame('background');
        background.width = initData.size.width;
        background.height = initData.size.height;
        if (x != 0) {
          background.scale.x *= -1;
        }
        if (y != 0) {
          background.scale.y *= -1;
        }
        if (x > 0) {
          background.anchor.x = 2;
        }
        if (y > 0) {
          background.anchor.y = 2;
        }
        map.addChild(background);
      }
    }
  }

  //  map.pivot.x = 8000;
  //  map.pivot.y = 4500;
  //  map.position.x = canvasSize.width/2;
  //  map.position.y = canvasSize.height/2;
  //  map.scale.x /=2;
  //  map.scale.y /=2; 
  map.addChild(checkPoints);
  if (!demo) {
    map.addChild(scope.debugMask);
  }
  map.addChild(scope.checkPointsOverlay);
  map.addChild(scope.particleContainer);
  map.addChild(scope.podsContainer);
  if (!demo) {
    map.addChild(scope.podTargetLayout);
  }
  map.addChild(collisionContainer);
  map.addChild(scope.targetGraphics);
  if (!demo) {
    map.addChild(scope.messageLayer);
  }
  scope.map = map;

  scope.mapContainer = new Drawer.PIXI.Container();
  scope.mapContainer.addChild(map);

  //  scope.mapContainer.scale.x = scope.mapContainer.scale.y = 1.1;

  scope.game = new Drawer.PIXI.Container();
  scope.game.addChild(scope.mapContainer);
  if (!demo && hud) {
    scope.game.addChild(hud);
  }
  container.addChild(scope.game);

  scope.tooltip = new Drawer.PIXI.Container();
  var tooltipBackgroundGraphics = new Drawer.PIXI.Graphics();
  tooltipBackgroundGraphics.beginFill(0x20252a, 1);
  tooltipBackgroundGraphics.drawRect(0, 0, 1, 1);
  tooltipBackgroundGraphics.endFill();
  var tooltipBackgroundSprite = new Drawer.PIXI.Sprite(scope.generateTexture(tooltipBackgroundGraphics));
  tooltipBackgroundSprite.alpha = 0.7;
  scope.tooltip.addChild(tooltipBackgroundSprite);

  var tooltipText = new Drawer.PIXI.Text("00000, 0000", {
    font: "900 22px Inconsolata",
    fill: "white"
  });
  tooltipBackgroundSprite.width = tooltipText.width + 20;
  tooltipBackgroundSprite.height = tooltipText.height + 6;
  tooltipText.position.x = 5;
  tooltipText.position.y = 3;
  scope.tooltip.addChild(tooltipText);

  container.addChild(scope.tooltip);
  container.interactive = true;
  scope.tooltip.visible = false;
  container.mousemove = function(event) {
    if (drawer.debug) {
      var point = event.data.getLocalPosition(scope.map);
      if (point.x < 0 || point.x >= scope.config.map.size.width || point.y < 0 || point.y >= scope.config.map.size.height ) {
        scope.tooltip.visible = false;
        return;
      }

      scope.tooltip.visible = true;
      tooltipText.text = Drawer.tools.zeroPad(point.x, 5) + ', ' + Drawer.tools.zeroPad(point.y, 5);
      var position = event.data.getLocalPosition(container);
      scope.tooltip.position.x = Math.max(0, Math.min(canvasSize.width - scope.tooltip.width, position.x + 10));
      scope.tooltip.position.y = Math.max(0, Math.min(canvasSize.height - scope.tooltip.height, position.y + 10));
      drawer.relaunchAsynchronousAnimations();
    } else {
      scope.tooltip.visible = false;
    }
  };


  
  if (!demo) {
    
    if (playerInfos.length > 1) {
      var endScene = this.createEndScene(initData, scope);
      endScene.scale.x = canvasSize.width / 1920;
      endScene.scale.y = canvasSize.height / 1080;
      container.addChild(endScene);
    }
    
    
    if(frames.length > this.playerCount + 1) {
      scope.countdown = new Drawer.PIXI.extras.BitmapText("3", {
        font: "200px AmericanCountdown",
        align: "center"
      });
      
      scope.countdown.baseScale = scope.countdown.scale.x = scope.countdown.scale.y = scope.scale * 12;
      scope.countdown.position.x = canvasSize.width/2;
      scope.countdown.position.y = canvasSize.height/2;
      scope.countdown.pivot.y = scope.countdown.height / 2 / scope.countdown.scale.y;
      scope.countdown.pivot.x = scope.countdown.width / 2 / scope.countdown.scale.x;
      container.addChild(scope.countdown);
    }
  }

  scope.time = 0;
};

Drawer.prototype.initEndScene = function(scope, failure) {
  this.destroyEndScene(scope);
  scope.endSceneViewed = false;
};

Drawer.prototype.destroyEndScene = function(scope) {
  var end = scope.end;
  if(end) {
    end.sandstorm.anchor.x = 0;
    end.background.alpha = 0;
    end.sandstorm.x = 1920;
    end.sandstorm.y = 540;
    end.background.x = end.background.y = 0;
    end.logo.scale.x = end.logo.scale.y = 10;
    end.logo.visible = false;
    end.visible = false;
  }
  scope.game.x = 0;
  scope.game.y = 0;
  
};

Drawer.prototype.renderEndScene = function(scope, step, failure) {
  var endOfEnd;
  if (scope.endTime == 0) {
    this.initEndScene(scope, failure);
  }

  endOfEnd = 10000;
  scope.endTime += step;

  var end = scope.end;

  end.visible = true;

  var sandD = 2500;
  var sandP = unlerp(0, sandD, scope.endTime);
  end.sandstorm.anchor.x = Drawer.EASE_OUT(sandP);

  var backS = 1500;
  var backD = 1000;
  var backP = unlerp(backS, backS + backD, scope.endTime);
  end.background.alpha = backP;

  var logoS = sandD;
  var logoD = 400;
  var logoP = unlerp(logoS, logoS + logoD, scope.endTime);
  end.logo.scale.x = end.logo.scale.y = lerp(10, .6, logoP);
  end.logo.visible = !!logoP;

  var shakeForceMax = 10;
  var strength = .4;
  var shakeTime = 0, shakeP = 0;

  if (logoP < 1 && sandP) {
    shakeTime = sandD;
    shakeP = unlerp(0, shakeTime, scope.endTime);
  } else if (logoP >= 1) {
    shakeTime = 400;
    shakeP = unlerp(logoS + logoD, logoS + logoD + shakeTime, scope.endTime);
  }

  var shakeForce = shakeP ? lerp(shakeForceMax, 0, unlerp(1 - strength, 1, shakeP)) : 0;
  var shakeX = shakeForce * Math.cos(2 * scope.endTime);
  var shakeY = shakeForce * Math.sin(scope.endTime);

  scope.game.x = shakeX;
  scope.game.y = shakeY;
  end.background.x = shakeX;
  end.background.y = shakeY;
  end.sandstorm.x = 1920 + shakeX;
  end.sandstorm.y = 540 + shakeY;

  var rankS = logoS + logoD + 400;
  var rankD = 300;
  for (var i = 0; i < scope.finishers.length; ++i) {
    var p = unlerp(rankS + rankD * i, rankS + rankD * i + rankD, scope.endTime);
    scope.finishers[i].alpha = p;
  }

  if (scope.endTime >= endOfEnd && !scope.endSceneViewed) {
    if (this.endCallback) {
      this.endCallback();
    }
    scope.endSceneViewed = true;
  }
};

Drawer.prototype.getRank = function(player, scores, playerCount) {
  var pscore = scores[player];
  var order = [];
  for (var i = 0; i < playerCount; i++) {
    order.push(scores[i]);
  }
  order.sort(function(a, b) {
    return b - a;
  });
  return order.indexOf(pscore);
};

Drawer.prototype.createEndScene = function(initData, scope) {
  var layer = new Drawer.PIXI.Container();

  if (!this.frames.length) {
    console.warn('no frames for this game');
    return;
  }

  var logo = Drawer.PIXI.Sprite.fromFrame('logoStart');
  var sandstorm = Drawer.PIXI.Sprite.fromFrame('sandstorm');
  var background = Drawer.PIXI.Sprite.fromFrame('background_leaderboard');

  var players = this.frames[this.frames.length - 1].players;
  var ranks = players.map(function(p) {
    return p.rank;
  });
  var podium = [];
  for (var i = 0; i < initData.playerCount; ++i) {
    var rank = ranks[i];
    podium.push({
      rank: rank,
      player: this.playerInfos[i]
    });
  }
  podium.sort(function(a, b) {
    return a.rank - b.rank;
  });
  scope.finishers = [];
  var finishers = new Drawer.PIXI.Container();
  for (var i = 0; i < initData.playerCount; ++i) {
    var elem = this.createFinisher(podium[i], scope);

    elem.x = 687;
    elem.y = 500 + 206 * i;

    finishers.addChild(elem);
    scope.finishers.push(elem);
  }

  logo.anchor.x = .5;
  logo.anchor.y = .5;
  logo.x = 509 + 450;
  logo.y = 10 + 110 + 103;

  sandstorm.anchor.x = 1;
  sandstorm.x = 1920;
  sandstorm.scale.y = 1.1;
  sandstorm.anchor.y = .5;

  layer.addChild(sandstorm);
  layer.addChild(background);
  layer.addChild(logo);
  layer.addChild(finishers);

  layer.sandstorm = sandstorm;
  layer.background = background;
  layer.logo = logo;
  layer.finishers = finishers;

  scope.end = layer;
  layer.visible = false;

  return layer;
}

Drawer.prototype.createFinisher = function(finisher, scope) {
  var layer = new Drawer.PIXI.Container();

  var avatarSize = 75 * 2;

  var frame = Drawer.PIXI.Sprite.fromFrame('avatar_leaderboard');
  var avatar = new Drawer.PIXI.Sprite(finisher.player.avatar);

  var rank = (finisher.rank) + Drawer.tools.getRankSuffix(finisher.rank);
  var ranking = new Drawer.PIXI.extras.BitmapText(rank, {
    font: "54px AmericanCaptain",
    tint: 0xdfdec9
  });
  var name = new Drawer.PIXI.extras.BitmapText(finisher.player.name.toUpperCase(), {
    font: "54px AmericanCaptain",
    tint: finisher.player.color
  });
  var mask = new Drawer.PIXI.Graphics();
  mask.beginFill(0, 1);
  mask.drawCircle(0, 0, 75);
  mask.endFill();
  mask.x = 75;
  mask.y = 75;

  frame.anchor.x = frame.anchor.y = .5;
  avatar.anchor.x = avatar.anchor.y = .5;
  avatar.x = avatar.y = 75;
  frame.x = frame.y = 75;
  avatar.width = avatar.height = avatarSize;
  avatar.mask = mask;
  name.x = 300;
  name.y = 48;
  ranking.x = 190;
  ranking.y = 48;

  layer.addChild(avatar);
  layer.addChild(frame);
  layer.addChild(name);
  layer.addChild(ranking);
  layer.addChild(mask);

  return layer;
}

Drawer.prototype.getFrameSpeed = function(frame, playerSpeed) {
  if(this.frames.length > this.playerCount +1 && frame <= this.playerCount && frame > 0) {
    var countDownDuration = Drawer.COUNTDOWN_DURATION * playerSpeed;
    
    var frameDuration = 1 / Drawer.DEFAULT_FRAME_SPEED;
    var totalDuration = countDownDuration + frameDuration;
    return 1 / totalDuration;
  } else {
    return Drawer.DEFAULT_FRAME_SPEED;
  }
};

Drawer.tools = {
  shortAngleDist: function(a0, a1) {
    var max = Math.PI * 2;
    var da = (a1 - a0) % max;
    return 2 * da % max - da;
  },
  angleLerp: function(a0, a1, t) {
    return a0 + Drawer.tools.shortAngleDist(a0, a1) * t;
  },
  getRankSuffix: function(rank) {
    switch (rank) {
    case 1:
      return 'ST';
    case 2:
      return 'ND';
    case 3:
      return 'RD';
    default:
      return 'TH'
    }
  },
  zeroPad: function(number, length) {
    var str = number.toFixed(0);
    while (str.length < length) {
      str = ' ' + str;
    }
    return str;
  }
};

Drawer.prototype.getPodStatus = function(pod, previousPod, wayPoints, progress) {
  var _status = pod;
  var _previousStatus = previousPod;
  var _time = 1;
  var _previousTime = 0;
  if (wayPoints) {
    var i = 0;
    while (i < wayPoints.length && wayPoints[i].time < progress) {
      ++i;
    }
    if (i > 0) {
      _previousStatus = wayPoints[i - 1];
      _previousTime = wayPoints[i - 1].time;
    }
    if (i < wayPoints.length) {
      _status = wayPoints[i];
      _time = wayPoints[i].time;
    }
  }
  var _progress = (progress - _previousTime) / (_time - _previousTime);

  return {
    speed: {
      x: _status.speed.x * _progress + _previousStatus.speed.x * (1 - _progress),
      y: _status.speed.y * _progress + _previousStatus.speed.y * (1 - _progress)
    },
    position: {
      x: _status.position.x * _progress + _previousStatus.position.x * (1 - _progress),
      y: _status.position.y * _progress + _previousStatus.position.y * (1 - _progress)
    }
  };
};

/** Mandatory */
Drawer.prototype.updateScene = function(scope, question, frames, frameNumber, progress, speed, reason, demo) {
  /** ************************************* */
  /*        SYNCHRONOUS                     */
  /** ************************************* */
  
  
  
  
  if(scope.countdown && speed > 0) {
    if(frameNumber <= this.playerCount && frameNumber > 0) {
      var countDownDuration = Drawer.COUNTDOWN_DURATION * speed;
      
      var frameDuration = 1 / Drawer.DEFAULT_FRAME_SPEED;
      var totalDuration = countDownDuration + frameDuration;
      
      var countDownProgress = progress * totalDuration / countDownDuration;
      
      var countdownValue = 3 - countDownProgress * 3;
      var ceilCountdownValue = Math.ceil(countdownValue);
      if(ceilCountdownValue > 0) {
        scope.countdown.text = ceilCountdownValue.toString();
        scope.countdown.scale.x = scope.countdown.scale.y = scope.countdown.baseScale * (1 - (ceilCountdownValue - countdownValue)/2);
      } else {
        scope.countdown.text = 'GO';
        scope.countdown.scale.x = scope.countdown.scale.y = scope.countdown.baseScale;
      }
      scope.countdown.pivot.y = scope.countdown.height / 2 / scope.countdown.scale.y;
      scope.countdown.pivot.x = scope.countdown.width / 2 / scope.countdown.scale.x;
      
      progress = Math.max(0, ((progress * totalDuration) - countDownDuration) / frameDuration);
      scope.countdown.targetAlpha = scope.countdown.alpha = 1;
    } else {
      scope.countdown.targetAlpha = 0;
    }
  }
  
  scope.speed = speed;
  var frame = frames[frameNumber].currentKeyFrame;
  var previousFrame = frame.previousKeyFrame;
  
  if(scope.graphics.lapText) {
    scope.graphics.lapText.text = 'LAP '+(frame.lap + 1)+' / 3';
  }
  

  var time = frame.keyFrameIndex + progress;
  for (var i = 0; i < scope.syncUpdatables.length; ++i) {
    if (scope.syncUpdatables[i].update(time)) {
      scope.syncUpdatables.splice(i--, 1);
    }
  }

  scope.checkPoints.forEach(function(checkPoint) {
    checkPoint.indicators.forEach(function(indicator) {
      indicator.targetAlpha = 0;
    });
  });
  if (!demo) {
    frame.players.forEach(function(player, index) {
      if(scope.players[index].hud) {
        scope.players[index].hud.rank.text = player.rank + Drawer.tools.getRankSuffix(player.rank);
      }
      if(scope.players[index].hud) {
        scope.players[index].debugHud.timeout.text = 'Timeout: ' + player.timeout;
      }
    });
  }

  scope.targetGraphics.clear();
  scope.targetGraphics.lineStyle(1 / scope.scale, 0xFF0000);
  var drawer = this;

  if (!demo) {
    scope.podTargetLayout.clear();
  }

  frame.pods.forEach(function(fpod, index) {
    var fpreviousPod = previousFrame.pods[index];

    var pod = scope.pods[index];
    pod.dead = pod.deathTime != null && pod.deathTime < time;
    pod.shieldMode = fpod.shieldMode;

    if (pod.dead) {
      pod.graphics.deathAnimation(Math.min(1, (time - pod.deathTime) / 3));
    }

    if (!demo) {
      pod.graphics.podSpeedVector.setSpeed(fpod.speed);

      if(pod.debugHud) {
        pod.debugHud.position.text = 'Position: ' + Drawer.tools.zeroPad(fpod.position.x, 5) + ', ' + Drawer.tools.zeroPad(fpod.position.y, 4);
        pod.debugHud.speed.text = 'Speed:    ' + Drawer.tools.zeroPad(fpod.speed.x, 5) + ', ' + Drawer.tools.zeroPad(fpod.speed.y, 4);
        if (fpod.target) {
          pod.debugHud.target.text = 'Target:   ' + Drawer.tools.zeroPad(fpod.target.x, 5) + ', ' + Drawer.tools.zeroPad(fpod.target.y, 4);
        } else {
          pod.debugHud.target.text = 'Target:       -,    -';
        }
      }

      pod.messageBox.update();
      if (fpod.message || frameNumber < 20) {
        pod.messageText.text = fpod.message || scope.playerInfos[pod.pid].name;
        pod.messageBox.visible = true;
      } else {
        pod.messageBox.visible = false;
      }

      pod.debugGhostShield.position.x = fpreviousPod.position.x;
      pod.debugGhostShield.position.y = fpreviousPod.position.y;
      if (fpod.target) {
        scope.podTargetLayout.beginFill();
        scope.podTargetLayout.endFill();
        scope.podTargetLayout.lineStyle(2 / scope.scale, pod.playerInfo.color);
        scope.podTargetLayout.moveTo(fpreviousPod.position.x, fpreviousPod.position.y);
        scope.podTargetLayout.lineTo(fpod.target.x, fpod.target.y);
      }
      if(pod.hud) {
        pod.hud.rank.text = fpod.rank + Drawer.tools.getRankSuffix(fpod.rank);
      }
    }
    pod.power = fpod.power;

    var status = drawer.getPodStatus(fpod, fpreviousPod, fpod.wayPoints, progress);
    pod.speed = status.speed;
    //    pod.speed = {x: fpod.speed.x * progress + fpreviousPod.speed.x * (1-progress), y: fpod.speed.y * progress + fpreviousPod.speed.y * (1-progress)};

    pod.position = status.position;
    var gpod = pod.graphics;
    gpod.position.x = status.position.x;
    gpod.position.y = status.position.y;
    
    pod.targetRotation = Drawer.tools.angleLerp(fpreviousPod.angle, fpod.angle, progress) + Math.PI / 2;
    pod.targetOrientation = Math.max(-1, Math.min(1, Drawer.tools.shortAngleDist(fpreviousPod.angle, fpod.angle) / scope.config.maxRotationPerTurn));

    if((scope.pods.length / scope.players.length ) > 1) {
      if (fpod.capturedCheckPoint) {
        fpod.capturedCheckPoint.indicators[pod.pid % 2].targetAlpha = 1;
      }
    } else {
      if (fpod.nextCheckPoint) {
        fpod.nextCheckPoint.indicators[pod.pid % 2].targetAlpha = 1;
      }
    }
  });

};

/** Mandatory */
Drawer.prototype.renderScene = function(scope, question, frames, frameNumber, progress, speed, reason, step, demo) {
  /** ************************************* */
  /*        ASYNCHRONOUS                    */
  /** ************************************* */

  step = Math.min(80, step);

  var render = true;
  var drawer = this;
  var stepFactor = Math.pow(0.990, step);
  var stepFactorSlow = Math.pow(0.998, step);
  var stepFactorVSlow = Math.pow(0.9998, step);
  var stepFactorFast = Math.pow(0.98, step);
  var frame = frames[frameNumber];
  if (scope.time <= 0) {
    stepFactor = 0;
    stepFactorSlow = 0;
    stepFactorFast = 0;
  }
  
  if(scope.countdown) {
    scope.countdown.alpha = scope.countdown.targetAlpha * (1-stepFactorSlow) + stepFactorSlow * scope.countdown.alpha;
  }

  scope.checkPoints.forEach(function(checkPoint, index) {
    checkPoint.indicators.forEach(function(indicator) {
      if (indicator.alpha < indicator.targetAlpha) {
        indicator.alpha = indicator.alpha * stepFactorFast + indicator.targetAlpha * (1 - stepFactorFast);
      } else if (indicator.alpha > indicator.targetAlpha) {
        if((scope.pods.length / scope.players.length ) > 1) {
          indicator.alpha = indicator.alpha * stepFactorSlow + indicator.targetAlpha * (1 - stepFactorSlow);
        } else {
          indicator.alpha = indicator.alpha * stepFactorFast + indicator.targetAlpha * (1 - stepFactorFast);
        }
      }
    });

    var targetCheckPointBoundsAlpha = drawer.debug ? 1 : 0;
    if (index === 0) {
      checkPoint.number.alpha = checkPoint.number.alpha * stepFactor + targetCheckPointBoundsAlpha * (1 - stepFactor);
    }
    checkPoint.checkPointBounds.alpha = checkPoint.checkPointBounds.alpha * stepFactor + targetCheckPointBoundsAlpha * (1 - stepFactor);
  });
  if (!demo) {
    var targetDebugMaskAlpha = this.debug ? 0.5 : 0;
    scope.debugMask.alpha = scope.debugMask.alpha * stepFactor + targetDebugMaskAlpha * (1 - stepFactor);
    if(scope.hudDebug) {
    var targetDebugHudAlpha = this.debug ? 1 : 0;
      scope.hudDebug.alpha = scope.hudDebug.alpha * stepFactor + targetDebugHudAlpha * (1 - stepFactor);
    }
  }

  scope.pods.forEach(function(pod, index) {
    var targetMessageAlpha = ((drawer.showMyMessages && pod.playerInfo.isMe) || (drawer.showOthersMessages && !pod.playerInfo.isMe)) ? 1 : 0;
    if (!demo) {
      pod.messageBox.alpha = pod.messageBox.alpha * stepFactor + targetMessageAlpha * (1 - stepFactor);
    }
    var targetDebugAlpha = drawer.debug ? 1 : 0;
    if (!demo) {
      pod.graphics.podSpeedVector.alpha = pod.podNumber.alpha = pod.debugShield.alpha = pod.debugShield.alpha * stepFactor + targetDebugAlpha * (1 - stepFactor);
    }
    var cols = frames && frame.collisions;
    //    if (cols && cols.length) {
    //      for (var k = 0; k < cols.length; ++k) {
    //        if (cols[k].p1.id == pod.id || cols[k].p2.id == pod.id) {
    //          show = 0.5;
    //          break;
    //        }
    //      }
    //    }
    var targetShieldAlpha = (!drawer.debug && pod.shieldMode) ? 1 : 0;
    pod.shield.alpha = pod.shield.alpha * stepFactor + (targetShieldAlpha) * (1 - stepFactor);
    if (!demo) {
      var targetGhostAlpha = (drawer.debug) ? 0.25 : 0;
      scope.podTargetLayout.alpha = pod.debugGhostShield.alpha = pod.debugGhostShield.alpha * stepFactor + targetGhostAlpha * (1 - stepFactor);
    }
    pod.graphics.podc.rotation = Drawer.tools.angleLerp(pod.graphics.podc.rotation, pod.targetRotation, 1 - stepFactor);

    if (pod.winner && drawer.view !== 'LARGE') {
      scope.mapContainer.scale.x = scope.mapContainer.scale.y = 3;
      if (drawer.view === 'ACTION') {
        scope.mapContainer.rotation = Drawer.tools.angleLerp(scope.mapContainer.rotation, -pod.graphics.podc.rotation, 1 - stepFactorSlow);
      } else {
        scope.mapContainer.rotation = Drawer.tools.angleLerp(scope.mapContainer.rotation, 0, 1 - stepFactorSlow);
      }
      scope.mapContainer.position.x = scope.config.canvasSize.width / 2;
      scope.mapContainer.position.y = scope.config.canvasSize.height / 2;
      scope.mapContainer.pivot.x = pod.position.x / scope.config.map.size.width * scope.config.canvasSize.width;
      scope.mapContainer.pivot.y = pod.position.y / scope.config.map.size.height * scope.config.canvasSize.height;
    }

    pod.orientation = pod.orientation * stepFactor + pod.targetOrientation * (1 - stepFactor);
    if (!pod.dead) {
      pod.graphics.steer(pod.orientation);
      scope.throwParticle(Drawer.PIXI.Texture.fromFrame('particle'), scope.map.toLocal(new Drawer.PIXI.Point(0, 0), pod.graphics.leftEngineImg), pod.graphics.podc.rotation + Math.PI / 2 + pod.graphics.leftEngine.rotation + pod.graphics.leftEngineImg.rotation, 2 * pod.graphics.scale.x, pod.speed, pod.power * 2 + 100, 2);
      scope.throwParticle(Drawer.PIXI.Texture.fromFrame('particle'), scope.map.toLocal(new Drawer.PIXI.Point(0, 0), pod.graphics.rightEngineImg), pod.graphics.podc.rotation + Math.PI / 2 + pod.graphics.rightEngine.rotation + pod.graphics.rightEngineImg.rotation, 2 * pod.graphics.scale.x, pod.speed, pod.power * 2 + 100, 2);
    }

    if (!drawer.debug && scope.speed > 0 && Math.random() > 1 / (1 + (pod.speed.x * pod.speed.x + pod.speed.y * pod.speed.y) / 500000)) {
      scope.throwParticle(Drawer.PIXI.Texture.fromFrame('dustParticle'), scope.map.toLocal(new Drawer.PIXI.Point((Math.random() - 0.5) * 300, (Math.random() - 0.5) * 300 + 500), pod.graphics.podc), Math.random() * 2 * Math.PI, pod.graphics.scale.x * 2, {
        x: 0,
        y: 0
      }, Math.random() * 100, 10, Drawer.PIXI.BLEND_MODES.NORMAL, 1, 0.4);
    }

  });

  if (drawer.view === 'LARGE') {
    scope.mapContainer.scale.x = scope.mapContainer.scale.y = 1;
    scope.mapContainer.rotation = 0;
    scope.mapContainer.position.x = 0;
    scope.mapContainer.position.y = 0;
    scope.mapContainer.pivot.x = 0;
    scope.mapContainer.pivot.y = 0;
  }

  var sstep = step / 1000;
  for (var i = 0; i < scope.asyncUpdatables.length; ++i) {
    if (scope.asyncUpdatables[i].update(sstep, stepFactor)) {
      scope.asyncUpdatables.splice(i--, 1);
    }
  }

  scope.time += step;
  if (!demo) {
    var endFrame = !this.debug && (frameNumber == frames.length - 1 && progress == 1);
    if (endFrame) {
      if(scope.end) {
        this.renderEndScene(scope, step, (reason != "Win"));
      }
    } else {
      if (scope.endTime > 0) {
        this.destroyEndScene(scope);
      }
      scope.endTime = 0;
    }
  }
  return render;
};

Drawer.prototype.getRenderTimeout = function() {
  return 10000;
};

/*
 * #########################################################
 * ####                                                 ####
 * ####         EDIT TO HERE                            ####
 * ####                                                 ####
 * #########################################################
 */
var InputParser = function(parsers) {
  this.parsers = parsers || [];
};

InputParser.prototype.addParser = function(regex, count) {
  this.parsers.push({
    regex: regex,
    count: count || 1
  })
};

InputParser.prototype.parseInputs = function(inputs, keyFrame, previousFrames, initData, playerCount) {
  var data = {};
  var pi = 0;
  var ppos = 0;
  for (var pi = 0, ii = 0; pi < this.parsers.length; ++ii) {
    var parser = this.parsers[pi];
    this.parseInput(parser.regex, inputs[ii], data, parser.count && ppos);
    ppos++;
    if (ppos >= parser.count) {
      pi++;
      ppos = 0;
    }
  }
  return data;
};

InputParser.prototype.parseInput = function(pattern, input, data, index) {
  var groups = [];
  var groupRX = /\(\?<((?:[a-z_0-9]+(?:\[\])?\.?)+)(?:\:(int|string|float))?\>\s?([^\)]+)\)/i;
  var match;
  var i = 1;
  while (match = groupRX.exec(pattern)) {
    var group = {
      name: match[1],
      type: match[2],
      pattern: match[3],
      index: i++
    }
    groups.push(group);
    pattern = pattern.replace(groupRX, '(' + group.pattern + ')');
  }
  var result = null;
  var finalMatch = new RegExp(pattern).exec(input);
  if (finalMatch) {
    groups.forEach(function(group) {
      var val = finalMatch[group.index];
      switch (group.type) {
      case 'int':
        val = parseInt(val);
        break;
      case 'float':
        val = parseFloat(val);
        break;
      }
      if (group.name.length === 0 && groups.length === 1) {
        data = val;
      } else {
        var affect = function(obj, attrs, val) {
          var name = attrs[0];
          var array = false;
          if (name.length > 2 && name.indexOf('[]') == name.length - 2) {
            array = true;
            name = name.slice(0, -2);
          }
          if (attrs.length > 1) {
            var tempObj;
            if (array) {
              obj[name] = (obj[name] || []);
              if (!obj[name][index]) {
                obj[name][index] = {};
              }
              tempObj = obj[name][index];
            } else {
              if (!obj[name]) {
                obj[name] = {};
              }
              tempObj = obj[name];
            }
            affect(tempObj, attrs.slice(1), val);
          } else {
            if (array) {
              if (!obj[name]) {
                obj[name] = [];
              }
              obj[name].push(val);
            } else {
              obj[name] = val;
            }
          }
        };
        affect(data, group.name.split('.'), val)
      }
    });
    return data;
  }
};

InputParser.prototype.getLineCount = function() {
  return this.parsers.map(function(parser) {
    return parser.count || 1;
  }).reduce(function(a, b) {
    return a + b;
  });
};

Drawer.prototype.enableAsyncRendering = function(enabled) {
  this.asyncRendering = enabled;
  this.relaunchAsynchronousAnimations();
};

Drawer.prototype.relaunchAsynchronousAnimations = function() {
  this.asyncRenderingTime = (this.getRenderTimeout && this.getRenderTimeout()) || 10000;
};

Drawer.prototype.purge = function() {
  if (this.scope && this.destroyResources) {
    this.destroyResources(this.scope);
  }
  this.scope = {};
  if (this.container) {
    this.container.interactiveChildren = false;
    this.container.destroy(true);
    this.container = null;
  }
  this.changed = true;
};

Drawer.prototype.reinitScene = function() {
  if (this.loaded >= 1) {

    this.relaunchAsynchronousAnimations();
    var drawer = this;
    this.initScene(this.initData, this.scope, this.question, this.container, this.initSize, this.oversampling, this.frames, this.playerInfos);
    this.updateScene(this.scope, this.question, this.frames, this.currentFrame, this.progress, this.speed, this.reasons[this.currentFrame]);
    this.changed = true;
  }
};

Drawer.prototype.isReady = function() {
  return this.loaded >= 1;
};

Drawer.prototype.reinitDefaultScene = function() {
  if (this.loaded >= 1) {
    this.relaunchAsynchronousAnimations();
    this.initDefaultScene(this.scope, this.container, this.initSize);
    this.changed = true;
  }
};

Drawer.prototype.reinitLoadingScene = function() {
  if (this.loaded < 1) {
    this.relaunchAsynchronousAnimations();
    this.initPreload(this.scope, this.container, this.loaded, this.initSize);
  }
};

Drawer.prototype.reinit = function(force) {
  if (this.loading) {
    return;
  }

  this.purge();
  this.container = new Drawer.PIXI.Container();
  if (this.loaded >= 1) {
    if (this.currentFrame >= 0) {
      this.status = 'mainScene';
      this.reinitScene();
    } else {
      this.status = 'defaultScene';
      this.reinitDefaultScene();
    }
  } else {
    this.status = 'loadingScene';
    this.reinitLoadingScene();
  }
};

Drawer.prototype.animate = function(time) {
  if (this.destroyed) {
    return;
  }

  if (!this.lastRenderTime) {
    this.lastRenderTime = time;
  }
  var step = time - this.lastRenderTime;
  if (this.asynchronousStep) {
    step = this.asynchronousStep;
  }
  if (this.onBeforeRender) {
    this.onBeforeRender();
  }
  if (this.status === 'loadingScene') {
    this.changed |= this.renderPreloadScene(this.scope, step);
  } else if (this.changed || (this.asyncRendering && this.asyncRenderingTime > 0)) {
    if (this.status === 'defaultScene') {
      this.changed |= this.renderDefaultScene(this.scope, step);
    } else if (this.status === 'mainScene') {
      this.changed |= this.renderScene(this.scope, this.question, this.frames, this.currentFrame, this.progress, this.speed, this.reasons[this.currentFrame], step)
    }
  }
  if (this.container) {
    if (this.changed) {
      this.renderer.render(this.container);
      this.changed = false;
    } else if (this.renderer.plugins && this.renderer.plugins.interaction) {
      this.renderer.plugins.interaction.update();
    }
  }
  if (this.onAfterRender) {
    this.onAfterRender();
  }
  var self = this;
  this.lastRenderTime = time;
  requestAnimationFrame(this.animate.bind(this));

  this.asyncRenderingTime -= step;

};

Drawer.prototype.destroy = function() {
  this.destroyed = true;
  this.purge();
  if (this.renderer) {
    this.renderer.destroy();
  }
};

Drawer.prototype.handleInitFrame = function(frame) {
  this.question = frame[1];
  var header = frame[0].split(" ");
  this.currentFrame = header[1] | 0;
  this.progress = 1;
  if (header.length > 2) {
    this.reasons[0] = header[2];
  }
  frame = frame.slice(2);

  var initParser = this.getInitDataParser(this.question, this.playerCount);
  var startLine = initParser.getLineCount();
  this.initView = frame.slice(0, startLine);
  this.initData = initParser.parseInputs(this.initView);

  return frame.slice(startLine, -1);
};

Drawer.prototype._initFrames = function(playerCount, frames) {
  var firstFrame = frames[0];
  if (firstFrame[0] == '-1') {
    this.currentFrame = -1;
    return;
  }
  this._frames = frames;
  this.playerCount = playerCount;
  this.reasons = [];
  this.frames = [];

  var frameParser = this.getFrameParser();
  this.frames.push(frameParser.parseInputs(this.handleInitFrame(firstFrame), true, this.frames, this.initData, this.playerCount));
  for (var i = 1; i < this._frames.length; ++i) {
    var temp = this._frames[i];
    var header = temp[0].split(" ");
    if (header.length > 2) {
      this.reasons[i] = header[2];
    }
    this.frames.push(frameParser.parseInputs(temp.slice(1, -1), header[0] == 'KEY_FRAME', this.frames, this.initData, this.playerCount));
  }
  this.relaunchAsynchronousAnimations();
};

var inhibTextureDestroy = function() {
  if (this.baseTexture) {
    this.baseTexture.dispose();
    /* pixi hack */
    this.baseTexture.removeAllListeners('dispose');
  }
};

Drawer.prototype.initFrames = function(frames, agents) {
  if (this.playerInfos) {
    this.playerInfos.forEach(function(playerInfo) {
      if (playerInfo.avatar) {
        playerInfo.avatar.destroy(true);
      }
    });
  }

  var drawer = this;

  var loader = new Drawer.PIXI.loaders.Loader(window.location.origin);
  this.playerInfos = agents.map(function(agent, index) {
    var agentData = {
      name: agent.name || 'Anonymous',
      color: drawer.parseColor(agent.color),
      number: index,
      index: agent.index,
      type: agent.type,
      isMe: agent.type === 'CODINGAMER' && agent.typeData.me,
      avatar: null
    };
    loader.add('avatar' + index, agent.avatar, {loadType: 2}, function(event) {
      agentData.avatar = event.texture;
      event.texture.destroy = inhibTextureDestroy;
    });
    return agentData;
  });
  var drawer = this;
  this.loading = true;
  loader.on('complete', function(loader) {
    drawer._initFrames(agents.length, frames);
    drawer.loading = false;
    drawer.reinit(false);
  });
  loader.on('error', function(e) {
    console.log(e);
  });
  loader.load();
};

Drawer.prototype.update = function(currentFrame, progress, speed) {
  if (this.currentFrame >= 0) {
    this.relaunchAsynchronousAnimations();
    this.changed = true;
    this.speed = speed;
    this.currentFrame = currentFrame;
    this.progress = progress;
    if (this.loaded >= 1) {
      this.updateScene(this.scope, this.question, this.frames, currentFrame, progress, this.speed, this.reasons[this.currentFrame]);
    }
  }
};

Drawer.prototype.parseColor = function(color) {
  if (Array.isArray(color)) {
    var i;
    var parsedColor = [];
    for (i = 0; i < color.length; ++i) {
      parsedColor.push(this.parseColor(color[i]));
    }
    return parsedColor;
  } else {
    return parseInt(color.substring(1), 16);
  }
};

Drawer.prototype.init = function(canvas, width, height, colors, oversampling, endCallback) {
  this.oversampling = oversampling || 1;
  this.canvas = $(canvas);
  if (colors)
    this.colors = this.parseColor(colors);
  this.asyncRendering = true;
  this.asyncRenderingTime = 0;
  this.destroyed = false;
  this.asynchronousStep = null;
  var self = this;
  this.initSize = {
    width: width | 0,
    height: height | 0
  }
  this.endCallback = endCallback || this.endCallback;

  if (!this.alreadyLoaded) {
    this.textures = [];
    this.alreadyLoaded = true;
    // Initialisation
    this.question = null;
    this.scope = null;
    this.currentFrame = -1;
    this.loaded = 0;
    // Engine instanciation
    var resources = this.getResources();
    this.renderer = this.createRenderer(this.initSize, canvas);
    var loader = new Drawer.PIXI.loaders.Loader(resources.baseUrl);
    for ( var key in resources.images) {
      if (resources.images.hasOwnProperty(key)) {
        loader.add(key, resources.images[key]);
      }
    }
    var i;
    for (i = 0; i < resources.sprites.length; ++i) {
      loader.add(resources.sprites[i]);
    }
    for (i = 0; i < resources.bitmapFonts.length; ++i) {
      loader.add(resources.bitmapFonts[i]);
    }
    for ( var key in resources.spines) {
      loader.add(key, resources.spines[key]);
    }
    for (i = 0; i < resources.others.length; ++i) {
      loader.add(resources.others[i]);
    }

    self.scope = {};
    self.loaded = 0;
    loader.on('start', function(loader, resource) {
      requestAnimationFrame(self.animate.bind(self));
      self.reinit();
    });
    this.textures = [];
    loader.on('progress', function(loader, resource) {
      if (loader.progress < 100) {
        self.preload(self.scope, self.container, self.loaded = loader.progress / 100, self.initSize, resource);
      }
    });

    loader.on('complete', function(loader) {
      for ( var fontName in Drawer.PIXI.extras.BitmapText.fonts) {
        var font = Drawer.PIXI.extras.BitmapText.fonts[fontName];
        for ( var charCode in font.chars) {
          font.chars[charCode].texture.destroy = inhibTextureDestroy;
        }
      }
      for ( var key in Drawer.PIXI.utils.TextureCache) {
        var texture = Drawer.PIXI.utils.TextureCache[key];
        texture.destroy = inhibTextureDestroy;
      }
      for ( var key in resources.images) {
        Drawer.PIXI.Texture.addTextureToCache(loader.resources[key].texture, key);
      }
      for ( var key in resources.spines) {
        Drawer.PIXI.AnimCache[key] = Drawer.PIXI.AnimCache[resources.baseUrl + resources.spines[key]];
      }
      self.loaded = 1;
      self.reinit(true);
      self.changed = true;
    });
    loader.on('error', function(e) {
      console.log(e);
    });
    loader.load();
  } else {
    this.changed = true;
    this.renderer.resize(this.initSize.width, this.initSize.height, canvas);
    this.reinit(true);
  }
};

Drawer.prototype.getMaxCanvasSize = function() {
  return {
    width: 1920,
    height: 1080
  };
};

Drawer.prototype.isTurnBasedGame = function() {
  return false;
};

Drawer.prototype.createRenderer = function(initSize, canvas) {
  return Drawer.PIXI.autoDetectRenderer(initSize.width, initSize.height, {
    view: canvas,
    clearBeforeRender: false
  });
};

Drawer.DEMO = {
  playerCount: 2,
  playerMapper: [0, 1, 2, 3, 5, 6, 7],
  playerNames: ["Player 1", "Player 2", "Player 3"],
  avatars: [null, null],
  playerTypes: ["DEFAULT", "DEFAULT"],
  frames: [["KEY_FRAME 0", "CodersStrikeBack", "16000 9000 400 600 4 0.3141592653589793", "4970 5340 11548 6107 9019 1891", "0 5028.0 4843.0 0 4912.0 5837.0 1 5144.0 3850.0 1 4796.0 6830.0", "5028.0 4843.0 0 0 0 0 null null null 0 1 1", "\"\"", "4912.0 5837.0 0 0 0 0 null null null 0 1 1", "\"\"", "5144.0 3850.0 0 0 0 0 null null null 0 1 1", "\"\"", "4796.0 6830.0 0 0 0 0 null null null 0 1 1", "\"\"", "1:100 1:100", ""], ["INTERMEDIATE_FRAME 1", ""], ["KEY_FRAME 2", "5107.0 4858.0 66 12 80 0 11548 6107 0.19148965166780452 0 1 1", "\"\"", "4992.0 5840.0 67 2 80 0 11548 6107 0.040664731428008354 0 1 2", "\"\"", "5219.0 3877.0 64 22 80 0 11548 6107 0.3388433047873599 0 1 4", "\"\"", "4876.0 6821.0 67 -7 80 0 11548 6107 -0.10667291934813292 0 1 3", "\"\"", "1:99 2:99", ""], ["INTERMEDIATE_FRAME 3", ""], ["KEY_FRAME 4", "5252.0 4885.0 122 23 80 0 11548 6107 0.19153683570774047 0 1 1", "\"\"", "5139.0 5845.0 124 4 80 0 11548 6107 0.040703558620957654 0 1 2", "\"\"", "5358.0 3926.0 118 41 80 0 11548 6107 0.3387635708325004 0 1 4", "\"\"", "5023.0 6805.0 124 -13 80 0 11548 6107 -0.1066086602978674 0 1 3", "\"\"", "1:98 2:98", ""], ["INTERMEDIATE_FRAME 5", ""], ["KEY_FRAME 6", "5453.0 4923.0 170 32 80 0 11548 6107 0.1917078956603758 0 1 1", "\"\"", "5343.0 5852.0 173 6 80 0 11548 6107 0.04085726273203672 0 1 2", "\"\"", "5551.0 3994.0 164 57 80 0 11548 6107 0.3387601421422193 0 1 4", "\"\"", "5227.0 6783.0 173 -18 80 0 11548 6107 -0.10656791828639009 0 1 3", "\"\"", "1:97 2:97", ""], ["INTERMEDIATE_FRAME 7", ""], ["KEY_FRAME 8", "5702.0 4970.0 211 40 80 0 11548 6107 0.19186796208431517 0 1 1", "\"\"", "5596.0 5861.0 214 7 80 0 11548 6107 0.041072778590454065 0 1 2", "\"\"", "5790.0 4078.0 203 71 80 0 11548 6107 0.33876045366957247 0 1 4", "\"\"", "5480.0 6756.0 214 -22 80 0 11548 6107 -0.10654015940141456 0 1 3", "\"\"", "1:96 2:96", ""], ["INTERMEDIATE_FRAME 9", ""], ["KEY_FRAME 10", "5992.0 5025.0 246 46 80 0 11548 6107 0.1920938016419526 0 1 1", "\"\"", "5890.0 5871.0 249 8 80 0 11548 6107 0.04130713527704706 0 1 2", "\"\"", "6068.0 4176.0 236 82 80 0 11548 6107 0.3387928870742367 0 1 4", "\"\"", "5774.0 6725.0 249 -25 80 0 11548 6107 -0.10654946483172317 0 1 3", "\"\"", "1:95 2:95", ""], ["INTERMEDIATE_FRAME 11", ""], ["KEY_FRAME 12", "6317.0 5086.0 275 52 80 0 11548 6107 0.19233704849622996 0 1 1", "\"\"", "6219.0 5882.0 279 9 80 0 11548 6107 0.04168668766444331 0 1 2", "\"\"", "6379.0 4285.0 264 92 80 0 11548 6107 0.33878662858845604 0 1 4", "\"\"", "6103.0 6691.0 279 -28 80 0 11548 6107 -0.10662559841062128 0 1 3", "\"\"", "1:94 2:94", ""], ["INTERMEDIATE_FRAME 13", ""], ["KEY_FRAME 14", "6695.0 5033.0 324 -65 80 0 11548 6107 0.1927591491509578 0 1 1", "\"\"", "6565.0 6033.0 293 136 80 0 11548 6107 0.04219674268404304 0 1 2", "\"\"", "6735.0 4194.0 302 -85 80 0 11548 6107 0.3388877766643098 0 1 4", "\"\"", "6434.0 6845.0 278 152 80 0 11548 6107 -0.10684591050307138 0 1 3", "\"\"", "1:93 2:93", "2 0.036412609530896776 1 6232 5882 0 6330 5088 147.59996501248798 356 40", "4 0.04390183909825039 2 6394 4290 0 6333 5088 219.8202851563414 356 20", "5 0.11559537983717089 3 6144 6687 1 6259 5895 217.9566263649321 350 61", "6 0.13210888515248848 1 6265 5894 0 6364 5100 218.74397865963675 363 42", ""], ["INTERMEDIATE_FRAME 15", ""], ["KEY_FRAME 16", "7097.0 4985.0 341 -40 80 0 11548 6107 0.21779606011636557 0 1 1", "\"\"", "6938.0 6170.0 317 116 80 0 11548 6107 0.01484940012131324 0 1 2", "\"\"", "7111.0 4139.0 319 -47 80 0 11548 6107 0.3783192951598004 0 1 4", "\"\"", "6791.0 6986.0 303 119 80 0 11548 6107 -0.14332030742025637 0 1 3", "\"\"", "1:92 2:92", ""], ["INTERMEDIATE_FRAME 17", ""], ["KEY_FRAME 18", "7516.0 4965.0 355 -17 80 0 11548 6107 0.24693364319991923 0 1 1", "\"\"", "7335.0 6285.0 337 97 80 0 11548 6107 -0.013665092954686908 0 1 2", "\"\"", "7503.0 4124.0 333 -12 80 0 11548 6107 0.4174712704181618 0 1 4", "\"\"", "7173.0 7090.0 324 88 80 0 11548 6107 -0.18271935124215993 0 1 3", "\"\"", "1:91 2:91", ""], ["INTERMEDIATE_FRAME 19", ""], ["KEY_FRAME 20", "7948.0 4970.0 367 4 80 0 11548 6107 0.27600518289527753 0 1 1", "\"\"", "7752.0 6379.0 354 79 80 0 11548 6107 -0.042225064964195105 0 1 2", "\"\"", "7908.0 4147.0 344 19 80 0 11548 6107 0.45580502185389865 0 1 4", "\"\"", "7575.0 7160.0 341 59 80 0 11548 6107 -0.22101528055369507 0 1 3", "\"\"", "1:90 2:90", ""], ["INTERMEDIATE_FRAME 21", ""], ["KEY_FRAME 22", "8392.0 5013.0 386 136 80 0 11548 6107 0.3059187533542607 0 1 2", "\"\"", "8215.0 6324.0 394 -49 80 0 11548 6107 -0.07153211657123698 0 1 1", "\"\"", "8321.0 4190.0 342 -64 80 0 11548 6107 0.4939413689195812 0 1 3", "\"\"", "7964.0 7327.0 330 144 80 0 11548 6107 -0.25908218353701 0 1 4", "\"\"", "1:89 2:89", "7 0.026429077730584748 3 7586 7161 1 7763 6381 135.24112145958912 426 56", "9 0.8914226209496315 2 8277 4198 0 8343 4995 133.18363968407897 429 43", ""], ["INTERMEDIATE_FRAME 23", ""], ["KEY_FRAME 24", "8854.0 5175.0 392 137 80 0 11548 6107 0.3336795473247491 0 1 1", "\"\"", "8689.0 6270.0 402 -46 80 0 11548 6107 -0.06501475149868573 0 1 2", "\"\"", "8732.0 4167.0 349 -19 80 0 11548 6107 0.5360331626885421 0 1 3", "\"\"", "8370.0 7445.0 344 100 80 0 11548 6107 -0.32809861479739916 0 1 4", "\"\"", "1:88 2:88", ""], ["INTERMEDIATE_FRAME 25", ""], ["KEY_FRAME 26", "9322.0 5338.0 397 138 80 0 11548 6107 0.33306580254155704 0 1 1", "\"\"", "9171.0 6219.0 409 -42 80 0 11548 6107 -0.05695128872727609 0 1 2", "\"\"", "9147.0 4193.0 352 22 80 0 11548 6107 0.6032512593251953 0 1 3", "\"\"", "8788.0 7514.0 355 58 80 0 11548 6107 -0.39849431073127867 0 1 4", "\"\"", "1:87 2:87", ""], ["INTERMEDIATE_FRAME 27", ""], ["KEY_FRAME 28", "9817.0 5380.0 436 -48 80 0 11548 6107 0.3326269886601857 0 1 1", "\"\"", "9638.0 6295.0 381 148 80 0 11548 6107 -0.04708339315047514 0 1 2", "\"\"", "9562.0 4265.0 352 61 80 0 11548 6107 0.6730116321117828 0 1 3", "\"\"", "9214.0 7536.0 362 18 80 0 11548 6107 -0.47144303359442036 0 1 4", "\"\"", "1:86 2:86", "10 0.44791618514893966 1 9390 6199 0 9534 5412 224.70043720794138 481 59", ""], ["INTERMEDIATE_FRAME 29", ""], ["KEY_FRAME 30", "10327.0 5363.0 433 -14 80 0 11548 6107 0.3976181699795582 0 1 1", "\"\"", "10099.0 6435.0 391 119 80 0 11548 6107 -0.09811328253013761 0 1 2", "\"\"", "9973.0 4380.0 349 98 80 0 11548 6107 0.7477983374435306 0 1 3", "\"\"", "9644.0 7512.0 365 -20 80 0 11548 6107 -0.549380844638248 0 1 4", "\"\"", "1:85 2:85", ""], ["INTERMEDIATE_FRAME 31", ""], ["KEY_FRAME 32", "10828.0 5391.0 426 23 80 0 11548 6107 0.5472563854667276 0 1 1", "\"\"", "10568.0 6536.0 398 86 80 0 11548 6107 -0.22261139460194623 0 1 2", "\"\"", "10376.0 4537.0 342 133 80 0 11548 6107 0.831398397532742 0 1 3", "\"\"", "10073.0 7444.0 364 -57 80 0 11548 6107 -0.6357250843080521 0 1 4", "\"\"", "1:84 2:84", ""], ["INTERMEDIATE_FRAME 33", ""], ["KEY_FRAME 34", "11311.0 5470.0 410 67 80 0 11548 6107 0.7826126552814404 0 1 1", "\"\"", "11039.0 6590.0 400 45 80 0 11548 6107 -0.4126245399723208 0 1 2", "\"\"", "10766.0 4734.0 331 167 80 0 11548 6107 0.9295410288441093 0 1 3", "\"\"", "10496.0 7333.0 359 -94 80 0 11548 6107 -0.7363621130097524 0 1 4", "\"\"", "1:83 2:83", ""], ["INTERMEDIATE_FRAME 35", ""], ["KEY_FRAME 36", "11758.0 5608.0 379 117 80 0 11548 6107 1.0967719206404198 0 2 1", "\"\"", "11499.0 6582.0 390 -6 80 0 11548 6107 -0.7267838053313 0 2 2", "\"\"", "11137.0 4971.0 315 201 80 0 11548 6107 1.0530631953587102 0 1 3", "\"\"", "10907.0 7178.0 349 -131 80 0 11548 6107 -0.8616329256736285 0 1 4", "\"\"", "1:100 2:82", ""], ["INTERMEDIATE_FRAME 37", ""],
    ["KEY_FRAME 38", "12176.0 5715.0 427 -150 80 0 9019 1891 1.4109311859993992 0 2 1", "\"\"", "11956.0 6555.0 471 94 80 0 9019 1891 -1.0409430706902794 0 2 2", "\"\"", "11479.0 5247.0 290 234 80 0 11548 6107 1.2236519130069992 0 1 3", "\"\"", "11244.0 7020.0 131 -11 80 0 11548 6107 -1.0314760291593783 0 1 4", "\"\"", "1:99 2:81", "11 0.7467356638686029 3 11198 7029 1 11820 6526 143.48270673298316 410 -137", "13 0.7601137910195602 1 11828 6524 0 12056 5757 389.06940331197893 467 15", "14 0.8018593128146387 3 11214 7023 1 11846 6532 156.93766518532098 355 49", ""], ["INTERMEDIATE_FRAME 39", ""], ["KEY_FRAME 40", "12591.0 5644.0 352 -60 80 0 9019 1891 1.7250904513583785 0 2 2", "\"\"", "12444.0 6571.0 414 13 80 0 9019 1891 -1.3551023360492587 0 2 3", "\"\"", "11775.0 5561.0 251 266 80 0 11548 6107 1.490735266126055 0 2 1", "\"\"", "11400.0 6933.0 132 -73 80 0 11548 6107 -1.2493743954557641 0 1 4", "\"\"", "2:98 1:100", ""], ["INTERMEDIATE_FRAME 41", ""], ["KEY_FRAME 42", "12907.0 5655.0 268 9 80 0 9019 1891 2.0392497167173578 0 2 2", "\"\"", "12850.0 6504.0 345 -56 80 0 9019 1891 -1.669261601408238 0 2 3", "\"\"", "12007.0 5905.0 197 292 80 0 9019 1891 1.8048945314850342 0 2 1", "\"\"", "11546.0 6781.0 124 -128 80 0 11548 6107 -1.39350091138204 0 1 4", "\"\"", "2:97 1:99", ""], ["INTERMEDIATE_FRAME 43", ""], ["KEY_FRAME 44", "13125.0 5557.0 187 -130 80 0 9019 1891 2.353408982076337 0 2 3", "\"\"", "13157.0 6538.0 258 76 80 0 9019 1891 -1.9834208667672173 0 2 4", "\"\"", "12317.0 6055.0 353 5 80 0 9019 1891 2.1190537968440135 0 2 1", "\"\"", "11516.0 6783.0 -115 124 80 0 11548 6107 -1.5678289764538216 0 2 2", "\"\"", "2:96 1:100", "16 0.2543925935052248 1 12930 6471 0 12961 5672 219.40887094344362 262 -32", "17 0.40698963077659633 3 11597 6696 2 12070 6052 439.57796125535117 140 76", ""], ["INTERMEDIATE_FRAME 45", ""], ["KEY_FRAME 46", "13241.0 5464.0 98 -79 80 0 9019 1891 2.6675682474353164 0 2 2", "\"\"", "13362.0 6554.0 174 13 80 0 9019 1891 -2.2975801321261966 0 2 4", "\"\"", "12609.0 6112.0 248 48 80 0 9019 1891 2.433213062202993 0 2 3", "\"\"", "11377.0 6831.0 -118 40 80 0 9019 1891 -1.8819882418128009 0 2 1", "\"\"", "2:95 1:99", ""], ["INTERMEDIATE_FRAME 47", ""], ["KEY_FRAME 48", "13260.0 5398.0 16 -56 80 0 9019 1891 2.9817275127942957 0 2 2", "\"\"", "13531.0 6533.0 232 26 80 0 9019 1891 -2.3206775643872133 0 2 4", "\"\"", "12734.0 6166.0 17 1 80 0 9019 1891 2.747372327561972 0 2 3", "\"\"", "11225.0 6799.0 -129 -27 80 0 9019 1891 -2.0161423350482925 0 2 1", "\"\"", "2:94 1:98", "18 0.6813059534052461 2 12728 6166 1 13443 6523 172.20579826421437 147 17", ""], ["INTERMEDIATE_FRAME 49", ""], ["KEY_FRAME 50", "13197.0 5330.0 -53 -58 80 0 9019 1891 3.295886778153275 0 2 2", "\"\"", "13707.0 6502.0 149 -26 80 0 9019 1891 -2.341994002804387 0 2 4", "\"\"", "12671.0 6173.0 -53 6 80 0 9019 1891 3.0615315929209515 0 2 3", "\"\"", "11063.0 6699.0 -137 -84 80 0 9019 1891 -1.9932096272678759 0 2 1", "\"\"", "2:93 1:97", ""], ["INTERMEDIATE_FRAME 51", ""], ["KEY_FRAME 52", "13073.0 5236.0 -105 -80 80 0 9019 1891 3.6100460435122543 0 2 2", "\"\"", "13799.0 6420.0 78 -69 80 0 9019 1891 -2.364474761211934 0 2 4", "\"\"", "12540.0 6160.0 -111 -10 80 0 9019 1891 3.3756908582799308 0 2 3", "\"\"", "10895.0 6541.0 -143 -133 80 0 9019 1891 -1.972772669445205 0 2 1", "\"\"", "2:92 1:96", ""], ["INTERMEDIATE_FRAME 53", ""], ["KEY_FRAME 54", "12906.0 5105.0 -141 -111 80 0 9019 1891 -2.4517265647167816 0 2 2", "\"\"", "13819.0 6296.0 16 -105 80 0 9019 1891 -2.3831511128023095 0 2 4", "\"\"", "12361.0 6108.0 -152 -43 80 0 9019 1891 3.68985012363891 0 2 3", "\"\"", "10722.0 6334.0 -146 -176 80 0 9019 1891 -1.9542654387389502 0 2 1", "\"\"", "2:91 1:95", ""], ["INTERMEDIATE_FRAME 55", ""], ["KEY_FRAME 56", "12703.0 4943.0 -172 -137 80 0 9019 1891 -2.4506876242557087 0 2 2", "\"\"", "13776.0 6137.0 -36 -135 80 0 9019 1891 -2.3990796414548985 0 2 4", "\"\"", "12157.0 6004.0 -173 -88 80 0 9019 1891 4.00400938899789 0 2 3", "\"\"", "10547.0 6083.0 -148 -213 80 0 9019 1891 -1.9368234067324759 0 2 1", "\"\"", "2:90 1:94", ""], ["INTERMEDIATE_FRAME 57", ""], ["KEY_FRAME 58", "12469.0 4755.0 -198 -159 80 0 9019 1891 -2.449744852160926 0 2 2", "\"\"", "13680.0 5949.0 -81 -160 80 0 9019 1891 -2.412892515054676 0 2 4", "\"\"", "11935.0 5852.0 -188 -128 80 0 9019 1891 -2.222531997778284 0 2 3", "\"\"", "10372.0 5795.0 -149 -244 80 0 9019 1891 -1.9203332616015747 0 2 1", "\"\"", "2:89 1:93", ""], ["INTERMEDIATE_FRAME 59", ""], ["KEY_FRAME 60", "12209.0 4545.0 -220 -178 80 0 9019 1891 -2.448739012511859 0 2 2", "\"\"", "13539.0 5736.0 -120 -180 80 0 9019 1891 -2.425243849594951 0 2 4", "\"\"", "11700.0 5660.0 -200 -163 80 0 9019 1891 -2.205392335921176 0 2 3", "\"\"", "10197.0 5475.0 -148 -271 80 0 9019 1891 -1.9044100827678834 0 2 1", "\"\"", "2:88 1:92", ""], ["INTERMEDIATE_FRAME 61", ""], ["KEY_FRAME 62", "11928.0 4316.0 -239 -194 80 0 9019 1891 -2.4476565987575603 0 2 2", "\"\"", "13358.0 5504.0 -153 -197 80 0 9019 1891 -2.4367133937193377 0 2 4", "\"\"", "11454.0 5432.0 -209 -193 80 0 9019 1891 -2.189085425221699 0 2 3", "\"\"", "10024.0 5128.0 -147 -294 80 0 9019 1891 -1.888355790894331 0 2 1", "\"\"", "2:87 1:91", ""], ["INTERMEDIATE_FRAME 63", ""], ["KEY_FRAME 64", "11628.0 4071.0 -255 -208 80 0 9019 1891 -2.4466853385495733 0 2 2", "\"\"", "13144.0 5256.0 -182 -210 80 0 9019 1891 -2.447239873643751 0 2 4", "\"\"", "11200.0 5173.0 -216 -220 80 0 9019 1891 -2.1731915335734904 0 2 3", "\"\"", "9853.0 4758.0 -145 -314 80 0 9019 1891 -1.8718331588344996 0 2 1", "\"\"", "2:86 1:90", ""], ["INTERMEDIATE_FRAME 65", ""], ["KEY_FRAME 66", "11312.0 3812.0 -268 -220 80 0 9019 1891 -2.445536309315533 0 2 2", "\"\"", "12900.0 4995.0 -207 -221 80 0 9019 1891 -2.457317014247029 0 2 4", "\"\"", "10940.0 4886.0 -221 -243 80 0 9019 1891 -2.1573208908782333 0 2 3", "\"\"", "9686.0 4367.0 -142 -332 80 0 9019 1891 -1.85388041817114 0 2 1", "\"\"", "2:85 1:89", ""], ["INTERMEDIATE_FRAME 67", ""], ["KEY_FRAME 68", "10983.0 3541.0 -279 -230 80 0 9019 1891 -2.444243417268735 0 2 2", "\"\"", "12631.0 4724.0 -229 -230 80 0 9019 1891 -2.466977414517585 0 2 4", "\"\"", "10676.0 4576.0 -224 -263 80 0 9019 1891 -2.1411037321857727 0 2 3", "\"\"", "9523.0 3958.0 -138 -347 80 0 9019 1891 -1.833935891554679 0 2 1", "\"\"", "2:84 1:88", ""], ["INTERMEDIATE_FRAME 69", ""], ["KEY_FRAME 70", "10643.0 3260.0 -289 -239 80 0 9019 1891 -2.442861187077408 0 2 2", "\"\"", "12339.0 4445.0 -248 -237 80 0 9019 1891 -2.4764798841712383 0 2 4", "\"\"", "10410.0 4245.0 -226 -281 80 0 9019 1891 -2.123717893642302 0 2 3", "\"\"", "9366.0 3533.0 -133 -361 80 0 9019 1891 -1.809961101939919 0 2 1", "\"\"", "2:83 1:87", ""], ["INTERMEDIATE_FRAME 71", ""], ["KEY_FRAME 72", "10293.0 2969.0 -297 -246 80 0 9019 1891 -2.441188032588461 0 2 2", "\"\"", "12028.0 4159.0 -264 -242 80 0 9019 1891 -2.4858679152667515 0 2 4", "\"\"", "10143.0 3895.0 -226 -297 80 0 9019 1891 -2.104504518434158 0 2 3", "\"\"", "9216.0 3094.0 -127 -373 80 0 9019 1891 -1.7790597537178865 0 2 1", "\"\"", "2:82 1:86", ""], ["INTERMEDIATE_FRAME 73", ""], ["KEY_FRAME 74", "9935.0 2671.0 -304 -253 80 0 9019 1891 -2.439335722080786 0 2 2", "\"\"", "11700.0 3869.0 -278 -246 80 0 9019 1891 -2.495703014306923 0 2 4", "\"\"", "9878.0 3528.0 -225 -311 80 0 9019 1891 -2.081952975971059 0 2 3", "\"\"", "9076.0 2642.0 -118 -384 80 0 9019 1891 -1.7331129146808852 0 2 1", "\"\"", "2:81 1:85", ""], ["INTERMEDIATE_FRAME 75", ""], ["KEY_FRAME 76", "9748.0 2331.0 -98 -378 80 0 9019 1891 -2.436211952467815 0 2 2", "\"\"", "11358.0 3576.0 -291 -249 80 0 9019 1891 -2.505955472013653 0 2 4", "\"\"", "9610.0 3196.0 -237 -188 80 0 9019 1891 -2.0540397818665053 0 2 3", "\"\"", "8780.0 2163.0 -302 -411 80 0 9019 1891 -1.6465498884777756 0 0 1", "\"\"", "2:80 1:100", "19 0.25768112140430294 3 9044 2522 0 9841 2592 233.01936477473237 -244 -384", "21 0.6871989478967985 2 9698 3266 0 9784 2470 161.42789279063155 -197 -333", ""], ["INTERMEDIATE_FRAME 77", ""],
    ["KEY_FRAME 78", "9582.0 1912.0 -141 -356 80 0 9019 1891 -2.5985548310045394 0 0 2", "\"\"", "11002.0 3280.0 -302 -251 80 0 9019 1891 -2.517310606192838 0 2 4", "\"\"", "9340.0 2935.0 -229 -221 80 0 9019 1891 -1.9960373390077715 0 2 3", "\"\"", "8448.0 1678.0 -282 -412 80 0 4970 5340 -1.960709153836755 0 0 1", "\"\"", "2:100 1:99", ""], ["INTERMEDIATE_FRAME 79", ""], ["KEY_FRAME 80", "9363.0 1538.0 -186 -318 80 0 4970 5340 -2.9127140963635187 0 0 2", "\"\"", "10634.0 2983.0 -312 -252 80 0 9019 1891 -2.530562151599604 0 2 4", "\"\"", "9087.0 2638.0 -214 -252 80 0 9019 1891 -1.8690933197731585 0 2 3", "\"\"", "8114.0 1205.0 -283 -402 80 0 4970 5340 -2.2748684191957342 0 0 1", "\"\"", "2:99 1:98", ""], ["INTERMEDIATE_FRAME 81", ""], ["KEY_FRAME 82", "9097.0 1227.0 -225 -264 80 0 4970 5340 -3.226873361722498 0 0 3", "\"\"", "10256.0 2686.0 -321 -252 80 0 9019 1891 -2.547045827063183 0 2 4", "\"\"", "8866.0 2306.0 -188 -281 80 0 9019 1891 -1.6615769140554058 0 0 1", "\"\"", "7763.0 761.0 -298 -377 80 0 4970 5340 -2.5890276845547135 0 0 2", "\"\"", "2:98 1:100", ""], ["INTERMEDIATE_FRAME 83", ""], ["KEY_FRAME 84", "8798.0 994.0 -253 -197 80 0 4970 5340 -3.5410326270814774 0 0 3", "\"\"", "9868.0 2391.0 -330 -250 80 0 9019 1891 -2.5703777578277953 0 2 4", "\"\"", "8646.0 1951.0 -186 -301 80 0 4970 5340 -1.975736179414385 0 0 1", "\"\"", "7387.0 365.0 -319 -336 80 0 4970 5340 -2.903186949913693 0 0 2", "\"\"", "2:97 1:99", ""], ["INTERMEDIATE_FRAME 85", ""], ["KEY_FRAME 86", "8491.0 792.0 -242 -318 80 0 4970 5340 -3.8551918924404567 0 0 4", "\"\"", "9469.0 2100.0 -339 -247 80 0 9019 1891 -2.6093539977899836 0 0 2", "\"\"", "8400.0 1647.0 -226 -111 80 0 4970 5340 -2.2898954447733644 0 0 1", "\"\"", "6988.0 35.0 -338 -280 80 0 4970 5340 -3.217346215272672 0 0 3", "\"\"", "2:100 1:98", "22 0.7515635831119719 2 8467 1680 0 8562 885 231.9767314493858 -276 -253", ""], ["INTERMEDIATE_FRAME 87", ""], ["KEY_FRAME 88", "8200.0 537.0 -247 -216 80 0 4970 5340 2.229597928165242 0 0 4", "\"\"", "9052.0 1836.0 -354 -224 80 0 4970 5340 -2.923513263148963 0 0 2", "\"\"", "8105.0 1495.0 -250 -129 80 0 4970 5340 -2.6040547101323437 0 0 1", "\"\"", "6576.0 -215.0 -350 -212 80 0 4970 5340 -3.5315054806316515 0 0 3", "\"\"", "2:99 1:97", ""], ["INTERMEDIATE_FRAME 89", ""], ["KEY_FRAME 90", "7908.0 387.0 -247 -127 80 0 4970 5340 2.1628240176184397 0 0 3", "\"\"", "8618.0 1620.0 -368 -183 80 0 4970 5340 -3.237672528507942 0 0 2", "\"\"", "7777.0 1348.0 -278 -124 80 0 4970 5340 -2.918213975491323 0 0 1", "\"\"", "6165.0 -375.0 -349 -136 80 0 4970 5340 -3.845664745990631 0 0 4", "\"\"", "2:98 1:96", ""], ["INTERMEDIATE_FRAME 91", ""], ["KEY_FRAME 92", "7620.0 329.0 -244 -49 80 0 4970 5340 2.106182962087683 0 0 3", "\"\"", "8188.0 1472.0 -241 -86 80 0 4970 5340 -3.5518317938669215 0 0 2", "\"\"", "7408.0 1228.0 -437 -141 80 0 4970 5340 -3.2323732408503023 0 0 1", "\"\"", "5774.0 -443.0 -332 -57 80 0 4970 5340 -4.15982401134961 0 0 4", "\"\"", "2:97 1:95", "23 0.9303581373653436 2 7444 1239 1 8207 1479 165.07043757371366 -400 -134", ""], ["INTERMEDIATE_FRAME 93", ""], ["KEY_FRAME 94", "7339.0 351.0 -239 18 80 0 4970 5340 2.057246169896815 0 0 3", "\"\"", "7887.0 1439.0 -255 -28 80 0 4970 5340 -3.865991059225901 0 0 2", "\"\"", "6897.0 1119.0 -433 -93 80 0 4970 5340 -3.5465325062092816 0 0 1", "\"\"", "5423.0 -422.0 -298 17 80 0 4970 5340 -4.473983276708589 0 0 4", "\"\"", "2:96 1:94", ""], ["INTERMEDIATE_FRAME 95", ""], ["KEY_FRAME 96", "7066.0 441.0 -232 76 80 0 4970 5340 2.014117910656752 0 0 3", "\"\"", "7584.0 1475.0 -257 30 80 0 4970 5340 2.212860360001806 0 0 2", "\"\"", "6404.0 1079.0 -419 -34 80 0 4970 5340 -3.860691771568261 0 0 1", "\"\"", "5119.0 -325.0 -258 82 80 0 4970 5340 1.64925348299346 0 0 4", "\"\"", "2:95 1:93", ""], ["INTERMEDIATE_FRAME 97", ""], ["KEY_FRAME 98", "6803.0 591.0 -223 127 80 0 4970 5340 1.9750720613109913 0 0 3", "\"\"", "7282.0 1571.0 -256 81 80 0 4970 5340 2.1654563841449157 0 0 2", "\"\"", "5944.0 1114.0 -390 29 80 0 4970 5340 -4.17485103692724 0 0 1", "\"\"", "4859.0 -163.0 -221 137 80 0 4970 5340 1.5970921176996333 0 0 4", "\"\"", "2:94 1:92", ""], ["INTERMEDIATE_FRAME 99", ""], ["KEY_FRAME 100", "6551.0 793.0 -214 171 80 0 4970 5340 1.9391548939168224 0 0 3", "\"\"", "6984.0 1720.0 -253 126 80 0 4970 5340 2.1210289405554272 0 0 1", "\"\"", "5536.0 1221.0 -346 90 80 0 4970 5340 1.7973186453017351 0 0 2", "\"\"", "4640.0 54.0 -186 184 80 0 4970 5340 1.5506282457869565 0 0 4", "\"\"", "1:93 2:91", ""], ["INTERMEDIATE_FRAME 101", ""], ["KEY_FRAME 102", "6311.0 1040.0 -204 209 80 0 4970 5340 1.9054222700501164 0 0 3", "\"\"", "6692.0 1916.0 -248 166 80 0 4970 5340 2.078504444241846 0 0 1", "\"\"", "5179.0 1390.0 -303 143 80 0 4970 5340 1.707353114467139 0 0 2", "\"\"", "4459.0 318.0 -153 224 80 0 4970 5340 1.5084481831828227 0 0 4", "\"\"", "1:92 2:90", ""], ["INTERMEDIATE_FRAME 103", ""], ["KEY_FRAME 104", "6083.0 1325.0 -193 242 80 0 4970 5340 1.8730984523711216 0 0 3", "\"\"", "6408.0 2153.0 -241 201 80 0 4970 5340 2.0367776538460785 0 0 1", "\"\"", "4872.0 1613.0 -261 189 80 0 4970 5340 1.6236584247929147 0 0 2", "\"\"", "4314.0 622.0 -123 258 80 0 4970 5340 1.4693930364740662 0 0 4", "\"\"", "1:91 2:89", ""], ["INTERMEDIATE_FRAME 105", ""], ["KEY_FRAME 106", "5869.0 1644.0 -182 271 80 0 4970 5340 1.841216421866305 0 0 3", "\"\"", "6134.0 2427.0 -232 232 80 0 4970 5340 1.9946543995870276 0 0 1", "\"\"", "4613.0 1882.0 -220 228 80 0 4970 5340 1.5445077774457843 0 0 2", "\"\"", "4202.0 959.0 -95 286 80 0 4970 5340 1.4326401252354517 0 0 4", "\"\"", "1:90 2:88", ""], ["INTERMEDIATE_FRAME 107", ""], ["KEY_FRAME 108", "5644.0 1914.0 -208 175 80 0 4970 5340 1.8093987452759788 0 0 3", "\"\"", "5897.0 2812.0 -184 381 80 0 4970 5340 1.9509475272217884 0 0 1", "\"\"", "4401.0 2190.0 -180 261 80 0 4970 5340 1.467921914898833 0 0 2", "\"\"", "4121.0 1324.0 -69 310 80 0 4970 5340 1.3972572201241746 0 0 4", "\"\"", "1:89 2:87", "24 0.45021930510798025 1 6016 2565 0 5779 1801 149.29134150960502 -231 328", ""], ["INTERMEDIATE_FRAME 109", ""], ["KEY_FRAME 110", "5421.0 2167.0 -189 215 80 0 4970 5340 1.7650465364242491 0 0 3", "\"\"", "5685.0 3268.0 -179 387 80 0 4970 5340 1.9222643666112922 0 0 1", "\"\"", "4235.0 2530.0 -140 288 80 0 4970 5340 1.3920884619097276 0 0 2", "\"\"", "4069.0 1712.0 -44 330 80 0 4970 5340 1.3624594481110475 0 0 4", "\"\"", "1:88 2:86", ""], ["INTERMEDIATE_FRAME 111", ""], ["KEY_FRAME 112", "5221.0 2461.0 -170 250 80 0 4970 5340 1.7119873538047854 0 0 3", "\"\"", "5480.0 3731.0 -174 393 80 0 4970 5340 1.903078882468767 0 0 1", "\"\"", "4123.0 2954.0 -84 434 80 0 4970 5340 1.3149621402061258 0 0 2", "\"\"", "4036.0 2062.0 -38 222 80 0 4970 5340 1.3273747895100405 0 0 4", "\"\"", "1:87 2:85", "25 0.6019909870457283 3 4054 1957 2 4163 2750 147.3883094878387 -72 387", ""], ["INTERMEDIATE_FRAME 113", ""], ["KEY_FRAME 114", "5044.0 2791.0 -150 280 80 0 4970 5340 1.6577594889806357 0 0 3", "\"\"", "5282.0 4200.0 -168 398 80 0 4970 5340 1.877745638753104 0 0 1", "\"\"", "4066.0 3463.0 -48 432 80 0 4970 5340 1.2296852935231304 0 0 2", "\"\"", "4020.0 2361.0 -13 254 80 0 4970 5340 1.2932220646158832 0 0 4", "\"\"", "1:86 2:84", ""], ["INTERMEDIATE_FRAME 115", ""], ["KEY_FRAME 116", "4892.0 3151.0 -129 305 80 0 4970 5340 1.5998191677034457 0 0 3", "\"\"", "5093.0 4675.0 -160 403 80 0 4970 5340 1.837938847660592 0 0 1", "\"\"", "4053.0 3967.0 -11 428 80 0 4970 5340 1.121960858999987 0 0 2", "\"\"", "4031.0 2691.0 9 280 80 0 4970 5340 1.262092468121665 0 0 4", "\"\"", "1:85 2:83", ""], ["INTERMEDIATE_FRAME 117", ""], ["KEY_FRAME 118", "4766.0 3536.0 -107 327 80 0 4970 5340 1.5351786871478186 0 0 3", "\"\"", "4918.0 5157.0 -148 409 80 0 4970 5340 1.7536917428760057 0 1 1", "\"\"", "4086.0 4462.0 28 420 80 0 4970 5340 0.9819538107957508 0 0 2", "\"\"", "4067.0 3046.0 30 302 80 0 4970 5340 1.2301418800368968 0 0 4", "\"\"", "1:100 2:82", ""], ["INTERMEDIATE_FRAME 119", ""],
    ["KEY_FRAME 120", "4735.0 3997.0 29 437 80 0 4970 5340 1.4581926360597648 0 0 3", "\"\"", "4780.0 5645.0 -116 415 80 0 11548 6107 1.4395324775170264 0 1 1", "\"\"", "4171.0 4938.0 72 404 80 0 4970 5340 0.7819929552197544 0 0 2", "\"\"", "4060.0 3368.0 -62 227 80 0 4970 5340 1.1957885384361382 0 0 4", "\"\"", "1:99 2:81", "26 0.49925830922366365 3 4097 3234 0 4717 3739 171.51852266603794 -19 391", ""], ["INTERMEDIATE_FRAME 121", ""], ["KEY_FRAME 122", "4778.0 4513.0 36 438 80 0 4970 5340 1.3975687222950268 0 0 3", "\"\"", "4698.0 6132.0 -69 414 80 0 11548 6107 1.125373212158047 0 1 1", "\"\"", "4314.0 5378.0 121 374 80 0 4970 5340 0.4678336898607751 0 0 2", "\"\"", "4032.0 3668.0 -24 254 80 0 4970 5340 1.1384528681782191 0 0 4", "\"\"", "1:98 2:80", ""], ["INTERMEDIATE_FRAME 123", ""], ["KEY_FRAME 124", "4832.0 5029.0 45 438 80 0 4970 5340 1.3426732100704395 0 1 1", "\"\"", "4684.0 6604.0 -11 401 80 0 11548 6107 0.8112139467990678 0 1 2", "\"\"", "4514.0 5764.0 170 328 80 0 4970 5340 0.1536744245017958 0 1 3", "\"\"", "4047.0 3992.0 12 275 80 0 4970 5340 1.059543423362505 0 0 4", "\"\"", "1:100 2:100", ""], ["INTERMEDIATE_FRAME 125", ""], ["KEY_FRAME 126", "5010.0 5323.0 151 249 80 0 11548 6107 1.0285139447114602 0 1 1", "\"\"", "4758.0 7137.0 73 524 80 0 11548 6107 0.49705468144008846 0 1 2", "\"\"", "4657.0 6215.0 110 312 80 0 11548 6107 0.04872455505976036 0 1 3", "\"\"", "4104.0 4333.0 48 289 80 0 4970 5340 0.9704004698451837 0 0 4", "\"\"", "1:99 2:99", "27 0.003741535911921917 2 4515 5765 0 4832 5031 232.6040191921643 168 419", "28 0.4735962153562172 2 4589 6022 1 4712 6812 180.06252412388852 108 492", ""], ["INTERMEDIATE_FRAME 127", ""], ["KEY_FRAME 128", "5221.0 5624.0 179 256 80 0 11548 6107 0.7143546793524809 0 1 1", "\"\"", "4910.0 7676.0 128 457 80 0 11548 6107 0.18289541608110915 0 1 3", "\"\"", "4847.0 6526.0 161 264 80 0 11548 6107 -0.015671333419004566 0 1 2", "\"\"", "4204.0 4683.0 85 297 80 0 4970 5340 0.8605367363973089 0 0 4", "\"\"", "1:98 2:98", ""], ["INTERMEDIATE_FRAME 129", ""], ["KEY_FRAME 130", "5474.0 5911.0 214 244 80 0 11548 6107 0.40019541399350156 0 1 1", "\"\"", "5117.0 8123.0 176 379 80 0 11548 6107 -0.13126384927787016 0 1 3", "\"\"", "5088.0 6785.0 204 220 80 0 11548 6107 -0.062446681970679534 0 1 2", "\"\"", "4350.0 5032.0 123 296 80 0 4970 5340 0.7089487140769428 0 0 4", "\"\"", "1:97 2:97", ""], ["INTERMEDIATE_FRAME 131", ""], ["KEY_FRAME 132", "5768.0 6162.0 249 213 80 0 11548 6107 0.08603614863452225 0 1 1", "\"\"", "5369.0 8478.0 214 301 80 0 11548 6107 -0.3037788633216211 0 1 3", "\"\"", "5372.0 6997.0 241 179 80 0 11548 6107 -0.1045707241962257 0 1 2", "\"\"", "4545.0 5364.0 165 281 80 0 4970 5340 0.4610636354236506 0 1 4", "\"\"", "1:96 2:100", ""], ["INTERMEDIATE_FRAME 133", ""], ["KEY_FRAME 134", "6097.0 6374.0 279 180 80 0 11548 6107 -0.009515283750609853 0 1 1", "\"\"", "5658.0 8750.0 245 231 80 0 11548 6107 -0.36639277042885293 0 1 3", "\"\"", "5692.0 7165.0 272 142 80 0 11548 6107 -0.14312093323700417 0 1 2", "\"\"", "4789.0 5657.0 207 248 80 0 11548 6107 0.14690437006467127 0 1 4", "\"\"", "1:95 2:99", ""], ["INTERMEDIATE_FRAME 135", ""], ["KEY_FRAME 136", "6456.0 6550.0 305 149 80 0 11548 6107 -0.048942721745797085 0 1 1", "\"\"", "5976.0 8948.0 270 168 80 0 11548 6107 -0.4217945072323243 0 1 3", "\"\"", "6043.0 7293.0 298 108 80 0 11548 6107 -0.17874125351271714 0 1 2", "\"\"", "5076.0 5910.0 243 215 80 0 11548 6107 0.06647978551710561 0 1 4", "\"\"", "1:94 2:98", ""], ["INTERMEDIATE_FRAME 137", ""], ["KEY_FRAME 138", "6841.0 6692.0 326 120 80 0 11548 6107 -0.08678071083914342 0 1 1", "\"\"", "6317.0 9080.0 290 111 80 0 11548 6107 -0.4715130170537464 0 1 3", "\"\"", "6419.0 7384.0 319 77 80 0 11548 6107 -0.21219716767048966 0 1 2", "\"\"", "5399.0 6127.0 274 184 80 0 11548 6107 0.030429417835453557 0 1 4", "\"\"", "1:93 2:97", ""], ["INTERMEDIATE_FRAME 139", ""], ["KEY_FRAME 140", "7301.0 6715.0 407 -7 80 0 11548 6107 -0.12364894618208841 0 1 1", "\"\"", "6677.0 9151.0 305 60 80 0 11548 6107 -0.5168166538246206 0 1 3", "\"\"", "6761.0 7529.0 274 149 80 0 11548 6107 -0.2440150512560724 0 1 2", "\"\"", "5753.0 6311.0 300 156 80 0 11548 6107 -0.003252549922384714 0 1 4", "\"\"", "1:92 2:96", "29 0.2628816453696566 2 6523 7399 0 6948 6721 139.91450246525488 401 84", ""], ["INTERMEDIATE_FRAME 141", ""], ["KEY_FRAME 142", "7787.0 6697.0 413 -15 80 0 11548 6107 -0.14219372203126499 0 1 1", "\"\"", "7050.0 9169.0 316 14 80 0 11548 6107 -0.5585439525326645 0 1 4", "\"\"", "7112.0 7655.0 298 107 80 0 11548 6107 -0.2887523358266991 0 1 2", "\"\"", "6133.0 6464.0 322 130 80 0 11548 6107 -0.03518823031289831 0 1 3", "\"\"", "1:91 2:95", ""], ["INTERMEDIATE_FRAME 143", ""], ["KEY_FRAME 144", "8279.0 6670.0 418 -23 80 0 11548 6107 -0.15560500448862294 0 1 1", "\"\"", "7432.0 9138.0 324 -26 80 0 11548 6107 -0.5976872839297351 0 1 4", "\"\"", "7486.0 7736.0 317 68 80 0 11548 6107 -0.33575071663238076 0 1 2", "\"\"", "6535.0 6589.0 341 106 80 0 11548 6107 -0.06583270755775998 0 1 3", "\"\"", "1:90 2:94", ""], ["INTERMEDIATE_FRAME 145", ""], ["KEY_FRAME 146", "8776.0 6633.0 422 -31 80 0 11548 6107 -0.1705508154767171 0 1 1", "\"\"", "7820.0 9065.0 330 -62 80 0 11548 6107 -0.6347366112253078 0 1 4", "\"\"", "7877.0 7774.0 332 32 80 0 11548 6107 -0.3813974155730893 0 1 2", "\"\"", "6956.0 6687.0 357 83 80 0 11548 6107 -0.0958553460715695 0 1 3", "\"\"", "1:89 2:93", ""], ["INTERMEDIATE_FRAME 147", ""], ["KEY_FRAME 148", "9277.0 6587.0 425 -39 80 0 11548 6107 -0.18752517276926287 0 1 1", "\"\"", "8213.0 8953.0 333 -94 80 0 11548 6107 -0.6707372881101604 0 1 4", "\"\"", "8282.0 7773.0 344 0 80 0 11548 6107 -0.4262580046799414 0 1 2", "\"\"", "7392.0 6760.0 370 62 80 0 11548 6107 -0.1256413053390883 0 1 3", "\"\"", "1:88 2:92", ""], ["INTERMEDIATE_FRAME 149", ""], ["KEY_FRAME 150", "9780.0 6531.0 427 -47 80 0 11548 6107 -0.20829500147666136 0 1 1", "\"\"", "8607.0 8807.0 334 -124 80 0 11548 6107 -0.706449189399161 0 1 4", "\"\"", "8697.0 7737.0 352 -30 80 0 11548 6107 -0.4716981791565615 0 1 2", "\"\"", "7841.0 6810.0 381 42 80 0 11548 6107 -0.15584807412687876 0 1 3", "\"\"", "1:87 2:91", ""], ["INTERMEDIATE_FRAME 151", ""], ["KEY_FRAME 152", "10285.0 6465.0 429 -55 80 0 11548 6107 -0.2353738357627534 0 1 1", "\"\"", "9000.0 8629.0 333 -151 80 0 11548 6107 -0.7427012068093971 0 1 4", "\"\"", "9118.0 7667.0 358 -59 80 0 11548 6107 -0.5193727260189025 0 1 2", "\"\"", "8301.0 6837.0 390 23 80 0 11548 6107 -0.18741564376508654 0 1 3", "\"\"", "1:86 2:90", ""], ["INTERMEDIATE_FRAME 153", ""], ["KEY_FRAME 154", "10791.0 6388.0 430 -65 80 0 11548 6107 -0.276206955143656 0 1 1", "\"\"", "9390.0 8422.0 331 -176 80 0 11548 6107 -0.7802700032232139 0 1 4", "\"\"", "9543.0 7565.0 361 -86 80 0 11548 6107 -0.5707132601893592 0 1 2", "\"\"", "8769.0 6842.0 397 4 80 0 11548 6107 -0.22114588243733202 0 1 3", "\"\"", "1:85 2:89", ""], ["INTERMEDIATE_FRAME 155", ""], ["KEY_FRAME 156", "11296.0 6295.0 429 -78 80 0 11548 6107 -0.35543686612639386 0 2 1", "\"\"", "9767.0 8224.0 295 -63 80 0 11548 6107 -0.8204832459627953 0 1 4", "\"\"", "9977.0 7396.0 394 -249 80 0 11548 6107 -0.6287369726754747 0 1 2", "\"\"", "9243.0 6826.0 403 -13 80 0 11548 6107 -0.2585631788876847 0 1 3", "\"\"", "1:100 2:88", "30 0.773234156332546 2 9872 7462 1 9688 8241 164.75452257182604 406 -184", ""], ["INTERMEDIATE_FRAME 157", ""], ["KEY_FRAME 158", "11788.0 6167.0 417 -108 80 0 9019 1891 -0.6695961314853731 0 2 1", "\"\"", "10114.0 8100.0 294 -105 80 0 11548 6107 -0.8713836735727398 0 1 4", "\"\"", "10466.0 7113.0 531 -182 80 0 11548 6107 -0.6871144556616946 0 1 2", "\"\"", "9689.0 6773.0 263 -103 80 0 11548 6107 -0.30236602963215126 0 1 3", "\"\"", "1:99 2:87", "31 0.8037748869882143 3 9628 6796 2 10343 7155 189.45272733287908 468 -168", ""], ["INTERMEDIATE_FRAME 159", ""],
    ["KEY_FRAME 160", "12249.0 5992.0 392 -148 80 0 9019 1891 -0.9837553968443524 0 2 1", "\"\"", "10455.0 7930.0 289 -144 80 0 11548 6107 -0.9470905788301649 0 1 4", "\"\"", "11056.0 6877.0 501 -201 80 0 11548 6107 -0.749015757349918 0 1 2", "\"\"", "10027.0 6643.0 287 -110 80 0 11548 6107 -0.3440118131065725 0 1 3", "\"\"", "1:98 2:86", ""], ["INTERMEDIATE_FRAME 161", ""], ["KEY_FRAME 162", "12663.0 5767.0 351 -191 80 0 9019 1891 -1.2979146622033317 0 2 1", "\"\"", "10785.0 7717.0 280 -180 80 0 11548 6107 -1.0306995633212401 0 1 4", "\"\"", "11600.0 6609.0 462 -228 80 0 11548 6107 -1.0022205443062417 0 2 2", "\"\"", "10389.0 6506.0 308 -116 80 0 11548 6107 -0.33881106803923156 0 1 3", "\"\"", "1:97 2:100", ""], ["INTERMEDIATE_FRAME 163", ""], ["KEY_FRAME 164", "13011.0 5496.0 295 -230 80 0 9019 1891 -1.612073927562311 0 2 2", "\"\"", "11099.0 7465.0 267 -214 80 0 11548 6107 -1.1282352228634966 0 1 4", "\"\"", "12082.0 6304.0 409 -259 80 0 9019 1891 -1.316379809665221 0 2 1", "\"\"", "10773.0 6364.0 326 -120 80 0 11548 6107 -0.33155416187593817 0 1 3", "\"\"", "2:96 1:99", ""], ["INTERMEDIATE_FRAME 165", ""], ["KEY_FRAME 166", "13278.0 5191.0 227 -259 80 0 9019 1891 -1.9262331929212904 0 2 3", "\"\"", "11391.0 7175.0 248 -246 80 0 11548 6107 -1.2514777817532998 0 1 4", "\"\"", "12486.0 5965.0 343 -288 80 0 9019 1891 -1.6305390750242004 0 2 2", "\"\"", "11175.0 6219.0 341 -123 80 0 11548 6107 -0.3202013689589845 0 2 1", "\"\"", "2:95 1:100", ""], ["INTERMEDIATE_FRAME 167", ""], ["KEY_FRAME 168", "13455.0 4869.0 150 -273 80 0 9019 1891 -2.2403924582802697 0 2 3", "\"\"", "11651.0 6850.0 220 -276 80 0 11548 6107 -1.4248379817988828 0 1 4", "\"\"", "12800.0 5603.0 266 -308 80 0 9019 1891 -1.9446983403831797 0 2 2", "\"\"", "11580.0 6049.0 344 -144 80 0 9019 1891 -0.6343606343179637 0 2 1", "\"\"", "2:94 1:99", ""], ["INTERMEDIATE_FRAME 169", ""], ["KEY_FRAME 170", "13539.0 4551.0 71 -269 80 0 9019 1891 -2.550371622616518 0 2 3", "\"\"", "11876.0 6689.0 191 -132 80 0 11548 6107 -1.7085455922142847 0 1 4", "\"\"", "13015.0 5233.0 182 -314 80 0 9019 1891 -2.258857605742159 0 2 2", "\"\"", "11954.0 5645.0 317 -347 80 0 9019 1891 -0.9485198996769431 0 2 1", "\"\"", "2:93 1:98", "32 0.02567785068042937 3 11590 6044 1 11656 6841 200.39700211610034 300 -282", ""], ["INTERMEDIATE_FRAME 171", ""], ["KEY_FRAME 172", "13590.0 4172.0 88 -385 80 0 9019 1891 -2.6096752375321595 0 2 3", "\"\"", "12032.0 6485.0 132 -173 80 0 11548 6107 -2.022704857573264 0 1 4", "\"\"", "13087.0 4937.0 15 -187 80 0 9019 1891 -2.4450847287463753 0 2 2", "\"\"", "12295.0 5222.0 290 -359 80 0 9019 1891 -1.2626791650359224 0 2 1", "\"\"", "2:92 1:97", "33 0.5209861957474732 2 13078 5043 0 13540 4390 177.00717962676725 61 -337", ""], ["INTERMEDIATE_FRAME 173", ""], ["KEY_FRAME 174", "13606.0 3751.0 13 -357 80 0 9019 1891 -2.6787329285194534 0 2 2", "\"\"", "12109.0 6254.0 65 -196 80 0 11548 6107 -2.3368641229322433 0 2 4", "\"\"", "13364.0 4589.0 268 -307 80 0 9019 1891 -2.4988786363301534 0 2 3", "\"\"", "12259.0 4896.0 -64 -265 80 0 9019 1891 -1.5768384303949017 0 2 1", "\"\"", "2:100 1:96", "34 0.10773036187217269 3 12326 5175 2 13082 4912 386.81951651916745 120 -337", ""], ["INTERMEDIATE_FRAME 175", ""], ["KEY_FRAME 176", "13545.0 3364.0 -51 -329 80 0 9019 1891 -2.756359243593717 0 2 2", "\"\"", "12128.0 5993.0 15 -222 80 0 9019 1891 -2.187023308326873 0 2 4", "\"\"", "13564.0 4240.0 170 -296 80 0 9019 1891 -2.5859156097205367 0 2 3", "\"\"", "12170.0 4555.0 -75 -289 80 0 9019 1891 -1.890997695753881 0 2 1", "\"\"", "2:99 1:95", ""], ["INTERMEDIATE_FRAME 177", ""], ["KEY_FRAME 178", "13418.0 3010.0 -108 -300 80 0 9019 1891 -2.826951141612569 0 2 2", "\"\"", "12095.0 5707.0 -28 -242 80 0 9019 1891 -2.2193488789244156 0 2 3", "\"\"", "13663.0 3907.0 84 -282 80 0 9019 1891 -2.6645705470669285 0 2 4", "\"\"", "12048.0 4202.0 -104 -300 80 0 9019 1891 -2.20515696111286 0 2 1", "\"\"", "2:98 1:94", ""], ["INTERMEDIATE_FRAME 179", ""], ["KEY_FRAME 180", "13232.0 2690.0 -157 -271 80 0 9019 1891 -2.892499666897717 0 2 2", "\"\"", "12017.0 5403.0 -66 -258 80 0 9019 1891 -2.249233403091813 0 2 3", "\"\"", "13674.0 3593.0 9 -266 80 0 9019 1891 -2.732032367141195 0 2 4", "\"\"", "11880.0 3853.0 -142 -296 80 0 9019 1891 -2.489849828948109 0 2 1", "\"\"", "2:97 1:93", ""], ["INTERMEDIATE_FRAME 181", ""], ["KEY_FRAME 182", "12996.0 2404.0 -200 -243 80 0 9019 1891 -2.9541674914824907 0 2 2", "\"\"", "11899.0 5084.0 -100 -271 80 0 9019 1891 -2.27740249455781 0 2 3", "\"\"", "13608.0 3300.0 -56 -249 80 0 9019 1891 -2.791063425213272 0 2 4", "\"\"", "11672.0 3512.0 -176 -290 80 0 9019 1891 -2.5404781445903923 0 2 1", "\"\"", "2:96 1:92", ""], ["INTERMEDIATE_FRAME 183", ""], ["KEY_FRAME 184", "12717.0 2151.0 -237 -215 80 0 9019 1891 -3.013309317717379 0 2 2", "\"\"", "11745.0 4754.0 -130 -280 80 0 9019 1891 -2.304700451487101 0 2 3", "\"\"", "13476.0 3028.0 -112 -231 80 0 9019 1891 -2.843691029454059 0 2 4", "\"\"", "11428.0 3180.0 -207 -281 80 0 9019 1891 -2.593119488083541 0 2 1", "\"\"", "2:95 1:91", ""], ["INTERMEDIATE_FRAME 185", ""], ["KEY_FRAME 186", "12400.0 1930.0 -269 -187 80 0 9019 1891 -3.071399886989799 0 2 2", "\"\"", "11560.0 4416.0 -157 -287 80 0 9019 1891 -2.331686962792343 0 2 3", "\"\"", "13286.0 2777.0 -161 -213 80 0 9019 1891 -2.8918157146063033 0 2 4", "\"\"", "11150.0 2861.0 -235 -270 80 0 9019 1891 -2.6502789434713443 0 2 1", "\"\"", "2:94 1:90", ""], ["INTERMEDIATE_FRAME 187", ""], ["KEY_FRAME 188", "12051.0 1742.0 -296 -159 80 0 9019 1891 -3.130058116354502 0 2 2", "\"\"", "11346.0 4073.0 -181 -291 80 0 9019 1891 -2.3593527899950932 0 2 3", "\"\"", "13047.0 2548.0 -203 -194 80 0 9019 1891 -2.936861821856623 0 2 4", "\"\"", "10842.0 2558.0 -261 -257 80 0 9019 1891 -2.7144349565608135 0 2 1", "\"\"", "2:93 1:89", ""], ["INTERMEDIATE_FRAME 189", ""], ["KEY_FRAME 190", "11675.0 1587.0 -319 -131 80 0 9019 1891 3.0924896755802083 0 2 2", "\"\"", "11107.0 3727.0 -203 -293 80 0 9019 1891 -2.388341318312733 0 2 3", "\"\"", "12765.0 2341.0 -239 -175 80 0 9019 1891 -2.9799082120653195 0 2 4", "\"\"", "10506.0 2274.0 -285 -241 80 0 9019 1891 -2.790841105964618 0 2 1", "\"\"", "2:92 1:88", ""], ["INTERMEDIATE_FRAME 191", ""], ["KEY_FRAME 192", "11277.0 1465.0 -338 -103 80 0 9019 1891 3.027630751782412 0 2 2", "\"\"", "10844.0 3381.0 -223 -293 80 0 9019 1891 -2.4203266051937766 0 2 3", "\"\"", "12447.0 2156.0 -270 -156 80 0 9019 1891 -3.022037411782653 0 2 4", "\"\"", "10144.0 2013.0 -308 -221 80 0 9019 1891 -2.8895062283095245 0 2 1", "\"\"", "2:91 1:87", ""], ["INTERMEDIATE_FRAME 193", ""], ["KEY_FRAME 194", "10860.0 1377.0 -354 -74 80 0 9019 1891 2.955121889544212 0 2 2", "\"\"", "10559.0 3037.0 -242 -292 80 0 9019 1891 -2.4569083864420187 0 2 3", "\"\"", "12097.0 1994.0 -297 -137 80 0 9019 1891 -3.0644415435289405 0 2 4", "\"\"", "9756.0 1783.0 -329 -195 80 0 9019 1891 -3.0335703438548696 0 2 1", "\"\"", "2:90 1:86", ""], ["INTERMEDIATE_FRAME 195", ""], ["KEY_FRAME 196", "10429.0 1325.0 -366 -44 80 0 9019 1891 2.869329572354709 0 2 3", "\"\"", "10253.0 2697.0 -260 -288 80 0 9019 1891 -2.501842308620336 0 2 2", "\"\"", "11720.0 1854.0 -320 -118 80 0 9019 1891 -3.1081418479916905 0 2 4", "\"\"", "9348.0 1600.0 -346 -155 80 0 9019 1891 2.996088248010808 0 0 1", "\"\"", "2:89 1:100", ""], ["INTERMEDIATE_FRAME 197", ""], ["KEY_FRAME 198", "9989.0 1311.0 -374 -12 80 0 9019 1891 2.7598640820236513 0 2 3", "\"\"", "9926.0 2365.0 -277 -281 80 0 9019 1891 -2.5629988804066364 0 2 2", "\"\"", "11320.0 1737.0 -339 -99 80 0 9019 1891 3.1278948802169273 0 2 4", "\"\"", "8930.0 1480.0 -355 -101 80 0 4970 5340 2.681928982651829 0 0 1", "\"\"", "2:88 1:99", ""], ["INTERMEDIATE_FRAME 199", ""],
    ["KEY_FRAME 200", "9546.0 1247.0 -378 -269 80 0 9019 1891 2.602690602837341 0 2 3", "\"\"", "9579.0 2140.0 -293 24 80 0 9019 1891 -2.660027381860239 0 2 2", "\"\"", "10901.0 1643.0 -355 -79 80 0 9019 1891 3.074764891908122 0 2 4", "\"\"", "8518.0 1435.0 -350 -38 80 0 4970 5340 2.3689815170046336 0 0 1", "\"\"", "2:87 1:98", "35 0.7318314415343049 1 9671 2132 0 9665 1332 346.3459731680175 -395 -144", ""], ["INTERMEDIATE_FRAME 201", ""], ["KEY_FRAME 202", "9115.0 1038.0 -366 -177 80 0 9019 1891 2.2885313374783616 0 2 3", "\"\"", "9213.0 2131.0 -311 -7 80 0 9019 1891 -2.7232026513811984 0 0 2", "\"\"", "10467.0 1574.0 -369 -58 80 0 9019 1891 3.0105728335255884 0 2 4", "\"\"", "8114.0 1456.0 -343 18 80 0 4970 5340 2.308330899895242 0 0 1", "\"\"", "2:100 1:97", ""], ["INTERMEDIATE_FRAME 203", ""], ["KEY_FRAME 204", "8718.0 935.0 -337 -87 80 0 9019 1891 1.9743720721193823 0 2 3", "\"\"", "8822.0 2116.0 -331 -13 80 0 4970 5340 -3.0373619167401777 0 0 2", "\"\"", "10020.0 1533.0 -380 -34 80 0 9019 1891 2.9260701922830012 0 2 4", "\"\"", "7721.0 1536.0 -334 68 80 0 4970 5340 2.2512879244660007 0 0 1", "\"\"", "2:99 1:96", ""], ["INTERMEDIATE_FRAME 205", ""], ["KEY_FRAME 206", "8374.0 928.0 -292 -6 80 0 9019 1891 1.660212806760403 0 2 4", "\"\"", "8413.0 2120.0 -347 3 80 0 4970 5340 -3.351521182099157 0 0 2", "\"\"", "9565.0 1526.0 -387 -6 80 0 9019 1891 2.7981257873564958 0 2 3", "\"\"", "7340.0 1669.0 -323 112 80 0 4970 5340 2.1969145515803885 0 0 1", "\"\"", "2:98 1:95", ""], ["INTERMEDIATE_FRAME 207", ""], ["KEY_FRAME 208", "8100.0 1000.0 -233 61 80 0 9019 1891 1.3460535414014236 0 2 4", "\"\"", "7997.0 2163.0 -353 36 80 0 4970 5340 -3.6656804474581364 0 0 2", "\"\"", "9111.0 1564.0 -385 32 80 0 9019 1891 2.5523231588281265 0 0 3", "\"\"", "6974.0 1848.0 -311 152 80 0 4970 5340 2.144072641446784 0 0 1", "\"\"", "2:97 1:100", ""], ["INTERMEDIATE_FRAME 209", ""], ["KEY_FRAME 210", "7908.0 1130.0 -163 110 80 0 9019 1891 1.0318942760424443 0 2 4", "\"\"", "7589.0 2257.0 -346 79 80 0 4970 5340 2.3320212500916213 0 0 2", "\"\"", "8667.0 1650.0 -377 73 80 0 4970 5340 2.402265189297843 0 0 3", "\"\"", "6623.0 2069.0 -298 188 80 0 4970 5340 2.0917908677717447 0 0 1", "\"\"", "2:96 1:99", ""], ["INTERMEDIATE_FRAME 211", ""], ["KEY_FRAME 212", "7681.0 1191.0 -269 -10 80 0 9019 1891 0.717735010683465 0 2 4", "\"\"", "7191.0 2397.0 -338 118 80 0 4970 5340 2.2749984422400447 0 0 2", "\"\"", "8358.0 1881.0 -186 259 80 0 4970 5340 2.357142100576093 0 0 3", "\"\"", "6289.0 2328.0 -283 220 80 0 4970 5340 2.0387148067164826 0 0 1", "\"\"", "2:95 1:98", "36 0.42128475842529167 2 8484 1705 0 7865 1199 277.2100343995169 -268 146", ""], ["INTERMEDIATE_FRAME 213", ""], ["KEY_FRAME 214", "7483.0 1218.0 -168 23 80 0 9019 1891 0.4820104736781832 0 2 4", "\"\"", "6805.0 2579.0 -328 154 80 0 4970 5340 2.217280882120091 0 0 2", "\"\"", "8116.0 2197.0 -205 268 80 0 4970 5340 2.3458253569416927 0 0 3", "\"\"", "5974.0 2621.0 -267 249 80 0 4970 5340 1.9835550487438964 0 0 1", "\"\"", "2:94 1:97", ""], ["INTERMEDIATE_FRAME 215", ""], ["KEY_FRAME 216", "7388.0 1273.0 -80 46 80 0 9019 1891 0.41295675902178036 0 2 4", "\"\"", "6514.0 2790.0 -187 172 80 0 4970 5340 2.1573766942061203 0 0 2", "\"\"", "7854.0 2522.0 -222 275 80 0 4970 5340 2.3566715135303076 0 0 3", "\"\"", "5598.0 2954.0 -379 290 80 0 4970 5340 1.9245193901198676 0 0 1", "\"\"", "2:93 1:96", "37 0.465286423451822 3 5837 2772 1 6632 2682 152.71292864765462 -333 272", ""], ["INTERMEDIATE_FRAME 217", ""], ["KEY_FRAME 218", "7383.0 1347.0 -4 63 80 0 9019 1891 0.36219301632399803 0 2 4", "\"\"", "6286.0 3030.0 -194 204 80 0 4970 5340 2.115242959822603 0 0 2", "\"\"", "7575.0 2853.0 -237 281 80 0 4970 5340 2.367768859312167 0 0 3", "\"\"", "5199.0 3321.0 -339 312 80 0 4970 5340 1.8281613009977151 0 0 1", "\"\"", "2:92 1:95", ""], ["INTERMEDIATE_FRAME 219", ""], ["KEY_FRAME 220", "7455.0 1435.0 61 75 80 0 9019 1891 0.3210168788129493 0 2 4", "\"\"", "6052.0 3304.0 -198 232 80 0 4970 5340 2.0886361060562297 0 0 2", "\"\"", "7280.0 3189.0 -250 285 80 0 4970 5340 2.379363948985355 0 0 3", "\"\"", "4851.0 3712.0 -295 332 80 0 4970 5340 1.6837361527000965 0 0 1", "\"\"", "2:91 1:94", ""], ["INTERMEDIATE_FRAME 221", ""], ["KEY_FRAME 222", "7593.0 1532.0 117 82 80 0 9019 1891 0.28369589667672457 0 2 4", "\"\"", "5816.0 3607.0 -200 257 80 0 4970 5340 2.0592739112977565 0 0 2", "\"\"", "6971.0 3529.0 -262 288 80 0 4970 5340 2.391821641443119 0 0 3", "\"\"", "4562.0 4124.0 -245 350 80 0 4970 5340 1.4978302715877574 0 0 1", "\"\"", "2:90 1:93", ""], ["INTERMEDIATE_FRAME 223", ""], ["KEY_FRAME 224", "7788.0 1634.0 165 86 80 0 9019 1891 0.24662801013860416 0 2 4", "\"\"", "5581.0 3936.0 -199 279 80 0 4970 5340 2.0249358735319047 0 0 2", "\"\"", "6650.0 3871.0 -273 290 80 0 4970 5340 2.4059958795044825 0 0 3", "\"\"", "4342.0 4550.0 -186 361 80 0 4970 5340 1.2470733883682081 0 0 1", "\"\"", "2:89 1:92", ""], ["INTERMEDIATE_FRAME 225", ""], ["KEY_FRAME 226", "8031.0 1736.0 206 86 80 0 9019 1891 0.20581707004965483 0 2 4", "\"\"", "5350.0 4288.0 -196 299 80 0 4970 5340 1.9812621913586628 0 0 2", "\"\"", "6317.0 4214.0 -283 291 80 0 4970 5340 2.4230998794327703 0 0 3", "\"\"", "4204.0 4975.0 -117 361 80 0 4970 5340 0.9329141230092288 0 0 1", "\"\"", "2:88 1:91", ""], ["INTERMEDIATE_FRAME 227", ""], ["KEY_FRAME 228", "8316.0 1834.0 242 83 80 0 9019 1891 0.15561419731149698 0 2 4", "\"\"", "5127.0 4662.0 -189 318 80 0 4970 5340 1.9174286229766746 0 0 1", "\"\"", "5973.0 4556.0 -292 290 80 0 4970 5340 2.4453228733395993 0 0 3", "\"\"", "4152.0 5382.0 -44 346 80 0 4970 5340 0.6187548576502495 0 0 2", "\"\"", "1:87 2:90", ""], ["INTERMEDIATE_FRAME 229", ""], ["KEY_FRAME 230", "8638.0 1923.0 273 76 80 0 9019 1891 0.0809040991552306 0 0 4", "\"\"", "4805.0 5077.0 -334 362 80 0 4970 5340 1.798349078852423 0 1 1", "\"\"", "5733.0 4877.0 -143 262 80 0 4970 5340 2.478138190755915 0 0 3", "\"\"", "4184.0 5752.0 27 314 80 0 4970 5340 0.3045955922912702 0 0 2", "\"\"", "1:100 2:89", "38 0.3799851553614534 2 5838 4685 1 5048 4812 188.52765137193006 -281 368", ""], ["INTERMEDIATE_FRAME 231", ""], ["KEY_FRAME 232", "8985.0 2030.0 294 90 80 0 4970 5340 0.3950633645142099 0 0 4", "\"\"", "4631.0 5318.0 -88 128 80 0 11548 6107 1.4841898134934437 0 1 2", "\"\"", "5522.0 5181.0 -179 257 80 0 4970 5340 2.5961770380867875 0 1 1", "\"\"", "4138.0 6266.0 -98 513 80 0 4970 5340 -0.00956367306770911 0 0 3", "\"\"", "2:99 1:100", "39 0.31011705213518986 3 4217 5849 1 4704 5214 365.905719097647 -110 377", ""], ["INTERMEDIATE_FRAME 233", ""], ["KEY_FRAME 234", "9340.0 2172.0 301 120 80 0 4970 5340 0.7092226298731892 0 0 4", "\"\"", "4477.0 5529.0 -227 188 80 0 11548 6107 1.1700305481344644 0 1 2", "\"\"", "5388.0 5490.0 -16 253 80 0 11548 6107 2.282017772727808 0 1 1", "\"\"", "4116.0 6754.0 -18 414 80 0 4970 5340 -0.3237229384266884 0 0 3", "\"\"", "2:98 1:99", "40 0.541477164124459 2 5397 5353 1 4600 5427 212.21746540084897 -144 260", ""], ["INTERMEDIATE_FRAME 235", ""], ["KEY_FRAME 236", "9683.0 2360.0 291 160 80 0 4970 5340 1.0233818952321685 0 0 4", "\"\"", "4302.0 5777.0 -148 211 80 0 11548 6107 0.8558712827754851 0 1 2", "\"\"", "5341.0 5817.0 -39 277 80 0 11548 6107 1.9678585073688288 0 1 1", "\"\"", "4162.0 7120.0 39 311 80 0 4970 5340 -0.6378822037856677 0 0 3", "\"\"", "2:97 1:98", ""], ["INTERMEDIATE_FRAME 237", ""], ["KEY_FRAME 238", "9992.0 2598.0 263 202 80 0 4970 5340 1.3375411605911478 0 0 4", "\"\"", "4223.0 6029.0 -67 214 80 0 11548 6107 0.5417120174165058 0 1 2", "\"\"", "5295.0 6174.0 -38 303 80 0 11548 6107 1.6536992420098495 0 1 1", "\"\"", "4247.0 7366.0 72 208 80 0 4970 5340 -0.952041469144647 0 0 3", "\"\"", "2:96 1:97", ""], ["INTERMEDIATE_FRAME 239", ""],
    ["KEY_FRAME 240", "10249.0 2880.0 218 239 80 0 4970 5340 1.6517004259501271 0 0 4", "\"\"", "4234.0 6261.0 9 197 80 0 11548 6107 0.22755275205752645 0 1 2", "\"\"", "5275.0 6555.0 -16 323 80 0 11548 6107 1.3395399766508702 0 1 1", "\"\"", "4346.0 7499.0 84 112 80 0 4970 5340 -1.2280225505392113 0 0 3", "\"\"", "2:95 1:96", ""], ["INTERMEDIATE_FRAME 241", ""], ["KEY_FRAME 242", "10436.0 3193.0 159 265 80 0 4970 5340 1.9658596913091064 0 0 4", "\"\"", "4323.0 6456.0 75 166 80 0 11548 6107 -0.02105239926360259 0 1 2", "\"\"", "5301.0 6946.0 21 332 80 0 11548 6107 1.025380711291891 0 1 1", "\"\"", "4452.0 7534.0 90 29 80 0 4970 5340 -1.2894406293848146 0 0 3", "\"\"", "2:94 1:95", ""], ["INTERMEDIATE_FRAME 243", ""], ["KEY_FRAME 244", "10543.0 3519.0 90 276 80 0 4970 5340 2.2800189566680857 0 0 4", "\"\"", "4478.0 6618.0 131 137 80 0 11548 6107 -0.04826698075628164 0 1 2", "\"\"", "5383.0 7330.0 69 326 80 0 11548 6107 0.7112214459329116 0 1 1", "\"\"", "4560.0 7485.0 92 -41 80 0 4970 5340 -1.338943658222481 0 0 3", "\"\"", "2:93 1:94", ""], ["INTERMEDIATE_FRAME 245", ""], ["KEY_FRAME 246", "10565.0 3837.0 18 269 80 0 4970 5340 2.594178222027065 0 0 4", "\"\"", "4676.0 6563.0 164 -106 80 0 11548 6107 -0.07215176205881796 0 1 2", "\"\"", "5526.0 7687.0 121 303 80 0 11548 6107 0.3970621805739323 0 1 1", "\"\"", "4680.0 7552.0 105 116 80 0 4970 5340 -1.381932216887564 0 0 3", "\"\"", "2:92 1:93", "41 0.2742844959852123 3 4589 7452 1 4536 6654 257.1926253528814 159 6", ""], ["INTERMEDIATE_FRAME 247", ""], ["KEY_FRAME 248", "10506.0 4127.0 -50 246 80 0 4970 5340 2.8791556463351506 0 0 4", "\"\"", "4920.0 6452.0 207 -94 80 0 11548 6107 -0.06625909254474412 0 1 2", "\"\"", "5727.0 7997.0 170 263 80 0 11548 6107 0.08290291521495297 0 1 1", "\"\"", "4795.0 7589.0 98 31 80 0 4970 5340 -1.440436734115714 0 0 3", "\"\"", "2:91 1:92", ""], ["INTERMEDIATE_FRAME 249", ""], ["KEY_FRAME 250", "10378.0 4390.0 -108 223 80 0 4970 5340 2.9258902061910135 0 0 4", "\"\"", "5207.0 6354.0 243 -83 80 0 11548 6107 -0.05200496748558259 0 1 2", "\"\"", "5975.0 8242.0 210 207 80 0 11548 6107 -0.23125635014402635 0 1 1", "\"\"", "4899.0 7540.0 88 -41 80 0 4970 5340 -1.4931404428273254 0 0 3", "\"\"", "2:90 1:91", ""], ["INTERMEDIATE_FRAME 251", ""], ["KEY_FRAME 252", "10191.0 4627.0 -158 201 80 0 4970 5340 2.967701160434376 0 0 4", "\"\"", "5530.0 6268.0 274 -73 80 0 11548 6107 -0.03893316310448322 0 1 2", "\"\"", "6260.0 8420.0 241 151 80 0 11548 6107 -0.36585051040031485 0 1 1", "\"\"", "4990.0 7419.0 76 -102 80 0 4970 5340 -1.5385347968519172 0 0 3", "\"\"", "2:89 1:90", ""], ["INTERMEDIATE_FRAME 253", ""], ["KEY_FRAME 254", "9954.0 4839.0 -201 180 80 0 4970 5340 3.0058683600904104 0 0 4", "\"\"", "5884.0 6193.0 300 -63 80 0 11548 6107 -0.02674669421827008 0 1 2", "\"\"", "6574.0 8539.0 267 101 80 0 11548 6107 -0.41233107573082906 0 1 1", "\"\"", "5065.0 7237.0 63 -154 80 0 4970 5340 -1.5804160396714504 0 0 3", "\"\"", "2:88 1:89", ""], ["INTERMEDIATE_FRAME 255", ""], ["KEY_FRAME 256", "9673.0 5027.0 -238 159 80 0 4970 5340 3.041407523521941 0 0 4", "\"\"", "6264.0 6129.0 322 -54 80 0 11548 6107 -0.015182449159239015 0 1 2", "\"\"", "6913.0 8605.0 288 55 80 0 11548 6107 -0.4547625439476993 0 1 1", "\"\"", "5124.0 7003.0 50 -198 80 0 4970 5340 -1.620833597237328 0 0 3", "\"\"", "2:87 1:88", ""], ["INTERMEDIATE_FRAME 257", ""], ["KEY_FRAME 258", "9355.0 5191.0 -270 139 80 0 4970 5340 3.075137391673548 0 0 4", "\"\"", "6666.0 6075.0 341 -46 80 0 11548 6107 -0.004163488432851931 0 1 1", "\"\"", "7271.0 8622.0 304 14 80 0 11548 6107 -0.4943144024367066 0 1 2", "\"\"", "5167.0 6725.0 36 -236 80 0 4970 5340 -1.6631367024663 0 0 3", "\"\"", "1:86 2:87", ""], ["INTERMEDIATE_FRAME 259", ""], ["KEY_FRAME 260", "9005.0 5333.0 -297 120 80 0 4970 5340 3.1076262466742746 0 0 4", "\"\"", "7087.0 6030.0 357 -38 80 0 11548 6107 0.006554596831107094 0 1 1", "\"\"", "7644.0 8595.0 317 -22 80 0 11548 6107 -0.5315707854974702 0 1 2", "\"\"", "5192.0 6410.0 21 -267 80 0 4970 5340 -1.7120868307253654 0 0 3", "\"\"", "1:85 2:86", ""], ["INTERMEDIATE_FRAME 261", ""], ["KEY_FRAME 262", "8628.0 5453.0 -320 102 80 0 4970 5340 3.139857835007982 0 0 4", "\"\"", "7524.0 5993.0 371 -31 80 0 11548 6107 0.017258990012988355 0 1 1", "\"\"", "8028.0 8530.0 326 -55 80 0 11548 6107 -0.5673919079500231 0 1 2", "\"\"", "5197.0 6065.0 4 -293 80 0 4970 5340 -1.7753705142282399 0 0 3", "\"\"", "1:84 2:85", ""], ["INTERMEDIATE_FRAME 263", ""], ["KEY_FRAME 264", "8513.0 5345.0 184 -297 80 0 4970 5340 -3.110711276732519 0 0 4", "\"\"", "7690.0 6172.0 -141 357 80 0 11548 6107 0.02832244439791701 0 1 1", "\"\"", "8420.0 8430.0 333 -85 80 0 11548 6107 -0.6028658475106572 0 1 2", "\"\"", "5177.0 5696.0 -16 -313 80 0 4970 5340 -1.8742308613885585 0 1 3", "\"\"", "1:83 2:100", "42 0.5375161686554611 1 7766 5978 0 8413 5506 763.3008175218731 26 35", ""], ["INTERMEDIATE_FRAME 265", ""], ["KEY_FRAME 266", "8617.0 5048.0 88 -252 80 0 4970 5340 -3.1401814211086463 0 0 4", "\"\"", "7629.0 6528.0 -51 302 80 0 11548 6107 -0.0168465139384732 0 1 2", "\"\"", "8817.0 8297.0 337 -112 80 0 11548 6107 -0.6387785937239129 0 1 1", "\"\"", "5162.0 5303.0 -12 -334 80 0 11548 6107 -1.5600715960295792 0 1 3", "\"\"", "2:82 1:99", ""], ["INTERMEDIATE_FRAME 267", ""], ["KEY_FRAME 268", "8625.0 4802.0 7 -208 80 0 4970 5340 3.0616972791964296 0 0 4", "\"\"", "7658.0 6821.0 24 249 80 0 11548 6107 -0.10701496450186739 0 1 2", "\"\"", "9216.0 8135.0 339 -137 80 0 11548 6107 -0.6759008792451632 0 1 1", "\"\"", "5176.0 4893.0 11 -348 80 0 11548 6107 -1.2459123306706 0 1 3", "\"\"", "2:81 1:98", ""], ["INTERMEDIATE_FRAME 269", ""], ["KEY_FRAME 270", "8553.0 4606.0 -61 -166 80 0 4970 5340 2.9954464954382343 0 0 4", "\"\"", "7761.0 7056.0 87 199 80 0 11548 6107 -0.18152702484825636 0 1 2", "\"\"", "9615.0 7946.0 339 -161 80 0 11548 6107 -0.7157860543170349 0 1 1", "\"\"", "5235.0 4481.0 49 -350 80 0 11548 6107 -0.9317530653116206 0 1 3", "\"\"", "2:80 1:97", ""], ["INTERMEDIATE_FRAME 271", ""], ["KEY_FRAME 272", "8414.0 4456.0 -118 -127 80 0 4970 5340 2.9395319980849886 0 0 4", "\"\"", "7926.0 7236.0 139 152 80 0 11548 6107 -0.245537773461845 0 1 2", "\"\"", "10012.0 7730.0 337 -183 80 0 11548 6107 -0.7604828536630032 0 1 1", "\"\"", "5349.0 4085.0 97 -336 80 0 11548 6107 -0.6175937999526413 0 1 3", "\"\"", "2:79 1:96", ""], ["INTERMEDIATE_FRAME 273", ""], ["KEY_FRAME 274", "8219.0 4349.0 -166 -91 80 0 4970 5340 2.890338493035493 0 0 4", "\"\"", "8141.0 7364.0 183 108 80 0 11548 6107 -0.3021615639427172 0 1 2", "\"\"", "10404.0 7489.0 333 -204 80 0 11548 6107 -0.8129315645787082 0 1 1", "\"\"", "5522.0 3725.0 147 -305 80 0 11548 6107 -0.303434534593662 0 1 3", "\"\"", "2:78 1:95", ""], ["INTERMEDIATE_FRAME 275", ""], ["KEY_FRAME 276", "7976.0 4281.0 -206 -57 80 0 4970 5340 2.845539551632297 0 0 4", "\"\"", "8399.0 7444.0 219 68 80 0 11548 6107 -0.353452771518051 0 1 2", "\"\"", "10788.0 7223.0 326 -225 80 0 11548 6107 -0.8793409391756319 0 1 1", "\"\"", "5749.0 3421.0 192 -258 80 0 11548 6107 0.010724730765317325 0 1 3", "\"\"", "2:77 1:94", ""], ["INTERMEDIATE_FRAME 277", ""], ["KEY_FRAME 278", "7695.0 4251.0 -239 -25 80 0 4970 5340 2.8028743916206293 0 0 4", "\"\"", "8692.0 7481.0 248 31 80 0 11548 6107 -0.40151419876062583 0 1 2", "\"\"", "11159.0 6932.0 315 -247 80 0 11548 6107 -0.9729337305442435 0 1 1", "\"\"", "6017.0 3189.0 227 -197 80 0 11548 6107 0.32488399612429664 0 1 3", "\"\"", "2:76 1:93", ""], ["INTERMEDIATE_FRAME 279", ""], ["KEY_FRAME 280", "7382.0 4256.0 -266 3 80 0 4970 5340 2.7614026720879554 0 0 4", "\"\"", "9012.0 7477.0 272 -3 80 0 11548 6107 -0.4484074680972898 0 1 2", "\"\"", "11508.0 6613.0 296 -271 80 0 11548 6107 -1.1301951516055635 0 2 1", "\"\"", "6315.0 3029.0 253 -135 80 0 11548 6107 0.48546102980841915 0 1 3", "\"\"", "2:75 1:100", ""], ["INTERMEDIATE_FRAME 281", ""],
    ["KEY_FRAME 282", "7043.0 4292.0 -288 30 80 0 4970 5340 2.7192215193360254 0 0 4", "\"\"", "9354.0 7436.0 291 -34 80 0 11548 6107 -0.495304214074224 0 1 2", "\"\"", "11814.0 6263.0 260 -297 80 0 9019 1891 -1.4443544169645428 0 2 1", "\"\"", "6637.0 2935.0 273 -80 80 0 11548 6107 0.5316906618254242 0 1 3", "\"\"", "2:74 1:99", ""], ["INTERMEDIATE_FRAME 283", ""], ["KEY_FRAME 284", "6684.0 4358.0 -305 56 80 0 4970 5340 2.6735168871636175 0 0 4", "\"\"", "9713.0 7361.0 305 -64 80 0 11548 6107 -0.5446315499751334 0 1 2", "\"\"", "12059.0 5887.0 208 -319 80 0 9019 1891 -1.7585136823235221 0 2 1", "\"\"", "6977.0 2898.0 289 -31 80 0 11548 6107 0.5734854282681916 0 1 3", "\"\"", "2:73 1:98", ""], ["INTERMEDIATE_FRAME 285", ""], ["KEY_FRAME 286", "6310.0 4454.0 -318 81 80 0 4970 5340 2.6213163125232573 0 0 4", "\"\"", "10084.0 7252.0 315 -92 80 0 11548 6107 -0.5994834419104647 0 1 2", "\"\"", "12229.0 5498.0 144 -330 80 0 9019 1891 -2.072672947682501 0 2 1", "\"\"", "7331.0 2913.0 301 12 80 0 11548 6107 0.6120901399764611 0 1 3", "\"\"", "2:72 1:97", ""], ["INTERMEDIATE_FRAME 287", ""], ["KEY_FRAME 288", "5925.0 4579.0 -327 106 80 0 4970 5340 2.557388374317077 0 0 4", "\"\"", "10462.0 7111.0 321 -120 80 0 11548 6107 -0.6637329835141279 0 1 2", "\"\"", "12320.0 5108.0 77 -331 80 0 9019 1891 -2.298023432557966 0 2 1", "\"\"", "7696.0 2973.0 310 51 80 0 11548 6107 0.6482269715314509 0 1 3", "\"\"", "2:71 1:96", ""], ["INTERMEDIATE_FRAME 289", ""], ["KEY_FRAME 290", "5535.0 4735.0 -331 132 80 0 4970 5340 2.4687701129007937 0 0 4", "\"\"", "10842.0 6937.0 322 -148 80 0 11548 6107 -0.7461838268093994 0 1 2", "\"\"", "12340.0 4721.0 16 -328 80 0 9019 1891 -2.369081165566579 0 2 1", "\"\"", "8068.0 3074.0 316 86 80 0 11548 6107 0.6829807859295022 0 1 3", "\"\"", "2:70 1:95", ""], ["INTERMEDIATE_FRAME 291", ""], ["KEY_FRAME 292", "5149.0 4925.0 -327 161 80 0 4970 5340 2.3220197665761497 0 1 4", "\"\"", "11216.0 6728.0 317 -177 80 0 11548 6107 -0.8659526366666381 0 1 2", "\"\"", "12295.0 4341.0 -38 -322 80 0 9019 1891 -2.435850008838627 0 2 1", "\"\"", "8444.0 3213.0 319 117 80 0 11548 6107 0.716873653153718 0 1 3", "\"\"", "2:100 1:94", ""], ["INTERMEDIATE_FRAME 293", ""], ["KEY_FRAME 294", "4788.0 5158.0 -306 198 80 0 11548 6107 2.0078605012171704 0 1 4", "\"\"", "11571.0 6480.0 301 -210 80 0 11548 6107 -1.0798365783558372 0 2 2", "\"\"", "12193.0 3971.0 -86 -314 80 0 9019 1891 -2.4994604693349736 0 2 1", "\"\"", "8822.0 3385.0 320 145 80 0 11548 6107 0.7504007882957666 0 1 3", "\"\"", "2:100 1:93", ""], ["INTERMEDIATE_FRAME 295", ""], ["KEY_FRAME 296", "4472.0 5435.0 -268 235 80 0 11548 6107 1.693701235858191 0 1 4", "\"\"", "11886.0 6191.0 267 -245 80 0 9019 1891 -1.3939958437148166 0 2 2", "\"\"", "12040.0 3613.0 -129 -304 80 0 9019 1891 -2.5614834689117236 0 2 1", "\"\"", "9199.0 3587.0 320 171 80 0 11548 6107 0.7846639491387774 0 1 3", "\"\"", "2:99 1:92", ""], ["INTERMEDIATE_FRAME 297", ""], ["KEY_FRAME 298", "4219.0 5749.0 -214 266 80 0 11548 6107 1.3795419704992118 0 1 4", "\"\"", "12142.0 5867.0 217 -275 80 0 9019 1891 -1.7081551090737959 0 2 2", "\"\"", "11841.0 3269.0 -168 -292 80 0 9019 1891 -2.62351662989255 0 2 1", "\"\"", "9574.0 3817.0 318 195 80 0 11548 6107 0.8205038825946299 0 1 3", "\"\"", "2:98 1:91", ""], ["INTERMEDIATE_FRAME 299", ""], ["KEY_FRAME 300", "4044.0 6085.0 -148 285 80 0 11548 6107 1.0653827051402325 0 1 4", "\"\"", "12324.0 5520.0 154 -294 80 0 9019 1891 -2.022314374432775 0 2 2", "\"\"", "11601.0 2942.0 -203 -278 80 0 9019 1891 -2.6873437994428055 0 2 1", "\"\"", "9944.0 4073.0 314 217 80 0 11548 6107 0.8593717553055477 0 1 3", "\"\"", "2:97 1:90", ""], ["INTERMEDIATE_FRAME 301", ""], ["KEY_FRAME 302", "3954.0 6425.0 -76 288 80 0 11548 6107 0.7512234397812532 0 1 4", "\"\"", "12424.0 5167.0 85 -300 80 0 9019 1891 -2.309502175919012 0 2 2", "\"\"", "11324.0 2634.0 -235 -261 80 0 9019 1891 -2.7550245335113215 0 2 1", "\"\"", "10308.0 4353.0 309 237 80 0 11548 6107 0.903049120777569 0 1 3", "\"\"", "2:96 1:89", ""], ["INTERMEDIATE_FRAME 303", ""], ["KEY_FRAME 304", "3950.0 6747.0 -2 273 80 0 11548 6107 0.43706417442227385 0 1 4", "\"\"", "12451.0 4812.0 23 -302 80 0 9019 1891 -2.3755005779674767 0 2 2", "\"\"", "11013.0 2348.0 -264 -242 80 0 9019 1891 -2.829766035605086 0 2 1", "\"\"", "10663.0 4655.0 301 256 80 0 11548 6107 0.9554174592941156 0 1 3", "\"\"", "2:95 1:88", ""], ["INTERMEDIATE_FRAME 305", ""], ["KEY_FRAME 306", "4027.0 7030.0 65 240 80 0 11548 6107 0.12290490906329454 0 1 4", "\"\"", "12413.0 4458.0 -32 -300 80 0 9019 1891 -2.436456138655302 0 2 2", "\"\"", "10671.0 2088.0 -290 -220 80 0 9019 1891 -2.916296021091511 0 2 1", "\"\"", "11006.0 4979.0 291 275 80 0 11548 6107 1.0234177860657356 0 1 3", "\"\"", "2:94 1:87", ""], ["INTERMEDIATE_FRAME 307", ""], ["KEY_FRAME 308", "4171.0 7260.0 122 195 80 0 11548 6107 -0.12211244211939298 0 1 4", "\"\"", "12317.0 4110.0 -81 -296 80 0 9019 1891 -2.494049643603993 0 2 2", "\"\"", "10302.0 1859.0 -314 -195 80 0 9019 1891 -3.0229037431915455 0 2 1", "\"\"", "11332.0 5326.0 276 295 80 0 11548 6107 1.1228729399491448 0 1 3", "\"\"", "2:93 1:86", ""], ["INTERMEDIATE_FRAME 309", ""], ["KEY_FRAME 310", "4372.0 7443.0 170 155 80 0 11548 6107 -0.1550422286107834 0 1 4", "\"\"", "12170.0 3769.0 -125 -289 80 0 9019 1891 -2.5493338658628293 0 2 2", "\"\"", "9908.0 1666.0 -334 -164 80 0 9019 1891 3.1166562802854973 0 2 1", "\"\"", "11629.0 5698.0 252 316 80 0 11548 6107 1.3009724777019236 0 2 3", "\"\"", "2:92 1:100", ""], ["INTERMEDIATE_FRAME 311", ""], ["KEY_FRAME 312", "4621.0 7583.0 211 119 80 0 11548 6107 -0.18406874783879734 0 1 4", "\"\"", "11976.0 3439.0 -164 -280 80 0 9019 1891 -2.604118584045895 0 2 2", "\"\"", "9496.0 1522.0 -349 -122 80 0 9019 1891 2.893704715412479 0 2 1", "\"\"", "11877.0 6094.0 211 336 80 0 9019 1891 1.615131743060903 0 2 3", "\"\"", "2:91 1:99", ""], ["INTERMEDIATE_FRAME 313", ""], ["KEY_FRAME 314", "4910.0 7685.0 245 86 80 0 11548 6107 -0.20993955585175164 0 1 4", "\"\"", "11741.0 3122.0 -199 -269 80 0 9019 1891 -2.6593194849450077 0 2 2", "\"\"", "9079.0 1443.0 -354 -67 80 0 9019 1891 2.5795454500534998 0 0 1", "\"\"", "12060.0 6505.0 155 349 80 0 9019 1891 1.9292910084198822 0 2 3", "\"\"", "2:90 1:100", ""], ["INTERMEDIATE_FRAME 315", ""], ["KEY_FRAME 316", "5233.0 7752.0 274 57 80 0 11548 6107 -0.23339013107638948 0 1 4", "\"\"", "11469.0 2820.0 -231 -256 80 0 9019 1891 -2.7168766743272443 0 2 2", "\"\"", "8667.0 1431.0 -350 -10 80 0 4970 5340 2.382668443418038 0 0 1", "\"\"", "12165.0 6917.0 89 349 80 0 9019 1891 2.2434502737788615 0 2 3", "\"\"", "2:89 1:99", ""], ["INTERMEDIATE_FRAME 317", ""], ["KEY_FRAME 318", "5584.0 7789.0 298 31 80 0 11548 6107 -0.25482781499824764 0 1 4", "\"\"", "11163.0 2536.0 -259 -241 80 0 9019 1891 -2.7791591596586995 0 2 2", "\"\"", "8262.0 1479.0 -344 40 80 0 4970 5340 2.328328972784109 0 0 1", "\"\"", "12187.0 7310.0 18 334 80 0 9019 1891 2.557609539137841 0 2 3", "\"\"", "2:88 1:98", ""], ["INTERMEDIATE_FRAME 319", ""], ["KEY_FRAME 320", "5959.0 7798.0 318 7 80 0 11548 6107 -0.27488594642774955 0 1 4", "\"\"", "10827.0 2272.0 -285 -224 80 0 9019 1891 -2.8493658057881994 0 2 2", "\"\"", "7866.0 1580.0 -336 85 80 0 4970 5340 2.2768145969687317 0 0 1", "\"\"", "12128.0 7665.0 -50 302 80 0 9019 1891 2.87176880449682 0 2 3", "\"\"", "2:87 1:97", ""], ["INTERMEDIATE_FRAME 321", ""], ["KEY_FRAME 322", "6354.0 7782.0 335 -13 80 0 11548 6107 -0.29380247526338443 0 1 4", "\"\"", "10464.0 2032.0 -308 -204 80 0 9019 1891 -2.933901310644635 0 2 2", "\"\"", "7481.0 1728.0 -327 126 80 0 4970 5340 2.2271086024957842 0 0 1", "\"\"", "11998.0 7963.0 -110 253 80 0 9019 1891 3.1859280698557995 0 2 3", "\"\"", "2:86 1:96", ""], ["INTERMEDIATE_FRAME 323", ""],
    ["KEY_FRAME 324", "6765.0 7744.0 349 -31 80 0 11548 6107 -0.3119577400231643 0 1 4", "\"\"", "10076.0 1820.0 -329 -180 80 0 9019 1891 -3.044322735446574 0 2 2", "\"\"", "7108.0 1920.0 -316 162 80 0 4970 5340 2.178281898033817 0 0 1", "\"\"", "11813.0 8188.0 -157 191 80 0 9019 1891 3.5000873352147788 0 2 3", "\"\"", "2:85 1:95", ""], ["INTERMEDIATE_FRAME 325", ""], ["KEY_FRAME 326", "7190.0 7687.0 360 -48 80 0 11548 6107 -0.3297573894181365 0 1 4", "\"\"", "9667.0 1645.0 -347 -148 80 0 9019 1891 3.0745221666112115 0 2 2", "\"\"", "6750.0 2150.0 -304 195 80 0 4970 5340 2.1295007669738144 0 0 1", "\"\"", "11593.0 8329.0 -186 119 80 0 9019 1891 3.814246600573758 0 2 3", "\"\"", "2:84 1:94", ""], ["INTERMEDIATE_FRAME 327", ""], ["KEY_FRAME 328", "7625.0 7612.0 369 -63 80 0 11548 6107 -0.3478126198602286 0 1 4", "\"\"", "9245.0 1525.0 -358 -101 80 0 9019 1891 2.778769320602697 0 0 2", "\"\"", "6407.0 2415.0 -291 225 80 0 4970 5340 2.0797560361638716 0 0 1", "\"\"", "11363.0 8381.0 -195 44 80 0 9019 1891 4.128405865932738 0 2 3", "\"\"", "2:100 1:93", ""], ["INTERMEDIATE_FRAME 329", ""], ["KEY_FRAME 330", "8069.0 7520.0 377 -77 80 0 11548 6107 -0.36631948367409434 0 1 4", "\"\"", "8825.0 1474.0 -357 -43 80 0 4970 5340 2.4646100552437176 0 0 2", "\"\"", "6081.0 2712.0 -277 252 80 0 4970 5340 2.027445285141333 0 0 1", "\"\"", "11141.0 8350.0 -188 -26 80 0 9019 1891 -1.9173881990436554 0 2 3", "\"\"", "2:99 1:92", ""], ["INTERMEDIATE_FRAME 331", ""], ["KEY_FRAME 332", "8520.0 7413.0 383 -91 80 0 11548 6107 -0.3857978563339811 0 1 4", "\"\"", "8412.0 1488.0 -351 11 80 0 4970 5340 2.3547698052347403 0 0 2", "\"\"", "5773.0 3038.0 -261 276 80 0 4970 5340 1.9707638581606075 0 0 1", "\"\"", "10928.0 8248.0 -181 -86 80 0 9019 1891 -1.8882211255786143 0 2 3", "\"\"", "2:98 1:91", ""], ["INTERMEDIATE_FRAME 333", ""], ["KEY_FRAME 334", "8976.0 7290.0 387 -104 80 0 11548 6107 -0.4072012510013042 0 1 4", "\"\"", "8008.0 1559.0 -343 60 80 0 4970 5340 2.3000429957150548 0 0 2", "\"\"", "5486.0 3390.0 -244 298 80 0 4970 5340 1.9064258706288244 0 0 1", "\"\"", "10724.0 8085.0 -173 -138 80 0 9019 1891 -1.8625273034094203 0 2 3", "\"\"", "2:97 1:90", ""], ["INTERMEDIATE_FRAME 335", ""], ["KEY_FRAME 336", "9436.0 7153.0 390 -116 80 0 11548 6107 -0.43110023203188325 0 1 4", "\"\"", "7615.0 1681.0 -334 104 80 0 4970 5340 2.24766239058991 0 0 2", "\"\"", "5222.0 3765.0 -224 319 80 0 4970 5340 1.8294826450104875 0 0 1", "\"\"", "10530.0 7870.0 -165 -182 80 0 9019 1891 -1.8394101785414723 0 2 3", "\"\"", "2:96 1:89", ""], ["INTERMEDIATE_FRAME 337", ""], ["KEY_FRAME 338", "9869.0 6967.0 126 -453 80 0 11548 6107 -0.45985256080650455 0 1 4", "\"\"", "7234.0 1850.0 -323 143 80 0 4970 5340 2.196710307524742 0 0 2", "\"\"", "4985.0 4163.0 -201 338 80 0 4970 5340 1.7294515889812982 0 0 1", "\"\"", "10374.0 7645.0 108 103 80 0 9019 1891 -1.8183313221045532 0 2 3", "\"\"", "2:95 1:88", "43 0.9083016158714772 3 10362 7634 0 9855 7015 493.1536070631736 139 -206", ""], ["INTERMEDIATE_FRAME 339", ""], ["KEY_FRAME 340", "10066.0 6478.0 167 -416 80 0 11548 6107 -0.4733675494472 0 1 4", "\"\"", "6867.0 2060.0 -311 178 80 0 4970 5340 2.1462645821397643 0 0 2", "\"\"", "4783.0 4581.0 -171 355 80 0 4970 5340 1.5835399019840775 0 0 1", "\"\"", "10464.0 7670.0 76 21 80 0 9019 1891 -1.802071034748901 0 2 3", "\"\"", "2:94 1:87", ""], ["INTERMEDIATE_FRAME 341", ""], ["KEY_FRAME 342", "10311.0 6043.0 207 -370 80 0 11548 6107 -0.24529617383218105 0 1 4", "\"\"", "6516.0 2307.0 -298 210 80 0 4970 5340 2.095147317438836 0 0 2", "\"\"", "4631.0 5014.0 -129 367 80 0 4970 5340 1.3292306196995707 0 1 1", "\"\"", "10521.0 7613.0 48 -48 80 0 9019 1891 -1.8158157048763413 0 2 3", "\"\"", "2:93 1:100", ""], ["INTERMEDIATE_FRAME 343", ""], ["KEY_FRAME 344", "10598.0 5677.0 243 -310 80 0 11548 6107 0.05169198534150219 0 1 4", "\"\"", "6182.0 2588.0 -284 239 80 0 4970 5340 2.04219470018523 0 0 2", "\"\"", "4544.0 5449.0 -73 369 80 0 11548 6107 1.0150713543405914 0 1 1", "\"\"", "10549.0 7488.0 23 -106 80 0 9019 1891 -1.8275005697730913 0 2 3", "\"\"", "2:92 1:99", ""], ["INTERMEDIATE_FRAME 345", ""], ["KEY_FRAME 346", "10916.0 5396.0 270 -239 80 0 11548 6107 0.3658512507004815 0 1 4", "\"\"", "5866.0 2900.0 -268 265 80 0 4970 5340 1.9856441159917126 0 0 2", "\"\"", "4532.0 5870.0 -10 357 80 0 11548 6107 0.7009120889816121 0 1 1", "\"\"", "10551.0 7305.0 1 -155 80 0 9019 1891 -1.837637882656862 0 2 3", "\"\"", "2:91 1:98", ""], ["INTERMEDIATE_FRAME 347", ""], ["KEY_FRAME 348", "11248.0 5207.0 282 -160 80 0 11548 6107 0.6800105160594608 0 1 4", "\"\"", "5570.0 3240.0 -251 289 80 0 4970 5340 1.922722723535246 0 0 2", "\"\"", "4596.0 6257.0 54 329 80 0 11548 6107 0.38675282362263275 0 1 1", "\"\"", "10530.0 7073.0 -17 -197 80 0 9019 1891 -1.8465570527271042 0 2 3", "\"\"", "2:90 1:97", ""], ["INTERMEDIATE_FRAME 349", ""], ["KEY_FRAME 350", "11574.0 5114.0 276 -78 80 0 11548 6107 0.9941697814184401 0 1 4", "\"\"", "5297.0 3606.0 -232 311 80 0 4970 5340 1.849095985800008 0 0 2", "\"\"", "4730.0 6592.0 113 284 80 0 11548 6107 0.07259355826365343 0 1 1", "\"\"", "10491.0 6799.0 -33 -232 80 0 9019 1891 -1.8545163317386597 0 2 3", "\"\"", "2:89 1:96", ""], ["INTERMEDIATE_FRAME 351", ""], ["KEY_FRAME 352", "11871.0 5113.0 252 0 80 0 11548 6107 1.3083290467774193 0 1 4", "\"\"", "5050.0 3996.0 -209 331 80 0 4970 5340 1.7571886628338491 0 0 2", "\"\"", "4923.0 6870.0 163 236 80 0 11548 6107 -0.07101560659496776 0 1 1", "\"\"", "10435.0 6490.0 -47 -262 80 0 9019 1891 -1.8621783493273372 0 2 3", "\"\"", "2:88 1:95", ""], ["INTERMEDIATE_FRAME 353", ""], ["KEY_FRAME 354", "12119.0 5193.0 210 67 80 0 11548 6107 1.6224883121363987 0 1 4", "\"\"", "4836.0 4407.0 -181 349 80 0 4970 5340 1.6302499861035535 0 0 2", "\"\"", "5165.0 7097.0 206 192 80 0 11548 6107 -0.1146646184143051 0 1 1", "\"\"", "10364.0 6152.0 -59 -287 80 0 9019 1891 -1.8694786016434486 0 2 3", "\"\"", "2:87 1:94", ""], ["INTERMEDIATE_FRAME 355", ""], ["KEY_FRAME 356", "12300.0 5335.0 154 120 80 0 11548 6107 1.936647577495378 0 1 4", "\"\"", "4666.0 4835.0 -144 363 80 0 4970 5340 1.4281490847845764 0 1 2", "\"\"", "5450.0 7277.0 242 152 80 0 11548 6107 -0.15387344765341446 0 1 1", "\"\"", "10281.0 5789.0 -70 -308 80 0 9019 1891 -1.876551642954334 0 2 3", "\"\"", "2:100 1:93", ""], ["INTERMEDIATE_FRAME 357", ""], ["KEY_FRAME 358", "12404.0 5517.0 88 154 80 0 11548 6107 2.2508068428543573 0 1 4", "\"\"", "4557.0 5270.0 -92 369 80 0 11548 6107 1.113989819425597 0 1 2", "\"\"", "5771.0 7414.0 272 116 80 0 11548 6107 -0.1895624920101912 0 1 1", "\"\"", "10186.0 5405.0 -80 -326 80 0 9019 1891 -1.8839024531110875 0 2 3", "\"\"", "2:99 1:92", ""], ["INTERMEDIATE_FRAME 359", ""], ["KEY_FRAME 360", "12426.0 5716.0 18 169 80 0 11548 6107 2.538116365183387 0 1 4", "\"\"", "4521.0 5696.0 -30 362 80 0 11548 6107 0.7998305540666177 0 1 2", "\"\"", "6121.0 7512.0 297 83 80 0 11548 6107 -0.222496275327863 0 1 1", "\"\"", "10081.0 5003.0 -89 -341 80 0 9019 1891 -1.8914366245805192 0 2 3", "\"\"", "2:98 1:91", ""], ["INTERMEDIATE_FRAME 361", ""], ["KEY_FRAME 362", "12371.0 5918.0 -46 171 80 0 11548 6107 2.722628835448972 0 1 4", "\"\"", "4562.0 6095.0 34 339 80 0 11548 6107 0.4856712887076384 0 1 2", "\"\"", "6495.0 7575.0 318 53 80 0 11548 6107 -0.2533287481182977 0 1 1", "\"\"", "9966.0 4586.0 -97 -354 80 0 9019 1891 -1.8996635142667726 0 2 3", "\"\"", "2:97 1:90", ""], ["INTERMEDIATE_FRAME 363", ""], ["KEY_FRAME 364", "12247.0 6107.0 -105 160 80 0 11548 6107 2.915858956917215 0 1 4", "\"\"", "4675.0 6448.0 95 299 80 0 11548 6107 0.17151202334865912 0 1 2", "\"\"", "6890.0 7606.0 335 26 80 0 11548 6107 -0.2827374610778463 0 1 1", "\"\"", "9842.0 4157.0 -104 -365 80 0 9019 1891 -1.9087102210319822 0 2 3", "\"\"", "2:96 1:89", ""], ["INTERMEDIATE_FRAME 365", ""],
    ["KEY_FRAME 366", "12062.0 6267.0 -157 136 80 0 11548 6107 3.141592653589793 0 2 4", "\"\"", "4850.0 6743.0 148 250 80 0 11548 6107 -0.04957378314738506 0 1 2", "\"\"", "7301.0 7607.0 349 1 80 0 11548 6107 -0.31134570789239946 0 1 1", "\"\"", "9711.0 3717.0 -111 -374 80 0 9019 1891 -1.9191775082991804 0 2 3", "\"\"", "2:100 1:88", ""], ["INTERMEDIATE_FRAME 367", ""], ["KEY_FRAME 368", "11829.0 6378.0 -198 94 80 0 9019 1891 3.4557519189487724 0 2 4", "\"\"", "5078.0 6985.0 193 206 80 0 11548 6107 -0.09466987727954936 0 1 2", "\"\"", "7725.0 7581.0 360 -21 80 0 11548 6107 -0.3395142920572806 0 1 1", "\"\"", "9572.0 3268.0 -118 -381 80 0 9019 1891 -1.933043367621303 0 2 3", "\"\"", "2:99 1:87", ""], ["INTERMEDIATE_FRAME 369", ""], ["KEY_FRAME 370", "11566.0 6425.0 -223 39 80 0 9019 1891 3.7699111843077517 0 2 4", "\"\"", "5350.0 7180.0 231 165 80 0 11548 6107 -0.13487932195088015 0 1 2", "\"\"", "8160.0 7531.0 369 -42 80 0 11548 6107 -0.36799739808908355 0 1 1", "\"\"", "9424.0 2813.0 -125 -386 80 0 9019 1891 -1.9526792516549893 0 2 3", "\"\"", "2:98 1:86", ""], ["INTERMEDIATE_FRAME 371", ""], ["KEY_FRAME 372", "11296.0 6399.0 -229 -21 80 0 9019 1891 4.084070449666731 0 2 4", "\"\"", "5660.0 7331.0 263 128 80 0 11548 6107 -0.17142130103468844 0 1 2", "\"\"", "8603.0 7458.0 376 -62 80 0 11548 6107 -0.39788889947590883 0 1 1", "\"\"", "9267.0 2354.0 -133 -390 80 0 9019 1891 -1.9846851320164658 0 0 3", "\"\"", "2:97 1:100", ""], ["INTERMEDIATE_FRAME 373", ""], ["KEY_FRAME 374", "11031.0 6307.0 -225 -78 80 0 9019 1891 -2.038517233023444 0 2 4", "\"\"", "6001.0 7443.0 290 94 80 0 11548 6107 -0.20496129078521536 0 1 2", "\"\"", "9052.0 7363.0 381 -81 80 0 11548 6107 -0.4301012977998715 0 1 1", "\"\"", "9081.0 1904.0 -158 -382 80 0 4970 5340 -2.2988443973754453 0 0 3", "\"\"", "2:96 1:99", ""], ["INTERMEDIATE_FRAME 375", ""], ["KEY_FRAME 376", "10773.0 6156.0 -219 -128 80 0 9019 1891 -1.9983106468944174 0 2 4", "\"\"", "6369.0 7518.0 312 63 80 0 11548 6107 -0.23634939254264006 0 1 2", "\"\"", "9504.0 7246.0 384 -99 80 0 11548 6107 -0.4662084228652786 0 1 1", "\"\"", "8854.0 1482.0 -193 -358 80 0 4970 5340 -2.6130036627344246 0 0 3", "\"\"", "2:95 1:98", ""], ["INTERMEDIATE_FRAME 377", ""], ["KEY_FRAME 378", "10524.0 5954.0 -212 -171 80 0 9019 1891 -1.96096696227807 0 2 4", "\"\"", "6758.0 7560.0 330 35 80 0 11548 6107 -0.26599061979182775 0 1 2", "\"\"", "9958.0 7108.0 385 -117 80 0 11548 6107 -0.5083852912791351 0 1 1", "\"\"", "8583.0 1107.0 -230 -318 80 0 4970 5340 -2.927162928093404 0 0 3", "\"\"", "2:94 1:97", ""], ["INTERMEDIATE_FRAME 379", ""], ["KEY_FRAME 380", "10284.0 5708.0 -203 -209 80 0 9019 1891 -1.9255420586448548 0 2 4", "\"\"", "7165.0 7572.0 345 10 80 0 11548 6107 -0.29451845849869424 0 1 2", "\"\"", "10411.0 6948.0 384 -135 80 0 11548 6107 -0.561871518051142 0 1 1", "\"\"", "8273.0 797.0 -263 -263 80 0 4970 5340 -3.2413221934523833 0 0 3", "\"\"", "2:93 1:96", ""], ["INTERMEDIATE_FRAME 381", ""], ["KEY_FRAME 382", "10056.0 5423.0 -193 -242 80 0 9019 1891 -1.8908167791115238 0 2 4", "\"\"", "7586.0 7557.0 357 -13 80 0 11548 6107 -0.32257168463497393 0 1 2", "\"\"", "10859.0 6765.0 381 -155 80 0 11548 6107 -0.6368543391918505 0 1 1", "\"\"", "7937.0 566.0 -285 -196 80 0 4970 5340 -3.5554814588113626 0 0 3", "\"\"", "2:92 1:95", ""], ["INTERMEDIATE_FRAME 383", ""], ["KEY_FRAME 384", "9840.0 5104.0 -183 -270 80 0 9019 1891 -1.8563725198089374 0 2 4", "\"\"", "8018.0 7517.0 367 -34 80 0 11548 6107 -0.35083653059663017 0 1 2", "\"\"", "11298.0 6555.0 373 -178 80 0 11548 6107 -0.7623881198202759 0 2 1", "\"\"", "7592.0 423.0 -293 -121 80 0 4970 5340 -3.869640724170342 0 0 3", "\"\"", "2:91 1:100", ""], ["INTERMEDIATE_FRAME 385", ""], ["KEY_FRAME 386", "9637.0 4756.0 -172 -295 80 0 9019 1891 -1.8209676588207109 0 2 4", "\"\"", "8459.0 7453.0 375 -54 80 0 11548 6107 -0.3800178573661756 0 1 2", "\"\"", "11709.0 6307.0 349 -211 80 0 9019 1891 -1.0765473851792553 0 2 1", "\"\"", "7259.0 371.0 -283 -44 80 0 4970 5340 -4.183799989529321 0 0 3", "\"\"", "2:90 1:99", ""], ["INTERMEDIATE_FRAME 387", ""], ["KEY_FRAME 388", "9448.0 4383.0 -160 -317 80 0 9019 1891 -1.783247966302675 0 2 4", "\"\"", "8907.0 7367.0 381 -73 80 0 11548 6107 -0.41093200743682023 0 1 2", "\"\"", "12072.0 6017.0 308 -246 80 0 9019 1891 -1.3907066505382346 0 2 1", "\"\"", "6943.0 400.0 -269 24 80 0 4970 5340 2.002476421243795 0 0 3", "\"\"", "2:89 1:98", ""], ["INTERMEDIATE_FRAME 389", ""], ["KEY_FRAME 390", "9274.0 3987.0 -147 -336 80 0 9019 1891 -1.7412762065460574 0 2 4", "\"\"", "9360.0 7260.0 385 -91 80 0 11548 6107 -0.4451538448756834 0 1 2", "\"\"", "12369.0 5692.0 252 -276 80 0 9019 1891 -1.704865915897214 0 2 1", "\"\"", "6644.0 498.0 -253 83 80 0 4970 5340 1.9507790706380777 0 0 3", "\"\"", "2:88 1:97", ""], ["INTERMEDIATE_FRAME 391", ""], ["KEY_FRAME 392", "9117.0 3572.0 -133 -353 80 0 9019 1891 -1.6918616662871817 0 2 4", "\"\"", "9816.0 7132.0 387 -109 80 0 11548 6107 -0.48498638441861447 0 1 2", "\"\"", "12586.0 5344.0 184 -295 80 0 9019 1891 -2.0190251812561932 0 2 1", "\"\"", "6365.0 657.0 -237 134 80 0 4970 5340 1.9036575350891465 0 0 3", "\"\"", "2:87 1:96", ""], ["INTERMEDIATE_FRAME 393", ""], ["KEY_FRAME 394", "8979.0 3139.0 -117 -367 80 0 9019 1891 -1.6290290458094228 0 2 4", "\"\"", "10272.0 6982.0 387 -127 80 0 11548 6107 -0.5343692971448449 0 1 2", "\"\"", "12715.0 4991.0 109 -299 80 0 9019 1891 -2.3331844466151725 0 2 1", "\"\"", "6105.0 868.0 -220 179 80 0 4970 5340 1.8603125180046287 0 0 3", "\"\"", "2:86 1:95", ""], ["INTERMEDIATE_FRAME 395", ""], ["KEY_FRAME 396", "8865.0 2692.0 -97 -379 80 0 9019 1891 -1.5387560132474296 0 2 4", "\"\"", "10725.0 6810.0 385 -146 80 0 11548 6107 -0.6010889844703342 0 1 2", "\"\"", "12763.0 4641.0 40 -297 80 0 9019 1891 -2.4436693366716664 0 2 1", "\"\"", "5865.0 1125.0 -203 218 80 0 4970 5340 1.8193495948930904 0 0 3", "\"\"", "2:85 1:94", ""], ["INTERMEDIATE_FRAME 397", ""], ["KEY_FRAME 398", "8783.0 2234.0 -69 -388 80 0 9019 1891 -1.3808543437474203 0 0 4", "\"\"", "11171.0 6612.0 378 -168 80 0 11548 6107 -0.706922696262918 0 1 2", "\"\"", "12739.0 4297.0 -20 -292 80 0 9019 1891 -2.5080800182500864 0 2 1", "\"\"", "5645.0 1421.0 -186 251 80 0 4970 5340 1.7800256537479284 0 0 3", "\"\"", "2:100 1:93", ""], ["INTERMEDIATE_FRAME 399", ""], ["KEY_FRAME 400", "8704.0 1767.0 -67 -397 80 0 4970 5340 -1.6950136091063996 0 0 4", "\"\"", "11597.0 6380.0 361 -197 80 0 11548 6107 -0.9295167313258625 0 2 2", "\"\"", "12652.0 3962.0 -74 -285 80 0 9019 1891 -2.5674884788869488 0 2 1", "\"\"", "5445.0 1751.0 -169 280 80 0 4970 5340 1.7413606360791682 0 0 3", "\"\"", "2:100 1:92", ""], ["INTERMEDIATE_FRAME 401", ""], ["KEY_FRAME 402", "8603.0 1298.0 -85 -399 80 0 4970 5340 -2.0091728744653787 0 0 4", "\"\"", "11984.0 6107.0 328 -231 80 0 9019 1891 -1.2436759966848419 0 2 2", "\"\"", "12508.0 3637.0 -121 -275 80 0 9019 1891 -2.6234846525696405 0 2 1", "\"\"", "5266.0 2110.0 -152 305 80 0 4970 5340 1.7023804413044792 0 0 3", "\"\"", "2:99 1:91", ""], ["INTERMEDIATE_FRAME 403", ""], ["KEY_FRAME 404", "8463.0 841.0 -118 -388 80 0 4970 5340 -2.323332139824358 0 0 4", "\"\"", "12313.0 5796.0 279 -264 80 0 9019 1891 -1.5578352620438212 0 2 2", "\"\"", "12315.0 3326.0 -163 -264 80 0 9019 1891 -2.677601165647934 0 2 1", "\"\"", "5107.0 2495.0 -135 326 80 0 4970 5340 1.662181943785052 0 0 3", "\"\"", "2:98 1:90", ""], ["INTERMEDIATE_FRAME 405", ""], ["KEY_FRAME 406", "8275.0 414.0 -159 -362 80 0 4970 5340 -2.6374914051833374 0 0 4", "\"\"", "12568.0 5456.0 216 -289 80 0 9019 1891 -1.8719945274028005 0 2 2", "\"\"", "12079.0 3030.0 -200 -251 80 0 9019 1891 -2.7309661893292407 0 2 1", "\"\"", "4968.0 2901.0 -118 345 80 0 4970 5340 1.6189138143101145 0 0 3", "\"\"", "2:97 1:89", ""], ["INTERMEDIATE_FRAME 407", ""],
    ["KEY_FRAME 408", "8037.0 37.0 -201 -320 80 0 4970 5340 -2.9516506705423167 0 0 4", "\"\"", "12738.0 5102.0 144 -301 80 0 9019 1891 -2.18615379276178 0 2 2", "\"\"", "11804.0 2751.0 -233 -237 80 0 9019 1891 -2.7852595165781517 0 2 1", "\"\"", "4850.0 3326.0 -100 361 80 0 4970 5340 1.5699763187786093 0 0 3", "\"\"", "2:96 1:88", ""], ["INTERMEDIATE_FRAME 409", ""], ["KEY_FRAME 410", "7757.0 -273.0 -238 -263 80 0 4970 5340 -3.265809935901296 0 0 4", "\"\"", "12821.0 4749.0 70 -300 80 0 9019 1891 -2.429368083563602 0 2 2", "\"\"", "11495.0 2490.0 -263 -221 80 0 9019 1891 -2.8420847678750523 0 2 1", "\"\"", "4755.0 3767.0 -80 374 80 0 4970 5340 1.5112837663459817 0 0 3", "\"\"", "2:95 1:87", ""], ["INTERMEDIATE_FRAME 411", ""], ["KEY_FRAME 412", "7447.0 -502.0 -263 -194 80 0 4970 5340 -3.5799692012602753 0 0 4", "\"\"", "12827.0 4401.0 5 -295 80 0 9019 1891 -2.4969982814191063 0 2 2", "\"\"", "11154.0 2250.0 -289 -203 80 0 9019 1891 -2.9042307145361526 0 2 1", "\"\"", "4686.0 4220.0 -58 385 80 0 4970 5340 1.434956564934358 0 0 3", "\"\"", "2:94 1:86", ""], ["INTERMEDIATE_FRAME 413", ""], ["KEY_FRAME 414", "7126.0 -641.0 -273 -118 80 0 4970 5340 -3.8941284666192546 0 0 4", "\"\"", "12765.0 4062.0 -52 -288 80 0 9019 1891 -2.558819873438909 0 2 2", "\"\"", "10786.0 2034.0 -312 -183 80 0 9019 1891 -2.975001194884528 0 2 1", "\"\"", "4648.0 4683.0 -32 393 80 0 4970 5340 1.3224591540454131 0 0 3", "\"\"", "2:93 1:85", ""], ["INTERMEDIATE_FRAME 415", ""], ["KEY_FRAME 416", "6814.0 -689.0 -264 -40 80 0 4970 5340 -4.208287731978234 0 0 4", "\"\"", "12644.0 3734.0 -103 -278 80 0 9019 1891 -2.616344512289832 0 2 2", "\"\"", "10394.0 1845.0 -332 -161 80 0 9019 1891 -3.060840511642243 0 2 1", "\"\"", "4651.0 5148.0 2 395 80 0 4970 5340 1.1150947608221564 0 1 3", "\"\"", "2:92 1:100", ""], ["INTERMEDIATE_FRAME 417", ""], ["KEY_FRAME 418", "6527.0 -652.0 -244 31 80 0 4970 5340 1.8676160184169077 0 0 4", "\"\"", "12470.0 3420.0 -148 -267 80 0 9019 1891 -2.6712366881658425 0 2 2", "\"\"", "9982.0 1687.0 -350 -134 80 0 9019 1891 3.108150580610239 0 2 1", "\"\"", "4709.0 5600.0 49 384 80 0 11548 6107 0.8009354954631771 0 1 3", "\"\"", "2:91 1:99", ""], ["INTERMEDIATE_FRAME 419", ""], ["KEY_FRAME 420", "6263.0 -544.0 -224 92 80 0 4970 5340 1.8250205638878658 0 0 4", "\"\"", "12249.0 3121.0 -187 -254 80 0 9019 1891 -2.7245250148195206 0 2 2", "\"\"", "9554.0 1570.0 -364 -99 80 0 9019 1891 2.932840737969954 0 2 1", "\"\"", "4829.0 6021.0 101 358 80 0 11548 6107 0.4867762301041978 0 1 3", "\"\"", "2:90 1:98", ""], ["INTERMEDIATE_FRAME 421", ""], ["KEY_FRAME 422", "6022.0 -374.0 -204 144 80 0 4970 5340 1.7871067015498934 0 0 4", "\"\"", "11987.0 2839.0 -222 -240 80 0 9019 1891 -2.7777424469185004 0 2 2", "\"\"", "9121.0 1511.0 -368 -50 80 0 9019 1891 2.618681472610975 0 0 1", "\"\"", "5009.0 6393.0 152 315 80 0 11548 6107 0.17261696474521848 0 1 3", "\"\"", "2:89 1:100", ""], ["INTERMEDIATE_FRAME 423", ""], ["KEY_FRAME 424", "5804.0 -151.0 -185 189 80 0 4970 5340 1.7528666399762627 0 0 4", "\"\"", "11689.0 2575.0 -253 -224 80 0 9019 1891 -2.832427711538714 0 2 2", "\"\"", "8694.0 1515.0 -362 3 80 0 4970 5340 2.396523489078787 0 0 1", "\"\"", "5241.0 6705.0 197 264 80 0 11548 6107 -0.04370971688519071 0 1 3", "\"\"", "2:88 1:99", ""], ["INTERMEDIATE_FRAME 425", ""], ["KEY_FRAME 426", "5607.0 117.0 -167 227 80 0 4970 5340 1.7215291882205037 0 0 4", "\"\"", "11359.0 2331.0 -280 -207 80 0 9019 1891 -2.890806241612216 0 2 2", "\"\"", "8276.0 1575.0 -355 51 80 0 4970 5340 2.342816032891634 0 0 1", "\"\"", "5518.0 6961.0 235 217 80 0 11548 6107 -0.0945326795570478 0 1 3", "\"\"", "2:87 1:98", ""], ["INTERMEDIATE_FRAME 427", ""], ["KEY_FRAME 428", "5430.0 423.0 -150 260 80 0 4970 5340 1.6921575300454805 0 0 4", "\"\"", "11000.0 2109.0 -304 -188 80 0 9019 1891 -2.9557287077678605 0 2 2", "\"\"", "7868.0 1686.0 -346 94 80 0 4970 5340 2.2913724100312356 0 0 1", "\"\"", "5832.0 7167.0 267 174 80 0 11548 6107 -0.14068955008236303 0 1 3", "\"\"", "2:86 1:97", ""], ["INTERMEDIATE_FRAME 429", ""], ["KEY_FRAME 430", "5273.0 763.0 -133 288 80 0 4970 5340 1.6640778003780354 0 0 4", "\"\"", "10616.0 1912.0 -325 -167 80 0 9019 1891 -3.0319882385875676 0 2 2", "\"\"", "7472.0 1843.0 -336 133 80 0 4970 5340 2.241317884775446 0 0 1", "\"\"", "6178.0 7326.0 293 135 80 0 11548 6107 -0.18336139358278847 0 1 3", "\"\"", "2:85 1:96", ""], ["INTERMEDIATE_FRAME 431", ""], ["KEY_FRAME 432", "5135.0 1131.0 -117 312 80 0 4970 5340 1.6369004400225171 0 0 4", "\"\"", "10211.0 1744.0 -344 -142 80 0 9019 1891 -3.1284437558243186 0 2 2", "\"\"", "7089.0 2041.0 -325 168 80 0 4970 5340 2.191829829486958 0 0 1", "\"\"", "6549.0 7443.0 315 99 80 0 11548 6107 -0.22321902477896108 0 1 3", "\"\"", "2:84 1:95", ""], ["INTERMEDIATE_FRAME 433", ""], ["KEY_FRAME 434", "5015.0 1523.0 -102 333 80 0 4970 5340 1.6099779745196443 0 0 4", "\"\"", "9788.0 1612.0 -359 -112 80 0 9019 1891 3.0188900379997703 0 2 2", "\"\"", "6721.0 2276.0 -312 200 80 0 4970 5340 2.141750705983735 0 0 1", "\"\"", "6941.0 7521.0 333 66 80 0 11548 6107 -0.2611501390814246 0 1 3", "\"\"", "2:83 1:94", ""], ["INTERMEDIATE_FRAME 435", ""], ["KEY_FRAME 436", "4912.0 1936.0 -87 351 80 0 4970 5340 1.5825851440171952 0 0 4", "\"\"", "9354.0 1527.0 -369 -72 80 0 9019 1891 2.7935527203717263 0 0 2", "\"\"", "6369.0 2545.0 -298 229 80 0 4970 5340 2.089977587955506 0 0 1", "\"\"", "7350.0 7564.0 348 36 80 0 11548 6107 -0.2977971451970498 0 1 3", "\"\"", "2:100 1:93", ""], ["INTERMEDIATE_FRAME 437", ""], ["KEY_FRAME 438", "4826.0 2367.0 -72 366 80 0 4970 5340 1.553759197498453 0 0 4", "\"\"", "8922.0 1504.0 -367 -19 80 0 4970 5340 2.479393455012747 0 0 2", "\"\"", "6035.0 2846.0 -283 255 80 0 4970 5340 2.0348731817272734 0 0 1", "\"\"", "7774.0 7574.0 360 8 80 0 11548 6107 -0.3340622232430156 0 1 3", "\"\"", "2:99 1:92", ""], ["INTERMEDIATE_FRAME 439", ""], ["KEY_FRAME 440", "4758.0 2813.0 -57 379 80 0 4970 5340 1.5223982277733379 0 0 4", "\"\"", "8498.0 1541.0 -360 31 80 0 4970 5340 2.371088098673296 0 0 2", "\"\"", "5721.0 3175.0 -267 279 80 0 4970 5340 1.9743807976963392 0 0 1", "\"\"", "8209.0 7553.0 369 -17 80 0 11548 6107 -0.37073783809073024 0 1 3", "\"\"", "2:98 1:91", ""], ["INTERMEDIATE_FRAME 441", ""], ["KEY_FRAME 442", "4675.0 3260.0 -253 313 80 0 4970 5340 1.487098375026848 0 0 4", "\"\"", "8084.0 1631.0 -352 76 80 0 4970 5340 2.319224853874152 0 0 2", "\"\"", "5461.0 3542.0 -38 377 80 0 4970 5340 1.9046909156862444 0 0 1", "\"\"", "8651.0 7504.0 376 -41 80 0 11548 6107 -0.4086808771694679 0 1 3", "\"\"", "2:97 1:90", "44 0.8668437406538309 2 5467 3482 0 4714 3211 263.8364003399192 -172 407", ""], ["INTERMEDIATE_FRAME 443", ""], ["KEY_FRAME 444", "4433.0 3652.0 -205 333 80 0 4970 5340 1.4299090328707675 0 0 4", "\"\"", "7681.0 1768.0 -342 116 80 0 4970 5340 2.2692095018461167 0 0 2", "\"\"", "5402.0 3996.0 -50 386 80 0 4970 5340 1.837377772197614 0 0 1", "\"\"", "9099.0 7428.0 380 -64 80 0 11548 6107 -0.4493251285406914 0 1 3", "\"\"", "2:96 1:89", ""], ["INTERMEDIATE_FRAME 445", ""], ["KEY_FRAME 446", "4252.0 4061.0 -153 347 80 0 4970 5340 1.2627924515052786 0 0 4", "\"\"", "7291.0 1948.0 -331 152 80 0 4970 5340 2.220006307156732 0 0 2", "\"\"", "5328.0 4458.0 -63 392 80 0 4970 5340 1.8817946074004377 0 0 1", "\"\"", "9549.0 7326.0 382 -86 80 0 11548 6107 -0.49467158006425843 0 1 3", "\"\"", "2:95 1:88", ""], ["INTERMEDIATE_FRAME 447", ""], ["KEY_FRAME 448", "4138.0 4478.0 -96 354 80 0 4970 5340 1.0592610592497407 0 0 4", "\"\"", "6915.0 2166.0 -319 185 80 0 4970 5340 2.170878245632008 0 0 2", "\"\"", "5235.0 4924.0 -79 396 80 0 4970 5340 1.9563748414484108 0 1 1", "\"\"", "9999.0 7198.0 382 -108 80 0 11548 6107 -0.547597812367042 0 1 3", "\"\"", "2:94 1:100", ""], ["INTERMEDIATE_FRAME 449", ""],
    ["KEY_FRAME 450", "4098.0 4890.0 -34 349 80 0 4970 5340 0.803105875501209 0 0 4", "\"\"", "6554.0 2419.0 -306 215 80 0 4970 5340 2.1205682380917468 0 0 2", "\"\"", "5150.0 5400.0 -72 404 80 0 11548 6107 1.6422155760894315 0 1 1", "\"\"", "10446.0 7044.0 380 -130 80 0 11548 6107 -0.6136230030262978 0 1 3", "\"\"", "2:93 1:99", ""], ["INTERMEDIATE_FRAME 451", ""], ["KEY_FRAME 452", "4135.0 5277.0 31 328 80 0 4970 5340 0.48894661014222973 0 0 4", "\"\"", "6210.0 2704.0 -292 242 80 0 4970 5340 2.0676931914811814 0 0 2", "\"\"", "5097.0 5882.0 -44 409 80 0 11548 6107 1.3280563107304522 0 1 1", "\"\"", "10887.0 6862.0 374 -154 80 0 11548 6107 -0.7046520878917755 0 1 3", "\"\"", "2:92 1:98", ""], ["INTERMEDIATE_FRAME 453", ""], ["KEY_FRAME 454", "4245.0 5619.0 93 290 80 0 4970 5340 0.17478734478325042 0 0 4", "\"\"", "5884.0 3018.0 -277 267 80 0 4970 5340 2.010492742835382 0 0 2", "\"\"", "5095.0 6359.0 -1 405 80 0 11548 6107 1.0138970453714728 0 1 1", "\"\"", "11314.0 6648.0 362 -182 80 0 11548 6107 -0.8516850859694751 0 2 3", "\"\"", "2:91 1:100", ""], ["INTERMEDIATE_FRAME 455", ""], ["KEY_FRAME 456", "4417.0 5898.0 146 237 80 0 4970 5340 -0.1393719205757289 0 0 4", "\"\"", "5578.0 3359.0 -260 290 80 0 4970 5340 1.945795987728635 0 0 2", "\"\"", "5155.0 6816.0 51 388 80 0 11548 6107 0.6997377800124935 0 1 1", "\"\"", "11708.0 6392.0 334 -217 80 0 9019 1891 -1.1658443513284544 0 2 3", "\"\"", "2:90 1:99", ""], ["INTERMEDIATE_FRAME 457", ""], ["KEY_FRAME 458", "4635.0 6100.0 185 171 80 0 4970 5340 -0.4535311859347082 0 0 4", "\"\"", "5295.0 3725.0 -240 311 80 0 4970 5340 1.8685856611966465 0 0 2", "\"\"", "5280.0 7234.0 106 355 80 0 11548 6107 0.3855785146535142 0 1 1", "\"\"", "12049.0 6095.0 290 -252 80 0 9019 1891 -1.4800036166874337 0 2 3", "\"\"", "2:89 1:98", ""], ["INTERMEDIATE_FRAME 459", ""], ["KEY_FRAME 460", "4878.0 6215.0 206 98 80 0 4970 5340 -0.7676904512936875 0 0 4", "\"\"", "5039.0 4114.0 -217 331 80 0 4970 5340 1.76938236227286 0 0 2", "\"\"", "5466.0 7595.0 157 306 80 0 11548 6107 0.07141924929453491 0 1 1", "\"\"", "12321.0 5765.0 231 -280 80 0 9019 1891 -1.794162882046413 0 2 3", "\"\"", "2:88 1:97", ""], ["INTERMEDIATE_FRAME 461", ""], ["KEY_FRAME 462", "5122.0 6242.0 207 23 80 0 4970 5340 -1.0818497166526668 0 0 4", "\"\"", "4818.0 4525.0 -188 349 80 0 4970 5340 1.627017603744723 0 0 2", "\"\"", "5701.0 7882.0 199 243 80 0 11548 6107 -0.23994306887578992 0 1 1", "\"\"", "12511.0 5416.0 161 -296 80 0 9019 1891 -2.108322147405392 0 2 3", "\"\"", "2:87 1:96", ""], ["INTERMEDIATE_FRAME 463", ""], ["KEY_FRAME 464", "5343.0 6186.0 187 -47 80 0 4970 5340 -1.3960089820116461 0 0 4", "\"\"", "4645.0 4953.0 -147 363 80 0 4970 5340 1.3864116248711735 0 1 2", "\"\"", "5977.0 8102.0 234 186 80 0 11548 6107 -0.29473290157522036 0 1 1", "\"\"", "12616.0 5063.0 88 -299 80 0 9019 1891 -2.3514916603908698 0 2 3", "\"\"", "2:100 1:95", ""], ["INTERMEDIATE_FRAME 465", ""], ["KEY_FRAME 466", "5519.0 6060.0 149 -107 80 0 4970 5340 -1.7101682473706254 0 0 4", "\"\"", "4536.0 5386.0 -92 368 80 0 11548 6107 1.0722523595121942 0 1 2", "\"\"", "6286.0 8261.0 262 135 80 0 11548 6107 -0.3438765132796422 0 1 1", "\"\"", "12644.0 4711.0 23 -299 80 0 9019 1891 -2.418898412708053 0 2 3", "\"\"", "2:99 1:94", ""], ["INTERMEDIATE_FRAME 467", ""], ["KEY_FRAME 468", "5633.0 5881.0 96 -152 80 0 4970 5340 -2.024327512729605 0 0 4", "\"\"", "4502.0 5809.0 -28 359 80 0 11548 6107 0.7580930941532149 0 1 2", "\"\"", "6622.0 8366.0 285 88 80 0 11548 6107 -0.38854069375150607 0 1 1", "\"\"", "12604.0 4363.0 -34 -295 80 0 9019 1891 -2.480454001114838 0 2 3", "\"\"", "2:98 1:93", ""], ["INTERMEDIATE_FRAME 469", ""], ["KEY_FRAME 470", "5673.0 5671.0 34 -178 80 0 4970 5340 -2.3384867780885843 0 0 4", "\"\"", "4546.0 6202.0 37 334 80 0 11548 6107 0.4439338287942356 0 1 2", "\"\"", "6980.0 8421.0 304 46 80 0 11548 6107 -0.4299719622623475 0 1 1", "\"\"", "12504.0 4023.0 -84 -289 80 0 9019 1891 -2.537921544500401 0 2 3", "\"\"", "2:97 1:92", ""], ["INTERMEDIATE_FRAME 471", ""], ["KEY_FRAME 472", "5636.0 5455.0 -31 -183 80 0 4970 5340 -2.6526460434475636 0 0 4", "\"\"", "4662.0 6546.0 98 292 80 0 11548 6107 0.12977456343525628 0 1 2", "\"\"", "7355.0 8431.0 319 8 80 0 11548 6107 -0.4688877357100145 0 1 1", "\"\"", "12352.0 3692.0 -129 -281 80 0 9019 1891 -2.5925675137821966 0 2 3", "\"\"", "2:96 1:91", ""], ["INTERMEDIATE_FRAME 473", ""], ["KEY_FRAME 474", "5526.0 5258.0 -93 -167 80 0 4970 5340 -2.966805308806543 0 1 4", "\"\"", "4840.0 6833.0 151 243 80 0 11548 6107 -0.0636663797505494 0 1 2", "\"\"", "7744.0 8400.0 330 -26 80 0 11548 6107 -0.5061057377350827 0 1 1", "\"\"", "12153.0 3373.0 -169 -271 80 0 9019 1891 -2.6461853246219498 0 2 3", "\"\"", "2:100 1:90", ""], ["INTERMEDIATE_FRAME 475", ""], ["KEY_FRAME 476", "5362.0 5053.0 -139 -173 80 0 11548 6107 -2.6526460434475636 0 1 4", "\"\"", "5071.0 7067.0 195 199 80 0 11548 6107 -0.10780934514527492 0 1 2", "\"\"", "8143.0 8333.0 338 -57 80 0 11548 6107 -0.5424659084722812 0 1 1", "\"\"", "11912.0 3068.0 -205 -259 80 0 9019 1891 -2.699877011276299 0 2 3", "\"\"", "2:99 1:89", ""], ["INTERMEDIATE_FRAME 477", ""], ["KEY_FRAME 478", "5167.0 4822.0 -165 -195 80 0 11548 6107 -2.3384867780885843 0 1 4", "\"\"", "5345.0 7254.0 233 159 80 0 11548 6107 -0.14714549990007705 0 1 2", "\"\"", "8548.0 8232.0 344 -85 80 0 11548 6107 -0.5790030510599983 0 1 1", "\"\"", "11633.0 2779.0 -237 -245 80 0 9019 1891 -2.7552001443256264 0 2 3", "\"\"", "2:98 1:88", ""], ["INTERMEDIATE_FRAME 479", ""], ["KEY_FRAME 480", "4967.0 4555.0 -170 -226 80 0 11548 6107 -2.024327512729605 0 1 4", "\"\"", "5657.0 7398.0 264 122 80 0 11548 6107 -0.18284525288668382 0 1 2", "\"\"", "8957.0 8101.0 347 -111 80 0 11548 6107 -0.6162969373960713 0 1 1", "\"\"", "11320.0 2508.0 -265 -230 80 0 9019 1891 -2.814114784955274 0 2 3", "\"\"", "2:97 1:87", ""], ["INTERMEDIATE_FRAME 481", ""], ["KEY_FRAME 482", "4786.0 4250.0 -153 -259 80 0 11548 6107 -1.7101682473706257 0 1 4", "\"\"", "5999.0 7503.0 290 89 80 0 11548 6107 -0.21573735232263921 0 1 2", "\"\"", "9367.0 7941.0 348 -135 80 0 11548 6107 -0.6559194108078544 0 1 1", "\"\"", "10978.0 2257.0 -290 -213 80 0 9019 1891 -2.8796112507381184 0 2 3", "\"\"", "2:96 1:86", ""], ["INTERMEDIATE_FRAME 483", ""], ["KEY_FRAME 484", "4647.0 3912.0 -118 -287 80 0 11548 6107 -1.3960089820116464 0 1 4", "\"\"", "6367.0 7572.0 312 59 80 0 11548 6107 -0.24646221578549835 0 1 2", "\"\"", "9776.0 7755.0 347 -158 80 0 11548 6107 -0.6991864855354186 0 1 1", "\"\"", "10609.0 2029.0 -313 -193 80 0 9019 1891 -2.956892012547521 0 2 3", "\"\"", "2:95 1:85", ""], ["INTERMEDIATE_FRAME 485", ""], ["KEY_FRAME 486", "4567.0 3554.0 -68 -303 80 0 11548 6107 -1.081849716652667 0 1 4", "\"\"", "6756.0 7609.0 330 31 80 0 11548 6107 -0.27556986503567776 0 1 2", "\"\"", "10182.0 7543.0 344 -180 80 0 11548 6107 -0.749156728798909 0 1 1", "\"\"", "10216.0 1829.0 -333 -169 80 0 9019 1891 -3.0550171548407192 0 2 3", "\"\"", "2:94 1:84", ""], ["INTERMEDIATE_FRAME 487", ""], ["KEY_FRAME 488", "4557.0 3195.0 -8 -304 80 0 11548 6107 -0.7676904512936877 0 1 4", "\"\"", "7162.0 7616.0 345 6 80 0 11548 6107 -0.3037401578958134 0 1 2", "\"\"", "10581.0 7305.0 339 -202 80 0 11548 6107 -0.8103751237573422 0 1 1", "\"\"", "9803.0 1664.0 -350 -140 80 0 9019 1891 3.0898427424109403 0 2 3", "\"\"", "2:93 1:83", ""], ["INTERMEDIATE_FRAME 489", ""], ["KEY_FRAME 490", "4621.0 2856.0 54 -288 80 0 11548 6107 -0.4535311859347084 0 1 4", "\"\"", "7583.0 7596.0 357 -17 80 0 11548 6107 -0.33136367613960854 0 1 2", "\"\"", "10970.0 7041.0 330 -224 80 0 11548 6107 -0.8916934726937107 0 1 1", "\"\"", "9376.0 1546.0 -362 -100 80 0 9019 1891 2.859758845717555 0 0 3", "\"\"", "2:92 1:100", ""], ["INTERMEDIATE_FRAME 491", ""],
    ["KEY_FRAME 492", "4754.0 2557.0 113 -254 80 0 11548 6107 -0.1393719205757291 0 1 4", "\"\"", "8015.0 7551.0 367 -38 80 0 11548 6107 -0.35924045220191203 0 1 2", "\"\"", "11342.0 6749.0 316 -248 80 0 11548 6107 -1.016636279722327 0 1 1", "\"\"", "8948.0 1491.0 -363 -46 80 0 4970 5340 2.5455995803585756 0 0 3", "\"\"", "2:91 1:99", ""], ["INTERMEDIATE_FRAME 493", ""], ["KEY_FRAME 494", "4946.0 2317.0 163 -204 80 0 11548 6107 0.1747873447832502 0 1 4", "\"\"", "8456.0 7483.0 374 -58 80 0 11548 6107 -0.38799906032748627 0 1 2", "\"\"", "11682.0 6425.0 289 -275 80 0 11548 6107 -1.2603023325813032 0 2 1", "\"\"", "8528.0 1501.0 -357 8 80 0 4970 5340 2.372674408617918 0 0 3", "\"\"", "2:90 1:100", ""], ["INTERMEDIATE_FRAME 495", ""], ["KEY_FRAME 496", "5180.0 2151.0 198 -141 80 0 11548 6107 0.4889466101422295 0 1 4", "\"\"", "8903.0 7392.0 380 -76 80 0 11548 6107 -0.41870434874312873 0 1 2", "\"\"", "11971.0 6070.0 245 -301 80 0 9019 1891 -1.5744615979402825 0 2 1", "\"\"", "8117.0 1568.0 -349 56 80 0 4970 5340 2.318224374604206 0 0 3", "\"\"", "2:89 1:99", ""], ["INTERMEDIATE_FRAME 497", ""], ["KEY_FRAME 498", "5446.0 2052.0 226 -83 80 0 11548 6107 0.5558845434369871 0 1 4", "\"\"", "9355.0 7281.0 384 -94 80 0 11548 6107 -0.45224125959371597 0 1 2", "\"\"", "12191.0 5693.0 186 -320 80 0 9019 1891 -1.8886208632992618 0 2 1", "\"\"", "7717.0 1685.0 -340 99 80 0 4970 5340 2.266108012369159 0 0 3", "\"\"", "2:88 1:98", ""], ["INTERMEDIATE_FRAME 499", ""], ["KEY_FRAME 500", "5739.0 2013.0 248 -32 80 0 11548 6107 0.5865262266674932 0 1 4", "\"\"", "9810.0 7149.0 386 -111 80 0 11548 6107 -0.4915180883415678 0 1 2", "\"\"", "12330.0 5308.0 117 -326 80 0 9019 1891 -2.202780128658241 0 2 1", "\"\"", "7329.0 1848.0 -329 138 80 0 4970 5340 2.2153035154726926 0 0 3", "\"\"", "2:87 1:97", ""], ["INTERMEDIATE_FRAME 501", ""], ["KEY_FRAME 502", "6052.0 2027.0 266 11 80 0 11548 6107 0.6139191107274728 0 1 4", "\"\"", "10265.0 6997.0 386 -129 80 0 11548 6107 -0.5400809762483091 0 1 2", "\"\"", "12391.0 4925.0 52 -325 80 0 9019 1891 -2.340440740072617 0 2 1", "\"\"", "6955.0 2052.0 -317 173 80 0 4970 5340 2.1649196910784143 0 0 3", "\"\"", "2:86 1:96", ""], ["INTERMEDIATE_FRAME 503", ""], ["KEY_FRAME 504", "5811.0 2048.0 -291 12 80 0 11548 6107 0.6385923123169521 0 1 4", "\"\"", "10717.0 6822.0 383 -148 80 0 11548 6107 -0.6064762523022209 0 1 2", "\"\"", "12384.0 4546.0 -6 -321 80 0 9019 1891 -2.408908643468383 0 2 1", "\"\"", "7168.0 2331.0 267 243 80 0 4970 5340 2.113939642611069 0 0 3", "\"\"", "2:85 1:95", "45 0.15211681392908036 3 6900 2089 0 6102 2036 675.0128605833071 -14 150", ""], ["INTERMEDIATE_FRAME 505", ""], ["KEY_FRAME 506", "5585.0 2106.0 -191 49 80 0 11548 6107 0.6157502276276645 0 1 4", "\"\"", "11161.0 6622.0 377 -170 80 0 11548 6107 -0.7105061551412497 0 1 2", "\"\"", "12315.0 4175.0 -58 -314 80 0 9019 1891 -2.4735923635098267 0 2 1", "\"\"", "7388.0 2639.0 186 261 80 0 4970 5340 2.2016840412128045 0 0 3", "\"\"", "2:84 1:94", ""], ["INTERMEDIATE_FRAME 507", ""], ["KEY_FRAME 508", "5460.0 2200.0 -105 79 80 0 11548 6107 0.5909766011910296 0 1 4", "\"\"", "11586.0 6388.0 361 -198 80 0 11548 6107 -0.9263638305031592 0 2 2", "\"\"", "12191.0 3815.0 -105 -305 80 0 9019 1891 -2.5356063774969706 0 2 1", "\"\"", "7521.0 2960.0 112 272 80 0 4970 5340 2.300966474526182 0 0 3", "\"\"", "2:100 1:93", ""], ["INTERMEDIATE_FRAME 509", ""], ["KEY_FRAME 510", "5422.0 2322.0 -32 103 80 0 11548 6107 0.5705567166715397 0 1 4", "\"\"", "11973.0 6114.0 328 -232 80 0 9019 1891 -1.2405230958621385 0 2 2", "\"\"", "12018.0 3469.0 -147 -294 80 0 9019 1891 -2.596365498052518 0 2 1", "\"\"", "7575.0 3287.0 45 277 80 0 4970 5340 2.390859162887341 0 0 3", "\"\"", "2:99 1:92", ""], ["INTERMEDIATE_FRAME 511", ""], ["KEY_FRAME 512", "5458.0 2467.0 30 123 80 0 11548 6107 0.5534472257377547 0 1 4", "\"\"", "12302.0 5802.0 279 -265 80 0 9019 1891 -1.5546823612211178 0 2 2", "\"\"", "11800.0 3138.0 -185 -281 80 0 9019 1891 -2.657224673563473 0 2 1", "\"\"", "7557.0 3614.0 -15 277 80 0 4970 5340 2.474150164435899 0 0 3", "\"\"", "2:98 1:91", ""], ["INTERMEDIATE_FRAME 513", ""], ["KEY_FRAME 514", "5557.0 2631.0 83 139 80 0 11548 6107 0.5387274545080458 0 1 4", "\"\"", "12558.0 5461.0 217 -290 80 0 9019 1891 -1.8688416265800971 0 2 2", "\"\"", "11542.0 2824.0 -219 -266 80 0 9019 1891 -2.7200702049100784 0 2 1", "\"\"", "7475.0 3935.0 -69 273 80 0 4970 5340 2.5532333212604255 0 0 3", "\"\"", "2:97 1:90", ""], ["INTERMEDIATE_FRAME 515", ""], ["KEY_FRAME 516", "5709.0 2810.0 129 152 80 0 11548 6107 0.5257361587072673 0 1 4", "\"\"", "12729.0 5106.0 145 -302 80 0 9019 1891 -2.183000891939076 0 2 2", "\"\"", "11248.0 2530.0 -249 -249 80 0 9019 1891 -2.787390545712612 0 2 1", "\"\"", "7336.0 4247.0 -117 265 80 0 4970 5340 2.630436004413631 0 0 3", "\"\"", "2:96 1:89", ""], ["INTERMEDIATE_FRAME 517", ""], ["KEY_FRAME 518", "5908.0 3001.0 168 162 80 0 11548 6107 0.5140223174994836 0 1 4", "\"\"", "12814.0 4752.0 71 -301 80 0 9019 1891 -2.4275532659735366 0 2 2", "\"\"", "10922.0 2259.0 -277 -230 80 0 9019 1891 -2.8624044218667035 0 2 1", "\"\"", "7146.0 4546.0 -161 253 80 0 4970 5340 2.70883650200162 0 0 3", "\"\"", "2:95 1:88", ""], ["INTERMEDIATE_FRAME 519", ""], ["KEY_FRAME 520", "6146.0 3202.0 202 170 80 0 11548 6107 0.5033875544637698 0 1 4", "\"\"", "12821.0 4403.0 6 -296 80 0 9019 1891 -2.4956086984065635 0 2 2", "\"\"", "10566.0 2014.0 -302 -208 80 0 9019 1891 -2.9505715900142655 0 2 1", "\"\"", "6910.0 4826.0 -200 238 80 0 4970 5340 2.791715129359821 0 0 3", "\"\"", "2:94 1:87", ""], ["INTERMEDIATE_FRAME 521", ""], ["KEY_FRAME 522", "6418.0 3410.0 231 176 80 0 11548 6107 0.49340029720859885 0 1 4", "\"\"", "12760.0 4063.0 -51 -289 80 0 9019 1891 -2.5577287969525786 0 2 2", "\"\"", "10184.0 1800.0 -324 -182 80 0 9019 1891 -3.0622508361797762 0 2 1", "\"\"", "6633.0 5084.0 -235 219 80 0 4970 5340 2.882595087785306 0 0 3", "\"\"", "2:93 1:86", ""], ["INTERMEDIATE_FRAME 523", ""], ["KEY_FRAME 524", "6720.0 3623.0 256 181 80 0 11548 6107 0.4840198769957698 0 1 4", "\"\"", "12640.0 3734.0 -102 -279 80 0 9019 1891 -2.615564927545089 0 2 2", "\"\"", "9780.0 1624.0 -343 -149 80 0 9019 1891 3.06363935042545 0 2 1", "\"\"", "6319.0 5315.0 -266 196 80 0 4970 5340 2.9888529542219304 0 0 3", "\"\"", "2:92 1:85", ""], ["INTERMEDIATE_FRAME 525", ""], ["KEY_FRAME 526", "7047.0 3841.0 278 184 80 0 11548 6107 0.47517922302875404 0 1 4", "\"\"", "12467.0 3419.0 -147 -267 80 0 9019 1891 -2.670790516142257 0 2 2", "\"\"", "9362.0 1501.0 -355 -104 80 0 9019 1891 2.804157111077529 0 0 1", "\"\"", "5973.0 5512.0 -294 167 80 0 4970 5340 3.123062528641627 0 0 3", "\"\"", "2:91 1:100", ""], ["INTERMEDIATE_FRAME 527", ""], ["KEY_FRAME 528", "7396.0 4061.0 297 186 80 0 11548 6107 0.46639875576943757 0 1 4", "\"\"", "12247.0 3120.0 -187 -254 80 0 9019 1891 -2.7244452135361255 0 2 2", "\"\"", "8943.0 1446.0 -355 -47 80 0 4970 5340 2.4899978457185497 0 0 1", "\"\"", "5600.0 5665.0 -316 130 80 0 4970 5340 -2.9717590346841893 0 0 3", "\"\"", "2:90 1:99", ""], ["INTERMEDIATE_FRAME 529", ""], ["KEY_FRAME 530", "7765.0 4282.0 313 188 80 0 11548 6107 0.45785057249009614 0 1 4", "\"\"", "11985.0 2838.0 -222 -240 80 0 9019 1891 -2.7778069462403305 0 2 2", "\"\"", "8531.0 1455.0 -350 7 80 0 4970 5340 2.3662361000421863 0 0 1", "\"\"", "5213.0 5758.0 -329 79 80 0 4970 5340 -2.6653274176960244 0 1 3", "\"\"", "2:89 1:100", ""], ["INTERMEDIATE_FRAME 531", ""], ["KEY_FRAME 532", "8150.0 4505.0 327 189 80 0 11548 6107 0.44948605976703715 0 1 4", "\"\"", "11687.0 2574.0 -253 -224 80 0 9019 1891 -2.8325382173870337 0 2 2", "\"\"", "8127.0 1521.0 -343 56 80 0 4970 5340 2.3127086260978174 0 0 1", "\"\"", "4828.0 5780.0 -327 18 80 0 11548 6107 -2.351168152337045 0 1 3", "\"\"", "2:88 1:99", ""], ["INTERMEDIATE_FRAME 533", ""],
    ["KEY_FRAME 534", "8549.0 4728.0 339 189 80 0 11548 6107 0.4405509786055446 0 1 4", "\"\"", "11356.0 2330.0 -280 -207 80 0 9019 1891 -2.890977766570182 0 2 2", "\"\"", "7733.0 1639.0 -334 100 80 0 4970 5340 2.2615810330587154 0 0 1", "\"\"", "4465.0 5727.0 -308 -45 80 0 11548 6107 -2.037008886978066 0 1 3", "\"\"", "2:87 1:98", ""], ["INTERMEDIATE_FRAME 535", ""], ["KEY_FRAME 536", "8961.0 4950.0 349 189 80 0 11548 6107 0.4309901171393693 0 1 4", "\"\"", "10997.0 2108.0 -304 -188 80 0 9019 1891 -2.9559088643962053 0 2 2", "\"\"", "7351.0 1803.0 -324 139 80 0 4970 5340 2.2120889777400836 0 0 1", "\"\"", "4145.0 5603.0 -272 -105 80 0 11548 6107 -1.7228496216190865 0 1 3", "\"\"", "2:86 1:97", ""], ["INTERMEDIATE_FRAME 537", ""], ["KEY_FRAME 538", "9383.0 5172.0 358 188 80 0 11548 6107 0.4205531562960154 0 1 4", "\"\"", "10613.0 1911.0 -325 -167 80 0 9019 1891 -3.0323228559110302 0 2 2", "\"\"", "6982.0 2008.0 -313 174 80 0 4970 5340 2.163287288935844 0 0 1", "\"\"", "3886.0 5419.0 -220 -156 80 0 11548 6107 -1.4086903562601072 0 1 3", "\"\"", "2:85 1:96", ""], ["INTERMEDIATE_FRAME 539", ""], ["KEY_FRAME 540", "9814.0 5392.0 366 186 80 0 11548 6107 0.4076757434580404 0 1 4", "\"\"", "10208.0 1743.0 -344 -142 80 0 9019 1891 -3.129046260505859 0 2 2", "\"\"", "6628.0 2250.0 -301 206 80 0 4970 5340 2.114035699746307 0 0 1", "\"\"", "3703.0 5192.0 -155 -193 80 0 11548 6107 -1.0945310909011279 0 1 3", "\"\"", "2:84 1:95", ""], ["INTERMEDIATE_FRAME 541", ""], ["KEY_FRAME 542", "10254.0 5608.0 373 184 80 0 11548 6107 0.39110004020677075 0 1 4", "\"\"", "9785.0 1611.0 -359 -112 80 0 9019 1891 3.017755257340494 0 2 2", "\"\"", "6289.0 2526.0 -288 235 80 0 4970 5340 2.0632698352112246 0 0 1", "\"\"", "3605.0 4943.0 -83 -211 80 0 11548 6107 -0.7803718255421486 0 1 3", "\"\"", "2:83 1:94", ""], ["INTERMEDIATE_FRAME 543", ""], ["KEY_FRAME 544", "10702.0 5821.0 380 180 80 0 11548 6107 0.36805388742960804 0 1 4", "\"\"", "9351.0 1526.0 -369 -71 80 0 9019 1891 2.7911455568760806 0 0 2", "\"\"", "5967.0 2833.0 -273 261 80 0 4970 5340 2.009114677189398 0 0 1", "\"\"", "3593.0 4696.0 -9 -209 80 0 11548 6107 -0.46621256018316926 0 1 3", "\"\"", "2:100 1:93", ""], ["INTERMEDIATE_FRAME 545", ""], ["KEY_FRAME 546", "11158.0 6027.0 387 174 80 0 11548 6107 0.3259998206058701 0 2 4", "\"\"", "8919.0 1504.0 -367 -18 80 0 4970 5340 2.4769862915171013 0 0 2", "\"\"", "5664.0 3168.0 -257 285 80 0 4970 5340 1.9493066985739538 0 0 1", "\"\"", "3663.0 4475.0 59 -187 80 0 11548 6107 -0.15205329482418994 0 1 3", "\"\"", "2:100 1:92", ""], ["INTERMEDIATE_FRAME 547", ""], ["KEY_FRAME 548", "11625.0 6202.0 396 148 80 0 9019 1891 0.011840555246890816 0 2 4", "\"\"", "8495.0 1542.0 -360 32 80 0 4970 5340 2.370708564064031 0 0 2", "\"\"", "5383.0 3529.0 -239 307 80 0 4970 5340 1.8800648664993436 0 0 1", "\"\"", "3801.0 4301.0 117 -147 80 0 11548 6107 0.16210597053478937 0 1 3", "\"\"", "2:99 1:91", ""], ["INTERMEDIATE_FRAME 549", ""], ["KEY_FRAME 550", "12097.0 6326.0 401 105 80 0 9019 1891 -0.3023187101120885 0 2 4", "\"\"", "8081.0 1633.0 -352 77 80 0 4970 5340 2.3189319427343285 0 0 2", "\"\"", "5126.0 3914.0 -218 327 80 0 4970 5340 1.795012661019395 0 0 1", "\"\"", "3996.0 4172.0 165 -109 80 0 11548 6107 0.2290319757196322 0 1 3", "\"\"", "2:98 1:90", ""], ["INTERMEDIATE_FRAME 551", ""], ["KEY_FRAME 552", "12563.0 6385.0 396 49 80 0 9019 1891 -0.6164779754710679 0 2 4", "\"\"", "7678.0 1771.0 -342 117 80 0 4970 5340 2.26900047264963 0 0 2", "\"\"", "5014.0 4334.0 149 387 80 0 4970 5340 1.6797599391184679 0 0 1", "\"\"", "4124.0 4069.0 -136 -117 80 0 11548 6107 0.2508274593272078 0 1 3", "\"\"", "2:97 1:89", "46 0.7158664823536228 3 4170 4108 2 4964 4205 405.75032846437693 8 159", ""], ["INTERMEDIATE_FRAME 553", ""], ["KEY_FRAME 554 endReached", "13007.0 6370.0 377 -12 80 0 9019 1891 -0.9306372408300472 0 2 4", "\"\"", "7288.0 1952.0 -331 153 80 0 4970 5340 2.2198777348072953 0 0 2", "\"\"", "5160.0 4801.0 123 396 80 0 4970 5340 1.6145060436800873 0 1 1", "\"\"", "4065.0 3973.0 -50 -81 80 0 11548 6107 0.2679153345454747 0 1 3", "\"\"", "2:96 1:100", ""]]
};
"

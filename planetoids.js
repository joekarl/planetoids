var g = {
    width: 800,
    height: 600,
    halfWidth: 400,
    halfHeight: 300,
    rotationSpeed: 0.07,
    thrustSpeed: 0.3,
    entities: {},
    shipFriction: 0.05,
    entityId: 0,
    laserSpeed: 5,
    laserLife: 100,
    laserFireRate: 10, 
    ups: 30 //updates per second
};

var fpsStats = new Stats();
fpsStats.setMode(0);
document.body.appendChild(fpsStats.domElement);

init(); //start

function createCanvas() {
    var canvas = document.createElement('canvas');
    canvas.width = g.width;
    canvas.height = g.height;
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    return ctx;
}

function Transform() {
    var _x = 0, 
        _y = 0, 
        _vx = 0, 
        _vy = 0, 
        _sx = 1, 
        _sy = 1,
        _angle = 0,
        _va = 0;

    return {
        copy: function(transform) {
            _x = transform.x();
            _y = transform.y();
            _vx = transform.vx();
            _vy = transform.vy();
            _sx = transform.sx();
            _sy = transform.sy();
            _angle = transform.angle();
            _va = transform.va();
        },
        x: function(_) {
            if (_ != undefined) {
                _x = _;
            } else {
                return _x;
            }
        },
        y: function(_) {
            if (_ != undefined) {
                _y = _;
            } else {
                return _y;
            }
        },
        vx: function(_) {
            if (_ != undefined) {
                _vx = _;
            } else {
                return _vx;
            }
        },
        vy: function(_) {
            if (_ != undefined) {
                _vy = _;
            } else {
                return _vy;
            }
        },
        sx: function(_) {
            if (_ != undefined) {
                _sx = _;
            } else {
                return _sx;
            }
        },
        sy: function(_) {
            if (_ != undefined) {
                _sy = _;
            } else {
                return _sy;
            }
        },
        angle: function(_) {
            if (_ != undefined) {
                _angle = _;
            } else {
                return _angle;
            }
        },
        va: function(_) {
            if (_ != undefined) {
                _va = _;
            } else {
                return _va;
            }
        }
    };
}

function Entity() {
    var _transform = new Transform();
    var _id = g.entityId++;
    return {
        transform: function() {
            return _transform;
        },
        id: function() {
            return _id;
        }
    };
}

function Laser(transform) {
    var _laser = Object.create(Entity());

    var _transform = _laser.transform();
    _transform.copy(transform);
    _transform.vx(_transform.vx() - Math.cos(_transform.angle()) * g.laserSpeed);
    _transform.vy(_transform.vy() + Math.sin(_transform.angle()) * g.laserSpeed);
    _transform.angle(0);
    _transform.va(0);
    _transform.sx(2);
    _transform.sy(2);

    var _life = g.laserLife;

    _laser.update = function() {
        if (_transform.x() > g.halfWidth) {
            _transform.x(-g.halfWidth);
        } else if (_transform.x() < -g.halfWidth) {
            _transform.x(g.halfWidth);
        }
        if (_transform.y() > g.halfHeight) {
            _transform.y(-g.halfHeight);
        } else if (_transform.y() < -g.halfHeight) {
            _transform.y(g.halfHeight);
        }

        if (_life-- < 0) {
            delete g.entities[_laser.id()];
        }
    };

    _laser.render = function(dt, ctx) {
        ctx.strokeStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-1, 0);
        ctx.stroke();
    }

    return _laser;
}

function Ship() {
    var _ship = Object.create(Entity());

    var _transform = _ship.transform();
    _transform.sx(5);
    _transform.sy(5);
    _transform.angle(- Math.PI / 2);
    var fireCounter = g.laserFireRate;

    _ship.update = function() {
        var previousVx = _transform.vx();
        var previousVy = _transform.vy();

        if (previousVx > 0) {
            _transform.vx(_transform.vx() - g.shipFriction);
            if (_transform.vx() < 0) {
                _transform.vx(0);
            }
        } else if (previousVx < 0) {
            _transform.vx(_transform.vx() + g.shipFriction);
            if (_transform.vx() > 0) {
                _transform.vx(0);
            }
        }
        if (previousVy > 0) {
            _transform.vy(_transform.vy() - g.shipFriction);
            if (_transform.vy() < 0) {
                _transform.vy(0);
            }
        } else if (previousVy < 0) {
            _transform.vy(_transform.vy() + g.shipFriction);
            if (_transform.vy() > 0) {
                _transform.vy(0);
            }
        }

        if (_transform.x() > g.halfWidth) {
            _transform.x(-g.halfWidth);
        } else if (_transform.x() < -g.halfWidth) {
            _transform.x(g.halfWidth);
        }
        if (_transform.y() > g.halfHeight) {
            _transform.y(-g.halfHeight);
        } else if (_transform.y() < -g.halfHeight) {
            _transform.y(g.halfHeight);
        }

        var input = g.input;
        if (input.isActive(input.ROTATE_LEFT)) {
            _transform.va(g.rotationSpeed); 
        }
        if (input.isActive(input.ROTATE_RIGHT)) {
            _transform.va(-g.rotationSpeed); 
        } 
        if (!input.isActive(input.ROTATE_RIGHT) 
                && !input.isActive(input.ROTATE_LEFT)) {
            _transform.va(0); 
        }
        if (input.isActive(input.THRUST)) {
            _transform.vx(_transform.vx() - Math.cos(_transform.angle()) * g.thrustSpeed);
            _transform.vy(_transform.vy() + Math.sin(_transform.angle()) * g.thrustSpeed);
        }
        if (fireCounter-- < 0 && input.isActive(input.LASER)) {
            var laser = Object.create(Laser(_transform));
            g.entities[laser.id()] = laser;
            fireCounter = g.laserFireRate;
        }
    }

    _ship.render = function(dt, ctx) {
        ctx.strokeStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(1, 1);
        ctx.lineTo(-1.5, 0);
        ctx.lineTo(1, -1);
        ctx.lineTo(0, 0);
        ctx.stroke();
    }

    return _ship;
}

function initInput() {
    g.input = {
        _pressed: {},
        
        THRUST: 38, //up
        ROTATE_LEFT: 37, //left
        ROTATE_RIGHT: 39, //right
        LASER: 32, //space

        isActive: function(code) {
            return this._pressed[code];
        },

        onKeydown: function(e) {
            this._pressed[e.keyCode] = true;
        },

        onKeyup: function(e) {
            delete this._pressed[e.keyCode];
        }
    };

    window.addEventListener('keyup', function(event) { g.input.onKeyup(event); }, false);
    window.addEventListener('keydown', function(event) { g.input.onKeydown(event); }, false);
}

function clearScreen(ctx) {
    ctx.translate(0,0);
    ctx.scale(1,1);
    ctx.rotate(0);
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect (0, 0, g.width, g.height);
}

function update(dt) {
    Object.keys(g.entities).forEach(function (id){
        var entity = g.entities[id];
        var transform = entity.transform();
        transform.x(transform.x() + transform.vx());
        transform.y(transform.y() + transform.vy());
        transform.angle(transform.angle() + transform.va());
        if (entity.update) {
            entity.update(dt);
        }
    });
}

function render(dt, ctx) {
    clearScreen(ctx);
    Object.keys(g.entities).forEach(function (id){
        var entity = g.entities[id];
        if (entity.render) {
            var transform = entity.transform();
            ctx.save();
            ctx.translate(transform.x() + g.halfWidth - dt * transform.vx(), transform.y() + g.halfHeight - dt * transform.vy()); 
            ctx.scale(transform.sx(), -transform.sy()); //flip axis
            ctx.rotate(transform.angle());
            entity.render(dt, ctx);
            ctx.restore();
        }
    });
}

function startMainLoop(ctx) {
    var loops = 0, 
        skipTicks = 1000 / g.ups,
        maxFrameSkip = 10,
        nextGameTick = new Date().getTime()
        _ctx = ctx;
  
    var _loop = function() {
        fpsStats.begin();
        loops = 0;
        var currentTime = new Date().getTime();

        while (currentTime > nextGameTick && loops < maxFrameSkip) {
            update(skipTicks);
            nextGameTick += skipTicks;
            loops++;
        }

        render((nextGameTick - currentTime) / skipTicks, _ctx);
        fpsStats.end();
        window.requestAnimationFrame(_loop);
    };
    _loop();
};

function init() {
    var ctx = createCanvas();
    initInput();
    var ship = Object.create(Ship());
    g.entities[ship.id()] = ship;
    startMainLoop(ctx);
}



var g = {
    width: 800,
    height: 600,
    halfWidth: 400,
    halfHeight: 300,
    rotationSpeed: 0.12,
    thrustSpeed: 0.25,
    entityManager: {
        _entities: {},
        addEntity: function(entity) {
            return this._entities[entity.id()] = entity;
        },
        removeEntity: function(entity) {
            delete this._entities[entity.id()];
            return entity;
        },
        entityIds: function() {
            return Object.keys(this._entities);
        },
        entity: function(id) {
            return this._entities[id];
        }
    },
    shipFriction: 0.05,
    entityId: 0,
    laserSpeed: 5,
    laserLife: 100,
    laserFireRate: 7, 
    planetSpeed: 4,
    maxShipSpeed: 12,
    drawCollisionBounds: false,
    originalPlanetSize: 24,
    maxPlanetSplits: 3,
    ups: 30 //updates per second
};

var fpsStats = new Stats();
fpsStats.setMode(0);
document.body.appendChild(fpsStats.domElement);

g.explosionSound = new Howl({
    urls: ['explosion.mp3'],
    onload: function() {
        g.laserSound = new Howl({
            urls:['laser.wav'],
            onload: init
        });
    }
});

function createCanvas() {
    var canvas = document.createElement('canvas');
    canvas.width = g.width;
    canvas.height = g.height;
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    return ctx;
}

function BoundingCircle(radius) {
    var _radius = radius;
    
    return {
        radius: function(_) {
            if (_ != undefined) {
                _radius = _;
                return this;
            } else {
                return _radius;
            }
        }
    };
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
            if (transform) {
                _x = transform.x();
                _y = transform.y();
                _vx = transform.vx();
                _vy = transform.vy();
                _sx = transform.sx();
                _sy = transform.sy();
                _angle = transform.angle();
                _va = transform.va();
            }
            return this;
        },
        distance: function(transform) {
            return Math.sqrt(
                Math.pow(transform.x() - _x, 2) + Math.pow(transform.y() - _y, 2)
            );
        },
        x: function(_) {
            if (_ != undefined) {
                _x = _;
                return this;
            } else {
                return _x;
            }
        },
        y: function(_) {
            if (_ != undefined) {
                _y = _;
                return this;
            } else {
                return _y;
            }
        },
        vx: function(_) {
            if (_ != undefined) {
                _vx = _;
                return this;
            } else {
                return _vx;
            }
        },
        vy: function(_) {
            if (_ != undefined) {
                _vy = _;
                return this;
            } else {
                return _vy;
            }
        },
        sx: function(_) {
            if (_ != undefined) {
                _sx = _;
                return this;
            } else {
                return _sx;
            }
        },
        sy: function(_) {
            if (_ != undefined) {
                _sy = _;
                return this;
            } else {
                return _sy;
            }
        },
        angle: function(_) {
            if (_ != undefined) {
                _angle = _;
                return this;
            } else {
                return _angle;
            }
        },
        va: function(_) {
            if (_ != undefined) {
                _va = _;
                return this;
            } else {
                return _va;
            }
        }
    };
}

function Entity() {
    var _transform = new Transform();
    var _id = g.entityId++;
    var _boundingCircle;
    var _type = "Entity";
    
    return {
        transform: function() {
            return _transform;
        },
        id: function() {
            return _id;
        },
        boundingCircle: function(_) {
            if (_ != undefined) {
                _boundingCircle = _;
                return this;
            } else {
                return _boundingCircle;
            }
        },
        type: function(_) {
            if (_ != undefined) {
                _type = _;
                return this;
            } else {
                return _type;
            }
        }
    };
}

function Planet(scale, transform) {
    var _planet = Object.create(Entity());
    scale = scale;
    
    _planet.type("Planet");
    _planet.boundingCircle(Object.create(BoundingCircle(scale)));

    var _vertexes = [];
    var _destroyed = false;
    var _vertexCount = Math.round(Math.random() * 4 + 12); // between 8 and 16
    var _radianIncrement = 2 * Math.PI /  _vertexCount;
    var _i, _radiusAdjust, _radians = 0;
    for (_i = 0; _i < _vertexCount; ++_i) {
        _radiusAdjust = scale * (0.25 - (Math.random() * 100) / 100 * 0.5);
        _vertexes.push([
            Math.cos(_radians) * (scale + _radiusAdjust), 
            Math.sin(_radians) * (scale + _radiusAdjust)
        ]);
        _radians += _radianIncrement;
    }

    var _transform = _planet.transform();

    if (!transform) {
        _transform.x((Math.random() * -g.width) + g.halfWidth)
            .y((Math.random() * -g.height) + g.halfHeight);
    } else {
        _planet.transform(_transform.copy(transform));
    }
    
    _transform.vx((Math.random() * -g.planetSpeed) + g.planetSpeed / 2)
        .vy((Math.random() * -g.planetSpeed) + g.planetSpeed / 2);
        
    _planet.scale = function() {
        return scale;
    };

    _planet.update = function() {
        if (_destroyed) {
            g.entityManager.addEntity(Explosion());
            g.entityManager.removeEntity(this);
            if ((scale / 2) >= (g.originalPlanetSize / (2 * g.maxPlanetSplits))) {
                for(var i = 0; i < 4; ++i) {
                    g.entityManager.addEntity(Object.create(Planet(scale / 2, this.transform())));
                }
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
    }

    _planet.render = function(dt, ctx) {
        ctx.strokeStyle = "#FF0000";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(_vertexes[_vertexCount - 1][0], _vertexes[_vertexCount - 1][1])
        for (var i = 0; i < _vertexCount; ++i) {
            var vertex = _vertexes[i];
            ctx.lineTo(vertex[0], vertex[1]);
        }
        ctx.stroke();
    };
    
    _planet.handleCollision = function(entity) {
        if (entity.type() == 'Laser') {
            _destroyed = true;
            entity.destroy();
        }
    }

    return _planet;
}

function Laser(transform) {
    var _laser = Object.create(Entity());
    
    _laser.type("Laser");
    _laser.boundingCircle(Object.create(BoundingCircle(1)));

    var _transform = _laser.transform();
    _transform.copy(transform)
        .x(_transform.x() - Math.cos(_transform.angle()) * 7.5)
        .y(_transform.y() + Math.sin(_transform.angle()) * 7.5)
        .vx(_transform.vx() - Math.cos(_transform.angle()) * g.laserSpeed)
        .vy(_transform.vy() + Math.sin(_transform.angle()) * g.laserSpeed)
        .angle(0)
        .va(0)
        .sx(2)
        .sy(2);

    var _life = g.laserLife;
    var _firstUpdate = true;

    _laser.update = function() {
        if (_firstUpdate) {
            g.laserSound.play();
            _firstUpdate = false;
        }
        if (_life-- < 0) {
            g.entityManager.removeEntity(this);
        }
    };
    
    _laser.destroy = function() {
        _life = -1;
    }

    _laser.render = function(dt, ctx) {
        ctx.strokeStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-1, 0);
        ctx.stroke();
    }

    return _laser;
}

function Explosion(callback) {
    var _explosion = Object.create(Entity());
    g.explosionSound.play();
    
    _explosion.type("Explosion");
    
    setTimeout(function() {
        g.entityManager.removeEntity(_explosion);
        if (callback) {
            callback();
        }
    }, 5000);
    return _explosion;
}

function Ship() {
    var _ship = Object.create(Entity());
    
    var _destroyed = false;
    
    _ship.type("Ship");
    _ship.boundingCircle(Object.create(BoundingCircle(7.5)));

    var _transform = _ship.transform();
    _transform.angle(- Math.PI / 2);
    var fireCounter = g.laserFireRate;

    _ship.update = function() {
        if (_destroyed) {
            //create explosion
            //remove ship
            g.entityManager.removeEntity(this);
            g.entityManager.addEntity(Explosion(function(){
                g.entityManager.addEntity(Object.create(Ship()));
            }));
            return;
        }
        
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
            var vm = Math.sqrt(Math.pow(_transform.vx(), 2) + Math.pow(_transform.vy(), 2));
            if (vm > g.maxShipSpeed) {
                //clamp velocities to max velocity
                _transform.vx(_transform.vx() + Math.cos(_transform.angle()) * (vm - g.maxShipSpeed));
                _transform.vy(_transform.vy() - Math.sin(_transform.angle()) * (vm - g.maxShipSpeed));
            }
        }
        if (fireCounter-- < 0 && input.isActive(input.LASER)) {
            g.entityManager.addEntity(Object.create(Laser(_transform)));
            fireCounter = g.laserFireRate;
        }
    }

    _ship.render = function(dt, ctx) {
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(5, 5);
        ctx.lineTo(-7.5, 0);
        ctx.lineTo(5, -5);
        ctx.lineTo(0, 0);
        ctx.stroke();
    }
    
    _ship.handleCollision = function(entity) {
        if (entity.type() == 'Planet') {
            this.destroy();
        }
    }
    
    _ship.destroy = function() {
        _destroyed = true;
    };

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
    ctx.fillStyle = undefined;
    ctx.strokeStyle = undefined;
}

function update(dt) {
    var collisionCheckedEntities = {};
    g.entityManager.entityIds().forEach(function (id){
        var entity = g.entityManager.entity(id);
        var transform = entity.transform();
        transform.x(transform.x() + transform.vx());
        transform.y(transform.y() + transform.vy());
        transform.angle(transform.angle() + transform.va());
        if (entity.update) {
            entity.update(dt);
        }
        
        collisionCheckedEntities[id] = [];
        //check for collisions
        g.entityManager.entityIds().forEach(function (collisionId){
            var collisionEntity = g.entityManager.entity(collisionId);
            collisionCheckedEntities[id][collisionId] = true;
            if (id == collisionId 
                || (collisionCheckedEntities[collisionId] && collisionCheckedEntities[collisionId][id])
                || !entity.boundingCircle()
                || !collisionEntity.boundingCircle()) {
                return;
            }
            
            var combinedRadius = collisionEntity.boundingCircle().radius()
                + entity.boundingCircle().radius();
            if (transform.distance(collisionEntity.transform()) < combinedRadius) {
                //collision!!!
                if (entity.handleCollision) {   
                    entity.handleCollision(collisionEntity);
                }
                if (collisionEntity.handleCollision) {
                    collisionEntity.handleCollision(entity);
                }
            }
        });
    });
}

function render(dt, ctx) {
    clearScreen(ctx);
    g.entityManager.entityIds().forEach(function (id){
        var entity = g.entityManager.entity(id);
        if (entity.render) {
            var transform = entity.transform();
            ctx.save();
            ctx.translate(transform.x() + g.halfWidth - dt * transform.vx(), transform.y() + g.halfHeight - dt * transform.vy()); 
            ctx.scale(transform.sx(), -transform.sy()); //flip axis
            ctx.rotate(transform.angle());
            entity.render(dt, ctx);
            
            if (g.drawCollisionBounds && entity.boundingCircle()) {
                ctx.save();
                ctx.strokeStyle = "#00FF00";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(0, 0, entity.boundingCircle().radius(), 2 * Math.PI, false);
                ctx.stroke()
                ctx.restore();
            }
            
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
            if (nextGameTick < currentTime) {
                nextGameTick = currentTime + skipTicks;
            }
            loops++;
        }

        var interpolation = (nextGameTick - currentTime) / skipTicks;
        interpolation = interpolation > 1 ? 1 : interpolation;
        interpolation = interpolation < 0 ? 0 : interpolation;
        render(interpolation, _ctx);
        fpsStats.end();
        window.requestAnimationFrame(_loop);
    };
    _loop();
}

function createPlanets() {
    for(var i = 0; i < 4; ++i) {
        g.entityManager.addEntity(Object.create(Planet(g.originalPlanetSize)));
    }
}

function init() {
    var ctx = createCanvas();
    initInput();
    g.entityManager.addEntity(Object.create(Ship()));
    createPlanets();
    startMainLoop(ctx);
}



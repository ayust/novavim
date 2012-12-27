Novavim = {};

(function() {

  var NUMBER_OF_PLANETS = 12;
  var PLANET_RADIUS = 100;

  var MINIMAP_SIZE = 100; // Actually twice this size

  var SPACEDUST_DENSITY = 200;

  var ROTATION_SPEED = Math.PI / 50;
  var ACCELERATION = 0.2;
  var GRAVITY = 5000.0;
  var MAX_GRAVITY_ACCELERATION = 0.05;
  var MIN_GRAVITY_ACCELERATION = 0.001;

  var LANDING_DISTANCE = 6;
  var LANDING_SPEED = 2.0;

  var SIZE_OF_SPACE = 5000;

  // Must be called before anything else.
  Novavim.init = function(selector) { // {{{
    // selector should be for a canvas object.
    var elem = $(selector).first();
    Novavim.view = elem.get(0).getContext("2d");
    Novavim.width = elem.width();
    Novavim.height = elem.height();

    // Get a more standard coordinate field
    Novavim.view.translate(Novavim.width / 2, Novavim.height / 2);
    Novavim.view.transform(1, 0, 0, -1, 0, 0);

    // Set up the world
    Novavim.setup_planets();
    Novavim.setup_player();
    Novavim.setup_keys();

    Novavim.run();
  }; // }}}

  Novavim.setup_planets = function() { // {{{
    Novavim.planets = [ 
      {
        "name": "Alpha",
        "width": PLANET_RADIUS * 2,
        "height": PLANET_RADIUS * 2,
        "x": 0,
        "y": 0
      },
      {
        "name": "Beta",
        "width": PLANET_RADIUS * 2,
        "height": PLANET_RADIUS * 2,
        "x": 600,
        "y": 0
      }
    ];

    var xBound = SIZE_OF_SPACE - Novavim.width;
    var yBound = SIZE_OF_SPACE - Novavim.height;
    var failures = 0;
    // Generate some other random planets
    for(var i=0; i < NUMBER_OF_PLANETS - 2 && failures < 100; i++) {
      var newX = Math.floor(2*xBound*Math.random()) - xBound;
      var newY = Math.floor(2*yBound*Math.random()) - yBound;
      var conflicts = 0;
      $.each(Novavim.planets, function(idx, val) {
        if(Math.abs(val.x - newX) < PLANET_RADIUS * 10 &&
           Math.abs(val.y - newY) < PLANET_RADIUS * 10) {
          conflicts++;
        }
      });
      if(conflicts) {
        // Overlaps, try again.
        i--;
        failures++;
        continue;
      }
      var planet = {
        "name": "" + i,
        "width": PLANET_RADIUS * 2,
        "height": PLANET_RADIUS * 2,
        "x": newX,
        "y": newY
      };
      Novavim.planets.push(planet);
    }
  }; // }}}

  Novavim.setup_player = function() { // {{{
    Novavim.player = {
      "alive": true,
      "landed": false,
      "x": 0,
      "y": PLANET_RADIUS + LANDING_DISTANCE,
      "angle": Math.PI / 2,
      "speed": {
        "x": 0,
        "y": 0
      }
    };
  }; // }}}

  Novavim.setup_keys = function() { // {{{
    Novavim.keys = {
      "up": false,
      "down": false,
      "left": false,
      "right": false,
    };

    $("body").keydown(Novavim.keydown);
    $("body").keyup(Novavim.keyup);
  }; // }}}

  Novavim.run = function() { // {{{
    Novavim.update();
    requestAnimationFrame(Novavim.run);
    Novavim.render();
  } // }}}

  Novavim.update = function() { // {{{
    if(!Novavim.player.alive) {
      return;
    }

    // Movement
    Novavim.movement.rotation();
    Novavim.movement.gravity();
    Novavim.movement.landing();
    Novavim.movement.acceleration();
    Novavim.movement.collision();

    Novavim.player.x += Novavim.player.speed.x;
    Novavim.player.y += Novavim.player.speed.y;

    if(Novavim.player.x > SIZE_OF_SPACE) {
      Novavim.player.x -= 2 * SIZE_OF_SPACE;
    } else if(Novavim.player.x < -SIZE_OF_SPACE) {
      Novavim.player.x += 2 * SIZE_OF_SPACE; 
    }

    if(Novavim.player.y > SIZE_OF_SPACE) {
      Novavim.player.y -= 2 * SIZE_OF_SPACE;
    } else if(Novavim.player.y < -SIZE_OF_SPACE) {
      Novavim.player.y += 2 * SIZE_OF_SPACE; 
    }
  }; // }}}

  Novavim.movement = { // {{{

    rotation: function() { // {{{
      if(Novavim.keys.left && Novavim.keys.right) {
        // No rotation if both keys pressed.
      } else if(Novavim.keys.right) {
        Novavim.player.angle -= ROTATION_SPEED;
        if(Novavim.player.angle < 0) {
          Novavim.player.angle += 2*Math.PI;
        }
      } else if(Novavim.keys.left) {
        Novavim.player.angle += ROTATION_SPEED;
        if(Novavim.player.angle >= 2*Math.PI) {
          Novavim.player.angle -= 2*Math.PI;
        }
      }
    }, // }}}

    acceleration: function() { // {{{
      if(Novavim.keys.up) {
        Novavim.player.speed.x += Math.cos(Novavim.player.angle) * ACCELERATION;
        Novavim.player.speed.y += Math.sin(Novavim.player.angle) * ACCELERATION;
      }
    }, // }}}

    gravity: function() { // {{{
      $.each(Novavim.planets, function(idx, val) {
        var deltaX = val.x - Novavim.player.x,
            deltaY = val.y - Novavim.player.y,
            distSquared = (deltaX*deltaX)+(deltaY*deltaY),
            dist = Math.sqrt(distSquared),
            vecX = deltaX / dist, 
            vecY = deltaY / dist,
            accel = Math.min(GRAVITY / distSquared, MAX_GRAVITY_ACCELERATION);
        if(accel > MIN_GRAVITY_ACCELERATION) {
          Novavim.player.speed.x += vecX * accel;
          Novavim.player.speed.y += vecY * accel;
        }
      });
    }, // }}}

    landing: function() { // {{{
      Novavim.player.landed = false;
      $.each(Novavim.planets, function(idx, val) {
        // If we already know we've landed on a different planet,
        // don't bother checking the others.
        if(Novavim.player.landed) { return; }
        val.landedOn = false;

        // A player can land on a planet if:
        //  - they're within LANDING_DISTANCE of the surface
        //  - they're moving at less than LANDING_SPEED
        //  - they're within 15 degrees of normal to the surface
        var deltaX = Novavim.player.x - val.x,
            deltaY = Novavim.player.y - val.y,
            distSquared = (deltaX*deltaX)+(deltaY*deltaY),
            dist = Math.sqrt(distSquared),
            speedX = Novavim.player.speed.x,
            speedY = Novavim.player.speed.y,
            speedSquared = (speedX*speedX)+(speedY*speedY),
            speed = Math.sqrt(speedSquared);

        if(dist > LANDING_DISTANCE + PLANET_RADIUS) { return; }
        if(dist < PLANET_RADIUS) { return; }
        if(speed > LANDING_SPEED) { return; }

        var normalAngle = Math.atan2(deltaY, deltaX),
            angleDiff = Novavim.player.angle - normalAngle;

        if(angleDiff < 0) {
          angleDiff += 2*Math.PI;
        }

        if(angleDiff > Math.PI / 12 && angleDiff < 23*Math.PI / 12) { return; }

        // Player is successfully landing here
        Novavim.player.angle = normalAngle;
        Novavim.player.speed.x = 0;
        Novavim.player.speed.y = 0;
        Novavim.player.landed = true;
        val.landedOn = true;
      });
    }, // }}}

    collision: function() { // {{{
      $.each(Novavim.planets, function(idx, val) {
        var deltaX = Novavim.player.x - val.x,
            deltaY = Novavim.player.y - val.y,
            distSquared = (deltaX*deltaX)+(deltaY*deltaY),
            dist = Math.sqrt(distSquared);
        if(dist <= PLANET_RADIUS) {
          Novavim.player.alive = false;
        }
      });
    } // }}}

  }; // }}}

  Novavim.render = function() { // {{{
    Novavim.clear();

    if(!Novavim.player.alive) {
      Novavim.view.save();
      Novavim.view.setTransform(1, 0, 0, 1, 0, 0);
      Novavim.view.font = "20pt sans-serif";
      Novavim.view.fillStyle = "#f00";
      Novavim.view.fillText("You died...", Novavim.width / 2, Novavim.height / 2);
      Novavim.view.restore();
      return;
    }

    Novavim.view.save();

    Novavim.draw.spacedust();

    $.each(Novavim.planets, function(idx, val) {
      if(Math.abs(val.x - Novavim.player.x) > PLANET_RADIUS + (Novavim.width / 2) ||
         Math.abs(val.y - Novavim.player.y) > PLANET_RADIUS + (Novavim.height / 2)) {
        // Don't render planets that are off the screen
        return;
      }
      if(val.landedOn) {
        Novavim.draw.planet(val.x, val.y, "#660", val.name);
      } else {
        Novavim.draw.planet(val.x, val.y, null, val.name);
      }
    });

    var player = Novavim.player;
    if(player.alive) {
      Novavim.draw.ship(player.x, player.y, player.angle);
    }

    Novavim.draw.minimap();

    Novavim.view.restore();
  }; // }}}

  Novavim.keydown = function(e) { // {{{
    switch(e.which) {
      case 37: // left arrow
        Novavim.keys.left = true;
        break;
      case 38: // up arrow
        Novavim.keys.up = true;
        break;
      case 39: // right arrow
        Novavim.keys.right = true;
        break;
      case 40: // down arrow
        Novavim.keys.down = true;
        break;
      default:
        // Pass through non-recognized keys
        return
    }
    e.preventDefault();
  } // }}}

  Novavim.keyup = function(e) { // {{{
    switch(e.which) {
      case 37: // left arrow
        Novavim.keys.left = false;
        break;
      case 38: // up arrow
        Novavim.keys.up = false;
        break;
      case 39: // right arrow
        Novavim.keys.right = false;
        break;
      case 40: // down arrow
        Novavim.keys.down = false;
        break;
      default:
        // Pass through non-recognized keys
        return
    }
    e.preventDefault();
  } // }}}

  Novavim.clear = function(color) { // {{{
    color = color || "#000";

    var halfWidth = Novavim.width / 2,
        halfHeight = Novavim.height / 2;

    Novavim.view.fillStyle = color;
    Novavim.view.fillRect(-halfWidth, -halfHeight, Novavim.width, Novavim.height);
  }; // }}}

  // DRAWING FUNCTIONS
  Novavim.draw = { // {{{

    intoWorldCoords: function() { // {{{
      Novavim.view.translate(-1*Novavim.player.x, -1*Novavim.player.y);
    }, // }}}

    line: function(x1, y1, x2, y2, color) { // {{{
      color = color || "#f00";

      Novavim.view.save();
      Novavim.view.strokeStyle = color;
      Novavim.view.beginPath();
      Novavim.view.moveTo(x1, y1);
      Novavim.view.lineTo(x2, y2);
      Novavim.view.closePath();
      Novavim.view.stroke();
      Novavim.view.restore();
    }, // }}}

    // x,y is the center of the planet
    planet: function(x, y, color, name) { // {{{
      color = color || "#666";
      name = name || "";

      Novavim.view.save();
      Novavim.draw.intoWorldCoords();
      Novavim.view.translate(x, y);
      Novavim.view.strokeStyle = color;
      Novavim.view.fillStyle = "#000";
      Novavim.view.beginPath();
      Novavim.view.arc(0, 0, PLANET_RADIUS, 0, 2*Math.PI, true);
      Novavim.view.closePath();
      Novavim.view.fill();
      Novavim.view.stroke();
      Novavim.view.font = "20px Arial";
      Novavim.view.textAlign = "center";
      Novavim.view.fillStyle = "#fff";
      Novavim.view.transform(1, 0, 0, -1, 0, 0);
      Novavim.view.fillText(name, 0, 10);
      Novavim.view.restore();
    }, // }}}

    // x,y is the base of the ship
    ship: function(x, y, angle, color) { // {{{
      color = color || "#c2d";
      angle = angle || 0;

      Novavim.view.save();
      Novavim.draw.intoWorldCoords();
      Novavim.view.translate(x, y);
      Novavim.view.rotate(Math.PI / 2 + angle);
      Novavim.view.strokeStyle = color;
      Novavim.view.beginPath();

      Novavim.view.moveTo(0, 5);
      Novavim.view.lineTo(-6, -1);
      Novavim.view.lineTo(-10, 6);
      Novavim.view.lineTo(-8, -5);
      Novavim.view.lineTo(-4, -3);
      Novavim.view.lineTo(0, -15);
      Novavim.view.lineTo(4, -3);
      Novavim.view.lineTo(8, -5);
      Novavim.view.lineTo(10, 6);
      Novavim.view.lineTo(6, -1);
      Novavim.view.lineTo(0, 5);
      
      Novavim.view.closePath();
      Novavim.view.stroke();
      Novavim.view.restore();
    }, // }}}

    spacedust: function() { // {{{
      var dustRootX = Math.floor(Novavim.player.x / SPACEDUST_DENSITY),
          dustRootY = Math.floor(Novavim.player.y / SPACEDUST_DENSITY),
          spaceDustCountX = Math.floor(Novavim.width / 4 * 3 / SPACEDUST_DENSITY) + 1,
          spaceDustCountY = Math.floor(Novavim.height / 4 * 3 / SPACEDUST_DENSITY) + 1;

      if(!Novavim.spacedustRandom) {
        Novavim.spacedustRandom = [];
        for(var i=0; i < spaceDustCountX * spaceDustCountY; i++) {
          Novavim.spacedustRandom.push(Math.random());
        }
      }

      Novavim.view.save();
      Novavim.draw.intoWorldCoords();
      Novavim.view.fillStyle = "#999";
      for(var x = -spaceDustCountX; x <= spaceDustCountX; x++) {
        for(var y = -spaceDustCountY; y <= spaceDustCountY; y++) {
          var dustX = (dustRootX + x) * SPACEDUST_DENSITY,
              dustY = (dustRootY + y) * SPACEDUST_DENSITY,
              randomX = Math.abs((dustRootX + x) % spaceDustCountX),
              randomY = Math.abs((dustRootY + y) % spaceDustCountY),
              randomIndexX = randomX + (randomY * spaceDustCountX),
              randomIndexY = randomY + (randomX * spaceDustCountY),
              offsetX = (Novavim.width * Novavim.spacedustRandom[randomIndexX] - (Novavim.width / 2)) / 2,
              offsetY = (Novavim.height * Novavim.spacedustRandom[randomIndexY] - (Novavim.height / 2)) / 2;
          Novavim.view.fillRect(dustX + offsetX, dustY + offsetY, 1, 1);
        }
      }
      Novavim.view.restore();
    }, // }}}

    minimap: function() { // {{{
      var minimapX = (Novavim.width / 2) - MINIMAP_SIZE - 1,
          minimapY = MINIMAP_SIZE - (Novavim.height / 2) + 1;

      Novavim.view.save();
      Novavim.view.translate(minimapX, minimapY);

      Novavim.view.strokeStyle = "#fff";
      Novavim.view.fillStyle = "#000";
      Novavim.view.fillRect(-MINIMAP_SIZE, -MINIMAP_SIZE, 2*MINIMAP_SIZE, 2*MINIMAP_SIZE);
      Novavim.view.strokeRect(-MINIMAP_SIZE, -MINIMAP_SIZE, 2*MINIMAP_SIZE, 2*MINIMAP_SIZE);

      Novavim.view.fillStyle = "#444";
      $.each(Novavim.planets, function(idx, val) {
        var miniPlanetX = val.x / SIZE_OF_SPACE * MINIMAP_SIZE,
            miniPlanetY = val.y / SIZE_OF_SPACE * MINIMAP_SIZE;

        Novavim.view.beginPath();
        Novavim.view.arc(miniPlanetX, miniPlanetY, 3, 0, 2*Math.PI, true);
        Novavim.view.fill();
      });

      var miniPlayerX = Novavim.player.x / SIZE_OF_SPACE * MINIMAP_SIZE,
          miniPlayerY = Novavim.player.y / SIZE_OF_SPACE * MINIMAP_SIZE;

      if(Novavim.player.alive) {
        Novavim.view.fillStyle = "#c2d";
        Novavim.view.beginPath();
        Novavim.view.arc(miniPlayerX, miniPlayerY, 2, 0, 2*Math.PI, true);
        Novavim.view.fill();
      }

      Novavim.view.restore();
    } // }}}

  }; // }}}

})();

// vim:set foldmethod=marker et ts=2 sw=2 sts=2:

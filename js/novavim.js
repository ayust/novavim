Novavim = {};

(function() {

  var PLANET_RADIUS = 100;

  var ROTATION_SPEED = Math.PI / 60;
  var ACCELERATION = 0.2;
  var GRAVITY = 5000.0;
  var MAX_GRAVITY_ACCELERATION = 0.05;

  var LANDING_DISTANCE = 6;
  var LANDING_SPEED = 2.0;

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
    Novavim.world = new QuadTree({
      "x": 0,
      "y": 0,
      "width": Novavim.width,
      "height": Novavim.height
    });

    Novavim.planets = [ 
      {
        "x": 0,
        "y": 0
      }
    ];

    // Add a test object
    Novavim.world.insert(Novavim.planets[0]);

    Novavim.player = {
      "alive": true,
      "x": 0,
      "y": PLANET_RADIUS + LANDING_DISTANCE,
      "angle": Math.PI / 2,
      "speed": {
        "x": 0,
        "y": 0
      }
    };

    Novavim.keys = {
      "up": false,
      "down": false,
      "left": false,
      "right": false,
    };

    $("body").keydown(Novavim.keydown);
    $("body").keyup(Novavim.keyup);

    Novavim.run();
  }; // }}}

  Novavim.run = function() { // {{{
    Novavim.update();
    requestAnimationFrame(Novavim.run);
    Novavim.render();
  } // }}}

  Novavim.update = function() { // {{{
    // Movement
    Novavim.movement.rotation();
    Novavim.movement.gravity();
    Novavim.movement.landing();
    Novavim.movement.acceleration();
    Novavim.movement.collision();
    Novavim.player.x += Novavim.player.speed.x;
    Novavim.player.y += Novavim.player.speed.y;
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
        if(accel > 0.0001) {
          Novavim.player.speed.x += vecX * accel;
          Novavim.player.speed.y += vecY * accel;
        }
      });
    }, // }}}

    landing: function() { // {{{
      $.each(Novavim.planets, function(idx, val) {
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

    Novavim.draw.line(0, 0, 10, 10);

    $.each(Novavim.planets, function(idx, val) {
      Novavim.draw.planet(val.x, val.y);
    });

    var player = Novavim.player;
    if(player.alive) {
      Novavim.draw.ship(player.x, player.y, player.angle);
    }
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
    planet: function(x, y, color) { // {{{
      color = color || "#666";

      Novavim.view.save();
      Novavim.view.translate(x, y);
      Novavim.view.strokeStyle = color;
      Novavim.view.beginPath();
      Novavim.view.arc(0, 0, PLANET_RADIUS, 0, 2*Math.PI, true);
      Novavim.view.closePath();
      Novavim.view.stroke();
      Novavim.view.restore();
    }, // }}}

    // x,y is the base of the ship
    ship: function(x, y, angle, color) { // {{{
      color = color || "#c2d";
      angle = angle || 0;

      Novavim.view.save();
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
    } // }}}

  }; // }}}

})();

// vim:set foldmethod=marker et ts=2 sw=2 sts=2:

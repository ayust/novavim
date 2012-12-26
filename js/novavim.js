Novavim = {};

(function() {

  var PLANET_RADIUS = 100;

  var ROTATION_SPEED = Math.PI / 60;
  var MOVEMENT_SPEED = 3.0;

  // Must be called before anything else.
  Novavim.init = function(selector) { // {{{
    // selector should be for a canvas object.
    var elem = $(selector).first();
    Novavim.view = elem.get(0).getContext("2d");
    Novavim.width = elem.width();
    Novavim.height = elem.height();

    // Set up the world
    Novavim.world = new QuadTree({
      "x": 0,
      "y": 0,
      "width": Novavim.width,
      "height": Novavim.height
    });

    Novavim.planets = [ 
      {
        "x": 320,
        "y": 240
      }
    ];

    // Add a test object
    Novavim.world.insert(Novavim.planets[0]);

    Novavim.player = {
      "x": 320,
      "y": 134,
      "angle": 0
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
    // Rotation
    if(Novavim.keys.left && Novavim.keys.right) {
      // No rotation if both keys pressed.
    } else if(Novavim.keys.left) {
      Novavim.player.angle -= ROTATION_SPEED;
      if(Novavim.player.angle < 0) {
        Novavim.player.angle += 2*Math.PI;
      }
    } else if(Novavim.keys.right) {
      Novavim.player.angle += ROTATION_SPEED;
      if(Novavim.player.angle >= 2*Math.PI) {
        Novavim.player.angle -= 2*Math.PI;
      }
    }

    // Movement
    if(Novavim.keys.up) {
      Novavim.player.x += Math.sin(Novavim.player.angle) * MOVEMENT_SPEED;
      Novavim.player.y -= Math.cos(Novavim.player.angle) * MOVEMENT_SPEED;
    }
  }; // }}}

  Novavim.render = function() { // {{{
    Novavim.clear();

    $.each(Novavim.planets, function(idx, val) {
      Novavim.draw.planet(val.x, val.y);
    });

    var player = Novavim.player;
    Novavim.draw.ship(player.x, player.y, player.angle);
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

    Novavim.view.fillStyle = color;
    Novavim.view.fillRect(0, 0, Novavim.width, Novavim.height);
  }; // }}}

  // DRAWING FUNCTIONS
  Novavim.draw = { // {{{
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
      Novavim.view.rotate(angle);
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

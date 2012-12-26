Novavim = {};

(function() {

  var PLANET_RADIUS = 100;

  // Must be called before anything else.
  Novavim.init = function(selector) {
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

    Novavim.run();
  };

  Novavim.run = function() {
    Novavim.update();
    requestAnimationFrame(Novavim.run);
    Novavim.draw();
  }

  Novavim.update = function() {
  };

  Novavim.draw = function() {
    Novavim.clear();

    $.each(Novavim.planets, function(idx, val) {
      Novavim.draw_planet(val.x, val.y);
    });

    Novavim.draw_ship(320, 139);
  };

  // DRAWING FUNCTIONS
  Novavim.clear = function(color) {
    color = color || "#000";

    Novavim.view.fillStyle = color;
    Novavim.view.fillRect(0, 0, Novavim.width, Novavim.height);
  };

  // x,y is the center of the planet
  Novavim.draw_planet = function(x, y, color) {
    color = color || "#fff";

    Novavim.view.save();
    Novavim.view.translate(x, y);
    Novavim.view.strokeStyle = color;
    Novavim.view.beginPath();
    Novavim.view.arc(0, 0, PLANET_RADIUS, 0, 2*Math.PI, true);
    Novavim.view.closePath();
    Novavim.view.stroke();
    Novavim.view.restore();
  };

  // x,y is the base of the ship
  Novavim.draw_ship = function(x, y, angle, color) {
    color = color || "#c2d";
    angle = angle || 0;

    Novavim.view.save();
    Novavim.view.translate(x, y);
    Novavim.view.rotate(angle);
    Novavim.view.strokeStyle = color;
    Novavim.view.beginPath();

    Novavim.view.moveTo(0, 0);
    Novavim.view.lineTo(-6, -6);
    Novavim.view.lineTo(-10, 1);
    Novavim.view.lineTo(-8, -10);
    Novavim.view.lineTo(-4, -8);
    Novavim.view.lineTo(0, -20);
    Novavim.view.lineTo(4, -8);
    Novavim.view.lineTo(8, -10);
    Novavim.view.lineTo(10, 1);
    Novavim.view.lineTo(6, -6);
    Novavim.view.lineTo(0, 0);
    
    Novavim.view.closePath();
    Novavim.view.stroke();
    Novavim.view.restore();
  };


})();

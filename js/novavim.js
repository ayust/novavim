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
  };

  // DRAWING FUNCTIONS
  Novavim.clear = function(color) {
    var clearColor = color || "#000";
    Novavim.view.fillStyle = color;
    Novavim.view.fillRect(0, 0, Novavim.width, Novavim.height);
  };

  Novavim.draw_planet = function(x, y, color) {
    var planetColor = color || "#fff";
    Novavim.view.strokeStyle = planetColor;
    Novavim.view.beginPath();
    Novavim.view.arc(x, y, PLANET_RADIUS, 0, 2*Math.PI, true);
    Novavim.view.closePath();
    Novavim.view.stroke();
  };


})();

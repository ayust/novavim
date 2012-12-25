Novavim = {};

(function() {

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

    // Add a test object
    Novavim.world.insert({
      "x": Novavim.width / 2,
      "y": Novavim.height / 2
    });

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
  };

  // DRAWING FUNCTIONS
  Novavim.clear = function(color) {
    var clearColor = color || "#000";
    Novavim.view.fillStyle = color;
    Novavim.view.fillRect(0, 0, Novavim.width, Novavim.height);
  };

})();

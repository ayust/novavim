Novavim = {}

Novavim.init = function(selector) {
  var elem = $(selector);
  Novavim.view = {
    "canvas": elem,
    "height": elem.height(),
    "width": elem.width(),
  };
};

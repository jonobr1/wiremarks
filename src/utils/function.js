function debounce(func, timeout) {

  var timer;

  return function() {

    if (timer) {
      clearTimeout(timer);
    }

    var scope = this;
    var args = arguments;

    timer = setTimeout(function() {
      timer = null;
      func.apply(scope, args);
    }, timeout);

  };

}

export { debounce };
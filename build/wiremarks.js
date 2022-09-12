(() => {
  // src/index.js
  var Wiremarks =  window.Wiremarks = class {
    _instructions = null;
    constructor(instructions) {
      this.instructions = instructions;
    }
    get instructions() {
      return this._instructions;
    }
    set instructions(instructions) {
      this._instructions = instructions;
    }
  };
})();

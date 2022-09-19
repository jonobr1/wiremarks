import Two from 'two.js';
import { stringToColor } from './utils/color.js';
import { unit, dashes } from './constants.js';

export class Connection extends Two.Path {

  _name = 'connection';
  offset = new Two.Vector();

  constructor(source, target, name) {

    const points = [
      new Two.Anchor(),
      new Two.Anchor(),
      new Two.Anchor(),
      new Two.Anchor()
    ];

    super(points);

    const scope = this;
    this.update = update;
    this.source = source;
    this.target = target;

    this.curved = true;
    this.linewidth = unit * 0.015;
    this.noFill();
    this.stroke = 'black';
    this.dashes = dashes;
    this.join = 'round';
    this.cap = 'round';

    if (typeof name === 'string' && name.length > 0) {
      this.name = name;
    }

    this.offset.bind('change', update);
    source.position.bind('change', update);
    target.position.bind('change', update);

    requestAnimationFrame(update);

    function update() {
      points[0].copy(source.position).add(scope.offset);
      points[1].copy(source.position).add(scope.offset);
      points[1].x += source.width * 0.5;
      points[2].copy(target.position);
      points[2].x -= target.width * 0.5;
      points[3].copy(target.position);
    }

  }

  dispose() {
    const { source, target, update } = this;
    source.position.unbind('change', update);
    target.position.unbind('change', update);
    return this;
  }

  get name() {
    return this._name;
  }
  set name(name) {
    this._name = name;
    this.stroke = stringToColor(name);
  }

}
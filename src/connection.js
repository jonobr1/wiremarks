import Two from 'two.js';
import { stringToColor } from './utils/color.js';
import { unit, dashes, textStyles } from './constants.js';
import { Path } from 'two.js/src/path';

const HALF_PI = Math.PI * 0.5;

export class Connection extends Two.Group {

  _name = 'connection';
  offset = new Two.Vector();

  constructor(source, target, name) {

    const points = [
      new Two.Anchor(),
      new Two.Anchor(),
      new Two.Anchor(),
      new Two.Anchor()
    ];

    super();

    const scope = this;
    this.update = update;
    this.source = source;
    this.target = target;

    let label;
    const path = this.path = new Path(points);
    path.curved = true;
    path.linewidth = unit * 0.015;
    path.noFill();
    path.stroke = 'black';
    path.dashes = dashes;
    path.join = 'round';
    path.cap = 'round';

    if (typeof name === 'string' && name.length > 0) {
      label = this.label = new Two.Text(name, 0, 0, textStyles);
      label.size *= 0.75;
      this.name = name;
      this.add(label);
    }

    this.offset.bind('change', update);
    source.position.bind('change', update);
    target.position.bind('change', update);

    this.add(path);

    requestAnimationFrame(update);

    function update() {

      points[0].copy(source.position).add(scope.offset);
      points[1].copy(source.position).add(scope.offset);
      points[1].x += source.width * 0.5;
      points[2].copy(target.position);
      points[2].x -= target.width * 0.5;
      points[3].copy(target.position);

      if (label) {

        const a = path.getPointAt(0.45);
        const b = path.getPointAt(0.55);
        const angle = Two.Vector.angleBetween(b, a);

        const ox = label.size * Math.cos(angle - HALF_PI);
        const oy = label.size * Math.sin(angle - HALF_PI);

        label.position.x = 0.5 * (b.x - a.x) + a.x + ox;
        label.position.y = 0.5 * (b.y - a.y) + a.y + oy;
        label.rotation = angle;

      }

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
    const color = stringToColor(name);
    this.label.fill = this.path.stroke = color;
  }

}
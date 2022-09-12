import Two from 'two.js';
import { Connection } from './connection.js';
import { dilute } from './utils/color.js';
import { unit } from './constants.js';

const textStyles = {
  family: '"Inter", sans-serif',
  size: unit * 0.1,
  leading: unit * 0.12,
  fill: 'white'
};

export class Entity extends Two.Group {

  connections = [];

  constructor(name) {

    super();

    const shape = new Two.RoundedRectangle(0, 0, unit * 1.5, unit, 8);
    const text = new Two.Text(name, 0, 0, textStyles);

    shape.noStroke();

    const alpha = 0.66;
    const r = Math.random() * 255;
    const g = Math.random() * 255;
    const b = Math.random() * 255;

    const dr = dilute(r, alpha);
    const dg = dilute(g, alpha);
    const db = dilute(b, alpha);

    shape.fill = `rgb(${dr}, ${dg}, ${db})`;
    shape.stroke = `rgb(${r}, ${g}, ${b})`;
    shape.linewidth = unit * 0.015;

    if ((r + g + b) / 3 >= 255 * 0.4) {
      text.fill = 'black';
    }

    this.add(shape, text);

    Entity.Instances.push(this);

  }

  static Instances = [];

  static getEntityByName(name) {
    for (let i = 0; i < Entity.Instances.length; i++) {
      const entity = Entity.Instances[i];
      if (entity.name === name) {
        return entity;
      }
    }
    return null;
  }

  static getInstanceIndex(entity) {
    for (let i = 0; i < Entity.Instances.length; i++) {
      const e = Entity.Instances[i];
      if (e.id === entity.id) {
        return i;
      }
    }
    return - 1;
  }

  connect(name, means) {

    const target = Entity.getEntityByName(name);

    if (!means) {
      means = 'connection';
    }

    if (target) {
      let isConnected = false;
      for (let i = 0; i < this.connections.length; i++) {
        const c = this.connections[i];
        if (c.target.id === target.id && means === c.name) {
          isConnected = true;
          break;
        }
      }
      if (!isConnected) {
        const connection = new Connection(this, target, means);
        const { connections } = this.parent;
        connections.add(connection);
        this.connections.push(connection);
        for (let i = 0; i < this.connections.length; i++) {
          const c = this.connections[i];
          const pct = (i + 0.5) / this.connections.length;
          const y = pct * this.height - this.height * 0.5;
          c.offset.y = y;
        }
      }
    } else {
      console.warn('Entity: no target found.');
    };

    return this;

  }

  remove() {
    super.remove.apply(this, arguments);
    for (let i = 0; i < this.connections.length; i++) {
      const c = this.connections[i];
      c.remove().dispose();
    }
    const index = Entity.getInstanceIndex(this);
    if (index >= 0) {
      Entity.Instances.splice(index, 1);
    }
    return this;
  }

  dispose() {

  }

  get width() {
    return this.children[0].width;
  }
  get height() {
    return this.children[0].height;
  }
  get name() {
    return this.children[1].value;
  }

}
import Two from 'two.js';
import { Entity } from './entity.js';
import { unit } from './constants.js';

const emptyMatch = ['', ''];

export class Wiremark extends Two.Group {

  _instructions = null;
  entities = {};

  constructor(instructions) {

    super();

    this.instructions = instructions;
    this.connections = new Two.Group();
    this.connections.name = 'connections';

    this.add(this.connections);

  }

  /**
   * @function
   * @name Wiremark#layout
   * @description Parse instructions and layout new wireframe graph.
   */
  layout() {

    const { entities, instructions } = this;

    if (typeof instructions !== 'string') {
      return;
    }

    const state = {};
    const lines = instructions.split(/\n/i);

    for (let i = 0; i < lines.length; i++) {

      const line = lines[i];
      if (line.length <= 0) { continue }

      const producer = (line.match(/^([^\-]+)[\-$]/) || emptyMatch)[1].trim();
      const currency = (line.match(/\[([^\]]+)\]/) || emptyMatch)[1].trim();
      const consumer = (line.match(/\-\>(.+)$/) || emptyMatch)[1].trim();

      const producerExists = producer.length > 0;
      const currencyExists = currency.length > 0;
      const consumerExists = consumer.length > 0;

      if (!(producer in entities)) {
        const entity = entities[producer] = new Entity(producer);
        entity.visible = false;
        this.add(entity);
      }
      if (!(consumer in entities)) {
        const entity = entities[consumer] = new Entity(consumer);
        entity.visible = false;
        this.add(entity);
      }

      if (producerExists && consumerExists) {
        entities[producer].connect(consumer, currency);
      }

      if (producerExists) state[producer] = true;
      if (currencyExists) state[currency] = true;
      if (consumerExists) state[consumer] = true;

    }

    let isDeleting = false;
    let k = 0;
    while (k < this.children.length) {
      const child = this.children[k];
      const name = child.name;
      if (name in state) {
        child.visible = true;
        child.position.x = k * (child.width + unit * 0.25);
        child.position.y = 2 * (k % 2) * child.height + child.height;
        k++;
        continue;
      } else if (!child.name.includes('connection')) {
        child.remove().dispose();
        delete entities[name];
        isDeleting = true;
      } else {
        k++;
      }
    }

    if (isDeleting) {
      for (let i = 0; i < this.connections.children.length; i++) {
        const c = this.connections.children[i];
        if (!c.source.parent || !c.target.parent) {
          c.remove().dispose();
        }
      }
    }

    return this;

  }

  update(timeDelta) {

    for (let i = 0; i < this.connections.children.length; i++) {
      let child = this.connections.children[i];
      child.dashes.offset -= timeDelta / 10;
    }

    return this;

  }

  dispose() {

  }

  //

  get instructions() {
    return this._instructions;
  }
  set instructions(instructions) {
    this._instructions = instructions;
    this.layout();
  }

}
import Two from 'two.js';
import { Entity } from './entity.js';
import { unit, dashes } from './constants.js';

const emptyMatch = ['', ''];

export class Wiremark extends Two.Group {

  _instructions = null;

  constructor(instructions) {

    super();

    this.isWiremark = true;
    this.instructions = instructions;

    this.connections = new Two.Group();
    this.connections.name = 'connections';

    this.entities = new Two.Group();
    this.entities.name = 'entities';
    this.entities.registry = {};

    this.add(this.connections, this.entities);

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

    const state = { entities: [], connections: {} };
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

      if (producerExists) {
        if (state.entities.indexOf(producer) < 0) {
          state.entities.push(producer);
        }
      }
      if (consumerExists) {
        if (state.entities.indexOf(consumer) < 0) {
          state.entities.push(consumer);
        }
      }

      if (producerExists && consumerExists) {
        if (!(producer in state.connections)) {
          state.connections[producer] = [];
        }
        state.connections[producer].push({
          name: currencyExists ? currency : 'connection',
          target: consumer
        });
      }

    }

    const length = Math.max(entities.children.length,
      state.entities.length);

    // TODO: Prune and remove entities.registry[name]
    // that don't exist in the state anymore.

    for (let i = 0; i < length; i++) {

      const name = state.entities[i];
      let entity = entities.children[i];

      if (entity) {
        if (state.entities.indexOf(entity.name) < 0) {
          if (typeof name === 'undefined') {
            // Too many entities, delete the extras!
            delete entities.registry[entity.name];
            entity.remove().dispose();
            entity = null;
          } else {
            entity.name = name;
            entities.registry[name] = entity;
          }
        }
      } else if (typeof name !== 'undefined') {
        entity = new Entity(name);
        entity.position.x = i * entity.width + unit * 0.25;
        entity.position.y = 2 * (i % 2) * entity.height + entity.height;
        entities.add(entity);
        entities.registry[name] = entity;
      }

    }

    for (let i = 0; i < entities.children.length; i++) {

      const entity = entities.children[i];
      const connections = state.connections[entity.name];

      entity.reset();

      if (typeof connections !== 'undefined' && connections.length > 0) {
        for (let j = 0; j < connections.length; j++) {
          const { name, target } = connections[j];
          entity.connect(target, name);
        }

      }
    }

    return this;

  }

  update(timeDelta) {

    dashes.offset -= timeDelta / 10;

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
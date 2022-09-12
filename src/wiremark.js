import React, { useEffect, useRef } from 'react';
import Two from 'two.js';
import { ZUI } from 'two.js/extras/jsm/zui.js';
import { dilute } from './utils/color.js';

const emptyMatch = ['', ''];
const textStyles = {
  family: 'Inter, sans-serif',
  size: 17,
  leading: 20,
  fill: 'white'
};

class Connection extends Two.Path {

  name = 'connection';

  constructor(producer, consumer, name) {

    super([producer.position, consumer.position]);

    this.curved = true;
    this.linewidth = 3;
    this.noFill();
    this.stroke = 'black';

    if (typeof name === 'string' && name.length > 0) {
      this.name = name;
    }

  }

}

class Entity extends Two.Group {

  outputs = [];

  constructor(name, shapeType) {

    super();

    const shape = new Two.RoundedRectangle(0, 0, 300, 200, 8);
    const text = new Two.Text(name, 0, 0, textStyles);

    shape.noStroke();
    const r = Math.random() * 255;
    const g = Math.random() * 255;
    const b = Math.random() * 255;
    shape.fill = `rgb(${dilute(r, 0.66)}, ${dilute(g, 0.66)}, ${dilute(b, 0.66)})`;
    shape.stroke = `rgb(${r}, ${g}, ${b})`;
    shape.linewidth = 3;

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

    if (target) {
      let isConnected = false;
      for (let i = 0; i < this.outputs.length; i++) {
        const c = this.outputs[i];
        if (c.id === target.id) {
          isConnected = true;
          break;
        }
      }
      if (!isConnected) {
        const connection = new Connection(this, target, means);
        const { connections } = this.parent;
        connections.add(connection);
        this.outputs.push(target);
      }
    } else {
      console.warn('Entity: no target found.');
    };

    return this;

  }

  remove() {
    super.remove.apply(this, arguments);
    const index = Entity.getInstanceIndex(this);
    if (index >= 0) {
      Entity.Instances.splice(index, 1);
    }
    return this;
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

class Wiremark extends Two.Group {

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

    let k = 0;
    while (k < this.children.length) {
      const child = this.children[k];
      const name = child.name;
      if (name in state) {
        child.visible = true;
        child.position.x = k * (child.width + 50);
        child.position.y = (k % 2) * child.height - child.height / 2 + 300;
        k++;
        continue;
      } else if (!child.name.includes('connection')) {
        child.remove();
      } else {
        k++;
      }
    }

    return this;

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

function Component(props) {

  const refs = useRef({});
  const domElement = useRef();

  useEffect(mount, []);
  useEffect(update, [props.instructions]);
  useEffect(resize, [props.width, props.height]);

  function mount() {

    const two = new Two({
      autostart: true
    }).appendTo(domElement.current);

    const wiremark = new Wiremark();
    const { zui, events } = addZUI(wiremark);

    two.add(wiremark);

    refs.current.two = two;
    refs.current.zui = zui;
    refs.current.wiremark = wiremark;

    return unmount;

    function unmount() {
      for (let i = 0; i < events.length; i++) {
        const { domElement, names, handler } = events[i];
        for (let j = 0; j < names.length; j++) {
          const name = names[j];
          domElement.removeEventListener(name, handler, false);
        }
      }
      wiremark.remove();
    }

    function addZUI(stage) {

      const domElement = two.renderer.domElement;
      const zui = new ZUI(stage);
      const mouse = new Two.Vector();
      let touches = {};
      let distance = 0;
  
      zui.addLimits(0.06, 8);
  
      domElement.addEventListener('mousedown', mousedown, false);
      domElement.addEventListener('mousewheel', mousewheel, false);
      domElement.addEventListener('wheel', mousewheel, false);
  
      domElement.addEventListener('touchstart', touchstart, false);
      domElement.addEventListener('touchmove', touchmove, false);
      domElement.addEventListener('touchend', touchend, false);
      domElement.addEventListener('touchcancel', touchend, false);
  
      return {
        zui,
        events: [
          {
            domElement,
            names: ['mousedown'],
            handler: mousedown
          },
          {
            domElement,
            names: ['mousewheel', 'wheel'],
            handler: mousewheel
          },
          {
            domElement,
            names: ['touchstart'],
            handler: touchstart
          },
          {
            domElement,
            names: ['touchmove'],
            handler: touchmove
          },
          {
            domElement,
            names: ['touchend', 'touchcancel'],
            handler: touchend
          }
        ]
      };

      function mousedown(e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        window.addEventListener('mousemove', mousemove, false);
        window.addEventListener('mouseup', mouseup, false);
      }
  
      function mousemove(e) {
        var dx = e.clientX - mouse.x;
        var dy = e.clientY - mouse.y;
        zui.translateSurface(dx, dy);
        mouse.set(e.clientX, e.clientY);
      }
  
      function mouseup(e) {
        window.removeEventListener('mousemove', mousemove, false);
        window.removeEventListener('mouseup', mouseup, false);
      }
  
      function mousewheel(e) {
        var dy = (e.wheelDeltaY || - e.deltaY) / 1000;
        zui.zoomBy(dy, e.clientX, e.clientY);
      }
  
      function touchstart(e) {
        switch (e.touches.length) {
          case 2:
            pinchstart(e);
            break;
          case 1:
            panstart(e)
            break;
        }
      }
  
      function touchmove(e) {
        switch (e.touches.length) {
          case 2:
            pinchmove(e);
            break;
          case 1:
            panmove(e)
            break;
        }
      }
  
      function touchend(e) {
        touches = {};
        var touch = e.touches[ 0 ];
        if (touch) {  // Pass through for panning after pinching
          mouse.x = touch.clientX;
          mouse.y = touch.clientY;
        }
      }
  
      function panstart(e) {
        var touch = e.touches[ 0 ];
        mouse.x = touch.clientX;
        mouse.y = touch.clientY;
      }
  
      function panmove(e) {
        var touch = e.touches[ 0 ];
        var dx = touch.clientX - mouse.x;
        var dy = touch.clientY - mouse.y;
        zui.translateSurface(dx, dy);
        mouse.set(touch.clientX, touch.clientY);
      }
  
      function pinchstart(e) {
        for (var i = 0; i < e.touches.length; i++) {
          var touch = e.touches[ i ];
          touches[ touch.identifier ] = touch;
        }
        var a = touches[ 0 ];
        var b = touches[ 1 ];
        var dx = b.clientX - a.clientX;
        var dy = b.clientY - a.clientY;
        distance = Math.sqrt(dx * dx + dy * dy);
        mouse.x = dx / 2 + a.clientX;
        mouse.y = dy / 2 + a.clientY;
      }
  
      function pinchmove(e) {
        for (var i = 0; i < e.touches.length; i++) {
          var touch = e.touches[ i ];
          touches[ touch.identifier ] = touch;
        }
        var a = touches[ 0 ];
        var b = touches[ 1 ];
        var dx = b.clientX - a.clientX;
        var dy = b.clientY - a.clientY;
        var d = Math.sqrt(dx * dx + dy * dy);
        var delta = d - distance;
        zui.zoomBy(delta / 250, mouse.x, mouse.y);
        distance = d;
      }
    
  }

  }

  function update() {
    const { wiremark } = refs.current;
    wiremark.instructions = props.instructions;
  }

  function resize() {
    const { two } = refs.current;
    if (!two) {
      return;
    }
    two.renderer.setSize(props.width, props.height);
  }

  return <div ref={ domElement } className="wireframe" />;

}

export { Entity, Wiremark, Component, Connection }
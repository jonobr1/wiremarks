import React, { useEffect, useRef, useState } from 'react';
import Two from 'two.js';
import { ZUI } from 'two.js/extras/jsm/zui.js';
import { dilute, stringToColor } from './utils/color.js';

const unit = 200;
const emptyMatch = ['', ''];
const textStyles = {
  family: '"Inter", sans-serif',
  size: unit * 0.085,
  leading: unit * 0.1,
  fill: 'white'
};

class Connection extends Two.Path {

  _name = 'connection';

  constructor(source, target, name) {

    const points = [
      new Two.Anchor(),
      new Two.Anchor(),
      new Two.Anchor(),
      new Two.Anchor()
    ];

    super(points);

    this.update = update;
    this.source = source;
    this.target = target;

    this.curved = true;
    this.linewidth = 3;
    this.noFill();
    this.stroke = 'black';

    if (typeof name === 'string' && name.length > 0) {
      this.name = name;
    }

    source.position.bind(Two.Events.change, update);
    target.position.bind(Two.Events.change, update);
    requestAnimationFrame(update);

    function update() {
      points[0].copy(source.position);
      points[1].copy(source.position);
      points[1].x += source.width * 0.5;
      points[2].copy(target.position);
      points[2].x -= target.width * 0.5;
      points[3].copy(target.position);
    }

  }

  dispose() {
    const { source, target, update } = this;
    source.position.unbind(Two.Events.change, update);
    target.position.unbind(Two.Events.change, update);
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

class Entity extends Two.Group {

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
      for (let i = 0; i < this.connections.length; i++) {
        const c = this.connections[i];
        if (c.target.id === target.id) {
          isConnected = true;
          break;
        }
      }
      if (!isConnected) {
        const connection = new Connection(this, target, means);
        const { connections } = this.parent;
        connections.add(connection);
        this.connections.push(connection);
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
      if (currencyExists) {
        for (let j = 0; j < entities[producer].connections.length; j++) {
          const c = entities[producer].connections[j];
          if (c.target.name === consumer) {
            c.name = currency;
          }
        }
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

function Component(props) {

  const refs = useRef({});
  const domElement = useRef();
  const [grabbing, setGrabbing] = useState('');

  useEffect(mount, []);
  useEffect(update, [props.instructions]);
  useEffect(resize, [props.width, props.height]);

  function mount() {

    const two = new Two({
      type: Two.Types.canvas,
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
      wiremark.remove().dispose();
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
        setGrabbing('grabbing');
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
        setGrabbing('');
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
        setGrabbing('');
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
        setGrabbing('grabbing');
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

  return (
    <div ref={ domElement } className={ ['wireframe', grabbing].join(' ') } />
  );

}

export { Entity, Wiremark, Component, Connection }
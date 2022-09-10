import React, { useEffect, useRef } from 'react';
import Two from 'two.js';
import { ZUI } from 'two.js/extras/jsm/zui.js';

const emptyMatch = ['', ''];
const textStyles = {
  family: 'Inter, sans-serif',
  size: 17,
  leading: 20,
  fill: 'white'
};

class Entity extends Two.Group {

  constructor(name) {

    super();

    const rect = new Two.RoundedRectangle(0, 0, 350, 200, 8);
    const text = new Two.Text(name, 0, 0, textStyles);

    rect.noStroke();
    const r = Math.random() * 255;
    const g = Math.random() * 255;
    const b = Math.random() * 255;
    rect.fill = `rgba(${r}, ${g}, ${b}, 0.66)`;
    rect.stroke = `rgb(${r}, ${g}, ${b})`;
    rect.linewidth = 3;

    if ((r + g + b) / 3 >= 255 * 0.5) {
      text.fill = 'black';
    }

    this.add(rect, text);

  }

  get width() {
    return this.children[0].width;
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

      if (producer.length > 0) state[producer] = true;
      if (currency.length > 0) state[currency] = true;
      if (consumer.length > 0) state[consumer] = true;

    }

    let k = 0;
    while (k < this.children.length) {
      const child = this.children[k];
      const name = child.name;
      if (name in state) {
        child.visible = true;
        child.position.x = k * (child.width + 50);
        k++;
        continue;
      }
      child.remove();
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

export { Wiremark, Component }
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// src/wiremark.js
import Two3 from "two.js";

// src/entity.js
import Two2 from "two.js";

// src/connection.js
import Two from "two.js";

// src/utils/color.js
function dilute(component, amount) {
  return lerp(component, 255, amount);
}
function lerp(source, target, t) {
  return (target - source) * t + source;
}
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = hash >> i * 8 & 255;
    color += ("00" + value.toString(16)).substr(-2);
  }
  return color;
}

// src/constants.js
var unit = 200;
var dashes = [unit * 0.03, unit * 0.045];
dashes.offset = 0;
var textStyles = {
  family: '"Inter", sans-serif',
  size: unit * 0.1,
  leading: unit * 0.12,
  fill: "white"
};

// src/connection.js
import { Path } from "two.js/src/path";
var HALF_PI = Math.PI * 0.5;
var Connection = class extends Two.Group {
  _name = "connection";
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
    path.stroke = "black";
    path.dashes = dashes;
    path.join = "round";
    path.cap = "round";
    if (typeof name === "string" && name.length > 0) {
      label = this.label = new Two.Text(name, 0, 0, textStyles);
      label.size *= 0.75;
      this.name = name;
      this.add(label);
    }
    this.offset.bind("change", update);
    source.position.bind("change", update);
    target.position.bind("change", update);
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
    source.position.unbind("change", update);
    target.position.unbind("change", update);
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
};

// src/entity.js
var _Entity = class extends Two2.Group {
  connections = [];
  constructor(name) {
    super();
    const shape = new Two2.RoundedRectangle(0, 0, unit * 1.5, unit, 8);
    const text = new Two2.Text(name, 0, 0, textStyles);
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
      text.fill = "black";
    }
    this.add(shape, text);
    _Entity.Instances.push(this);
  }
  static getEntityByName(name) {
    for (let i = 0; i < _Entity.Instances.length; i++) {
      const entity = _Entity.Instances[i];
      if (entity.name === name) {
        return entity;
      }
    }
    return null;
  }
  static getInstanceIndex(entity) {
    for (let i = 0; i < _Entity.Instances.length; i++) {
      const e = _Entity.Instances[i];
      if (e.id === entity.id) {
        return i;
      }
    }
    return -1;
  }
  static getRoot(item) {
    while (item.parent && !item.isWiremark) {
      item = item.parent;
    }
    return item;
  }
  connect(name, means) {
    const target = _Entity.getEntityByName(name);
    if (!means) {
      means = "connection";
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
        const { connections } = _Entity.getRoot(this);
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
      console.warn("Entity: no target found.");
    }
    ;
    return this;
  }
  reset() {
    for (let i = 0; i < this.connections.length; i++) {
      this.connections[i].remove().dispose();
    }
    this.connections.length = 0;
    return this;
  }
  remove() {
    super.remove.apply(this, arguments);
    for (let i = 0; i < this.connections.length; i++) {
      const c = this.connections[i];
      c.remove().dispose();
    }
    const index = _Entity.getInstanceIndex(this);
    if (index >= 0) {
      _Entity.Instances.splice(index, 1);
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
  set name(name) {
    this.children[1].value = name;
  }
};
var Entity = _Entity;
__publicField(Entity, "Instances", []);

// src/wiremark.js
var emptyMatch = ["", ""];
var Wiremark = class extends Two3.Group {
  _instructions = null;
  constructor(instructions) {
    super();
    this.isWiremark = true;
    this.instructions = instructions;
    this.connections = new Two3.Group();
    this.connections.name = "connections";
    this.entities = new Two3.Group();
    this.entities.name = "entities";
    this.entities.registry = {};
    this.add(this.connections, this.entities);
  }
  layout() {
    const { entities, instructions } = this;
    if (typeof instructions !== "string") {
      return;
    }
    const state = { entities: [], connections: {} };
    const lines = instructions.split(/\n/i);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.length <= 0) {
        continue;
      }
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
          name: currencyExists ? currency : "connection",
          target: consumer
        });
      }
    }
    const length = Math.max(
      entities.children.length,
      state.entities.length
    );
    for (let i = 0; i < length; i++) {
      const name = state.entities[i];
      let entity = entities.children[i];
      if (entity) {
        if (state.entities.indexOf(entity.name) < 0) {
          if (typeof name === "undefined") {
            delete entities.registry[entity.name];
            entity.remove().dispose();
            entity = null;
          } else {
            entity.name = name;
            entities.registry[name] = entity;
          }
        }
      } else if (typeof name !== "undefined") {
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
      if (typeof connections !== "undefined" && connections.length > 0) {
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
  get instructions() {
    return this._instructions;
  }
  set instructions(instructions) {
    this._instructions = instructions;
    this.layout();
  }
};

// src/component.js
import React, { useEffect, useRef, useState } from "react";
import Two4 from "two.js";
import { ZUI } from "two.js/extras/jsm/zui.js";
function Component(props) {
  const refs = useRef({});
  const domElement = useRef();
  const [grabbing, setGrabbing] = useState("");
  useEffect(mount, []);
  useEffect(update, [props.instructions]);
  useEffect(resize, [props.width, props.height]);
  function mount() {
    const two = new Two4({
      type: Two4.Types.canvas,
      autostart: true
    }).appendTo(domElement.current);
    const wiremark = new Wiremark();
    const { zui, events } = addZUI(wiremark);
    two.add(wiremark);
    refs.current.two = two;
    refs.current.zui = zui;
    refs.current.wiremark = wiremark;
    two.bind("update", update2);
    return unmount;
    function update2(frameCount, timeDelta) {
      wiremark.update(timeDelta);
    }
    function unmount() {
      for (let i = 0; i < events.length; i++) {
        const { domElement: domElement2, names, handler } = events[i];
        for (let j = 0; j < names.length; j++) {
          const name = names[j];
          domElement2.removeEventListener(name, handler, false);
        }
      }
      wiremark.remove().dispose();
      two.pause();
    }
    function addZUI(stage) {
      const domElement2 = two.renderer.domElement;
      const zui2 = new ZUI(stage);
      const mouse = new Two4.Vector();
      let touches = {};
      let moving = null;
      let distance = 0;
      zui2.addLimits(0.06, 8);
      if (window.navigator.maxTouchPoints <= 0) {
        domElement2.addEventListener("mousedown", mousedown, false);
        domElement2.addEventListener("mousewheel", mousewheel, false);
        domElement2.addEventListener("wheel", mousewheel, false);
      } else {
        domElement2.addEventListener("touchstart", touchstart, { passive: false });
        domElement2.addEventListener("touchmove", touchmove, { passive: false });
        domElement2.addEventListener("touchend", touchend, { passive: false });
        domElement2.addEventListener("touchcancel", touchend, { passive: false });
      }
      return {
        zui: zui2,
        events: [
          {
            domElement: domElement2,
            names: ["mousedown"],
            handler: mousedown
          },
          {
            domElement: domElement2,
            names: ["mousewheel", "wheel"],
            handler: mousewheel
          },
          {
            domElement: domElement2,
            names: ["touchstart"],
            handler: touchstart
          },
          {
            domElement: domElement2,
            names: ["touchmove"],
            handler: touchmove
          },
          {
            domElement: domElement2,
            names: ["touchend", "touchcancel"],
            handler: touchend
          }
        ]
      };
      function mousedown(e) {
        setGrabbing("grabbing");
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        const { registry } = wiremark.entities;
        for (let name in registry) {
          const child = registry[name];
          const rect = child.getBoundingClientRect();
          if (mouse.x > rect.left && mouse.x < rect.right && mouse.y > rect.top && mouse.y < rect.bottom) {
            moving = child;
            setGrabbing("dragging");
            break;
          }
        }
        window.addEventListener("mousemove", mousemove, false);
        window.addEventListener("mouseup", mouseup, false);
      }
      function mousemove(e) {
        var dx = e.clientX - mouse.x;
        var dy = e.clientY - mouse.y;
        if (moving) {
          moving.position.x += dx / zui2.scale;
          moving.position.y += dy / zui2.scale;
        } else {
          zui2.translateSurface(dx, dy);
        }
        mouse.set(e.clientX, e.clientY);
      }
      function mouseup(e) {
        setGrabbing("");
        moving = null;
        window.removeEventListener("mousemove", mousemove, false);
        window.removeEventListener("mouseup", mouseup, false);
      }
      function mousewheel(e) {
        var dy = (e.wheelDeltaY || -e.deltaY) / 1e3;
        zui2.zoomBy(dy, e.clientX, e.clientY);
      }
      function touchstart(e) {
        e.preventDefault();
        switch (e.touches.length) {
          case 2:
            pinchstart(e);
            break;
          case 1:
            panstart(e);
            break;
        }
      }
      function touchmove(e) {
        e.preventDefault();
        switch (e.touches.length) {
          case 2:
            pinchmove(e);
            break;
          case 1:
            panmove(e);
            break;
        }
      }
      function touchend(e) {
        e.preventDefault();
        setGrabbing("");
        moving = null;
        for (let identifier in touches) {
          let isTouching = false;
          for (let i = 0; i < e.touches.length; i++) {
            const touch2 = e.touches[i];
            if (identifier === touch2.identifier) {
              isTouching = true;
            }
          }
          if (!isTouching) {
            delete touches[identifier];
          }
        }
        var touch = e.touches[0];
        if (touch) {
          mouse.x = touch.clientX;
          mouse.y = touch.clientY;
        }
      }
      function panstart(e) {
        var touch = e.touches[0];
        mouse.x = touch.clientX;
        mouse.y = touch.clientY;
        const { registry } = wiremark.entities;
        for (let name in registry) {
          const child = registry[name];
          const rect = child.getBoundingClientRect();
          if (mouse.x > rect.left && mouse.x < rect.right && mouse.y > rect.top && mouse.y < rect.bottom) {
            moving = child;
            setGrabbing("dragging");
            break;
          }
        }
        setGrabbing("grabbing");
      }
      function panmove(e) {
        var touch = e.touches[0];
        var dx = touch.clientX - mouse.x;
        var dy = touch.clientY - mouse.y;
        if (moving) {
          moving.position.x += dx / zui2.scale;
          moving.position.y += dy / zui2.scale;
        } else {
          zui2.translateSurface(dx, dy);
        }
        mouse.set(touch.clientX, touch.clientY);
      }
      function pinchstart(e) {
        for (var i = 0; i < e.touches.length; i++) {
          var touch = e.touches[i];
          touches[touch.identifier] = touch;
        }
        var a = e.touches[0];
        var b = e.touches[1];
        var dx = b.clientX - a.clientX;
        var dy = b.clientY - a.clientY;
        distance = Math.sqrt(dx * dx + dy * dy);
        mouse.x = dx / 2 + a.clientX;
        mouse.y = dy / 2 + a.clientY;
      }
      function pinchmove(e) {
        for (var i = 0; i < e.touches.length; i++) {
          var touch = e.touches[i];
          touches[touch.identifier] = touch;
        }
        var a = e.touches[0];
        var b = e.touches[1];
        var dx = b.clientX - a.clientX;
        var dy = b.clientY - a.clientY;
        var d = Math.sqrt(dx * dx + dy * dy);
        var delta = d - distance;
        zui2.zoomBy(delta / 250, mouse.x, mouse.y);
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
  return /* @__PURE__ */ React.createElement("div", {
    ref: domElement,
    className: ["wireframe", grabbing].join(" ")
  });
}
export {
  Component,
  Connection,
  Entity,
  Wiremark
};

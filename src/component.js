import React, { useEffect, useRef, useState } from 'react';
import Two from 'two.js';
import { Wiremark } from './wiremark.js';
import { ZUI } from 'two.js/extras/jsm/zui.js';

export function Component(props) {

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

    two.bind('update', update);

    return unmount;

    function update(frameCount, timeDelta) {
      wiremark.update(timeDelta);
    }

    function unmount() {
      for (let i = 0; i < events.length; i++) {
        const { domElement, names, handler } = events[i];
        for (let j = 0; j < names.length; j++) {
          const name = names[j];
          domElement.removeEventListener(name, handler, false);
        }
      }
      wiremark.remove().dispose();
      two.pause();
    }

    function addZUI(stage) {

      const domElement = two.renderer.domElement;
      const zui = new ZUI(stage);
      const mouse = new Two.Vector();
      let touches = {};
      let moving = null;
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
        for (let name in wiremark.entities) {
          const child = wiremark.entities[name];
          const rect = child.getBoundingClientRect();
          if (mouse.x > rect.left && mouse.x < rect.right
            && mouse.y > rect.top && mouse.y < rect.bottom) {
              moving = child;
              setGrabbing('dragging');
              break;
          }
        }
        window.addEventListener('mousemove', mousemove, false);
        window.addEventListener('mouseup', mouseup, false);
      }
  
      function mousemove(e) {
        var dx = e.clientX - mouse.x;
        var dy = e.clientY - mouse.y;
        if (moving) {
          moving.position.x += dx / zui.scale;
          moving.position.y += dy / zui.scale;
        } else {
          zui.translateSurface(dx, dy);
        }
        mouse.set(e.clientX, e.clientY);
      }
  
      function mouseup(e) {
        setGrabbing('');
        moving = null;
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
        moving = null;
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
        for (let name in wiremark.entities) {
          const child = wiremark.entities[name];
          const rect = child.getBoundingClientRect();
          if (mouse.x > rect.left && mouse.x < rect.right
            && mouse.y > rect.top && mouse.y < rect.bottom) {
              moving = child;
              setGrabbing('dragging');
              break;
          }
        }
        setGrabbing('grabbing');
      }
  
      function panmove(e) {
        var touch = e.touches[ 0 ];
        var dx = touch.clientX - mouse.x;
        var dy = touch.clientY - mouse.y;
        if (moving) {
          moving.position.x += dx / zui.scale;
          moving.position.y += dy / zui.scale;
        } else {
          zui.translateSurface(dx, dy);
        }
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
import React, { useEffect, useRef, useState } from 'react';
import { Component as Wiremark } from './component.js';

const defaultPrompt = `
# Welcome!

# Wiremarks is a simple interface to compose
# wireframes and organizational structures
# through text. Connect things with an arrow
# like so:
# Grandmother -> Mother

# Each line of text is a connection.
# Mother -> Daughter

# And you can label connections by using
# brackets like so:
# Grid -[Electricity]-> Home

# Lastly, starting a line with a hashtag
# makes your text a comment and will not
# be compiled into any connections.
# Remove a hashtag above to see the
# Mother / Daughter connection.

# When you close the instructions, you
# can drag each entity and move around
# to fine tune your composition. You
# can even save it out as an SVG and
# import into Figma or other design tools.

# Happy wire marking!
`;

export default function Editor(props) {

  const domElement = useRef();

  const [text, setText] =  useState(window.localStorage.getItem('wiremarks-state') || defaultPrompt);
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(setup, []);
  useEffect(store, [text]);

  function setup() {
    resize();
    window.addEventListener('resize', resize, false);
    return unmount;
  }

  function resize() {
    setWidth(window.innerWidth);
    setHeight(window.innerHeight);
  }

  function unmount() {
    window.removeEventListener('resize', resize, false);
  }

  function update(e) {
    const value = e.target.value;
    // TODO: Add syntax highlighting here.
    setText(value);
  }

  function store() {
    window.localStorage.setItem('wiremarks-state', text);
  }

  //

  function open() {
    setIsOpen(true);
    requestAnimationFrame(select);
  }
  function close() {
    setIsOpen(false);
  }
  function select() {
    const selector = 'div.panel textarea';
    const textarea = domElement.current.querySelector(selector);
    textarea.focus();
  }
  function download() {
    var canvas = document.querySelector('svg');
    var serializer = new XMLSerializer();
    var source = serializer.serializeToString(canvas);
    var a = document.createElement('a');
    a.href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
    a.download = 'wiremarks.svg';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div ref={ domElement } className={ ['editor', isOpen ? 'writing' : ''].join(' ') }>
      <div className="stage">
        <Wiremark instructions={ text } width={ width } height={ height } />
      </div>
      <div className="ui">
        <div className="open button" onClick={ open }>
          Open Instructions
        </div>
        <div className="download button" onClick={ download }>
          Download
        </div>
        <div className="panel">
          <div className="close button" onClick={ close }>✕</div>
          <textarea onChange={ update } spellCheck="false" defaultValue={ text } />
        </div>
      </div>
    </div>
  );

}
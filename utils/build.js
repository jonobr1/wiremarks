const fs = require('fs');
const path = require('path');
const es = require('esbuild');
const entryPoints = [path.resolve(__dirname, '../src/main.js')];

es.buildSync({
  entryPoints,
  bundle: true,
  loader: { '.js': 'jsx' },
  platform: 'node',
  outfile: path.resolve(__dirname, '../public/build/wiremark.umd.js')
});

es.buildSync({
  entryPoints,
  bundle: true,
  loader: { '.js': 'jsx' },
  external: ['react', 'two.js', 'two.js/extras/jsm/zui.js'],
  platform: 'neutral',
  outfile: path.resolve(__dirname, '../public/build/wiremark.module.js')
});

es.buildSync({
  entryPoints,
  bundle: true,
  loader: { '.js': 'jsx' },
  outfile: path.resolve(__dirname, '../public/build/wiremark.js')
});

var contents = fs.readFileSync(path.resolve(__dirname, '../public/build/wiremark.js'), 'utf-8');
contents = contents.replace(
  /(var Wiremark = )/i,
  '$1 window.Wiremark = '
);
fs.writeFileSync(
  path.resolve(__dirname, '../public/build/wiremark.js'),
  contents
);

es.buildSync({
  entryPoints: [path.resolve(__dirname, '../src/index.js')],
  bundle: true,
  loader: { '.js': 'jsx' },
  outfile: path.resolve(__dirname, '../public/main.js')
});

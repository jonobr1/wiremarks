const fs = require('fs');
const path = require('path');
const es = require('esbuild');
const entryPoints = [path.resolve(__dirname, '../src/wiremarks.js')];

es.buildSync({
  entryPoints,
  bundle: true,
  platform: 'node',
  outfile: path.resolve(__dirname, '../public/build/wiremarks.umd.js')
});

es.buildSync({
  entryPoints,
  bundle: true,
  platform: 'neutral',
  outfile: path.resolve(__dirname, '../public/build/wiremarks.module.js')
});

es.buildSync({
  entryPoints,
  bundle: true,
  outfile: path.resolve(__dirname, '../public/build/wiremarks.js')
});

var contents = fs.readFileSync(path.resolve(__dirname, '../public/build/wiremarks.js'), 'utf-8');
contents = contents.replace(
  /(var Wiremarks = )/i,
  '$1 window.Wiremarks = '
);
fs.writeFileSync(
  path.resolve(__dirname, '../public/build/wiremarks.js'),
  contents
);

es.buildSync({
  entryPoints: [path.resolve(__dirname, '../src/index.js')],
  bundle: true,
  outfile: path.resolve(__dirname, '../public/main.js')
});

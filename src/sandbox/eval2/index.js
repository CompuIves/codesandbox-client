// @flow

import babelTranspiler from './transpilers/babel';
import typescriptTranspiler from './transpilers/typescript';
import jsonTranspiler from './transpilers/json';
import globalCSSTranspiler from './transpilers/css/global';
import modulesCSSTranspiler from './transpilers/css/modules';
import sassTranspiler from './transpilers/sass';
import rawTranspiler from './transpilers/raw';
import stylusTranspiler from './transpilers/stylus';
import vueTranspiler from './transpilers/vue';
import noopTranspiler from './transpilers/noop';
import binaryTranspiler from './transpilers/binary';
import vueTemplateTranspiler from './transpilers/vue/template-compiler';
import vueStyleTranspiler from './transpilers/vue/style-compiler';
import base64Transpiler from './transpilers/base64';

import PresetManager from './presets';

// Create React App loader
// CSS -> PostCSS => CSS Loader
// JS -> Babel Loader
// HTML -> Raw loader
// Images -> URL loader
// Other -> File loader (for us raw loader for now)

const createReactAppPreset = new PresetManager('create-react-app');

createReactAppPreset.registerTranspiler(
  module => /\.jsx?$/.test(module.title),
  [babelTranspiler],
);
createReactAppPreset.registerTranspiler(
  module => /\.tsx?$/.test(module.title),
  [typescriptTranspiler],
);
createReactAppPreset.registerTranspiler(
  module => /\.json$/.test(module.title),
  [jsonTranspiler],
);
createReactAppPreset.registerTranspiler(
  module => /\.scss$/.test(module.title),
  [sassTranspiler, globalCSSTranspiler],
);
createReactAppPreset.registerTranspiler(module => /\.vue$/.test(module.title), [
  vueTranspiler,
]);
createReactAppPreset.registerTranspiler(
  module => /\.vue\.html/.test(module.title),
  [vueTemplateTranspiler],
);
createReactAppPreset.registerTranspiler(
  module => /\.vue\.css/.test(module.title),
  [vueStyleTranspiler, globalCSSTranspiler],
);
createReactAppPreset.registerTranspiler(
  module => /\.vue\.module\.css/.test(module.title),
  [vueStyleTranspiler, modulesCSSTranspiler],
);
createReactAppPreset.registerTranspiler(
  module => /\.vue\.s[c|a]ss/.test(module.title),
  [sassTranspiler, vueStyleTranspiler, globalCSSTranspiler],
);
createReactAppPreset.registerTranspiler(
  module => /\.vue\.module\.s[c|a]ss/.test(module.title),
  [sassTranspiler, vueStyleTranspiler, modulesCSSTranspiler],
);
createReactAppPreset.registerTranspiler(
  module => /\.vue\.styl$/.test(module.title),
  [stylusTranspiler, vueStyleTranspiler, globalCSSTranspiler],
);
createReactAppPreset.registerTranspiler(module => /\.png$/.test(module.title), [
  binaryTranspiler,
  base64Transpiler,
]);
createReactAppPreset.registerTranspiler(module => /\.css$/.test(module.title), [
  globalCSSTranspiler,
]);
createReactAppPreset.registerTranspiler(module => /!noop/.test(module.title), [
  noopTranspiler,
]);
createReactAppPreset.registerTranspiler(() => true, [rawTranspiler]);

export default createReactAppPreset;

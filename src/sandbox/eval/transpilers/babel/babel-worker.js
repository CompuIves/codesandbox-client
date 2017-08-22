// @flow

import dynamicImportPlugin from 'babel-plugin-dynamic-import-node';
import vuePlugin from 'babel-plugin-transform-vue-jsx';

import { buildWorkerError } from '../utils/worker-error-handler';
import getDependendencies from './get-require-statements';

self.importScripts([
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/6.26.0/babel.min.js',
]);

self.postMessage('ready');

declare var Babel: {
  transform: (
    code: string,
    config: Object,
  ) => {
    ast: Object,
    code: string,
  },
  registerPlugin: (name: string, plugin: Function) => void,
};

Babel.registerPlugin('dynamic-import-node', dynamicImportPlugin);
Babel.registerPlugin('transform-vue-jsx', vuePlugin);

self.addEventListener('message', event => {
  const { code, path, config } = event.data;

  const plugins = [...config.plugins, 'dynamic-import-node'];

  if (path.includes('.vue')) {
    plugins.push('transform-vue-jsx');
  }

  const customConfig = {
    ...config,
    plugins,
  };

  try {
    const result = Babel.transform(code, customConfig);

    const dependencies = getDependendencies(result.ast);

    dependencies.forEach(dependency => {
      if (/^(\w|@)/.test(dependency.path) && !dependency.path.includes('!')) {
        // Don't push dependencies
        return;
      }

      self.postMessage({
        type: 'add-dependency',
        path: dependency.path,
        isGlob: dependency.type === 'glob',
      });
    });

    self.postMessage({
      type: 'compiled',
      transpiledCode: result.code,
    });
  } catch (e) {
    e.message = e.message.replace('unknown', path);
    self.postMessage({
      type: 'error',
      error: buildWorkerError(e),
    });
  }
});

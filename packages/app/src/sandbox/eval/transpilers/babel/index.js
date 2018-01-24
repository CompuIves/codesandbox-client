// @flow
import getDefinition from 'common/templates';

import getBabelConfig from './babel-parser';
import WorkerTranspiler from '../worker-transpiler';
import { type LoaderContext } from '../../transpiled-module';

import delay from '../../../utils/delay';

// Right now this is in a worker, but when we're going to allow custom plugins
// we need to move this out of the worker again, because the config needs
// to support custom plugins
class BabelTranspiler extends WorkerTranspiler {
  worker: Worker;
  config: ?Object;

  constructor() {
    super('babel-loader', null, 3, { hasFS: true });
  }

  setBabelRc(config: Object) {
    this.config = config;
  }

  async getWorker() {
    while (typeof window.babelworkers === 'undefined') {
      await delay(50); // eslint-disable-line
    }
    // We set these up in startup.js.
    const worker = window.babelworkers.pop();
    return worker;
  }

  doTranspilation(code: string, loaderContext: LoaderContext) {
    return new Promise((resolve, reject) => {
      const path = loaderContext.path;

      let babelConfig = getBabelConfig(
        loaderContext.options,
        path,
        this.config || {}
      );

      const template = getDefinition(loaderContext.template);
      const babelConfigPath = Object.keys(template.configurations).find(
        key => template.configurations[key].type === 'babel'
      );

      if (babelConfigPath) {
        const module = loaderContext.getTranspiledModules()[babelConfigPath];

        if (module && module.module && module.module.code) {
          try {
            const parsedBabel = JSON.parse(module.module.code);

            babelConfig = parsedBabel;
          } catch (e) {
            /* ignore */
          }
        }
      }

      const modules = loaderContext.getModules();
      const files = modules.reduce(
        (interMediateFiles, module) => ({
          ...interMediateFiles,
          [module.path]: module.code,
        }),
        {}
      );

      this.queueTask(
        {
          code,
          config: babelConfig,
          path,
          files,
        },
        loaderContext,
        (err, data) => {
          if (err) {
            loaderContext.emitError(err);

            return reject(err);
          }

          return resolve(data);
        }
      );
    });
  }
}

const transpiler = new BabelTranspiler();

export { BabelTranspiler };

export default transpiler;

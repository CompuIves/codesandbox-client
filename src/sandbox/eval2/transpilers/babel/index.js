// @flow
import BabelWorker from 'worker-loader!./babel-worker.js';

import getBabelConfig from './babel-parser';
import WorkerTranspiler from '../worker-transpiler';
import TranspiledModule, { type LoaderContext } from '../../TranspiledModule';

// Right now this is in a worker, but when we're going to allow custom plugins
// we need to move this out of the worker again, because the config needs
// to support custom plugins
class BabelTranspiler extends WorkerTranspiler {
  worker: Worker;

  constructor() {
    super(BabelWorker, 2);
  }

  doTranspilation(module: TranspiledModule, loaderContext: LoaderContext) {
    return new Promise((resolve, reject) => {
      const path = loaderContext.path;

      // TODO get custom babel config back in
      const babelConfig = getBabelConfig({}, path);

      this.queueTask(
        {
          code: module.module.code,
          config: babelConfig,
        },
        (err, data) => {
          if (err) {
            console.error('There was an error we still need to handle', err);
            return reject(err);
          }

          return resolve(data);
        },
      );
    });
  }
}

const transpiler = new BabelTranspiler();

export { BabelTranspiler };

export default transpiler;

/* eslint-enable import/default */
import { isBabel7 } from '@codesandbox/common/lib/utils/is-babel-7';
import { isUrl } from '@codesandbox/common/lib/utils/is-url';

/* eslint-disable import/default */
// @ts-ignore
import BabelWorker from 'worker-loader?publicPath=/&name=babel-transpiler.[hash:8].worker.js!./worker/index';

import delay from '@codesandbox/common/lib/utils/delay';
import { endMeasure, measure } from '@codesandbox/common/lib/utils/metrics';
import { LoaderContext, Manager } from 'sandpack-core';
import WorkerTranspiler from '../worker-transpiler';
import getBabelConfig from './babel-parser';
import { getSyntaxInfoFromAst } from './ast/syntax-info';
import { convertEsModule } from './ast/convert-esmodule';
import { ESTreeAST, generateCode, parseModule } from './ast/utils';
import { collectDependenciesFromAST } from './ast/collect-dependencies';

interface TranspilationResult {
  transpiledCode: string;
}

const global = window as any;
const WORKER_COUNT = process.env.SANDPACK ? 1 : 3;

function addCollectedDependencies(
  loaderContext: LoaderContext,
  deps: Array<string>
): Promise<Array<void>> {
  return Promise.all(deps.map(dep => loaderContext.addDependency(dep)));
}

// Right now this is in a worker, but when we're going to allow custom plugins
// we need to move this out of the worker again, because the config needs
// to support custom plugins
class BabelTranspiler extends WorkerTranspiler {
  worker: Worker;

  constructor() {
    super('babel-loader', BabelWorker, WORKER_COUNT, {
      hasFS: true,
      preload: true,
    });
  }

  startupWorkersInitialized = false;

  async getWorker() {
    while (typeof global.babelworkers === 'undefined') {
      await delay(50); // eslint-disable-line
    }

    if (global.babelworkers.length === 0) {
      return super.getWorker();
    }

    // We set these up in startup.js.
    return global.babelworkers.pop();
  }

  async doTranspilation(
    code: string,
    loaderContext: LoaderContext
  ): Promise<TranspilationResult> {
    const { path } = loaderContext;
    const isNodeModule = path.startsWith('/node_modules') || isUrl(path);

    /**
     * We should never transpile babel-standalone, because it relies on code that runs
     * in non-strict mode. Transpiling this code would add a "use strict;" piece, which
     * would then break the code (because it expects `this` to be global). No transpiler
     * can fix this, and because of this we need to just specifically ignore this file.
     */
    if (path === '/node_modules/babel-standalone/babel.js') {
      return { transpiledCode: code };
    }

    // Check if we can take a shortcut, we have a custom pipeline for transforming
    // node_modules to commonjs and collecting deps
    if (loaderContext.options.simpleRequire || isNodeModule) {
      try {
        const ast: ESTreeAST = parseModule(code);
        const syntaxInfo = getSyntaxInfoFromAst(ast);

        if (!syntaxInfo.jsx) {
          // If the code is ESM we transform it to commonjs and return it
          if (syntaxInfo.esm) {
            measure(`esconvert-${path}`);
            const { deps } = convertEsModule(ast);
            endMeasure(`esconvert-${path}`, { silent: true });
            await addCollectedDependencies(loaderContext, deps);
            return {
              transpiledCode: generateCode(ast),
            };
          }

          // If the code is commonjs and does not contain any more jsx, we generate and return the code.
          measure(`dep-collection-${path}`);
          const deps = collectDependenciesFromAST(ast);
          endMeasure(`dep-collection-${path}`, { silent: true });
          await addCollectedDependencies(loaderContext, deps);
          return {
            transpiledCode: code,
          };
        }
      } catch (err) {
        console.warn(
          `Error occurred while trying to quickly transform '${path}'`
        );
        console.warn(err);
      }
    }

    const configs = loaderContext.options.configurations;
    const foundConfig = configs.babel && configs.babel.parsed;
    const loaderOptions = loaderContext.options || {};

    const dependencies =
      (configs.package &&
        configs.package.parsed &&
        configs.package.parsed.dependencies) ||
      {};

    const devDependencies =
      (configs.package &&
        configs.package.parsed &&
        configs.package.parsed.devDependencies) ||
      {};

    const isV7 =
      loaderContext.options.isV7 || isBabel7(dependencies, devDependencies);

    const hasMacros = Object.keys(dependencies).some(
      d => d.indexOf('macro') > -1 || d.indexOf('codegen') > -1
    );

    const babelConfig = getBabelConfig(
      foundConfig || (loaderOptions as any).config,
      loaderOptions,
      path,
      isV7
    );

    return new Promise((resolve, reject) => {
      this.queueTask(
        {
          code,
          config: babelConfig,
          path,
          loaderOptions,
          babelTranspilerOptions:
            configs &&
            configs.babelTranspiler &&
            configs.babelTranspiler.parsed,
          sandboxOptions: configs && configs.sandbox && configs.sandbox.parsed,
          version: isV7 ? 7 : 6,
          hasMacros,
        },
        loaderContext._module.getId(),
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

  async getTranspilerContext(manager: Manager): Promise<any> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async resolve => {
      const baseConfig = await super.getTranspilerContext(manager);

      const babelTranspilerOptions =
        manager.configurations &&
        manager.configurations.babelTranspiler &&
        manager.configurations.babelTranspiler.parsed;

      this.queueTask(
        {
          type: 'get-babel-context',
          babelTranspilerOptions,
        },
        'babelContext',
        // @ts-ignore
        {},
        (err, data) => {
          const { version, availablePlugins, availablePresets } = data as any;

          resolve({
            ...baseConfig,
            babelVersion: version,
            availablePlugins,
            availablePresets,
            babelTranspilerOptions,
          });
        }
      );
    });
  }
}

const transpiler = new BabelTranspiler();

export { BabelTranspiler };

export default transpiler;

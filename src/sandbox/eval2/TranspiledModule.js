// @flow
import type { Module } from 'common/types';
import { flatten } from 'lodash';
import getModulePath from 'common/sandbox/get-module-path';

import type { SourceMap } from './transpilers/utils/get-source-map';
import ModuleError from './errors/module-error';
import ModuleWarning from './errors/module-warning';

import resolveDependency from './loaders/dependency-resolver';
import evaluate from './loaders/eval';

import Manager from './Manager';

type ChildModule = Module & {
  parent: Module,
};

class ModuleSource {
  fileName: string;
  compiledCode: string;
  sourceMap: ?SourceMap;

  constructor(fileName: string, compiledCode: string, sourceMap?: SourceMap) {
    this.fileName = fileName;
    this.compiledCode = compiledCode;
    this.sourceMap = sourceMap;
  }
}

export type LoaderContext = {
  version: number,
  emitWarning: (warning: string) => void,
  emitError: (error: Error) => void,
  emitModule: (append: string, code: string) => void,
  emitFile: (name: string, content: string, sourceMap: SourceMap) => void,
  options: {
    context: '/',
  },
  webpack: boolean,
  sourceMap: boolean,
  target: string,
  path: string,
  _module: TranspiledModule, // eslint-disable-line no-use-before-define
};

class Compilation {
  dependencies: Set<TranspiledModule>; // eslint-disable-line no-use-before-define
  initiators: Set<TranspiledModule>; // eslint-disable-line no-use-before-define
  exports: any;

  constructor() {
    this.dependencies = new Set();
    this.initiators = new Set();
    this.exports = null;
  }
}

export default class TranspiledModule {
  module: Module;
  source: ?ModuleSource;
  cacheable: boolean;
  assets: {
    [name: string]: ModuleSource,
  };
  childModules: Array<TranspiledModule>;
  errors: Array<ModuleError>;
  warnings: Array<ModuleWarning>;
  /**
   * All extra modules emitted by the loader
   */
  emittedAssets: Array<ModuleSource>;
  compilation: ?Compilation;

  constructor(module: Module) {
    this.module = module;
    this.errors = [];
    this.warnings = [];
    this.cacheable = true;
    this.childModules = [];
  }

  dispose() {
    this.reset();
  }

  reset() {
    this.childModules = [];
    this.errors = [];
    this.warnings = [];
    this.emittedAssets = [];
    this.resetCompilation();
    this.resetTranspilation();
  }

  resetTranspilation() {
    this.source = null;
  }

  resetCompilation() {
    if (this.compilation != null) {
      this.compilation.initiators.forEach(dep => {
        dep.resetCompilation();
      });
      this.compilation = null;
    }
  }

  update(module: Module): TranspiledModule {
    this.module = module;
    this.reset();

    return this;
  }

  createSourceForAsset = (
    name: string,
    content: string,
    sourceMap: SourceMap,
  ) => new ModuleSource(name, content, sourceMap);

  getLoaderContext(manager: Manager): LoaderContext {
    const path = getModulePath(
      manager.getModules(),
      manager.getDirectories(),
      this.module.id,
    ).replace('/', '');

    return {
      version: 2,
      emitWarning: warning => {
        this.warnings.push(new ModuleWarning(this, warning));
      },
      emitError: error => {
        this.errors.push(new ModuleError(this, error));
      },
      emitModule: (append: string, code: string) => {
        // Copy the module info, with new name
        const moduleCopy: ChildModule = {
          ...this.module,
          id: `${this.module.id}:${append}`,
          shortid: `${this.module.shortid}:${append}`,
          title: `${this.module.title}:${append}`,
          parent: this.module,
          code,
        };

        const transpiledModule = manager.addModule(moduleCopy);
        transpiledModule.transpile(manager);
        this.childModules.push(transpiledModule);
      },
      emitFile: (name: string, content: string, sourceMap: SourceMap) => {
        this.assets[name] = this.createSourceForAsset(name, content, sourceMap);
      },
      options: {
        context: '/',
      },
      webpack: true,
      sourceMap: true,
      target: 'web',
      _module: this,
      path,
      fs: () => {
        console.log('fs has been used');
      },
    };
  }

  transpile(manager: Manager) {
    // For now we only support one transpiler per module
    const [transpiler] = manager.preset.getTranspilers(this.module);
    const loaderContext = this.getLoaderContext(manager);
    return transpiler
      .transpile(this, loaderContext)
      .then(({ transpiledCode, sourceMap }) => {
        this.source = new ModuleSource(
          this.module.title,
          transpiledCode,
          sourceMap,
        );
        return this;
      })
      .catch(e => {
        e.fileName = loaderContext.path;
        e.module = this.module;
        return Promise.reject(e);
      });
  }

  getChildModules(): Array<Module> {
    return flatten(
      this.childModules.map(m => [m.module, ...m.getChildModules()]),
    );
  }

  evaluate(manager: Manager, parentModules: Array<TranspiledModule>) {
    if (this.source == null) {
      throw new Error(`${this.module.title} hasn't been transpiled yet.`);
    }

    const module = this.module;
    const transpiledModule = this;
    const compilation = new Compilation();
    compilation.initiators = new Set(parentModules);
    try {
      function require(path: string) {
        // eslint-disable-line no-unused-vars
        if (/^(\w|@)/.test(path)) {
          // So it must be a dependency
          return resolveDependency(path, manager.externals);
        }

        const requiredTranspiledModule = manager.resolveTranspiledModule(
          path,
          module.directoryShortid,
        );

        if (requiredTranspiledModule == null)
          throw new Error(`Cannot find module in path: ${path}`);

        if (module === requiredTranspiledModule.module) {
          throw new Error(`${module.title} is importing itself`);
        }

        compilation.dependencies.add(requiredTranspiledModule);

        // Check if this module has been evaluated before, if so return the exports
        // of that compilation
        const cache = requiredTranspiledModule.compilation;

        if (cache != null) {
          cache.initiators.add(transpiledModule);
        }

        // This is a cyclic dependency, we should return undefined for first
        // execution according to ES module spec
        if (parentModules.includes(requiredTranspiledModule) && !cache) {
          return undefined;
        }

        return cache
          ? cache.exports
          : manager.evaluateModule(requiredTranspiledModule.module, [
              ...parentModules,
              transpiledModule,
            ]);
      }

      const exports = evaluate(this.source.compiledCode, require);

      compilation.exports = exports;
      this.compilation = compilation;
      return exports;
    } catch (e) {
      e.module = module;
      throw e;
    }
  }
}

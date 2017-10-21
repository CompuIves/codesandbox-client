// @flow
import { flattenDeep, uniq, values } from 'lodash';
import resolve from 'browser-resolve';

import * as pathUtils from 'common/utils/path';

import type { Module } from './entities/module';
import TranspiledModule from './transpiled-module';
import Preset from './presets';
import nodeResolvePath from './utils/node-resolve-path';
import fetchModule from './npm/fetch-npm-module';
import DependencyNotFoundError from '../errors/dependency-not-found-error';
import ModuleNotFoundError from '../errors/module-not-found-error';

type Externals = {
  [name: string]: string,
};

type ModuleObject = {
  [path: string]: Module,
};

export type Manifest = {
  contents: {
    [path: string]: { content: string, requires: Array<string> },
  },
  dependencies: Array<{ name: string, version: string }>,
  dependencyDependencies: {
    [name: string]: string,
  },
  dependencyAliases: {
    [name: string]: {
      [depName: string]: string,
    },
  },
};

const NODE_LIBS = ['dgram', 'fs', 'path', 'net', 'tls', 'child_process'];

export default class Manager {
  id: string;
  transpiledModules: {
    [path: string]: {
      module: Module,
      tModules: {
        [query: string]: TranspiledModule,
      },
    },
  };
  preset: Preset;
  externals: Externals;
  modules: ModuleObject;

  manifest: Manifest;
  experimentalPackager: boolean;

  constructor(
    id: string,
    modules: Array<Module>,
    preset: Preset,
    options: Object = {}
  ) {
    this.id = id;
    this.preset = preset;
    this.transpiledModules = {};
    modules.forEach(m => this.addModule(m));

    this.experimentalPackager = options.experimentalPackager || true;

    if (process.env.NODE_ENV === 'development') {
      console.log(this);
    }
  }

  setExternals(externals: Externals) {
    this.externals = externals;
  }

  setManifest(manifest: Manifest) {
    this.manifest = manifest;

    Object.keys(manifest.contents).forEach(path => {
      this.addModule({
        path,
        code: manifest.contents[path].content,
        requires: manifest.contents[path].requires,
      });
    });
  }

  evaluateModule(module: Module) {
    const transpiledModule = this.getTranspiledModule(module);

    // Run post evaluate first
    const exports = this.evaluateTranspiledModule(transpiledModule, []);

    this.getTranspiledModules().forEach(t => t.postEvaluate(this));

    return exports;
  }

  evaluateTranspiledModule(
    transpiledModule: TranspiledModule,
    parentModules: Array<TranspiledModule>
  ) {
    return transpiledModule.evaluate(this, parentModules);
  }

  addModule(module: Module) {
    this.transpiledModules[module.path] = this.transpiledModules[
      module.path
    ] || { module, tModules: {} };
  }

  addTranspiledModule(module: Module, query: string = ''): TranspiledModule {
    if (!this.transpiledModules[module.path]) {
      this.addModule(module);
    }
    this.transpiledModules[module.path].module = module;

    const transpiledModule = new TranspiledModule(module, query);

    this.transpiledModules[module.path].tModules[query] = transpiledModule;

    return transpiledModule;
  }

  /**
   * Get Transpiled Module from the registry, if there is no transpiled module
   * in the registry it will create a new one
   * @param {*} module
   * @param {*} query A webpack like syntax (!url-loader)
   * @param {*} string
   */
  getTranspiledModule(module: Module, query: string = ''): TranspiledModule {
    const moduleObject = this.transpiledModules[module.path];
    if (!moduleObject) {
      this.addModule(module);
    }

    let transpiledModule = this.transpiledModules[module.path].tModules[query];

    if (!transpiledModule) {
      transpiledModule = this.addTranspiledModule(module, query);
    }

    return transpiledModule;
  }

  /**
   * One module can have multiple transpiled modules, because modules can be
   * required in different ways. For example, require(`babel-loader!./Test.vue`) isn't
   * the same as require(`./Test.vue`).
   *
   * This will return all transpiled modules, with different configurations associated one module.
   * @param {*} module
   */
  getTranspiledModulesByModule(module: Module): Array<TranspiledModule> {
    return this.transpiledModules[module.path]
      ? values(this.transpiledModules[module.path].tModules)
      : [];
  }

  getTranspiledModules() {
    const transpiledModuleValues = values(this.transpiledModules);

    return flattenDeep(transpiledModuleValues.map(m => values(m.tModules)));
  }

  removeTranspiledModule(tModule: TranspiledModule) {
    delete this.transpiledModules[tModule.module.path].tModules[tModule.query];
  }

  removeModule(module: Module) {
    const existingModule = this.transpiledModules[module.path];

    values(existingModule.tModules).forEach(m => m.dispose());

    delete this.transpiledModules[module.path];
  }

  /**
   * Will transpile this module and all eventual children (requires) that go with it
   * @param {*} entry
   */
  transpileModules(entry: Module) {
    const transpiledModule = this.getTranspiledModule(entry);

    transpiledModule.setIsEntry(true);
    return transpiledModule.transpile(this);
  }

  clearCompiledCache() {
    this.getTranspiledModules().map(tModule => tModule.resetCompilation());
  }

  getModules(): Array<Module> {
    return values(this.transpiledModules).map(t => t.module);
  }

  getAliasedDependencyPath(path: string, currentPath: string) {
    const isDependency = /^(\w|@\w)/.test(path);

    if (!isDependency) {
      return path;
    }

    const isCurrentPathDependency = currentPath.startsWith('/node_modules');
    if (!isCurrentPathDependency) {
      return path;
    }

    const dependencyParts = path.split('/');
    const dependencyName = path.startsWith('@')
      ? `${dependencyParts[0]}/${dependencyParts[1]}`
      : dependencyParts[0];

    const previousDependencyParts = currentPath
      .replace('/node_modules/', '')
      .split('/');
    const previousDependencyName = path.startsWith('@')
      ? `${previousDependencyParts[0]}/${previousDependencyParts[1]}`
      : previousDependencyParts[0];

    if (
      this.manifest[previousDependencyName] &&
      this.manifest[previousDependencyName][dependencyName]
    ) {
      const aliasedDependencyName = this.manifest[previousDependencyName][
        dependencyName
      ];

      return path.replace(dependencyName, aliasedDependencyName);
    }

    return path;
  }

  resolveModule(
    path: string,
    currentPath: string,
    defaultExtensions: Array<string> = ['js', 'jsx', 'json']
  ): Module {
    const isDependency = /^(\w|@\w)/.test(path);

    const aliasedPath = this.getAliasedDependencyPath(path, currentPath);

    try {
      const resolvedPath = resolve.sync(aliasedPath, {
        filename: currentPath,
        extensions: defaultExtensions.map(ext => '.' + ext),
        isFile: p => !!this.transpiledModules[p],
        readFileSync: p => {
          if (this.transpiledModules[p]) {
            return this.transpiledModules[p].module.code;
          }

          const err = new Error('Could not find ' + p);
          err.code = 'ENOENT';

          throw err;
        },
      });

      if (NODE_LIBS.includes(resolvedPath)) {
        return {
          path: pathUtils.join('/node_modules', resolvedPath),
          code: `// empty`,
          requires: [],
        };
      }

      return this.transpiledModules[resolvedPath].module;
    } catch (e) {
      if (!isDependency) {
        throw new ModuleNotFoundError(aliasedPath, false);
      }

      const dependencyParts = path.split('/');
      const dependencyName = path.startsWith('@')
        ? `${dependencyParts[0]}/${dependencyParts[1]}`
        : dependencyParts[0];

      if (
        this.manifest.dependencies.find(d => d.name === dependencyName) ||
        this.manifest.dependencyDependencies[dependencyName]
      ) {
        throw new ModuleNotFoundError(aliasedPath, true);
      } else {
        throw new DependencyNotFoundError(path);
      }
    }
  }

  downloadPromises = {};

  async downloadDependency(path: string): Promise<TranspiledModule> {
    this.downloadPromises[path] =
      this.downloadPromises[path] ||
      fetchModule(
        path,
        this.manifest,
        this.preset.ignoredExtensions
      ).then(module => this.getTranspiledModule(module));

    return this.downloadPromises[path];
  }

  /**
   * Resolve the transpiled module from the path, note that the path can actually
   * include loaders. That's why we're focussing on first extracting this query
   * @param {*} path
   * @param {*} currentPath
   */
  resolveTranspiledModule(path: string, currentPath: string): TranspiledModule {
    if (path.startsWith('webpack:')) {
      throw new Error('Cannot resolve webpack path');
    }

    const queryPath = path.split('!');
    // pop() mutates queryPath, queryPath is now just the loaders
    const modulePath = queryPath.pop();

    const newPath = this.preset
      .getAliasedPath(modulePath)
      .replace(/.*\{\{sandboxRoot\}\}/, '');

    const module = this.resolveModule(
      newPath,
      currentPath,
      this.preset.ignoredExtensions
    );

    return this.getTranspiledModule(module, queryPath.join('!'));
  }

  resolveTranspiledModulesInDirectory(
    path: string,
    currentPath: string
  ): Array<TranspiledModule> {
    const queryPath = path.split('!');
    // pop() mutates queryPath, queryPath is now just the loaders
    const modulesPath = queryPath.pop();

    const joinedPath = pathUtils.join(
      pathUtils.dirname(currentPath),
      modulesPath
    );

    return Object.keys(this.transpiledModules)
      .filter(p => p.startsWith(joinedPath))
      .map(m =>
        this.getTranspiledModule(
          this.transpiledModules[m].module,
          queryPath.join('!')
        )
      );
  }

  /**
   * Find all changed, added and deleted modules. Update trees and
   * delete caches accordingly
   */
  updateData(modules: Array<Module>) {
    const addedModules = [];
    const updatedModules = [];

    modules.forEach(module => {
      const mirrorModule = this.transpiledModules[module.path];

      if (!mirrorModule) {
        addedModules.push(module);
        this.addTranspiledModule(module);
      } else if (mirrorModule.module.code !== module.code) {
        updatedModules.push(module);
      }
    });

    this.getModules().forEach(m => {
      if (
        !m.path.startsWith('/node_modules') &&
        !modules.find(m2 => m2.path === m.path) &&
        !m.parent // not an emitted module
      ) {
        this.removeModule(m);
      }
    });

    const modulesToUpdate = uniq([...addedModules, ...updatedModules]);

    const tModulesToUpdate = modulesToUpdate.map(m =>
      this.getTranspiledModulesByModule(m).map(tModule => {
        this.transpiledModules[m.path].module = m;
        tModule.update(m);

        return tModule;
      })
    );

    const transpiledModulesToUpdate = uniq(
      flattenDeep([
        tModulesToUpdate,
        // All modules with errors
        this.getTranspiledModules().filter(t => t.errors.length > 0),
      ])
    );

    return Promise.all(
      transpiledModulesToUpdate.map(tModule => tModule.transpile(this))
    );
  }
}

import { pickBy } from 'lodash-es';

import setScreen, { resetScreen } from '../status-screen';
import dependenciesToQuery from './dependencies-to-query';
import {
  protocols,
  getFetchProtocol,
} from 'sandbox/npm/dynamic/fetch-protocols';
import { parseResolutions } from './dynamic/resolutions';
import { resolveDependencyInfo } from './dynamic/resolve-dependency';
import { getDependency as getPrebundledDependency } from './preloaded/fetch-dependencies';
import { mergeDependencies } from './merge-dependency';
import { dispatch, actions } from 'codesandbox-api';

let loadedDependencyCombination: string | null = null;
let manifest = null;

export type NPMDependencies = {
  [dependency: string]: string;
};

const PRELOADED_PROTOCOLS = [protocols.jsDelivrNPM, protocols.unpkg];

/**
 * Depending on the dependency version we decide whether we can load a prebundled bundle (generated
 * in a lambda) or use a dynamic version of fetching the dependency.
 */
function shouldFetchDynamically(depVersion: string) {
  const fetchProtocol = getFetchProtocol(depVersion);
  return !PRELOADED_PROTOCOLS.includes(fetchProtocol);
}

/**
 * Some dependencies have a space in their version for some reason, this is invalid and we
 * ignore them. This is what yarn does as well.
 */
function removeSpacesFromDependencies(dependencies: Object) {
  const newDeps = {};
  Object.keys(dependencies).forEach(depName => {
    const [version] = dependencies[depName].split(' ');
    newDeps[depName] = version;
  });
  return newDeps;
}

/**
 * Split the dependencies between whether they should be loaded from dynamically or from an endpoint
 * that has the dependency already prebundled.
 */
function splitDependencies(
  dependencies: NPMDependencies,
  forceFetchDynamically: boolean
): {
  dynamicDependencies: NPMDependencies;
  prebundledDependencies: NPMDependencies;
} {
  if (forceFetchDynamically) {
    return { dynamicDependencies: dependencies, prebundledDependencies: {} };
  }

  const dynamicDependencies = {};
  const prebundledDependencies = {};

  Object.keys(dependencies).forEach(depName => {
    const version = dependencies[depName];
    if (shouldFetchDynamically(version)) {
      dynamicDependencies[depName] = version;
    } else {
      prebundledDependencies[depName] = version;
    }
  });

  return { dynamicDependencies, prebundledDependencies };
}

export async function getDependenciesFromSources(
  dependencies: {
    [depName: string]: string;
  },
  resolutions: { [startGlob: string]: string },
  showLoaderFullScreen: boolean,
  forceFetchDynamically: boolean
) {
  setScreen({
    type: 'loading',
    text: 'Installing Dependencies...',
    showFullScreen: showLoaderFullScreen,
  });

  try {
    const parsedResolutions = parseResolutions(resolutions);
    let remainingDependencies = Object.keys(dependencies);
    let totalDependencies = remainingDependencies.length;

    const depsWithNodeLibs = removeSpacesFromDependencies({
      'node-libs-browser': '2.2.0',
      ...dependencies,
    });

    const { dynamicDependencies, prebundledDependencies } = splitDependencies(
      depsWithNodeLibs,
      forceFetchDynamically
    );

    function updateLoadScreen() {
      const progress = totalDependencies - remainingDependencies.length;
      const total = totalDependencies;

      if (progress === total) {
        resetScreen();
        return;
      }

      if (remainingDependencies.length <= 6) {
        setScreen({
          type: 'loading',
          text: `Installing Dependencies: ${progress}/${total} (${remainingDependencies.join(
            ', '
          )})`,
          showFullScreen: showLoaderFullScreen,
        });
      } else {
        setScreen({
          type: 'loading',
          text: `Installing Dependencies: ${progress}/${total}`,
          showFullScreen: showLoaderFullScreen,
        });
      }
    }

    const dynamicPromise = Promise.all(
      Object.keys(dynamicDependencies).map(depName => {
        return resolveDependencyInfo(
          depName,
          depsWithNodeLibs[depName],
          parsedResolutions
        ).finally(() => {
          remainingDependencies.splice(
            remainingDependencies.indexOf(depName),
            1
          );
          updateLoadScreen();
        });
      })
    );

    const prebundledPromise = Promise.all(
      Object.keys(prebundledDependencies).map(depName => {
        return getPrebundledDependency(
          depName,
          depsWithNodeLibs[depName]
        ).finally(() => {
          remainingDependencies.splice(
            remainingDependencies.indexOf(depName),
            1
          );
          updateLoadScreen();
        });
      })
    );

    const [
      dynamicLoadedDependencies,
      prebundledLoadedDependencies,
    ] = await Promise.all([dynamicPromise, prebundledPromise]);

    return mergeDependencies([
      ...dynamicLoadedDependencies,
      ...prebundledLoadedDependencies,
    ]);
  } catch (e) {
    e.message = `Could not fetch dependencies, please try again in a couple seconds: ${e.message}`;
    dispatch(actions.notifications.show(e.message, 'error'));

    throw e;
  }
}

/**
 * This fetches the manifest and dependencies from our packager or dynamic sources
 * @param {*} dependencies
 */
export async function loadDependencies(
  dependencies: NPMDependencies,
  {
    disableExternalConnection = false,
    resolutions = undefined,
    showFullScreen = false,
  } = {}
) {
  let isNewCombination = false;
  if (Object.keys(dependencies).length !== 0) {
    // We filter out all @types, as they are not of any worth to the bundler
    const dependenciesWithoutTypings = pickBy(
      dependencies,
      (val, key) => !(key.includes && key.includes('@types'))
    );

    const depQuery = dependenciesToQuery(dependenciesWithoutTypings);

    if (loadedDependencyCombination !== depQuery) {
      isNewCombination = true;

      const data = await getDependenciesFromSources(
        dependenciesWithoutTypings,
        resolutions,
        showFullScreen,
        disableExternalConnection
      );

      // Mark that the last requested url is this
      loadedDependencyCombination = depQuery;
      manifest = data;

      setScreen({
        type: 'loading',
        text: 'Transpiling Modules...',
        showFullScreen,
      });
    }
  } else {
    manifest = null;
  }

  return { manifest, isNewCombination };
}

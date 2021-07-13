import semver from 'semver';
import { getAbsoluteDependencies } from '@codesandbox/common/lib/utils/dependencies';
import { Manager } from 'sandpack-core';
import { Dependencies } from '@codesandbox/common/lib/templates/template';

function isMinimalSemverVersion(version: string, minimalVersion: string) {
  try {
    return semver.gte(version, minimalVersion);
  } catch (e) {
    // Semver couldn't be parsed, we assume that we're on the bleeding edge now, so true.
    return true;
  }
}

export async function isMinimalReactDomVersion(
  version: string,
  minimalVersion: string
): Promise<boolean> {
  return isMinimalAbsoluteVersion('react-dom', version, minimalVersion);
}

export async function isMinimalReactVersion(
  version: string,
  minimalVersion: string
): Promise<boolean> {
  return isMinimalAbsoluteVersion('react', version, minimalVersion);
}

export async function isMinimalAbsoluteVersion(
  name: string,
  version: string,
  minimalVersion: string
): Promise<boolean> {
  if (version) {
    const absoluteDependencies = await getAbsoluteDependencies({
      [name]: version,
    });

    return (
      absoluteDependencies[name].startsWith('0.0.0') ||
      isMinimalSemverVersion(absoluteDependencies[name], minimalVersion)
    );
  }

  return false;
}

/**
 * Decide whether React Refresh hot module reloading strategy is supported by React
 */
export async function hasRefresh(
  dependencies: { name: string; version: string }[]
) {
  const hasReactRefresh = dependencies.find(n => n.name === 'react-refresh');
  if (hasReactRefresh) {
    const reactDom = dependencies.find(dep => dep.name === 'react-dom');

    if (reactDom) {
      return isMinimalReactDomVersion(reactDom.version, '16.9.0');
    }
  }

  return false;
}

export async function supportsNewReactTransform(
  dependencies: Dependencies = {},
  devDependencies: Dependencies = {}
): Promise<boolean> {
  const reactScripts =
    dependencies['react-scripts'] || devDependencies['react-scripts'];
  const react = dependencies.react || devDependencies.react;

  if (reactScripts && react) {
    const [isReact, isReactScripts] = await Promise.all([
      isMinimalReactVersion(react, '17.0.0'),
      isMinimalAbsoluteVersion('react-scripts', reactScripts, '4.0.0'),
    ]);
    return isReact && isReactScripts;
  }

  return false;
}

/**
 * We unmount the component tree to ensure that `componentWillUnmount` et all are called
 */
export function cleanUsingUnmount(manager: Manager) {
  try {
    const { children } = document.body;
    // Do unmounting for react
    if (
      manager.manifest &&
      manager.manifest.dependencies.find(n => n.name === 'react-dom')
    ) {
      const reactDOMModule = manager.resolveModule({ path: 'react-dom' });
      const reactDOM = manager.evaluateModule(reactDOMModule);

      reactDOM.unmountComponentAtNode(document.body);

      for (let i = 0; i < children.length; i += 1) {
        if (children[i].tagName === 'DIV') {
          reactDOM.unmountComponentAtNode(children[i]);
        }
      }
    }
  } catch (e) {
    /* don't do anything with this error */

    if (process.env.NODE_ENV === 'development') {
      console.error('Problem while cleaning up');
      console.error(e);
    }
  }
}

export const aliases = {
  // Directly match react-native to react-native-web.
  // Attempt to use react-native internals shouldn't work on web.
  'react-native$': 'react-native-web',
  // Alias core react-native internals to react-native-web equivalents
  'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter$':
    'react-native-web/dist/vendor/react-native/NativeEventEmitter/RCTDeviceEventEmitter',
  'react-native/Libraries/vendor/emitter/EventEmitter$':
    'react-native-web/dist/vendor/react-native/emitter/EventEmitter',
  'react-native/Libraries/vendor/emitter/EventSubscriptionVendor$':
    'react-native-web/dist/vendor/react-native/emitter/EventSubscriptionVendor',
  'react-native/Libraries/EventEmitter/NativeEventEmitter$':
    'react-native-web/dist/vendor/react-native/NativeEventEmitter',
  // Alias core react-native asset management internals to unimodule equivalents.
  'react-native/Libraries/Image/AssetSourceResolver$':
    'expo-asset/build/AssetSourceResolver',
  'react-native/Libraries/Image/assetPathUtils$':
    'expo-asset/build/Image/assetPathUtils',
  'react-native/Libraries/Image/resolveAssetSource$':
    'expo-asset/build/resolveAssetSource',
  // Alias react-native-svg to svgs
  'react-native-svg$': 'svgs'
};

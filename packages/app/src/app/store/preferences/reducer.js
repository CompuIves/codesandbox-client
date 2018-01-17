// @flow

import type { Preferences } from 'common/types';
import store from 'store/dist/store.modern';

import { SET_PREFERENCES } from './actions';
import * as keys from './keys';

export const DEFAULT_PRETTIER_CONFIG = {
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  trailingComma: 'none',
  bracketSpacing: true,
  jsxBracketSameLine: false,
};

function getKey<D: any>(key: string, defaultVal: D): ?D {
  try {
    const result = store.get(key);
    return result === undefined ? defaultVal : result;
  } catch (e) {
    console.error(e);
    return undefined;
  }
}

const initialState: Preferences = Object.keys(keys).reduce(
  (res, key) =>
    Object.assign(res, {
      [key]: getKey(keys[key], res[key]),
    }),
  {
    autoCompleteEnabled: true,
    livePreviewEnabled: true,
    prettifyOnSaveEnabled: true,
    lintEnabled: true,
    instantPreviewEnabled: false,
    fontSize: 14,
    fontFamily: '',
    lineHeight: 1.15,
    clearConsoleEnabled: true,
    prettierConfig: DEFAULT_PRETTIER_CONFIG,
    codeMirror: false,
    autoDownloadTypes: true,
    newPackagerExperiment: false,
    relativeUrlsEnabled: true, // TODO: SET IT TO FALSE BEFORE PROD, JUST FOR TESTING
    relativeUrl: 'sandbox://',
  }
);

export default (state: Preferences = initialState, action): Preferences => {
  switch (action.type) {
    case SET_PREFERENCES:
      return {
        ...state,
        ...action.preferences,
      };
    default: {
      return state;
    }
  }
};

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/* @flow */
const SHORTCUT_ESCAPE = 'SHORTCUT_ESCAPE';
const SHORTCUT_LEFT = 'SHORTCUT_LEFT';
const SHORTCUT_RIGHT = 'SHORTCUT_RIGHT';

type ShortcutCallback = (type: string) => void;

export function registerShortcuts(
  target: EventTarget,
  callback: ShortcutCallback
) {
  const boundKeyHandler = evt => {
    const { key, keyCode, which } = evt;

    if (key === 'Escape' || keyCode === 27 || which === 27) {
      callback(SHORTCUT_ESCAPE);
    } else if (key === 'ArrowLeft' || keyCode === 37 || which === 37) {
      callback(SHORTCUT_LEFT);
    } else if (key === 'ArrowRight' || keyCode === 39 || which === 39) {
      callback(SHORTCUT_RIGHT);
    }
  };
  target.addEventListener('keydown', boundKeyHandler);
  return () => {
    target.removeEventListener('keydown', boundKeyHandler);
  };
}

export { SHORTCUT_ESCAPE, SHORTCUT_LEFT, SHORTCUT_RIGHT };

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/* @flow */
type ErrorCallback = (error: Error) => void;

function errorHandler(callback: ErrorCallback, e: Event): void {
  if (!e.error) {
    return;
  }
  
  // $FlowFixMe
  const { error } = e;
  if (error instanceof Error) {
    callback(error);
  } else {
    // A non-error was thrown, we don't have a trace. :(
    // Look in your browser's devtools for more information
    callback(new Error(error));
  }
}

export function registerUnhandledError(target: EventTarget, callback: ErrorCallback) {
  const boundErrorHandler = errorHandler.bind(undefined, callback);
  target.addEventListener('error', boundErrorHandler);
  return () => {
    target.removeEventListener('error', boundErrorHandler);
  }
}

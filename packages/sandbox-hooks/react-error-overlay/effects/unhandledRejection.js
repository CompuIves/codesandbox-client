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

export function registerUnhandledRejection(
  target: EventTarget,
  callback: ErrorCallback
) {
  const rejectionHandler = err => {
    if (err == null || err.reason == null) {
      return callback(new Error('Unknown'));
    }

    const { reason } = err;
    if (reason instanceof Error) {
      return callback(reason);
    }

    // A non-error was rejected, we don't have a trace :(
    // Look in your browser's devtools for more information
    return callback(new Error(reason));
  };
  
  target.addEventListener('unhandledrejection', rejectionHandler);

  return () => {
    target.removeEventListener('unhandledrejection', rejectionHandler);
  };
}

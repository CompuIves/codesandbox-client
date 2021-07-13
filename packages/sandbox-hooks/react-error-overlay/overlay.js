/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/* @flow */
import { transformError } from 'codesandbox-api';
import { getCurrentManager } from 'app/src/sandbox/compile';

import { listenToRuntimeErrors } from './listenToRuntimeErrors';

import {
  consume as consumeError,
  getErrorRecord,
  drain as drainErrors,
} from './utils/errorRegister';
import type { ErrorRecordReference } from './utils/errorRegister';

import type { StackFrame } from './utils/stack-frame';
import { iframeStyle } from './styles';
import { applyStyles } from './utils/dom/css';
import { createOverlay } from './components/overlay';
import { updateAdditional } from './components/additional';

import buildError from '../errors';

const CONTEXT_SIZE: number = 3;
let iframeReference: HTMLIFrameElement | null = null;
let additionalReference = null;
let errorReferences: ErrorRecordReference[] = [];
let currReferenceIndex: number = -1;

function render(
  name: ?string,
  message: string,
  resolvedFrames: StackFrame[],
  error
) {
  disposeCurrentView();

  const iframe = window.document.createElement('iframe');
  applyStyles(iframe, iframeStyle);
  iframeReference = iframe;
  iframe.onload = () => {
    if (iframeReference == null) {
      return;
    }
    const w = iframeReference.contentWindow;
    const document = iframeReference.contentDocument;

    const { overlay, additional } = createOverlay(
      document,
      error,
      name,
      message,
      resolvedFrames,
      CONTEXT_SIZE,
      currReferenceIndex + 1,
      errorReferences.length,
      offset => {
        switchError(offset);
      },
      () => {
        unmount();
      }
    );
    if (w != null) {
      w.onkeydown = event => {
        keyEventHandler(type => shortcutHandler(type), event);
      };
    }
    if (document.body != null) {
      document.body.style.margin = '0';
      // Keep popup within body boundaries for iOS Safari
      // $FlowFixMe
      document.body.style['max-width'] = '100vw';

      (document.body: any).appendChild(overlay);
    }
    additionalReference = additional;
  };
  window.document.body.appendChild(iframe);
}

function renderErrorByIndex(index: number) {
  currReferenceIndex = index;

  const { error, unhandledRejection, enhancedFrames } = getErrorRecord(
    errorReferences[index]
  );

  if (unhandledRejection) {
    render(
      'Unhandled Rejection (' + error.name + ')',
      error.message,
      enhancedFrames,
      error
    );
  } else {
    render(error.name, error.message, enhancedFrames, error);
  }
}

const SHORTCUT_ESCAPE = 1;
const SHORTCUT_LEFT = 2;
const SHORTCUT_RIGHT = 3;

function keyEventHandler(cb, event) {
  if (event.key === 'Escape' || event.key === 'Esc') {
    cb(SHORTCUT_ESCAPE);
  } else if (event.key === 'Left' || event.key === 'ArrowLeft') {
    cb(SHORTCUT_LEFT);
  } else if (event.key === 'Right' || event.key === 'ArrowRight') {
    cb(SHORTCUT_RIGHT);
  }
}

function switchError(offset) {
  if (errorReferences.length === 0) {
    return;
  }

  let nextView = currReferenceIndex + offset;

  if (nextView < 0) {
    nextView = errorReferences.length - 1;
  } else if (nextView >= errorReferences.length) {
    nextView = 0;
  }

  renderErrorByIndex(nextView);
}

function disposeCurrentView(force: boolean) {
  // CodeSandbox already resets this, only do this if force is on
  if (force) {
    if (iframeReference == null) {
      return;
    }
    try {
      window.document.body.removeChild(iframeReference);
    } catch (e) {
      console.error(e);
    }
  }
  iframeReference = null;
  additionalReference = null;
}

function unmount(force: boolean = true) {
  disposeCurrentView(force);
  drainErrors();
  errorReferences = [];
  currReferenceIndex = -1;
}

function sendErrorsToEditor() {
  errorReferences.forEach(ref => {
    const error = getErrorRecord(ref);
    buildError(error);
  });
}

/**
 * Transforms the error with give transformers to codesandbox-api, this adds
 * suggestions and can alter the error name + message.
 */
function transformErrors() {
  const manager = getCurrentManager();
  if (manager) {
    errorReferences.forEach(ref => {
      const errRef = getErrorRecord(ref);

      const relevantFrame = errRef.enhancedFrames.find(r => {
        try {
          return (
            manager &&
            !!manager.resolveTranspiledModuleSync(
              (r._originalFileName || r.fileName || '').replace(
                location.origin,
                ''
              ),
              '/'
            )
          );
        } catch (e) {
          /* don't do anything */
          return false;
        }
      });

      let { tModule } = errRef.error;

      if (!tModule && relevantFrame) {
        const fileName =
          relevantFrame._originalFileName || relevantFrame.fileName || '';
        tModule = manager.resolveTranspiledModuleSync(
          fileName.replace(location.origin, ''),
          '/'
        );
      }

      if (!tModule) {
        return;
      }

      try {
        const transformation = transformError(
          errRef.error,
          tModule,
          manager.getTranspiledModules()
        );

        if (transformation) {
          const newError = new Error(transformation.name || errRef.error.name);
          newError.message = transformation.message;
          newError.suggestions = transformation.suggestions;
          newError.originalName = errRef.error.name;
          newError.originalMessage = errRef.error.message;
          errRef.error = newError;
        }
      } catch (ex) {
        /* just catch */
        console.error(ex);
      }
    });
  }
}

function crash(
  error: Error,
  unhandledRejection = false,
  renderErrorOverlay = true
) {
  if (module.hot && typeof module.hot.decline === 'function') {
    module.hot.decline();
  }

  consumeError(error, unhandledRejection, CONTEXT_SIZE)
    .then(ref => {
      if (ref == null) {
        return;
      }

      errorReferences.push(ref);

      sendErrorsToEditor();
      transformErrors();
      if (renderErrorOverlay) {
        if (iframeReference !== null && additionalReference !== null) {
          updateAdditional(
            iframeReference.contentDocument,
            additionalReference,
            currReferenceIndex + 1,
            errorReferences.length,
            offset => {
              switchError(offset);
            }
          );
        } else {
          if (errorReferences.length !== 1) {
            throw new Error('Something is *really* wrong.');
          }
          renderErrorByIndex((currReferenceIndex = 0));
        }
      }
    })
    .catch(e => {
      console.log('Could not consume error:', e);
    });
}

function shortcutHandler(type: string) {
  switch (type) {
    case SHORTCUT_ESCAPE: {
      unmount();
      break;
    }
    case SHORTCUT_LEFT: {
      switchError(-1);
      break;
    }
    case SHORTCUT_RIGHT: {
      switchError(1);
      break;
    }
    default: {
      // TODO: this
      break;
    }
  }
}

let listenToRuntimeErrorsUnmounter;

function unregisterErrorHandlers() {
  if (listenToRuntimeErrorsUnmounter) {
    listenToRuntimeErrorsUnmounter();
    listenToRuntimeErrorsUnmounter = null;
  }
}

function uninject(force) {
  unregisterErrorHandlers();
  unmount(force);
}

function inject(renderErrorOverlay = true) {
  // Remove existing listeners if there are any
  unregisterErrorHandlers();

  listenToRuntimeErrorsUnmounter = listenToRuntimeErrors(error => {
    crash(error.error, false, renderErrorOverlay);
  });
}

export { inject, uninject, unmount };

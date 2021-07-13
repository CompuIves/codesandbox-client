// @flow
import { dispatch, actions } from 'codesandbox-api';
import { getCurrentManager } from 'app/src/sandbox/compile';
import type TranspiledModule from 'app/src/sandbox/eval/transpiled-module';

import type { ErrorRecord } from 'sandbox-hooks/react-error-overlay/utils/errorRegister';

type TModuleError = Error & {
  hideLine?: boolean,
  line?: number,
  path?: Object,
  severity?: string,
  payload?: Object,
  tModule?: TranspiledModule,
};

function buildErrorMessage(e: TModuleError) {
  const title = e.name;
  const message = e.message;
  let line = null;
  let column = null;
  if (!e.hideLine) {
    // Safari
    if (e.line != null) {
      line = e.line;

      // FF
    } else if (e.lineNumber != null) {
      line = e.lineNumber;

      // Chrome
    } else if (e.stack) {
      const matched = e.stack.match(/<anonymous>:(\d+):(\d+)/);
      if (matched) {
        line = matched[1];
        column = matched[2];
      } else {
        // Maybe it's a babel transpiler error
        const babelMatched = e.stack.match(/(\d+):(\d+)/);
        if (babelMatched) {
          line = babelMatched[1];
          column = babelMatched[2];
        }
      }
    }
  }

  return {
    path: e.tModule ? e.tModule.module.path : e.path,
    title,
    message,
    line: parseInt(line, 10),
    column: parseInt(column, 10),
    payload: e.payload || {},
    severity: e.severity || 'error',
  };
}

const wrappedResolveModule = (manager, path) => {
  try {
    return manager && manager.resolveTranspiledModuleSync(path, '/');
  } catch (e) {
    return null;
  }
};

function buildDynamicError(ref: ErrorRecord) {
  // TODO remove this logic for the SSE handler, move it to something more generic
  // like a file store
  const manager = getCurrentManager();

  const relevantFrame = ref.enhancedFrames.find(r =>
    wrappedResolveModule(
      manager,
      (r._originalFileName || r.fileName || '')
        .replace(location.origin, '')
        .replace('file://', '')
    )
  );

  if (relevantFrame && manager) {
    const fileName = relevantFrame._originalFileName || relevantFrame.fileName;
    if (fileName) {
      const tModule = manager.resolveTranspiledModuleSync(
        fileName.replace(location.origin, '').replace('file://', ''),
        '/'
      );

      if (tModule) {
        const module = tModule.module;
        return {
          type: 'action',
          action: 'show-error',
          path: module.parent ? module.parent.path : module.path,
          title: ref.error.name,
          message: ref.error.message,
          line: relevantFrame._originalLineNumber,
          column: relevantFrame._originalColumnNumber,
          payload: {
            frames: ref.enhancedFrames,
          },
          severity: 'error',
        };
      }
    }
  } else {
    const error: TModuleError = ref.error;
    const tModule =
      error.tModule ||
      wrappedResolveModule(
        manager,
        (error.fileName || '')
          .replace(location.origin, '')
          .replace('file://', '')
      );

    if (tModule) {
      const newError = {
        ...buildErrorMessage(error),
        path: error.fileName,
        type: 'action',
        action: 'show-error',
      };

      return newError;
    }
  }

  return null;
}

/* eslint-disable no-underscore-dangle */
export default function showError(ref: ErrorRecord) {
  const errorToSend = buildDynamicError(ref);
  if (errorToSend) {
    dispatch(
      actions.error.show(errorToSend.title, errorToSend.message, {
        line: errorToSend.line,
        column: errorToSend.column,
        path: errorToSend.path,
        payload: errorToSend.payload,
      })
    );
  } else {
    // Show based on error
    dispatch(
      actions.error.show(ref.error.name, ref.error.message, {
        line: ref.error.lineNumber,
        column: ref.error.columnNumber,
        path: ref.error.fileName,
        payload: {},
      })
    );
  }
}

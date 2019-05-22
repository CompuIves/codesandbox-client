import { logError } from '@codesandbox/common/lib/utils/analytics';
import { values } from 'lodash-es';
import { camelizeKeys, decamelizeKeys } from 'humps';
// import { addNotification } from '../factories';

/*
  This effect needs to expose a "configure" method where jwt
  and error action is passed in
*/
const API_ROOT = '/api/v1';

function createHeaders({ state, jwt }) {
  const foundJwt = state.get('jwt') || jwt.get();

  return foundJwt
    ? {
        Authorization: `Bearer ${foundJwt}`,
      }
    : {};
}

const getMessage = (error: Error & { response?: any }) => {
  const response = error.response;

  if (!response || response.status >= 500) {
    logError(error);
  }

  if (response && response.result) {
    if (response.result.errors) {
      const errors = values(response.result.errors)[0];
      if (Array.isArray(errors)) {
        if (errors[0]) {
          error.message = errors[0]; // eslint-disable-line no-param-reassign
        }
      } else {
        error.message = errors; // eslint-disable-line no-param-reassign
      }
    } else if (response.result.error) {
      error.message = response.result.error; // eslint-disable-line no-param-reassign
    } else if (response.status === 413) {
      return 'File too large, upload limit is 5MB.';
    }
  }

  return error.message;
};

const showError = (error, controller) => {
  const errorMessage = getMessage(error);

  /*
    TODO: This needs to be handled differently!
  controller.runSignal(
    'showNotification',
    addNotification(errorMessage, 'error')
  );
  */

  error.apiMessage = errorMessage; // eslint-disable-line no-param-reassign
};

const handleError = (error, controller) => {
  try {
    showError(error, controller);
  } catch (e) {
    console.error(e);
  }

  throw error;
};

function handleResponse(response, { shouldCamelize = true } = {}) {
  const camelizedData = shouldCamelize
    ? camelizeKeys(response.result)
    : response.result;

  // Quickfix to prevent underscored dependencies from being camelized.
  // Never store data as keys in the future.
  if (
    camelizedData &&
    camelizedData.data &&
    camelizedData.data.npmDependencies
  ) {
    camelizedData.data.npmDependencies = response.result.data.npm_dependencies;
  }

  return camelizedData.data ? camelizedData.data : camelizedData;
}

export default {
  get(path, query, options) {
    return this.context.http
      .get(API_ROOT + path, query, {
        headers: createHeaders(this.context),
      })
      .then(response => handleResponse(response, options))
      .catch(e => handleError(e, this.context.controller));
  },
  post(path, body, options) {
    return this.context.http
      .post(API_ROOT + path, decamelizeKeys(body), {
        headers: createHeaders(this.context),
      })
      .then(response => handleResponse(response, options))
      .catch(e => handleError(e, this.context.controller));
  },
  patch(path, body, options) {
    return this.context.http
      .patch(API_ROOT + path, decamelizeKeys(body), {
        headers: createHeaders(this.context),
      })
      .then(response => handleResponse(response, options))
      .catch(e => handleError(e, this.context.controller));
  },
  put(path, body, options) {
    return this.context.http
      .put(API_ROOT + path, decamelizeKeys(body), {
        headers: createHeaders(this.context),
      })
      .then(response => handleResponse(response, options))
      .catch(e => handleError(e, this.context.controller));
  },
  delete(path, query, options) {
    return this.context.http
      .delete(API_ROOT + path, query, {
        headers: createHeaders(this.context),
      })
      .then(response => handleResponse(response, options))
      .catch(e => handleError(e, this.context.controller));
  },
  request(options) {
    return this.context.http
      .request(
        Object.assign(options, {
          url: API_ROOT + options.url,
          body: options.body ? camelizeKeys(options.body) : null,
          headers: createHeaders(this.context),
        })
      )
      .then(response => handleResponse(response, options))
      .catch(e => handleError(e, this.context.controller));
  },
};

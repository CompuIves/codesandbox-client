import {
  ModuleTab,
  NotificationButton,
  Sandbox,
  ServerContainerStatus,
  ServerStatus,
  TabType,
} from '@codesandbox/common/lib/types';
import { patronUrl } from '@codesandbox/common/lib/utils/url-generator';
import { NotificationMessage } from '@codesandbox/notifications/lib/state';
import { NotificationStatus } from '@codesandbox/notifications';
import values from 'lodash-es/values';

import { ApiError } from './effects/api/apiFactory';
import { defaultOpenedModule, mainModule } from './utils/main-module';
import { parseConfigurations } from './utils/parse-configurations';
import { Action, AsyncAction } from '.';

export const signIn: AsyncAction<{ useExtraScopes?: boolean }> = async (
  { state, effects, actions },
  options
) => {
  effects.analytics.track('Sign In', {});
  try {
    const jwt = await actions.internal.signInGithub(options);
    actions.internal.setJwt(jwt);
    state.user = await effects.api.getCurrentUser();
    actions.internal.setPatronPrice();
    actions.internal.setSignedInCookie();
    effects.analytics.identify('signed_in', true);
    effects.analytics.setUserId(state.user.id, state.user.email);
    actions.internal.setStoredSettings();
    effects.live.connect();
    actions.userNotifications.internal.initialize(); // Seemed a bit different originally?
    actions.refetchSandboxInfo();
    state.isAuthenticating = false;
  } catch (error) {
    actions.internal.handleError({
      message: 'Could not authenticate with Github',
      error,
    });
  }
};

export const setStoredSettings: Action = ({ state, effects }) => {
  const settings = effects.settingsStore.getAll();

  if (settings.keybindings) {
    settings.keybindings = Object.keys(settings.keybindings).reduce(
      (value, key) =>
        value.concat({
          key,
          bindings: settings.keybindings[key],
        }),
      [] as Array<{ key: string; bindings: string }>
    );
  }

  Object.assign(state.preferences.settings, settings);
};

export const setPatronPrice: Action = ({ state }) => {
  if (!state.user) {
    return;
  }

  state.patron.price = state.user.subscription
    ? Number(state.user.subscription.amount)
    : 10;
};

export const setSignedInCookie: Action = ({ state }) => {
  document.cookie = 'signedIn=true; Path=/;';
};

export const showUserSurveyIfNeeded: Action = ({ state, effects, actions }) => {
  if (state.user?.sendSurvey) {
    // Let the server know that we've seen the survey
    effects.api.markSurveySeen();

    effects.notificationToast.add({
      title: 'Help improve CodeSandbox',
      message:
        "We'd love to hear your thoughts, it's 7 questions and will only take 2 minutes.",
      status: NotificationStatus.NOTICE,
      sticky: true,
      actions: {
        primary: {
          label: 'Open Survey',
          run: () => {
            actions.modalOpened({
              modal: 'userSurvey',
            });
          },
        },
      },
    });
  }
};

export const addNotification: Action<{
  title: string;
  type: 'notice' | 'success' | 'warning' | 'error';
  timeAlive?: number;
  buttons?: Array<NotificationButton>;
}> = ({ state }, { title, type, timeAlive, buttons }) => {
  const now = Date.now();
  const timeAliveDefault = type === 'error' ? 6 : 3;

  state.notifications.push({
    id: now,
    title,
    type,
    buttons: buttons || [],
    endTime: now + (timeAlive || timeAliveDefault) * 1000,
  });
};

export const authorize: AsyncAction = async ({ state, effects }) => {
  try {
    state.authToken = await effects.api.getAuthToken();
  } catch (error) {
    state.editor.error = error.message;
  }
};

export const signInGithub: Action<
  { useExtraScopes?: boolean },
  Promise<string>
> = ({ effects }, options) => {
  const authPath =
    process.env.LOCAL_SERVER || process.env.STAGING
      ? '/auth/dev'
      : `/auth/github${options.useExtraScopes ? '?scope=user:email,repo' : ''}`;

  const popup = effects.browser.openPopup(authPath, 'sign in');

  return effects.browser
    .waitForMessage<{ jwt: string }>('signin')
    .then(data => {
      const { jwt } = data;

      popup.close();

      if (jwt) {
        return jwt;
      }

      throw new Error('Could not get sign in token');
    });
};

export const setJwt: Action<string> = ({ state, effects }, jwt) => {
  effects.jwt.set(jwt);
  state.jwt = jwt;
};

export const closeModals: Action<boolean> = ({ state, effects }, isKeyDown) => {
  if (
    state.currentModal === 'preferences' &&
    state.preferences.itemId === 'keybindings' &&
    isKeyDown
  ) {
    return;
  }

  state.currentModal = null;
};

export const setCurrentSandbox: AsyncAction<Sandbox> = async (
  { state, effects, actions },
  sandbox
) => {
  state.editor.sandboxes[sandbox.id] = sandbox;
  state.editor.currentId = sandbox.id;

  let { currentModuleShortid } = state.editor;
  const parsedConfigs = parseConfigurations(sandbox);
  const main = mainModule(sandbox, parsedConfigs);

  state.editor.mainModuleShortid = main.shortid;

  // Only change the module shortid if it doesn't exist in the new sandbox
  // This can happen when a sandbox is opened that's different from the current
  // sandbox, with completely different files
  if (
    !sandbox.modules.find(module => module.shortid === currentModuleShortid)
  ) {
    const defaultModule = defaultOpenedModule(sandbox, parsedConfigs);

    currentModuleShortid = defaultModule.shortid;
  }

  const sandboxOptions = effects.router.getSandboxOptions();

  if (sandboxOptions.currentModule) {
    try {
      const resolvedModule = effects.utils.resolveModule(
        sandboxOptions.currentModule,
        sandbox.modules,
        sandbox.directories,
        // currentModule is a string... something wrong here?
        // @ts-ignore
        sandboxOptions.currentModule.directoryShortid
      );
      currentModuleShortid = resolvedModule
        ? resolvedModule.shortid
        : currentModuleShortid;
    } catch (error) {
      actions.internal.handleError({
        message: `Could not find module ${sandboxOptions.currentModule}`,
        error,
      });
    }
  }

  state.editor.currentModuleShortid = currentModuleShortid;
  state.editor.workspaceConfigCode = '';

  state.server.status = ServerStatus.INITIALIZING;
  state.server.containerStatus = ServerContainerStatus.INITIALIZING;
  state.server.error = null;
  state.server.hasUnrecoverableError = false;
  state.server.ports = [];

  const newTab: ModuleTab = {
    type: TabType.MODULE,
    moduleShortid: currentModuleShortid,
    dirty: true,
  };

  state.editor.tabs = [newTab];

  state.preferences.showPreview = Boolean(
    sandboxOptions.isPreviewScreen || sandboxOptions.isSplitScreen
  );

  state.preferences.showEditor = Boolean(
    sandboxOptions.isEditorScreen || sandboxOptions.isSplitScreen
  );

  if (sandboxOptions.initialPath)
    state.editor.initialPath = sandboxOptions.initialPath;
  if (sandboxOptions.fontSize)
    state.preferences.settings.fontSize = sandboxOptions.fontSize;
  if (sandboxOptions.highlightedLines)
    state.editor.highlightedLines = sandboxOptions.highlightedLines;
  if (sandboxOptions.hideNavigation)
    state.preferences.hideNavigation = sandboxOptions.hideNavigation;
  if (sandboxOptions.isInProjectView)
    state.editor.isInProjectView = sandboxOptions.isInProjectView;
  if (sandboxOptions.autoResize)
    state.preferences.settings.autoResize = sandboxOptions.autoResize;
  if (sandboxOptions.enableEslint)
    state.preferences.settings.enableEslint = sandboxOptions.enableEslint;
  if (sandboxOptions.forceRefresh)
    state.preferences.settings.forceRefresh = sandboxOptions.forceRefresh;
  if (sandboxOptions.expandDevTools)
    state.preferences.showDevtools = sandboxOptions.expandDevTools;
  if (sandboxOptions.runOnClick)
    state.preferences.runOnClick = sandboxOptions.runOnClick;

  state.workspace.project.title = sandbox.title || '';
  state.workspace.project.description = sandbox.description || '';
  state.workspace.project.alias = sandbox.alias || '';

  actions.server.startContainer(sandbox);
};

export const closeTabByIndex: Action<number> = ({ state }, tabIndex) => {
  const { currentModule } = state.editor;
  const tabs = state.editor.tabs as ModuleTab[];
  const isActiveTab = currentModule.shortid === tabs[tabIndex].moduleShortid;

  if (isActiveTab) {
    const newTab = tabIndex > 0 ? tabs[tabIndex - 1] : tabs[tabIndex + 1];

    if (newTab) {
      state.editor.currentModuleShortid = newTab.moduleShortid;
    }
  }

  state.editor.tabs.splice(tabIndex, 1);
};

export const getErrorMessage: Action<{ error: ApiError | Error }, string> = (
  context,
  { error }
) => {
  const isGenericError =
    !('response' in error) ||
    error.response == null ||
    error.response.status >= 500;

  if (isGenericError) {
    return error.message;
  }

  const { response } = error as ApiError;
  /*
    Update error message with what is coming from the server
  */
  const result = response?.data;

  if (result) {
    if (typeof result === 'string') {
      return result;
    }
    if ('errors' in result) {
      const errors = values(result.errors)[0];
      const fields = Object.keys(result.errors);
      if (Array.isArray(errors)) {
        if (errors[0]) {
          if (fields[0] === 'detail') {
            return errors[0];
          }
          return `${fields[0]}: ${errors[0]}`; // eslint-disable-line no-param-reassign,prefer-destructuring
        }
      } else {
        return errors; // eslint-disable-line no-param-reassign
      }
    } else if (result.error) {
      if (result.error.message) {
        return result.error.message;
      }

      return result.error; // eslint-disable-line no-param-reassign
    } else if (response?.status === 413) {
      return 'File too large, upload limit is 5MB.';
    }
  }

  return error.message;
};

export const handleError: Action<{
  /*
    The message that will show as title of the notification
  */
  message: string;
  error: ApiError | Error;
  hideErrorMessage?: boolean;
}> = ({ actions, effects }, { message, error, hideErrorMessage = false }) => {
  if (hideErrorMessage) {
    effects.analytics.logError(error);
    effects.notificationToast.add({
      message,
      status: NotificationStatus.ERROR,
    });

    return;
  }

  const isGenericError =
    !('response' in error) ||
    error.response == null ||
    error.response.status >= 500;

  if (isGenericError) {
    effects.analytics.logError(error);
    effects.notificationToast.add({
      title: message,
      message: error.message,
      status: NotificationStatus.ERROR,
    });

    return;
  }

  const { response } = error as ApiError;

  if (response?.status === 401) {
    // Reset existing sign in info
    effects.jwt.reset();
    effects.analytics.setAnonymousId();

    // Allow user to sign in again in notification
    effects.notificationToast.add({
      message: 'Your session seems to be expired, please log in again...',
      status: NotificationStatus.ERROR,
      actions: {
        primary: {
          label: 'Sign in',
          run: () => actions.signInClicked(),
        },
      },
    });

    return;
  }

  error.message = actions.internal.getErrorMessage({ error });

  const notificationActions: NotificationMessage['actions'] = {};

  if (error.message.startsWith('You need to sign in to create more than')) {
    // Error for "You need to sign in to create more than 10 sandboxes"
    effects.analytics.track('Anonymous Sandbox Limit Reached', {
      errorMessage: error.message,
    });

    notificationActions.primary = {
      label: 'Sign in',
      run: () => {
        actions.internal.signIn({});
      },
    };
  } else if (error.message.startsWith('You reached the maximum of')) {
    effects.analytics.track('Non-Patron Sandbox Limit Reached', {
      errorMessage: error.message,
    });

    notificationActions.primary = {
      label: 'Open Patron Page',
      run: () => {
        window.open(patronUrl(), '_blank');
      },
    };
  } else if (
    error.message.startsWith(
      'You reached the limit of server sandboxes, you can create more server sandboxes as a patron.'
    )
  ) {
    effects.analytics.track('Non-Patron Server Sandbox Limit Reached', {
      errorMessage: error.message,
    });

    notificationActions.primary = {
      label: 'Open Patron Page',
      run: () => {
        window.open(patronUrl(), '_blank');
      },
    };
  } else if (
    error.message.startsWith(
      'You reached the limit of server sandboxes, we will increase the limit in the future. Please contact hello@codesandbox.io for more server sandboxes.'
    )
  ) {
    effects.analytics.track('Patron Server Sandbox Limit Reached', {
      errorMessage: error.message,
    });
  }

  effects.notificationToast.add({
    title: message,
    message: error.message,
    status: NotificationStatus.ERROR,
    ...(notificationActions.primary ? { actions: notificationActions } : {}),
  });
};

export const trackCurrentTeams: AsyncAction = async ({ effects }) => {
  const { me } = await effects.gql.queries.teams({});
  if (me) {
    effects.analytics.setGroup(
      'teamName',
      me.teams.map(m => m.name)
    );
    effects.analytics.setGroup(
      'teamId',
      me.teams.map(m => m.id)
    );
  }
};

export const identifyCurrentUser: AsyncAction = async ({ state, effects }) => {
  const user = state.user;
  if (user) {
    effects.analytics.identify('pilot', user.experiments.inPilot);

    const profileData = await effects.api.getProfile(user.username);
    effects.analytics.identify('sandboxCount', profileData.sandboxCount);
    effects.analytics.identify('pro', Boolean(profileData.subscriptionSince));
    effects.analytics.identify(
      'receivedViewCount',
      Boolean(profileData.viewCount)
    );
  }
};

const seenTermsKey = 'ACCEPTED_TERMS_CODESANDBOX';
export const showPrivacyPolicyNotification: Action = ({ effects, state }) => {
  if (effects.browser.storage.get(seenTermsKey)) {
    return;
  }

  if (!state.isFirstVisit) {
    effects.analytics.track('Saw Privacy Policy Notification');
    effects.notificationToast.add({
      message:
        'Hello, our privacy policy has been updated recently. What’s new? CodeSandbox emails. Please read and reach out.',
      title: 'Updated Privacy',
      status: NotificationStatus.NOTICE,
      sticky: true,
      actions: {
        primary: {
          label: 'Open Privacy Policy',
          run: () => {
            window.open('https://codesandbox.io/legal/privacy', '_blank');
          },
        },
      },
    });
  }

  effects.browser.storage.set(seenTermsKey, true);
};

const VIEW_MODE_DASHBOARD = 'VIEW_MODE_DASHBOARD';
export const setViewModeForDashboard: Action = ({ effects, state }) => {
  const localStorageViewMode = effects.browser.storage.get(VIEW_MODE_DASHBOARD);
  if (localStorageViewMode) {
    state.dashboard.viewMode = localStorageViewMode;
  }
};

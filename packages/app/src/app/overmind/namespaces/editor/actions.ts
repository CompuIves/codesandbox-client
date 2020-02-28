import { resolveModule } from '@codesandbox/common/lib/sandbox/modules';
import getTemplate from '@codesandbox/common/lib/templates';
import {
  EnvironmentVariable,
  ModuleCorrection,
  ModuleError,
  ModuleTab,
  WindowOrientation,
} from '@codesandbox/common/lib/types';
import { getTextOperation } from '@codesandbox/common/lib/utils/diff';
import { hasPermission, convertTypeToStatus } from '@codesandbox/common/lib/utils/permission';
import { NotificationStatus } from '@codesandbox/notifications';
import { Action, AsyncAction } from 'app/overmind';
import { withLoadApp, withOwnedSandbox } from 'app/overmind/factories';
import {
  addDevToolsTab as addDevToolsTabUtil,
  closeDevToolsTab as closeDevToolsTabUtil,
  moveDevToolsTab as moveDevToolsTabUtil,
} from 'app/pages/Sandbox/Editor/Content/utils';
import { clearCorrectionsFromAction } from 'app/utils/corrections';
import { json } from 'overmind';

import eventToTransform from '../../utils/event-to-transform';
import { SERVER } from '../../utils/items';
import * as internalActions from './internalActions';

export const internal = internalActions;

export const onNavigateAway: Action = () => {};

export const addNpmDependency: AsyncAction<{
  name: string;
  version?: string;
  isDev?: boolean;
}> = withOwnedSandbox(
  async ({ actions, effects, state }, { name, version, isDev }) => {
    effects.analytics.track('Add NPM Dependency');
    state.currentModal = null;
    let newVersion = version;

    if (!newVersion) {
      const dependency = await effects.api.getDependency(name);
      newVersion = dependency.version;
    }

    await actions.editor.internal.addNpmDependencyToPackageJson({
      name,
      version: newVersion,
      isDev: Boolean(isDev),
    });

    effects.preview.executeCodeImmediately();
  }
);

export const npmDependencyRemoved: AsyncAction<string> = withOwnedSandbox(
  async ({ actions, effects }, name) => {
    effects.analytics.track('Remove NPM Dependency');

    await actions.editor.internal.removeNpmDependencyFromPackageJson(name);

    effects.preview.executeCodeImmediately();
  }
);

export const sandboxChanged: AsyncAction<{ id: string }> = withLoadApp<{
  id: string;
}>(async ({ state, actions, effects }, { id }) => {
  // This happens when we fork. This can be avoided with state first routing
  if (state.editor.isForkingSandbox && state.editor.currentSandbox) {
    effects.vscode.openModule(state.editor.currentModule);

    await actions.editor.internal.initializeLiveSandbox(
      state.editor.currentSandbox
    );

    state.editor.isForkingSandbox = false;
  }

  await effects.vscode.closeAllTabs();

  state.editor.error = null;

  let newId = id;

  newId = actions.editor.internal.ensureSandboxId(newId);

  effects.browser.storage.set('currentSandboxId', newId);

  const hasExistingSandbox = Boolean(state.editor.currentId);

  if (state.live.isLive) {
    actions.live.internal.disconnect();
  }

  state.editor.isLoading = !hasExistingSandbox;
  state.editor.notFound = false;

  try {
    const sandbox = await effects.api.getSandbox(newId);

    actions.internal.setCurrentSandbox(sandbox);
    actions.workspace.openDefaultItem();
  } catch (error) {
    state.editor.notFound = true;
    let detail = error.response?.data?.errors?.detail;
    if (Array.isArray(detail)) {
      detail = detail[0];
    }
    state.editor.error = detail || error.message;
    state.editor.isLoading = false;
  }

  const sandbox = state.editor.currentSandbox!;

  await effects.vscode.changeSandbox(sandbox, fs => {
    state.editor.modulesByPath = fs;
  });

  if (sandbox.featureFlags?.containerLsp && !sandbox.owned) {
    effects.vscode.setReadOnly(true);
    effects.notificationToast.add({
      message:
        'This Sandbox is running an experiment. You have to fork it before you can make any changes',
      title: 'Experimental Sandbox',
      status: convertTypeToStatus('notice'),
      sticky: true,
      actions: {
        primary: [
          {
            label: 'Fork',
            run: () => {
              actions.editor.forkSandboxClicked();
            },
          },
        ],
      },
    });
  }

  actions.internal.ensurePackageJSON();

  await actions.editor.internal.initializeLiveSandbox(sandbox);

  if (
    hasPermission(sandbox.authorization, 'write_code') &&
    !state.live.isLive
  ) {
    actions.files.internal.recoverFiles();
  } else if (state.live.isLive) {
    await effects.live.sendModuleStateSyncRequest();
  }

  effects.vscode.openModule(state.editor.currentModule);
  effects.preview.executeCodeImmediately({ initialRender: true });

  state.editor.isLoading = false;
});

export const contentMounted: Action = ({ state, effects }) => {
  effects.browser.onUnload(event => {
    if (!state.editor.isAllModulesSynced && !state.editor.isForkingSandbox) {
      const returnMessage =
        'You have not saved all your modules, are you sure you want to close this tab?';

      event.returnValue = returnMessage; // eslint-disable-line

      return returnMessage;
    }

    return null;
  });
};

export const resizingStarted: Action = ({ state }) => {
  state.editor.isResizing = true;
};

export const resizingStopped: Action = ({ state }) => {
  state.editor.isResizing = false;
};

export const codeSaved: AsyncAction<{
  code: string;
  moduleShortid: string;
  cbID: string | null;
}> = withOwnedSandbox(
  async ({ actions }, { code, moduleShortid, cbID }) => {
    actions.editor.internal.saveCode({
      code,
      moduleShortid,
      cbID,
    });
  },
  async ({ effects }, { cbID }) => {
    if (cbID) {
      effects.vscode.callCallbackError(cbID);
    }
  },
  'write_code'
);

export const onOperationApplied: Action<{
  moduleShortid: string;
  code: string;
}> = ({ state, effects, actions }, { code, moduleShortid }) => {
  if (!state.editor.currentSandbox) {
    return;
  }

  const module = state.editor.currentSandbox.modules.find(
    m => m.shortid === moduleShortid
  );

  if (!module) {
    return;
  }

  actions.editor.internal.setModuleCode({
    module,
    code,
  });

  actions.editor.internal.updatePreviewCode();

  if (module.savedCode !== null && module.code === module.savedCode) {
    effects.vscode.revertModule(module);
  }
};

export const codeChanged: Action<{
  moduleShortid: string;
  code: string;
  event?: any;
}> = ({ effects, state, actions }, { code, event, moduleShortid }) => {
  effects.analytics.trackOnce('Change Code');

  if (!state.editor.currentSandbox) {
    return;
  }

  const module = state.editor.currentSandbox.modules.find(
    m => m.shortid === moduleShortid
  );

  if (!module) {
    return;
  }

  if (state.live.isLive) {
    const operation = event
      ? eventToTransform(event, module.code).operation
      : getTextOperation(module.code, code);

    effects.live.sendCodeUpdate(moduleShortid, operation);
  }

  actions.editor.internal.setModuleCode({
    module,
    code,
  });

  const { isServer } = getTemplate(state.editor.currentSandbox.template);

  if (!isServer && state.preferences.settings.livePreviewEnabled) {
    actions.editor.internal.updatePreviewCode();
  }

  if (module.savedCode !== null && module.code === module.savedCode) {
    effects.vscode.revertModule(module);
  }
};

export const saveClicked: AsyncAction = withOwnedSandbox(
  async ({ state, effects, actions }) => {
    const sandbox = state.editor.currentSandbox;

    if (!sandbox) {
      return;
    }

    try {
      const changedModules = sandbox.modules.filter(module =>
        state.editor.changedModuleShortids.includes(module.shortid)
      );

      const updatedModules = await effects.api.saveModules(
        sandbox.id,
        changedModules
      );

      updatedModules.forEach(updatedModule => {
        const module = sandbox.modules.find(
          moduleItem => moduleItem.shortid === updatedModule.shortid
        );

        if (module) {
          module.insertedAt = updatedModule.insertedAt;
          module.updatedAt = updatedModule.updatedAt;

          module.savedCode =
            updatedModule.code === module.code ? null : updatedModule.code;

          effects.vscode.sandboxFsSync.writeFile(
            state.editor.modulesByPath,
            module
          );
          effects.moduleRecover.remove(sandbox.id, module);
        } else {
          // We might not have the module, as it was created by the server. In
          // this case we put it in. There is an edge case here where the user
          // might delete the module while it is being updated, but it will very
          // likely not happen
          sandbox.modules.push(updatedModule);
        }
      });

      if (
        sandbox.originalGit &&
        state.workspace.openedWorkspaceItem === 'github'
      ) {
        actions.git.internal.fetchGitChanges();
      }

      effects.preview.executeCodeImmediately();
    } catch (error) {
      actions.internal.handleError({
        message: 'There was a problem with saving the files, please try again',
        error,
      });
    }
  }
);

export const createZipClicked: Action = ({ state, effects }) => {
  if (!state.editor.currentSandbox) {
    return;
  }
  effects.zip.download(state.editor.currentSandbox);
};

export const forkExternalSandbox: AsyncAction<{
  sandboxId: string;
  openInNewWindow?: boolean;
  body?: { collectionId: string };
}> = async ({ effects, state }, { sandboxId, openInNewWindow, body }) => {
  effects.analytics.track('Fork Sandbox', { type: 'external' });

  const forkedSandbox = await effects.api.forkSandbox(sandboxId, body);

  state.editor.sandboxes[forkedSandbox.id] = forkedSandbox;
  effects.router.updateSandboxUrl(forkedSandbox, { openInNewWindow });
};

export const forkSandboxClicked: AsyncAction = async ({
  state,
  effects,
  actions,
}) => {
  if (!state.editor.currentSandbox) {
    return;
  }

  if (
    state.editor.currentSandbox.owned &&
    !state.editor.currentSandbox.customTemplate &&
    !effects.browser.confirm('Do you want to fork your own sandbox?')
  ) {
    return;
  }

  await actions.editor.internal.forkSandbox({
    sandboxId: state.editor.currentSandbox.id,
  });
};

export const likeSandboxToggled: AsyncAction<string> = async (
  { state, effects },
  id
) => {
  if (state.editor.sandboxes[id].userLiked) {
    state.editor.sandboxes[id].likeCount--;
    await effects.api.unlikeSandbox(id);
  } else {
    state.editor.sandboxes[id].likeCount++;
    await effects.api.likeSandbox(id);
  }

  state.editor.sandboxes[id].userLiked = !state.editor.sandboxes[id].userLiked;
};

export const moduleSelected: Action<
  | {
      // Id means it is coming from Explorer
      id: string;
      path?: undefined;
    }
  | {
      // Path means it is coming from VSCode
      id?: undefined;
      path: string;
    }
> = ({ actions, effects, state }, { id, path }) => {
  effects.analytics.track('Open File');

  const sandbox = state.editor.currentSandbox;

  if (!sandbox) {
    return;
  }

  try {
    const module = path
      ? effects.utils.resolveModule(
          path.replace(/^\/sandbox\//, ''),
          sandbox.modules,
          sandbox.directories
        )
      : sandbox.modules.filter(moduleItem => moduleItem.id === id)[0];

    if (module.shortid === state.editor.currentModuleShortid) {
      return;
    }

    actions.editor.internal.setCurrentModule(module);

    if (state.live.isLive && state.live.liveUser && state.live.roomInfo) {
      effects.vscode.updateUserSelections(
        module,
        actions.live.internal.getSelectionsForModule(module)
      );
      state.live.liveUser.currentModuleShortid = module.shortid;

      if (state.live.followingUserId) {
        const followingUser = state.live.roomInfo.users.find(
          u => u.id === state.live.followingUserId
        );

        if (
          followingUser &&
          followingUser.currentModuleShortid !== module.shortid
        ) {
          // Reset following as this is a user change module action
          state.live.followingUserId = null;
        }
      }

      effects.live.sendUserCurrentModule(module.shortid);

      if (!state.editor.isInProjectView) {
        actions.editor.internal.updatePreviewCode();
      }
    }
  } catch (error) {
    // You jumped to a file not in the Sandbox, for example typings
    state.editor.currentModuleShortid = null;
  }
};

export const clearModuleSelected: Action = ({ state }) => {
  state.editor.currentModuleShortid = null;
};

export const moduleDoubleClicked: Action = ({ state, effects }) => {
  effects.vscode.runCommand('workbench.action.keepEditor');

  const { currentModule } = state.editor;
  const tabs = state.editor.tabs as ModuleTab[];
  const tab = tabs.find(
    tabItem => tabItem.moduleShortid === currentModule.shortid
  );

  if (tab) {
    tab.dirty = false;
  }
};

export const tabClosed: Action<number> = ({ state, actions }, tabIndex) => {
  if (state.editor.tabs.length > 1) {
    actions.internal.closeTabByIndex(tabIndex);
  }
};

export const tabMoved: Action<{
  prevIndex: number;
  nextIndex: number;
}> = ({ state }, { prevIndex, nextIndex }) => {
  const { tabs } = state.editor;
  const tab = json(tabs[prevIndex]);

  state.editor.tabs.splice(prevIndex, 1);
  state.editor.tabs.splice(nextIndex, 0, tab);
};

export const prettifyClicked: AsyncAction = async ({
  state,
  effects,
  actions,
}) => {
  effects.analytics.track('Prettify Code');
  const module = state.editor.currentModule;
  if (!module.id) {
    return;
  }
  const newCode = await effects.prettyfier.prettify(
    module.id,
    module.title,
    module.code || ''
  );

  actions.editor.codeChanged({
    code: newCode,
    moduleShortid: module.shortid,
  });
};

export const errorsCleared: Action = ({ state, effects }) => {
  const sandbox = state.editor.currentSandbox;
  if (!sandbox) {
    return;
  }

  if (state.editor.errors.length) {
    state.editor.errors.forEach(error => {
      try {
        const module = resolveModule(
          error.path,
          sandbox.modules,
          sandbox.directories
        );
        module.errors = [];
      } catch (e) {
        // Module is probably somewhere in eg. /node_modules which is not
        // in the store
      }
    });
    state.editor.errors = [];
  }
};

export const toggleStatusBar: Action = ({ state }) => {
  state.editor.statusBar = !state.editor.statusBar;
};

export const projectViewToggled: Action = ({ state, actions }) => {
  state.editor.isInProjectView = !state.editor.isInProjectView;
  actions.editor.internal.updatePreviewCode();
};

export const frozenUpdated: AsyncAction<{ frozen: boolean }> = async (
  { state, effects },
  { frozen }
) => {
  if (!state.editor.currentSandbox) {
    return;
  }

  state.editor.currentSandbox.isFrozen = frozen;

  await effects.api.saveFrozen(state.editor.currentSandbox.id, frozen);
};

export const quickActionsOpened: Action = ({ state }) => {
  state.editor.quickActionsOpen = true;
};

export const quickActionsClosed: Action = ({ state }) => {
  state.editor.quickActionsOpen = false;
};

export const setPreviewContent: Action = () => {};

export const togglePreviewContent: Action = ({ state, effects }) => {
  state.editor.previewWindowVisible = !state.editor.previewWindowVisible;
  effects.vscode.resetLayout();
};

export const currentTabChanged: Action<{
  tabId: string;
}> = ({ state }, { tabId }) => {
  state.editor.currentTabId = tabId;
};

export const discardModuleChanges: Action<{
  moduleShortid: string;
}> = ({ state, effects, actions }, { moduleShortid }) => {
  effects.analytics.track('Code Discarded');

  const sandbox = state.editor.currentSandbox;
  if (!sandbox) {
    return;
  }

  const module = sandbox.modules.find(
    moduleItem => moduleItem.shortid === moduleShortid
  );

  if (!module) {
    return;
  }

  module.updatedAt = new Date().toString();
  effects.vscode.revertModule(module);
};

export const fetchEnvironmentVariables: AsyncAction = async ({
  state,
  effects,
}) => {
  if (!state.editor.currentSandbox) {
    return;
  }

  state.editor.currentSandbox.environmentVariables = await effects.api.getEnvironmentVariables(
    state.editor.currentSandbox.id
  );
};

export const updateEnvironmentVariables: AsyncAction<EnvironmentVariable> = async (
  { effects, state },
  environmentVariable
) => {
  if (!state.editor.currentSandbox) {
    return;
  }

  state.editor.currentSandbox.environmentVariables = await effects.api.saveEnvironmentVariable(
    state.editor.currentSandbox.id,
    environmentVariable
  );

  effects.codesandboxApi.restartSandbox();
};

export const deleteEnvironmentVariable: AsyncAction<{
  name: string;
}> = async ({ state, effects }, { name }) => {
  if (!state.editor.currentSandbox) {
    return;
  }

  const { id } = state.editor.currentSandbox;

  state.editor.currentSandbox.environmentVariables = await effects.api.deleteEnvironmentVariable(
    id,
    name
  );
  effects.codesandboxApi.restartSandbox();
};

/**
 * This will let the user know on fork that some secrets need to be set if there are any empty ones
 */
export const showEnvironmentVariablesNotification: AsyncAction = async ({
  state,
  actions,
  effects,
}) => {
  const sandbox = state.editor.currentSandbox;

  if (!sandbox) {
    return;
  }

  await actions.editor.fetchEnvironmentVariables();

  const environmentVariables = sandbox.environmentVariables!;
  const emptyVarCount = Object.keys(environmentVariables).filter(
    key => !environmentVariables[key]
  ).length;
  if (emptyVarCount > 0) {
    effects.notificationToast.add({
      status: NotificationStatus.NOTICE,
      title: 'Unset Secrets',
      message: `This sandbox has ${emptyVarCount} secrets that need to be set. You can set them in the server tab.`,
      actions: {
        primary: [
          {
            label: 'Open Server Tab',
            run: () => {
              actions.workspace.setWorkspaceItem({ item: SERVER.id });
            },
          },
        ],
      },
    });
  }
};

export const toggleEditorPreviewLayout: Action = ({ state, effects }) => {
  const currentOrientation = state.editor.previewWindowOrientation;

  state.editor.previewWindowOrientation =
    currentOrientation === WindowOrientation.VERTICAL
      ? WindowOrientation.HORIZONTAL
      : WindowOrientation.VERTICAL;

  effects.vscode.resetLayout();
};

export const previewActionReceived: Action<any> = (
  { actions, effects, state },
  action
) => {
  switch (action.action) {
    case 'notification':
      effects.notificationToast.add({
        message: action.title,
        status: action.notificationType,
        timeAlive: action.timeAlive,
      });
      break;
    case 'show-error': {
      if (!state.editor.currentSandbox) {
        return;
      }
      const error: ModuleError = {
        column: action.column,
        line: action.line,
        columnEnd: action.columnEnd,
        lineEnd: action.lineEnd,
        message: action.message,
        title: action.title,
        path: action.path,
        source: action.source,
        severity: action.severity,
        type: action.type,
      };
      try {
        const module = resolveModule(
          error.path,
          state.editor.currentSandbox.modules,
          state.editor.currentSandbox.directories
        );

        module.errors.push(json(error));
        state.editor.errors.push(error);
        effects.vscode.setErrors(state.editor.errors);
      } catch (e) {
        /* ignore, this module can be in a node_modules for example */
      }
      break;
    }
    case 'show-correction': {
      if (!state.editor.currentSandbox) {
        return;
      }
      const correction: ModuleCorrection = {
        path: action.path,
        column: action.column,
        line: action.line,
        columnEnd: action.columnEnd,
        lineEnd: action.lineEnd,
        message: action.message,
        source: action.source,
        severity: action.severity,
      };
      try {
        const module = resolveModule(
          correction.path as string,
          state.editor.currentSandbox.modules,
          state.editor.currentSandbox.directories
        );

        state.editor.corrections.push(correction);
        module.corrections.push(json(correction));
        effects.vscode.setCorrections(state.editor.corrections);
      } catch (e) {
        /* ignore, this module can be in a node_modules for example */
      }
      break;
    }
    case 'clear-errors': {
      const sandbox = state.editor.currentSandbox;
      if (!sandbox) {
        return;
      }
      const currentErrors = state.editor.errors;

      const newErrors = clearCorrectionsFromAction(currentErrors, action);

      if (newErrors.length !== currentErrors.length) {
        state.editor.errors.forEach(error => {
          try {
            const module = resolveModule(
              error.path,
              sandbox.modules,
              sandbox.directories
            );

            module.errors = [];
          } catch (e) {
            // Module doesn't exist anymore
          }
        });
        newErrors.forEach(error => {
          const module = resolveModule(
            error.path,
            sandbox.modules,
            sandbox.directories
          );

          module.errors.push(error);
        });
        state.editor.errors = newErrors;
        effects.vscode.setErrors(state.editor.errors);
      }
      break;
    }
    case 'clear-corrections': {
      const sandbox = state.editor.currentSandbox;

      if (!sandbox) {
        return;
      }

      const currentCorrections = state.editor.corrections;

      const newCorrections = clearCorrectionsFromAction(
        currentCorrections,
        action
      );

      if (newCorrections.length !== currentCorrections.length) {
        state.editor.corrections.forEach(correction => {
          try {
            const module = resolveModule(
              correction.path!,
              sandbox.modules,
              sandbox.directories
            );

            module.corrections = [];
          } catch (e) {
            // Module is probably in node_modules or something, which is not in
            // our store
          }
        });
        newCorrections.forEach(correction => {
          const module = resolveModule(
            correction.path!,
            sandbox.modules,
            sandbox.directories
          );

          module.corrections.push(correction);
        });
        state.editor.corrections = newCorrections;
        effects.vscode.setCorrections(state.editor.corrections);
      }
      break;
    }
    case 'source.module.rename': {
      const sandbox = state.editor.currentSandbox;
      if (!sandbox) {
        return;
      }
      const module = effects.utils.resolveModule(
        action.path.replace(/^\//, ''),
        sandbox.modules,
        sandbox.directories
      );

      if (module) {
        const sandboxModule = sandbox.modules.find(
          moduleEntry => moduleEntry.shortid === module.shortid
        );

        if (sandboxModule) {
          sandboxModule.title = action.title;
        }
      }
      break;
    }
    case 'source.dependencies.add': {
      const name = action.dependency;
      actions.editor.addNpmDependency({
        name,
      });
      break;
    }
  }
};

export const renameModule: AsyncAction<{
  title: string;
  moduleShortid: string;
}> = withOwnedSandbox(
  async ({ state, actions, effects }, { title, moduleShortid }) => {
    const sandbox = state.editor.currentSandbox;
    if (!sandbox) {
      return;
    }
    const module = sandbox.modules.find(
      moduleItem => moduleItem.shortid === moduleShortid
    );

    if (!module) {
      return;
    }

    const oldTitle = module.title;

    module.title = title;

    try {
      await effects.api.saveModuleTitle(sandbox.id, moduleShortid, title);

      if (state.live.isCurrentEditor) {
        effects.live.sendModuleUpdate(module);
      }
    } catch (error) {
      module.title = oldTitle;

      actions.internal.handleError({ message: 'Could not rename file', error });
    }
  }
);

export const onDevToolsTabAdded: Action<{
  tab: any;
}> = ({ state, actions }, { tab }) => {
  const { devToolTabs } = state.editor;
  const { devTools: newDevToolTabs, position } = addDevToolsTabUtil(
    json(devToolTabs),
    tab
  );

  const code = JSON.stringify({ preview: newDevToolTabs }, null, 2);
  const nextPos = position;

  actions.editor.internal.updateDevtools({
    code,
  });

  state.editor.currentDevToolsPosition = nextPos;
};

export const onDevToolsTabMoved: Action<{
  prevPos: any;
  nextPos: any;
}> = ({ state, actions }, { prevPos, nextPos }) => {
  const { devToolTabs } = state.editor;
  const newDevToolTabs = moveDevToolsTabUtil(
    json(devToolTabs),
    prevPos,
    nextPos
  );
  const code = JSON.stringify({ preview: newDevToolTabs }, null, 2);

  actions.editor.internal.updateDevtools({
    code,
  });

  state.editor.currentDevToolsPosition = nextPos;
};

export const onDevToolsTabClosed: Action<{
  pos: any;
}> = ({ state, actions }, { pos }) => {
  const { devToolTabs } = state.editor;
  const closePos = pos;
  const newDevToolTabs = closeDevToolsTabUtil(json(devToolTabs), closePos);
  const code = JSON.stringify({ preview: newDevToolTabs }, null, 2);

  actions.editor.internal.updateDevtools({
    code,
  });
};

export const onDevToolsPositionChanged: Action<{
  position: any;
}> = ({ state }, { position }) => {
  state.editor.currentDevToolsPosition = position;
};

export const openDevtoolsTab: Action<{
  tab: any;
}> = ({ state, actions }, { tab: tabToFind }) => {
  const serializedTab = JSON.stringify(tabToFind);
  const { devToolTabs } = state.editor;
  let nextPos;

  for (let i = 0; i < devToolTabs.length; i++) {
    const view = devToolTabs[i];

    for (let j = 0; j < view.views.length; j++) {
      const tab = view.views[j];
      if (JSON.stringify(tab) === serializedTab) {
        nextPos = {
          devToolIndex: i,
          tabPosition: j,
        };
      }
    }
  }

  if (nextPos) {
    state.editor.currentDevToolsPosition = nextPos;
  } else {
    actions.editor.onDevToolsTabAdded({
      tab: tabToFind,
    });
  }
};

export const sessionFreezeOverride: Action<{ frozen: boolean }> = (
  { state },
  { frozen }
) => {
  state.editor.sessionFrozen = frozen;
};

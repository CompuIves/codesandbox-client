import { Badge } from '@codesandbox/common/lib/types';
import { isEqual } from 'lodash-es';
import { saveAs } from 'file-saver';
import { Action, AsyncAction } from 'app/overmind';
import { SettingSync } from './state';

export const viewModeChanged: Action<{
  showEditor: boolean;
  showPreview: boolean;
}> = ({ state }, { showEditor, showPreview }) => {
  state.preferences.showEditor = showEditor;
  state.preferences.showPreview = showPreview;
};

export const devtoolsToggled: Action = ({ state }) => {
  state.preferences.showDevtools = !state.preferences.showDevtools;
};

export const setDevtoolsOpen: Action<boolean> = ({ state }, isOpen) => {
  state.preferences.showDevtools = isOpen;
};

export const itemIdChanged: AsyncAction<string> = async (
  { actions, state },
  itemId
) => {
  state.preferences.itemId = itemId;

  if (itemId === 'integrations') {
    await actions.deployment.internal.getVercelUserDetails();
  }
};

export const settingChanged: Action<{
  value: any;
  name: string;
}> = ({ state, effects }, { name, value }) => {
  const path = name.split('.');
  const firstKey = path[0];
  const lastKey = path.pop();
  const settingsTarget = path.reduce(
    (aggr, pathKey) => aggr[pathKey],
    state.preferences.settings
  );
  settingsTarget[lastKey] = value;

  if (name === 'vimMode') {
    effects.vscode.setVimExtensionEnabled(Boolean(value));
  }

  effects.settingsStore.set(firstKey, state.preferences.settings[firstKey]);

  effects.analytics.track('Change Settings', {
    name,
    value,
  });
};

export const setBadgeVisibility: AsyncAction<Pick<
  Badge,
  'id' | 'visible'
>> = async ({ effects, state }, { id, visible }) => {
  const user = state.user;
  if (!user) {
    return;
  }
  user.badges.forEach((badge, index) => {
    if (badge.id === id) {
      user.badges[index].visible = visible;
    }
  });

  await effects.api.updateBadge(id, visible);
};

export const paymentDetailsRequested: AsyncAction = async ({
  state,
  effects,
}) => {
  state.preferences.isLoadingPaymentDetails = true;
  try {
    state.preferences.paymentDetails = await effects.api.getPaymentDetails();
  } catch (error) {
    state.preferences.paymentDetailError = error.message;
  }
  state.preferences.isLoadingPaymentDetails = false;
};

export const paymentDetailsUpdated: AsyncAction<string> = async (
  { effects, state },
  token
) => {
  state.preferences.isLoadingPaymentDetails = true;
  state.preferences.paymentDetails = await effects.api.updatePaymentDetails(
    token
  );
  state.preferences.isLoadingPaymentDetails = false;

  effects.notificationToast.success('Successfully updated payment details');
};

export const keybindingChanged: Action<{
  name: string;
  value: any;
}> = ({ state, effects }, { name, value }) => {
  const { keybindings } = state.preferences.settings;
  const currentIndex = keybindings.findIndex(binding => binding.key === name);
  const newBinding = {
    key: name,
    bindings: JSON.parse(JSON.stringify(value)),
  };

  if (currentIndex === -1) {
    state.preferences.settings.keybindings.push(newBinding);
  } else {
    state.preferences.settings.keybindings.splice(currentIndex, 1, newBinding);
  }

  const keybindingsValue = keybindings.reduce(
    (currentValue, binding) => ({
      ...currentValue,
      [binding.key]: binding.bindings,
    }),
    {}
  );

  effects.settingsStore.set('keybindings', keybindingsValue);
};

export const zenModeToggled: Action = ({ state }) => {
  state.preferences.settings.zenMode = !state.preferences.settings.zenMode;
};

export const codeMirrorForced: Action = ({ state }) => {
  state.preferences.settings.codeMirror = true;
};

export const toggleContainerLspExperiment: AsyncAction = async ({
  effects,
  state,
}) => {
  if (!state.user) {
    return;
  }
  try {
    await effects.api.updateExperiments({
      container_lsp: !state.user.experiments.containerLsp,
    });
    state.user.experiments.containerLsp = !state.user.experiments.containerLsp;
    // Allow the flush to go through and flip button
    requestAnimationFrame(() => {
      if (
        effects.browser.confirm(
          'We need to refresh for this to take effect, or you can refresh later'
        )
      ) {
        effects.browser.reload();
      }
    });
  } catch (error) {
    effects.notificationToast.error('Unable to toggl LSP experiment');
  }
};

export const getUserLocalSettings = (): { themeData: any; vscode: any } => {
  const fs = window.BrowserFS.BFSRequire('fs');
  const all = fs.readdirSync('/vscode');
  const files = {};

  const readFromDirectory = (path: string) => {
    const filesInDirectory = fs.readdirSync(path);
    if (path === '/vscode/userdata/CachedExtensions') {
      return;
    }

    filesInDirectory.forEach(p => {
      const newPath = path + '/' + p;
      if (fs.statSync(newPath).isDirectory()) {
        readFromDirectory(newPath);
      } else {
        files[newPath] = fs.readFileSync(newPath).toString();
      }
    });
  };

  all.forEach(dir => {
    const a = `/vscode/` + dir;

    if (fs.statSync(a).isDirectory()) {
      readFromDirectory(a);
    } else {
      files[a] = fs.readFileSync(a).toString();
    }
  });

  const LOCAL_STORAGE_KEYS = [
    'vs-global://colorThemeData',
    'VIEW_MODE_DASHBOARD',
    'vs-global://iconThemeData',
    ...Object.keys(localStorage).filter(key => key.includes('settings.')),
  ];
  const themeData = {};

  LOCAL_STORAGE_KEYS.forEach(key => {
    themeData[key] = localStorage.getItem(key);
  });

  return {
    themeData,
    vscode: files,
  };
};

export const renameUserSettings: AsyncAction<{
  name: string;
  id: string;
}> = async ({ state, effects }, { name, id }) => {
  const { settingsSync } = state.preferences;
  if (!name || !settingsSync.settings) return;

  try {
    const response = await effects.api.editUserSettings(
      {
        ...settingsSync.settings.find(s => s.id === id),
        name,
      },
      id
    );

    settingsSync.settings = settingsSync.settings.map(setting => {
      if (setting.id === response.id) {
        return {
          ...setting,
          name,
        };
      }

      return setting;
    });
  } catch (e) {
    effects.notificationToast.error(
      'There has been a problem renaming your profile'
    );
  }
};

export const getUserSettings: AsyncAction = async ({ state, effects }) => {
  const { settingsSync } = state.preferences;
  settingsSync.fetching = true;

  const response = await effects.api.getUserSettings();

  settingsSync.settings = response;
  settingsSync.fetching = false;
};

export const createPreferencesProfile: AsyncAction = async ({
  state,
  effects,
  actions,
}) => {
  state.preferences.settingsSync.syncing = true;
  try {
    const { vscode, themeData } = actions.preferences.getUserLocalSettings({});

    actions.preferences.appllySettings(
      JSON.stringify({
        themeData,
        vscode,
      })
    );
  } catch (e) {
    effects.notificationToast.error(
      'There has been a problem syncing your Preferences'
    );
  }
};

export const appllySettings: AsyncAction<string> = async (
  { state, effects },
  settingsStringfied
) => {
  if (!state.user) return;
  const {
    id,
    insertedAt,
    name,
    settings,
    updatedAt,
  } = await effects.api.createUserSettings({
    name: state.user.username,
    settings: settingsStringfied,
  });

  state.preferences.settingsSync.syncing = false;
  state.preferences.settingsSync.settings = [
    {
      id,
      insertedAt,
      name,
      settings,
      updatedAt,
    },
  ];
  localStorage.setItem(`profile-${id}`, updatedAt);
  effects.notificationToast.success(
    'Your Preferences have been sucefully synced'
  );
};

export const checkifSynced = ({ state, actions }, savedSetting) => {
  const currentSettings = actions.preferences.getUserLocalSettings({});
  return isEqual(currentSettings, JSON.parse(savedSetting));
};

export const deleteUserSetting: AsyncAction<string> = async (
  { state, effects },
  id
) => {
  if (!state.preferences.settingsSync.settings) return;
  try {
    await effects.api.removeUserSetting(id);

    state.preferences.settingsSync.settings = state.preferences.settingsSync.settings.filter(
      s => s.id !== id
    );
  } catch (e) {
    effects.notificationToast.error(
      'There has been a problem removing your profile'
    );
  }
};

export const downloadPreferences: AsyncAction<SettingSync> = async (
  { state },
  settings
) => {
  const blob = new Blob([settings.settings], { type: 'application/json' });
  saveAs(blob, `CodeSandboxSettings-${settings.name}.json`);
};

export const applyPreferences: AsyncAction<string> = async (
  { state, effects },
  settings
) => {
  if (!state.preferences.settingsSync.settings) return;
  const fs = window.BrowserFS.BFSRequire('fs');

  try {
    const parsedSyncedSettings = JSON.parse(settings);

    Object.keys(parsedSyncedSettings.themeData).forEach(key => {
      localStorage.setItem(key, parsedSyncedSettings.themeData[key]);
    });

    Object.keys(parsedSyncedSettings.vscode).forEach(key => {
      fs.writeFileSync(key, parsedSyncedSettings.vscode[key]);
    });
    effects.notificationToast.success(
      'Your settings have been applied. The page will now reload'
    );

    window.setTimeout(() => location.reload(), 1000);
  } catch (e) {
    effects.notificationToast.error(
      'There has been a problem applying your Preferences'
    );
  }
};

export const openApplySettingsModal: Action = ({ state }) => {
  state.currentModal = 'applyPreferences';
};

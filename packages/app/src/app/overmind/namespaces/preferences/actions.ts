import { Badge } from '@codesandbox/common/lib/types';

import { Action, AsyncAction } from 'app/overmind';

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

export const itemIdChanged: AsyncAction<{
  itemId: string;
}> = async ({ state, actions, effects }, { itemId }) => {
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

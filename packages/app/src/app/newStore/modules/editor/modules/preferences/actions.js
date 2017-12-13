export function storeSetting({ props, state, settingsStore }) {
  if (props.name.split('.').length > 1) {
    const prop = props.name.split('.')[0];
    const value = state.get(`editor.preferences.settings.${prop}`);

    settingsStore.set(prop, value);
  } else {
    settingsStore.set(props.name, props.value);
  }
}

export function changeKeybinding({ props, state }) {
  const keybindings = state.get('editor.preferences.settings.keybindings');
  const currentIndex = keybindings.findIndex(
    binding => binding.key === props.name
  );
  const newBinding = { key: props.name, bindings: props.value };

  if (currentIndex === -1) {
    state.push('editor.preferences.settings.keybindings', newBinding);
  } else {
    state.splice(
      'editor.preferences.settings.keybindings',
      currentIndex,
      1,
      newBinding
    );
  }
}

export function storeKeybindings({ state, settingsStore }) {
  const keybindings = state.get('editor.preferences.settings.keybindings');
  const value = keybindings.reduce(
    (currentValue, binding) =>
      Object.assign(currentValue, {
        [binding.key]: binding.bindings,
      }),
    {}
  );

  settingsStore.set('keybindings', value);
}

export function toggleBadgeVisibility({ state, props }) {
  const { id } = props;
  const badges = state.get('user.badges');

  badges.forEach((badge, index) => {
    const currentVis = badge.visible;
    if (badge.id === id) {
      state.set(`user.badges.${index}.visible`, !currentVis);
    }
  });
}

export function updateBadgeInfo({ api, props }) {
  const { id, visible } = props;
  const body = {
    badge: {
      visible,
    },
  };
  return api
    .patch(`/users/current_user/badges/${id}`, body)
    .then(data => ({ data }));
}

export function getPaymentDetails({ api }) {
  return api
    .get(`/users/current_user/payment_details`, {})
    .then(data => ({ data }))
    .catch(error => ({ error }));
}

export function updatePaymentDetails({ api, props }) {
  const { token } = props;
  const body = {
    paymentDetails: {
      token,
    },
  };
  return api
    .patch('/users/current_user/payment_details', body)
    .then(data => ({ data }));
}

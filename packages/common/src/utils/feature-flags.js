/**
  poor man's feature flags

  you can export a constant which enables/disables a feature

  it's a JS file, so you can add whatever logic you want as long as it's static
*/

export const REDESIGNED_SIDEBAR = localStorage.REDESIGNED_SIDEBAR || false;

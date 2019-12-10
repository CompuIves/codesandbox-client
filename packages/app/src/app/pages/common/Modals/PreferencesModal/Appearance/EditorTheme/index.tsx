import React, { FunctionComponent } from 'react';

import { useOvermind } from 'app/overmind';

import { Rule, SubDescription } from '../../elements';
import { BigTitle, PreferenceText } from './elements';

export const EditorTheme: FunctionComponent = () => {
  const {
    actions: {
      preferences: { settingChanged },
    },
    state: {
      preferences: { settings },
    },
  } = useOvermind();

  const bindValue = (name: string, setUndefined?: boolean) => ({
    setValue: value => settingChanged({ name, value }),
    value: setUndefined ? settings[name] || undefined : settings[name],
  });

  return (
    <div>
      <BigTitle>Editor Theme</BigTitle>

      <SubDescription>
        You can select your editor theme by selecting File {'->'} Preferences{' '}
        {'->'} Color Theme in the menu bar.
      </SubDescription>

      <Rule />

      <SubDescription style={{ marginBottom: '1rem' }}>
        Custom VSCode Theme
      </SubDescription>

      <SubDescription style={{ marginBottom: '1rem' }}>
        After changing this setting you
        {"'"}
        ll have to reload the browser and select {'"'}
        Custom
        {'"'} as your color theme.
      </SubDescription>

      <PreferenceText
        block
        isTextArea
        placeholder={`You can use your own theme from VSCode directly:
1. Open VSCode
2. Press (CMD or CTRL) + SHIFT + P
3. Enter: '> Developer: Generate Color Scheme From Current Settings'
4. Copy the contents and paste them here!`}
        rows={7}
        {...bindValue('manualCustomVSCodeTheme', true)}
      />
    </div>
  );
};

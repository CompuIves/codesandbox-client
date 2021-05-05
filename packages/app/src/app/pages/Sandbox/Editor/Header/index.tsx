import { Stack } from '@codesandbox/components';
import css from '@styled-system/css';
import { useAppState } from 'app/overmind';
import React from 'react';

import { Actions } from './Actions';
import { AppMenu } from './AppMenu';
import { SandboxName } from './SandboxName';
import { WorkspaceName } from './WorkspaceName';
import { SignInBanner } from './SignInAd';

export const Header = () => {
  const { editor, isAuthenticating, activeTeamInfo, user } = useAppState();

  const renderWorkspace = () => {
    if (activeTeamInfo) {
      return (
        <WorkspaceName
          name={activeTeamInfo.name}
          plan={activeTeamInfo.subscription?.type}
        />
      );
    }

    return <WorkspaceName showBadge={false} name="CodeSandbox" />;
  };

  return (
    <>
      {!user && <SignInBanner />}
      <Stack
        as="header"
        justify="space-between"
        align="center"
        paddingX={2}
        css={css({
          boxSizing: 'border-box',
          fontFamily: 'Inter, sans-serif',
          height: 12,
          backgroundColor: 'titleBar.activeBackground',
          color: 'titleBar.activeForeground',
          borderBottom: '1px solid',
          borderColor: 'titleBar.border',
        })}
      >
        <Stack align="center">
          <AppMenu />
          {renderWorkspace()}
        </Stack>

        {editor.currentSandbox && !isAuthenticating ? <SandboxName /> : null}
        {editor.currentSandbox && !isAuthenticating ? <Actions /> : null}
      </Stack>
    </>
  );
};

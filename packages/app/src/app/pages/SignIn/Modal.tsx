import React, { useEffect } from 'react';
import { useAppState, useActions } from 'app/overmind';
import {
  github as GitHubIcon,
  GoogleIcon,
} from '@codesandbox/components/lib/components/Icon/icons';
import { Element, Text } from '@codesandbox/components';
import { css } from '@styled-system/css';
import history from 'app/utils/history';
import { LeftSide } from './components/LeftSide';
import { Wrapper } from './components/Wrapper';
import { Button } from './components/Button';
import { UserNameSelection } from './components/UserNameSelection';
import { DuplicateAccount } from './components/DuplicateAccount';

type SignInModalElementProps = {
  redirectTo?: string;
  onSignIn?: () => void;
};

export const SignInModalElement = ({
  redirectTo,
  onSignIn,
}: SignInModalElementProps) => {
  const {
    duplicateAccountStatus,
    pendingUser,
    pendingUserId,
    loadingAuth,
  } = useAppState();
  const { signInButtonClicked, getPendingUser, setLoadingAuth } = useActions();

  useEffect(() => {
    if (pendingUserId) {
      getPendingUser();
    }
  }, [getPendingUser, pendingUserId]);

  const handleSignIn = async () => {
    setLoadingAuth('github');
    await signInButtonClicked({ provider: 'github', useExtraScopes: false });

    if (onSignIn) {
      return onSignIn();
    }

    if (redirectTo) {
      if (redirectTo.startsWith(location.origin)) {
        return history.push(redirectTo.replace(location.origin, ''));
      }

      window.location.href = redirectTo;

      return null;
    }
    setLoadingAuth('github');

    return null;
  };

  const handleGoogleSignIn = async () => {
    setLoadingAuth('google');
    await signInButtonClicked({ provider: 'google' });

    if (onSignIn) {
      return onSignIn();
    }

    if (redirectTo) {
      return history.push(redirectTo.replace(location.origin, ''));
    }
    setLoadingAuth('google');

    return null;
  };

  if (duplicateAccountStatus) {
    return (
      <Wrapper oneCol>
        <DuplicateAccount provider={duplicateAccountStatus.provider} />
      </Wrapper>
    );
  }

  if (pendingUser) {
    return (
      <Wrapper oneCol>
        <UserNameSelection />
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <LeftSide />
      <Element padding={8}>
        <Text weight="bold" size={23} paddingBottom={1} block>
          Sign in to CodeSandbox
        </Text>
        <Text variant="muted" size={3} paddingBottom={30} block>
          Get a free account, no credit card required
        </Text>

        <Button loading={loadingAuth.github} onClick={handleSignIn}>
          <GitHubIcon width="20" height="20" />
          <Element css={css({ width: '100%' })}>Sign in with GitHub</Element>
        </Button>
        <Button loading={loadingAuth.google} onClick={handleGoogleSignIn}>
          <GoogleIcon width="20" height="20" />
          <Element css={css({ width: '100%' })}>Sign in with Google</Element>
        </Button>
        <Text
          variant="muted"
          align="center"
          size={10}
          block
          css={css({
            lineHeight: '13px',
            maxWidth: '200px',
            margin: 'auto',

            a: {
              color: 'inherit',
            },
          })}
        >
          By continuing, you agree to CodeSandbox{' '}
          <a href="https://codesandbox.io/legal/terms">Terms of Service</a>,{' '}
          <a href="https://codesandbox.io/legal/privacy">Privacy Policy</a>
        </Text>
      </Element>
    </Wrapper>
  );
};

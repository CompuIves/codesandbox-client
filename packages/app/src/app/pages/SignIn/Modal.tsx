import React, { useState, useEffect } from 'react';
import { useOvermind } from 'app/overmind';
import { github as GitHubIcon } from '@codesandbox/components/lib/components/Icon/icons';
import { Element, Text } from '@codesandbox/components';
import { css } from '@styled-system/css';
import history from 'app/utils/history';
import { LeftSide } from './components/LeftSide';
import { Wrapper } from './components/Wrapper';
import { Button } from './components/Button';
import { UserNameSelection } from './components/UserNameSelection';

type SignInModalElementProps = {
  redirectTo?: string;
  onSignIn?: () => void;
};

export const SignInModalElement = ({
  redirectTo,
  onSignIn,
}: SignInModalElementProps) => {
  const {
    state: { pendingUser, pendingUserId },
    actions: { signInButtonClicked, getPendingUser },
  } = useOvermind();

  useEffect(() => {
    if (pendingUserId) {
      getPendingUser();
    }
  }, [getPendingUser, pendingUserId]);

  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    await signInButtonClicked({ useExtraScopes: false });

    if (onSignIn) {
      return onSignIn();
    }

    if (redirectTo) {
      return history.push(redirectTo.replace(location.origin, ''));
    }
    setLoading(false);

    return null;
  };

  return (
    <Wrapper usernameSelection={pendingUser}>
      {pendingUser ? (
        <UserNameSelection />
      ) : (
        <>
          <LeftSide />
          <Element padding={8}>
            <Text weight="bold" size={23} paddingBottom={3} block>
              Sign in to CodeSandbox
            </Text>
            <Text variant="muted" size={3} paddingBottom={60} block>
              Get a free account, no credit card required
            </Text>

            <Button loading={loading} onClick={handleSignIn}>
              <GitHubIcon width="20" height="20" />
              <Element css={css({ width: '100%' })}>
                Sign in with GitHub
              </Element>
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
        </>
      )}
    </Wrapper>
  );
};

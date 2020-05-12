import { css } from '@styled-system/css';
import React, { FunctionComponent } from 'react';
import { Element, Button, ThemeProvider, Text } from '@codesandbox/components';
import codeSandboxBlack from '@codesandbox/components/lib/themes/codesandbox-black';
import { useOvermind } from 'app/overmind';
import styled, { keyframes } from 'styled-components';
import { Navigation } from '../Navigation';

const noiseAnimation = keyframes`
  0% {
    clip-path: inset(10% 0 100% 0);
  }
  20% {
    clip-path: inset(61% 10% 1% 0);
  }
  40% {
    clip-path: inset(43% 0 12% 0);
  }
  60% {
    clip-path: inset(25% 0 58% 10%);
  }
  80% {
    clip-path: inset(14% 0 7% 0);
  }
  100% {
    clip-path: inset(100% 10% 43% 0);
  }
`;

const Glitch = styled(Text)`
  position: relative;

  &::before,
  &::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  &::before {
    animation: ${noiseAnimation} 3s infinite linear alternate-reverse;
    left: 2px;
    text-shadow: -1px 0 red;
    background: ${props => props.theme.colors.grays[900]};
  }
  &::after {
    animation: ${noiseAnimation} 6s infinite linear alternate-reverse;
    left: -2px;
    text-shadow: -1px 0 blue;
    background: ${props => props.theme.colors.grays[900]};
  }
`;

export const NotFound: FunctionComponent = () => {
  const {
    state: { hasLogIn },
  } = useOvermind();

  return (
    <ThemeProvider theme={codeSandboxBlack}>
      <Element
        css={css({
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: 'grays.900',
          height: '100vh',
          width: '100vw',
          fontFamily: 'Inter, sans-serif',
          color: 'white',
        })}
      >
        <Element
          css={css({
            width: 1280,
            maxWidth: '80%',
            margin: 'auto',
            position: 'absolute',
            top: 0,
          })}
        >
          <Navigation title="Not Found" />
        </Element>
        <Glitch
          data-text="404"
          block
          size={152}
          weight="bold"
          // @ts-ignore
          marginBottom={[60, 100]}
        >
          404
        </Glitch>
        <Text
          block
          weight="bold"
          size={7}
          marginBottom={6}
          align="center"
          css={css({ maxWidth: '80%', marginX: 'auto' })}
        >
          Whoops, page not found
        </Text>
        <Text
          marginBottom={12}
          size={6}
          align="center"
          css={css({ maxWidth: '80%', marginX: 'auto' })}
        >
          We can’t seem to find the page you’re looking for
        </Text>
        <a
          href="/"
          css={css({
            textDecoration: 'none',
          })}
        >
          <Button
            css={css({
              width: 'auto',
            })}
          >
            Go to {hasLogIn ? 'Dashboard' : 'Homepage'}
          </Button>
        </a>
      </Element>
    </ThemeProvider>
  );
};

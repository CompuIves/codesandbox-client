import { signInPageUrl } from '@codesandbox/common/lib/utils/url-generator';
import React, { FunctionComponent } from 'react';
import { Redirect } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import Backend from 'react-dnd-html5-backend';
import { useOvermind } from 'app/overmind';
import codesandboxBlack from '@codesandbox/components/lib/themes/codesandbox-black';
import { ThemeProvider, Stack, Element } from '@codesandbox/components';
import { createGlobalStyle } from 'styled-components';
import css from '@styled-system/css';

import { Header } from './Header';
import { Sidebar, SIDEBAR_WIDTH } from './Sidebar';
import { Content } from './Content';

const GlobalStyles = createGlobalStyle({
  body: { overflow: 'hidden' },
});

export const Dashboard: FunctionComponent = () => {
  const {
    state: { hasLogIn },
  } = useOvermind();

  // only used for mobile
  const [sidebarVisible, setSidebarVisibility] = React.useState(false);
  const onSidebarToggle = () => setSidebarVisibility(!sidebarVisible);

  if (!hasLogIn) {
    return <Redirect to={signInPageUrl()} />;
  }

  return (
    <ThemeProvider theme={codesandboxBlack}>
      <GlobalStyles />
      <DndProvider backend={Backend}>
        <Stack
          direction="vertical"
          css={css({
            fontFamily: "'Inter', sans-serif",
            backgroundColor: 'sideBar.background',
            color: 'sideBar.foreground',
            width: '100vw',
            minHeight: '100vh',
          })}
        >
          <Header onSidebarToggle={onSidebarToggle} />

          <Stack css={{ flexGrow: 1 }}>
            <Sidebar
              id="mobile-sidebar"
              css={css({ display: ['block', 'block', 'none'] })}
              visible={sidebarVisible}
              onSidebarToggle={onSidebarToggle}
              style={{
                // We set sidebar as absolute so that content can
                // take 100% width, this helps us enable dragging
                // sandboxes onto the sidebar more freely.
                position: 'absolute',
                height: 'calc(100% - 48px)',
              }}
            />
            <Element
              as="aside"
              id="desktop-sidebar"
              css={css({ display: ['none', 'none', 'block'] })}
            >
              <Sidebar
                visible
                onSidebarToggle={() => {
                  /* do nothing */
                }}
                style={{
                  // We set sidebar as absolute so that content can
                  // take 100% width, this helps us enable dragging
                  // sandboxes onto the sidebar more freely.
                  position: 'absolute',
                  height: 'calc(100% - 48px)',
                }}
              />
            </Element>

            <Element
              as="main"
              css={css({
                width: '100%',
                height: 'calc(100vh - 48px)',
                paddingLeft: [0, 0, SIDEBAR_WIDTH],
              })}
            >
              <Content />
            </Element>
          </Stack>
        </Stack>
      </DndProvider>
    </ThemeProvider>
  );
};

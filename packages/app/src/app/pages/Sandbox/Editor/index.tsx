import Fullscreen from '@codesandbox/common/lib/components/flex/Fullscreen';
import getTemplateDefinition from '@codesandbox/common/lib/templates';
import codesandbox from '@codesandbox/common/lib/themes/codesandbox.json';
import { REDESIGNED_SIDEBAR } from '@codesandbox/common/lib/utils/feature-flags';
import { ThemeProvider as NewThemeProvider } from '@codesandbox/components';
import { useOvermind } from 'app/overmind';
import { templateColor } from 'app/utils/template-color';
import React, { useEffect, useRef, useState } from 'react';
import SplitPane from 'react-split-pane';
import styled, { ThemeProvider } from 'styled-components';

import Content from './Content';
import { Container } from './elements';
import ForkFrozenSandboxModal from './ForkFrozenSandboxModal';
import { Header } from './Header';
import { Header as HeaderOld } from './HeaderOld';
import { Navigation } from './Navigation';
import { Navigation as NavigationOld } from './NavigationOld';
import { ContentSkeleton } from './Skeleton';
import getVSCodeTheme from './utils/get-vscode-theme';
import { Workspace } from './Workspace';
import { CommentsAPI } from './Workspace/screens/Comments/API';

const STATUS_BAR_SIZE = 22;

const StatusBar = styled.div`
  a {
    color: inherit;
  }
`;

const Editor = () => {
  const { state, actions, effects, reaction } = useOvermind();
  const statusbarEl = useRef(null);
  const [showSkeleton, setShowSkeleton] = useState(
    !state.editor.hasLoadedInitialModule
  );
  const [localState, setLocalState] = useState({
    theme: {
      colors: {},
      vscodeTheme: codesandbox,
    },
    customVSCodeTheme: null,
  });

  useEffect(() => {
    let timeout;
    const dispose = reaction(
      reactionState => reactionState.editor.hasLoadedInitialModule,
      () => {
        timeout = setTimeout(() => setShowSkeleton(false), 500);
      }
    );
    return () => {
      dispose();
      clearTimeout(timeout);
    };
  }, [reaction]);

  useEffect(() => {
    async function loadTheme() {
      const vsCodeTheme = state.preferences.settings.customVSCodeTheme;

      try {
        const t = await getVSCodeTheme('', vsCodeTheme);
        setLocalState({ theme: t, customVSCodeTheme: vsCodeTheme });
      } catch (e) {
        console.error(e);
      }
    }
    if (
      localState.customVSCodeTheme !==
      state.preferences.settings.customVSCodeTheme
    ) {
      loadTheme();
    }
  }, [
    localState.customVSCodeTheme,
    state.preferences.settings.customVSCodeTheme,
  ]);

  useEffect(() => {
    statusbarEl.current.appendChild(effects.vscode.getStatusbarElement());
  }, [effects.vscode]);

  const sandbox = state.editor.currentSandbox;
  const hideNavigation =
    state.preferences.settings.zenMode && state.workspace.workspaceHidden;
  const { statusBar } = state.editor;

  const templateDef = sandbox && getTemplateDefinition(sandbox.template);

  const topOffset = state.preferences.settings.zenMode ? 0 : 3 * 16;
  const bottomOffset = STATUS_BAR_SIZE;

  return (
    <ThemeProvider
      theme={{
        templateColor: templateColor(sandbox, templateDef as any),
        templateBackgroundColor: templateDef && templateDef.backgroundColor,
        ...localState.theme,
      }}
    >
      <Container
        style={{ lineHeight: 'initial', backgroundColor: 'transparent' }}
        className="monaco-workbench"
      >
        {REDESIGNED_SIDEBAR === 'true' ? (
          <>
            {state.preferences.settings.zenMode ? null : (
              <NewThemeProvider theme={localState.theme.vscodeTheme}>
                <Header />
              </NewThemeProvider>
            )}
          </>
        ) : (
          <HeaderOld zenMode={state.preferences.settings.zenMode} />
        )}
        <Fullscreen style={{ width: 'initial' }}>
          {!hideNavigation &&
            (REDESIGNED_SIDEBAR === 'true' ? (
              <NewThemeProvider theme={localState.theme.vscodeTheme}>
                <Navigation topOffset={topOffset} bottomOffset={bottomOffset} />
              </NewThemeProvider>
            ) : (
              <NavigationOld
                topOffset={topOffset}
                bottomOffset={bottomOffset}
              />
            ))}

          <div
            style={{
              position: 'fixed',
              left: hideNavigation ? 0 : 'calc(3.5rem + 1px)',
              top: topOffset,
              right: 0,
              bottom: bottomOffset,
              height: statusBar ? 'auto' : 'calc(100% - 3.5rem)',
              zIndex: 9,
            }}
          >
            <SplitPane
              split="vertical"
              defaultSize={17 * 16}
              minSize={0}
              resizerStyle={state.editor.isLoading ? { display: 'none' } : null}
              onDragStarted={() => actions.editor.resizingStarted()}
              onDragFinished={() => actions.editor.resizingStopped()}
              onChange={size => {
                if (size > 0 && state.workspace.workspaceHidden) {
                  actions.workspace.setWorkspaceHidden({ hidden: false });
                } else if (size === 0 && !state.workspace.workspaceHidden) {
                  actions.workspace.setWorkspaceHidden({ hidden: true });
                }
              }}
              pane1Style={{
                minWidth: state.workspace.workspaceHidden ? 0 : 190,
                visibility: state.workspace.workspaceHidden
                  ? 'hidden'
                  : 'visible',
                maxWidth: state.workspace.workspaceHidden ? 0 : 400,
              }}
              pane2Style={{
                height: '100%',
              }}
              style={{
                overflow: 'visible', // For VSCode Context Menu
              }}
            >
              {state.workspace.workspaceHidden ? <div /> : <Workspace />}
              {<Content theme={localState.theme} />}
            </SplitPane>
            {showSkeleton ? (
              <NewThemeProvider theme={localState.theme.vscodeTheme}>
                <ContentSkeleton
                  style={
                    state.editor.hasLoadedInitialModule
                      ? {
                          opacity: 0,
                        }
                      : {
                          opacity: 1,
                        }
                  }
                />
              </NewThemeProvider>
            ) : null}
          </div>

          <StatusBar
            style={{
              position: 'fixed',
              display: statusBar ? 'block' : 'none',
              bottom: 0,
              left: 0,
              right: 0,
              height: STATUS_BAR_SIZE,
            }}
            className="monaco-workbench mac nopanel"
            ref={statusbarEl}
          />
        </Fullscreen>

        <ForkFrozenSandboxModal />
      </Container>
      <NewThemeProvider theme={localState.theme.vscodeTheme}>
        <CommentsAPI />
      </NewThemeProvider>
    </ThemeProvider>
  );
};

export default Editor;

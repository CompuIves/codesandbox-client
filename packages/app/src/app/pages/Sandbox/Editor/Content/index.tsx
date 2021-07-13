import getTemplateDefinition from '@codesandbox/common/lib/templates';
import { BACKTICK } from '@codesandbox/common/lib/utils/keycodes';
import { VSCode as CodeEditor } from 'app/components/CodeEditor/VSCode';
import { DevTools } from 'app/components/Preview/DevTools';
import { useActions, useReaction, useEffects, useAppState } from 'app/overmind';
import useKey from 'react-use/lib/useKey';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import SplitPane from 'react-split-pane';
import { ThemeProvider } from 'styled-components';

import preventGestureScroll, { removeListener } from './prevent-gesture-scroll';
import { Preview } from './Preview';
import { EditorToast } from './EditorToast';

export const MainWorkspace: React.FC<{ theme: any }> = ({ theme }) => {
  const state = useAppState();
  const actions = useActions();
  const effects = useEffects();
  const reaction = useReaction();
  const editorEl = useRef(null);
  const contentEl = useRef(null);
  const [showConsoleDevtool, setShowConsoleDevtool] = useState(false);
  const [consoleDevtoolIndex, setConsoleDevtoolIndex] = useState(-1);

  const updateEditorSize = useCallback(
    function updateEditorSize() {
      if (editorEl.current) {
        const { width, height } = editorEl.current.getBoundingClientRect();
        effects.vscode.updateLayout(width, height);
      }
    },
    [effects.vscode]
  );

  useEffect(() => {
    const contentNode = contentEl.current;

    const disposeResizeDetector = reaction(
      ({ preferences, workspace, editor }) => [
        preferences.settings.zenMode,
        workspace.workspaceHidden,
        editor.previewWindowOrientation,
      ],
      () => {
        updateEditorSize();
      },
      {
        immediate: true,
      }
    );

    window.addEventListener('resize', updateEditorSize);

    preventGestureScroll(contentEl.current);

    actions.editor.contentMounted();

    return () => {
      window.removeEventListener('resize', updateEditorSize);
      // clearInterval(this.interval);
      disposeResizeDetector();
      removeListener(contentNode);
    };
  }, [actions.editor, effects.vscode, reaction, updateEditorSize]);

  const views = state.editor.devToolTabs;

  useEffect(() => {
    setConsoleDevtoolIndex(() =>
      views.findIndex(
        ({ views: panes }) =>
          panes.findIndex(pane => pane.id === 'codesandbox.console') !== -1
      )
    );
  }, [views]);

  useKey(
    e => e.ctrlKey && e.keyCode === BACKTICK,
    e => {
      e.preventDefault();
      setShowConsoleDevtool(value => !value);
    },
    {},
    []
  );

  const sandbox = state.editor.currentSandbox;
  const { preferences } = state;
  const windowVisible = state.editor.previewWindowVisible;
  const template = sandbox && getTemplateDefinition(sandbox.template);
  const currentPosition = state.editor.currentDevToolsPosition;

  const browserConfig = {
    id: 'codesandbox.browser',
    title: options =>
      options.port || options.title
        ? `Browser (${options.title || `:${options.port}`})`
        : `Browser`,
    Content: ({ hidden, options }) => (
      <Preview
        options={options}
        hidden={hidden}
        runOnClick={state.preferences.runOnClick}
        isReady={!state.editor.isLoading}
      />
    ),
    actions: [],
  };

  return (
    <ThemeProvider
      theme={
        template
          ? {
              templateColor: template.color,
              templateBackgroundColor: template.backgroundColor,
            }
          : theme
      }
    >
      <div
        id="workbench.main.container"
        className="monaco-workbench mac nopanel"
        style={{
          height: '100%',
          width: '100%',
          overflow: 'visible', // For VSCode Context Menu
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'transparent',
        }}
        ref={contentEl}
      >
        <SplitPane
          maxSize={-100}
          onDragFinished={props => {
            actions.editor.resizingStopped();
          }}
          onDragStarted={() => {
            actions.editor.resizingStarted();
          }}
          resizerStyle={state.editor.isLoading ? { display: 'none' } : null}
          onChange={() => {
            updateEditorSize();
          }}
          style={{
            overflow: 'visible', // For VSCode Context Menu
          }}
          split={state.editor.previewWindowOrientation}
          defaultSize="50%"
          pane1Style={
            windowVisible
              ? {
                  minWidth: 100,
                }
              : {
                  width: '100%',
                  minWidth: '100%',
                  height: '100%',
                  minHeight: '100%',
                }
          }
          pane2Style={{
            visibility: windowVisible ? 'visible' : 'hidden',
            maxWidth: windowVisible ? '100%' : 0,
            width: windowVisible ? '100%' : 0,
            overflow: 'hidden',
            zIndex: 0, // For VSCode hovers, beware this is also dynamically changed in PreviewTabs
          }}
        >
          <div
            ref={editorEl}
            style={{
              position: 'relative',
              display: 'flex',
              flex: 1,
              height: '100%',
              width: '100%',
              marginTop: 0,
            }}
          >
            <div
              style={{
                height: '100%',
                width: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            >
              <EditorToast />
              {state.editor.isLoading ? null : <CodeEditor />}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
            id="csb-devtools" // used for tabs for highlighting
          >
            {sandbox &&
              views.map((v, i) => {
                // show console devtool if showConsoleDevtool is enabled and if it's in the current view(v)
                const devToolsOpen =
                  showConsoleDevtool && consoleDevtoolIndex === i;
                const disableLogging =
                  state.editor.parsedConfigurations?.sandbox?.parsed
                    ?.disableLogging;

                return (
                  <DevTools
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    devToolIndex={i}
                    devToolsOpen={devToolsOpen}
                    addedViews={{
                      'codesandbox.browser': browserConfig,
                    }}
                    setDragging={dragging => {
                      if (dragging) {
                        actions.editor.resizingStarted();
                      } else {
                        actions.editor.resizingStopped();
                      }
                    }}
                    sandboxId={sandbox.id}
                    template={sandbox.template}
                    disableLogging={disableLogging}
                    shouldExpandDevTools={state.preferences.showDevtools}
                    zenMode={preferences.settings.zenMode}
                    setDevToolsOpen={open => {
                      actions.preferences.setDevtoolsOpen(open);

                      if (
                        consoleDevtoolIndex === i &&
                        showConsoleDevtool !== open
                      ) {
                        setShowConsoleDevtool(open);
                      }
                    }}
                    owned={sandbox.owned}
                    primary={i === 0}
                    viewConfig={v}
                    moveTab={(prevPos, nextPos) => {
                      actions.editor.onDevToolsTabMoved({ prevPos, nextPos });
                    }}
                    closeTab={pos => {
                      actions.editor.onDevToolsTabClosed({ pos });
                    }}
                    currentDevToolIndex={currentPosition.devToolIndex}
                    currentTabPosition={currentPosition.tabPosition}
                    setPane={position =>
                      actions.editor.onDevToolsPositionChanged({
                        position,
                      })
                    }
                  />
                );
              })}
          </div>
        </SplitPane>
      </div>
    </ThemeProvider>
  );
};

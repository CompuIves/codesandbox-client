import * as React from 'react';
import { listen, dispatch } from 'codesandbox-api';
import { debounce } from 'lodash';

import { frameUrl } from 'common/utils/url-generator';
import { getModulePath } from 'common/sandbox/modules';

import Navigator from './Navigator';
import { Container, StyledFrame } from './elements';

let frames = [];

function sendMessage(sandboxId: string, message: Object) {
  const rawMessage = JSON.parse(JSON.stringify(message));
  frames.forEach(frame => {
    frame.postMessage(
      { ...rawMessage, codesandbox: true },
      frameUrl(sandboxId)
    );
  });
}

export function evaluateInSandbox(sandboxId, command) {
  sendMessage(sandboxId, {
    type: 'evaluate',
    command,
  });
}

class BasePreview extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      frameInitialized: false,
      history: [],
      historyPosition: -1,
      urlInAddressBar: frameUrl(props.sandboxId, props.initialPath || ''),
      url: null,
      dragging: false,
    };

    if (props.delay) {
      this.executeCode = debounce(this.executeCode, 800);
    }

    frames = [];
    this.devtools = null;
  }

  static defaultProps = {
    showNavigation: true,
    delay: true,
  };

  componentWillUnmount() {
    if (this.listener) {
      this.listener();
    }
    if (this.diposeInitialize) {
      this.diposeInitialize();
    }
  }

  componentDidMount() {
    this.listener = listen(this.handleMessage);
  }

  openNewWindow = () => {
    if (this.props.onOpenNewWindow) {
      this.props.onOpenNewWindow();
    }

    window.open(this.state.urlInAddressBar, '_blank');
  };

  handleSandboxChange = newId => {
    const url = frameUrl(newId, this.props.initialPath);
    this.setState(
      {
        history: [url],
        historyPosition: 0,
        urlInAddressBar: url,
      },
      () => this.handleRefresh()
    );
  };

  handleDependenciesChange = () => {
    this.handleRefresh();
  };

  handleMessage = (data, source) => {
    if (source) {
      if (data.type === 'initialized') {
        if (frames.indexOf(source) === -1) {
          frames.push(source);
        }

        if (!this.state.frameInitialized && this.props.onInitialized) {
          this.diposeInitialize = this.props.onInitialized(this);
        }
        this.setState({
          frameInitialized: true,
        });
        this.executeCodeImmediately(true);
      } else {
        const { type } = data;

        switch (type) {
          case 'render': {
            this.executeCodeImmediately();
            break;
          }
          case 'urlchange': {
            this.commitUrl(data.url);
            break;
          }
          case 'resize': {
            if (this.props.onResize) {
              this.props.onResize(data.height);
            }
            break;
          }
          case 'action': {
            if (this.props.onAction) {
              this.props.onAction({
                ...data,
                sandboxId: this.props.sandboxId,
              });
            }

            break;
          }
          default: {
            break;
          }
        }
      }
    }
  };

  executeCode = () => {
    requestAnimationFrame(() => {
      this.executeCodeImmediately();
    });
  };

  setDragging = dragging => {
    this.setState({ dragging });
  };

  getRenderedModule = () => {
    const { sandbox, currentModule, isInProjectView } = this.props;

    return isInProjectView
      ? '/' + sandbox.entry
      : getModulePath(sandbox.modules, sandbox.directories, currentModule.id);
  };

  executeCodeImmediately = (initialRender = false) => {
    const settings = this.props.settings;
    const sandbox = this.props.sandbox;

    if (settings.clearConsoleEnabled) {
      console.clear(); // eslint-disable-line no-console
      dispatch({ type: 'clear-console' });
    }

    // Do it here so we can see the dependency fetching screen if needed
    this.clearErrors();
    if (settings.forceRefresh && !initialRender) {
      this.handleRefresh();
    } else {
      if (!this.props.isInProjectView) {
        evaluateInSandbox(
          this.props.sandbox.id,
          `history.pushState({}, null, '/')`
        );
      }

      const modulesObject = {};

      sandbox.modules.forEach(m => {
        const path = getModulePath(sandbox.modules, sandbox.directories, m.id);
        modulesObject[path] = {
          path: getModulePath(sandbox.modules, sandbox.directories, m.id),
          code: m.code,
        };
      });

      const extraModules = this.props.extraModules || {};
      const modulesToSend = { ...extraModules, ...modulesObject };

      sendMessage(sandbox.id, {
        type: 'compile',
        version: 2,
        entry: !this.props.isInProjectView && this.getRenderedModule(),
        modules: modulesToSend,
        sandboxId: sandbox.id,
        externalResources: sandbox.externalResources,
        isModuleView: !this.props.isInProjectView,
        template: sandbox.template,
        hasActions: !!this.props.onAction,
      });
    }
  };

  clearErrors = () => {
    if (this.props.onClearErrors) {
      this.props.onClearErrors();
    }
  };

  updateUrl = url => {
    this.setState({ urlInAddressBar: url });
  };

  sendUrl = () => {
    const { urlInAddressBar } = this.state;

    document.getElementById('sandbox').src = urlInAddressBar;

    this.setState({
      history: [urlInAddressBar],
      historyPosition: 0,
      urlInAddressBar,
    });
  };

  handleRefresh = () => {
    const { history, historyPosition } = this.state;
    const url = history[historyPosition];

    document.getElementById('sandbox').src = url;

    this.setState({
      history: [url],
      historyPosition: 0,
      urlInAddressBar: url,
    });
  };

  handleBack = () => {
    sendMessage(this.props.sandbox.id, {
      type: 'urlback',
    });

    const { historyPosition, history } = this.state;
    this.setState({
      historyPosition: this.state.historyPosition - 1,
      urlInAddressBar: history[historyPosition - 1],
    });
  };

  handleForward = () => {
    sendMessage(this.props.sandbox.id, {
      type: 'urlforward',
    });

    const { historyPosition, history } = this.state;
    this.setState({
      historyPosition: this.state.historyPosition + 1,
      urlInAddressBar: history[historyPosition + 1],
    });
  };

  commitUrl = url => {
    const { history, historyPosition } = this.state;

    const currentHistory = history[historyPosition] || '';
    if (currentHistory !== url) {
      history.length = historyPosition + 1;
      this.setState({
        history: [...history, url],
        historyPosition: historyPosition + 1,
        urlInAddressBar: url,
      });
    }
  };

  toggleProjectView = () => {
    if (this.props.onToggleProjectView) {
      this.props.onToggleProjectView();
    }
  };

  render() {
    const {
      showNavigation,
      inactive,
      sandbox,
      settings,
      isInProjectView,
    } = this.props;
    const { historyPosition, history, dragging, urlInAddressBar } = this.state;
    const url = urlInAddressBar || frameUrl(sandbox.id);

    return (
      <Container>
        {showNavigation && (
          <Navigator
            url={decodeURIComponent(url)}
            onChange={this.updateUrl}
            onConfirm={this.sendUrl}
            onBack={historyPosition > 0 ? this.handleBack : null}
            onForward={
              historyPosition < history.length - 1 ? this.handleForward : null
            }
            onRefresh={this.handleRefresh}
            isProjectView={isInProjectView}
            toggleProjectView={
              this.props.onToggleProjectView && this.toggleProjectView
            }
            openNewWindow={this.openNewWindow}
            zenMode={settings.zenMode}
            alignRight={this.props.alignRight}
            alignBottom={this.props.alignBottom}
          />
        )}

        <StyledFrame
          sandbox="allow-forms allow-scripts allow-same-origin allow-modals allow-popups allow-presentation"
          src={frameUrl(sandbox.id, this.initialPath)}
          id="sandbox"
          title={sandbox.id}
          hideNavigation={!showNavigation}
          style={{
            pointerEvents:
              dragging || inactive || this.props.isResizing
                ? 'none'
                : 'initial',
          }}
        />
      </Container>
    );
  }
}

export default BasePreview;

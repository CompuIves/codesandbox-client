/* @flow */
import React from 'react';
import styled from 'styled-components';

import { debounce } from 'lodash';

import type {
  Module,
} from '../../../../../../../store/entities/sandboxes/modules/entity';
import type {
  Sandbox,
} from '../../../../../../../store/entities/sandboxes/entity';
import type {
  Directory,
} from '../../../../../../../store/entities/sandboxes/directories/entity';
import { frameUrl } from '../../../../../../../utils/url-generator';
import {
  isMainModule,
} from '../../../../../../../store/entities/sandboxes/modules/validator';
import defaultBoilerplates
  from '../../../../../../../store/entities/sandboxes/boilerplates/default-boilerplates';

import Navigator from './Navigator';
import ErrorMessage from './ErrorMessage';

const Container = styled.div`
  position: absolute;
  height: 100%;
  width: 100%;
  background-color: white;
`;

const StyledFrame = styled.iframe`
  border-width: 0px;
  height: 100%;
  width: 100%;
`;

const LoadingDepText = styled.div`
  position: absolute;
  font-size: 2rem;
  color: black;
  text-align: center;
  vertical-align: middle;
  top: 50%; bottom: 0; right: 0; left: 0;
  margin: auto;
`;

type Props = {
  sandboxId: string,
  isInProjectView: boolean,
  modules: Array<Module>,
  directories: Array<Directory>,
  bundle: Sandbox.dependencyBundle,
  fetchBundle: (id: string) => Object,
  setProjectView: (id: string, isInProjectView: boolean) => void,
  module: Module,
  setError: (id: string, error: ?{ message: string, line: number }) => void,
};

type State = {
  frameInitialized: boolean,
  url: ?string,
  history: Array<string>,
  historyPosition: number,
  urlInAddressBar: string,
};

export default class Preview extends React.PureComponent {
  constructor() {
    super();

    this.state = {
      frameInitialized: false,
      history: [],
      historyPosition: 0,
      urlInAddressBar: '',
      url: null,
    };

    this.executeCode = debounce(this.executeCode, 500);
  }

  fetchBundle = () => {
    const { sandboxId, fetchBundle } = this.props;
    fetchBundle(sandboxId);
  };

  componentDidUpdate(prevProps: Props) {
    if (
      prevProps.module.id !== this.props.module.id && this.state.isProjectView
    ) {
      // If user only navigated while watching project
      return;
    }

    if (
      prevProps.module.code !== this.props.module.code &&
      this.state.frameInitialized
    ) {
      this.executeCode();
    }
  }

  componentDidMount() {
    window.addEventListener('message', this.handleMessage);
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.handleMessage);
  }

  handleMessage = (e: Object) => {
    if (e.data === 'Ready!') {
      this.setState({
        frameInitialized: true,
      });
      this.executeCode();
    } else {
      const { type } = e.data;
      if (type === 'error') {
        const { error } = e.data;
        this.setError(error);
      } else if (type === 'success') {
        // To reset the debounce, but still quickly remove errors
        this.setError(null);
      } else if (type === 'urlchange') {
        const url = e.data.url.replace('/', '');
        this.commitUrl(url);
      }
    }
  };

  executeCode = () => {
    const {
      modules,
      directories,
      bundle = {},
      module,
      isInProjectView,
    } = this.props;

    if (bundle.manifest == null) {
      if (!bundle.processing && !bundle.error) {
        this.fetchBundle();
      }
      return;
    }

    const mainModule = isInProjectView ? modules.find(isMainModule) : module;

    requestAnimationFrame(() => {
      document.getElementById('sandbox').contentWindow.postMessage(
        {
          type: 'compile',
          boilerplates: defaultBoilerplates,
          module: mainModule,
          changedModule: module,
          modules,
          directories,
          manifest: bundle.manifest,
          url: bundle.url,
        },
        '*'
      );
    });
  };

  setError = (e: ?{ message: string, line: number }) => {
    this.props.setError(this.props.module.id, e);
  };

  updateUrl = (url: string) => {
    this.setState({ urlInAddressBar: url });
  };

  sendUrl = () => {
    const { urlInAddressBar } = this.state;

    document.getElementById('sandbox').src = frameUrl(urlInAddressBar);
    this.commitUrl(urlInAddressBar);
  };

  handleRefresh = () => {
    const { history, historyPosition } = this.state;

    document.getElementById('sandbox').src = frameUrl(history[historyPosition]);
    this.setState({
      urlInAddressBar: history[historyPosition],
    });
  };

  handleBack = () => {
    document.getElementById('sandbox').contentWindow.postMessage(
      {
        type: 'urlback',
      },
      '*'
    );

    const { historyPosition, history } = this.state;
    this.setState({
      historyPosition: this.state.historyPosition - 1,
      urlInAddressBar: history[historyPosition - 1],
    });
  };

  handleForward = () => {
    document.getElementById('sandbox').contentWindow.postMessage(
      {
        type: 'urlforward',
      },
      '*'
    );

    const { historyPosition, history } = this.state;
    this.setState({
      historyPosition: this.state.historyPosition + 1,
      urlInAddressBar: history[historyPosition + 1],
    });
  };

  commitUrl = (url: string) => {
    const { history, historyPosition } = this.state;
    history.length = historyPosition + 1;
    this.setState({
      history: [...history, url],
      historyPosition: historyPosition + 1,
      urlInAddressBar: url,
    });
  };

  toggleProjectView = () => {
    const { setProjectView, isInProjectView, sandboxId } = this.props;
    setProjectView(sandboxId, !isInProjectView);
  };

  props: Props;
  state: State;
  element: ?Element;
  proxy: ?Object;
  rootInstance: ?Object;

  render() {
    const { bundle = {}, isInProjectView, module } = this.props;
    const {
      historyPosition,
      history,
      urlInAddressBar,
    } = this.state;

    const url = urlInAddressBar || '';

    if (bundle.processing) {
      return (
        <Container>
          <LoadingDepText>Loading the dependencies...</LoadingDepText>
        </Container>
      );
    }

    return (
      <Container>
        <Navigator
          url={decodeURIComponent(url)}
          onChange={this.updateUrl}
          onConfirm={this.sendUrl}
          onBack={historyPosition > 0 && this.handleBack}
          onForward={historyPosition < history.length - 1 && this.handleForward}
          onRefresh={this.handleRefresh}
          isProjectView={isInProjectView}
          toggleProjectView={this.toggleProjectView}
        />
        {module.error && <ErrorMessage error={module.error} />}
        <StyledFrame
          sandbox="allow-scripts allow-modals allow-pointer-lock allow-same-origin allow-popups allow-forms"
          src={frameUrl()}
          id="sandbox"
        />
      </Container>
    );
  }
}

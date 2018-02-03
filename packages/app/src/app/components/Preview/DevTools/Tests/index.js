// @flow
/* eslint-disable no-param-reassign */
import React from 'react';
import { actions, listen } from 'codesandbox-api';
import { dispatch } from 'app/components/Preview';

import immer from 'immer';

import { Container, TestDetails, TestContainer } from './elements';

import TestElement from './TestElement';
import TestDetailsContent from './TestDetails';
import TestSummary from './TestSummary';
import TestOverview from './TestOverview';

export type IMessage = {
  type: 'message' | 'command' | 'return',
  logType: 'log' | 'warn' | 'info' | 'error',
  arguments: any[],
};

export type Status = 'idle' | 'running' | 'pass' | 'fail';

type Props = {
  hidden: boolean,
  sandboxId: string,
  updateStatus: (type: 'warning' | 'error' | 'info' | 'clear') => void,
};

export type TestError = Error & {
  matcherResult?: {
    actual: any,
    expected: any,
    name: string,
    pass: boolean,
  },
  mappedErrors?: Array<{
    fileName: string,
    _originalFunctionName: string,
    _originalColumnNumber: number,
    _originalLineNumber: number,
    _originalScriptCode: Array<{
      lineNumber: number,
      content: string,
      highlight: boolean,
    }>,
  }>,
};

export type Test = {
  testName: Array<string>,
  duration: ?number,
  status: Status,
  errors: Array<TestError>,
  running: boolean,
  path: string,
};

export type File = {
  fileName: string,
  fileError?: TestError,
  tests: {
    [testName: string]: Test,
  },
};

type State = {
  selectedFilePath: ?string,
  files: {
    [path: string]: File,
  },
  running: boolean,
  watching: boolean,
};

class Tests extends React.Component<Props, State> {
  state = {
    files: {},
    selectedFilePath: null,
    running: true,
    watching: true,
  };

  listener: Function;
  currentDescribeBlocks: Array<string> = [];

  componentDidMount() {
    this.listener = listen(this.handleMessage);
  }

  componentWillUnmount() {
    if (this.listener) {
      this.listener();
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.sandboxId !== this.props.sandboxId) {
      this.setState({
        files: {},
        selectedFilePath: null,
        running: true,
      });
    }
  }

  selectFile = (file: File) => {
    this.setState({
      selectedFilePath:
        file.fileName === this.state.selectedFilePath ? null : file.fileName,
    });
  };

  handleMessage = (data: Object) => {
    if (data.type === 'test') {
      switch (data.event) {
        case 'total_test_start': {
          this.setState({
            ...this.state,
            running: true,
          });
          break;
        }
        case 'total_test_end': {
          this.setState({
            ...this.state,
            running: false,
          });
          break;
        }

        case 'add_file': {
          this.setState(
            immer(this.state, state => {
              state.files[data.path] = {
                tests: {},
                fileName: data.path,
              };
            })
          );
          break;
        }
        case 'remove_file': {
          this.setState(
            immer(this.state, state => {
              if (state.files[data.path]) {
                delete state.files[data.path];
              }
            })
          );
          break;
        }
        case 'file_error': {
          this.setState(
            immer(this.state, state => {
              if (state.files[data.path]) {
                state.files[data.path].fileError = data.error;
              }
            })
          );
          break;
        }
        case 'describe_start': {
          this.currentDescribeBlocks.push(data.blockName);
          break;
        }
        case 'describe_end': {
          this.currentDescribeBlocks.pop();
          break;
        }
        case 'add_test': {
          const testName = [...this.currentDescribeBlocks, data.testName];

          this.setState(
            immer(this.state, state => {
              if (!state.files[data.path]) {
                state.files[data.path] = {
                  tests: {},
                  fileName: data.path,
                };
              }

              state.files[data.path].tests[testName.join('||||')] = {
                status: 'idle',
                errors: [],
                testName,
                path: data.path,
              };
            })
          );
          break;
        }
        case 'test_start': {
          const testName = [...data.test.blocks, data.test.name];

          this.setState(
            immer(this.state, state => {
              const test =
                state.files[data.test.path].tests[testName.join('||||')];
              test.status = 'running';
              test.running = true;
            })
          );
          break;
        }
        case 'test_end': {
          const testName = [...data.test.blocks, data.test.name];

          if (data.test.status === 'fail') {
            this.props.updateStatus('error');
          } else if (data.test.status === 'pass') {
            this.props.updateStatus('info');
          }

          this.setState(
            immer(this.state, state => {
              const test =
                state.files[data.test.path].tests[testName.join('||||')];
              test.status = data.test.status;
              test.running = false;
              test.errors = data.test.errors;
              test.duration = data.test.duration;
            })
          );
          break;
        }
        default: {
          break;
        }
      }
    }
  };

  _lastFiles: {
    [path: string]: {
      file: File,
      status: Status,
    },
  } = {};
  getStatus = (file: ?File): Status => {
    if (file == null) {
      return 'idle';
    }

    const lastFile = this._lastFiles[file.fileName];

    // Simple memoization
    if (lastFile && file === lastFile.file && lastFile.status != null) {
      return lastFile.status;
    }

    if (file.fileError) {
      return 'fail';
    }

    const tests = file.tests;
    const status = Object.keys(tests).reduce((prev, next) => {
      const test = tests[next];
      if (test.status !== 'idle' && prev === 'idle') {
        return test.status;
      }

      if (test.status === 'pass' || prev !== 'pass') {
        return prev;
      }

      if (test.status === 'fail') {
        return 'fail';
      }

      if (test.status === 'running') {
        return 'running';
      }

      return prev;
    }, 'idle');

    this._lastFiles[file.fileName] = { file, status };

    return status;
  };

  toggleWatching = () => {
    dispatch(this.props.sandboxId, {
      type: 'set-test-watching',
      watching: !this.state.watching,
    });
    this.setState({ watching: !this.state.watching });
  };

  runAllTests = () => {
    this.setState({ files: {} }, () => {
      dispatch(this.props.sandboxId, {
        type: 'run-all-tests',
      });
    });
  };

  runTests = (file: File) => {
    this.setState(
      immer(this.state, state => {
        state.files[file.fileName].tests = {};
      }),
      () => {
        dispatch(this.props.sandboxId, {
          type: 'run-tests',
          path: file.fileName,
        });
      }
    );
  };

  openFile = (path: string) => {
    dispatch(this.props.sandboxId, actions.editor.openModule(path));
  };

  render() {
    if (this.props.hidden) {
      return null;
    }

    const { selectedFilePath } = this.state;
    const selectedFile = this.state.files[selectedFilePath || ''];

    const fileStatuses = {};
    Object.keys(this.state.files).forEach(path => {
      fileStatuses[path] = this.getStatus(this.state.files[path]);
    });

    const tests = [];
    Object.keys(this.state.files).forEach(path => {
      const file = this.state.files[path];
      Object.keys(file.tests).forEach(t => {
        tests.push(file.tests[t]);
      });
    });

    return (
      <Container>
        <TestContainer>
          <TestSummary
            running={this.state.running}
            watching={this.state.watching}
            toggleWatching={this.toggleWatching}
            runAllTests={this.runAllTests}
            fileStatuses={fileStatuses}
            files={this.state.files}
            tests={tests}
          />

          <div style={{ marginTop: '1rem' }}>
            {Object.keys(this.state.files)
              .sort()
              .map(fileName => (
                <TestElement
                  selectFile={this.selectFile}
                  selectedFile={selectedFile}
                  file={this.state.files[fileName]}
                  status={fileStatuses[fileName]}
                  key={fileName}
                  runTests={this.runTests}
                  openFile={this.openFile}
                />
              ))}
          </div>
        </TestContainer>
        <TestDetails>
          {selectedFile ? (
            <TestDetailsContent
              status={this.getStatus(selectedFile)}
              file={selectedFile}
              openFile={this.openFile}
              runTests={this.runTests}
            />
          ) : (
            <TestOverview tests={tests} openFile={this.openFile} />
          )}
        </TestDetails>
      </Container>
    );
  }
}

export default {
  title: 'Tests',
  Content: Tests,
  actions: [],
};

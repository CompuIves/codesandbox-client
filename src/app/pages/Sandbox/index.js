// @flow
import React from 'react';
import styled from 'styled-components';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { createSelector } from 'reselect';
import Fork from 'react-icons/lib/go/repo-forked';
import Download from 'react-icons/lib/go/cloud-download';

import type { Sandbox } from 'common/types';

import { sandboxesSelector } from 'app/store/entities/sandboxes/selectors';
import sandboxActionCreators from 'app/store/entities/sandboxes/actions';
import userActionCreators from 'app/store/user/actions';
import { jwtSelector } from 'app/store/user/selectors';

import Title from 'app/components/text/Title';
import Centered from 'app/components/flex/Centered';
import Navigation from 'app/containers/Navigation';

import Editor from './Editor';
import Header from './Header';

type Props = {
  sandbox: ?Sandbox,
  sandboxes: { [id: string]: Sandbox },
  sandboxActions: typeof sandboxActionCreators,
  userActions: typeof userActionCreators,
  hasLogin: boolean,
  match: { params: { id: ?string } },
};
type State = {
  notFound: boolean,
};

const Container = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
`;

const NavigationContainer = styled.div`
  padding: 0.5rem 1rem;
  background-color: #1C2022;
  box-shadow: inset 0 1px 13px 0 rgba(0,0,0,0.50);
`;

const mapStateToProps = createSelector(
  sandboxesSelector,
  (_, props) => props.match.params.id,
  jwtSelector,
  (sandboxes, id, jwt) => {
    const sandbox = sandboxes[id];

    return { sandbox, sandboxes, hasLogin: !!jwt };
  },
);
const mapDispatchToProps = dispatch => ({
  sandboxActions: bindActionCreators(sandboxActionCreators, dispatch),
  userActions: bindActionCreators(userActionCreators, dispatch),
});
class SandboxPage extends React.PureComponent {
  componentDidMount() {
    this.fetchSandbox();
  }

  fetchSandbox = () => {
    const { id } = this.props.match.params;

    if (id) {
      this.props.sandboxActions.getById(id).then(null, this.handleNotFound);
    }
  };

  componentDidUpdate(oldProps) {
    const newId = this.props.match.params.id;
    const oldId = oldProps.match.params.id;

    if (newId != null && oldId !== newId) {
      this.setState({ notFound: false }); // eslint-disable-line
      if (!this.props.sandboxes[newId] || !this.props.sandboxes[newId].forked) {
        this.fetchSandbox();
      }
    }
  }

  handleNotFound = e => {
    if (e.response && e.response.status === 404) {
      this.setState({ notFound: true });
    }
  };

  props: Props;
  state: State;
  state = { notFound: false };

  render() {
    const { sandbox, match } = this.props;
    if (this.state.notFound) {
      return (
        <Centered horizontal vertical>
          <Title>
            We could not find the Sandbox you{"'"}re looking for...
            <br />
            <br />
            <Link to="/s/new">Create Sandbox</Link>
          </Title>
        </Centered>
      );
    }
    if (!sandbox) return null;

    document.title = sandbox.title
      ? `${sandbox.title} - CodeSandbox`
      : 'Editor - CodeSandbox';

    //     <Header
    //   sandbox={sandbox}
    //   sandboxActions={sandboxActions}
    //   userActions={userActions}
    //   user={user}
    //   workspaceHidden={workspaceHidden}
    //   toggleWorkspace={toggleWorkspace}
    //   canSave={notSynced}
    // />
    return (
      <Container>
        <NavigationContainer>
          <Navigation
            title="Editor"
            actions={[
              { name: 'Fork', Icon: Fork },
              { name: 'Download', Icon: Download },
            ]}
          />
        </NavigationContainer>
        <div style={{ position: 'relative', height: '100%' }}>
          <Editor match={match} sandbox={sandbox} />
        </div>
      </Container>
    );
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(SandboxPage);

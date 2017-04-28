import React from 'react';
import styled from 'styled-components';
import Fullscreen from 'app/components/flex/Fullscreen';

import MaxWidth from './MaxWidth';
import Header from './Header';
import Navigation from './Navigation';
import Showcase from './Showcase';
import Margin from '../../components/spacing/Margin';

type Props = {
  username: string,
};

const Container = styled(Fullscreen)`
  color: white;

  display: flex;
  flex-direction: column;
`;

const Content = styled(Fullscreen)`
  border-top: 1px solid ${props => props.theme.background3};
  border-bottom: 1px solid ${props => props.theme.background3};
  box-shadow: 0 3px 3px rgba(0, 0, 0, 0.5);
  background-color: #272C2E;
`;

export default class Profile extends React.PureComponent {
  props: Props;

  render() {
    document.title = 'Ives van Hoorne - CodeSandbox';

    return (
      <Container>
        <Header />
        <Content>
          <MaxWidth>
            <Navigation />
          </MaxWidth>
        </Content>
        <MaxWidth>
          <Margin horizontal={2}>
            <Showcase title="Redux Form - Simple Example" />
          </Margin>
        </MaxWidth>
      </Container>
    );
  }
}

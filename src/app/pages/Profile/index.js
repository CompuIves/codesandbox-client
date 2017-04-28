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
  background-image: linear-gradient(-180deg, #282D2F 0%, #1D1F20 99%);
`;

const Content = styled(Fullscreen)`
  border-top: 1px solid ${props => props.theme.background3};
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
        <MaxWidth width={1024}>
          <Margin horizontal={2}>
            <Showcase title="Redux Form - Simple Example" />
          </Margin>
        </MaxWidth>
      </Container>
    );
  }
}

import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import Tooltip from 'app/components/Tooltip';

const styles = props =>
  `
  transition: 0.3s ease all;
  display: flex;
  flex-direction: row;
  align-items: center;
  vertical-align: middle;
  font-size: .875rem;
  line-height: 1;
  padding: 0 .75rem;
  height: 100%;
  color: rgba(255,255,255,0.7);
  cursor: pointer;
  box-sizing: inherit;
  border-bottom: 2px solid transparent;
  z-index: 1;
  ${props.highlight ? `
      background-color: ${props.theme.secondary.darken(0.1)()};
      color: white;
      border-bottom: 1px solid ${props.theme.secondary.darken(0.1)()};

      &:hover {
        background-color: ${props.theme.secondary.darken(0.2)()};
      }
  ` : `

    &:hover {
      color: rgba(255,255,255, 1);
      border-color: ${props.theme.secondary()}
    }
  `}
`;

const Title = styled.span`
  padding-left: 0.5rem;
  @media (max-width: 1300px) {
    display: none;
  }
`;

const Action = styled.div`
  ${styles}
`;

const ActionLink = styled(Link)`
  ${styles}
  text-decoration: none;
`;

const ActionTooltip = styled(Tooltip)`
  ${styles}
  ${props => !props.onClick && `
    color: rgba(255,255,255,0.3);
    cursor: default;

    &:hover {
      color: rgba(255,255,255, 0.4);
    }
  `};
`;

const IconContainer = styled.div`
  vertical-align: middle;
`;

type Props = {
  onClick: ?Function,
  Icon: React.Component<any, any>,
  title: ?string,
  href: ?string,
  placeholder: ?boolean,
  highlight: ?boolean,
  tooltip: ?string,
};

export default ({
  onClick,
  href,
  Icon,
  title,
  tooltip,
  highlight,
  placeholder,
}: Props) => {
  if (placeholder || tooltip) {
    return (
      <ActionTooltip message={placeholder || tooltip} onClick={onClick}>
        <IconContainer>
          <Icon />
        </IconContainer> {title && <Title>{title}</Title>}
      </ActionTooltip>
    );
  }
  if (onClick) {
    return (
      <Action highlight={highlight} onClick={onClick}>
        <IconContainer>
          <Icon />
        </IconContainer> {title && <Title>{title}</Title>}
      </Action>
    );
  }

  return (
    <ActionLink to={href}>
      <IconContainer>
        <Icon />
      </IconContainer> {title && <Title>{title}</Title>}
    </ActionLink>
  );
};

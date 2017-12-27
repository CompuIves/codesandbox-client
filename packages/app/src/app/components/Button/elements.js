import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import Link from 'react-router-dom/Link';
import theme from 'common/theme';

function ButtonBase({ small, block, primary, secondary, red, ...attr }) {
  return <button {...attr} />;
}

function ABase({ small, block, primary, secondary, red, ...attr }) {
  return <a {...attr} />; // eslint-disable-line
}

function LinkBase({ small, block, primary, secondary, red, ...attr }) {
  return <Link {...attr} />; // eslint-disable-line
}

const getBackgroundColor = ({ disabled, red, secondary }) => {
  if (disabled) return `background: ${theme.background2.darken(0.1)()}`;
  if (secondary) return `background: #3A4B5D`;
  if (red)
    return `background-image: linear-gradient(270deg, #F27777, #400000);`;
  return `background-image: linear-gradient(270deg, #fed29d, #A58B66, #7abae8, #56a0d6);`;
};

const getColor = ({ disabled, secondary }) => {
  if (disabled) return theme.background2.lighten(1.5)();
  if (secondary) return `#56a0d6`;
  return 'white';
};

const getBorder = ({ secondary }) => {
  if (secondary) return `1px solid #56a0d6`;
  return 'none';
};

const forward = keyframes`
  0%{background-position:0% 50%}
  100%{background-position:100% 50%}
`;

const backward = keyframes`
  0%{background-position:100% 0%}
  100%{background-position:0% 50%}
`;

const styles = css`
  transition: 0.3s ease all;
  animation-name: ${backward};
  animation-duration: 300ms;
  animation-timing-function: ease;

  border: none;
  outline: none;
  ${props => getBackgroundColor(props)};
  background-size: 720%;

  border: ${props => getBorder(props)};
  border-radius: 4px;

  box-sizing: border-box;
  font-size: 1.125rem;
  text-align: center;
  color: ${props => getColor(props)};
  font-weight: 400;
  ${props => !props.disabled && `box-shadow: 0 3px 3px rgba(0, 0, 0, 0.5);`};
  width: ${props => (props.block ? '100%' : 'inherit')};

  ${props => () => {
    if (props.small) {
      return `
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
      `;
    }
    return 'padding: 0.65rem 2.25rem;';
  }} user-select: none;
  text-decoration: none;

  ${props =>
    !props.disabled &&
    `
  cursor: pointer;
  &:hover {
    animation-name: ${forward};
    animation-duration: 300ms;
    animation-timing-function: ease;
    animation-direction: normal;
    animation-fill-mode: forwards;

    box-shadow: 0 7px 10px rgba(0, 0, 0, 0.5);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(1px);
    box-shadow: 0 0 0 rgba(0, 0, 0, 0.5);
  }`};
`;

export const LinkButton = styled(LinkBase)`
  ${styles};
`;
export const AButton = styled(ABase)`
  ${styles};
`;
export const Button = styled(ButtonBase)`
  ${styles};
`;

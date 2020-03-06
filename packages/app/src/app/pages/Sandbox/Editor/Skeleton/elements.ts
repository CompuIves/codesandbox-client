import styled, { css, keyframes } from 'styled-components';

const pulse = keyframes`
  0% { background-position: 100% 50%; }
  100% { background-position: -100% 50%; }
`;

export const SkeletonTextBlock = styled.div(
  props => css`
    height: 16px;
    width: 200px;
    animation: ${pulse} 2s linear infinite;
    background: linear-gradient(
      90deg,
      ${props.theme.colors?.sideBar.border + '40'} 0%,
      ${props.theme.colors?.sideBar.border + '40'} 40%,
      ${props.theme.colors?.sideBar.border + '80'} 50%,
      ${props.theme.colors?.sideBar.border + '40'} 60%,
      ${props.theme.colors?.sideBar.border + '40'} 100%
    );
    background-size: 200% 200%;
  `
);

export const SkeletonWrapper = styled.div`
  position: absolute;
  font-family: Inter, sans-serif;
  transition: opacity 0.5s ease-out;
  opacity: 1;
  background-color: ${props =>
    props.theme.colors?.editor?.background || 'black'};
  width: 100%;
  height: 100%;
  display: flex;
  top: 0;
  left: 0;
  z-index: 10;
`;

export const SkeletonExplorer = styled.div`
  flex: 0 0 272px;
  border-right: 1px solid
    ${props => props.theme.colors?.sideBar.border || 'rgba(0, 0, 0, 0.5)'};
  background-color: ${props =>
    props.theme.colors?.sideBar.background || 'rgba(0, 0, 0, 0.5)'};
  color: ${props => props.theme.colors?.sideBar.foreground || '#ffffff'} + '80';
`;

export const SkeletonEditor = styled.div`
  flex: 1;
  border-right: 1px solid
    ${props => props.theme.colors?.sideBar.border || 'rgba(0, 0, 0, 0.5)'};
`;
export const SkeletonEditorTop = styled.div`
  height: 34px;
  border-bottom: 1px solid
    ${props => props.theme.colors?.sideBar.border || 'rgba(0, 0, 0, 0.5)'};
`;
export const SkeletonDevtools = styled.div`
  flex: 1;
`;
export const SkeletonDevtoolsTop = styled.div`
  height: 34px;
`;
export const SkeletonDevtoolsNavigator = styled.div`
  height: 34px;
  border-bottom: 1px solid
    ${props => props.theme.colors?.sideBar.border || 'rgba(0, 0, 0, 0.5)'};
`;
export const SkeletonDevtoolsIframe = styled.div`
  height: 100%;
  background-color: #fff;
`;

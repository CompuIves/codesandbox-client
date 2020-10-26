import styled, { css, keyframes } from 'styled-components';

export const TabButton = styled.button`
  background: transparent;
  padding: 0;
  color: inherit;
  border: none;
  font-size: 19px;
  padding-bottom: 12px;
  outline: none;
  cursor: pointer;
  transition: color 300ms ease;
  ${props =>
    props.active &&
    css`
      color: white;
    `};
`;

export const Tab = styled.li`
  border-bottom: 1px solid ${props => props.theme.homepage.muted};
  color: ${props => props.theme.homepage.muted};
  padding-right: 13px;
  padding-left: 13px;
  white-space: nowrap;
  margin-bottom: 4px;

  ${props =>
    props.active &&
    css`
      border-color: white;
    `}
`;

export const Tabs = styled.ul`
  display: flex;
  justify-content: center;
  list-style: none;
  margin: auto;
  max-width: 80%;

  li:last-child {
    padding-left: 13px;
  }

  li:first-child {
    padding-right: 13px;
  }

  ${props => props.theme.breakpoints.sm} {
    max-width: 100%;
    justify-content: flex-start;
    overflow: scroll;
  }
`;

export const TabsWrapper = styled.div`
  visibility: hidden;
  opacity: 0;
  transition: all 0.2s ease;
  transition-delay: 0.8s;
  height: 0;

  ${props =>
    props.active &&
    css`
      visibility: visible;
      opacity: 1;
    `}
`;

export const VideoComponent = styled.video`
  margin: 40px auto;
  display: block;
  opacity: 0.6;
  transform: rotateX(60deg) rotateY(0deg) rotateZ(45deg) scale(1.2)
    translateY(-200px);
  max-width: 100%;
  transition: all 1.2s cubic-bezier(0.85, 0, 0.15, 1);
  margin-bottom: 230px;
  border: 1px solid rgb(36, 36, 36);
  box-shadow: 0px 9.55893px 19.1179px rgba(0, 0, 0, 0.24),
    0px 9.55893px 4.77946px rgba(0, 0, 0, 0.12);
  border-radius: 4px;

  ${props => props.theme.breakpoints.md} {
    margin: auto;
    transform: translateY(20px);
  }

  @media only screen and (min-device-width: 768px) and (max-device-width: 1024px) and (orientation: portrait) {
    transform: translateY(-250px);
  }

  @media screen and (max-width: 450px) {
    transform: translateY(-40px);
  }

  @media screen and (max-width: 450px) and (max-height: 750px) {
    transform: translateY(-150px);
  }

  ${props =>
    props.active &&
    css`
      opacity: 1;
      transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1)
        translateY(230px);

      ${props.theme.breakpoints.md} {
        transform: translateY(160px);
        height: auto;
        margin-bottom: 310px;
        margin-top: 200px;
      }
    `}
`;

const fadeIn = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`;

export const Paragraph = styled.p`
  animation: 300ms ${fadeIn} ease-out;
  text-align: center;
  width: 604px;
  max-width: 100%;
  margin: auto;
  font-size: 19px;
  line-height: 23px;
  text-align: center;
  margin-top: 40px;
  min-height: 46px;
`;

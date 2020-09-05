import styled, { keyframes } from 'styled-components';

const dropIn = (offset = 100) => keyframes`
  0% { 
    transform: translateY(${offset}px) translateZ(200px);
    filter: blur(20px);
    opacity: 0;
    box-shadow: 10px 10px 10px rgba(0, 0, 0, 0.7);
  }

  70% {
    filter: blur(0);
    opacity: 1;
    box-shadow: 0;
  }

  100% {
    transform: translateZ(0px);
    filter: blur(0);
    opacity: 1;
    box-shadow: 0;
  }
`;

export const EditorElement = styled.img`
  animation: ${(props) => dropIn(props.i * 250)} 3s;
  animation-delay: ${(props) => props.i * 100}ms;
  animation-fill-mode: backwards;

  z-index: ${(props) => props.i};
`;

export const HeroWrapper = styled.section`
  position: relative;
  display: flex;
  justify-content: center;

  text-align: center;
  overflow: hidden;
  padding: 0 2rem;

  height: 100vh;
  min-height: 1080px;

  perspective: 1000;

  ${(props) => props.theme.breakpoints.sm} {
    min-height: 800px;
  }
`;

export const SignUp = styled.p`
  font-size: 13px;
  line-height: 0.8125rem;
  text-align: center;
  margin-top: 0.5rem;
  color: #999;
`;

export const Border = styled.div`
  position: absolute;
  background: ${(props) => props.theme.homepage.grey};
  left: 0;
  width: 100%;
  height: 1px;
`;

export const StyledEditorLink = styled.a`
  transition: 0.3s ease opacity;
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 110px;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  transition: 0.3 ease all;
  border-radius: 4px;
  font-size: 1.25rem;
  text-decoration: none;

  color: white;
  font-weight: 400;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0;

  &:hover {
    opacity: 1;
  }
`;

export const HeroBottom = styled.div`
  position: absolute;
  bottom: -30%;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  ${(props) => props.theme.breakpoints.sm} {
    padding: 0 0.5rem;
    line-height: 1.4;
    bottom: -50px;
  }
`;

export const CountText = styled.div`
  font-size: 1.25rem;
  color: #757575;
  margin-bottom: 1.5rem;
  ${(props) => props.theme.breakpoints.sm} {
    font-size: 0.875rem;
  }
`;

export const InspiredText = styled.span`
  transition: 0.3s ease color;
  font-size: 1rem;
  color: #757575;
  margin-bottom: 1rem;
  text-decoration: none;

  ${(props) => props.theme.breakpoints.sm} {
    font-size: 0.875rem;
  }
`;

export const HeroImage = styled.img`
  max-width: 1200px;
  min-width: 100%;
  overflow: hidden;
  border-radius: 4px;
  box-shadow: rgba(0, 0, 0, 0.3) 20px 14px 47px 0px;

  ${(props) => props.theme.breakpoints.md} {
    width: 120vw;
  }
`;

export const Title = styled.h1`
  font-size: 2.5rem;
  line-height: 57px;
  font-family: ${(props) => props.theme.homepage.appleFont};

  color: ${(props) => props.theme.homepage.white};
  padding: 0;
  margin: 0;
  margin-bottom: 0.5rem;
  font-weight: 500;

  ${(props) => props.theme.breakpoints.md} {
    font-size: 1.8rem;
    line-height: 1.2;
  }

  ${(props) => props.theme.breakpoints.sm} {
    font-size: 1.4rem;
  }
`;

export const SubTitle = styled.h2`
  font-weight: normal;
  font-size: 1.125rem;
  line-height: 1.3;
  color: ${(props) => props.theme.homepage.white};
  margin: 0;
  margin-bottom: 1rem;

  ${(props) => props.theme.breakpoints.sm} {
    font-size: 0.875rem;
  }
`;

import styled from 'styled-components';

export const Container = styled.div`
  min-height: 100vh;
  width: 100%;
  padding-top: 3vh;
  text-align: center;
  box-sizing: border-box;
`;

export const Buttons = styled.div`
  display: flex;
  justify-content: center;

  > button {
    margin: 1rem;
  }
`;

export const TokenInput = styled.input`
  color: white;

  width: 100%;
  max-width: 20em;
  border: none;
  outline: none;
  padding: 1rem;
  font-size: 1.5rem;
  text-align: center;
  margin: auto;

  border-radius: 2px;
  box-shadow: inset 0 0 3px rgba(0, 0, 0, 0.5);

  background-color: rgba(0, 0, 0, 0.5);
`;

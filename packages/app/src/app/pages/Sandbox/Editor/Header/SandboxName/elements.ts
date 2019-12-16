import styled, { css } from 'styled-components';
import AutosizeInput from 'react-input-autosize';

export const Container = styled.div`
  display: flex;
  position: relative;
  font-size: 0.875rem;
  align-items: center;
  white-space: nowrap;
  text-align: center;
`;

export const Folder = styled.div`
  overflow: hidden;
  display: none;

  @media screen and (min-width: 950px) {
    display: block;
  }
`;

export const FolderName = styled.button`
  display: inline-block;
  cursor: pointer;
  transition: 0.3s ease color;
  padding: 0;
  margin: 0;
  outline: 0;
  border: 0;
  background-color: transparent;
  color: inherit;

  margin-right: 0.25rem;
  &:hover {
    color: white;
  }
`;

export const Form = styled.form`
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const NameInput = styled(AutosizeInput)`
  input {
    display: inline-block;
    background-color: transparent;
    outline: 0;
    border: 0;
    color: white;
    margin: 0;
    padding: 0;
    text-align: center;
  }
`;

export const Name = styled.span<{ owned?: boolean }>`
  ${({ theme, owned }) => css`
    color: ${theme.light ? 'black' : 'white'};
    margin-left: 0.25rem;
    margin-right: ${owned ? 0 : '0.5rem'};
    cursor: ${owned ? 'pointer' : 'initial'};
    text-overflow: ellipsis;
    appearance: ${owned ? 'none' : 'initial'};
    background: none;
    border: 0;
    outline: 0;
  `}
`;

export const Main = styled.div`
  display: none;

  @media screen and (min-width: 826px) {
    display: block;
  }
`;

export const TemplateBadge = styled.label`
  background: ${props => props.theme['activityBarBadge.background']};
  color: ${props => props.theme['activityBarBadge.foreground']};
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 11px;
  padding: 0px 8px;
  border-radius: 2px;
  margin-left: 1rem;
  height: 1.5rem;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  cursor: default;
`;

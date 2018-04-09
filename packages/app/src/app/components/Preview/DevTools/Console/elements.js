import styled from 'styled-components';
import theme from 'common/theme';

export const Container = styled.div`
  background-color: ${props => props.theme.background};
  font-family: Menlo, monospace;
  color: rgba(255, 255, 255, 0.8);
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  max-height: calc(100% - 2rem);
`;

export const Messages = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  overflow-x: hidden;
  white-space: pre-wrap;
`;

export const IconContainer = styled.div`
  display: inline-flex;
  padding: 0.5rem 0;
  width: 24px;
  align-items: center;
  justify-content: center;
`;

export const inspectorTheme = {
  PADDING: '0.4rem 1.5rem 0.4rem 0px',

  LOG_ICON: '',
  LOG_BORDER: '#191C1D',
  LOG_ICON_HEIGHT: '26px',
  LOG_ICON_WIDTH: '1em',

  LOG_WARN_COLOR: 'rgb(245, 211, 150)',
  LOG_WARN_BACKGROUND: '#332A00',
  LOG_WARN_BORDER: '#665500',
  LOG_WARN_ICON: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' fill='%23F5D396' viewBox='0 0 40 40'%3e%3cpath d='M21.6 23.4v-6.8h-3.2v6.8h3.2zm0 6.6v-3.4h-3.2V30h3.2zm-20 5L20 3.4 38.4 35H1.6z'/%3e%3c/svg%3e")`,

  LOG_ERROR_COLOR: 'rgb(254, 127, 127)',
  LOG_ERROR_BACKGROUND: '#280000',
  LOG_ERROR_BORDER: '#5B0000',
  LOG_ERROR_ICON: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' fill='%23FE7F7F' viewBox='0 0 40 40'%3e%3cpath d='M21.6 21.6v-10h-3.2v10h3.2zm0 6.8V25h-3.2v3.4h3.2zM20 3.4a16.6 16.6 0 1 1 0 33.2 16.6 16.6 0 1 1 0-33.2z'/%3e%3c/svg%3e")`,

  BASE_FONT_FAMILY: 'Menlo, monospace',
  BASE_FONT_SIZE: '13px',
  BASE_LINE_HEIGHT: '18px',

  BASE_BACKGROUND_COLOR: 'rgba(0, 0, 0, 0)',
  BASE_COLOR: 'rgb(213, 213, 213)',

  OBJECT_NAME_COLOR: theme.secondary(),
  OBJECT_VALUE_NULL_COLOR: 'rgb(127, 127, 127)',
  OBJECT_VALUE_UNDEFINED_COLOR: 'rgb(127, 127, 127)',
  OBJECT_VALUE_REGEXP_COLOR: '#fac863',
  OBJECT_VALUE_STRING_COLOR: '#fac863',
  OBJECT_VALUE_SYMBOL_COLOR: '#fac863',
  OBJECT_VALUE_NUMBER_COLOR: 'hsl(252, 100%, 75%)',
  OBJECT_VALUE_BOOLEAN_COLOR: 'hsl(252, 100%, 75%)',
  OBJECT_VALUE_FUNCTION_KEYWORD_COLOR: 'rgb(242, 85, 217)',

  HTML_TAG_COLOR: 'rgb(93, 176, 215)',
  HTML_TAGNAME_COLOR: 'rgb(93, 176, 215)',
  HTML_TAGNAME_TEXT_TRANSFORM: 'lowercase',
  HTML_ATTRIBUTE_NAME_COLOR: 'rgb(155, 187, 220)',
  HTML_ATTRIBUTE_VALUE_COLOR: 'rgb(242, 151, 102)',
  HTML_COMMENT_COLOR: 'rgb(137, 137, 137)',
  HTML_DOCTYPE_COLOR: 'rgb(192, 192, 192)',

  ARROW_COLOR: 'rgb(145, 145, 145)',
  ARROW_MARGIN_RIGHT: 3,
  ARROW_FONT_SIZE: 11,

  TREENODE_FONT_FAMILY: 'Menlo, monospace',
  TREENODE_FONT_SIZE: '13px',
  TREENODE_LINE_HEIGHT: '16px',
  TREENODE_PADDING_LEFT: 12,

  TABLE_BORDER_COLOR: 'rgb(85, 85, 85)',
  TABLE_TH_BACKGROUND_COLOR: 'rgb(44, 44, 44)',
  TABLE_TH_HOVER_COLOR: 'rgb(48, 48, 48)',
  TABLE_SORT_ICON_COLOR: 'black',
  TABLE_DATA_BACKGROUND_IMAGE:
    'linear-gradient(rgba(255, 255, 255, 0), rgba(255, 255, 255, 0) 50%, rgba(51, 139, 255, 0.0980392) 50%, rgba(51, 139, 255, 0.0980392))',
  TABLE_DATA_BACKGROUND_SIZE: '128px 32px',
};

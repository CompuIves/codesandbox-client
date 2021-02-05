import { SandpackTheme } from '../types';

export const sandpackLightTheme: SandpackTheme = {
  palette: {
    highlightText: '#1f2933',
    defaultText: '#999999',
    inactive: '#e4e7eb',
    mainBackground: '#f8f9fb',
    inputBackground: '#ffffff',
    accent: '#6caedd',
  },
  syntax: {
    plain: '#1F2933',
    disabled: '#A7B6C2',
    keyword: '#1A56DB',
    tag: '#1A56DB',
    punctuation: '#394b59',
    definition: '#A23DAD',
    property: '#14919B',
    static: '#1992D4',
  },
};

export const sandpackDarkTheme: SandpackTheme = {
  palette: {
    highlightText: '#FFFFFF',
    defaultText: '#999999',
    inactive: '#343434',
    mainBackground: '#040404',
    inputBackground: '#242424',
    accent: '#6caedd',
  },
  syntax: {
    plain: '#FFFFFF',
    disabled: '#757575',
    keyword: '#64D2FF',
    tag: '#86D9CA',
    punctuation: '#ffffff',
    definition: '#DFAB5C',
    property: '86D9CA',
    static: '#A8A5F3',
  },
};

export const nightOwlTheme: SandpackTheme = {
  palette: {
    highlightText: 'rgb(197, 228, 253)',
    defaultText: 'rgb(95, 126, 151)',
    inactive: 'rgb(58, 62, 77)',
    mainBackground: 'rgb(1, 22, 39)',
    inputBackground: 'rgb(11, 41, 66)',
    accent: '#7fdbca',
  },
  syntax: {
    plain: '#d6deeb',
    disabled: '#999999',
    keyword: '#c792ea',
    tag: '#7fdbca',
    punctuation: '#d6deeb',
    definition: '#A23DAD',
    property: '#addb67',
    static: '#ecc48d',
  },
};

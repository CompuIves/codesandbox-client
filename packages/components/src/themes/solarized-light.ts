export default {
  name: 'Solarized (light)',
  tokenColors: [
    {
      settings: {
        background: '#FDF6E3',
        foreground: '#657B83',
      },
    },
    {
      scope: ['meta.embedded', 'source.groovy.embedded'],
      settings: {
        background: '#FDF6E3',
        foreground: '#657B83',
      },
    },
    {
      name: 'Comment',
      scope: 'comment',
      settings: {
        fontStyle: 'italic',
        foreground: '#93A1A1',
      },
    },
    {
      name: 'String',
      scope: 'string',
      settings: {
        foreground: '#2AA198',
      },
    },
    {
      name: 'Regexp',
      scope: 'string.regexp',
      settings: {
        foreground: '#D30102',
      },
    },
    {
      name: 'Number',
      scope: 'constant.numeric',
      settings: {
        foreground: '#D33682',
      },
    },
    {
      name: 'Variable',
      scope: ['variable.language', 'variable.other'],
      settings: {
        foreground: '#268BD2',
      },
    },
    {
      name: 'Keyword',
      scope: 'keyword',
      settings: {
        foreground: '#859900',
      },
    },
    {
      name: 'Storage',
      scope: 'storage',
      settings: {
        fontStyle: 'bold',
        foreground: '#073642',
      },
    },
    {
      name: 'Class name',
      scope: ['entity.name.class', 'entity.name.type'],
      settings: {
        foreground: '#268BD2',
      },
    },
    {
      name: 'Function name',
      scope: 'entity.name.function',
      settings: {
        foreground: '#268BD2',
      },
    },
    {
      name: 'Variable start',
      scope: 'punctuation.definition.variable',
      settings: {
        foreground: '#859900',
      },
    },
    {
      name: 'Embedded code markers',
      scope: [
        'punctuation.section.embedded.begin',
        'punctuation.section.embedded.end',
      ],
      settings: {
        foreground: '#D30102',
      },
    },
    {
      name: 'Built-in constant',
      scope: ['constant.language', 'meta.preprocessor'],
      settings: {
        foreground: '#B58900',
      },
    },
    {
      name: 'Support.construct',
      scope: ['support.function.construct', 'keyword.other.new'],
      settings: {
        foreground: '#D30102',
      },
    },
    {
      name: 'User-defined constant',
      scope: ['constant.character', 'constant.other'],
      settings: {
        foreground: '#CB4B16',
      },
    },
    {
      name: 'Inherited class',
      scope: 'entity.other.inherited-class',
      settings: {},
    },
    {
      name: 'Function argument',
      scope: 'variable.parameter',
      settings: {},
    },
    {
      name: 'Tag name',
      scope: 'entity.name.tag',
      settings: {
        foreground: '#268BD2',
      },
    },
    {
      name: 'Tag start/end',
      scope: [
        'punctuation.definition.tag.begin',
        'punctuation.definition.tag.end',
      ],
      settings: {
        foreground: '#93A1A1',
      },
    },
    {
      name: 'Tag attribute',
      scope: 'entity.other.attribute-name',
      settings: {
        foreground: '#93A1A1',
      },
    },
    {
      name: 'Library function',
      scope: 'support.function',
      settings: {
        foreground: '#268BD2',
      },
    },
    {
      name: 'Continuation',
      scope: 'punctuation.separator.continuation',
      settings: {
        foreground: '#D30102',
      },
    },
    {
      name: 'Library constant',
      scope: 'support.constant',
      settings: {},
    },
    {
      name: 'Library class/type',
      scope: ['support.type', 'support.class'],
      settings: {
        foreground: '#859900',
      },
    },
    {
      name: 'Library Exception',
      scope: 'support.type.exception',
      settings: {
        foreground: '#CB4B16',
      },
    },
    {
      name: 'Library variable',
      scope: 'support.other.variable',
      settings: {},
    },
    {
      name: 'Invalid',
      scope: 'invalid',
      settings: {},
    },
    {
      name: 'diff: header',
      scope: ['meta.diff', 'meta.diff.header'],
      settings: {
        background: '#b58900',
        fontStyle: 'italic',
        foreground: '#E0EDDD',
      },
    },
    {
      name: 'diff: deleted',
      scope: 'markup.deleted',
      settings: {
        background: '#eee8d5',
        fontStyle: '',
        foreground: '#dc322f',
      },
    },
    {
      name: 'diff: changed',
      scope: 'markup.changed',
      settings: {
        background: '#eee8d5',
        fontStyle: '',
        foreground: '#cb4b16',
      },
    },
    {
      name: 'diff: inserted',
      scope: 'markup.inserted',
      settings: {
        background: '#eee8d5',
        foreground: '#219186',
      },
    },
    {
      name: 'Markup Quote',
      scope: 'markup.quote',
      settings: {
        foreground: '#859900',
      },
    },
    {
      name: 'Markup Lists',
      scope: 'markup.list',
      settings: {
        foreground: '#B58900',
      },
    },
    {
      name: 'Markup Styling',
      scope: ['markup.bold', 'markup.italic'],
      settings: {
        foreground: '#D33682',
      },
    },
    {
      name: 'Markup Inline',
      scope: 'markup.inline.raw',
      settings: {
        fontStyle: '',
        foreground: '#2AA198',
      },
    },
    {
      name: 'Markup Headings',
      scope: 'markup.heading',
      settings: {
        foreground: '#268BD2',
      },
    },
    {
      name: 'Markup Setext Header',
      scope: 'markup.heading.setext',
      settings: {
        fontStyle: '',
        foreground: '#268BD2',
      },
    },
  ],
  colors: {
    focusBorder: '#D3AF86',
    'input.background': '#DDD6C1',
    'input.foreground': '#586E75',
    'input.placeholderForeground': '#586E75AA',
    'inputOption.activeBorder': '#D3AF86',
    'badge.background': '#B58900AA',
    'progressBar.background': '#B58900',
    'dropdown.background': '#EEE8D5',
    'dropdown.border': '#D3AF86',
    'button.background': '#AC9D57',
    'selection.background': '#CCC4B0',
    'list.activeSelectionBackground': '#DFCA88',
    'list.activeSelectionForeground': '#6C6C6C',
    'list.focusBackground': '#DFCA8866',
    'list.hoverBackground': '#DFCA8844',
    'list.inactiveSelectionBackground': '#D1CBB8',
    'list.highlightForeground': '#B58900',

    'editor.background': '#FDF6E3',

    'editorWidget.background': '#EEE8D5',
    'editorCursor.foreground': '#657B83',
    'editorWhitespace.foreground': '#586E7580',
    'editor.lineHighlightBackground': '#EEE8D5',
    'editor.selectionBackground': '#EEE8D5',
    'editorIndentGuide.background': '#586E7580',
    'editorIndentGuide.activeBackground': '#081E2580',
    'editorHoverWidget.background': '#CCC4B0',
    'editorLineNumber.activeForeground': '#567983',

    'peekViewResult.background': '#EEE8D5',
    'peekViewEditor.background': '#FFFBF2',
    'peekViewTitle.background': '#EEE8D5',
    'peekView.border': '#B58900',
    'peekViewEditor.matchHighlightBackground': '#7744AA40',

    'titleBar.activeBackground': '#EEE8D5',
    'editorGroup.border': '#DDD6C1',
    'editorGroup.dropBackground': '#DDD6C1AA',
    'editorGroupHeader.tabsBackground': '#D9D2C2',
    'tab.border': '#DDD6C1',
    'tab.activeBackground': '#FDF6E3',
    'tab.inactiveForeground': '#586E75',
    'tab.inactiveBackground': '#D3CBB7',
    'activityBar.background': '#DDD6C1',
    'activityBar.foreground': '#584c27',
    'activityBar.dropBackground': '#EEE8D5',
    'activityBarBadge.background': '#B58900',
    'panel.border': '#DDD6C1',
    'sideBar.background': '#EEE8D5',
    'sideBarTitle.foreground': '#586E75',
    'statusBar.foreground': '#586E75',
    'statusBar.background': '#EEE8D5',
    'statusBar.debuggingBackground': '#EEE8D5',
    'statusBar.noFolderBackground': '#EEE8D5',
    'statusBarItem.prominentBackground': '#DDD6C1',
    'statusBarItem.prominentHoverBackground': '#DDD6C199',
    'debugToolBar.background': '#DDD6C1',
    'debugExceptionWidget.background': '#DDD6C1',
    'debugExceptionWidget.border': '#AB395B',
    'pickerGroup.border': '#2AA19899',
    'pickerGroup.foreground': '#2AA19899',
    'extensionButton.prominentBackground': '#b58900',
    'extensionButton.prominentHoverBackground': '#584c27aa',
    'terminal.ansiBlack': '#073642',
    'terminal.ansiRed': '#dc322f',
    'terminal.ansiGreen': '#859900',
    'terminal.ansiYellow': '#b58900',
    'terminal.ansiBlue': '#268bd2',
    'terminal.ansiMagenta': '#d33682',
    'terminal.ansiCyan': '#2aa198',
    'terminal.ansiWhite': '#eee8d5',
    'terminal.ansiBrightBlack': '#586e75',
    'terminal.ansiBrightRed': '#cb4b16',
    'terminal.ansiBrightGreen': '#586e75',
    'terminal.ansiBrightYellow': '#657b83',
    'terminal.ansiBrightBlue': '#839496',
    'terminal.ansiBrightMagenta': '#6c71c4',
    'terminal.ansiBrightCyan': '#93a1a1',
    'terminal.ansiBrightWhite': '#eee8d5',
  },
};

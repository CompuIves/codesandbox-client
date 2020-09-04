import babelTranspiler from '../../transpilers/babel';
import jsonTranspiler from '../../transpilers/json';
import stylesTranspiler from '../../transpilers/style';
import sassTranspiler from '../../transpilers/sass';
import rawTranspiler from '../../transpilers/raw';
import stylusTranspiler from '../../transpilers/stylus';
import lessTranspiler from '../../transpilers/less';

import asyncTranspiler from './transpilers/async';

import Preset from '..';

export default function initialize() {
  const preactPreset = new Preset(
    'preact-cli',
    ['js', 'jsx', 'ts', 'tsx', 'json', 'less', 'scss', 'sass', 'styl', 'css'],
    {
      preact$: 'preact',
      // preact-compat aliases for supporting React dependencies:
      react: 'preact-compat',
      'react-dom': 'preact-compat',
      'create-react-class': 'preact-compat/lib/create-react-class',
      'react-addons-css-transition-group': 'preact-css-transition-group',
    }
  );

  preactPreset.registerTranspiler((module) => /\.m?jsx?$/.test(module.path), [
    {
      transpiler: babelTranspiler,
      options: {
        isV7: false,
        compileNodeModulesWithEnv: true,
        config: {
          presets: [
            [
              'env',
              {
                loose: true,
                uglify: true,
                modules: false,
                exclude: [
                  'transform-regenerator',
                  'transform-es2015-typeof-symbol',
                ],
              },
            ],
          ],

          plugins: [
            'babel-plugin-syntax-dynamic-import',
            'babel-plugin-transform-object-assign',
            'babel-plugin-transform-decorators-legacy',
            'babel-plugin-transform-class-properties',
            'babel-plugin-transform-export-extensions',
            'babel-plugin-transform-object-rest-spread',
            'babel-plugin-transform-react-constant-elements',
            ['babel-plugin-transform-react-jsx', { pragma: 'h' }],
            [
              'babel-plugin-jsx-pragmatic',
              {
                module: 'preact',
                export: 'h',
                import: 'h',
              },
            ],
          ],
        },
      },
    },
  ]);

  // For these routes we need to enable css modules
  const cssModulesPaths = [
    '/src/components',
    '/components',
    '/src/routes',
    '/routes',
  ];

  const cssModulesRegex = (extension) =>
    new RegExp(`^(${cssModulesPaths.join('|')})\\/.*\\.${extension}$`);

  const cssTypes = {
    css: [],
    's[a|c]ss': [{ transpiler: sassTranspiler }],
    less: [{ transpiler: lessTranspiler }],
    styl: [{ transpiler: stylusTranspiler }],
  };

  Object.keys(cssTypes).forEach((cssType) => {
    preactPreset.registerTranspiler(
      (module) => cssModulesRegex(cssType).test(module.path),
      [
        ...cssTypes[cssType],
        { transpiler: stylesTranspiler, options: { module: true } },
      ]
    );

    preactPreset.registerTranspiler(
      (module) => new RegExp(`\\.${cssType}$`).test(module.path),
      [...cssTypes[cssType], { transpiler: stylesTranspiler }]
    );
  });

  preactPreset.registerTranspiler((module) => /\.json/.test(module.path), [
    { transpiler: jsonTranspiler },
  ]);

  // Support for !async statements
  preactPreset.registerTranspiler(
    () => false /* never load without explicit statement */,
    [{ transpiler: asyncTranspiler }]
  );

  preactPreset.registerTranspiler(() => true, [{ transpiler: rawTranspiler }]);

  return preactPreset;
}

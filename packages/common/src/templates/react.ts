import { decorateSelector } from '../utils/decorate-selector';

import configurations from './configuration';
import { ReactTemplate } from './helpers/react-template';

export default new ReactTemplate(
  'create-react-app',
  'React',
  'https://github.com/facebookincubator/create-react-app',
  'new',
  decorateSelector(() => '#61DAFB'),
  {
    showOnHomePage: true,
    popular: true,
    main: true,
    mainFile: [
      '/src/App.js',
      '/src/App.tsx',
      '/src/index.js',
      '/src/index.tsx',
      '/src/index.ts',
    ],
    extraConfigurations: {
      '/jsconfig.json': configurations.jsconfig,
      '/tsconfig.json': configurations.tsconfig,
    },
  }
);

import { isExternalUrl, extractScripts } from './html-utils';

describe('HTML Utils', () => {
  it('isExternalUrl', () => {
    expect(isExternalUrl('https://csb.io/test/test.js')).toBe(true);
    expect(isExternalUrl('http://google.com')).toBe(true);
    expect(isExternalUrl('//codesandbox.com/test.js')).toBe(true);
    expect(isExternalUrl('codesandbox.com/test.js')).toBe(false);
    expect(isExternalUrl('./test.js')).toBe(false);
    expect(isExternalUrl('test.js')).toBe(false);
    expect(isExternalUrl('lib/test.js')).toBe(false);
  });

  it('extractScripts - scripts with a src attribute', async () => {
    const extracted = await extractScripts(`
    <script src="./test.js"></script>
    <script src="https://unpkg.com/lodash.min.js" async="false"></script>
    <script src="https://unpkg.com/lodash.min.js" async></script>
    <script src="https://unpkg.com/lodash.min.js"></script>
    `);
    expect(extracted).toEqual([
      {
        attribs: {
          src: './test.js',
        },
        content: undefined,
        isAsync: false,
        isExternal: false,
        src: './test.js',
      },
      {
        attribs: {
          async: 'false',
          src: 'https://unpkg.com/lodash.min.js',
        },
        content: undefined,
        isAsync: false,
        isExternal: true,
        src: 'https://unpkg.com/lodash.min.js',
      },
      {
        attribs: {
          async: '',
          src: 'https://unpkg.com/lodash.min.js',
        },
        content: undefined,
        isAsync: true,
        isExternal: true,
        src: 'https://unpkg.com/lodash.min.js',
      },
      {
        attribs: {
          src: 'https://unpkg.com/lodash.min.js',
        },
        content: undefined,
        isAsync: false,
        isExternal: true,
        src: 'https://unpkg.com/lodash.min.js',
      },
    ]);
  });

  it('extractScripts - only return external scripts', async () => {
    const extracted = await extractScripts(
      `
    <script>import * as test from './test.js';</script>
    <script src="./test.js"></script>
    <script src="https://unpkg.com/lodash.min.js" async="false"></script>
    <script src="https://unpkg.com/lodash.min.js" async></script>
    <script src="https://unpkg.com/lodash.min.js"></script>
    `,
      true
    );
    expect(extracted).toEqual([
      {
        attribs: {},
        content: `import * as test from './test.js';`,
        isAsync: false,
        isExternal: false,
        src: undefined,
      },
      {
        attribs: {
          async: 'false',
          src: 'https://unpkg.com/lodash.min.js',
        },
        content: undefined,
        isAsync: false,
        isExternal: true,
        src: 'https://unpkg.com/lodash.min.js',
      },
      {
        attribs: {
          async: '',
          src: 'https://unpkg.com/lodash.min.js',
        },
        content: undefined,
        isAsync: true,
        isExternal: true,
        src: 'https://unpkg.com/lodash.min.js',
      },
      {
        attribs: {
          src: 'https://unpkg.com/lodash.min.js',
        },
        content: undefined,
        isAsync: false,
        isExternal: true,
        src: 'https://unpkg.com/lodash.min.js',
      },
    ]);
  });

  it('extractScripts - inline scripts', async () => {
    const extracted = await extractScripts(`
    <script>import * as test from './test.js';</script>
    <script>
        const Something = require('/Something.ts');
        alert('test');
        console.log(Something);
    </script>
    `);

    expect(extracted.length).toBe(2);
    expect(extracted[0]).toEqual({
      attribs: {},
      content: `import * as test from './test.js';`,
      isAsync: false,
      isExternal: false,
      src: undefined,
    });
    expect(extracted[1].content.includes(`alert('test');`)).toBeTruthy();
    expect(
      extracted[1].content.includes(`console.log(Something);`)
    ).toBeTruthy();
  });
});

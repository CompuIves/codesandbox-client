import qs from 'querystring';
import loaderUtils from 'app/src/sandbox/eval/transpilers/utils/loader-utils';
import { VueLoaderOptions } from './';
import { formatError } from './formatError';
import { compileTemplate, TemplateCompiler } from 'vue3-browser-compiler';
import { LoaderContext } from 'app/src/sandbox/eval/transpiled-module';

// Loader that compiles raw template into JavaScript functions.
// This is injected by the global pitcher (../pitch) for template
// selection requests initiated from vue files.
const TemplateLoader = function (source: string, loaderContext: LoaderContext) {
  source = String(source);
  const inMap = undefined;

  // although this is not the main vue-loader, we can get access to the same
  // vue-loader options because we've set an ident in the plugin and used that
  // ident to create the request for this loader in the pitcher.
  const options = (loaderUtils.getOptions(loaderContext) ||
    {}) as VueLoaderOptions;

  // const isServer = loaderContext.target === 'node'
  // const isProduction = options.productionMode || loaderContext.minimize || process.env.NODE_ENV === 'production'
  const query = qs.parse(loaderContext.resourceQuery.slice(1));
  const scopeId = query.scoped ? `data-v-${query.id}` : null;

  let compiler: TemplateCompiler | undefined;
  if (typeof options.compiler === 'string') {
    compiler = require(options.compiler);
  } else {
    compiler = options.compiler;
  }

  const compiled = compileTemplate({
    source,
    inMap,
    filename: loaderContext.path,
    ssr: loaderContext.target === 'node',
    compiler,
    compilerOptions: {
      ...options.compilerOptions,
      scopeId,
      bindingMetadata:
        typeof query.bindings === 'string' ? JSON.parse(query.bindings) : {},
    },
    transformAssetUrls: options.transformAssetUrls || true,
  });

  // tips
  if (compiled.tips.length) {
    compiled.tips.forEach(tip => {
      loaderContext.emitWarning(tip);
    });
  }

  // errors
  if (compiled.errors && compiled.errors.length) {
    compiled.errors.forEach(err => {
      if (typeof err === 'string') {
        loaderContext.emitError(new Error(err));
      } else {
        formatError(
          err,
          // @ts-ignore
          inMap ? inMap.sourcesContent![0] : (source as string),
          loaderContext.path
        );
        loaderContext.emitError(err);
      }
    });
  }

  const { code, map } = compiled;
  // loaderContext.callback(null, code, map);
  return { transpiledCode: code, sourceMap: map };
};

export default TemplateLoader;
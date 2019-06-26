const env = require('@codesandbox/common/lib/config/env');
const slugify = require('@sindresorhus/slugify');
const { createFilePath } = require('gatsby-source-filesystem');
const noop = require('lodash/noop');
const { resolve } = require('path');

// Parse date information out of post filename.
const DOCUMENTATION_FILENAME_REGEX = /[0-9]+-(.*)\.md$/;

const getRelativePath = absolutePath => absolutePath.replace(__dirname, '');

const getNodeType = ({ fileAbsolutePath }) =>
  getRelativePath(fileAbsolutePath).split('/')[2];

const getSpecificNodeInfo = ({ node, nodeType }) => {
  const nodeInfoMap = {};

  return (nodeInfoMap[nodeType] || noop)({ node });
};
const getGenericNodeInfo = ({ node }) => {
  const {
    fileAbsolutePath,
    frontmatter: { slug, title },
  } = node;
  const relativeFilePath = getRelativePath(fileAbsolutePath);

  return {
    editLink: `https://github.com/codesandbox/codesandbox-client/edit/master/packages/homepage${relativeFilePath}`,
    slug: slug || slugify(title),
    title,
  };
};
const getNodeInfo = ({ node, nodeType }) => ({
  ...getGenericNodeInfo({ node }),
  ...getSpecificNodeInfo({ node, nodeType }),
});

const createSpecificNodeFields = ({ createNodeField, nodeInfo, nodeType }) => {
  const createNodeFieldsMap = {};

  (createNodeFieldsMap[nodeType] || noop)({ createNodeField, nodeInfo });
};
const createGenericNodeFields = ({
  createNodeField,
  getFilePathForNode,
  nodeInfo: { editLink, slug, title },
}) => {
  createNodeField({ name: 'editLink', value: editLink });

  createNodeField({ name: 'title', value: title });

  createNodeField({ name: 'slug', value: slug || getFilePathForNode() });
};
const createNodeFields = ({
  createNodeField,
  getFilePathForNode,
  nodeInfo,
  nodeType,
}) => {
  createGenericNodeFields({ createNodeField, getFilePathForNode, nodeInfo });

  createSpecificNodeFields({ createNodeField, nodeInfo, nodeType });
};

exports.onCreateNode = ({ actions: { createNodeField }, getNode, node }) => {
  if (node.internal.type === 'MarkdownRemark') {
    const createNodeFieldForNode = ({ name, value }) =>
      createNodeField({ name, node, value });
    const getFilePathForNode = () =>
      createFilePath({ getNode, node, trailingSlash: false });
    const nodeType = getNodeType(node);
    const nodeInfo = getNodeInfo({ node, nodeType });

    createNodeFields({
      createNodeField: createNodeFieldForNode,
      getFilePathForNode,
      nodeInfo,
      nodeType,
    });
  }

  if (node.internal.type === `MarkdownRemark`) {
    const { url } = node.frontmatter;
    const { relativePath } = getNode(node.parent);

    if (relativePath.includes('docs')) {
      const match = DOCUMENTATION_FILENAME_REGEX.exec(relativePath);
      createNodeField({
        node,
        name: `slug`,
        value: `/docs/${match[1]}`,
      });

      // Used by createPages() above to register redirects.
      createNodeField({
        node,
        name: 'url',
        value: url ? '/docs' + url : node.fields.slug,
      });
    }
  }
};

exports.createPages = async ({ graphql, actions }) => {
  const { createPage, createRedirect } = actions;

  const docsTemplate = resolve(__dirname, './src/templates/docs.js');
  const blogTemplate = resolve(__dirname, './src/templates/post.js');
  const jobTemplate = resolve(__dirname, './src/templates/job.js');

  // Redirect /index.html to root.
  createRedirect({
    fromPath: '/index.html',
    redirectInBrowser: true,
    toPath: '/',
  });

  const allMarkdownArticles = await graphql(`
    {
      allMarkdownRemark(filter: { fileAbsolutePath: { regex: "/articles/" } }) {
        edges {
          node {
            id
            frontmatter {
              slug
            }
          }
        }
      }
    }
  `);
  allMarkdownArticles.data.allMarkdownRemark.edges.forEach(edge => {
    const { slug } = edge.node.frontmatter;
    const { id } = edge.node;

    createPage({
      path: 'post/' + slug,
      component: blogTemplate,
      context: {
        id,
      },
    });
  });

  const allDocs = await graphql(`
    {
      allMarkdownRemark(filter: { fileAbsolutePath: { regex: "/docs/" } }) {
        edges {
          node {
            fields {
              slug
              url
            }
          }
        }
      }
    }
  `);
  if (allDocs.errors) {
    console.error(allDocs.errors);

    throw Error(allDocs.errors);
  }
  allDocs.data.allMarkdownRemark.edges.forEach(edge => {
    const { slug } = edge.node.fields;
    const { url } = edge.node.fields;

    if (slug.includes('docs/')) {
      let template;
      if (slug.includes('docs/')) {
        template = docsTemplate;
      }

      const createArticlePage = path =>
        createPage({
          path,
          component: template,
          context: {
            slug,
          },
        });

      // Register primary URL.
      createArticlePage(url || slug);
    }
  });

  // JOBS

  const allJobs = await graphql(`
    {
      allMarkdownRemark(filter: { fileAbsolutePath: { regex: "/jobs/" } }) {
        edges {
          node {
            id
            frontmatter {
              slug
            }
          }
        }
      }
    }
  `);
  if (allJobs.data) {
    allJobs.data.allMarkdownRemark.edges.forEach(edge => {
      createPage({
        path: 'job/' + edge.node.frontmatter.slug,
        component: jobTemplate,
        context: { id: edge.node.id },
      });
    });
  }
};

exports.onCreateWebpackConfig = ({
  stage,
  getConfig,
  loaders,
  actions,
  plugins,
}) => {
  if (stage === 'build-html') {
    actions.setWebpackConfig({
      module: {
        rules: [
          {
            test: /gsap/,
            use: loaders.null(),
          },
        ],
      },
    });
  }

  actions.setWebpackConfig({
    plugins: [plugins.define(env.default)],
  });

  const config = getConfig();

  config.module.rules = [
    // Omit the default rule where test === '\.jsx?$'
    ...config.module.rules.filter(
      rule => String(rule.test) !== String(/\.jsx?$/)
    ),

    // Recreate it with custom exclude filter
    {
      // Called without any arguments, `loaders.js` will return an
      // object like:
      // {
      //   options: undefined,
      //   loader: '/path/to/node_modules/gatsby/dist/utils/babel-loader.js',
      // }
      // Unless you're replacing Babel with a different transpiler, you probably
      // want this so that Gatsby will apply its required Babel
      // presets/plugins.  This will also merge in your configuration from
      // `babel.config.js`.
      ...loaders.js(),

      test: /\.jsx?$/,

      // Exclude all node_modules from transpilation, except for 'common' and 'app'
      exclude: modulePath =>
        /node_modules/.test(modulePath) &&
        !/node_modules\/(common|app)/.test(modulePath),
    },
  ];

  if (process.env.CIRCLECI && config.optimization) {
    // eslint-disable-next-line no-console
    console.log('Setting new parallel option for CircleCI');
    // CircleCI has 32cpu cores, but only 2 for us. os.cpu().length gives back 32, which always results in OOM
    config.optimization.minimizer[0].options.parallel = 2;
  }

  // This will completely replace the webpack config with the modified object.
  actions.replaceWebpackConfig(config);
};

import { Parser } from 'htmlparser2';
import { DomHandler } from 'domhandler';

const EXCLUDED_TAGS = ['noscript'];
const TAGNAME_RE = /^[A-Za-z_-][A-Za-z0-9_-]*$/;

export function isValidTagName(tagName: string): boolean {
  if (TAGNAME_RE.test(tagName)) {
    return !tagName.startsWith('-') && !tagName.endsWith('-');
  }

  return false;
}

function parseDOM(content: string) {
  return new Promise((resolve, reject) => {
    const domHandler = new DomHandler((err, dom) => {
      if (err) {
        reject(err);
      } else {
        resolve(dom);
      }
    });
    const parser = new Parser(domHandler);
    parser.write(content);
    parser.end();
  });
}

function addTagNode(
  node: any,
  firstElement: ChildNode,
  parent: HTMLElement,
  skipScripts: boolean
) {
  // Skip invalid tag names
  if (!isValidTagName(node.name)) {
    parent.insertBefore(
      document.createComment(` Invalid tagname: "${node.name}" `),
      firstElement
    );
    return;
  }

  // Skip excluded tags
  if (EXCLUDED_TAGS.includes(node.name)) {
    return;
  }

  // Skip scripts if ssr or hmr
  if (skipScripts && node.name === 'script') {
    return;
  }

  try {
    const nodeToInsert = document.createElement(node.name);
    Object.entries(node.attribs).forEach(([key, value]) => {
      nodeToInsert.setAttribute(key, value);
    });
    if (node.name === 'script' && !node.attribs.async) {
      nodeToInsert.setAttribute('async', 'false');
    }
    if (node.children) {
      writeDOMNodes(node.children, nodeToInsert, skipScripts);
    }
    parent.insertBefore(nodeToInsert, firstElement);
  } catch (err) {
    // Failsafe in case we didn't handle some weird edge case
    console.warn(err);
  }
}

function writeDOMNodes(
  nodes: Array<any>,
  parent: HTMLElement,
  skipScripts: boolean
) {
  const firstElement = parent.firstChild;

  nodes.forEach(node => {
    if (node.type === 'text') {
      parent.insertBefore(document.createTextNode(node.data), firstElement);
    } else if (node.type === 'comment') {
      parent.insertBefore(document.createComment(node.data), firstElement);
    } else if (typeof node.attribs !== 'undefined') {
      // We can't use node.type === 'tag' as that's different for script and style
      addTagNode(node, firstElement, parent, skipScripts);
    }
  });
}

export async function appendHTML(
  origin: string,
  parent: HTMLElement,
  skipScripts: boolean
) {
  const domTree: any = await parseDOM(origin);
  writeDOMNodes(domTree, parent, skipScripts);
}

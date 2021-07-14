/* eslint-disable no-continue */
import { Parser } from 'htmlparser2';
import { DomHandler } from 'domhandler';

export interface IScriptElement {
  src?: string;
  content?: string;
  isExternal: boolean;
  isAsync: boolean;
  attribs: { [key: string]: string };
}

function parseDOM(content: string): Promise<Array<any>> {
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

export function isExternalUrl(url: string) {
  return /^(https?:)?\/\/.*/.test(url);
}

function collectScripts(nodes: Array<any>, scripts: Array<IScriptElement>) {
  for (const node of nodes) {
    // Skip comments...
    if (node.type === 'comment') {
      continue;
    }

    if (node.name === 'script') {
      const src = node.attribs.src;
      const script: IScriptElement = {
        src,
        content: node.children?.find(c => c.type === 'text')?.data,
        isExternal: !!(src && isExternalUrl(src)),
        isAsync: node.attribs.async != null && node.attribs.async !== 'false',
        attribs: node.attribs,
      };

      scripts.push(script);
    } else if (node.children) {
      collectScripts(node.children, scripts);
    }
  }
}

export async function extractScripts(
  content: string,
  noLocalScripts: boolean = false
): Promise<Array<IScriptElement>> {
  const scripts: Array<IScriptElement> = [];
  const nodes = await parseDOM(content);
  collectScripts(nodes, scripts);
  if (noLocalScripts) {
    return scripts.filter(s => s.isExternal || s.content);
  }
  return scripts;
}

export function appendScript(script: IScriptElement, parentNode: HTMLElement) {
  const nodeToInsert = document.createElement('script');
  Object.entries(script.attribs).forEach(([key, value]) => {
    nodeToInsert.setAttribute(key, value);
  });
  if (!script.isAsync) {
    nodeToInsert.setAttribute('async', 'false');
  }
  if (script.content?.length) {
    document.createTextNode(script.content);
  }
  parentNode.appendChild(nodeToInsert);
}

export function appendScripts(
  scripts: Array<IScriptElement>,
  parentNode: HTMLElement
) {
  scripts.forEach(script => {
    appendScript(script, parentNode);
  });
}

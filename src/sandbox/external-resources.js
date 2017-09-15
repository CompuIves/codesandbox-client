function getExternalResourcesConcatenation(resources: Array<string>) {
  return resources.join('');
}

function clearExternalResources() {
  let el = null;
  while ((el = document.getElementById('external-css'))) {
    el.remove();
  }

  while ((el = document.getElementById('external-js'))) {
    el.remove();
  }
}

function addCSS(resource: string) {
  const head = document.getElementsByTagName('head')[0];
  const link = document.createElement('link');
  link.id = 'external-css';
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = resource;
  link.media = 'all';
  head.appendChild(link);
}

function getContentType(resource: string) {
  return fetch(resource, {
    method: 'HEAD',
    mode: 'cors',
  }).then(response => response.headers.get('Content-Type'));
}

function addJS(resource: string) {
  const script = document.createElement('script');
  script.setAttribute('src', resource);
  script.async = false;
  script.setAttribute('id', 'external-js');
  document.head.appendChild(script);
}

export function addResource(
  resource: string,
  addCSS = addCSS,
  addJS = addJS,
  getContentType = getContentType
) {
  const match = resource.match(/\.([^.]*)$/);

  if (match && match[1] === 'css') {
    addCSS(resource);
  } else if (match && match[1] === 'js') {
    addJS(resource);
  } else {
    return getContentType(resource).then(contentType => {
      if (contentType.indexOf('text/css') === 0) {
        addCSS(resource);
      } else if (contentType.indexOf('application/javascript') === 0) {
        addJS(resource);
      } else {
        throw new Error(`Unsupported Content-Type: ${contentType}`);
      }
    });
  }
}

let cachedExternalResources = '';

export default function handleExternalResources(externalResources) {
  const extResString = getExternalResourcesConcatenation(externalResources);
  if (extResString !== cachedExternalResources) {
    clearExternalResources();
    externalResources.forEach(resource => {
      addResource(resource, addCSS, addJS, getContentType);
    });
    cachedExternalResources = extResString;
  }
}

// Test it here: https://codesandbox.io/s/hungry-colden-4zcny?file=/src/index.js

const content = `
<!DOCTYPE html>
<html>
  <head>
    <title>Parcel Sandbox</title>
    <meta charset="UTF-8" />
    <style>
      body {
        margin: 0;
      }
      .banner {
        background: red;
        color: white;
        display: flex;
        padding: 10px;
        font-size: 14px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, Segoe UI,
          Roboto, Ubuntu, Droid Sans, Helvetica Neue, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: antialiased;
      }
      .banner svg {
        flex-shrink: 0;
        margin-right: 12px;
      }
      .banner p {
        margin: 0;
      }
      .banner a {
        color: white;
      }
    </style>
  </head>

  <body>
    <div id="app"></div>
    <div class="banner">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p>
        This sandbox has been marked as a potential phishing page.
        <br /><br />Please do not enter username, password or other sensitive
        information on this page.
        <a href="https://codesandbox.io/docs" target="_blank" rel="noopener noreferrer">Learn more here.</a>
      </p>
    </div>
  </body>
</html>`;

const iframeStyles = `
  position: fixed;
  margin: 0;
  padding: 0;
  top: 0;
  left: 0;
  border: none;
  width: 100%;  
  z-index: 9999999999999;
`;

function isStandalone() {
  if (typeof window === 'undefined') {
    return true;
  }

  if (window.location && window.location.href.indexOf('?standalone') > -1) {
    return true;
  }

  return !window.opener && window.parent === window;
}

let interval;
const createIframe = () => {
  if (!isStandalone()) {
    return;
  }

  const iframe = document.createElement('iframe');

  const iframeId = `sb__open-sandbox${Math.floor(Math.random() * 100)}`;
  iframe.setAttribute('style', iframeStyles);
  iframe.setAttribute('id', iframeId);

  clearInterval(interval);
  interval = setInterval(() => {
    // Check every second whether the banner is still there
    if (!document.getElementById(iframeId)) {
      createIframe();
    }
  }, 1000);

  iframe.srcdoc = content;

  iframe.onload = () => {
    /**
     * Prevent others from trying to remove this banner. If it's removed we just
     * readd it!
     */
    const observer = new MutationObserver(() => {
      document.body.removeChild(iframe);
      observer.disconnect();
      createIframe();
    });

    observer.observe(iframe, {
      attributes: true,
      childList: true,
      subtree: true,
    });
  };

  document.body.appendChild(iframe);
};

try {
  setTimeout(() => createIframe(), 250);
} catch (e) {
  console.error(e);
  /* catch */
}

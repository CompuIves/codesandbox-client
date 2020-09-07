export default ({
  feedback,
  sandboxId,
  username,
  email,
  version,
  browser,
}: {
  [key: string]: string;
}) =>
  fetch('https://s2973.sse.codesandbox.stream/inbound-message', {
    method: 'POST',
    body: JSON.stringify({
      name: username,
      email,
      body:
        feedback +
        '\n\nSandbox: https://codesandbox.stream/s/' +
        sandboxId +
        '\nVersion: ' +
        version +
        '\nBrowser: ' +
        browser,
    }),
    headers: {
      'Content-Type': 'application/json',
      Accept: '*/*',
    },
  });

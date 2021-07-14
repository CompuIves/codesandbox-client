export const SECOND = 1000;

export function pageLoaded(page) {
  return new Promise(resolve =>
    page.exposeFunction('__puppeteer__', () => {
      if (resolve) {
        resolve();
      }
    })
  );
}

function sandboxUrl(sandboxId) {
  return `http://localhost:3000/#github/codesandbox/integration-sandboxes/tree/master/${sandboxId}`;
}

export function loadSandbox(page, sandboxId, timeout) {
  return new Promise(async (resolve, reject) => {
    const timer = setTimeout(async () => {
      reject(
        Error(
          `Timeout: loading sandbox '${sandboxId}' took more than ${
            timeout / SECOND
          }s`
        )
      );
    }, timeout);
    page.goto(sandboxUrl(sandboxId), {
      timeout: 0, // we manage the timeout ourselves
    });
    page.on('console', msg => {
      for (let i = 0; i < msg.args().length; ++i) {
        console.log(`${i}: ${msg.args()[i]}`); // eslint-disable-line
      }
    });
    page.on('error', msg => {
      console.log('error', msg); // eslint-disable-line
    });
    await pageLoaded(page);
    clearTimeout(timer);
    await page.waitFor(2 * SECOND);
    resolve();
  });
}

// eslint-disable-next-line consistent-return
export async function loadSandboxRetry(browser, sandboxId, timeout, retries) {
  let page;
  for (let i = 1; i <= retries; i++) {
    try {
      const start = new Date();
      /* eslint-disable no-await-in-loop */
      page = await browser.newPage();
      await loadSandbox(page, sandboxId, timeout);
      process.stdout.write(
        `Sandbox '${sandboxId}' loaded in ${(new Date() - start) / SECOND}s\n`
      );
      return page;
    } catch (err) {
      await page.waitFor(SECOND);
      await page.close();
      /* eslint-enable no-await-in-loop */
      if (i === retries) {
        throw new Error(`${err.message}, retried ${retries} times.`);
      } else {
        process.stdout.write(`Loading sandbox '${sandboxId}', retry ${i}...\n`);
      }
    }
  }
}

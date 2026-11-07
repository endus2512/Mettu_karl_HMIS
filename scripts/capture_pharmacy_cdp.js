const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');

const ARTIFACT_DIR = '/home/endale/.gemini/antigravity/brain/7483a94b-7dfc-47af-97c0-6b5cb7fb7dec';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('Launching headless chromium on port 9222...');
  const chrome = spawn(
    '/snap/bin/chromium',
    [
      '--headless=new',
      '--remote-debugging-port=9222',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--window-size=1600,1050',
    ],
    { stdio: 'ignore' }
  );

  let targets = null;
  for (let i = 0; i < 20; i++) {
    await wait(500);
    try {
      targets = await getJson('http://127.0.0.1:9222/json');
      if (targets && targets.length > 0) break;
    } catch (e) {}
  }

  if (!targets || targets.length === 0) {
    console.error('Could not connect to chromium remote debugging port!');
    chrome.kill();
    process.exit(1);
  }

  const wsUrl = targets[0].webSocketDebuggerUrl;
  console.log('Attaching WebSocket to CDP:', wsUrl);
  const ws = new WebSocket(wsUrl);

  await new Promise((resolve) => ws.once('open', resolve));

  let idCounter = 1;
  const send = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const msgId = idCounter++;
      const handler = (data) => {
        const msg = JSON.parse(data);
        if (msg.id === msgId) {
          ws.removeListener('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.on('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  };

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');

  // Step 1: Login
  console.log('Navigating to login page...');
  await send('Page.navigate', { url: 'http://localhost:3000/login' });
  await wait(2500);

  // Fill in credentials
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const inputs = document.querySelectorAll('input');
        if (inputs.length >= 2) {
          inputs[0].value = 'admin';
          inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
          inputs[1].value = 'AdminSecurePassword2026!';
          inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
        }
      })();
    `,
  });
  await wait(500);

  // Click login button
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const btns = Array.from(document.querySelectorAll('button'));
        const loginBtn = btns.find(b => b.textContent && (b.textContent.includes('Sign in') || b.textContent.includes('Login') || b.textContent.includes('Seeni')));
        if (loginBtn) loginBtn.click();
      })();
    `,
  });
  await wait(3000);

  // Step 2: Navigate to Pharmacy
  console.log('Navigating to /pharmacy...');
  await send('Page.navigate', { url: 'http://localhost:3000/pharmacy' });
  await wait(3500);

  // Take screenshot of Tab 1: Inventory
  console.log('Capturing pharmacy inventory screenshot...');
  const snap1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${ARTIFACT_DIR}/pharmacy-fefo-stock.png`, Buffer.from(snap1.data, 'base64'));
  console.log('Saved pharmacy-fefo-stock.png');

  // Step 3: Switch to Tab 2: Prescriptions Queue
  console.log('Switching to Prescriptions Queue tab...');
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const btns = Array.from(document.querySelectorAll('button'));
        const rxTab = btns.find(b => b.textContent && (b.textContent.includes('Ajaja Yaalaa') || b.textContent.includes('Prescriptions Queue')));
        if (rxTab) rxTab.click();
      })();
    `,
  });
  await wait(2000);

  // Take screenshot of Tab 2: Prescriptions Queue
  console.log('Capturing pharmacy prescriptions queue screenshot...');
  const snap2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${ARTIFACT_DIR}/pharmacy-prescription-queue.png`, Buffer.from(snap2.data, 'base64'));
  console.log('Saved pharmacy-prescription-queue.png');

  ws.close();
  chrome.kill();
  console.log('CDP script finished successfully!');
}

run().catch((err) => {
  console.error('CDP Error:', err);
  process.exit(1);
});

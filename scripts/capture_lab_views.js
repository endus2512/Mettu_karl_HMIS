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

  // Step 1: Navigate to Laboratory
  console.log('Navigating to http://localhost:3000/laboratory...');
  await send('Page.navigate', { url: 'http://localhost:3000/laboratory' });
  await wait(4000);

  // Step 2: Click on Gudeta Hailu (order with critical malaria panic values)
  console.log('Selecting Gudeta Hailu order with PANIC values...');
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const items = Array.from(document.querySelectorAll('div'));
        const gudetaItem = items.find(el => el.textContent && el.textContent.includes('Gudeta Hailu') && el.textContent.includes('PANIC VALUE'));
        if (gudetaItem) {
          gudetaItem.click();
        }
      })();
    `,
  });
  await wait(2000);

  // Capture Screenshot 1: Gudeta Hailu Panic Results View
  console.log('Capturing lab-panic-results.png...');
  const snap1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${ARTIFACT_DIR}/lab-panic-results.png`, Buffer.from(snap1.data, 'base64'));
  console.log('Saved lab-panic-results.png');

  // Step 3: Click "Gabaasa Seera Qabeessa Maxxansi" to open Printable Official Diagnostic Report
  console.log('Opening official diagnostic report modal...');
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const btns = Array.from(document.querySelectorAll('button'));
        const reportBtn = btns.find(b => b.textContent && b.textContent.includes('Gabaasa Seera Qabeessa Maxxansi'));
        if (reportBtn) reportBtn.click();
      })();
    `,
  });
  await wait(2000);

  // Capture Screenshot 2: Printable Official Report Modal
  console.log('Capturing lab-official-report.png...');
  const snap2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${ARTIFACT_DIR}/lab-official-report.png`, Buffer.from(snap2.data, 'base64'));
  console.log('Saved lab-official-report.png');

  // Close modal
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const btns = Array.from(document.querySelectorAll('button'));
        const closeBtn = btns.find(b => b.querySelector('svg.lucide-x') || b.textContent.includes('Dhiisi'));
        if (closeBtn) closeBtn.click();
      })();
    `,
  });
  await wait(1000);

  // Step 4: Click Tab 3: "3. Katalogii Qorannoo (LOINC & Pricing)"
  console.log('Switching to Tab 3: Catalog...');
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const btns = Array.from(document.querySelectorAll('button'));
        const catalogTab = btns.find(b => b.textContent && b.textContent.includes('Katalogii Qorannoo'));
        if (catalogTab) catalogTab.click();
      })();
    `,
  });
  await wait(2000);

  // Capture Screenshot 3: Diagnostic Test Catalog
  console.log('Capturing lab-test-catalog.png...');
  const snap3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${ARTIFACT_DIR}/lab-test-catalog.png`, Buffer.from(snap3.data, 'base64'));
  console.log('Saved lab-test-catalog.png');

  ws.close();
  chrome.kill();
  console.log('All Laboratory CDP captures completed successfully!');
}

run().catch((err) => {
  console.error('CDP Error:', err);
  process.exit(1);
});

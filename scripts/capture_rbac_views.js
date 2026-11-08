const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');

const ARTIFACT_DIR = '/home/endale/.gemini/antigravity/brain/7483a94b-7dfc-47af-97c0-6b5cb7fb7dec';

const ROLES = [
  {
    role: 'admin',
    name: 'Dawit Mengesha (Hospital Admin)',
    filename: 'rbac-admin-dashboard.png',
    title: 'Hospital Admin Executive BI & ERP View (Private Patient Notes Hidden)',
    url: 'http://localhost:3000/dashboard',
  },
  {
    role: 'doctor',
    name: 'Dr. Bekele Tadesse (Senior Physician)',
    filename: 'rbac-doctor-dashboard.png',
    title: 'Doctor Clinical OPD Queue, CDSS Alerts & Clinical Sidebar',
    url: 'http://localhost:3000/dashboard',
  },
  {
    role: 'nurse',
    name: 'Nurse Chaltu Daba (Head Nurse)',
    filename: 'rbac-nurse-dashboard.png',
    title: 'Nurse Ward Station, Bedside Vitals (Bed-01 to 12) & MAR Queue',
    url: 'http://localhost:3000/dashboard',
  },
  {
    role: 'pharmacist',
    name: 'Pharm. Solomon Girma (Chief Pharmacist)',
    filename: 'rbac-pharmacist-dashboard.png',
    title: 'Pharmacist Prescription Dispensing & FEFO Near-Expiry Radar',
    url: 'http://localhost:3000/dashboard',
  },
  {
    role: 'patient',
    name: 'Gudeta Hailu Tadesse (Patient)',
    filename: 'rbac-patient-portal.png',
    title: 'Patient Dedicated Portal & Health Dashboard',
    url: 'http://localhost:3000/patient-portal',
  },
];

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
  for (let i = 0; i < 25; i++) {
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
        try {
          const msg = JSON.parse(data);
          if (msg.id === msgId) {
            ws.removeListener('message', handler);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        } catch (err) {}
      };
      ws.on('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  };

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');

  // Initial dummy page load to establish domain localStorage
  console.log('Navigating to http://localhost:3000/login to initialize localStorage...');
  await send('Page.navigate', { url: 'http://localhost:3000/login' });
  await wait(3000);

  for (const item of ROLES) {
    console.log(`\n========================================`);
    console.log(`Setting simulated role: ${item.role} (${item.name})...`);

    await send('Runtime.evaluate', {
      expression: `
        (function() {
          localStorage.clear();
          sessionStorage.clear();
          localStorage.setItem('mkh_simulated_role', '${item.role}');
          // Also set dummy auth token so isAuthenticated is true
          const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
          const payload = btoa(JSON.stringify({
            sub: '1',
            role: '${item.role}',
            username: '${item.role}_user',
            full_name: '${item.name}',
            exp: Math.floor(Date.now() / 1000) + 3600
          }));
          const token = header + '.' + payload + '.signature';
          localStorage.setItem('access_token', token);
          localStorage.setItem('refresh_token', token);
        })();
      `,
    });
    await wait(300);

    console.log(`Navigating to ${item.url}...`);
    await send('Page.navigate', { url: item.url });
    await wait(3500);

    console.log(`Capturing screenshot for ${item.filename}...`);
    const snap = await send('Page.captureScreenshot', { format: 'png' });
    const targetPath = `${ARTIFACT_DIR}/${item.filename}`;
    fs.writeFileSync(targetPath, Buffer.from(snap.data, 'base64'));
    console.log(`-> Saved: ${targetPath}`);
  }

  ws.close();
  chrome.kill();
  console.log('\nAll 5 RBAC screenshots captured successfully!');
}

run().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});

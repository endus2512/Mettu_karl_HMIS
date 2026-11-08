import asyncio
import base64
import json
import os
import subprocess
import time
import httpx
import websockets

ARTIFACT_DIR = "/home/endale/.gemini/antigravity/brain/7483a94b-7dfc-47af-97c0-6b5cb7fb7dec"

VIEWS = [
    {
        "role": "admin",
        "url": "http://localhost:3000/dashboard",
        "filename": "rbac-admin-dashboard.png",
        "title": "Admin Dashboard & Admin Sidebar"
    },
    {
        "role": "doctor",
        "url": "http://localhost:3000/dashboard",
        "filename": "rbac-doctor-dashboard.png",
        "title": "Doctor Dashboard & Clinical Sidebar"
    },
    {
        "role": "nurse",
        "url": "http://localhost:3000/dashboard",
        "filename": "rbac-nurse-dashboard.png",
        "title": "Nurse Dashboard & Nursing Sidebar"
    },
    {
        "role": "pharmacist",
        "url": "http://localhost:3000/dashboard",
        "filename": "rbac-pharmacist-dashboard.png",
        "title": "Pharmacist Dashboard & Pharmacy Sidebar"
    },
    {
        "role": "patient",
        "url": "http://localhost:3000/patient-portal",
        "filename": "rbac-patient-portal.png",
        "title": "Patient Portal & Dedicated Health View"
    }
]

async def main():
    print("Launching chromium headless on remote port 9222...")
    proc = subprocess.Popen([
        "/snap/bin/chromium",
        "--headless=new",
        "--remote-debugging-port=9222",
        "--no-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--window-size=1600,1050",
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    ws_url = None
    for _ in range(25):
        time.sleep(0.5)
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get("http://127.0.0.1:9222/json")
                if res.status_code == 200:
                    targets = res.json()
                    if targets and "webSocketDebuggerUrl" in targets[0]:
                        ws_url = targets[0]["webSocketDebuggerUrl"]
                        break
        except Exception:
            pass

    if not ws_url:
        print("Failed to get websocket debugger url")
        proc.terminate()
        return

    print("Connected to CDP:", ws_url)
    async with websockets.connect(ws_url, max_size=50*1024*1024) as ws:
        msg_id = 0

        async def send(method, params=None):
            nonlocal msg_id
            msg_id += 1
            payload = {"id": msg_id, "method": method, "params": params or {}}
            await ws.send(json.dumps(payload))
            while True:
                resp = json.loads(await ws.recv())
                if resp.get("id") == msg_id:
                    return resp.get("result", {})

        await send("Page.enable")
        await send("DOM.enable")
        await send("Runtime.enable")

        # 1. Login via login form as admin
        print("Navigating to http://localhost:3000/login...")
        await send("Page.navigate", {"url": "http://localhost:3000/login"})
        await asyncio.sleep(2.5)

        print("Opening login modal...")
        await send("Runtime.evaluate", {
            "expression": """
                (function() {
                    const btns = Array.from(document.querySelectorAll('button'));
                    const openBtn = btns.find(b => b.textContent && (b.textContent.includes('Login') || b.textContent.includes('Seeni')));
                    if (openBtn) openBtn.click();
                })();
            """
        })
        await asyncio.sleep(1.0)

        print("Entering credentials for admin_ops...")
        await send("Runtime.evaluate", {
            "expression": """
                (function() {
                    const inputs = document.querySelectorAll('input');
                    if (inputs.length >= 2) {
                        inputs[0].value = 'admin_ops';
                        inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                        inputs[1].value = 'password';
                        inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    const btns = Array.from(document.querySelectorAll('button'));
                    const submitBtn = btns.find(b => b.textContent && (b.textContent.trim() === 'Seeni' || b.textContent.trim() === 'Login' || b.textContent.includes('Signing in')));
                    if (submitBtn) submitBtn.click();
                })();
            """
        })
        await asyncio.sleep(3.5)

        for view in VIEWS:
            print(f"\n--- Setting role in localStorage: {view['role']} ---")
            await send("Runtime.evaluate", {
                "expression": f"localStorage.setItem('mkh_simulated_role', '{view['role']}');"
            })
            await asyncio.sleep(0.5)

            print(f"Navigating to {view['url']}...")
            await send("Page.navigate", {"url": view["url"]})
            await asyncio.sleep(3.5)

            print(f"Capturing screenshot: {view['filename']}...")
            snap = await send("Page.captureScreenshot", {"format": "png"})
            if snap and "data" in snap:
                target_path = os.path.join(ARTIFACT_DIR, view["filename"])
                with open(target_path, "wb") as f:
                    f.write(base64.b64decode(snap["data"]))
                print(f"-> Successfully saved: {target_path}")

    proc.terminate()
    print("\nAll 5 RBAC screenshots captured successfully!")

if __name__ == "__main__":
    asyncio.run(main())

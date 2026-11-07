import asyncio
import base64
import json
import os
import subprocess
import time
import httpx
import websockets

ARTIFACT_DIR = "/home/endale/.gemini/antigravity/brain/7483a94b-7dfc-47af-97c0-6b5cb7fb7dec"

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

        # 1. Login as admin
        print("Logging in via /login...")
        await send("Page.navigate", {"url": "http://localhost:3000/login"})
        await asyncio.sleep(2.5)

        await send("Runtime.evaluate", {
            "expression": """
                const inputs = document.querySelectorAll('input');
                if (inputs.length >= 2) {
                    inputs[0].value = 'admin';
                    inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                    inputs[1].value = 'AdminSecurePassword2026!';
                    inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
                }
                const btns = Array.from(document.querySelectorAll('button'));
                const loginBtn = btns.find(b => b.textContent && (b.textContent.includes('Sign in') || b.textContent.includes('Login') || b.textContent.includes('Seeni')));
                if (loginBtn) loginBtn.click();
            """
        })
        await asyncio.sleep(3.0)

        # 2. Navigate to /pharmacy
        print("Navigating to /pharmacy...")
        await send("Page.navigate", {"url": "http://localhost:3000/pharmacy"})
        await asyncio.sleep(3.5)

        # Expand first batch row to show FEFO batch drawer
        await send("Runtime.evaluate", {
            "expression": """
                const expandBtns = document.querySelectorAll('button[title*=\"batch\"]');
                if (expandBtns.length > 0) expandBtns[0].click();
            """
        })
        await asyncio.sleep(1.0)

        # Capture Tab 1: Inventory & Batches
        print("Capturing pharmacy-fefo-stock.png...")
        snap1 = await send("Page.captureScreenshot", {"format": "png"})
        if snap1 and "data" in snap1:
            with open(f"{ARTIFACT_DIR}/pharmacy-fefo-stock.png", "wb") as f:
                f.write(base64.b64decode(snap1["data"]))
            print("Successfully saved pharmacy-fefo-stock.png")

        # 3. Switch to Tab 2: Prescriptions Queue
        print("Switching to Prescriptions Queue tab...")
        await send("Runtime.evaluate", {
            "expression": """
                const btns = Array.from(document.querySelectorAll('button'));
                const rxTab = btns.find(b => b.textContent && (b.textContent.includes('Ajaja Yaalaa') || b.textContent.includes('Prescriptions Queue')));
                if (rxTab) rxTab.click();
            """
        })
        await asyncio.sleep(2.0)

        # Capture Tab 2: Prescriptions Queue
        print("Capturing pharmacy-prescription-queue.png...")
        snap2 = await send("Page.captureScreenshot", {"format": "png"})
        if snap2 and "data" in snap2:
            with open(f"{ARTIFACT_DIR}/pharmacy-prescription-queue.png", "wb") as f:
                f.write(base64.b64decode(snap2["data"]))
            print("Successfully saved pharmacy-prescription-queue.png")

    proc.terminate()
    print("CDP run completed!")

if __name__ == "__main__":
    asyncio.run(main())

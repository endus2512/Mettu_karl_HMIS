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

        # 2. View 1: Fleet Readiness (Tab: fleet)
        print("Navigating to http://localhost:3000/ems?tab=fleet...")
        await send("Page.navigate", {"url": "http://localhost:3000/ems?tab=fleet"})
        await asyncio.sleep(3.5)

        print("Capturing ems-fleet-readiness.png...")
        snap1 = await send("Page.captureScreenshot", {"format": "png"})
        if snap1 and "data" in snap1:
            with open(f"{ARTIFACT_DIR}/ems-fleet-readiness.png", "wb") as f:
                f.write(base64.b64decode(snap1["data"]))
            print("Successfully saved ems-fleet-readiness.png")

        # 3. View 2: Hotline Intake (Tab: hotline)
        print("Switching to hotline tab...")
        await send("Runtime.evaluate", {
            "expression": """
                const btns = Array.from(document.querySelectorAll('button'));
                const btn = btns.find(b => b.textContent && (b.textContent.includes('907 Waaamicha') || b.textContent.includes('907 Hotline')));
                if (btn) btn.click();
            """
        })
        await asyncio.sleep(2.5)

        print("Capturing ems-hotline-intake.png...")
        snap2 = await send("Page.captureScreenshot", {"format": "png"})
        if snap2 and "data" in snap2:
            with open(f"{ARTIFACT_DIR}/ems-hotline-intake.png", "wb") as f:
                f.write(base64.b64decode(snap2["data"]))
            print("Successfully saved ems-hotline-intake.png")

        # 4. View 3: Live Dispatch Missions (Tab: dispatch)
        print("Switching to dispatch tab...")
        await send("Runtime.evaluate", {
            "expression": """
                const btns = Array.from(document.querySelectorAll('button'));
                const btn = btns.find(b => b.textContent && (b.textContent.includes('Ergaa Ambalaansii') || b.textContent.includes('Fleet Dispatch')));
                if (btn) btn.click();
            """
        })
        await asyncio.sleep(2.5)

        print("Capturing ems-live-dispatch.png...")
        snap3 = await send("Page.captureScreenshot", {"format": "png"})
        if snap3 and "data" in snap3:
            with open(f"{ARTIFACT_DIR}/ems-live-dispatch.png", "wb") as f:
                f.write(base64.b64decode(snap3["data"]))
            print("Successfully saved ems-live-dispatch.png")

        # 5. View 4: Radar Map (Tab: map)
        print("Switching to radar map tab...")
        await send("Runtime.evaluate", {
            "expression": """
                const btns = Array.from(document.querySelectorAll('button'));
                const btn = btns.find(b => b.textContent && (b.textContent.includes('Kaartaa GPS') || b.textContent.includes('Radar')));
                if (btn) btn.click();
            """
        })
        await asyncio.sleep(2.5)

        print("Capturing ems-radar-map.png...")
        snap4 = await send("Page.captureScreenshot", {"format": "png"})
        if snap4 and "data" in snap4:
            with open(f"{ARTIFACT_DIR}/ems-radar-map.png", "wb") as f:
                f.write(base64.b64decode(snap4["data"]))
            print("Successfully saved ems-radar-map.png")

        # 6. View 5: Official Voucher Modal
        print("Switching back to hotline and opening official paramedic voucher...")
        await send("Runtime.evaluate", {
            "expression": """
                const btns = Array.from(document.querySelectorAll('button'));
                const btn = btns.find(b => b.textContent && (b.textContent.includes('907 Waaamicha') || b.textContent.includes('907 Hotline')));
                if (btn) btn.click();
            """
        })
        await asyncio.sleep(2.0)

        await send("Runtime.evaluate", {
            "expression": """
                const btns = Array.from(document.querySelectorAll('button'));
                const vBtn = btns.find(b => b.textContent && (b.textContent.includes('Voucher') || b.textContent.includes('Run Sheet')));
                if (vBtn) vBtn.click();
            """
        })
        await asyncio.sleep(2.5)

        print("Capturing ems-official-voucher.png...")
        snap5 = await send("Page.captureScreenshot", {"format": "png"})
        if snap5 and "data" in snap5:
            with open(f"{ARTIFACT_DIR}/ems-official-voucher.png", "wb") as f:
                f.write(base64.b64decode(snap5["data"]))
            print("Successfully saved ems-official-voucher.png")

    proc.terminate()
    print("All EMS screenshots captured successfully!")

if __name__ == "__main__":
    asyncio.run(main())

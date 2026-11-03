# Sentinel AI Demo Backend

This replacement FastAPI backend keeps the existing login, alert, asset, and audit APIs. The original implementation and `sentinel.db` are preserved in `backend1`; the frontend now starts code from `backend` and uses an isolated `demo_sentinel.db`.

## Simulated Event Replay

On startup, the backend creates `backend/data/simulated_network_events.jsonl` with 20,000 synthetic JSONL records if the dataset is missing or incomplete. It then streams a random record every second, looping indefinitely. The records use documentation-only IP ranges and `.demo.invalid` hostnames, and are marked as simulated. The source `eve.json` is not read, modified, or replayed.

## Start the Application

No `.env` file or demo key is required. Start the frontend and replacement backend from the repository root:

```powershell
npm start
```

The frontend is available at `http://localhost:5173`, the API at `http://localhost:8000`, and API docs at `http://localhost:8000/api/docs`. The old Python environment is retained under `backend1/venv`; launchers use it to run the new source in `backend/`.

## Two-Laptop Demo

Use only a private network you control. The server laptop runs `npm start`; open the LAN URL printed by Vite on the analyst laptop. Allow Node.js and Python on the Windows private-network firewall if prompted. Automatic discovery uses UDP port `39547`; the dashboard API uses TCP port `8000`; the frontend uses TCP port `5173`. Do not expose these development services to the public internet.

Copy the single `trigger.py` file to the sender laptop, install Python if needed, and run:

```powershell
py trigger.py
```

The client discovers the dashboard over the LAN, submits one simulated incident, then waits until the analyst selects it and clicks **Neutralize Demo Threat**. It then prints an access-denied result and exits. The visible dashboard labels the event as simulated; this workflow does not scan, exploit, block, or control either laptop.

Create a dashboard account through the signup page if this is a fresh database. Neutralization requires an authenticated analyst session. `ACCESS_TOKEN_EXPIRE_MINUTES` is an existing login-session setting with a code default; it is unrelated to the sender and needs no demo configuration.

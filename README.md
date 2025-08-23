# 📞 AI Call Center — Voice IVR Prototype (Twilio + Node.js)

> Production-style prototype of an AI-assisted voice IVR that greets callers, captures **name → age → reason**, logs everything to a dashboard, and then **forwards to a human agent**.  
> Built with **Node.js, Express, Twilio (TwiML Voice)** and **ngrok** for secure webhooks.

![status-badge](https://img.shields.io/badge/status-prototype-blue)
![stack-badge](https://img.shields.io/badge/stack-Node.js%20%7C%20Express%20%7C%20Twilio%20%7C%20ngrok-success)
![license-badge](https://img.shields.io/badge/license-MIT-lightgrey)

---

## ✨ Features

- **Natural voice flow**: asks for *name → age → reason* via speech.
- **Speech capture** using Twilio Speech-to-Text (no extra setup).
- **Agent handoff**: forwards caller to a human number (configurable).
- **Live dashboard**: minimal UI shows caller, fields, status, timestamp.
- **Zero DB setup**: logs persist in `logs.json`.
- **12-Factor ready**: environment-driven config, portable, docker-friendly.

---

## 🧠 How It Works (High Level)

Caller → Twilio Number → /voice (TwiML)
└→ gather speech: name → /name
age → /age
reason → /reason
└→ dial human → /wrapup → log → dashboard



---

## 📦 Repo Structure

ai-call-center/
├─ server.js # Express app + TwiML routes + dashboard
├─ logs.json # Persistent call logs (auto-created)
├─ .env.example # Environment variables template
├─ README.md # This file
└─ package.json




## 📸 Screenshots
Dashboard ( <img width="1196" height="559" alt="Screenshot 2025-08-21 161918" src="https://github.com/user-attachments/assets/b7d9ce22-3a66-44ba-96ab-3bc6f0772161" /> )







---

## ⚙️ Requirements

- Node.js 18+ (LTS recommended)  
- Twilio account (Trial or Paid)  
- ngrok (for public HTTPS webhook during local dev)  

---

## 🔐 Environment Variables

Create `.env` (copy from `.env.example`):

ini
# .env
PORT=3000
AGENT_NUMBER=+919457488566          # where calls are forwarded
TWILIO_VOICE_METHOD=POST            # usually POST



🚀 Quick Start

# 1) Install
npm install

# 2) Run the server (http://localhost:3000)
node server.js

# 3) Expose with ngrok in a second terminal
ngrok http 3000
# copy the HTTPS forwarding URL, e.g. https://abc123.ngrok-free.app


🧪 API Endpoints

| Method | Path         | Purpose                         |
| -----: | ------------ | ------------------------------- |
|   POST | `/voice`     | Entry point (Greets + ask name) |
|   POST | `/name`      | Captures name → ask age         |
|   POST | `/age`       | Captures age → ask reason       |
|   POST | `/reason`    | Captures reason → dial agent    |
|   POST | `/wrapup`    | Logs status → goodbye           |
|    GET | `/dashboard` | Read-only call logs UI          |


🛂 Twilio Trial Notes (Important)

Trial accounts:

Only accept calls from verified numbers.

Outbound/forwarding to international numbers may be restricted.

Trial messages may play if balance/permissions block a route.

Solution: Upgrade account or forward to a number in the same region that’s approved, and ensure Geo Permissions allow the destination.

🖥️ Dashboard

Live table with auto-refresh every 5s.

Columns: Caller, Name, Age, Reason, Status, Time (UTC).

Backed by logs.json for simplicity (swap for DB in prod).


🧩 Configuring Agent Handoff

In server.js:
const dial = twiml.dial({
  callerId: To, 
  action: `/wrapup?sid=${CallSid}`,
  method: 'POST'
});
dial.number(process.env.AGENT_NUMBER);


🙌 Credits

Built by Praduman Sharma for an assignment round.
Tech: Node.js, Express, Twilio, ngrok.



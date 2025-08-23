
const express = require('express');
const fs = require('fs');
const VoiceResponse = require('twilio').twiml.VoiceResponse;

const app = express();
app.use(express.urlencoded({ extended: false }));
const sessions = {};
const LOG_FILE = 'logs.json';

function readLogs() {
  try { return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8') || '[]'); }
  catch { return []; }
}
function saveLog(callSid) {
  const entry = sessions[callSid];
  if (!entry) return;
  const logs = readLogs();
  logs.push({ ...entry, timestamp: new Date().toISOString() });
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

app.post('/voice', (req, res) => {
  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    input: 'speech',
    action: '/name',
    method: 'POST',
    timeout: 5
  });
  gather.say('Hello! Welcome to the demo call center. Please say your full name after the beep.');
  
  twiml.redirect('/voice');

  res.type('text/xml').send(twiml.toString());
});

app.post('/name', (req, res) => {
  const { CallSid, From, To, SpeechResult } = req.body;
  sessions[CallSid] = { from: From, to: To, name: (SpeechResult || 'Unknown').trim() };

  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    input: 'speech',
    action: '/age',
    method: 'POST',
    timeout: 5
  });
  gather.say(`Thanks ${sessions[CallSid].name}. How old are you?`);
  twiml.redirect('/name');

  res.type('text/xml').send(twiml.toString());
});


app.post('/age', (req, res) => {
  const { CallSid, SpeechResult } = req.body;
  const said = (SpeechResult || '').trim();
  const age = (said.match(/\d+/) || [said || 'Unknown'])[0];
  sessions[CallSid].age = age;

  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    input: 'speech',
    action: '/reason',
    method: 'POST',
    timeout: 6
  });
  gather.say('Great. Briefly tell me the reason for your call.');
  twiml.redirect('/age');

  res.type('text/xml').send(twiml.toString());
});

app.post('/reason', (req, res) => {
  const { CallSid, SpeechResult, To } = req.body;
  sessions[CallSid].reason = (SpeechResult || 'Unknown').trim();

  const twiml = new VoiceResponse();
  twiml.say('Thanks. Connecting you to our human agent now.');

  const dial = twiml.dial({ callerId: To, action: `/wrapup?sid=${CallSid}`, method: 'POST' });
  dial.number('+91XXXXXXXXXX'); // ← REPLACE With Verified Number

  res.type('text/xml').send(twiml.toString());
});

app.post('/wrapup', (req, res) => {
  const callSid = req.query.sid;
  sessions[callSid].status = req.body.DialCallStatus || 'unknown';
  saveLog(callSid);

  const twiml = new VoiceResponse();
  twiml.say('This call is now complete. Goodbye!');
  twiml.hangup();

  res.type('text/xml').send(twiml.toString());
});

// Simple dashboard (auto-refresh)
app.get('/dashboard', (req, res) => {
  const logs = readLogs();
  const rows = logs.map((l, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${l.from || ''}</td>
      <td>${l.name || ''}</td>
      <td>${l.age || ''}</td>
      <td>${(l.reason || '').slice(0, 80)}</td>
      <td>${l.status || ''}</td>
      <td>${l.timestamp || ''}</td>
    </tr>`).join('');

  res.send(`<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="5" />
    <title>AI Call Center - Dashboard</title>
    <style>
      body{font-family: system-ui, Arial; margin: 24px;}
      h1{margin:0 0 12px}
      table{border-collapse: collapse; width:100%;}
      th, td{border:1px solid #ddd; padding:8px; font-size:14px}
      th{background:#f3f3f3; text-align:left}
      tr:nth-child(even){background:#fafafa}
      .hint{margin: 6px 0 16px; color:#666}
    </style>
  </head>
  <body>
    <h1>AI Call Center - Dashboard</h1>
    <div class="hint">Auto-refreshing every 5s. Total calls: ${logs.length}</div>
    <table>
      <thead><tr>
        <th>#</th><th>Caller</th><th>Name</th><th>Age</th><th>Reason</th><th>Status</th><th>Time (UTC)</th>
      </tr></thead>
      <tbody>${rows || '<tr><td colspan="7">No calls yet</td></tr>'}</tbody>
    </table>
  </body>
  </html>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

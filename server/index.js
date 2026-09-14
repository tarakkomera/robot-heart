import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const dbPath = fs.existsSync(path.join(rootDir, 'robot_heart.db'))
  ? path.join(rootDir, 'robot_heart.db')
  : path.join(__dirname, 'robot_heart.db')
const db = new DatabaseSync(dbPath)

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
}

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS robot_state (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    emotion TEXT NOT NULL,
    energy_level INTEGER NOT NULL,
    message TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    interaction_id TEXT NOT NULL,
    label TEXT NOT NULL,
    emotion_triggered TEXT NOT NULL,
    energy_gained INTEGER NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS confessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT DEFAULT 'Anonymous',
    message TEXT NOT NULL,
    resonance_score INTEGER DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS auth_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    authorized_name TEXT NOT NULL,
    secret_message TEXT NOT NULL,
    phone_number TEXT
  );

  CREATE TABLE IF NOT EXISTS proposal_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL,
    response TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`)

try {
  db.exec('ALTER TABLE auth_settings ADD COLUMN phone_number TEXT;')
} catch {}
try { db.exec('ALTER TABLE auth_settings ADD COLUMN whatsapp_provider TEXT;') } catch {}
try { db.exec('ALTER TABLE auth_settings ADD COLUMN whatsapp_api_key TEXT;') } catch {}
try { db.exec('ALTER TABLE auth_settings ADD COLUMN webhook_url TEXT;') } catch {}
try { db.exec('ALTER TABLE auth_settings ADD COLUMN twilio_account_sid TEXT;') } catch {}
try { db.exec('ALTER TABLE auth_settings ADD COLUMN twilio_auth_token TEXT;') } catch {}
try { db.exec('ALTER TABLE auth_settings ADD COLUMN twilio_from_number TEXT;') } catch {}
try { db.exec('ALTER TABLE proposal_responses ADD COLUMN delivery_status TEXT;') } catch {}

// Seed initial state if empty
const checkState = db.prepare('SELECT COUNT(*) as count FROM robot_state').get()
if (checkState.count === 0) {
  db.prepare(`
    INSERT INTO robot_state (emotion, energy_level, message)
    VALUES ('idle', 0, 'A quiet world is ready to be explored.')
  `).run()
}

// Seed default authentication settings if empty
const checkAuth = db.prepare('SELECT COUNT(*) as count FROM auth_settings').get()
if (checkAuth.count === 0) {
  db.prepare(`
    INSERT INTO auth_settings (authorized_name, secret_message, phone_number, whatsapp_provider, whatsapp_api_key)
    VALUES ('HimaVarshini', 'Welcome, My Dearest. You have unlocked the hidden core of my Robotic Heart. Every heartbeat in this world was created just for you.', '', 'callmebot', '')
  `).run()
}

// Helper function for automated WhatsApp dispatch
async function dispatchAutomatedWhatsApp(authConfig, msgText) {
  const rawPhone = authConfig ? (authConfig.phone_number || '') : ''
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '')
  const provider = (authConfig?.whatsapp_provider || 'callmebot').toLowerCase()
  const apiKey = (authConfig?.whatsapp_api_key || '').trim()
  const webhookUrl = (authConfig?.webhook_url || '').trim()

  // 1. Webhook Provider (Discord, Zapier, Make, Telegram, n8n, custom)
  if (provider === 'webhook') {
    if (!webhookUrl) {
      return { sent: false, provider: 'webhook', detail: 'Webhook URL is not configured in Settings' }
    }
    try {
      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'proposal_response',
          phone: cleanPhone,
          message: msgText,
          timestamp: new Date().toISOString()
        })
      })
      if (resp.ok) {
        return { sent: true, provider: 'webhook', detail: `Sent via Webhook (HTTP ${resp.status})` }
      } else {
        const errBody = await resp.text().catch(() => '')
        return { sent: false, provider: 'webhook', detail: `Webhook returned HTTP ${resp.status}`, error: errBody }
      }
    } catch (err) {
      return { sent: false, provider: 'webhook', detail: 'Failed to connect to Webhook URL', error: err.message }
    }
  }

  // 2. Twilio WhatsApp
  if (provider === 'twilio') {
    const accountSid = (authConfig?.twilio_account_sid || '').trim()
    const authToken = (authConfig?.twilio_auth_token || '').trim()
    const fromNum = (authConfig?.twilio_from_number || '').trim()
    if (!accountSid || !authToken || !fromNum || !cleanPhone) {
      return { sent: false, provider: 'twilio', detail: 'Twilio Account SID, Auth Token, From Number, or Phone Number missing' }
    }
    try {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
      const params = new URLSearchParams()
      params.append('From', fromNum.startsWith('whatsapp:') ? fromNum : `whatsapp:${fromNum}`)
      params.append('To', `whatsapp:+${cleanPhone}`)
      params.append('Body', msgText)

      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
      const resp = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      })
      if (resp.ok) {
        return { sent: true, provider: 'twilio', detail: 'Dispatched automatically via Twilio WhatsApp' }
      } else {
        const errText = await resp.text().catch(() => '')
        return { sent: false, provider: 'twilio', detail: `Twilio error HTTP ${resp.status}`, error: errText }
      }
    } catch (err) {
      return { sent: false, provider: 'twilio', detail: 'Twilio network request failed', error: err.message }
    }
  }

  // 3. CallMeBot WhatsApp (Default & Free)
  if (!cleanPhone) {
    return { sent: false, provider: 'callmebot', detail: 'Phone number is missing in Settings' }
  }
  if (!apiKey) {
    return { sent: false, provider: 'callmebot', detail: 'CallMeBot API Key is not configured in Settings' }
  }

  try {
    const callmebotUrl = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodeURIComponent(msgText)}&apikey=${encodeURIComponent(apiKey)}`
    const resp = await fetch(callmebotUrl)
    const textResp = await resp.text().catch(() => '')
    if (resp.ok && !textResp.toLowerCase().includes('error')) {
      return { sent: true, provider: 'callmebot', detail: 'Delivered automatically to WhatsApp via CallMeBot' }
    } else {
      return { sent: false, provider: 'callmebot', detail: textResp.slice(0, 120) || `CallMeBot returned status ${resp.status}` }
    }
  } catch (err) {
    return { sent: false, provider: 'callmebot', detail: 'Network error connecting to CallMeBot', error: err.message }
  }
}

const PORT = process.env.PORT || 3001

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (e) {
        reject(e)
      }
    })
  })
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url, `http://${req.headers.host}`)
  const pathname = url.pathname

  try {
    // GET /api/state
    if (req.method === 'GET' && pathname === '/api/state') {
      const state = db.prepare('SELECT * FROM robot_state ORDER BY id DESC LIMIT 1').get()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(state))
      return
    }

    // POST /api/state
    if (req.method === 'POST' && pathname === '/api/state') {
      const { emotion, energy_level, message } = await parseBody(req)
      db.prepare(`
        INSERT INTO robot_state (emotion, energy_level, message)
        VALUES (?, ?, ?)
      `).run(emotion || 'idle', energy_level || 0, message || '')
      
      const updated = db.prepare('SELECT * FROM robot_state ORDER BY id DESC LIMIT 1').get()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(updated))
      return
    }

    // GET /api/memories
    if (req.method === 'GET' && pathname === '/api/memories') {
      const memories = db.prepare('SELECT * FROM memories ORDER BY id DESC LIMIT 50').all()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(memories))
      return
    }

    // POST /api/memories
    if (req.method === 'POST' && pathname === '/api/memories') {
      const { interaction_id, label, emotion_triggered, energy_gained } = await parseBody(req)
      db.prepare(`
        INSERT INTO memories (interaction_id, label, emotion_triggered, energy_gained)
        VALUES (?, ?, ?, ?)
      `).run(interaction_id, label, emotion_triggered, energy_gained)

      const memories = db.prepare('SELECT * FROM memories ORDER BY id DESC LIMIT 50').all()
      res.writeHead(201, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(memories))
      return
    }

    // DELETE /api/memories
    if (req.method === 'DELETE' && pathname === '/api/memories') {
      db.prepare('DELETE FROM memories').run()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: true, message: 'All memories cleared' }))
      return
    }

    // GET /api/confessions
    if (req.method === 'GET' && pathname === '/api/confessions') {
      const confessions = db.prepare('SELECT * FROM confessions ORDER BY id DESC LIMIT 50').all()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(confessions))
      return
    }

    // POST /api/confessions
    if (req.method === 'POST' && pathname === '/api/confessions') {
      const { author, message, resonance_score } = await parseBody(req)
      db.prepare(`
        INSERT INTO confessions (author, message, resonance_score)
        VALUES (?, ?, ?)
      `).run(author || 'Anonymous', message, resonance_score || 100)

      const confessions = db.prepare('SELECT * FROM confessions ORDER BY id DESC LIMIT 50').all()
      res.writeHead(201, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(confessions))
      return
    }

    // GET /api/settings
    if (req.method === 'GET' && pathname === '/api/settings') {
      const authConfig = db.prepare('SELECT * FROM auth_settings ORDER BY id DESC LIMIT 1').get()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        authorizedName: authConfig ? authConfig.authorized_name : 'HimaVarshini',
        secretMessage: authConfig ? authConfig.secret_message : '',
        phoneNumber: authConfig ? (authConfig.phone_number || '') : '',
        whatsappProvider: authConfig ? (authConfig.whatsapp_provider || 'callmebot') : 'callmebot',
        whatsappApiKey: authConfig ? (authConfig.whatsapp_api_key || '') : '',
        webhookUrl: authConfig ? (authConfig.webhook_url || '') : '',
        twilioAccountSid: authConfig ? (authConfig.twilio_account_sid || '') : '',
        twilioAuthToken: authConfig ? (authConfig.twilio_auth_token || '') : '',
        twilioFromNumber: authConfig ? (authConfig.twilio_from_number || '') : ''
      }))
      return
    }

    // POST /api/settings
    if (req.method === 'POST' && pathname === '/api/settings') {
      const body = await parseBody(req)
      const authConfig = db.prepare('SELECT * FROM auth_settings ORDER BY id DESC LIMIT 1').get()
      const targetName = String(body.authorized_name ?? body.authorizedName ?? authConfig?.authorized_name ?? 'HimaVarshini').trim()
      const secretMsg = String(body.secret_message ?? body.secretMessage ?? authConfig?.secret_message ?? '').trim()
      const phone = String(body.phone_number ?? body.phoneNumber ?? authConfig?.phone_number ?? '').trim()
      const provider = String(body.whatsapp_provider ?? body.whatsappProvider ?? authConfig?.whatsapp_provider ?? 'callmebot').trim()
      const apiKey = String(body.whatsapp_api_key ?? body.whatsappApiKey ?? authConfig?.whatsapp_api_key ?? '').trim()
      const webhook = String(body.webhook_url ?? body.webhookUrl ?? authConfig?.webhook_url ?? '').trim()
      const twilioSid = String(body.twilio_account_sid ?? body.twilioAccountSid ?? authConfig?.twilio_account_sid ?? '').trim()
      const twilioToken = String(body.twilio_auth_token ?? body.twilioAuthToken ?? authConfig?.twilio_auth_token ?? '').trim()
      const twilioFrom = String(body.twilio_from_number ?? body.twilioFromNumber ?? authConfig?.twilio_from_number ?? '').trim()

      db.prepare(`
        INSERT INTO auth_settings (
          authorized_name, secret_message, phone_number,
          whatsapp_provider, whatsapp_api_key, webhook_url,
          twilio_account_sid, twilio_auth_token, twilio_from_number
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(targetName, secretMsg, phone, provider, apiKey, webhook, twilioSid, twilioToken, twilioFrom)

      const updated = db.prepare('SELECT * FROM auth_settings ORDER BY id DESC LIMIT 1').get()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        success: true,
        authorizedName: updated.authorized_name,
        secretMessage: updated.secret_message,
        phoneNumber: updated.phone_number || '',
        whatsappProvider: updated.whatsapp_provider || 'callmebot',
        whatsappApiKey: updated.whatsapp_api_key || '',
        webhookUrl: updated.webhook_url || '',
        twilioAccountSid: updated.twilio_account_sid || '',
        twilioAuthToken: updated.twilio_auth_token || '',
        twilioFromNumber: updated.twilio_from_number || ''
      }))
      return
    }

    // POST /api/notify/test - Send immediate test WhatsApp notification
    if (req.method === 'POST' && pathname === '/api/notify/test') {
      const authConfig = db.prepare('SELECT * FROM auth_settings ORDER BY id DESC LIMIT 1').get()
      const testMsg = `🤖 Robotic Heart Test: WhatsApp automated notifications are successfully connected! Time: ${new Date().toLocaleTimeString()} ✨`
      const result = await dispatchAutomatedWhatsApp(authConfig, testMsg)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result))
      return
    }

    // POST /api/respond - Record YES/NO and send to mobile / WhatsApp automatically
    if (req.method === 'POST' && pathname === '/api/respond') {
      const body = await parseBody(req)
      const userName = (body.user_name || 'Special Someone').trim()
      const responseType = (body.response || 'yes').trim().toLowerCase()

      db.prepare(`
        INSERT INTO proposal_responses (user_name, response)
        VALUES (?, ?)
      `).run(userName, responseType)

      const authConfig = db.prepare('SELECT * FROM auth_settings ORDER BY id DESC LIMIT 1').get()
      const rawPhone = authConfig ? (authConfig.phone_number || '') : ''
      const cleanPhone = rawPhone.replace(/[^0-9]/g, '')

      const msgText = responseType === 'yes'
        ? `💖 Robotic Heart Alert: ${userName} answered YES to your proposal! "Our hearts are now synchronized in perfect harmony!" ✨`
        : `💔 Robotic Heart Alert: ${userName} answered NO. "Holding this moment gently in memory." 🌧️`

      const whatsappUrl = cleanPhone
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msgText)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(msgText)}`

      // Dispatch automatically in the background
      const dispatchResult = await dispatchAutomatedWhatsApp(authConfig, msgText)

      try {
        db.prepare(`
          UPDATE proposal_responses
          SET delivery_status = ?
          WHERE id = (SELECT id FROM proposal_responses ORDER BY id DESC LIMIT 1)
        `).run(dispatchResult.sent ? `sent_${dispatchResult.provider}` : `failed_${dispatchResult.detail}`)
      } catch {}

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        success: true,
        userName,
        response: responseType,
        phoneNumber: rawPhone,
        whatsappUrl,
        messageText: msgText,
        autoSent: dispatchResult.sent,
        autoSentProvider: dispatchResult.provider,
        autoSentDetail: dispatchResult.detail,
        autoSentError: dispatchResult.error || null
      }))
      return
    }

    // GET /api/responses
    if (req.method === 'GET' && pathname === '/api/responses') {
      const responses = db.prepare('SELECT * FROM proposal_responses ORDER BY id DESC LIMIT 50').all()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(responses))
      return
    }

    // POST /api/authentication - Verify name & reveal secret message
    if (req.method === 'POST' && pathname === '/api/authentication') {
      const { name } = await parseBody(req)
      const inputName = (name || '').trim()

      const authConfig = db.prepare('SELECT * FROM auth_settings ORDER BY id DESC LIMIT 1').get()
      const targetName = authConfig ? authConfig.authorized_name : 'HimaVarshini'
      const secretMsg = authConfig ? authConfig.secret_message : 'Welcome, My Dearest. You have unlocked the hidden core of my Robotic Heart.'

      const cleanInput = inputName.toLowerCase().replace(/[^a-z0-9]/g, '')
      const cleanTarget = (targetName || 'himavarshini').toLowerCase().replace(/[^a-z0-9]/g, '')

      // Strictly matches Hima Varshini (with or without space, case-insensitive)
      const isMatch = cleanInput.length > 0 && (
        cleanInput === 'himavarshini' ||
        (cleanTarget === cleanInput && cleanTarget.length > 0)
      )

      if (isMatch) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          authenticated: true,
          authorizedName: 'HimaVarshini',
          secretMessage: secretMsg,
          phoneNumber: authConfig ? (authConfig.phone_number || '') : '',
          statusMessage: 'Identity verified for HimaVarshini. Core unlocked!'
        }))
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          authenticated: false,
          providedName: inputName,
          statusMessage: `Access Denied: '${inputName || 'Empty'}' is not recognized. This message was encrypted exclusively for Hima Varshini.`
        }))
      }
      return
    }

    // POST /api/authentication/config - Update secret message & target name
    if (req.method === 'POST' && pathname === '/api/authentication/config') {
      const body = await parseBody(req)
      const authConfig = db.prepare('SELECT * FROM auth_settings ORDER BY id DESC LIMIT 1').get()
      const targetName = (body.authorized_name ?? (authConfig ? authConfig.authorized_name : 'HimaVarshini')).trim()
      const secretMsg = (body.secret_message ?? (authConfig ? authConfig.secret_message : '')).trim()
      const phone = (body.phone_number ?? (authConfig ? authConfig.phone_number : '')).trim()

      db.prepare(`
        INSERT INTO auth_settings (authorized_name, secret_message, phone_number)
        VALUES (?, ?, ?)
      `).run(targetName, secretMsg, phone)

      const updatedConfig = db.prepare('SELECT * FROM auth_settings ORDER BY id DESC LIMIT 1').get()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        success: true,
        authorizedName: updatedConfig.authorized_name,
        secretMessage: updatedConfig.secret_message,
        phoneNumber: updatedConfig.phone_number || ''
      }))
      return
    }

    // GET /api/database - Full SQLite database inspector
    if (req.method === 'GET' && pathname === '/api/database') {
      const robotState = db.prepare('SELECT * FROM robot_state ORDER BY id DESC LIMIT 20').all()
      const memories = db.prepare('SELECT * FROM memories ORDER BY id DESC LIMIT 100').all()
      const confessions = db.prepare('SELECT * FROM confessions ORDER BY id DESC LIMIT 100').all()
      const authSettings = db.prepare('SELECT * FROM auth_settings ORDER BY id DESC LIMIT 20').all()
      const proposalResponses = db.prepare('SELECT * FROM proposal_responses ORDER BY id DESC LIMIT 100').all()

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        status: 'connected',
        databaseFile: 'robot_heart.db',
        timestamp: new Date().toISOString(),
        tables: {
          robot_state: robotState,
          memories,
          confessions,
          auth_settings: authSettings,
          proposal_responses: proposalResponses,
        },
        counts: {
          robot_state: robotState.length,
          memories: memories.length,
          confessions: confessions.length,
          auth_settings: authSettings.length,
          proposal_responses: proposalResponses.length,
        }
      }))
      return
    }

    // POST /api/database/clear - Clear specific table
    if (req.method === 'POST' && pathname === '/api/database/clear') {
      const body = await parseBody(req)
      const table = body.table
      const allowed = ['memories', 'confessions', 'proposal_responses']
      if (allowed.includes(table)) {
        db.prepare(`DELETE FROM ${table}`).run()
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true, message: `Table ${table} cleared` }))
        return
      }
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Cannot clear system table' }))
      return
    }

    // Static file serving for production build (dist/)
    if (!pathname.startsWith('/api')) {
      const distDir = path.join(rootDir, 'dist')
      const safeSuffix = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '')
      const filePath = path.join(distDir, safeSuffix === '\\' || safeSuffix === '/' ? 'index.html' : safeSuffix)

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase()
        const contentType = MIME_TYPES[ext] || 'application/octet-stream'
        res.writeHead(200, { 'Content-Type': contentType })
        fs.createReadStream(filePath).pipe(res)
        return
      }

      // Single Page Application (SPA) fallback to index.html
      const indexPath = path.join(distDir, 'index.html')
      if (fs.existsSync(indexPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        fs.createReadStream(indexPath).pipe(res)
        return
      }
    }

    // Default 404 for API endpoints
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Endpoint not found' }))
  } catch (err) {
    console.error('Database API Error:', err)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: err.message }))
  }
})

server.listen(PORT, () => {
  console.log(`🤖 Robot Heart SQLite DB Server running on http://localhost:${PORT}`)
})

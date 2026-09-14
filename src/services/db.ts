export interface SavedRobotState {
  emotion: string
  energy_level: number
  message: string
  updated_at?: string
}

export interface MemoryRecord {
  id?: number
  interaction_id: string
  label: string
  emotion_triggered: string
  energy_gained: number
  timestamp?: string
}

export interface ConfessionRecord {
  id?: number
  author: string
  message: string
  resonance_score: number
  created_at?: string
}

const LOCAL_STORAGE_KEY_STATE = 'robot_heart_db_state'
const LOCAL_STORAGE_KEY_MEMORIES = 'robot_heart_db_memories'
const LOCAL_STORAGE_KEY_CONFESSIONS = 'robot_heart_db_confessions'

// Helper for local storage fallback
function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function setLocal<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export async function fetchRobotState(): Promise<SavedRobotState> {
  try {
    const res = await fetch('/api/state')
    if (res.ok) {
      const data = await res.json()
      if (data && data.emotion) {
        setLocal(LOCAL_STORAGE_KEY_STATE, data)
        return data
      }
    }
  } catch {
    // API server offline, use local storage fallback
  }
  return getLocal(LOCAL_STORAGE_KEY_STATE, {
    emotion: 'idle',
    energy_level: 0,
    message: 'A quiet world is ready to be explored.',
  })
}

export async function saveRobotState(state: SavedRobotState): Promise<SavedRobotState> {
  setLocal(LOCAL_STORAGE_KEY_STATE, state)
  try {
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch {
    // API server offline
  }
  return state
}

export async function fetchMemories(): Promise<MemoryRecord[]> {
  try {
    const res = await fetch('/api/memories')
    if (res.ok) {
      const data = await res.json()
      setLocal(LOCAL_STORAGE_KEY_MEMORIES, data)
      return data
    }
  } catch {
    // API server offline
  }
  return getLocal(LOCAL_STORAGE_KEY_MEMORIES, [])
}

export async function saveMemory(memory: Omit<MemoryRecord, 'id' | 'timestamp'>): Promise<MemoryRecord[]> {
  const localList = getLocal<MemoryRecord[]>(LOCAL_STORAGE_KEY_MEMORIES, [])
  const newMemory: MemoryRecord = {
    ...memory,
    id: Date.now(),
    timestamp: new Date().toISOString(),
  }
  const updatedLocal = [newMemory, ...localList]
  setLocal(LOCAL_STORAGE_KEY_MEMORIES, updatedLocal)

  try {
    const res = await fetch('/api/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memory),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch {
    // API server offline
  }
  return updatedLocal
}

export async function fetchConfessions(): Promise<ConfessionRecord[]> {
  try {
    const res = await fetch('/api/confessions')
    if (res.ok) {
      const data = await res.json()
      setLocal(LOCAL_STORAGE_KEY_CONFESSIONS, data)
      return data
    }
  } catch {
    // API server offline
  }
  return getLocal(LOCAL_STORAGE_KEY_CONFESSIONS, [])
}

export async function saveConfession(confession: Omit<ConfessionRecord, 'id' | 'created_at'>): Promise<ConfessionRecord[]> {
  const localList = getLocal<ConfessionRecord[]>(LOCAL_STORAGE_KEY_CONFESSIONS, [])
  const newConfession: ConfessionRecord = {
    ...confession,
    id: Date.now(),
    created_at: new Date().toISOString(),
  }
  const updatedLocal = [newConfession, ...localList]
  setLocal(LOCAL_STORAGE_KEY_CONFESSIONS, updatedLocal)

  try {
    const res = await fetch('/api/confessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(confession),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch {
    // API server offline
  }
  return updatedLocal
}

export interface AuthResponse {
  authenticated: boolean
  authorizedName?: string
  secretMessage?: string
  statusMessage: string
  providedName?: string
}

export async function authenticateUser(name: string): Promise<AuthResponse> {
  try {
    const res = await fetch('/api/authentication', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()
    return data
  } catch {
    // Fallback if backend API server is offline
    const isMatch = name.trim().toLowerCase() === 'alex' || name.trim().toLowerCase() === 'heart'
    if (isMatch) {
      return {
        authenticated: true,
        authorizedName: name,
        secretMessage: 'Welcome, My Dearest. You have unlocked the hidden core of my Robotic Heart. Every heartbeat in this world was created just for you.',
        statusMessage: `Identity verified for ${name}. Core unlocked!`
      }
    } else {
      return {
        authenticated: false,
        providedName: name,
        statusMessage: `Access Denied: '${name || 'Empty'}' is not recognized in the offline core.`
      }
    }
  }
}

export async function updateAuthConfig(authorizedName: string, secretMessage: string, phoneNumber?: string) {
  try {
    const res = await fetch('/api/authentication/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorized_name: authorizedName,
        secret_message: secretMessage,
        phone_number: phoneNumber || '',
      }),
    })
    return await res.json()
  } catch {
    return { success: false }
  }
}

export interface ProposalResponseResult {
  success: boolean
  userName: string
  response: 'yes' | 'no'
  phoneNumber: string
  whatsappUrl: string
  messageText: string
  autoSent?: boolean
  autoSentProvider?: string
  autoSentDetail?: string
  autoSentError?: string | null
}

export async function recordProposalResponse(
  userName: string,
  response: 'yes' | 'no'
): Promise<ProposalResponseResult> {
  const defaultText = response === 'yes'
    ? `💖 Robotic Heart Alert: ${userName} answered YES to your proposal! "Our hearts are now synchronized in perfect harmony!" ✨`
    : `💔 Robotic Heart Alert: ${userName} answered NO. "Holding this moment gently in memory." 🌧️`

  try {
    const res = await fetch('/api/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name: userName, response }),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch {
    // API server offline fallback
  }

  // Fallback if offline
  return {
    success: true,
    userName,
    response,
    phoneNumber: '',
    whatsappUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(defaultText)}`,
    messageText: defaultText,
    autoSent: false,
    autoSentDetail: 'Server offline, using manual fallback',
  }
}

export interface SettingsData {
  authorizedName: string
  secretMessage: string
  phoneNumber: string
  whatsappProvider?: string
  whatsappApiKey?: string
  webhookUrl?: string
  twilioAccountSid?: string
  twilioAuthToken?: string
  twilioFromNumber?: string
}

export async function fetchSettings(): Promise<SettingsData> {
  try {
    const res = await fetch('/api/settings')
    if (res.ok) {
      return await res.json()
    }
  } catch {}
  return {
    authorizedName: 'Alex',
    secretMessage: '',
    phoneNumber: '',
    whatsappProvider: 'callmebot',
    whatsappApiKey: '',
    webhookUrl: '',
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioFromNumber: '',
  }
}

export async function updateSettings(settings: SettingsData) {
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorized_name: settings.authorizedName,
        secret_message: settings.secretMessage,
        phone_number: settings.phoneNumber,
        whatsapp_provider: settings.whatsappProvider || 'callmebot',
        whatsapp_api_key: settings.whatsappApiKey || '',
        webhook_url: settings.webhookUrl || '',
        twilio_account_sid: settings.twilioAccountSid || '',
        twilio_auth_token: settings.twilioAuthToken || '',
        twilio_from_number: settings.twilioFromNumber || '',
      }),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch {}
  return { success: false }
}

export async function sendTestNotification(): Promise<{
  sent: boolean
  provider: string
  detail: string
  error?: string
}> {
  try {
    const res = await fetch('/api/notify/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.ok) {
      return await res.json()
    }
  } catch {}
  return { sent: false, provider: 'offline', detail: 'Could not connect to API server' }
}

export interface DatabaseOverview {
  status: string
  databaseFile: string
  timestamp?: string
  tables: {
    robot_state: any[]
    memories: any[]
    confessions: any[]
    auth_settings: any[]
    proposal_responses: any[]
  }
  counts: {
    robot_state: number
    memories: number
    confessions: number
    auth_settings: number
    proposal_responses: number
  }
}

export async function fetchDatabaseOverview(): Promise<DatabaseOverview> {
  try {
    const res = await fetch('/api/database')
    if (res.ok) {
      return await res.json()
    }
  } catch {}

  // Local fallback
  const memories = await fetchMemories()
  const confessions = await fetchConfessions()
  const state = await fetchRobotState()
  const settings = await fetchSettings()

  return {
    status: 'connected (client-fallback)',
    databaseFile: 'robot_heart.db',
    timestamp: new Date().toISOString(),
    tables: {
      robot_state: [state],
      memories,
      confessions,
      auth_settings: [settings],
      proposal_responses: [],
    },
    counts: {
      robot_state: 1,
      memories: memories.length,
      confessions: confessions.length,
      auth_settings: 1,
      proposal_responses: 0,
    },
  }
}

export async function clearDatabaseTable(table: 'memories' | 'confessions' | 'proposal_responses'): Promise<boolean> {
  try {
    const res = await fetch('/api/database/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table }),
    })
    if (res.ok) {
      const data = await res.json()
      return data.success
    }
  } catch {}
  return false
}



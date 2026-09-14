import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { fetchSettings, updateSettings, sendTestNotification } from '../../services/db'
import { playClickSound, playUnlockSound } from '../../utils/sound'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [authorizedName, setAuthorizedName] = useState('HimaVarshini')
  const [secretMessage, setSecretMessage] = useState('')
  const [whatsappProvider, setWhatsappProvider] = useState<'callmebot' | 'webhook' | 'twilio'>('callmebot')
  const [whatsappApiKey, setWhatsappApiKey] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [twilioAccountSid, setTwilioAccountSid] = useState('')
  const [twilioAuthToken, setTwilioAuthToken] = useState('')
  const [twilioFromNumber, setTwilioFromNumber] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    if (isOpen) {
      setSavedSuccess(false)
      setTestResult(null)
      fetchSettings().then((data) => {
        if (data) {
          if (data.phoneNumber) setPhoneNumber(data.phoneNumber)
          if (data.authorizedName) setAuthorizedName(data.authorizedName)
          if (data.secretMessage) setSecretMessage(data.secretMessage)
          if (data.whatsappProvider) setWhatsappProvider(data.whatsappProvider as any)
          if (data.whatsappApiKey) setWhatsappApiKey(data.whatsappApiKey)
          if (data.webhookUrl) setWebhookUrl(data.webhookUrl)
          if (data.twilioAccountSid) setTwilioAccountSid(data.twilioAccountSid)
          if (data.twilioAuthToken) setTwilioAuthToken(data.twilioAuthToken)
          if (data.twilioFromNumber) setTwilioFromNumber(data.twilioFromNumber)
        }
      })
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    await updateSettings({
      phoneNumber: phoneNumber.trim(),
      authorizedName: authorizedName.trim(),
      secretMessage: secretMessage.trim(),
      whatsappProvider,
      whatsappApiKey: whatsappApiKey.trim(),
      webhookUrl: webhookUrl.trim(),
      twilioAccountSid: twilioAccountSid.trim(),
      twilioAuthToken: twilioAuthToken.trim(),
      twilioFromNumber: twilioFromNumber.trim(),
    })
    setIsSaving(false)
    setSavedSuccess(true)
    playUnlockSound()
    setTimeout(() => setSavedSuccess(false), 3500)
  }

  const handleTestDispatch = async () => {
    // Save first so test uses current values
    setIsTesting(true)
    setTestResult(null)
    playClickSound()

    await updateSettings({
      phoneNumber: phoneNumber.trim(),
      authorizedName: authorizedName.trim(),
      secretMessage: secretMessage.trim(),
      whatsappProvider,
      whatsappApiKey: whatsappApiKey.trim(),
      webhookUrl: webhookUrl.trim(),
      twilioAccountSid: twilioAccountSid.trim(),
      twilioAuthToken: twilioAuthToken.trim(),
      twilioFromNumber: twilioFromNumber.trim(),
    })

    const result = await sendTestNotification()
    setIsTesting(false)
    if (result.sent) {
      playUnlockSound()
      setTestResult({
        success: true,
        message: `✅ Test message delivered successfully via ${result.provider.toUpperCase()}! Check your WhatsApp.`
      })
    } else {
      setTestResult({
        success: false,
        message: `❌ Delivery failed: ${result.detail || result.error || 'Check your credentials and phone number'}`
      })
    }
  }

  return (
    <div className="modal-backdrop api-backdrop" onClick={onClose}>
      <motion.div
        className="modal-content auth-modal settings-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 22, stiffness: 180 }}
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '88vh', overflowY: 'auto' }}
      >
        <header className="modal-header">
          <div className="header-title">
            <span className="db-badge auth-badge">DATABASE CONFIG</span>
            <h2>AUTOMATIC WHATSAPP & CORE SETTINGS</h2>
          </div>
          <button
            className="close-btn"
            onClick={() => {
              playClickSound()
              onClose()
            }}
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSave} className="auth-form settings-form">
          <p className="auth-instruction">
            When someone clicks <strong>YES</strong> or <strong>NO</strong>, this API automatically sends the alert directly to your phone via WhatsApp in real-time!
          </p>

          <div className="form-group">
            <label className="settings-label">📱 YOUR WHATSAPP NUMBER (WITH COUNTRY CODE)</label>
            <input
              type="text"
              placeholder="e.g. 919493392251 or 918179170861"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="input-field auth-input"
              required
            />
            <div className="phone-quick-pills">
              <span className="pills-label">Quick select:</span>
              <button
                type="button"
                className={`phone-pill ${phoneNumber.replace(/\D/g, '') === '919493392251' ? 'active' : ''}`}
                onClick={() => setPhoneNumber('919493392251')}
              >
                +91 9493392251
              </button>
              <button
                type="button"
                className={`phone-pill ${phoneNumber.replace(/\D/g, '') === '918179170861' ? 'active' : ''}`}
                onClick={() => setPhoneNumber('918179170861')}
              >
                +91 8179170861
              </button>
            </div>
            <span className="settings-hint">Include country code without + or spaces (e.g. 91 for India)</span>
          </div>

          <div className="form-group">
            <label className="settings-label">🚀 AUTOMATED DISPATCH GATEWAY</label>
            <div className="provider-tabs">
              <button
                type="button"
                className={`provider-tab-btn ${whatsappProvider === 'callmebot' ? 'active' : ''}`}
                onClick={() => setWhatsappProvider('callmebot')}
              >
                CallMeBot (Free WhatsApp)
              </button>
              <button
                type="button"
                className={`provider-tab-btn ${whatsappProvider === 'webhook' ? 'active' : ''}`}
                onClick={() => setWhatsappProvider('webhook')}
              >
                Webhook (Zapier / Discord)
              </button>
              <button
                type="button"
                className={`provider-tab-btn ${whatsappProvider === 'twilio' ? 'active' : ''}`}
                onClick={() => setWhatsappProvider('twilio')}
              >
                Twilio WhatsApp
              </button>
            </div>

            {whatsappProvider === 'callmebot' && (
              <div className="provider-info-box">
                <div className="provider-info-title">
                  <span>✨</span> Free Automatic WhatsApp Setup (Takes 10 Seconds)
                </div>
                <p className="provider-info-desc">
                  CallMeBot sends automated WhatsApp messages straight to your phone at zero cost.
                </p>

                <div className="bot-warning-notice">
                  ℹ️ Note: The old CallMeBot number <code>+34 941832320</code> is retired. Please use one of the active bot numbers below:
                </div>

                <ol className="provider-steps">
                  <li>
                    1. Tap to message one of CallMeBot's active bots:
                    <div className="bot-buttons-row">
                      <a
                        href="https://api.whatsapp.com/send?phone=34623786449&text=I%20allow%20callmebot%20to%20send%20me%20messages"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bot-direct-btn primary"
                      >
                        💬 Message Active Bot 1 (+34 623 78 64 49)
                      </a>
                      <a
                        href="https://api.whatsapp.com/send?phone=34644817169&text=I%20allow%20callmebot%20to%20send%20me%20messages"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bot-direct-btn secondary"
                      >
                        💬 Alternative Bot 2 (+34 644 81 71 69)
                      </a>
                    </div>
                  </li>
                  <li>2. WhatsApp will open with the message: <code>I allow callmebot to send me messages</code> — press <strong>Send</strong>.</li>
                  <li>3. The bot will instantly reply with your <strong>API Key</strong> (e.g. <code>1234567</code>). Paste it below:</li>
                </ol>
                <div style={{ marginTop: '12px' }}>
                  <label className="settings-label" style={{ color: '#4ade80' }}>🔑 CALLMEBOT API KEY</label>
                  <input
                    type="text"
                    placeholder="e.g. 1234567"
                    value={whatsappApiKey}
                    onChange={(e) => setWhatsappApiKey(e.target.value)}
                    className="input-field auth-input"
                  />
                </div>
              </div>
            )}

            {whatsappProvider === 'webhook' && (
              <div className="provider-info-box">
                <div className="provider-info-title">
                  <span>🌐</span> Webhook Dispatch (Zapier, Make, Discord, Telegram, n8n)
                </div>
                <p className="provider-info-desc">
                  The API will send a POST request with JSON payload containing user name, response, timestamp, and message text.
                </p>
                <label className="settings-label">🔗 WEBHOOK URL</label>
                <input
                  type="url"
                  placeholder="https://maker.ifttt.com/... or https://discord.com/api/webhooks/..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="input-field auth-input"
                />
              </div>
            )}

            {whatsappProvider === 'twilio' && (
              <div className="provider-info-box">
                <div className="provider-info-title">
                  <span>📡</span> Twilio WhatsApp API
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <label className="settings-label">ACCOUNT SID</label>
                    <input
                      type="text"
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={twilioAccountSid}
                      onChange={(e) => setTwilioAccountSid(e.target.value)}
                      className="input-field auth-input"
                    />
                  </div>
                  <div>
                    <label className="settings-label">AUTH TOKEN</label>
                    <input
                      type="password"
                      placeholder="Your Twilio Auth Token"
                      value={twilioAuthToken}
                      onChange={(e) => setTwilioAuthToken(e.target.value)}
                      className="input-field auth-input"
                    />
                  </div>
                  <div>
                    <label className="settings-label">FROM WHATSAPP NUMBER</label>
                    <input
                      type="text"
                      placeholder="+14155238886"
                      value={twilioFromNumber}
                      onChange={(e) => setTwilioFromNumber(e.target.value)}
                      className="input-field auth-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Test Notification Row */}
            <div className="test-notify-row">
              <button
                type="button"
                className="test-notify-btn"
                onClick={handleTestDispatch}
                disabled={isTesting || !phoneNumber.trim()}
              >
                {isTesting ? '⏳ SENDING TEST MESSAGE...' : '⚡ TEST WHATSAPP NOTIFICATION'}
              </button>

              {testResult && (
                <div className={`test-result-banner ${testResult.success ? 'success' : 'error'}`}>
                  {testResult.message}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="settings-label">👤 AUTHORIZED PARTNER NAME</label>
            <input
              type="text"
              placeholder="e.g. HimaVarshini"
              value={authorizedName}
              onChange={(e) => setAuthorizedName(e.target.value)}
              className="input-field auth-input"
            />
          </div>

          <div className="form-group">
            <label className="settings-label">💌 SECRET CORE MESSAGE</label>
            <textarea
              rows={3}
              placeholder="Secret message revealed upon unlock..."
              value={secretMessage}
              onChange={(e) => setSecretMessage(e.target.value)}
              className="input-field confession-textarea"
            />
          </div>

          {savedSuccess && (
            <div className="settings-saved-banner">
              ✓ Settings, WhatsApp Gateway & Mobile Number saved to Database!
            </div>
          )}

          <div className="settings-btn-row">
            <button type="submit" disabled={isSaving} className="submit-btn auth-submit-btn">
              {isSaving ? 'SAVING TO DATABASE...' : 'SAVE SETTINGS 💾'}
            </button>
            <button
              type="button"
              className="db-btn"
              onClick={() => {
                playClickSound()
                onClose()
              }}
            >
              DONE
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

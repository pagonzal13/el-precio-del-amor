import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import AddExpense from './pages/AddExpense'
import EditExpense from './pages/EditExpense'
import History from './pages/History'
import Dashboard from './pages/Dashboard'

const SESSION_KEY = 'pdl_auth'
const BIOMETRIC_KEY = 'pdl_biometric_registered'
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD
const CREDENTIAL_ID_KEY = 'pdl_credential_id'

// ── WebAuthn helpers ──────────────────────────────────────────────

function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

function base64ToBuffer(base64) {
  const binary = atob(base64)
  const buffer = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i)
  return buffer.buffer
}

function webAuthnAvailable() {
  return window.PublicKeyCredential !== undefined
}

async function registerBiometric() {
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const options = {
    challenge,
    rp: { name: 'El Precio del Amor', id: window.location.hostname },
    user: {
      id: new TextEncoder().encode('capa-pau'),
      name: 'capa-pau',
      displayName: '🦦 y 🦒',
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },   // ES256
      { type: 'public-key', alg: -257 },  // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform', // solo biometría del dispositivo
      userVerification: 'required',
    },
    timeout: 60000,
  }

  const credential = await navigator.credentials.create({ publicKey: options })
  // Guardamos el id de la credencial para usarla en el login
  localStorage.setItem(CREDENTIAL_ID_KEY, bufferToBase64(credential.rawId))
  localStorage.setItem(BIOMETRIC_KEY, 'true')
  return true
}

async function verifyBiometric() {
  const credentialIdBase64 = localStorage.getItem(CREDENTIAL_ID_KEY)
  if (!credentialIdBase64) return false

  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const options = {
    challenge,
    allowCredentials: [{
      type: 'public-key',
      id: base64ToBuffer(credentialIdBase64),
      transports: ['internal'],
    }],
    userVerification: 'required',
    timeout: 60000,
  }

  try {
    await navigator.credentials.get({ publicKey: options })
    return true
  } catch {
    return false
  }
}

// ── Login Screen ──────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricRegistered, setBiometricRegistered] = useState(false)
  const [biometricLoading, setBiometricLoading] = useState(false)

  useEffect(() => {
    const available = webAuthnAvailable()
    const registered = localStorage.getItem(BIOMETRIC_KEY) === 'true'
    setBiometricAvailable(available)
    setBiometricRegistered(registered)

    // Si hay biometría registrada, intentarla automáticamente al abrir
    if (available && registered) {
      handleBiometric(true)
    }
  }, [])

  function triggerShake(msg) {
    setError(msg)
    setShake(true)
    setInput('')
    setTimeout(() => setShake(false), 500)
  }

  async function handleBiometric(auto = false) {
    setBiometricLoading(true)
    setError('')
    try {
      const ok = await verifyBiometric()
      if (ok) {
        sessionStorage.setItem(SESSION_KEY, 'true')
        onLogin()
      } else {
        if (!auto) triggerShake('Biometría no reconocida')
      }
    } catch {
      if (!auto) triggerShake('Biometría cancelada o no disponible')
    }
    setBiometricLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (input !== APP_PASSWORD) {
      triggerShake('Contraseña incorrecta')
      return
    }

    // Contraseña correcta — marcar sesión
    sessionStorage.setItem(SESSION_KEY, 'true')

    // Si biometría disponible y no registrada, ofrecer registro
    if (webAuthnAvailable() && !biometricRegistered) {
      const offer = window.confirm(
        '¿Quieres activar el acceso con huella o Face ID para la próxima vez?'
      )
      if (offer) {
        try {
          await registerBiometric()
          setBiometricRegistered(true)
        } catch {
          // Si falla el registro no bloqueamos el login
        }
      }
    }

    onLogin()
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg, #0a0a0a)',
      padding: '24px',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px',
        width: '100%',
        maxWidth: '340px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>💛</div>
          <h1 style={{
            fontFamily: 'var(--font-serif, serif)',
            fontSize: '28px',
            color: 'var(--text, #fff)',
            margin: 0,
          }}>El Precio del Amor</h1>
          <p style={{
            color: 'var(--text-muted, #888)',
            fontSize: '14px',
            marginTop: '8px',
          }}>Solo para 🦦 y 🦒</p>
        </div>

        {/* Botón biometría si está registrada */}
        {biometricAvailable && biometricRegistered && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => handleBiometric(false)}
              disabled={biometricLoading}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: '1.5px solid var(--border, #2a2a2a)',
                background: 'var(--surface, #141414)',
                color: 'var(--text, #fff)',
                fontSize: '16px',
                fontWeight: '600',
                cursor: biometricLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'border-color 0.15s',
              }}
            >
              {biometricLoading ? '…' : '☝️ Entrar con huella / Face ID'}
            </button>
            <p style={{
              color: 'var(--text-muted, #888)',
              fontSize: '12px',
              textAlign: 'center',
              margin: 0,
            }}>o introduce la contraseña</p>
          </div>
        )}

        {/* Formulario contraseña */}
        <form
          onSubmit={handleSubmit}
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            animation: shake ? 'shake 0.4s ease' : 'none',
          }}
        >
          <input
            type="password"
            placeholder="Contraseña"
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            autoFocus={!biometricRegistered}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '12px',
              border: error ? '1.5px solid #ef4444' : '1.5px solid var(--border, #2a2a2a)',
              background: 'var(--surface, #141414)',
              color: 'var(--text, #fff)',
              fontSize: '16px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
          />
          {error && (
            <p style={{ color: '#ef4444', fontSize: '13px', margin: 0, textAlign: 'center' }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: '#facc15',
              color: '#0a0a0a',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Entrar
          </button>
        </form>

        {/* Ofrecer registrar biometría si disponible pero no registrada */}
        {biometricAvailable && !biometricRegistered && (
          <p style={{
            color: 'var(--text-muted, #666)',
            fontSize: '12px',
            textAlign: 'center',
            margin: 0,
          }}>
            Al entrar con contraseña podrás activar el acceso con huella
          </p>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────

export default function App() {
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      setAuthed(true)
    }
  }, [])

  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="add" element={<AddExpense />} />
          <Route path="edit/:id" element={<EditExpense />} />
          <Route path="history" element={<History />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

import { useState } from 'react'
import { ArrowRight, CheckCircle, EnvelopeSimple, LockKey, ShieldCheck } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { supabase } from './lib/supabase'

const passwordRules = [
  ['8+ characters', password => password.length >= 8],
  ['One uppercase letter', password => /[A-Z]/.test(password)],
  ['One lowercase letter', password => /[a-z]/.test(password)],
  ['One number', password => /\d/.test(password)],
  ['One special character', password => /[^A-Za-z0-9]/.test(password)],
]

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [pendingVerification, setPendingVerification] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async event => {
    event.preventDefault()
    setError(''); setMessage(''); setBusy(true)
    if (!supabase) { setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'); setBusy(false); return }
    try {
      if (mode === 'signup') {
        const invalid = passwordRules.find(([, test]) => !test(password))
        if (invalid) throw new Error(`Password needs: ${invalid[0]}.`)
        if (password !== new FormData(event.currentTarget).get('confirmPassword')) throw new Error('Passwords do not match.')
        const { error: signupError } = await supabase.auth.signUp({ email, password })
        if (signupError) throw signupError
        setPendingVerification(true)
        setMessage(`We sent a verification code to ${email}.`)
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
        if (loginError) throw loginError
      }
    } catch (authError) { setError(authError.message || 'Authentication failed.') } finally { setBusy(false) }
  }

  const verify = async event => {
    event.preventDefault(); setError(''); setMessage(''); setBusy(true)
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: otp.trim(), type: 'signup' })
      if (verifyError) throw verifyError
    } catch (authError) { setError(authError.message || 'That verification code is not valid.') } finally { setBusy(false) }
  }

  const reset = () => { setMode('login'); setPendingVerification(false); setPassword(''); setOtp(''); setError(''); setMessage('') }

  return <main className="auth-page">
    <motion.section className="auth-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
      <div className="auth-brand">friends<span>✦</span>circle</div>
      <div className="auth-heading"><span className="eyebrow"><ShieldCheck size={15} /> Private social banking</span><h1>{pendingVerification ? 'Verify your email.' : mode === 'signup' ? 'Create your circle.' : 'Welcome back.'}</h1><p>{pendingVerification ? 'Enter the one-time code from your email to finish creating your account.' : 'Save trusted bank accounts and QR codes in one calm, private place.'}</p></div>
      {pendingVerification ? <form className="auth-form" onSubmit={verify}><label><EnvelopeSimple size={17} /> Verification code<input autoFocus value={otp} onChange={event => setOtp(event.target.value)} inputMode="numeric" placeholder="123456" maxLength={8} required /></label><button className="btn primary auth-submit" disabled={busy}>{busy ? 'Verifying…' : 'Verify email'} <ArrowRight size={18} /></button><button type="button" className="auth-link" onClick={reset}>Back to sign in</button></form> : <form className="auth-form" onSubmit={submit}><label><EnvelopeSimple size={17} /> Email address<input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" required /></label><label><LockKey size={17} /> Password<input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder={mode === 'signup' ? 'Create a strong password' : 'Your password'} required /></label>{mode === 'signup' && <><label><LockKey size={17} /> Confirm password<input name="confirmPassword" type="password" placeholder="Repeat your password" required /></label><div className="password-rules">{passwordRules.map(([label, test]) => <span className={test(password) ? 'rule valid' : 'rule'} key={label}><CheckCircle size={14} />{label}</span>)}</div></>}<button className="btn primary auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'} <ArrowRight size={18} /></button>{mode === 'login' ? <p className="auth-switch">New here? <button type="button" className="auth-link" onClick={() => { setMode('signup'); setError(''); setMessage('') }}>Create an account</button></p> : <p className="auth-switch">Already registered? <button type="button" className="auth-link" onClick={() => { setMode('login'); setError(''); setMessage('') }}>Sign in</button></p>}</form>}
      {message && <div className="auth-message">{message}</div>}{error && <div className="auth-error">{error}</div>}
      <small className="auth-footnote">Your account is secured by Supabase Auth.</small>
    </motion.section>
  </main>
}

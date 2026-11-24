import { useMemo, useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Bank, CaretDown, CheckCircle, DownloadSimple, EnvelopeSimple, Eye, LockKey, MoonStars, PencilSimple, Plus, QrCode, ShieldCheck, SignOut, Sun, Trash, UserCircle, X } from '@phosphor-icons/react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { qrBucket, supabase, isSupabaseConfigured } from './lib/supabase'

const cn = (...inputs) => twMerge(clsx(inputs))

function KineticFlowField({ particleCount = 1000, fieldScale = 0.002 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const context = canvas.getContext('2d')
    const particles = Array.from({ length: particleCount }, () => ({ x: Math.random(), y: Math.random(), life: Math.random() }))
    let frameId
    let width = 0
    let height = 0
    let pixelRatio = 1
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width; height = rect.height
      canvas.width = width * pixelRatio; canvas.height = height * pixelRatio
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }
    const animate = time => {
      context.clearRect(0, 0, width, height)
      const t = time * 0.00018
      for (const particle of particles) {
        const x = particle.x * width
        const y = particle.y * height
        const field = Math.sin((x + t * 900) * fieldScale) + Math.cos((y - t * 650) * fieldScale)
        const angle = field * Math.PI * 1.8 + Math.sin((y - x) * fieldScale) * .7
        const speed = 0.00055 + Math.abs(Math.sin(field)) * .0005
        const nextX = particle.x + Math.cos(angle) * speed
        const nextY = particle.y + Math.sin(angle) * speed
        context.beginPath()
        context.moveTo(x, y)
        context.lineTo(nextX * width, nextY * height)
        context.strokeStyle = `hsla(${155 + field * 28}, 90%, 70%, ${.13 + Math.abs(field) * .07})`
        context.lineWidth = .65
        context.stroke()
        particle.x = nextX < 0 ? 1 : nextX > 1 ? 0 : nextX
        particle.y = nextY < 0 ? 1 : nextY > 1 ? 0 : nextY
      }
      frameId = requestAnimationFrame(animate)
    }
    resize()
    window.addEventListener('resize', resize)
    frameId = requestAnimationFrame(animate)
    return () => { cancelAnimationFrame(frameId); window.removeEventListener('resize', resize) }
  }, [particleCount, fieldScale])

  return <canvas ref={canvasRef} className="kinetic-flow-field" aria-hidden="true" />
}

function ElectroBorder({ children, effects = true, glow = true, aura = true, borderColor = '#82f4ca', borderWidth = 2, distortion = 1, animationSpeed = 1, glowBlur = 24, className = '' }) {
  const duration = `${Math.max(.2, 1 / animationSpeed)}s`
  return <div className={cn('electro-border', effects && 'electro-effects', glow && 'electro-glow', aura && 'electro-aura', className)} style={{ '--electro-color': borderColor, '--electro-width': `${borderWidth}px`, '--electro-distortion': distortion, '--electro-duration': duration, '--electro-blur': `${glowBlur}px` }}>
    <div className="electro-border-core">{children}</div>
  </div>
}

const builtIn = [
  ['Harijan', 'Commercial Bank', 'commercial', 'harijan qr com bank.jpeg'],
  ['Sanjaiyan', 'Bank of Ceylon', 'boc', 'sanjaiyan qr boc.jpeg'],
  ['Sathu', 'Bank of Ceylon', 'boc', 'sathu qr boc.jpeg'],
  ['Sangaman', 'Bank of Ceylon', 'boc', 'sangaman qr boc.jpeg'],
  ['Saeyon', 'Dialog Finance', 'other', 'saeyon qr dilog finance.jpeg'],
  ['Saeyon', 'Bank of Ceylon', 'other', 'saeyon qr.jpeg'],
  ['Sathu', 'Commercial Bank', 'commercial', 'sathu qr com.jpeg'],
].map(([name, bank, group, file]) => ({ name, bank, group, file }))

const storageKey = 'friends-custom-qrs'
const groupFor = bank => /boc|ceylon/i.test(bank) ? 'boc' : /commercial/i.test(bank) ? 'commercial' : 'other'
const initials = name => name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()
const dbPerson = row => ({
  dbId: row.id,
  name: row.name,
  bank: row.bank,
  group: row.group_name,
  qrPath: row.qr_path,
  extraPath: row.extra_path,
  qrUrl: supabase ? supabase.storage.from(qrBucket).getPublicUrl(row.qr_path).data.publicUrl : '',
  extraUrl: (supabase && row.extra_path) ? supabase.storage.from(qrBucket).getPublicUrl(row.extra_path).data.publicUrl : '',
  custom: true,
})

function DotBackground({ children, spacing = 24, className = '' }) {
  const containerRef = useRef(null)
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 })
  const handleMouseMove = event => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setMousePos({ x: event.clientX - rect.left, y: event.clientY - rect.top })
  }

  const isLight = className.split(/\s+/).includes('light')
  return <div ref={containerRef} onMouseMove={handleMouseMove} className={cn('dot-background', className)}>
    {!isLight && <KineticFlowField particleCount={1000} fieldScale={0.002} />}
    <div className="dot-grid" style={{ backgroundSize: `${spacing}px ${spacing}px` }} />
    <div className="dot-highlight" style={{ background: `radial-gradient(220px circle at ${mousePos.x}px ${mousePos.y}px, rgba(16, 185, 129, 0.2), transparent 70%)` }} />
    <div className="dot-content">{children}</div>
  </div>
}

function readCustomQrs() {
  try { return JSON.parse(localStorage.getItem(storageKey) || '[]') } catch { return [] }
}

function App() {
  const [people, setPeople] = useState(() => [...builtIn, ...readCustomQrs()])
  const [filter, setFilter] = useState('all')
  const [nameFilter, setNameFilter] = useState('all')
  const [theme, setTheme] = useState(() => localStorage.getItem('friends-theme') || 'dark')
  const [page, setPage] = useState('viewer')
  const [currentUser, setCurrentUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [selected, setSelected] = useState(null)
  const [selectedPersonName, setSelectedPersonName] = useState(null)
  const [editing, setEditing] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => localStorage.setItem('friends-theme', theme), [theme])

  // Listen to Supabase Auth state & active session
  useEffect(() => {
    if (!supabase) return undefined
    let active = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active && session?.user) {
        setCurrentUser(session.user)
        setIsAdmin(true)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user)
        setIsAdmin(true)
      } else {
        setCurrentUser(null)
        setIsAdmin(false)
        setPage('viewer')
      }
    })

    return () => {
      active = false
      subscription?.unsubscribe()
    }
  }, [])

  // Load QR codes from Supabase
  useEffect(() => {
    if (!supabase) return undefined
    let active = true
    supabase
      .from('qr_codes')
      .select('*')
      .order('name')
      .order('bank')
      .then(({ data, error }) => {
        if (active && !error && data) {
          setPeople([...builtIn, ...data.map(dbPerson)])
        }
      })
      .catch(err => {
        console.error('Supabase load error:', err)
      })
    return () => { active = false }
  }, [])

  const names = useMemo(() => [...new Set(people.map(person => person.name))].sort(), [people])
  const visible = useMemo(() => people
    .filter(person => (filter === 'all' || person.group === filter) && (nameFilter === 'all' || person.name === nameFilter))
    .sort((a, b) => a.name.localeCompare(b.name) || a.bank.localeCompare(b.bank)), [people, filter, nameFilter])

  const persistCustom = next => {
    setPeople(next)
    localStorage.setItem(storageKey, JSON.stringify(next.filter(item => item.custom)))
  }

  const savePerson = async (event, original = null) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const qr = form.get('qr')
    const read = file => new Promise(resolve => {
      if (!file?.size) return resolve(original?.data || '')
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(file)
    })
    let person = {
      name: form.get('name').trim(),
      bank: form.get('bank').trim(),
      group: groupFor(form.get('bank')),
      data: await read(qr),
      extraData: await (async file => file?.size ? read(file) : (original?.extraData || ''))(form.get('extra')),
      file: qr?.name || original?.file,
      custom: true,
    }

    if (supabase) {
      setIsSaving(true)
      try {
        const safeBase = `${Date.now()}-${person.name}-${person.bank}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        const upload = async (file, oldPath, suffix) => {
          if (!file?.size) return oldPath || null
          const ext = file.name.split('.').pop() || 'png'
          const path = `${safeBase}-${suffix}.${ext}`
          const { error } = await supabase.storage.from(qrBucket).upload(path, file, {
            upsert: true,
            contentType: file.type || 'image/png',
          })
          if (error) throw error
          return path
        }

        const qrPath = await upload(qr, original?.qrPath, 'qr')
        if (!qrPath) throw new Error('Please choose a QR image.')
        const extraFile = form.get('extra')
        const extraPath = await upload(extraFile, original?.extraPath, 'extra')
        const record = {
          name: person.name,
          bank: person.bank,
          group_name: person.group,
          qr_path: qrPath,
          extra_path: extraPath,
          updated_at: new Date().toISOString(),
        }

        const result = original?.dbId
          ? await supabase.from('qr_codes').update(record).eq('id', original.dbId).select().single()
          : await supabase.from('qr_codes').insert(record).select().single()

        if (result.error) throw result.error
        person = dbPerson(result.data)
      } catch (err) {
        console.error('Supabase save error:', err)
        alert(`Failed to save to Supabase: ${err.message || err}`)
        setIsSaving(false)
        return
      } finally {
        setIsSaving(false)
      }
    }

    const next = original ? people.map(item => item === original ? person : item) : [...people, person]
    persistCustom(next)
    setShowAdd(false)
    setEditing(null)
  }

  const deletePerson = async person => {
    if (!person.custom || !window.confirm(`Remove ${person.name}'s QR code?`)) return
    if (supabase && person.dbId) {
      try {
        const { error } = await supabase.from('qr_codes').delete().eq('id', person.dbId)
        if (error) {
          alert(`Failed to delete from Supabase: ${error.message}`)
          return
        }
        const paths = [person.qrPath, person.extraPath].filter(Boolean)
        if (paths.length) {
          await supabase.storage.from(qrBucket).remove(paths)
        }
      } catch (err) {
        console.error('Supabase delete error:', err)
        alert(`Error deleting from Supabase: ${err.message || err}`)
        return
      }
    }
    persistCustom(people.filter(item => item !== person))
  }

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    setCurrentUser(null)
    setIsAdmin(false)
    setPage('viewer')
  }

  const openAdmin = () => isAdmin ? setPage('admin') : setShowLogin(true)

  const adminDisplayName = currentUser?.email
    ? currentUser.email.split('@')[0]
    : 'Admin'

  return <DotBackground className={theme === 'light' ? 'app light' : 'app'}>
    <header className="topbar shell">
      <div className="brand">friends<span>✦</span>circle</div>
      <nav className="page-nav" aria-label="Pages">
        <button className={page === 'viewer' ? 'nav-link active' : 'nav-link'} onClick={() => setPage('viewer')}>Viewer page</button>
        <button className={page === 'admin' && isAdmin ? 'nav-link active' : 'nav-link'} onClick={openAdmin}>Admin page</button>
      </nav>
      <div className="top-actions">
        {isSupabaseConfigured ? (
          <span className="top-note" title="Connected to Supabase Database, Auth & Storage">
            <CheckCircle size={15} color="#82f4ca" weight="fill" /> Supabase
          </span>
        ) : (
          <span className="top-note" title="Running in local fallback mode. Add Supabase credentials in .env to sync with cloud.">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} /> Local mode
          </span>
        )}
        <span className="top-note">
          {isAdmin ? (
            <><ShieldCheck size={15} /> Admin: {adminDisplayName}</>
          ) : (
            <><Eye size={15} /> Read-only viewer</>
          )}
        </span>
        <button className="icon-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? <MoonStars size={15} /> : <Sun size={15} />} {theme === 'light' ? 'Dark' : 'Light'} mode
        </button>
        {isAdmin && (
          <button className="btn quiet" onClick={handleSignOut}>
            <SignOut size={16} /> Sign out
          </button>
        )}
        {isAdmin && page === 'admin' && (
          <button className="btn primary" onClick={() => setShowAdd(true)}>
            <Plus size={17} weight="bold" /> Add QR
          </button>
        )}
      </div>
    </header>
    <motion.section className="hero shell" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, ease: 'easeOut' }}>
      <div>
        <div className="eyebrow">{page === 'admin' ? `Admin workspace · ${currentUser?.email || 'admin'}` : 'Good friends, all in one place'}</div>
        <h1>{page === 'admin' ? <>Manage your<br />circle.</> : <>Send a little<br />support.</>}</h1>
        <p>{page === 'admin' ? `Only signed-in admins (${currentUser?.email || 'admin'}) can add, edit, or remove QR codes. Everyone else can use the viewer page without changing anything.` : 'Find a friend, choose their payment QR, and scan it with your banking app. This page is view-only.'}</p>
      </div>
      <div className="hero-card">
        <span className="eyebrow">{page === 'admin' ? 'Private admin page' : 'Your circle'}</span>
        <strong>{page === 'admin' ? 'You are in control.' : 'Small gestures mean a lot.'}</strong>
        <small>{page === 'admin' ? (isSupabaseConfigured ? 'Changes are synced directly with Supabase Database & Storage.' : 'Changes are saved in this browser (Supabase not configured in .env).') : 'Simple, warm, and made for your people.'}</small>
      </div>
    </motion.section>
    <div className="controls shell">
      <div className="count">{visible.length} payment QR{visible.length === 1 ? '' : 's'}</div>
      <div className="filter-area">
        <div className="filters">
          {[['all', 'Everyone'], ['boc', 'BOC'], ['commercial', 'Commercial Bank'], ['other', 'Other']].map(([value, label]) => (
            <button key={value} className={filter === value ? 'filter active' : 'filter'} onClick={() => setFilter(value)}>{label}</button>
          ))}
        </div>
        <div className="filters">
          <button className={nameFilter === 'all' ? 'filter active' : 'filter'} onClick={() => setNameFilter('all')}>All names</button>
          {names.map(name => (
            <button key={name} className={nameFilter === name ? 'filter active' : 'filter'} onClick={() => setNameFilter(name)}>{name}</button>
          ))}
        </div>
      </div>
    </div>
    {page === 'viewer' ? (
      <PeopleDirectory people={visible} selectedName={selectedPersonName} onSelectName={name => setSelectedPersonName(selectedPersonName === name ? null : name)} onSelectBank={setSelected} />
    ) : (
      <main className="shell grid">
        {visible.map((person, index) => (
          <PersonCard key={`${person.name}-${person.bank}-${index}`} person={person} canManage onOpen={() => setSelected(person)} onEdit={() => setEditing(person)} onDelete={() => deletePerson(person)} />
        ))}
      </main>
    )}
    <footer>Made with care for your circle of friends · {isSupabaseConfigured ? 'Synced with Supabase Backend' : 'Admin changes stay saved in this browser'} · {isAdmin ? `Signed in as ${currentUser?.email || 'Admin'}` : 'Viewer access is read-only'}</footer>
    {selected && <QrModal person={selected} onClose={() => setSelected(null)} />}
    {showAdd && <QrFormModal title="Add a friend QR" isSaving={isSaving} onClose={() => setShowAdd(false)} onSubmit={event => savePerson(event)} />}
    {editing && <QrFormModal title="Edit QR code" isSaving={isSaving} person={editing} onClose={() => setEditing(null)} onSubmit={event => savePerson(event, editing)} />}
    {showLogin && (
      <LoginModal
        onClose={() => setShowLogin(false)}
        onSuccess={userObj => {
          setCurrentUser(userObj)
          setIsAdmin(true)
          setPage('admin')
          setShowLogin(false)
        }}
      />
    )}
  </DotBackground>
}

function imageFor(person) { return person.qrUrl || person.data || `/assets/${encodeURIComponent(person.file)}` }

function PeopleDirectory({ people, selectedName, onSelectName, onSelectBank }) {
  const names = [...new Set(people.map(person => person.name))].sort()
  return <main className="shell people-directory"><div className="directory-intro"><span className="eyebrow">Choose a friend</span><h2>Who would you like to support?</h2><p>Select a name to see their available bank accounts.</p></div><div className="people-list">{names.map(name => { const personBanks = people.filter(person => person.name === name); const isOpen = selectedName === name; return <motion.section className={isOpen ? 'person-row open' : 'person-row'} key={name} layout><button className="person-row-button" onClick={() => onSelectName(name)}><span className="directory-avatar">{initials(name)}</span><span className="directory-name">{name}</span><span className="directory-count">{personBanks.length} bank{personBanks.length === 1 ? '' : 's'}</span><CaretDown className="directory-chevron" size={20} /></button>{isOpen && <motion.div className="bank-list" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}><span className="bank-prompt">Choose a bank account</span>{personBanks.map(person => <button className="bank-row" key={`${person.name}-${person.bank}`} onClick={() => onSelectBank(person)}><Bank size={19} /><span>{person.bank}</span><QrCode className="bank-qr-icon" size={18} /></button>)}</motion.div>}</motion.section>})}</div></main>
}

function PersonCard({ person, canManage, onOpen, onEdit, onDelete }) { return <motion.article className="person" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -5 }} transition={{ duration: .3 }}><div className="person-top"><div className="avatar">{initials(person.name)}</div><div><h2>{person.name}</h2><div className="sub">{person.bank}</div></div><span className="badge">{person.custom ? 'ADDED' : 'FRIEND'}</span></div><ElectroBorder className="qr-electro" borderColor="#82f4ca" borderWidth={2} distortion={1.35} animationSpeed={1.2} glowBlur={22}><div className="qr-wrap"><img loading="lazy" src={imageFor(person)} alt={`${person.name}'s ${person.bank} QR code`} /></div></ElectroBorder>{(person.extraData || person.extraUrl) && <div className="extra"><img src={person.extraData || person.extraUrl} alt="" />Additional picture</div>}<div className="actions"><button className="btn primary" onClick={onOpen}><QrCode size={16} weight="bold" />Show QR</button><a className="btn quiet" href={imageFor(person)} download={person.file || `${person.name}-qr.png`}><DownloadSimple size={16} />Save</a>{canManage && person.custom && <><button className="btn quiet" onClick={onEdit}><PencilSimple size={16} />Edit</button><button className="btn danger" onClick={onDelete}><Trash size={16} />Delete</button></>}</div></motion.article> }

function QrModal({ person, onClose }) { const src = imageFor(person); return <div className="overlay open" onClick={event => event.target === event.currentTarget && onClose()}><div className="modal qr-modal"><div className="modal-head"><strong>{person.name} · {person.bank}</strong><button className="close" onClick={onClose}><X size={20} /></button></div><ElectroBorder className="modal-qr-electro" borderColor="#00ffff" borderWidth={3} distortion={1.8} animationSpeed={1.5} glowBlur={40}><img src={src} alt={`${person.name}'s ${person.bank} QR code`} /></ElectroBorder><a className="btn primary full" href={src} download={person.file || `${person.name}-qr.png`}><DownloadSimple size={18} />Download QR image</a></div></div> }

function QrFormModal({ title, person, onClose, onSubmit, isSaving = false }) { return <div className="overlay open" onClick={event => event.target === event.currentTarget && onClose()}><form className="modal form" onSubmit={onSubmit}><div className="modal-head"><strong>{title}</strong><button type="button" className="close" onClick={onClose}>×</button></div><label>Name<input name="name" required defaultValue={person?.name || ''} placeholder="e.g. Sathu" /></label><label>Which bank?<input name="bank" required defaultValue={person?.bank || ''} placeholder="e.g. Bank of Ceylon" /></label><label>QR picture<input name="qr" type="file" accept="image/*" required={!person} /></label><label>Additional picture <span>(optional)</span><input name="extra" type="file" accept="image/*" /></label><div className="modal-actions"><button type="button" className="btn quiet" disabled={isSaving} onClick={onClose}>Cancel</button><button className="btn primary" disabled={isSaving}>{isSaving ? 'Saving to Supabase...' : 'Save QR'}</button></div></form></div> }

function LoginModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async event => {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    const trimmedEmail = email.trim()

    // If Supabase is configured, authenticate via Supabase Auth
    if (supabase) {
      try {
        if (mode === 'signup') {
          if (password.length < 6) {
            throw new Error('Password must be at least 6 characters.')
          }
          if (password !== confirmPassword) {
            throw new Error('Passwords do not match.')
          }
          const { data, error: signUpError } = await supabase.auth.signUp({
            email: trimmedEmail,
            password,
          })
          if (signUpError) throw signUpError
          if (data?.session) {
            onSuccess(data.user)
          } else {
            setMessage('Registration link sent! Please check your email inbox to confirm your account.')
          }
        } else {
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          })
          if (signInError) throw signInError
          onSuccess(data.user)
        }
      } catch (err) {
        console.error('Auth error:', err)
        setError(err.message || 'Authentication failed.')
      } finally {
        setLoading(false)
      }
      return
    }

    // Local fallback when Supabase is not configured yet
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.')
      setLoading(false)
      return
    }
    if (password.length < 4) {
      setError('Please enter your password.')
      setLoading(false)
      return
    }

    onSuccess({ email: trimmedEmail })
    setLoading(false)
  }

  return (
    <div className="overlay open" onClick={event => event.target === event.currentTarget && onClose()}>
      <form className="modal form" onSubmit={handleSubmit}>
        <div className="modal-head">
          <strong style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvelopeSimple size={22} style={{ color: '#82f4ca' }} />
            {mode === 'signup' ? 'Create Admin Account' : 'Admin Sign In'}
          </strong>
          <button type="button" className="close" onClick={onClose}>×</button>
        </div>

        <p className="modal-copy">
          {mode === 'signup'
            ? 'Sign up with your email to manage your circle and QR codes.'
            : 'Sign in with your email address to manage your circle and QR codes.'}
        </p>

        <label>
          Email address
          <input
            type="email"
            autoFocus
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="admin@example.com"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
            required
          />
        </label>

        {mode === 'signup' && (
          <label>
            Confirm Password
            <input
              type="password"
              value={confirmPassword}
              onChange={event => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your password"
              required
            />
          </label>
        )}

        {message && (
          <div className="auth-message" style={{ borderRadius: 12, padding: '10px 14px', fontSize: 13, background: 'rgba(130, 244, 202, 0.12)', border: '1px solid rgba(130, 244, 202, 0.4)', color: '#82f4ca' }}>
            {message}
          </div>
        )}

        {error && <div className="form-error">{error}</div>}

        <div className="modal-actions" style={{ marginTop: 8 }}>
          <button type="button" className="btn quiet" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn primary" disabled={loading}>
            {loading ? 'Please wait...' : (mode === 'signup' ? 'Create account' : 'Sign in')}
          </button>
        </div>

        <div className="auth-switch" style={{ textAlign: 'center', marginTop: 8, fontSize: 13 }}>
          {mode === 'login' ? (
            <>
              Need an admin account?{' '}
              <button
                type="button"
                className="auth-link"
                onClick={() => { setMode('signup'); setError(''); setMessage('') }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className="auth-link"
                onClick={() => { setMode('login'); setError(''); setMessage('') }}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  )
}

export default App

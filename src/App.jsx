import { useMemo, useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle, DownloadSimple, Eye, MoonStars, PencilSimple, Plus, QrCode, ShieldCheck, SignOut, Sun, Trash, X } from '@phosphor-icons/react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

const cn = (...inputs) => twMerge(clsx(inputs))

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

function DotBackground({ children, spacing = 24, className = '' }) {
  const containerRef = useRef(null)
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 })
  const handleMouseMove = event => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setMousePos({ x: event.clientX - rect.left, y: event.clientY - rect.top })
  }

  return <div ref={containerRef} onMouseMove={handleMouseMove} className={cn('dot-background', className)}>
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
  const [isAdmin, setIsAdmin] = useState(false)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  useEffect(() => localStorage.setItem('friends-theme', theme), [theme])
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
    const person = {
      name: form.get('name').trim(), bank: form.get('bank').trim(), group: groupFor(form.get('bank')),
      data: await read(qr), extraData: await (async file => file?.size ? read(file) : (original?.extraData || ''))(form.get('extra')), file: qr?.name || original?.file,
      custom: true,
    }
    const next = original ? people.map(item => item === original ? person : item) : [...people, person]
    persistCustom(next)
    setShowAdd(false)
    setEditing(null)
  }

  const deletePerson = person => {
    if (!person.custom || !window.confirm(`Remove ${person.name}'s QR code?`)) return
    persistCustom(people.filter(item => item !== person))
  }

  const openAdmin = () => isAdmin ? setPage('admin') : setShowLogin(true)

  return <DotBackground className={theme === 'light' ? 'app light' : 'app'}>
    <header className="topbar shell">
      <div className="brand">friends<span>✦</span>circle</div>
      <nav className="page-nav" aria-label="Pages">
        <button className={page === 'viewer' ? 'nav-link active' : 'nav-link'} onClick={() => setPage('viewer')}>Viewer page</button>
        <button className={page === 'admin' && isAdmin ? 'nav-link active' : 'nav-link'} onClick={openAdmin}>Admin page</button>
      </nav>
      <div className="top-actions">
        <span className="top-note">{isAdmin ? <><ShieldCheck size={15} /> Admin: mee</> : <><Eye size={15} /> Read-only viewer</>}</span>
        <button className="icon-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <MoonStars size={15} /> : <Sun size={15} />} {theme === 'light' ? 'Dark' : 'Light'} mode</button>
        {isAdmin && <button className="btn quiet" onClick={() => { setIsAdmin(false); setPage('viewer') }}><SignOut size={16} /> Sign out</button>}
        {isAdmin && page === 'admin' && <button className="btn primary" onClick={() => setShowAdd(true)}><Plus size={17} weight="bold" /> Add QR</button>}
      </div>
    </header>
    <motion.section className="hero shell" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, ease: 'easeOut' }}>
      <div><div className="eyebrow">{page === 'admin' ? 'Admin workspace · username' : 'Good friends, all in one place'}</div><h1>{page === 'admin' ? <>Manage your<br />circle.</> : <>Send a little<br />support.</>}</h1><p>{page === 'admin' ? 'Only mee can add, edit, or remove QR codes. Everyone else can use the viewer page without changing anything.' : 'Find a friend, choose their payment QR, and scan it with your banking app. This page is view-only.'}</p></div>
      <div className="hero-card"><span className="eyebrow">{page === 'admin' ? 'Private admin page' : 'Your circle'}</span><strong>{page === 'admin' ? 'You are in control.' : 'Small gestures mean a lot.'}</strong><small>{page === 'admin' ? 'Changes are saved in this browser.' : 'Simple, warm, and made for your people.'}</small></div>
    </motion.section>
    <div className="controls shell"><div className="count">{visible.length} payment QR{visible.length === 1 ? '' : 's'}</div><div className="filter-area"><div className="filters">{[['all', 'Everyone'], ['boc', 'BOC'], ['commercial', 'Commercial Bank'], ['other', 'Other']].map(([value, label]) => <button key={value} className={filter === value ? 'filter active' : 'filter'} onClick={() => setFilter(value)}>{label}</button>)}</div><div className="filters"><button className={nameFilter === 'all' ? 'filter active' : 'filter'} onClick={() => setNameFilter('all')}>All names</button>{names.map(name => <button key={name} className={nameFilter === name ? 'filter active' : 'filter'} onClick={() => setNameFilter(name)}>{name}</button>)}</div></div></div>
    <main className="shell grid">{visible.map((person, index) => <PersonCard key={`${person.name}-${person.bank}-${index}`} person={person} canManage={isAdmin && page === 'admin'} onOpen={() => setSelected(person)} onEdit={() => setEditing(person)} onDelete={() => deletePerson(person)} />)}</main>
    <footer>Made with care for your circle of friends · {isAdmin ? 'Admin changes stay saved in this browser' : 'Viewer access is read-only'}</footer>
    {selected && <QrModal person={selected} onClose={() => setSelected(null)} />}
    {showAdd && <QrFormModal title="Add a friend QR" onClose={() => setShowAdd(false)} onSubmit={event => savePerson(event)} />}
    {editing && <QrFormModal title="Edit QR code" person={editing} onClose={() => setEditing(null)} onSubmit={event => savePerson(event, editing)} />}
    {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSuccess={() => { setIsAdmin(true); setPage('admin'); setShowLogin(false) }} />}
  </DotBackground>
}

function imageFor(person) { return person.data || `/assets/${encodeURIComponent(person.file)}` }
function PersonCard({ person, canManage, onOpen, onEdit, onDelete }) { return <motion.article className="person" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -5 }} transition={{ duration: .3 }}><div className="person-top"><div className="avatar">{initials(person.name)}</div><div><h2>{person.name}</h2><div className="sub">{person.bank}</div></div><span className="badge">{person.custom ? 'ADDED' : 'FRIEND'}</span></div><div className="qr-wrap"><img loading="lazy" src={imageFor(person)} alt={`${person.name}'s ${person.bank} QR code`} /></div>{person.extraData && <div className="extra"><img src={person.extraData} alt="" />Additional picture</div>}<div className="actions"><button className="btn primary" onClick={onOpen}><QrCode size={16} weight="bold" />Show QR</button><a className="btn quiet" href={imageFor(person)} download={person.file || `${person.name}-qr.png`}><DownloadSimple size={16} />Save</a>{canManage && person.custom && <><button className="btn quiet" onClick={onEdit}><PencilSimple size={16} />Edit</button><button className="btn danger" onClick={onDelete}><Trash size={16} />Delete</button></>}</div></motion.article> }
function QrModal({ person, onClose }) { const src = imageFor(person); return <div className="overlay open" onClick={event => event.target === event.currentTarget && onClose()}><div className="modal qr-modal"><div className="modal-head"><strong>{person.name} · {person.bank}</strong><button className="close" onClick={onClose}><X size={20} /></button></div><img src={src} alt={`${person.name}'s ${person.bank} QR code`} /><a className="btn primary full" href={src} download={person.file || `${person.name}-qr.png`}><DownloadSimple size={18} />Download QR image</a></div></div> }
function QrFormModal({ title, person, onClose, onSubmit }) { return <div className="overlay open" onClick={event => event.target === event.currentTarget && onClose()}><form className="modal form" onSubmit={onSubmit}><div className="modal-head"><strong>{title}</strong><button type="button" className="close" onClick={onClose}>×</button></div><label>Name<input name="name" required defaultValue={person?.name || ''} placeholder="e.g. Sathu" /></label><label>Which bank?<input name="bank" required defaultValue={person?.bank || ''} placeholder="e.g. Bank of Ceylon" /></label><label>QR picture<input name="qr" type="file" accept="image/*" required={!person} /></label><label>Additional picture <span>(optional)</span><input name="extra" type="file" accept="image/*" /></label><div className="modal-actions"><button type="button" className="btn quiet" onClick={onClose}>Cancel</button><button className="btn primary">Save QR</button></div></form></div> }
function LoginModal({ onClose, onSuccess }) { const [name, setName] = useState(''); const [error, setError] = useState(''); return <div className="overlay open" onClick={event => event.target === event.currentTarget && onClose()}><form className="modal form" onSubmit={event => { event.preventDefault(); if (name.trim().toLowerCase() === 'mee') onSuccess(); else setError('Only the admin account “mee” can open this page.') }}><div className="modal-head"><strong>Admin sign in</strong><button type="button" className="close" onClick={onClose}>×</button></div><p className="modal-copy">Enter the admin name to manage QR codes.</p><label>Admin name<input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="mee" required /></label>{error && <div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="btn quiet" onClick={onClose}>Cancel</button><button className="btn primary">Open admin page</button></div></form></div> }

export default App

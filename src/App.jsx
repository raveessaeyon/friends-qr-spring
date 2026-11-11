import { useEffect, useMemo, useState } from 'react'

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

function App() {
  const [people, setPeople] = useState(() => [...builtIn, ...JSON.parse(localStorage.getItem(storageKey) || '[]')])
  const [filter, setFilter] = useState('all')
  const [nameFilter, setNameFilter] = useState('all')
  const [theme, setTheme] = useState(() => localStorage.getItem('friends-theme') || 'dark')
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  useEffect(() => localStorage.setItem('friends-theme', theme), [theme])
  const names = useMemo(() => [...new Set(people.map(person => person.name))].sort(), [people])
  const visible = useMemo(() => people.filter(person => (filter === 'all' || person.group === filter) && (nameFilter === 'all' || person.name === nameFilter)).sort((a, b) => a.name.localeCompare(b.name) || a.bank.localeCompare(b.bank)), [people, filter, nameFilter])
  const addPerson = async event => {
    event.preventDefault()
    const form = new FormData(event.currentTarget), qr = form.get('qr')
    if (!qr?.type?.startsWith('image/')) return
    const read = file => new Promise(resolve => { if (!file?.size) return resolve(''); const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(file) })
    const person = { name: form.get('name').trim(), bank: form.get('bank').trim(), group: groupFor(form.get('bank')), data: await read(qr), extraData: await read(form.get('extra')), file: qr.name, custom: true }
    const next = [...people, person]; setPeople(next); localStorage.setItem(storageKey, JSON.stringify(next.filter(item => item.custom))); setShowAdd(false)
  }
  return <div className={theme === 'light' ? 'app light' : 'app'}>
    <header className="topbar shell"><div className="brand">friends<span>✦</span>circle</div><div className="top-actions"><span className="top-note">A little space to connect and support</span><button className="icon-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>☼ {theme === 'light' ? 'Dark' : 'Light'} mode</button><button className="btn primary" onClick={() => setShowAdd(true)}>＋ Add QR</button></div></header>
    <section className="hero shell"><div><div className="eyebrow">Good friends, all in one place</div><h1>Send a little<br />support.</h1><p>Find a friend, choose their payment QR, and scan it with your banking app. Add a new QR in seconds with the button above.</p></div><div className="hero-card"><span className="eyebrow">Your circle</span><strong>Small gestures mean a lot.</strong><small>Simple, warm, and made for your people.</small></div></section>
    <div className="controls shell"><div className="count">{visible.length} payment QR{visible.length === 1 ? '' : 's'}</div><div className="filter-area"><div className="filters">{[['all', 'Everyone'], ['boc', 'BOC'], ['commercial', 'Commercial Bank'], ['other', 'Other']].map(([value, label]) => <button key={value} className={filter === value ? 'filter active' : 'filter'} onClick={() => setFilter(value)}>{label}</button>)}</div><div className="filters"><button className={nameFilter === 'all' ? 'filter active' : 'filter'} onClick={() => setNameFilter('all')}>All names</button>{names.map(name => <button key={name} className={nameFilter === name ? 'filter active' : 'filter'} onClick={() => setNameFilter(name)}>{name}</button>)}</div></div></div>
    <main className="shell grid">{visible.map((person, index) => <PersonCard key={`${person.name}-${person.bank}-${index}`} person={person} onOpen={() => setSelected(person)} />)}</main><footer>Made with care for your circle of friends · New QR entries stay saved in this browser</footer>
    {selected && <QrModal person={selected} onClose={() => setSelected(null)} />}{showAdd && <AddModal onClose={() => setShowAdd(false)} onSubmit={addPerson} />}
  </div>
}

function imageFor(person) { return person.data || `/assets/${encodeURIComponent(person.file)}` }
function PersonCard({ person, onOpen }) { return <article className="person"><div className="person-top"><div className="avatar">{initials(person.name)}</div><div><h2>{person.name}</h2><div className="sub">{person.bank}</div></div><span className="badge">{person.custom ? 'ADDED' : 'FRIEND'}</span></div><div className="qr-wrap"><img loading="lazy" src={imageFor(person)} alt={`${person.name}'s ${person.bank} QR code`} /></div>{person.extraData && <div className="extra"><img src={person.extraData} alt="" />Additional picture</div>}<div className="actions"><button className="btn primary" onClick={onOpen}>Show QR</button><a className="btn quiet" href={imageFor(person)} download={person.file || `${person.name}-qr.png`}>Save</a></div></article> }
function QrModal({ person, onClose }) { const src = imageFor(person); return <div className="overlay open" onClick={event => event.target === event.currentTarget && onClose()}><div className="modal qr-modal"><div className="modal-head"><strong>{person.name} · {person.bank}</strong><button className="close" onClick={onClose}>×</button></div><img src={src} alt={`${person.name}'s ${person.bank} QR code`} /><a className="btn primary full" href={src} download={person.file || `${person.name}-qr.png`}>Download QR image</a></div></div> }
function AddModal({ onClose, onSubmit }) { return <div className="overlay open" onClick={event => event.target === event.currentTarget && onClose()}><form className="modal form" onSubmit={onSubmit}><div className="modal-head"><strong>Add a friend QR</strong><button type="button" className="close" onClick={onClose}>×</button></div><label>Name<input name="name" required placeholder="e.g. Sathu" /></label><label>Which bank?<input name="bank" required placeholder="e.g. Bank of Ceylon" /></label><label>QR picture<input name="qr" type="file" accept="image/*" required /></label><label>Additional picture <span>(optional)</span><input name="extra" type="file" accept="image/*" /></label><div className="modal-actions"><button type="button" className="btn quiet" onClick={onClose}>Cancel</button><button className="btn primary">Add to my circle</button></div></form></div> }

export default App

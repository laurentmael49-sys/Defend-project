import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

const Inventory = () => {
  const { user } = useAuth()
  const [assets, setAssets] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [loading, setLoading] = useState(true)

  // Modals
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [requestModal, setRequestModal] = useState({ show: false, asset: null })
  const [addModal, setAddModal] = useState(false)
  const [editModal, setEditModal] = useState({ show: false, asset: null })
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Request Form (Employee)
  const [reqForm, setReqForm] = useState({ start_date: '', end_date: '', reason: '' })
  const [reqLoading, setReqLoading] = useState(false)

  // Add/Edit Form (IT Manager)
  const blankAsset = { name: '', category: 'Computer', status: 'available', price: '', image_url: '' }
  const [assetForm, setAssetForm] = useState(blankAsset)
  const [formLoading, setFormLoading] = useState(false)

  const loadAssets = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:5000/api/assets')
      if (res.ok) setAssets(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAssets() }, [])

  const isLowStock = (a) => a.status === 'maintenance'
  const lowStockCount = assets.filter(a => a.status === 'maintenance').length
  const onLoanCount = assets.filter(a => a.status === 'loaned').length
  const maintenanceCount = assets.filter(a => a.status === 'maintenance').length

  const filtered = assets.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || String(m.id).includes(search)
    const matchStatus = !statusFilter || m.status === statusFilter
    const matchCategory = !categoryFilter || m.category === categoryFilter
    return matchSearch && matchStatus && matchCategory
  })

  // ── Employee: Submit Request ──────────────────────────────────────
  const submitRequest = async (e) => {
    e.preventDefault()
    setReqLoading(true)
    try {
      const res = await fetch('http://localhost:5000/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, asset_id: requestModal.asset.id, ...reqForm })
      })
      if (res.ok) {
        setRequestModal({ show: false, asset: null })
        setReqForm({ start_date: '', end_date: '', reason: '' })
        alert('Request submitted! Track it on your Dashboard.')
      } else {
        alert('Failed to submit request.')
      }
    } catch { alert('Network error.') }
    finally { setReqLoading(false) }
  }

  // ── IT Manager: Add Asset ─────────────────────────────────────────
  const submitAddAsset = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      const res = await fetch('http://localhost:5000/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assetForm)
      })
      if (res.ok) {
        setAddModal(false)
        setAssetForm(blankAsset)
        await loadAssets()
      } else { alert('Failed to add asset.') }
    } catch { alert('Network error.') }
    finally { setFormLoading(false) }
  }

  // ── IT Manager: Edit Asset ────────────────────────────────────────
  const submitEditAsset = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      const res = await fetch(`http://localhost:5000/api/assets/${editModal.asset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assetForm)
      })
      if (res.ok) {
        setEditModal({ show: false, asset: null })
        await loadAssets()
      } else { alert('Failed to update asset.') }
    } catch { alert('Network error.') }
    finally { setFormLoading(false) }
  }

  // ── IT Manager: Delete Asset ──────────────────────────────────────
  const deleteAsset = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/assets/${id}`, { method: 'DELETE' })
      if (res.ok) { setDeleteConfirm(null); await loadAssets() }
      else alert('Failed to delete asset.')
    } catch { alert('Network error.') }
  }

  const openEdit = (asset) => {
    setAssetForm({ name: asset.name, category: asset.category, status: asset.status, price: asset.price, image_url: asset.image_url || '' })
    setEditModal({ show: true, asset })
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-6 lg:px-8 font-sans">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Inventory</h1>
            <p className="mt-1 text-slate-500 font-medium">
              {user?.role === 'Employee' ? 'Browse available assets and submit a request.' : 'Manage all company assets in one place.'}
            </p>
          </div>
          {user?.role !== 'Employee' && (
            <div className="flex gap-3">
              <button onClick={() => setShowQRScanner(true)} className="rounded-xl bg-white border border-slate-200 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2 transition">
                <span className="text-xl">📷</span> Scan QR
              </button>
              <button onClick={() => { setAssetForm(blankAsset); setAddModal(true) }}
                className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 flex items-center gap-2 transition">
                + Add Asset
              </button>
            </div>
          )}
        </div>

        {/* Stock Alerts (IT Manager/Admin only) */}
        {user?.role !== 'Employee' && (
          <div className="mb-8 grid gap-4 sm:grid-cols-4">
            <AlertCard label="Available" value={assets.filter(a => a.status === 'available').length} color="green" icon="✅" />
            <AlertCard label="On Loan" value={onLoanCount} color="blue" icon="📦" />
            <AlertCard label="Maintenance" value={maintenanceCount} color="orange" icon="🔧" />
            <AlertCard label="Total Assets" value={assets.length} color="slate" icon="🗄️" />
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <input type="text" placeholder="Search by name or ID..."
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-slate-400 focus:bg-white transition"
              value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-slate-400 focus:bg-white transition appearance-none"
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="loaned">On Loan</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <select className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-slate-400 focus:bg-white transition appearance-none"
              value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              <option value="Computer">Computer</option>
              <option value="Monitor">Monitor</option>
              <option value="Phone">Phone</option>
              <option value="Network">Network</option>
              <option value="Peripheral">Peripheral</option>
              <option value="Furniture">Furniture</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>
          ) : (
            <div className="overflow-x-auto p-2">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                    <th className="px-5 py-4">ID</th>
                    <th className="px-5 py-4 text-center">Type</th>
                    <th className="px-5 py-4">Name</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Price</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-16 text-slate-400 font-medium">No assets found.</td></tr>
                  ) : filtered.map(m => (
                    <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition">
                      <td className="px-5 py-4 font-mono text-slate-500 text-xs">#{m.id}</td>
                      <td className="px-5 py-4 text-center">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto">
                          <span className="text-xl opacity-60">
                            {m.category === 'Computer' ? '💻' : m.category === 'Phone' ? '📱' : m.category === 'Monitor' ? '🖥️' : '📦'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800">{m.name}</td>
                      <td className="px-5 py-4 text-slate-600">{m.category}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider
                          ${m.status === 'available' ? 'bg-green-100 text-green-700 border border-green-200' :
                            m.status === 'loaned' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                            'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">{m.price ? `${Number(m.price).toLocaleString()} FCFA` : '—'}</td>
                      <td className="px-5 py-4 text-right">
                        {user?.role === 'Employee' ? (
                          <button
                            onClick={() => setRequestModal({ show: true, asset: m })}
                            disabled={m.status !== 'available'}
                            className="rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 text-xs font-bold hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
                            Request Item
                          </button>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => openEdit(m)} className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50" title="Edit Asset">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button onClick={() => setDeleteConfirm(m)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/50" title="Delete Asset">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── EMPLOYEE: Request Modal ───────────────────────────────── */}
      {requestModal.show && requestModal.asset && (
        <Modal onClose={() => setRequestModal({ show: false, asset: null })} title="Request Equipment">
          <p className="text-slate-500 mb-5 text-sm">Requesting: <strong className="text-slate-800">{requestModal.asset.name}</strong></p>
          <form onSubmit={submitRequest} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <input type="date" required className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
                  value={reqForm.start_date} onChange={e => setReqForm({ ...reqForm, start_date: e.target.value })} />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                <input type="date" required className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
                  value={reqForm.end_date} onChange={e => setReqForm({ ...reqForm, end_date: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason / Project</label>
              <textarea required rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
                value={reqForm.reason} onChange={e => setReqForm({ ...reqForm, reason: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setRequestModal({ show: false, asset: null })} className="px-5 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
              <button type="submit" disabled={reqLoading} className="px-5 py-2 rounded-lg font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
                {reqLoading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── IT MANAGER: Add Asset Modal ───────────────────────────── */}
      {addModal && (
        <Modal onClose={() => setAddModal(false)} title="➕ Add New Asset">
          <AssetForm form={assetForm} setForm={setAssetForm} onSubmit={submitAddAsset} loading={formLoading} onCancel={() => setAddModal(false)} />
        </Modal>
      )}

      {/* ── IT MANAGER: Edit Asset Modal ──────────────────────────── */}
      {editModal.show && (
        <Modal onClose={() => setEditModal({ show: false, asset: null })} title="✏️ Edit Asset">
          <AssetForm form={assetForm} setForm={setAssetForm} onSubmit={submitEditAsset} loading={formLoading} onCancel={() => setEditModal({ show: false, asset: null })} />
        </Modal>
      )}

      {/* ── IT MANAGER: Delete Confirm ────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Delete Asset?</h2>
            <p className="text-slate-500 text-sm mb-6">This will permanently remove <strong>{deleteConfirm.name}</strong> from the inventory.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteConfirm(null)} className="px-5 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
              <button onClick={() => deleteAsset(deleteConfirm.id)} className="px-5 py-2 rounded-lg font-bold bg-rose-600 text-white hover:bg-rose-700 transition">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── QR Scanner Modal ──────────────────────────────────────── */}
      {showQRScanner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><span className="text-indigo-600">📷</span> Scan QR Code</h2>
              <button onClick={() => setShowQRScanner(false)} className="text-slate-400 hover:text-slate-900 p-2 rounded-full hover:bg-slate-200 transition">✕</button>
            </div>
            <div className="p-8 flex flex-col items-center">
              <div className="w-64 h-64 border-4 border-dashed border-slate-300 rounded-3xl relative overflow-hidden bg-slate-100 flex items-center justify-center mb-6 shadow-inner">
                <style>{`@keyframes scan { 0%{top:-10%;opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{top:110%;opacity:0} }`}</style>
                <div className="absolute w-full h-1 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.8)]" style={{ animation: 'scan 2.5s ease-in-out infinite' }}></div>
                <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-indigo-500 rounded-br-lg"></div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Align QR Code</h3>
              <p className="text-slate-500 text-center font-medium text-sm">Hold the asset QR code within the frame.</p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setShowQRScanner(false)} className="w-full rounded-xl bg-slate-900 px-6 py-3 font-bold text-white hover:bg-slate-800 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Reusable Modal Wrapper ────────────────────────────────────────────
const Modal = ({ onClose, title, children }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-900 p-2 rounded-full hover:bg-slate-200 transition">✕</button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
)

// ── Asset Form (shared between Add and Edit) ──────────────────────────
const AssetForm = ({ form, setForm, onSubmit, loading, onCancel }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Asset Name *</label>
      <input required type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dell XPS 15" />
    </div>
    <div className="flex gap-4">
      <div className="flex-1">
        <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
        <select required className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 appearance-none"
          value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
          <option>Computer</option>
          <option>Monitor</option>
          <option>Phone</option>
          <option>Network</option>
          <option>Peripheral</option>
          <option>Furniture</option>
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-slate-700 mb-1">Status *</label>
        <select required className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 appearance-none"
          value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
          <option value="available">Available</option>
          <option value="loaned">On Loan</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Price (FCFA) *</label>
      <input required type="number" min="0" className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
        value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="e.g. 850000" />
    </div>
    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
      <button type="button" onClick={onCancel} className="px-5 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-100 transition">Cancel</button>
      <button type="submit" disabled={loading} className="px-5 py-2 rounded-lg font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition">
        {loading ? 'Saving...' : 'Save Asset'}
      </button>
    </div>
  </form>
)

// ── Alert Card ────────────────────────────────────────────────────────
const AlertCard = ({ label, value, color, icon }) => {
  const colors = { green: 'bg-emerald-50 text-emerald-700 border-emerald-200', blue: 'bg-blue-50 text-blue-700 border-blue-200', orange: 'bg-orange-50 text-orange-700 border-orange-200', slate: 'bg-slate-50 text-slate-700 border-slate-200', rose: 'bg-rose-50 text-rose-700 border-rose-200' }
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${colors[color]} flex flex-col relative`}>
      {icon && <span className="absolute top-4 right-4 text-lg opacity-70">{icon}</span>}
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider opacity-80">{label}</p>
      <p className="text-4xl font-black tracking-tight">{value}</p>
    </div>
  )
}

export default Inventory
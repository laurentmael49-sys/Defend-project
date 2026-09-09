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
  const [requestModal, setRequestModal] = useState({ show: false, asset: null })
  const [addModal, setAddModal] = useState(false)
  const [editModal, setEditModal] = useState({ show: false, asset: null })
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Request Form (Employee)
  const [reqForm, setReqForm] = useState({ start_date: '', end_date: '', reason: '' })
  const [reqLoading, setReqLoading] = useState(false)

  // Add/Edit Form (IT Manager)
  const blankAsset = { name: '', category: 'Computer', status: 'available', price: '' }
  const [assetForm, setAssetForm] = useState(blankAsset)
  const [formLoading, setFormLoading] = useState(false)

  // Toast notification
  const [toast, setToast] = useState(null)
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 5000)
  }

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
        showToast('Request submitted successfully! Track it on your Dashboard.')
      } else {
        const data = await res.json().catch(() => ({}))
        showToast(data.error || 'Failed to submit request.', 'error')
      }
    } catch { showToast('Network error.', 'error') }
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
        showToast(`Asset "${assetForm.name}" added to inventory successfully!`)
      } else {
        const data = await res.json().catch(() => ({}))
        showToast(data.error || 'Failed to add asset.', 'error')
      }
    } catch { showToast('Network error.', 'error') }
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
        showToast(`Asset updated successfully!`)
      } else {
        const data = await res.json().catch(() => ({}))
        showToast(data.error || 'Failed to update asset.', 'error')
      }
    } catch { showToast('Network error.', 'error') }
    finally { setFormLoading(false) }
  }

  // ── IT Manager: Delete Asset ──────────────────────────────────────
  const deleteAsset = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/assets/${id}`, { method: 'DELETE' })
      if (res.ok) { 
        setDeleteConfirm(null)
        await loadAssets()
        showToast('Asset deleted from inventory.')
      } else {
        const data = await res.json().catch(() => ({}))
        showToast(data.error || 'Failed to delete asset.', 'error')
      }
    } catch { showToast('Network error.', 'error') }
  }

  const openEdit = (asset) => {
    setAssetForm({ name: asset.name, category: asset.category, status: asset.status, price: asset.price })
    setEditModal({ show: true, asset })
  }

  return (
    <div className="min-h-screen bg-emerald-50/30 px-4 py-8 text-slate-800 sm:px-6 lg:px-8 font-sans">
      {/* ── Toast Notification ────────────────────────────────────────── */}
      {toast && (
        <div
          className="fixed top-6 right-6 z-[200] max-w-sm w-full shadow-2xl rounded-2xl overflow-hidden pointer-events-auto bg-slate-900 border border-slate-800 text-white"
          style={{ animation: 'slideInRight 0.4s cubic-bezier(0.16,1,0.3,1)' }}
        >
          <div className="flex items-start gap-3 px-5 py-4">
            <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              {toast.type === 'error' ? '!' : '✓'}
            </div>
            <div className="flex-1">
              <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                {toast.type === 'error' ? 'Notice' : 'Success'}
              </p>
              <p className="text-xs text-slate-300 font-medium mt-0.5 leading-relaxed">{toast.msg}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white text-base leading-none">✕</button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl pt-16">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Inventory</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {user?.role === 'Employee' ? 'Browse available assets and submit a request.' : 'Manage all company assets in one place.'}
            </p>
          </div>
          {user?.role !== 'Employee' && (
            <div className="flex gap-3">
              <button onClick={() => { setAssetForm(blankAsset); setAddModal(true) }}
                className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-bold text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all">
                + Add Asset
              </button>
            </div>
          )}
        </div>

        {/* Metrics Bar */}
        {user?.role !== 'Employee' && (
          <div className="mb-8 grid gap-4 sm:grid-cols-4">
            <AlertCard label="Available" value={assets.filter(a => a.status === 'available').length} />
            <AlertCard label="On Loan" value={onLoanCount} />
            <AlertCard label="Maintenance" value={maintenanceCount} />
            <AlertCard label="Total Assets" value={assets.length} />
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 rounded-3xl border border-emerald-100 bg-white/90 p-5 shadow-lg shadow-emerald-950/5">
          <div className="grid gap-4 md:grid-cols-3">
            <input type="text" placeholder="Search by name or ID..."
              className="rounded-2xl border border-emerald-100 bg-emerald-50/30 px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30 transition placeholder:text-slate-400"
              value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="rounded-2xl border border-emerald-100 bg-emerald-50/30 px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30 transition"
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="loaned">On Loan</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <select className="rounded-2xl border border-emerald-100 bg-emerald-50/30 px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30 transition"
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
        <div className="rounded-3xl border border-emerald-100 bg-white/90 shadow-lg shadow-emerald-950/5 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div></div>
          ) : (
            <div className="overflow-x-auto p-2">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-emerald-50 bg-emerald-50/20">
                    <th className="px-5 py-4">ID</th>
                    <th className="px-5 py-4">Name</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Price</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-16 text-slate-400 font-medium">No assets found.</td></tr>
                  ) : filtered.map(m => (
                    <tr key={m.id} className="border-b border-emerald-50/60 hover:bg-emerald-50/30 transition">
                      <td className="px-5 py-4 font-mono text-slate-400 font-semibold">#{m.id}</td>
                      <td className="px-5 py-4 font-bold text-slate-900 text-sm">{m.name}</td>
                      <td className="px-5 py-4 text-slate-600 font-medium">{m.category}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider
                          ${m.status === 'available' ? 'bg-emerald-600 text-white' :
                            m.status === 'loaned' ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                            'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">{m.price ? `${Number(m.price).toLocaleString()} FCFA` : '—'}</td>
                      <td className="px-5 py-4 text-right">
                        {user?.role === 'Employee' ? (
                          <button
                            onClick={() => setRequestModal({ show: true, asset: m })}
                            disabled={m.status !== 'available'}
                            className="rounded-xl bg-emerald-600 text-white px-4 py-2 text-xs font-bold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
                            Request Item
                          </button>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => openEdit(m)} className="rounded-xl p-2 text-emerald-700 hover:bg-emerald-100 transition-colors" title="Edit Asset">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button onClick={() => setDeleteConfirm(m)} className="rounded-xl p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Delete Asset">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
          <p className="text-slate-600 mb-5 text-xs font-medium">Requesting: <strong className="text-slate-900 font-bold">{requestModal.asset.name}</strong></p>
          <form onSubmit={submitRequest} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">Start Date</label>
                <input type="date" required className="w-full px-4 py-2.5 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-slate-800 text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30"
                  value={reqForm.start_date} onChange={e => setReqForm({ ...reqForm, start_date: e.target.value })} />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">End Date</label>
                <input type="date" required className="w-full px-4 py-2.5 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-slate-800 text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30"
                  value={reqForm.end_date} onChange={e => setReqForm({ ...reqForm, end_date: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">Reason / Project</label>
              <textarea required rows={3} className="w-full px-4 py-2.5 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-slate-800 text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30"
                value={reqForm.reason} onChange={e => setReqForm({ ...reqForm, reason: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-emerald-50">
              <button type="button" onClick={() => setRequestModal({ show: false, asset: null })} className="px-5 py-2.5 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 text-xs">Cancel</button>
              <button type="submit" disabled={reqLoading} className="px-5 py-2.5 rounded-2xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 text-xs shadow-md shadow-emerald-600/20">
                {reqLoading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── IT MANAGER: Add Asset Modal ───────────────────────────── */}
      {addModal && (
        <Modal onClose={() => setAddModal(false)} title="Add New Asset">
          <AssetForm form={assetForm} setForm={setAssetForm} onSubmit={submitAddAsset} loading={formLoading} onCancel={() => setAddModal(false)} />
        </Modal>
      )}

      {/* ── IT MANAGER: Edit Asset Modal ──────────────────────────── */}
      {editModal.show && (
        <Modal onClose={() => setEditModal({ show: false, asset: null })} title="Edit Asset">
          <AssetForm form={assetForm} setForm={setAssetForm} onSubmit={submitEditAsset} loading={formLoading} onCancel={() => setEditModal({ show: false, asset: null })} />
        </Modal>
      )}

      {/* ── IT MANAGER: Delete Confirm ────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border border-emerald-100">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4 text-xl font-bold">!</div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Delete Asset?</h2>
            <p className="text-slate-500 text-xs mb-6">This will permanently remove <strong>{deleteConfirm.name}</strong> from the inventory.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteConfirm(null)} className="px-5 py-2.5 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 text-xs">Cancel</button>
              <button onClick={() => deleteAsset(deleteConfirm.id)} className="px-5 py-2.5 rounded-2xl font-bold bg-rose-600 text-white hover:bg-rose-700 text-xs shadow-md">Delete</button>
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
    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-emerald-100">
      <div className="p-6 border-b border-emerald-50 flex justify-between items-center bg-emerald-50/40">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-900 p-2 rounded-full hover:bg-emerald-100 transition">✕</button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
)

// Keywords for IT equipment
const IT_KEYWORDS = [
  'laptop', 'notebook', 'macbook', 'thinkpad', 'elitebook', 'latitude', 'inspiron', 'precision',
  'xps', 'probook', 'zenbook', 'vivobook', 'rog', 'tuf', 'legion', 'predator', 'omen', 'surface',
  'desktop', 'computer', 'pc', 'workstation', 'imac', 'mac mini', 'mac studio', 'mac pro',
  'server', 'blade', 'poweredge', 'proliant', 'nas', 'synology', 'qnap', 'chromebook',
  'monitor', 'screen', 'display', 'ultrasharp', 'curved', '4k', '1080p', 'oled', 'ips',
  'projector', 'viewsonic', 'benq', 'aoc', 'lg display', 'samsung display',
  'phone', 'smartphone', 'iphone', 'galaxy', 'pixel', 'android', 'tablet', 'ipad', 'tab',
  'mobile', 'walkie', 'ios', 'oneplus', 'xiaomi', 'huawei', 'motorola',
  'router', 'switch', 'modem', 'access point', 'wifi', 'wi-fi', 'ethernet', 'lan', 'wan',
  'firewall', 'gateway', 'cisco', 'tp-link', 'tplink', 'netgear', 'ubiquiti', 'unifi',
  'd-link', 'mikrotik', 'fortinet', 'juniper', 'patch panel', 'rj45', 'cat6', 'cat5', 'sfp',
  'pdu', 'ups', 'battery backup', 'apc', 'cyberpower', 'rack', 'server rack',
  'mouse', 'trackpad', 'touchpad', 'keyboard', 'keychron', 'logitech', 'corsair', 'razer',
  'webcam', 'camera', 'cam', 'microphone', 'mic', 'headset', 'headphone', 'earphone', 'earbuds',
  'airpods', 'jabra', 'poly', 'polycom', 'sennheiser', 'bose', 'speaker',
  'dock', 'docking station', 'hub', 'dongle', 'adapter', 'charger', 'power supply', 'cable',
  'hdmi', 'usb', 'type-c', 'usbc', 'thunderbolt', 'vga', 'displayport', 'power bank',
  'printer', 'scanner', 'copier', 'laserjet', 'inkjet', 'epson', 'canon', 'brother',
  'shredder', 'barcode', 'rfid', 'smart card', 'stylus',
  'ram', 'memory', 'ddr4', 'ddr5', 'ssd', 'hdd', 'hard drive', 'hard disk', 'nvme', 'm.2',
  'flash drive', 'thumb drive', 'pendrive', 'usb drive', 'storage', 'gpu', 'graphics card',
  'geforce', 'rtx', 'gtx', 'radeon', 'nvidia', 'amd', 'intel', 'core i3', 'core i5', 'core i7', 'core i9',
  'ryzen', 'xeon', 'motherboard', 'cpu', 'processor', 'cooling fan', 'heatsink', 'psu',
  'office chair', 'ergonomic chair', 'desk', 'standing desk', 'workstation desk',
  'apple', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'microsoft', 'sony', 'samsung', 'lg',
  'toshiba', 'panasonic', 'fujitsu', 'seagate', 'western digital', 'wd', 'kingston', 'sandisk',
  'crucial', 'steelseries', 'hyperx', 'anker', 'belkin', 'ugreen'
]

const NON_IT_BLACKLIST = [
  'banana', 'orange', 'pizza', 'burger', 'sandwich', 'bread', 'rice', 'soup', 'chicken',
  'meat', 'beef', 'pork', 'cookie', 'biscuit', 'cake', 'chocolate', 'candy', 'water',
  'juice', 'soda', 'coke', 'beer', 'wine', 'alcohol', 'coffee', 'tea', 'milk', 'fruit',
  'vegetable', 'potato', 'tomato', 'onion', 'garlic', 'carrot', 'pepper', 'egg', 'cheese',
  'butter', 'sugar', 'salt', 'oil', 'meal', 'lunch', 'dinner', 'breakfast', 'snack', 'food',
  'dog', 'puppy', 'cat', 'kitten', 'pet', 'bird', 'horse', 'cow', 'pig', 'sheep', 'goat',
  'lion', 'tiger', 'snake', 'monkey', 'animal',
  'shirt', 't-shirt', 'tshirt', 'pants', 'trousers', 'jeans', 'shorts', 'shoes', 'sneakers',
  'boots', 'sandals', 'dress', 'skirt', 'jacket', 'coat', 'sweater', 'hoodie', 'hat', 'cap',
  'socks', 'underwear', 'belt', 'scarf', 'gloves', 'glasses', 'sunglasses', 'ring', 'necklace',
  'bracelet', 'earring', 'jewelry', 'perfume', 'cologne', 'makeup', 'lipstick', 'lotion', 'shampoo',
  'soap', 'cosmetic', 'clothes', 'clothing',
  'car', 'truck', 'van', 'bus', 'motorcycle', 'motorbike', 'bike', 'bicycle', 'scooter',
  'plane', 'airplane', 'helicopter', 'boat', 'ship', 'yacht', 'train', 'vehicle',
  'bed', 'mattress', 'pillow', 'blanket', 'sofa', 'couch', 'curtain', 'rug', 'carpet',
  'pan', 'pot', 'knife', 'fork', 'spoon', 'plate', 'bowl', 'cup', 'glass', 'mug', 'bottle',
  'refrigerator', 'fridge', 'microwave', 'oven', 'stove', 'blender', 'toaster', 'washing machine',
  'dryer', 'vacuum', 'iron', 'broom', 'mop', 'bucket', 'trash can', 'toilet', 'shower',
  'ball', 'football', 'basketball', 'soccer', 'tennis', 'baseball', 'golf', 'racket', 'guitar',
  'piano', 'drum', 'toy', 'doll', 'lego',
  'flower', 'tree', 'plant', 'grass', 'wood', 'stone', 'rock', 'sand', 'dirt', 'gold', 'silver',
  'house', 'apartment', 'villa', 'building', 'land', 'gun', 'weapon', 'sword'
]

const getAssetValidationErrors = (form) => {
  const errors = {}

  if (!form.name || !form.name.trim()) {
    errors.name = 'Asset name is required.'
  } else {
    const trimmed = form.name.trim()
    const lower = trimmed.toLowerCase()

    if (trimmed.length < 3) {
      errors.name = 'Asset name is too short (minimum 3 characters).'
    } else if (trimmed.length > 100) {
      errors.name = 'Asset name cannot exceed 100 characters.'
    } else if (/<[^>]*>|javascript:|alert\(|drop\s+table|union\s+select|--|;/i.test(trimmed)) {
      errors.name = 'Invalid characters or malicious script code detected.'
    } else if (!/[a-zA-Z]/.test(trimmed)) {
      errors.name = 'Asset name must contain valid letters (e.g., "Dell Latitude", "MacBook Pro").'
    } else if (/(\w)\1{4,}/i.test(trimmed)) {
      errors.name = 'Please enter a realistic asset name (repetitive character spam detected).'
    } else if (/^(asdf|qwerty|test|foo|bar|dummy|fake|lol|haha|xyz)+$/i.test(trimmed.replace(/\s+/g, ''))) {
      errors.name = 'Please enter a genuine asset name instead of test keywords.'
    } else {
      const hasITKeyword = IT_KEYWORDS.some(k => lower.includes(k))
      const matchedNonIT = NON_IT_BLACKLIST.find(bad => new RegExp(`\\b${bad}\\b`, 'i').test(lower))

      if (matchedNonIT && !hasITKeyword) {
        errors.name = `"${trimmed}" is not an IT asset! Inventory only accepts IT equipment.`
      } else if (!hasITKeyword) {
        errors.name = `"${trimmed}" is not recognized as an IT asset. Please enter valid IT equipment.`
      }
    }
  }

  if (form.price === '' || form.price === null || form.price === undefined) {
    errors.price = 'Price is required.'
  } else {
    const num = Number(form.price)
    if (isNaN(num) || num < 0) {
      errors.price = 'Price must be a valid positive number (≥ 0 FCFA).'
    } else if (num > 100000000) {
      errors.price = 'Price is unrealistically high (max 100,000,000 FCFA).'
    }
  }

  return errors
}

const AssetForm = ({ form, setForm, onSubmit, loading, onCancel }) => {
  const [refusalError, setRefusalError] = useState('')
  const [errorField, setErrorField] = useState('')

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (refusalError) {
      setRefusalError('')
      setErrorField('')
    }
  }

  const handleSaveClick = (e) => {
    e.preventDefault()
    
    const errors = getAssetValidationErrors(form)
    if (errors.name) {
      setRefusalError(errors.name)
      setErrorField('name')
      return
    }
    if (errors.price) {
      setRefusalError(errors.price)
      setErrorField('price')
      return
    }

    setRefusalError('')
    setErrorField('')
    onSubmit(e)
  }

  return (
    <form onSubmit={handleSaveClick} className="space-y-4">
      {refusalError && (
        <div className="rounded-2xl bg-amber-50 border-2 border-amber-200 p-4 text-slate-800 text-xs font-semibold flex items-start gap-3 shadow-sm">
          <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">!</div>
          <div className="flex-1">
            <strong className="block text-slate-900 font-bold mb-0.5">Addition Refused:</strong>
            <p className="text-slate-700 leading-relaxed">{refusalError}</p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
          Asset Name *
        </label>
        <input
          required
          type="text"
          className={`w-full px-4 py-2.5 border rounded-2xl outline-none text-xs font-medium transition ${
            errorField === 'name'
              ? 'border-emerald-500 bg-emerald-50 text-slate-900 ring-2 ring-emerald-400'
              : 'border-emerald-100 bg-emerald-50/30 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/30'
          }`}
          value={form.name}
          onChange={e => handleChange('name', e.target.value)}
          placeholder="e.g. MacBook Pro 16 or Dell XPS 15"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">Category *</label>
          <select
            required
            className="w-full px-4 py-2.5 border border-emerald-100 bg-emerald-50/30 text-slate-900 rounded-2xl outline-none text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30"
            value={form.category}
            onChange={e => handleChange('category', e.target.value)}
          >
            <option>Computer</option>
            <option>Monitor</option>
            <option>Phone</option>
            <option>Network</option>
            <option>Peripheral</option>
            <option>Furniture</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">Status *</label>
          <select
            required
            className="w-full px-4 py-2.5 border border-emerald-100 bg-emerald-50/30 text-slate-900 rounded-2xl outline-none text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30"
            value={form.status}
            onChange={e => handleChange('status', e.target.value)}
          >
            <option value="available">Available</option>
            <option value="loaned">On Loan</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
          Price (FCFA) *
        </label>
        <input
          required
          type="number"
          min="0"
          className={`w-full px-4 py-2.5 border rounded-2xl outline-none text-xs font-medium transition ${
            errorField === 'price'
              ? 'border-emerald-500 bg-emerald-50 text-slate-900 ring-2 ring-emerald-400'
              : 'border-emerald-100 bg-emerald-50/30 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/30'
          }`}
          value={form.price}
          onChange={e => handleChange('price', e.target.value)}
          placeholder="e.g. 850000"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-emerald-50">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition text-xs"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-2xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Asset'}
        </button>
      </div>
    </form>
  )
}

const AlertCard = ({ label, value }) => {
  return (
    <div className="rounded-3xl border border-emerald-100 bg-white/90 p-5 shadow-lg shadow-emerald-950/5 flex flex-col justify-center">
      <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-3xl font-black tracking-tight text-slate-900">{value}</p>
    </div>
  )
}

export default Inventory
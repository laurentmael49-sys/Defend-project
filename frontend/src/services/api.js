const API_BASE = 'http://localhost:5000/api'

export const getAssets = async () => {
  try {
    const res = await fetch(`${API_BASE}/assets`)
    if (!res.ok) throw new Error('Failed to fetch assets')
    const data = await res.json()
    // If empty, return a detailed mock item for demo purposes
    if (data.length === 0) throw new Error('Empty database')
    return data
  } catch (error) {
    console.warn("Using mock data for Inventory.")
    return [
      { 
        id: 1, 
        name: 'Enterprise Server Rack (High-Performance)', 
        ref: 'SRV-RACK-001-X', 
        stock: 2, 
        minStock: 5, 
        category: 'Computer', 
        status: 'available', 
        price: 15400,
        expiration_date: '2028-12-31',
        location: 'Server Room A - Rack 3',
        description: 'Main production server rack containing redundant switches and power supplies.',
        assignedTo: 'IT Infrastructure Dept',
        purchaseDate: '2023-01-15'
      }
    ]
  }
}

export const createAsset = async (asset) => {
  const res = await fetch(`${API_BASE}/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(asset)
  })
  if (!res.ok) throw new Error('Failed to create asset')
  return res.json()
}

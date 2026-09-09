const express = require('express')
const router = express.Router()
const { pool } = require('../config/db')

// GET all assets
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM assets ORDER BY created_at DESC')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Keywords for IT equipment, tech hardware, models and brands
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

// Non-IT Blacklist: food, animals, apparel, vehicles, kitchen/household, nature, random words
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

// Validation helper for assets
const validateAssetInput = (data) => {
  const { name, price, category, status } = data
  if (!name || typeof name !== 'string' || !name.trim()) {
    return 'Asset name is required.'
  }
  const trimmedName = name.trim()
  const lower = trimmedName.toLowerCase()

  if (trimmedName.length < 3) {
    return 'Asset name must be at least 3 characters long.'
  }
  if (trimmedName.length > 100) {
    return 'Asset name cannot exceed 100 characters.'
  }
  if (/<[^>]*>|javascript:|alert\(|drop\s+table|union\s+select|--|;/i.test(trimmedName)) {
    return 'Invalid characters or script tags detected in asset name.'
  }
  if (!/[a-zA-Z]/.test(trimmedName)) {
    return 'Asset name must contain letters (e.g., "MacBook Pro 16", "Dell Monitor").'
  }
  if (/(\w)\1{4,}/i.test(trimmedName)) {
    return 'Invalid asset name: repetitive character gibberish detected.'
  }
  if (/^(asdf|qwerty|test|foo|bar|dummy|fake|lol|haha)+$/i.test(trimmedName.replace(/\s+/g, ''))) {
    return 'Please enter a legitimate asset name instead of test/gibberish text.'
  }

  // Check 1: Non-IT Blacklist words (unless combined with a strong IT keyword like "Apple MacBook")
  const hasITKeyword = IT_KEYWORDS.some(k => lower.includes(k))
  const matchedNonIT = NON_IT_BLACKLIST.find(bad => new RegExp(`\\b${bad}\\b`, 'i').test(lower))

  if (matchedNonIT && !hasITKeyword) {
    return `❌ "${trimmedName}" is not an IT asset! The inventory system only accepts Information Technology equipment (Computers, Monitors, Phones, Network hardware, Peripherals).`
  }

  // Check 2: Must contain recognizable IT hardware, brand, or technology keyword
  if (!hasITKeyword) {
    return `⚠️ "${trimmedName}" is not recognized as an IT asset. Please enter valid IT equipment (e.g. Dell Laptop, MacBook, HP Monitor, Cisco Switch, Logitech Mouse).`
  }

  // Price validation
  if (price !== undefined && price !== '' && price !== null) {
    const numPrice = Number(price)
    if (isNaN(numPrice) || numPrice < 0) {
      return 'Price must be a valid positive number.'
    }
    if (numPrice > 100000000) {
      return 'Price cannot exceed 100,000,000 FCFA.'
    }
  }
  return null
}

// POST new asset
router.post('/', async (req, res) => {
  try {
    const validationError = validateAssetInput(req.body)
    if (validationError) {
      return res.status(400).json({ error: validationError })
    }

    const { name, category, status, price, description, serial_no } = req.body
    const assetPrice = price !== undefined && price !== '' ? Number(price) : 0
    const [result] = await pool.query(
      'INSERT INTO assets (name, category, status, price, description, serial_no) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), category || 'Computer', status || 'available', assetPrice, description || null, serial_no || null]
    )
    res.status(201).json({ id: result.insertId, message: 'Asset created' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PUT update asset
router.put('/:id', async (req, res) => {
  try {
    const validationError = validateAssetInput(req.body)
    if (validationError) {
      return res.status(400).json({ error: validationError })
    }

    const { name, category, status, price, description, serial_no } = req.body
    const assetPrice = price !== undefined && price !== '' ? Number(price) : 0
    await pool.query(
      'UPDATE assets SET name=?, category=?, status=?, price=?, description=?, serial_no=? WHERE id=?',
      [name.trim(), category || 'Computer', status || 'available', assetPrice, description || null, serial_no || null, req.params.id]
    )
    res.json({ message: 'Asset updated' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// DELETE asset
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM assets WHERE id = ?', [req.params.id])
    res.json({ message: 'Asset deleted' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router

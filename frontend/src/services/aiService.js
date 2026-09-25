const API_BASE = 'http://localhost:5000/api'

/**
 * Sends a chat message and context to the backend AI route.
 * Automatically attaches the JWT token from localStorage in the Authorization header.
 * @param {string} message - The user query string (1-500 characters)
 * @param {Object} context - The structured database context object
 * @returns {Promise<{ reply: string, usage: Object }>} AI response object
 */
export const sendAIChatMessage = async (message, context) => {
  const token = localStorage.getItem('token')

  const headers = {
    'Content-Type': 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, context })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    if (response.status === 401) {
      throw new Error('Unauthorized: Please log in to use the AI assistant.')
    }
    if (response.status === 429) {
      throw new Error(errorData.error || 'Rate limit exceeded: Maximum 20 messages per hour allowed.')
    }
    throw new Error(errorData.error || `Server error (${response.status})`)
  }

  return response.json()
}

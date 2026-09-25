import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { sendAIChatMessage } from '../services/aiService'
import { buildContext } from '../utils/aiContext'

const INITIAL_WELCOME_MESSAGE = {
  id: 'welcome',
  sender: 'ai',
  text: 'Hello! I am your Defend AI Assistant ✨. How can I help you with IT equipment, loans, or system policies today?',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Sensitive data detection patterns (Credit cards, SSNs, Passwords/Secrets)
const SENSITIVE_PATTERNS = [
  /\b(?:\d[ -]*?){13,16}\b/,
  /\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/,
  /\b(password|pwd|pass|secret|api_key|credit_card)\s*[:=]\s*\S+/i
]

// Role-based suggestion chips
const SUGGESTION_CHIPS = {
  admin: [
    { label: '📋 Overdue loans', text: 'Show overdue loans' },
    { label: '📦 Unassigned assets', text: 'How many unassigned assets?' },
    { label: '📊 Loans summary', text: 'Give me a summary of all loans' },
    { label: '👤 Pending requests', text: 'List users with pending requests' },
  ],
  user: [
    { label: '🖥️ My assets', text: 'What assets are assigned to me?' },
    { label: '📅 My loan status', text: "What's my loan status?" },
    { label: '⏰ Next due date', text: 'When is my next return due?' },
    { label: '➕ Request asset', text: 'How do I request a new asset?' },
  ],
}

const AIChatWidget = () => {
  const { user } = useAuth()
  const storageKey = `ai_chat_history_${user?.id || 'guest'}`

  const [isOpen, setIsOpen] = useState(false)
  const [showInfoPopover, setShowInfoPopover] = useState(false)
  const [aiHealth, setAiHealth] = useState({ status: 'ok', circuit: 'closed' }) // 'ok', 'degraded', 'down'
  const [retryCountdown, setRetryCountdown] = useState(0) // 30s countdown on 503

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {
      console.error('Failed to load chat history from localStorage', e)
    }
    return [INITIAL_WELCOME_MESSAGE]
  })

  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [cooldown, setCooldown] = useState(false)
  const [showScrollBottom, setShowScrollBottom] = useState(false)
  
  const messagesEndRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const lastSendRef = useRef(0)

  // TASK 4: Poll /api/ai/health every 30 seconds while chat is open
  useEffect(() => {
    let intervalId
    const checkHealth = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/ai/health')
        if (res.ok) {
          const data = await res.json()
          setAiHealth(data)
        } else {
          setAiHealth({ status: 'down', circuit: 'open' })
        }
      } catch (e) {
        setAiHealth({ status: 'down', circuit: 'open' })
      }
    }

    if (isOpen) {
      checkHealth()
      intervalId = setInterval(checkHealth, 30000)
    }
    return () => clearInterval(intervalId)
  }, [isOpen])

  // Countdown timer for 503 30-second retry lock
  useEffect(() => {
    let timer
    if (retryCountdown > 0) {
      timer = setInterval(() => {
        setRetryCountdown(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [retryCountdown])

  // Reload history if logged-in user changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed)
          return
        }
      }
    } catch (e) {
      console.error('Error switching user chat history', e)
    }
    setMessages([INITIAL_WELCOME_MESSAGE])
  }, [user?.id, storageKey])

  // Save messages to localStorage on update (capped at last 20 messages)
  useEffect(() => {
    try {
      const capped = messages.slice(-20)
      localStorage.setItem(storageKey, JSON.stringify(capped))
    } catch (e) {
      console.error('Failed to save chat history', e)
    }
  }, [messages, storageKey])

  // Auto scroll to bottom
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom('auto')
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      scrollToBottom('smooth')
    }
  }, [messages, isTyping])

  // Scroll position listener
  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    const isUp = scrollHeight - scrollTop - clientHeight > 100
    setShowScrollBottom(isUp)
  }

  // Clear Chat History
  const handleClearHistory = () => {
    const fresh = [INITIAL_WELCOME_MESSAGE]
    setMessages(fresh)
    try {
      localStorage.removeItem(storageKey)
    } catch (e) {
      console.error('Failed to clear localStorage chat history', e)
    }
  }

  // Whether chips should be visible: only when just the welcome message exists
  const isChipVisible = messages.length === 1 && messages[0].id === 'welcome'

  // Determine which chip set to show based on role
  const isAdmin = user?.role === 'Admin' || user?.role === 'IT Manager'
  const chips = isAdmin ? SUGGESTION_CHIPS.admin : SUGGESTION_CHIPS.user

  // Send Message with Rate Limiting, Sensitive Guard, 503 Fallback Countdown
  const handleSend = async (e, overrideText) => {
    e?.preventDefault()
    const textToSend = (overrideText ?? input).trim()
    if (!textToSend || isTyping || cooldown || retryCountdown > 0) return

    const userText = textToSend.slice(0, 500)
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      timestamp: currentTime
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')

    // Prevent Sensitive Inputs (Light Guard)
    const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(userText))
    if (isSensitive) {
      const warnMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: "⚠️ Please don't share sensitive numbers, credit cards, or passwords in chat.",
        timestamp: currentTime
      }
      setMessages((prev) => [...prev, warnMsg])
      return
    }

    // Rate Limiting Check (1 msg per 2s)
    const now = Date.now()
    if (now - lastSendRef.current < 2000) {
      setCooldown(true)
      setTimeout(() => setCooldown(false), 2000)
      return
    }
    lastSendRef.current = now

    setCooldown(true)
    setTimeout(() => setCooldown(false), 2000)
    setIsTyping(true)

    try {
      // Build context locally on each message send
      const contextData = await buildContext(user)

      // Send to backend endpoint with JWT Authorization header
      const data = await sendAIChatMessage(userText, contextData)

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: data.reply || "Sorry, I couldn't reach the AI right now. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }

      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      console.error('AI Chat Error Details:', err)

      // TASK 4: Check if error is 503 / Service Unavailable / Circuit Open
      const is503 = err.message?.includes('503') || err.message?.includes('taking too long') || err.message?.includes('unavailable')

      let fallbackText = err.message || "Sorry, I couldn't reach the AI right now. Please try again."
      if (is503) {
        fallbackText = "🤖 The AI assistant is temporarily unavailable. Your question has been saved — please try again in a moment."
        setRetryCountdown(30) // Lock send button for 30s countdown
      }

      const errorMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
    }
  }

  // Helper for status badge style
  const getStatusBadge = () => {
    if (aiHealth.status === 'ok') {
      return { dot: 'bg-emerald-300 animate-pulse', label: 'AI online', text: 'text-emerald-100' }
    }
    if (aiHealth.status === 'degraded') {
      return { dot: 'bg-amber-400 animate-pulse', label: 'Degraded', text: 'text-amber-200' }
    }
    return { dot: 'bg-rose-400 animate-ping', label: 'Offline', text: 'text-rose-200' }
  }

  const badge = getStatusBadge()

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating / Responsive Chat Panel */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 w-full h-full sm:w-96 sm:h-[540px] sm:max-w-[calc(100vw-3rem)] flex flex-col bg-white sm:rounded-2xl rounded-none shadow-2xl border border-emerald-100/80 overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 z-50">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3.5 text-white flex justify-between items-center shadow-sm flex-shrink-0 relative">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white border border-white/30">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-base leading-tight">AI Assistant ✨</h3>
                  <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                </div>
                <p className={`text-[11px] ${badge.text}`}>
                  {badge.label} • Powered by OpenRouter
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Privacy Info Toggle */}
              <button
                onClick={() => setShowInfoPopover(!showInfoPopover)}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Privacy & Compliance Info"
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              {/* Clear History Button */}
              <button
                onClick={handleClearHistory}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors text-xs flex items-center gap-1"
                title="Clear chat history"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Close chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Privacy Info Popover */}
            {showInfoPopover && (
              <div className="absolute top-14 right-4 bg-slate-900 text-slate-100 text-xs p-3.5 rounded-xl shadow-xl border border-slate-700 w-72 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between font-semibold text-emerald-400 mb-1">
                  <span>🔒 Privacy & Compliance</span>
                  <button onClick={() => setShowInfoPopover(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
                </div>
                <p className="leading-relaxed text-slate-300">
                  Your questions and AI responses are logged for compliance. Don't share sensitive info like passwords or full bank details.
                </p>
              </div>
            )}
          </div>

          {/* Messages Container */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60 relative"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-start gap-2 max-w-[88%]">
                  {msg.sender === 'ai' && (
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 shadow-sm">
                      AI
                    </div>
                  )}
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none font-medium'
                        : 'bg-white text-slate-800 border border-emerald-100/80 rounded-tl-none leading-relaxed whitespace-pre-wrap'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start gap-2 max-w-[85%]">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 shadow-sm">
                  AI
                </div>
                <div className="flex items-center gap-1.5 px-4 py-3 bg-white border border-emerald-100 rounded-2xl rounded-tl-none shadow-sm">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />

            {/* Scroll-to-bottom Button */}
            {showScrollBottom && (
              <button
                onClick={() => scrollToBottom('smooth')}
                className="sticky bottom-2 right-2 ml-auto w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg hover:bg-emerald-700 transition-all opacity-90 hover:opacity-100"
                title="Scroll to bottom"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            )}
          </div>

          {/* Persistent Disclaimer Banner & Input Form */}
          <div className="bg-white border-t border-slate-100 flex flex-col flex-shrink-0">

            {/* Suggestion Chips — only shown when chat is fresh */}
            {isChipVisible && (
              <div className="px-3 pt-3 pb-1 flex flex-wrap gap-1.5">
                {chips.map((chip) => (
                  <button
                    key={chip.text}
                    onClick={() => handleSend(null, chip.text)}
                    disabled={isTyping || cooldown || retryCountdown > 0}
                    className="
                      text-[11px] font-semibold px-3 py-1.5 rounded-full border
                      bg-emerald-50 text-emerald-800 border-emerald-200
                      hover:bg-emerald-100 hover:border-emerald-400 hover:shadow-sm
                      active:scale-95 transition-all duration-150
                      disabled:opacity-40 disabled:cursor-not-allowed
                      whitespace-nowrap
                    "
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <div className="p-3 pb-2 flex flex-col gap-1.5">
              {cooldown && (
                <div className="text-[11px] text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md text-center font-medium border border-amber-200/60 animate-in fade-in">
                  Please wait a moment before sending another message...
                </div>
              )}

              <form onSubmit={handleSend} className="flex items-center gap-2 relative">
                <input
                  type="text"
                  value={input}
                  maxLength={500}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={retryCountdown > 0 ? `Service paused (${retryCountdown}s)` : cooldown ? "Please wait..." : "Ask AI anything..."}
                  disabled={isTyping || cooldown || retryCountdown > 0}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 disabled:opacity-60 transition-all"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || isTyping || cooldown || retryCountdown > 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-xs font-semibold active:scale-95 flex-shrink-0 min-w-[65px]"
                  title={retryCountdown > 0 ? `Retry in ${retryCountdown}s` : "Send message"}
                >
                  {retryCountdown > 0 ? (
                    <span>{retryCountdown}s</span>
                  ) : (
                    <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  )}
                </button>
              </form>
            </div>

            {/* Persistent Disclaimer Banner */}
            <div className="text-[10px] text-slate-500 bg-slate-100/90 px-3 py-1.5 text-center border-t border-slate-200/70 font-medium flex items-center justify-center gap-1 select-none">
              <span>⚠️ AI responses are informational only. Always verify with official records before making decisions.</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/20 group relative ml-auto"
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></span>
          </>
        )}
      </button>
    </div>
  )
}

export default AIChatWidget

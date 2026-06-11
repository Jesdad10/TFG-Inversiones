import { useState, useEffect, useRef } from 'react'
import { chatService } from '../services/chat'
import './SoporteChat.css'

export default function SoporteChat({ user }) {
  const [open, setOpen] = useState(false)
  const [chatData, setChatData] = useState(null)
  const [messages, setMessages] = useState([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [unreadUser, setUnreadUser] = useState(0)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  // Polling de mensajes cuando el chat está abierto
  useEffect(() => {
    if (!open || !user?.id) return

    const fetchMensajes = async () => {
      try {
        const data = await chatService.getMiChat()
        if (!isMounted.current) return
        setChatData(data.chat)
        setMessages(data.mensajes || [])
        setUnreadUser(0)
      } catch {}
    }

    fetchMensajes()
    const interval = setInterval(fetchMensajes, 2000)
    return () => clearInterval(interval)
  }, [open, user?.id])

  // Polling del badge de no leídos cuando el chat está cerrado
  useEffect(() => {
    if (open || !user?.id) return

    const fetchUnread = async () => {
      try {
        const data = await chatService.getBadge()
        if (!isMounted.current) return
        setUnreadUser(data.unreadUser || 0)
      } catch {}
    }

    fetchUnread()
    const interval = setInterval(fetchUnread, 5000)
    return () => clearInterval(interval)
  }, [open, user?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const autoResize = (el) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 80) + 'px'
  }

  const handleSend = async () => {
    const text = texto.trim()
    if (!text || enviando) return
    setErrorMsg('')
    setEnviando(true)

    try {
      await chatService.enviarMensaje(text)
      setTexto('')
      if (inputRef.current) { inputRef.current.style.height = 'auto' }
      const data = await chatService.getMiChat()
      if (isMounted.current) {
        setChatData(data.chat)
        setMessages(data.mensajes || [])
      }
    } catch (err) {
      if (isMounted.current) setErrorMsg('No se pudo enviar. Inténtalo de nuevo.')
      console.error(err)
    } finally {
      if (isMounted.current) setEnviando(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (ts) => {
    if (!ts) return ''
    try {
      return new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }

  return (
    <>
      <button
        className="sc-fab"
        onClick={() => setOpen(v => !v)}
        title="Chat de soporte"
        aria-label="Abrir chat de soporte"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {!open && unreadUser > 0 && (
          <span className="sc-fab-badge">{unreadUser}</span>
        )}
      </button>

      {open && (
        <div className="sc-window">
          <div className="sc-header">
            <div className="sc-header-avatar">S</div>
            <div className="sc-header-info">
              <p className="sc-header-title">Soporte AK-MARKET</p>
              <p className="sc-header-sub">
                {chatData?.status === 'closed' ? 'Conversación cerrada' : 'Estamos aquí para ayudarte'}
              </p>
            </div>
            <button className="sc-header-close" onClick={() => setOpen(false)} aria-label="Cerrar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="sc-messages">
            {messages.length === 0 && (
              <div className="sc-welcome">
                <div className="sc-welcome-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p className="sc-welcome-title">¡Hola, {user?.nombre?.split(' ')[0]}!</p>
                <p className="sc-welcome-sub">
                  ¿En qué podemos ayudarte? Escribe tu mensaje y te responderemos lo antes posible.
                </p>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={`sc-msg ${msg.senderRole === 'user' ? 'sc-msg--out' : 'sc-msg--in'}`}>
                {msg.senderRole !== 'user' && <div className="sc-msg-avatar">S</div>}
                <div className="sc-msg-bubble">
                  <p>{msg.text}</p>
                  <span className="sc-msg-time">{formatTime(msg.createdAt)}</span>
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {chatData?.status === 'closed' && (
            <div className="sc-closed-bar">Conversación cerrada. Escribe para reabrir.</div>
          )}

          {errorMsg && <div className="sc-error-bar">{errorMsg}</div>}

          <div className="sc-input-area">
            <textarea
              ref={inputRef}
              className="sc-input"
              placeholder="Escribe tu mensaje..."
              value={texto}
              onChange={e => { setTexto(e.target.value); autoResize(e.target) }}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={enviando}
            />
            <button
              className="sc-send-btn"
              onClick={handleSend}
              disabled={enviando || !texto.trim()}
              aria-label="Enviar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}

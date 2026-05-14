import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Navbar from '../components/Navbar'
import { authService } from '../services/auth'
import './Inicio.css'

gsap.registerPlugin(ScrollTrigger)

export default function Inicio() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (!authService.estaLogueado()) return
    try {
      const token   = localStorage.getItem('token')
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      setUser({ nombre: payload.nombre, email: payload.email, rol: payload.rol })
    } catch (_) {}
    authService.me()
      .then(data => { if (data?.usuario) setUser(data.usuario) })
      .catch(() => {})
  }, [])

  const [typedWord, setTypedWord] = useState('')
  const WORD = 'en tus manos'

  useEffect(() => {
    let timeout = null
    let interval = null

    const startTyping = () => {
      let i = 0
      interval = setInterval(() => {
        i++
        setTypedWord(WORD.slice(0, i))
        if (i === WORD.length) {
          clearInterval(interval)
          // Espera 7s, borra al instante y vuelve a escribir
          timeout = setTimeout(() => {
            setTypedWord('')
            timeout = setTimeout(startTyping, 300)
          }, 7000)
        }
      }, 180)
    }

    timeout = setTimeout(startTyping, 1300)

    return () => { clearTimeout(timeout); clearInterval(interval) }
  }, [])

  const video1ContainerRef = useRef(null)
  const video1Ref          = useRef(null)
  const video1TextRef      = useRef(null)
  const scrollHintRef      = useRef(null)

  const statsRef = useRef(null)

  const video2ContainerRef = useRef(null)
  const video2Ref          = useRef(null)
  const video2TextRef      = useRef(null)

  const ctaRef = useRef(null)

  // ── Smooth video scrubbing via RAF lerp ──────────────────────────
  useEffect(() => {
    const cleanups = []

    function setupScrub(containerRef, videoRef) {
      const video     = videoRef.current
      const container = containerRef.current
      if (!video || !container) return

      video.pause()
      let targetTime = 0
      let rafId      = null

      const tick = () => {
        if (video.readyState >= 2 && video.duration) {
          const diff = targetTime - video.currentTime
          if (Math.abs(diff) > 0.001) video.currentTime += diff * 0.45
        }
        rafId = requestAnimationFrame(tick)
      }

      const st = ScrollTrigger.create({
        trigger: container,
        start:   'top top',
        end:     '+=250%',
        pin:     true,
        scrub:   true,
        onUpdate(self) {
          if (video.duration) targetTime = self.progress * video.duration
        },
      })

      rafId = requestAnimationFrame(tick)
      cleanups.push(() => { cancelAnimationFrame(rafId); st.kill() })
    }

    setupScrub(video1ContainerRef, video1Ref)
    setupScrub(video2ContainerRef, video2Ref)

    return () => cleanups.forEach(fn => fn())
  }, [])

  // ── Animaciones ───────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {

      // ── Entrada del texto del vídeo 1 (hero) ──────────────────────
      const tl = gsap.timeline({ delay: 0.3 })
      tl.from(video1TextRef.current.querySelectorAll('.v1-animate'), {
        y: 40, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out',
      })
      .from(scrollHintRef.current, { opacity: 0, duration: 0.5 }, '-=0.1')

      // ── Stats counters ─────────────────────────────────────────────
      statsRef.current.querySelectorAll('.stat-number').forEach((el) => {
        const target = parseInt(el.dataset.target, 10)
        const proxy  = { val: 0 }
        gsap.to(proxy, {
          scrollTrigger: {
            trigger: statsRef.current,
            start:   'top 75%',
            toggleActions: 'play none none reverse',
          },
          val: target,
          duration: 1.8,
          ease: 'power3.out',
          onUpdate() { el.innerText = Math.round(proxy.val).toLocaleString('es-ES') },
        })
      })

      gsap.from(statsRef.current.querySelectorAll('.stat-card'), {
        scrollTrigger: {
          trigger: statsRef.current,
          start:   'top 80%',
          toggleActions: 'play none none reverse',
        },
        y: 60, opacity: 0, duration: 0.7, stagger: 0.15, ease: 'power2.out',
      })

      // ── Texto vídeo 2 ──────────────────────────────────────────────
      gsap.from(video2TextRef.current, {
        scrollTrigger: {
          trigger: video2ContainerRef.current,
          start: 'top 80%',
          end:   'top 30%',
          scrub: 1,
        },
        x: 80, opacity: 0,
      })

      // ── CTA ────────────────────────────────────────────────────────
      gsap.from(ctaRef.current.querySelectorAll('.cta-inner > *'), {
        scrollTrigger: {
          trigger: ctaRef.current,
          start:   'top 75%',
          toggleActions: 'play none none reverse',
        },
        y: 50, opacity: 0, duration: 0.7, stagger: 0.15, ease: 'power2.out',
      })
    })

    return () => ctx.revert()
  }, [])

  return (
    <div className="inicio-page">
      <Navbar user={user} activePage="inicio" onLogout={() => setUser(null)} />

      {/* ── VIDEO 1 – HERO ───────────────────────────────────────────── */}
      <section className="video-section" ref={video1ContainerRef}>
        <div className="video-wrapper">
          <video
            ref={video1Ref}
            className="scrub-video"
            src="/videos/arma_scrub.mp4"
            muted
            playsInline
            preload="auto"
          />
        </div>

        <div className="video-text video-text--left" ref={video1TextRef}>
          <span className="video-brand v1-animate">AK-MARKET</span>
          <span className="video-text-label v1-animate">Precisión total</span>
          <h2 className="v1-animate">
            Armamento de <span className="h2-line2">élite <span className="typewriter-word">
              {typedWord}<span className="typewriter-cursor">|</span>
            </span></span>
          </h2>
          <p className="v1-animate">
            Réplicas de alta gama con la misma sensación que el armamento real.
            Certificadas y listas para combate.
          </p>
          <button
            className="btn-primary v1-animate"
            onClick={() => navigate('/register')}
          >
            Únete a nosotros
          </button>
        </div>

        <div className="hero-scroll-hint" ref={scrollHintRef}>
          <span>Scroll</span>
          <div className="scroll-line" />
        </div>
      </section>

      {/* ── VIDEO 2 – Jugadores en partida ──────────────────────────── */}
      <section className="video-section" ref={video2ContainerRef}>
        <div className="video-wrapper">
          <video
            ref={video2Ref}
            className="scrub-video"
            src="/videos/partida_scrub.mp4"
            muted
            playsInline
            preload="auto"
          />
        </div>
        <div className="video-fade-bottom" />

        <div className="video-text video-text--right" ref={video2TextRef}>
          <span className="video-text-label">Comunidad activa</span>
          <h2>Juega, compite<br />y gana</h2>
          <p>Más de 15.000 jugadores confían en AK-Market para sus partidas. ¿Te unes a la élite?</p>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────── */}
      <section className="inicio-stats" ref={statsRef}>
        <div className="stats-heading">
          <span>AK-Market en números</span>
          <h3>La armería de referencia en España</h3>
        </div>
        <div className="stats-grid">
          {[
            { number: 12,    suffix: '+', label: 'Años de experiencia'   },
            { number: 4800,  suffix: '+', label: 'Productos en catálogo' },
            { number: 32000, suffix: '+', label: 'Clientes satisfechos'  },
            { number: 99,    suffix: '%', label: 'Valoraciones positivas'},
          ].map(({ number, suffix, label }) => (
            <div className="stat-card" key={label}>
              <div className="stat-value-row">
                <span className="stat-number" data-target={number}>0</span>
                <span className="stat-suffix">{suffix}</span>
              </div>
              <div className="stat-bar" />
              <p className="stat-label">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────── */}
      <section className="inicio-cta" ref={ctaRef}>
        <div className="cta-inner">
          <span className="cta-label">Empieza hoy</span>
          <h2>¿Listo para el<br />siguiente nivel?</h2>
          <p>Descubre todo nuestro equipo, vende tu material usado y conecta con la mayor comunidad airsoft de España.</p>
          <div className="cta-buttons">
            <button className="btn-primary btn-lg" onClick={() => navigate('/catalogo')}>
              Explorar catálogo
            </button>
            <button className="btn-ghost btn-lg" onClick={() => navigate('/register')}>
              Crear cuenta gratis
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

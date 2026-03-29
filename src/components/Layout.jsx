import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Home, PlusCircle, Clock, BarChart2, Heart } from 'lucide-react'
import './Layout.css'

const NAV = [
  { to: '/', icon: Home, label: 'Inicio' },
  { to: '/add', icon: PlusCircle, label: 'Añadir' },
  { to: '/history', icon: Clock, label: 'Historial' },
  { to: '/dashboard', icon: BarChart2, label: 'Dashboard' },
]

export default function Layout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-heart">💛</span>
          <div>
            <div className="logo-title">El Precio</div>
            <div className="logo-subtitle">del Amor</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-avatars">
          <div className="avatar-pair">
            <div className="avatar capa-avatar" title="Capa">🦦</div>
            <div className="avatar pau-avatar" title="Pau">🦒</div>
          </div>
          <div className="avatar-names">
            <span style={{ color: 'var(--capa)' }}>Capa</span>
            <span style={{ color: 'var(--text-muted)' }}>&</span>
            <span style={{ color: 'var(--pau)' }}>Pau</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

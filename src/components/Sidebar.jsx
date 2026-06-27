import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CheckSquare, Store, Moon, Sun, Menu, X, PiggyBank, Gift, Heart } from 'lucide-react';

const Sidebar = () => {
  const [isDark, setIsDark] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check local storage or system preference
    const savedMode = localStorage.getItem('theme');
    if (savedMode === 'dark' || (!savedMode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDark(!isDark);
  };

  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/vendors', icon: <Store size={20} />, label: 'Vendor & Budget' },
    { path: '/seserahan', icon: <Gift size={20} />, label: 'Seserahan' },
    { path: '/tabungan', icon: <PiggyBank size={20} />, label: 'Buku Tabungan' },
    { path: '/todo', icon: <CheckSquare size={20} />, label: 'Planning Timeline' },
    { path: '/guests', icon: <Users size={20} />, label: 'Tamu Undangan' },
  ];

  return (
    <>
      <div className="mobile-header">
        <h1 style={{ 
          fontSize: '1.25rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          background: 'var(--color-primary-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.03em'
        }}>
          Ari <Heart size={20} fill="#ef4444" color="#ef4444" style={{WebkitTextFillColor: 'initial'}} /> Bila
        </h1>
        <button className="btn-icon" onClick={toggleDarkMode}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <aside 
        className="sidebar"
        style={{
          width: '250px',
          backgroundColor: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all var(--transition-fast)',
          height: '100vh',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}
      >
        <div className="sidebar-header" style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <h1 style={{ 
            fontSize: '1.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            background: 'var(--color-primary-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.03em'
          }}>
            Ari <Heart size={20} fill="#ef4444" color="#ef4444" style={{WebkitTextFillColor: 'initial'}} /> Bila
          </h1>
          <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Bismillah Wedding Planner Ari & Bila</p>
        </div>

        <nav className="sidebar-nav" style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-main)',
                backgroundColor: isActive ? 'rgba(20, 184, 166, 0.1)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                textDecoration: 'none'
              })}
            >
              {item.icon}
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer" style={{ padding: '1.5rem 1rem', borderTop: '1px solid var(--color-border)' }}>
          <button 
            className="btn btn-outline w-full justify-between" 
            onClick={toggleDarkMode}
          >
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .sidebar {
            position: fixed !important;
            bottom: 0 !important;
            top: auto !important;
            left: 0;
            right: 0;
            width: 100% !important;
            height: auto !important;
            flex-direction: row !important;
            border-right: none !important;
            border-top: 1px solid var(--color-border);
            padding: 0 !important;
            box-shadow: 0 -4px 6px -1px rgba(0,0,0,0.05);
          }
          .sidebar-header, .sidebar-footer {
            display: none !important;
          }
          .sidebar-nav {
            flex-direction: row !important;
            padding: 0.5rem !important;
            justify-content: space-around;
            align-items: center;
            width: 100%;
            gap: 0 !important;
          }
          .nav-link {
            flex-direction: column !important;
            gap: 0.25rem !important;
            padding: 0.5rem !important;
            text-align: center;
            flex: 1;
          }
          .nav-label {
            font-size: 0.65rem !important;
            line-height: 1;
            white-space: nowrap;
          }
          .mobile-header {
            display: flex !important;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.5rem;
            background-color: var(--color-surface);
            border-bottom: 1px solid var(--color-border);
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 40;
            box-shadow: var(--shadow-sm);
          }
        }
        .mobile-header {
          display: none;
        }
        .nav-link:hover {
          background-color: rgba(20, 184, 166, 0.05) !important;
        }
      `}</style>
    </>
  );
};

export default Sidebar;

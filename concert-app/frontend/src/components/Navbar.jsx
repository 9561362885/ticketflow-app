import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const { pathname } = useLocation();
  const links = [
    { to: '/',          label: 'Events' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/admin',     label: 'Admin' },
  ];

  return (
    <nav className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="nav-logo">🎵 TicketFlow</Link>
        <div className="nav-links">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`nav-link${pathname === l.to ? ' active' : ''}`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

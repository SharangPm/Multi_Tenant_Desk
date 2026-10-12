import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../redux/store';
import {
  LayoutDashboard,
  Ticket,
  Users,
  ChartNoAxesCombined,
  Settings,
  LifeBuoy,
  LogOut,
  Menu,
  Plus,
} from 'lucide-react';
const links = [
  ['Dashboard', '/dashboard', LayoutDashboard],
  ['Tickets', '/tickets', Ticket],
  ['Customers', '/customers', Users],
  ['Team', '/team', Users],
  ['Reports', '/reports', ChartNoAxesCombined],
  ['Settings', '/settings', Settings],
];
export default function AppLayout() {
  const [open, setOpen] = useState(true);
  const user = useSelector((s) => s.session.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const visibleLinks =
    user?.role === 'Customer' ? [['My requests', '/portal', Ticket]] : links;
  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? '' : 'collapsed'}`}>
        <div className="brand">
          <span className="brand-icon">
            <LifeBuoy size={21} />
          </span>
          {open && (
            <span>
              resolve<span className="brand-accent">desk</span>
            </span>
          )}
        </div>
        <div className="workspace">
          {open && (
            <>
              <small>WORKSPACE</small>
              <div className="workspace-name">
                <i />
                Acme Support
              </div>
            </>
          )}
        </div>
        <nav>
          {visibleLinks.map(([label, to, Icon]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
            >
              <Icon size={18} />
              {open && label}
            </NavLink>
          ))}
        </nav>
        <button
          className="create-shortcut"
          onClick={() => navigate('/tickets?new=1')}
        >
          <Plus size={17} />
          {open && 'Create ticket'}
        </button>
        <div className="sidebar-bottom">
          <button
            className="nav-link"
            onClick={() => {
              dispatch(setUser(null));
              localStorage.removeItem('accessToken');
              navigate('/login');
            }}
          >
            <LogOut size={18} />
            {open ? 'Sign out' : ''}
          </button>
          <div className="profile">
            <div className="avatar">{user?.name?.slice(0, 1) || 'A'}</div>
            {open && (
              <div>
                <b>{user?.name || 'Avery Admin'}</b>
                <small>{user?.role || 'Admin'}</small>
              </div>
            )}
          </div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <button className="icon-button" onClick={() => setOpen(!open)}>
            <Menu size={19} />
          </button>
          <div className="crumb">
            Support workspace <span>/</span>{' '}
            <b>{location.pathname.split('/')[1] || 'Dashboard'}</b>
          </div>
          <div className="top-actions">
            <span className="online-dot" />{' '}
            <small>All systems operational</small>
            <div className="avatar">{user?.name?.slice(0, 1) || 'A'}</div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}

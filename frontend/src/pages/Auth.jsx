import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/store';
import { api } from '../services/api';
import { mockUser } from '../data/mock';
import toast from 'react-hot-toast';
import {
  LifeBuoy,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  Headphones,
  User,
  Check,
} from 'lucide-react';
import './auth.css';

const DEMO_ROLES = [
  { role: 'Admin', icon: ShieldCheck },
  { role: 'Agent', icon: Headphones },
  { role: 'Customer', icon: User },
];

export default function Auth({ register = false }) {
  const [form, setForm] = useState({
    organizationName: '',
    name: '',
    email: '',
    password: '',
  });
  const [show, setShow] = useState(false),
    [loading, setLoading] = useState(false);
  const dispatch = useDispatch(),
    navigate = useNavigate();
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (
      !form.email.includes('@') ||
      form.password.length < 8 ||
      (register && (!form.name || !form.organizationName))
    )
      return toast.error(
        'Enter valid details. Password must be at least 8 characters.',
      );
    setLoading(true);
    try {
      const { data } = await api.post(
        register ? '/auth/register' : '/auth/login',
        form,
      );
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      dispatch(setUser(data.user));
      navigate(data.user.role === 'Customer' ? '/portal' : '/dashboard');
      toast.success('Welcome to ResolveDesk');
    } catch (err) {
      if (
        !register &&
        !err.response &&
        form.email === 'admin@acme.demo' &&
        form.password === 'Resolve123!'
      ) {
        dispatch(setUser(mockUser));
        navigate('/dashboard');
        toast('Demo mode: API is offline', { icon: 'ℹ️' });
      } else
        toast.error(
          err.response?.data?.message ||
            'Could not connect. Demo access: admin@acme.demo / Resolve123!',
        );
    } finally {
      setLoading(false);
    }
  }

  function demoLogin(role) {
    if (role === 'Customer') {
      dispatch(
        setUser({
          ...mockUser,
          role: 'Customer',
          name: 'Sam Rivera',
        }),
      );
      navigate('/portal');
    } else {
      dispatch(
        setUser({
          ...mockUser,
          role,
          name: role === 'Admin' ? 'Avery Admin' : 'Taylor Morgan',
        }),
      );
      navigate('/dashboard');
    }
    toast('Demo mode: API is offline', { icon: 'ℹ️' });
  }

  return (
    <div className="rd-auth">
      {/* ================= Brand panel ================= */}
      <aside className="rd-aside" aria-hidden="true">
        <div className="rd-brand rd-brand-light">
          <span className="rd-logo">
            <LifeBuoy />
          </span>
          <b>
            resolve<span className="rd-accent">desk</span>
          </b>
        </div>

        <div className="rd-aside-main">
          <h2>Every customer question, answered and closed.</h2>
          <p className="rd-aside-copy">
            One calm workspace for tickets, teammates and customers, so
            nothing slips through.
          </p>

          <div className="rd-ticket-wrap">
            <div className="rd-ticket">
              <div className="rd-ticket-head">
                <span className="rd-avatar">SR</span>
                <div className="rd-ticket-who">
                  <strong>Sam Rivera</strong>
                  <small>#2841 · Billing</small>
                </div>
                <div className="rd-status">
                  <span className="rd-chip rd-chip-open">Open</span>
                  <span className="rd-chip rd-chip-done">
                    <CheckCircle2 size={13} /> Resolved
                  </span>
                </div>
              </div>
              <p className="rd-bubble rd-bubble-in">
                Hi, my refund still hasn't arrived after 7 days.
              </p>
              <p className="rd-bubble rd-bubble-out">
                Found it. The refund was released today and will land in 1 to
                2 business days.
              </p>
            </div>
          </div>
        </div>

        <ul className="rd-points">
          <li>
            <Check size={15} /> Role-based access for admins, agents and
            customers
          </li>
          <li>
            <Check size={15} /> A customer portal to track every request
          </li>
        </ul>
      </aside>

      {/* ================= Form panel ================= */}
      <main className="rd-main">
        <header className="rd-topbar">
          <div className="rd-brand rd-brand-dark">
            <span className="rd-logo">
              <LifeBuoy />
            </span>
            <b>
              resolve<span className="rd-accent">desk</span>
            </b>
          </div>
          <p className="rd-switch">
            {register ? 'Already have an account?' : 'New to ResolveDesk?'}{' '}
            <Link to={register ? '/login' : '/register'}>
              {register ? 'Sign in' : 'Create a workspace'}
            </Link>
          </p>
        </header>

        <section className="rd-card">
          <h1>{register ? 'Create your workspace' : 'Welcome back'}</h1>
          <p className="rd-sub">
            {register
              ? 'Get your support team up and running.'
              : 'Sign in to your support workspace.'}
          </p>

          <form onSubmit={submit} className="rd-form">
            {register && (
              <>
                <label className="rd-field">
                  <span>Organization name</span>
                  <input
                    name="organizationName"
                    required
                    placeholder="Acme Support"
                    value={form.organizationName}
                    onChange={change}
                  />
                </label>
                <label className="rd-field">
                  <span>Your name</span>
                  <input
                    name="name"
                    required
                    placeholder="Alex Morgan"
                    value={form.name}
                    onChange={change}
                  />
                </label>
              </>
            )}
            <label className="rd-field">
              <span>Email address</span>
              <input
                type="email"
                name="email"
                required
                placeholder="you@company.com"
                value={form.email}
                onChange={change}
              />
            </label>
            <label className="rd-field">
              <span>Password</span>
              <div className="rd-password">
                <input
                  type={show ? 'text' : 'password'}
                  name="password"
                  minLength="8"
                  required
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={change}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {!register && (
              <div className="rd-row">
                <label className="rd-check">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <a className="rd-link">Forgot password?</a>
              </div>
            )}

            <button className="rd-submit" disabled={loading}>
              {loading && <span className="rd-spinner" aria-hidden="true" />}
              {loading
                ? 'Please wait…'
                : register
                  ? 'Create account'
                  : 'Sign in'}
            </button>
          </form>

          {!register && (
            <>
              <div className="rd-divider">
                <span>Quick demo access</span>
              </div>
              <div className="rd-demo">
                {DEMO_ROLES.map(({ role, icon: Icon }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => demoLogin(role)}
                  >
                    <Icon size={16} />
                    {role}
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        <footer className="rd-note">
          A calmer way to support your customers.
        </footer>
      </main>
    </div>
  );
}
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/store';
import { api } from '../services/api';
import { mockUser } from '../data/mock';
import toast from 'react-hot-toast';
import { LifeBuoy, Eye, EyeOff } from 'lucide-react';
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
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-icon">
            <LifeBuoy />
          </span>
          <b>
            resolve<span className="brand-accent">desk</span>
          </b>
        </div>
        <h1>{register ? 'Create your workspace' : 'Welcome back'}</h1>
        <p>
          {register
            ? 'Get your support team up and running.'
            : 'Sign in to your support workspace.'}
        </p>
        <form onSubmit={submit}>
          {register && (
            <>
              <label>
                Organization name
                <input
                  name="organizationName"
                  required
                  placeholder="Acme Support"
                  value={form.organizationName}
                  onChange={change}
                />
              </label>
              <label>
                Your name
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
          <label>
            Email address
            <input
              type="email"
              name="email"
              required
              placeholder="you@company.com"
              value={form.email}
              onChange={change}
            />
          </label>
          <label>
            Password
            <div className="password-field">
              <input
                type={show ? 'text' : 'password'}
                name="password"
                minLength="8"
                required
                placeholder="At least 8 characters"
                value={form.password}
                onChange={change}
              />
              <button type="button" onClick={() => setShow(!show)}>
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>
          {!register && (
            <div className="remember">
              <label className="check">
                <input type="checkbox" /> Remember me
              </label>
              <a>Forgot password?</a>
            </div>
          )}
          <button className="primary-button full" disabled={loading}>
            {loading ? 'Please wait…' : register ? 'Create account' : 'Sign in'}
          </button>
        </form>
        {!register && (
          <>
            <div className="divider">
              <span>QUICK DEMO ACCESS</span>
            </div>
            <div className="demo-row">
              {['Admin', 'Agent', 'Customer'].map((role) => (
                <button
                  key={role}
                  onClick={() => {
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
                          name:
                            role === 'Admin' ? 'Avery Admin' : 'Taylor Morgan',
                        }),
                      );
                      navigate('/dashboard');
                    }
                    toast('Demo mode: API is offline', { icon: 'ℹ️' });
                  }}
                >
                  {role}
                </button>
              ))}
            </div>
          </>
        )}
        <div className="auth-foot">
          {register ? 'Already have an account?' : 'New to ResolveDesk?'}{' '}
          <Link to={register ? '/login' : '/register'}>
            {register ? 'Sign in' : 'Create a workspace'}
          </Link>
        </div>
      </div>
      <div className="auth-note">A calmer way to support your customers.</div>
    </div>
  );
}

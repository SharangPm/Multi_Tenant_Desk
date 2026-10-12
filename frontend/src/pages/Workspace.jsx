import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { mockCustomerTickets } from '../data/mock';
import StatusBadge from '../components/StatusBadge';
import {
  Plus,
  Search,
  Download,
  Users,
  Clock3,
  ChartNoAxesCombined,
  Settings as SettingsIcon,
  UserRound,
  Save,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
function useRows(endpoint, fallback = []) {
  const [rows, setRows] = useState(fallback),
    [offline, setOffline] = useState(false);
  const requestVersion = useRef(0);
  useEffect(() => {
    const version = ++requestVersion.current;
    let mounted = true;
    api
      .get(endpoint)
      .then((r) => {
        if (!mounted || version !== requestVersion.current) return;
        setRows(Array.isArray(r.data) ? r.data : r.data.items || []);
        setOffline(false);
      })
      .catch(() => {
        if (mounted && version === requestVersion.current) setOffline(true);
      });
    return () => {
      mounted = false;
    };
  }, [endpoint]);

  function appendRow(row) {
    const normalizedRow = { ...row, _id: row._id || row.id };
    if (!normalizedRow._id) return;
    requestVersion.current += 1;
    setRows((current) => [
      normalizedRow,
      ...current.filter((item) => item._id !== normalizedRow._id),
    ]);
    setOffline(false);
  }

  function updateRow(row) {
    const normalizedRow = { ...row, _id: row._id || row.id };
    if (!normalizedRow._id) return;
    requestVersion.current += 1;
    setRows((current) => {
      const exists = current.some((item) => item._id === normalizedRow._id);
      return exists
        ? current.map((item) =>
            item._id === normalizedRow._id
              ? { ...item, ...normalizedRow }
              : item,
          )
        : [normalizedRow, ...current];
    });
    setOffline(false);
  }

  return [rows, offline, appendRow, updateRow];
}
export function Customers() {
  const [rows, offline, appendRow] = useRows('/customers', []),
    [q, setQ] = useState(''),
    [modal, setModal] = useState(false),
    [saving, setSaving] = useState(false),
    [name, setName] = useState(''),
    [email, setEmail] = useState('');
  const filtered = rows.filter(
    (x) =>
      x.name?.toLowerCase().includes(q.toLowerCase()) || x.email?.includes(q),
  );
  async function add(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const { data } = await api.post('/customers', {
        name,
        email,
        password: 'TempPass123!',
      });
      appendRow({
        ...data,
        createdAt: data.createdAt || new Date().toISOString(),
      });
      toast.success('Customer added');
      setModal(false);
      setName('');
      setEmail('');
    } catch {
      toast.error(
        offline
          ? 'API unavailable; customer data is not mocked.'
          : 'Could not add customer',
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">RELATIONSHIPS</div>
          <h1>Customers</h1>
          <p>Keep customer details and support history in one place.</p>
        </div>
        <button className="primary-button" onClick={() => setModal(true)}>
          <Plus size={17} /> Add customer
        </button>
      </div>
      {offline && (
        <div className="demo-banner">
          Customer directory unavailable while the API is offline.
        </div>
      )}
      <div className="panel">
        <div className="ticket-toolbar">
          <div className="search-field">
            <Search size={17} />
            <input
              placeholder="Search customers…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>CUSTOMER</th>
                <th>EMAIL</th>
                <th>COMPANY</th>
                <th>STATUS</th>
                <th>JOINED</th>
                <th>TICKETS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c._id}>
                  <td>
                    <span className="table-person">
                      <i>{c.name?.[0]}</i>
                      <b>{c.name}</b>
                    </span>
                  </td>
                  <td>{c.email}</td>
                  <td>—</td>
                  <td>
                    <span className="availability available">Active</span>
                  </td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td>View history</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <div className="empty-state">
              <Users size={30} />
              <h3>No customers to show</h3>
              <p>
                Add a customer or check back once your workspace has activity.
              </p>
            </div>
          )}
        </div>
      </div>
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <form
            className="modal-card"
            onSubmit={add}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Add customer</h2>
            <label>
              Name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setModal(false)}
              >
                Cancel
              </button>
              <button className="primary-button" disabled={saving}>
                {saving ? 'Adding…' : 'Add customer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
export function Team() {
  const [rows, offline, appendRow, updateRow] = useRows('/team', []),
    [modal, setModal] = useState(false),
    [saving, setSaving] = useState(false),
    [updatingIds, setUpdatingIds] = useState(() => new Set()),
    [name, setName] = useState(''),
    [email, setEmail] = useState('');
  async function add(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const { data } = await api.post('/team', {
        name,
        email,
        role: 'Agent',
      });
      appendRow({
        ...data,
        availability: data.availability || 'Available',
        createdAt: data.createdAt || new Date().toISOString(),
      });
      toast.success('Invitation created');
      setModal(false);
      setName('');
      setEmail('');
    } catch {
      toast.error(
        offline
          ? 'API unavailable; invite not sent.'
          : 'Could not invite teammate',
      );
    } finally {
      setSaving(false);
    }
  }
  async function active(u) {
    if (updatingIds.has(u._id)) return;
    setUpdatingIds((current) => new Set(current).add(u._id));
    try {
      const { data } = await api.patch(`/team/${u._id}`, {
        active: !u.active,
      });
      updateRow(data);
      toast.success('Team member updated');
    } catch {
      toast.error('Could not update team member');
    } finally {
      setUpdatingIds((current) => {
        const next = new Set(current);
        next.delete(u._id);
        return next;
      });
    }
  }
  return (
    <section className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR PEOPLE</div>
          <h1>Team</h1>
          <p>Manage your support crew and keep an eye on workload.</p>
        </div>
        <button className="primary-button" onClick={() => setModal(true)}>
          <Plus size={17} /> Invite teammate
        </button>
      </div>
      {offline && (
        <div className="demo-banner">
          Team data unavailable while the API is offline.
        </div>
      )}
      <div className="metric-grid three">
        <div className="metric-card">
          <div className="metric-top">
            Team members
            <i className="metric-icon blue">
              <Users size={17} />
            </i>
          </div>
          <div className="metric-value">{rows.length}</div>
          <div className="metric-foot">Across all roles</div>
        </div>
        <div className="metric-card">
          <div className="metric-top">
            Available now
            <i className="metric-icon green">
              <UserRound size={17} />
            </i>
          </div>
          <div className="metric-value">
            {rows.filter((x) => x.availability === 'Available').length}
          </div>
          <div className="metric-foot">Ready to help</div>
        </div>
        <div className="metric-card">
          <div className="metric-top">
            Avg. resolution
            <i className="metric-icon violet">
              <Clock3 size={17} />
            </i>
          </div>
          <div className="metric-value">3.2h</div>
          <div className="metric-foot">Across your team</div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-heading pad">
          <div>
            <h3>Team members</h3>
            <p>People with access to your workspace</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>MEMBER</th>
                <th>ROLE</th>
                <th>AVAILABILITY</th>
                <th>STATUS</th>
                <th>JOINED</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((u, i) => (
                <tr key={u._id}>
                  <td>
                    <span className="table-person">
                      <i>{u.name?.[0]}</i>
                      <b>{u.name}</b>
                    </span>
                  </td>
                  <td>{u.role}</td>
                  <td>
                    <span
                      className={`availability ${u.availability === 'Away' ? 'away' : 'available'}`}
                    >
                      {u.availability || 'Available'}
                    </span>
                  </td>
                  <td>{u.active === false ? 'Inactive' : 'Active'}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="secondary-button small"
                      disabled={updatingIds.has(u._id)}
                      onClick={() => active(u)}
                    >
                      {u.active === false ? 'Activate' : 'Deactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <div className="empty-state">
              <Users size={30} />
              <h3>Your team is just getting started</h3>
              <p>Invite an agent to share the support queue.</p>
            </div>
          )}
        </div>
      </div>
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <form
            className="modal-card"
            onSubmit={add}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Invite teammate</h2>
            <p>They’ll receive a temporary password to access the workspace.</p>
            <label>
              Name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Email
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setModal(false)}
              >
                Cancel
              </button>
              <button className="primary-button" disabled={saving}>
                {saving ? 'Creating…' : 'Create invite'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
export function Reports() {
  const [data, setData] = useState(null),
    [offline, setOffline] = useState(false);
  useEffect(() => {
    api
      .get('/analytics')
      .then((r) => setData(r.data))
      .catch(() => setOffline(true));
  }, []);
  const rows = data?.byAgent || [];
  function csv() {
    if (!data) return toast.error('Reports need an API connection to export');
    const text =
      'Agent,Resolved tickets\n' +
      rows.map((x) => `${x.name},${x.count}`).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
    a.download = 'resolvedesk-report.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }
  return (
    <section className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">INSIGHTS</div>
          <h1>Reports</h1>
          <p>Understand volume, resolution trends, and team performance.</p>
        </div>
        <div className="heading-actions">
          <select className="select-control">
            <option>Last 30 days</option>
            <option>Last 7 days</option>
          </select>
          <button className="secondary-button" onClick={csv}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>
      {offline && (
        <div className="demo-banner">
          Reports are unavailable while the API is offline.
        </div>
      )}
      <div className="metric-grid four">
        <div className="metric-card">
          <div className="metric-top">
            Total tickets
            <i className="metric-icon blue">
              <ChartNoAxesCombined size={17} />
            </i>
          </div>
          <div className="metric-value">{data?.total ?? '—'}</div>
          <div className="metric-foot">Selected period</div>
        </div>
        <div className="metric-card">
          <div className="metric-top">
            Resolution rate
            <i className="metric-icon green">
              <ChartNoAxesCombined size={17} />
            </i>
          </div>
          <div className="metric-value">
            {data?.total
              ? `${Math.round(((data.byStatus.find((x) => x._id === 'Resolved')?.count || 0) / data.total) * 100)}%`
              : '—'}
          </div>
          <div className="metric-foot">Resolved tickets</div>
        </div>
        <div className="metric-card">
          <div className="metric-top">
            Avg. resolution
            <i className="metric-icon violet">
              <Clock3 size={17} />
            </i>
          </div>
          <div className="metric-value">—</div>
          <div className="metric-foot">No resolution time data</div>
        </div>
        <div className="metric-card">
          <div className="metric-top">
            SLA breaches
            <i className="metric-icon red">
              <Clock3 size={17} />
            </i>
          </div>
          <div className="metric-value">—</div>
          <div className="metric-foot">No SLA event data</div>
        </div>
      </div>
      <div className="chart-grid">
        <div className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h3>Ticket volume trend</h3>
              <p>Ticket count over the reporting period</p>
            </div>
          </div>
          <div className="chart">
            <ResponsiveContainer>
              <AreaChart
                data={(data?.byStatus || []).map((x) => ({
                  day: x._id,
                  value: x.count,
                }))}
              >
                <CartesianGrid vertical={false} stroke="#eff1f6" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area dataKey="value" stroke="#7766ed" fill="#edeaff" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel">
          <div className="panel-heading pad">
            <div>
              <h3>Agent performance</h3>
              <p>Assigned ticket counts</p>
            </div>
          </div>
          {rows.map((r, i) => (
            <div className="agent-row" key={r.name}>
              <div className={`avatar av${i}`}>{r.name?.[0]}</div>
              <div className="agent-name">
                <b>{r.name}</b>
                <small>Tickets assigned</small>
              </div>
              <strong>{r.count}</strong>
            </div>
          ))}
          {!rows.length && (
            <div className="empty-state">
              <p>Agent metrics will appear after tickets are assigned.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
export function Settings() {
  const [profile, setProfile] = useState({
      name: '',
      sla: 24,
      categories: 'General, Billing, Technical',
    }),
    [offline, setOffline] = useState(false);
  useEffect(() => {
    api
      .get('/settings')
      .then((r) =>
        setProfile((p) => ({
          ...p,
          ...r.data,
          categories: r.data.categories?.join(', '),
        })),
      )
      .catch(() => setOffline(true));
  }, []);
  async function save(e) {
    e.preventDefault();
    try {
      await api.patch('/settings', {
        name: profile.name,
        sla: Number(profile.sla),
        categories: profile.categories.split(',').map((x) => x.trim()),
      });
      toast.success('Settings saved');
    } catch {
      try {
        await api.patch('/profile', { name: profile.name });
        toast.success('Profile updated');
      } catch {
        toast.error(
          offline
            ? 'Settings unavailable while API is offline'
            : 'Could not save settings',
        );
      }
    }
  }
  return (
    <section className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">PREFERENCES</div>
          <h1>Settings</h1>
          <p>Manage your organization, support workflows, and profile.</p>
        </div>
      </div>
      {offline && (
        <div className="demo-banner">
          Settings are unavailable while the API is offline.
        </div>
      )}
      <form onSubmit={save}>
        <div className="panel settings-panel">
          <div className="settings-title">
            <span className="metric-icon blue">
              <SettingsIcon size={18} />
            </span>
            <div>
              <h3>Organization profile</h3>
              <p>Basic details for your workspace.</p>
            </div>
          </div>
          <label>
            Organization name
            <input
              value={profile.name || ''}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Organization name"
            />
          </label>
          <label>
            Support categories
            <input
              value={profile.categories || ''}
              onChange={(e) =>
                setProfile({ ...profile, categories: e.target.value })
              }
            />
            <small>Separate categories with commas.</small>
          </label>
          <label>
            SLA target (hours)
            <input
              type="number"
              min="1"
              value={profile.sla || 24}
              onChange={(e) => setProfile({ ...profile, sla: e.target.value })}
            />
          </label>
          <div className="settings-title spaced">
            <span className="metric-icon violet">
              <UserRound size={18} />
            </span>
            <div>
              <h3>Profile</h3>
              <p>Update your personal account details.</p>
            </div>
          </div>
          <label>
            Display name
            <input
              value={profile.name || ''}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </label>
          <div className="settings-title spaced">
            <span className="metric-icon green">
              <Save size={18} />
            </span>
            <div>
              <h3>Notifications</h3>
              <p>Choose how you hear about updates.</p>
            </div>
          </div>
          <label className="toggle-line">
            Email ticket notifications <input type="checkbox" defaultChecked />
          </label>
          <div className="modal-actions">
            <button className="primary-button">
              <Save size={16} /> Save changes
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
export function Portal() {
  const [rows, offline] = useRows('/tickets', mockCustomerTickets);
  return (
    <section className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">CUSTOMER PORTAL</div>
          <h1>Your requests</h1>
          <p>Follow your support requests and get help from our team.</p>
        </div>
        <Link className="primary-button" to="/tickets?new=1">
          <Plus size={17} /> New request
        </Link>
      </div>
      {offline && (
        <div className="demo-banner">
          Demo data · API is unavailable. Requests are read-only.
        </div>
      )}
      <div className="panel">
        <div className="panel-heading pad">
          <div>
            <h3>My tickets</h3>
            <p>Updates to your support requests</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>TICKET</th>
                <th>SUBJECT</th>
                <th>STATUS</th>
                <th>PRIORITY</th>
                <th>LAST UPDATED</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t, i) => (
                <tr key={t._id}>
                  <td className="ticket-id">#RD-{2048 - i}</td>
                  <td className="subject-cell">{t.subject}</td>
                  <td>
                    <StatusBadge value={t.status} />
                  </td>
                  <td>
                    <span className={`priority ${t.priority?.toLowerCase()}`}>
                      <i />
                      {t.priority}
                    </span>
                  </td>
                  <td>{new Date(t.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

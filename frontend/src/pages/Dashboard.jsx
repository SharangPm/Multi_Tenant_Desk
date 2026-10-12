import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { mockTickets, mockCustomerTickets } from '../data/mock';
import StatusBadge from '../components/StatusBadge';
import {
  ArrowUpRight,
  ArrowDownRight,
  Clock3,
  Ticket,
  CircleCheck,
  AlertTriangle,
  Plus,
  ArrowRight,
  Search,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import { Link } from 'react-router-dom';
const volume = [
  { day: 'Mon', created: 18, resolved: 12 },
  { day: 'Tue', created: 25, resolved: 19 },
  { day: 'Wed', created: 20, resolved: 16 },
  { day: 'Thu', created: 32, resolved: 23 },
  { day: 'Fri', created: 24, resolved: 27 },
  { day: 'Sat', created: 14, resolved: 18 },
  { day: 'Sun', created: 19, resolved: 21 },
];
export default function Dashboard() {
  const [data, setData] = useState(null),
    [offline, setOffline] = useState(false);
  useEffect(() => {
    api
      .get('/dashboard')
      .then((r) => setData(r.data))
      .catch(() => {
        const isCustomer =
          JSON.parse(localStorage.getItem('user') || '{}').role === 'Customer';
        const recent = isCustomer ? mockCustomerTickets : mockTickets;
        setOffline(true);
        setData({
          metrics: {
            total: isCustomer ? recent.length : 248,
            open: isCustomer
              ? recent.filter((ticket) => ticket.status === 'Open').length
              : 38,
            inProgress: isCustomer
              ? recent.filter((ticket) => ticket.status === 'In Progress')
                  .length
              : 54,
            resolved: isCustomer
              ? recent.filter((ticket) => ticket.status === 'Resolved').length
              : 142,
            overdue: isCustomer ? 0 : 6,
          },
          recent,
          agents: isCustomer
            ? []
            : [
                { name: 'Taylor Morgan', availability: 'Available' },
                { name: 'Jamie Lee', availability: 'Available' },
                { name: 'Jordan Patel', availability: 'Away' },
              ],
          activity: [],
        });
      });
  }, []);
  if (!data)
    return (
      <div className="content">
        <div className="skeleton hero" />
        <div className="metric-grid">
          {[1, 2, 3, 4].map((x) => (
            <div className="skeleton" key={x} />
          ))}
        </div>
      </div>
    );
  const m = data.metrics;
  return (
    <section className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">MONDAY, OCTOBER 12, 2026</div>
          <h1>
            Good morning,{' '}
            {JSON.parse(localStorage.getItem('user') || '{}').name?.split(
              ' ',
            )[0] || 'Avery'}{' '}
            <span>✦</span>
          </h1>
          <p>Here’s what’s happening with your support team today.</p>
        </div>
        <div className="heading-actions">
          <select className="select-control">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>This quarter</option>
          </select>
          <Link className="primary-button" to="/tickets?new=1">
            <Plus size={17} /> Create ticket
          </Link>
        </div>
      </div>
      {offline && (
        <div className="demo-banner">
          Demo data · API is currently unavailable. Writes are disabled while
          offline.
        </div>
      )}
      <div className="metric-grid">
        {[
          ['Total tickets', m.total, '+12.8%', Ticket, 'blue'],
          ['Open tickets', m.open, '+4.2%', Clock3, 'amber'],
          ['In progress', m.inProgress, '−2.4%', ArrowUpRight, 'violet'],
          ['Resolved', m.resolved, '+18.6%', CircleCheck, 'green'],
          ['Overdue', m.overdue, '−8.1%', AlertTriangle, 'red'],
        ].map(([label, value, change, Icon, color], i) => (
          <div className="metric-card" key={label}>
            <div className="metric-top">
              <span>{label}</span>
              <i className={`metric-icon ${color}`}>
                <Icon size={17} />
              </i>
            </div>
            <div className="metric-value">{value}</div>
            <div className="metric-foot">
              <span className={i === 1 || i === 4 ? 'trend-bad' : 'trend-good'}>
                {i === 1 || i === 4 ? (
                  <ArrowDownRight size={14} />
                ) : (
                  <ArrowUpRight size={14} />
                )}{' '}
                {change}
              </span>
              <span>vs. last week</span>
            </div>
          </div>
        ))}
      </div>
      <div className="chart-grid">
        <div className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h3>Ticket volume</h3>
              <p>Created vs. resolved over time</p>
            </div>
            <select className="select-control compact">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <div className="chart">
            <ResponsiveContainer>
              <AreaChart data={volume}>
                <defs>
                  <linearGradient id="created" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7766ed" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#7766ed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#eff1f6" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="created"
                  stroke="#7766ed"
                  fill="url(#created)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  stroke="#49b99a"
                  fill="transparent"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="legend">
            <span>
              <i className="lavender-dot" />
              Created
            </span>
            <span>
              <i className="green-dot" />
              Resolved
            </span>
          </div>
        </div>
        <div className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h3>Ticket status</h3>
              <p>Distribution by current status</p>
            </div>
            <button className="icon-button">
              <ArrowUpRight size={17} />
            </button>
          </div>
          <div className="chart">
            <ResponsiveContainer>
              <BarChart
                data={[
                  { name: 'Open', value: m.open },
                  { name: 'Progress', value: m.inProgress },
                  { name: 'Pending', value: 16 },
                  { name: 'Resolved', value: m.resolved },
                ]}
              >
                <CartesianGrid vertical={false} stroke="#eff1f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#7869ec" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="sla-card">
            <span className="sla-icon">
              <Clock3 size={18} />
            </span>
            <div>
              <b>94.2% SLA compliance</b>
              <small>Up 2.4% from last month</small>
            </div>
            <b className="sla-score">94%</b>
          </div>
        </div>
      </div>
      <div className="lower-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Recent tickets</h3>
              <p>Latest updates from your queue</p>
            </div>
            <Link className="text-link" to="/tickets">
              View all <ArrowRight size={15} />
            </Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>TICKET</th>
                  <th>SUBJECT</th>
                  <th>CUSTOMER</th>
                  <th>STATUS</th>
                  <th>PRIORITY</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((t, i) => (
                  <tr key={t._id}>
                    <td className="ticket-id">#{String(t._id).slice(-4)}</td>
                    <td className="subject-cell">{t.subject}</td>
                    <td>{t.customerId?.name || 'Sam Rivera'}</td>
                    <td>
                      <StatusBadge value={t.status} />
                    </td>
                    <td>
                      <span className={`priority ${t.priority?.toLowerCase()}`}>
                        <i />
                        {t.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="panel side-panel">
          <div className="panel-heading">
            <div>
              <h3>Team availability</h3>
              <p>Who’s ready to help</p>
            </div>
            <Link className="text-link" to="/team">
              View team
            </Link>
          </div>
          {data.agents.map((a, i) => (
            <div className="agent-row" key={a.name}>
              <div className={`avatar av${i}`}>
                {a.name
                  .split(' ')
                  .map((x) => x[0])
                  .join('')}
              </div>
              <div className="agent-name">
                <b>{a.name}</b>
                <small>
                  {i === 0 ? '42 tickets resolved' : 'Support agent'}
                </small>
              </div>
              <span
                className={`availability ${a.availability === 'Available' ? 'available' : 'away'}`}
              >
                {a.availability}
              </span>
            </div>
          ))}
          <div className="feed-title">Recent activity</div>
          <div className="activity-line">
            <span className="activity-mark">✓</span>
            <div>
              <b>Ticket resolved</b>
              <small>Jamie resolved #RD-2045 · 12 min ago</small>
            </div>
          </div>
          <div className="activity-line">
            <span className="activity-mark purple">↗</span>
            <div>
              <b>New ticket assigned</b>
              <small>Assigned to Taylor Morgan · 38 min ago</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

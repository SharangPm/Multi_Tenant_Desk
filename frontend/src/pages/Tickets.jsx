import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { mockTickets, mockCustomerTickets } from '../data/mock';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  SlidersHorizontal,
  X,
  Send,
  Paperclip,
  MoreHorizontal,
} from 'lucide-react';
export default function Tickets() {
  const [tickets, setTickets] = useState([]),
    [customers, setCustomers] = useState([]),
    [customerId, setCustomerId] = useState(''),
    [messages, setMessages] = useState([]),
    [search, setSearch] = useState(''),
    [status, setStatus] = useState('All status'),
    [priority, setPriority] = useState('All priorities'),
    [selected, setSelected] = useState(null),
    [subject, setSubject] = useState(''),
    [description, setDescription] = useState(''),
    [ticketPriority, setTicketPriority] = useState('Medium'),
    [category, setCategory] = useState('General'),
    [reply, setReply] = useState(''),
    [modal, setModal] = useState(false),
    [offline, setOffline] = useState(false),
    [params, setParams] = useSearchParams();
  useEffect(() => {
    if (params.get('new')) {
      setModal(true);
      setParams({});
    }
    load();
    if (JSON.parse(localStorage.getItem('user') || '{}').role !== 'Customer') {
      api
        .get('/customers')
        .then(({ data }) => setCustomers(data))
        .catch(() => setCustomers([]));
    }
  }, []);
  async function load() {
    try {
      const { data } = await api.get('/tickets');
      setTickets(data.items);
      setOffline(false);
    } catch {
      const isCustomer =
        JSON.parse(localStorage.getItem('user') || '{}').role === 'Customer';
      setTickets(isCustomer ? mockCustomerTickets : mockTickets);
      setOffline(true);
    }
  }
  const visible = useMemo(
    () =>
      tickets.filter(
        (t) =>
          (!search ||
            `${t.subject} ${t.customerId?.name}`
              .toLowerCase()
              .includes(search.toLowerCase())) &&
          (status === 'All status' || t.status === status) &&
          (priority === 'All priorities' || t.priority === priority),
      ),
    [tickets, search, status, priority],
  );
  async function create(e) {
    e.preventDefault();
    const role = JSON.parse(localStorage.getItem('user') || '{}').role;
    if (role !== 'Customer' && !customerId) {
      toast.error('Choose a customer for this ticket');
      return;
    }
    try {
      await api.post('/tickets', {
        subject,
        description,
        priority: ticketPriority,
        category,
        ...(role === 'Customer' ? {} : { customerId }),
      });
      toast.success('Ticket created');
      setModal(false);
      setSubject('');
      setDescription('');
      setCustomerId('');
      setTicketPriority('Medium');
      setCategory('General');
      load();
    } catch (err) {
      toast.error(
        offline
          ? 'Demo mode is read-only. Reconnect to create tickets.'
          : err.response?.data?.message || 'Could not create ticket',
      );
    }
  }
  async function openTicket(ticket) {
    setSelected(ticket);
    setMessages([]);
    try {
      const { data } = await api.get(`/tickets/${ticket._id}`);
      setSelected(data.ticket);
      setMessages(data.messages);
    } catch {
      setMessages([]);
    }
  }
  const isCustomer =
    JSON.parse(localStorage.getItem('user') || '{}').role === 'Customer';
  async function sendReply(e) {
    e.preventDefault();
    if (!reply.trim()) return;
    try {
      await api.post(`/tickets/${selected._id}/messages`, { body: reply });
      toast.success('Reply sent');
      setReply('');
      await openTicket(selected);
      load();
    } catch {
      toast.error(
        offline
          ? 'Demo mode is read-only. Reconnect to reply.'
          : 'Could not send reply',
      );
    }
  }
  async function update(field, value) {
    try {
      await api.patch(`/tickets/${selected._id}`, { [field]: value });
      setSelected({ ...selected, [field]: value });
      toast.success('Ticket updated');
      load();
    } catch {
      toast.error(
        offline ? 'Demo mode is read-only.' : 'Could not update ticket',
      );
    }
  }
  return (
    <section className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">SUPPORT WORKSPACE</div>
          <h1>Tickets</h1>
          <p>Manage, prioritize, and resolve customer requests.</p>
        </div>
        <button className="primary-button" onClick={() => setModal(true)}>
          <Plus size={17} /> Create ticket
        </button>
      </div>
      {offline && (
        <div className="demo-banner">
          Demo data · API is unavailable. Changes are disabled while offline.
        </div>
      )}
      <div className="panel tickets-panel">
        <div className="ticket-toolbar">
          <div className="search-field">
            <Search size={17} />
            <input
              placeholder="Search tickets…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <kbd>⌘ K</kbd>
          </div>
          <div className="filters">
            <SlidersHorizontal size={16} />
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>All status</option>
              {['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'].map(
                (x) => (
                  <option key={x}>{x}</option>
                ),
              )}
            </select>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option>All priorities</option>
              {['Low', 'Medium', 'High', 'Urgent'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <input type="checkbox" />
                </th>
                <th>TICKET</th>
                <th>SUBJECT</th>
                <th>CUSTOMER</th>
                <th>ASSIGNEE</th>
                <th>STATUS</th>
                <th>PRIORITY</th>
                <th>UPDATED</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((t, i) => (
                <tr key={t._id} onClick={() => openTicket(t)}>
                  <td>
                    <input
                      type="checkbox"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="ticket-id">#RD-{2048 - i}</td>
                  <td className="subject-cell">{t.subject}</td>
                  <td>
                    <span className="table-person">
                      <i>{(t.customerId?.name || 'S')[0]}</i>
                      {t.customerId?.name || 'Sam Rivera'}
                    </span>
                  </td>
                  <td>{t.assigneeId?.name || 'Unassigned'}</td>
                  <td>
                    <StatusBadge value={t.status} />
                  </td>
                  <td>
                    <span className={`priority ${t.priority?.toLowerCase()}`}>
                      <i />
                      {t.priority}
                    </span>
                  </td>
                  <td className="muted">
                    {new Date(t.updatedAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button className="icon-button">
                      <MoreHorizontal size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && (
            <div className="empty-state">
              <Search size={30} />
              <h3>No tickets found</h3>
              <p>Try adjusting your filters or create a new ticket.</p>
            </div>
          )}
        </div>
        <div className="table-footer">
          Showing{' '}
          <b>
            {visible.length ? 1 : 0}–{visible.length}
          </b>{' '}
          of <b>{tickets.length} tickets</b>
          <div className="pager">
            <button disabled>Previous</button>
            <button className="current-page">1</button>
            <button disabled>Next</button>
          </div>
        </div>
      </div>
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <form
            className="modal-card"
            onSubmit={create}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <h2>Create ticket</h2>
                <p>Add a new customer request to your queue.</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setModal(false)}
              >
                <X />
              </button>
            </div>
            {!isCustomer && (
              <label>
                Customer
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">Choose a customer</option>
                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name} ({customer.email})
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Subject
              <input
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What does the customer need help with?"
              />
            </label>
            <label>
              Description
              <textarea
                required
                rows="5"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details about the request…"
              />
            </label>
            <div className="modal-row">
              <label>
                Priority
                <select
                  value={ticketPriority}
                  onChange={(e) => setTicketPriority(e.target.value)}
                >
                  {['Low', 'Medium', 'High', 'Urgent'].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label>
                Category
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {['General', 'Billing', 'Technical'].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setModal(false)}
              >
                Cancel
              </button>
              <button className="primary-button">
                <Plus size={16} /> Create ticket
              </button>
            </div>
          </form>
        </div>
      )}
      {selected && (
        <div className="drawer-backdrop" onClick={() => setSelected(null)}>
          <aside className="ticket-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <span className="ticket-id">#RD-2048</span>
              <button className="icon-button" onClick={() => setSelected(null)}>
                <X />
              </button>
            </div>
            <h2>{selected.subject}</h2>
            <div className="drawer-meta">
              Submitted by <b>{selected.customerId?.name || 'Sam Rivera'}</b> ·{' '}
              {new Date(selected.updatedAt).toLocaleDateString()}
            </div>
            {!isCustomer && (
              <div className="drawer-controls">
                <label>
                  Status
                  <select
                    value={selected.status}
                    onChange={(e) => update('status', e.target.value)}
                  >
                    {[
                      'Open',
                      'In Progress',
                      'Pending',
                      'Resolved',
                      'Closed',
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Priority
                  <select
                    value={selected.priority}
                    onChange={(e) => update('priority', e.target.value)}
                  >
                    {['Low', 'Medium', 'High', 'Urgent'].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            <div className="conversation">
              <h4>
                Conversation <span>{messages.length} messages</span>
              </h4>
              {messages.map((message) => (
                <div className="message" key={message._id}>
                  <div className="avatar">
                    {message.authorId?.name?.[0] || 'U'}
                  </div>
                  <div>
                    <b>
                      {message.authorId?.name || 'Workspace member'}
                      <small>
                        {message.internal
                          ? 'Internal note'
                          : message.authorId?.role}
                        {' · '}
                        {new Date(message.createdAt).toLocaleString()}
                      </small>
                    </b>
                    <p>{message.body}</p>
                  </div>
                </div>
              ))}
              {!messages.length && (
                <p className="muted">
                  {offline
                    ? 'Conversation details are unavailable in demo mode.'
                    : 'No messages yet.'}
                </p>
              )}
            </div>
            <div className="reply-box">
              <textarea
                placeholder="Write a reply…"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <div>
                <button className="icon-button" type="button">
                  <Paperclip size={17} />
                </button>
                <span>Attachment UI</span>
                <button className="primary-button" onClick={sendReply}>
                  <Send size={15} /> Send reply
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

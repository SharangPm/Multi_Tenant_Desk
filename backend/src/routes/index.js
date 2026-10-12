import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { Organization, User, Ticket, TicketMessage } from '../models/index.js';
import { auth, allow, tenant } from '../middleware/auth.js';
import { enqueueReminder } from '../services/slaQueue.js';
const router = Router();
const issue = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return true;
  }
  return false;
};
const tokens = (user) => ({
  accessToken: jwt.sign(
    {
      id: user._id,
      organizationId: user.organizationId,
      role: user.role,
      name: user.name,
      email: user.email,
    },
    process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
    { expiresIn: '15m' },
  ),
  refreshToken: jwt.sign(
    { id: user._id, organizationId: user.organizationId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    { expiresIn: '7d' },
  ),
});
export function ticketScope(user, organizationId) {
  return {
    organizationId,
    ...(user.role === 'Customer' ? { customerId: user.id } : {}),
  };
}
router.post(
  '/auth/register',
  [
    body('organizationName').trim().notEmpty(),
    body('name').trim().notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
  ],
  async (req, res, next) => {
    try {
      if (issue(req, res)) return;
      const org = await Organization.create({
        name: req.body.organizationName,
      });
      const user = await User.create({
        organizationId: org._id,
        name: req.body.name,
        email: req.body.email,
        password: await bcrypt.hash(req.body.password, 10),
        role: 'Admin',
      });
      res.status(201).json({
        user: {
          id: user._id,
          name: user.name,
          role: user.role,
          organizationId: org._id,
        },
        ...tokens(user),
      });
    } catch (e) {
      next(e);
    }
  },
);
router.post(
  '/auth/login',
  [body('email').isEmail(), body('password').notEmpty()],
  async (req, res, next) => {
    try {
      if (issue(req, res)) return;
      const user = await User.findOne({
        email: req.body.email.toLowerCase(),
        active: true,
      });
      if (!user || !(await bcrypt.compare(req.body.password, user.password)))
        return res
          .status(401)
          .json({ message: 'Email or password is incorrect' });
      res.json({
        user: {
          id: user._id,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          email: user.email,
        },
        ...tokens(user),
      });
    } catch (e) {
      next(e);
    }
  },
);
router.post('/auth/refresh', async (req, res) => {
  try {
    const p = jwt.verify(
      req.body.refreshToken,
      process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    );
    if (p.type !== 'refresh') throw Error();
    const user = await User.findOne({
      _id: p.id,
      organizationId: p.organizationId,
      active: true,
    });
    if (!user)
      return res.status(401).json({ message: 'Invalid refresh token' });
    res.json({ accessToken: tokens(user).accessToken });
  } catch {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});
router.post('/auth/logout', auth, (req, res) =>
  res.json({ message: 'Logged out' }),
);
router.get('/auth/me', auth, async (req, res, next) => {
  try {
    const u = await User.findOne({
      _id: req.user.id,
      organizationId: req.user.organizationId,
      active: true,
    }).select('-password');
    if (!u) return res.status(404).json({ message: 'User not found' });
    res.json(u);
  } catch (e) {
    next(e);
  }
});
router.use(auth, tenant);
router.get('/tickets', async (req, res, next) => {
  try {
    const q = ticketScope(req.user, req.organizationId);
    if (req.query.status) q.status = req.query.status;
    if (req.query.priority) q.priority = req.query.priority;
    if (req.query.assigneeId) q.assigneeId = req.query.assigneeId;
    if (req.query.search)
      q.$or = [
        { subject: new RegExp(req.query.search, 'i') },
        { description: new RegExp(req.query.search, 'i') },
      ];
    const page = Math.max(1, +req.query.page || 1),
      limit = Math.min(100, +req.query.limit || 10);
    const [items, total] = await Promise.all([
      Ticket.find(q)
        .populate('customerId', 'name email')
        .populate('assigneeId', 'name')
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Ticket.countDocuments(q),
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    next(e);
  }
});
router.post(
  '/tickets',
  [body('subject').trim().notEmpty(), body('description').trim().notEmpty()],
  async (req, res, next) => {
    try {
      if (issue(req, res)) return;
      if (
        req.body.priority &&
        !['Low', 'Medium', 'High', 'Urgent'].includes(req.body.priority)
      )
        return res.status(400).json({ message: 'Invalid ticket priority' });
      const customerId =
        req.user.role === 'Customer' ? req.user.id : req.body.customerId;
      if (!customerId)
        return res.status(400).json({ message: 'Select a customer' });
      const customer = await User.findOne({
        _id: customerId,
        organizationId: req.organizationId,
        role: 'Customer',
        active: true,
      });
      if (!customer)
        return res
          .status(400)
          .json({ message: 'Customer is not in this organization' });
      const ticket = await Ticket.create({
        organizationId: req.organizationId,
        customerId,
        subject: req.body.subject,
        description: req.body.description,
        category: req.body.category,
        priority: req.body.priority,
      });
      await TicketMessage.create({
        organizationId: req.organizationId,
        ticketId: ticket._id,
        authorId: req.user.id,
        body: req.body.description,
      });
      await enqueueReminder({
        ticketId: ticket._id,
        organizationId: req.organizationId,
      });
      req.app
        .get('io')
        ?.to(`org:${req.organizationId}`)
        .emit('ticket:created', { ticketId: ticket._id });
      res.status(201).json(ticket);
    } catch (e) {
      next(e);
    }
  },
);
const findTicket = async (req, res, next) => {
  try {
    const q = {
      _id: req.params.id,
      ...ticketScope(req.user, req.organizationId),
    };
    const ticket = await Ticket.findOne(q)
      .populate('customerId', 'name email')
      .populate('assigneeId', 'name');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    req.ticket = ticket;
    next();
  } catch (e) {
    next(e);
  }
};
router.get('/tickets/:id', findTicket, async (req, res, next) => {
  try {
    const messages = await TicketMessage.find({
      ticketId: req.ticket._id,
      organizationId: req.organizationId,
      ...(req.user.role === 'Customer' ? { internal: false } : {}),
    })
      .populate('authorId', 'name role')
      .sort({ createdAt: 1 });
    res.json({ ticket: req.ticket, messages });
  } catch (e) {
    next(e);
  }
});
router.patch(
  '/tickets/:id',
  allow('Admin', 'Agent'),
  findTicket,
  async (req, res, next) => {
    try {
      const fields = {};
      for (const key of ['status', 'priority', 'assigneeId', 'category'])
        if (req.body[key] !== undefined) fields[key] = req.body[key];
      if (
        fields.status &&
        !['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'].includes(
          fields.status,
        )
      )
        return res.status(400).json({ message: 'Invalid ticket status' });
      if (
        fields.priority &&
        !['Low', 'Medium', 'High', 'Urgent'].includes(fields.priority)
      )
        return res.status(400).json({ message: 'Invalid ticket priority' });
      if (fields.assigneeId) {
        const assignee = await User.findOne({
          _id: fields.assigneeId,
          organizationId: req.organizationId,
          role: { $in: ['Admin', 'Agent'] },
          active: true,
        });
        if (!assignee)
          return res
            .status(400)
            .json({ message: 'Assignee is not active in this organization' });
      }
      Object.assign(req.ticket, fields);
      await req.ticket.save();
      req.app
        .get('io')
        ?.to(`org:${req.organizationId}`)
        .emit('ticket:updated', { ticketId: req.ticket._id, ...fields });
      res.json(req.ticket);
    } catch (e) {
      next(e);
    }
  },
);
router.post(
  '/tickets/:id/messages',
  [body('body').trim().notEmpty()],
  findTicket,
  async (req, res, next) => {
    try {
      if (issue(req, res)) return;
      if (req.body.internal && req.user.role === 'Customer')
        return res
          .status(403)
          .json({ message: 'Customers cannot add internal notes' });
      const message = await TicketMessage.create({
        organizationId: req.organizationId,
        ticketId: req.ticket._id,
        authorId: req.user.id,
        body: req.body.body,
        internal: !!req.body.internal,
      });
      req.app
        .get('io')
        ?.to(`org:${req.organizationId}`)
        .emit('ticket:message', { ticketId: req.ticket._id, message });
      res.status(201).json(message);
    } catch (e) {
      next(e);
    }
  },
);
router.delete(
  '/tickets/:id',
  allow('Admin', 'Agent'),
  findTicket,
  async (req, res, next) => {
    try {
      await TicketMessage.deleteMany({
        ticketId: req.ticket._id,
        organizationId: req.organizationId,
      });
      await req.ticket.deleteOne();
      res.json({ message: 'Ticket deleted' });
    } catch (e) {
      next(e);
    }
  },
);
router.get('/customers', allow('Admin', 'Agent'), async (req, res, next) => {
  try {
    res.json(
      await User.find({
        organizationId: req.organizationId,
        role: 'Customer',
        ...(req.query.search
          ? { name: new RegExp(req.query.search, 'i') }
          : {}),
      })
        .select('-password')
        .sort({ name: 1 }),
    );
  } catch (e) {
    next(e);
  }
});
router.post(
  '/customers',
  allow('Admin', 'Agent'),
  [
    body('name').trim().notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
  ],
  async (req, res, next) => {
    try {
      if (issue(req, res)) return;
      const customer = await User.create({
        organizationId: req.organizationId,
        name: req.body.name,
        email: req.body.email,
        password: await bcrypt.hash(req.body.password, 10),
        role: 'Customer',
      });
      res.status(201).json({
        id: customer._id,
        name: customer.name,
        email: customer.email,
        role: customer.role,
        active: customer.active,
      });
    } catch (e) {
      next(e);
    }
  },
);
router.get('/team', allow('Admin', 'Agent'), async (req, res, next) => {
  try {
    res.json(
      await User.find({
        organizationId: req.organizationId,
        role: { $in: ['Admin', 'Agent'] },
      })
        .select('-password')
        .sort({ name: 1 }),
    );
  } catch (e) {
    next(e);
  }
});
router.post('/team', allow('Admin'), async (req, res, next) => {
  try {
    const u = await User.create({
      organizationId: req.organizationId,
      name: req.body.name,
      email: req.body.email,
      password: await bcrypt.hash(req.body.password || 'ChangeMe123!', 10),
      role: req.body.role === 'Admin' ? 'Admin' : 'Agent',
    });
    res.status(201).json({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      active: u.active,
    });
  } catch (e) {
    next(e);
  }
});
router.patch('/team/:id', allow('Admin'), async (req, res, next) => {
  try {
    const u = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        organizationId: req.organizationId,
        role: { $in: ['Admin', 'Agent'] },
      },
      {
        $set: {
          ...(req.body.role ? { role: req.body.role } : {}),
          ...(req.body.active !== undefined ? { active: req.body.active } : {}),
        },
      },
      { new: true },
    ).select('-password');
    if (!u) return res.status(404).json({ message: 'Team member not found' });
    res.json(u);
  } catch (e) {
    next(e);
  }
});
router.get('/dashboard', async (req, res, next) => {
  try {
    const q = ticketScope(req.user, req.organizationId);
    const [
      total,
      open,
      inProgress,
      resolved,
      overdue,
      recent,
      agents,
      activity,
    ] = await Promise.all([
      Ticket.countDocuments(q),
      Ticket.countDocuments({ ...q, status: 'Open' }),
      Ticket.countDocuments({ ...q, status: 'In Progress' }),
      Ticket.countDocuments({ ...q, status: 'Resolved' }),
      Ticket.countDocuments({
        ...q,
        dueAt: { $lt: new Date() },
        status: { $nin: ['Resolved', 'Closed'] },
      }),
      Ticket.find(q)
        .populate('customerId', 'name')
        .populate('assigneeId', 'name')
        .sort({ updatedAt: -1 })
        .limit(6),
      User.find({ organizationId: req.organizationId, role: 'Agent' }).select(
        'name availability',
      ),
      Ticket.aggregate([
        { $match: q },
        { $group: { _id: '$status', value: { $sum: 1 } } },
      ]),
    ]);
    res.json({
      metrics: { total, open, inProgress, resolved, overdue },
      recent,
      agents: req.user.role === 'Customer' ? [] : agents,
      activity,
    });
  } catch (e) {
    next(e);
  }
});
router.get('/analytics', allow('Admin', 'Agent'), async (req, res, next) => {
  try {
    const q = { organizationId: req.organizationId };
    const [byStatus, byPriority, byAgent, all, total] = await Promise.all([
      Ticket.aggregate([
        { $match: q },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Ticket.aggregate([
        { $match: q },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Ticket.aggregate([
        { $match: { ...q, assigneeId: { $ne: null } } },
        { $group: { _id: '$assigneeId', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'agent',
          },
        },
        { $unwind: '$agent' },
        { $project: { name: '$agent.name', count: 1 } },
      ]),
      Ticket.find(q).select('createdAt updatedAt status dueAt'),
      Ticket.countDocuments(q),
    ]);
    res.json({ byStatus, byPriority, byAgent, total, tickets: all });
  } catch (e) {
    next(e);
  }
});
router.get('/settings', allow('Admin', 'Agent'), async (req, res, next) => {
  try {
    res.json(await Organization.findById(req.organizationId));
  } catch (e) {
    next(e);
  }
});
router.patch('/settings', allow('Admin'), async (req, res, next) => {
  try {
    const org = await Organization.findByIdAndUpdate(
      req.organizationId,
      {
        $set: {
          ...(req.body.name ? { name: req.body.name } : {}),
          ...(req.body.categories ? { categories: req.body.categories } : {}),
          ...(req.body.sla ? { sla: req.body.sla } : {}),
          ...(req.body.notifications !== undefined
            ? { notifications: req.body.notifications }
            : {}),
        },
      },
      { new: true },
    );
    res.json(org);
  } catch (e) {
    next(e);
  }
});
router.patch('/profile', async (req, res, next) => {
  try {
    const u = await User.findOne({
      _id: req.user.id,
      organizationId: req.organizationId,
    });
    if (req.body.name) u.name = req.body.name;
    if (req.body.password) {
      if (
        !req.body.currentPassword ||
        !(await bcrypt.compare(req.body.currentPassword, u.password))
      )
        return res
          .status(400)
          .json({ message: 'Current password is incorrect' });
      u.password = await bcrypt.hash(req.body.password, 10);
    }
    await u.save();
    res.json({ name: u.name, email: u.email, role: u.role });
  } catch (e) {
    next(e);
  }
});
export default router;

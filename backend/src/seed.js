import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Organization, User, Ticket, TicketMessage } from './models/index.js';
await mongoose.connect(
  process.env.MONGO_URI || 'mongodb://localhost:27017/resolvedesk',
);
await Promise.all([
  Organization.deleteMany({}),
  User.deleteMany({}),
  Ticket.deleteMany({}),
  TicketMessage.deleteMany({}),
]);
for (const [name, slug] of [
  ['Acme Support', 'acme'],
  ['Northstar Labs', 'northstar'],
]) {
  const org = await Organization.create({ name, slug });
  const pass = await bcrypt.hash('Resolve123!', 10);
  const admin = await User.create({
    organizationId: org._id,
    name: `${slug === 'acme' ? 'Avery' : 'Jordan'} Admin`,
    email: `admin@${slug}.demo`,
    password: pass,
    role: 'Admin',
  });
  const agent = await User.create({
    organizationId: org._id,
    name: 'Taylor Morgan',
    email: `agent@${slug}.demo`,
    password: pass,
    role: 'Agent',
  });
  const customer = await User.create({
    organizationId: org._id,
    name: 'Sam Rivera',
    email: `customer@${slug}.demo`,
    password: pass,
    role: 'Customer',
  });
  for (const [i, subject] of [
    'Cannot access my account',
    'Invoice question',
    'App is running slowly',
  ].entries()) {
    const ticket = await Ticket.create({
      organizationId: org._id,
      customerId: customer._id,
      assigneeId: agent._id,
      subject,
      description: 'I need help resolving this request.',
      status: ['Open', 'In Progress', 'Resolved'][i],
      priority: ['High', 'Medium', 'Low'][i],
    });
    await TicketMessage.create({
      organizationId: org._id,
      ticketId: ticket._id,
      authorId: customer._id,
      body: 'I need help resolving this request.',
    });
    await TicketMessage.create({
      organizationId: org._id,
      ticketId: ticket._id,
      authorId: agent._id,
      body: 'Thanks for reaching out. We are looking into this.',
    });
  }
  console.log(`Seeded ${name} with admin ${admin.email}`);
}
await mongoose.disconnect();

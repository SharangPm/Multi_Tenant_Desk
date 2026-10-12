export const mockUser = {
  id: 'demo-admin',
  name: 'Avery Admin',
  email: 'admin@acme.demo',
  role: 'Admin',
  organizationId: 'acme',
};
export const mockTickets = [
  {
    _id: 'RD-2048',
    subject: 'Cannot access my account',
    customerId: { name: 'Sam Rivera' },
    assigneeId: { name: 'Taylor Morgan' },
    status: 'Open',
    priority: 'High',
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'RD-2047',
    subject: 'Invoice question for October',
    customerId: { name: 'Morgan Chen' },
    assigneeId: { name: 'Jamie Lee' },
    status: 'In Progress',
    priority: 'Medium',
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'RD-2046',
    subject: 'Mobile app is running slowly',
    customerId: { name: 'Alex Johnson' },
    assigneeId: { name: 'Taylor Morgan' },
    status: 'Pending',
    priority: 'Low',
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'RD-2045',
    subject: 'Update billing contact',
    customerId: { name: 'Riley Davis' },
    assigneeId: { name: 'Jamie Lee' },
    status: 'Resolved',
    priority: 'Urgent',
    updatedAt: new Date().toISOString(),
  },
];
export const mockCustomerTickets = [mockTickets[0]];

import { User } from '@/types';

export const users: User[] = [
  {
    id: 'user-001',
    name: 'John Admin',
    email: 'john.admin@oxygenpos.com',
    role: 'admin',
    avatar: '/avatars/admin.png',
    isActive: true,
    createdAt: '2024-06-01T00:00:00Z',
  },
  {
    id: 'user-002',
    name: 'Sarah Manager',
    email: 'sarah.manager@oxygenpos.com',
    role: 'manager',
    avatar: '/avatars/manager.png',
    isActive: true,
    createdAt: '2024-07-15T00:00:00Z',
  },
  {
    id: 'user-003',
    name: 'Mike Cashier',
    email: 'mike.cashier@oxygenpos.com',
    role: 'cashier',
    isActive: true,
    createdAt: '2024-08-20T00:00:00Z',
  },
  {
    id: 'user-004',
    name: 'Emma Cashier',
    email: 'emma.cashier@oxygenpos.com',
    role: 'cashier',
    isActive: true,
    createdAt: '2024-09-10T00:00:00Z',
  },
  {
    id: 'user-005',
    name: 'David Wilson',
    email: 'david.wilson@oxygenpos.com',
    role: 'cashier',
    isActive: false,
    createdAt: '2024-05-01T00:00:00Z',
  },
];

// Current logged in user (for demo purposes)
export const currentUser = users[0];

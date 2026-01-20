import { MainTank } from '@/types';

export const mainTank: MainTank = {
  id: 'tank-001',
  name: 'Main Storage Tank',
  capacityLiters: 10000,
  currentLevelLiters: 6500,
  lastRefillDate: '2026-01-18T10:30:00Z',
  lastRefillAmount: 2500,
};

// Tank level history for charts
export const tankLevelHistory = [
  { date: '2026-01-12', level: 3500 },
  { date: '2026-01-13', level: 3100 },
  { date: '2026-01-14', level: 2800 },
  { date: '2026-01-15', level: 5800 },
  { date: '2026-01-16', level: 5200 },
  { date: '2026-01-17', level: 4600 },
  { date: '2026-01-18', level: 4000 },
  { date: '2026-01-19', level: 6500 },
];

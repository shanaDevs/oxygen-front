import { OxygenBottle, BottleType } from '@/types';

export const bottleTypes: BottleType[] = [
  {
    id: 'bt-001',
    name: 'Small (10L)',
    capacityLiters: 10,
    pricePerFill: 500,
    depositAmount: 2000,
  },
  {
    id: 'bt-002',
    name: 'Medium (20L)',
    capacityLiters: 20,
    pricePerFill: 900,
    depositAmount: 3500,
  },
  {
    id: 'bt-003',
    name: 'Large (40L)',
    capacityLiters: 40,
    pricePerFill: 1600,
    depositAmount: 6000,
  },
  {
    id: 'bt-004',
    name: 'Industrial (50L)',
    capacityLiters: 50,
    pricePerFill: 1900,
    depositAmount: 8000,
  },
];

export const oxygenBottles: OxygenBottle[] = [
  // Empty bottles in center
  { id: 'bot-001', serialNumber: 'OXY-10L-0001', capacityLiters: 10, status: 'empty' },
  { id: 'bot-002', serialNumber: 'OXY-10L-0002', capacityLiters: 10, status: 'empty' },
  { id: 'bot-003', serialNumber: 'OXY-10L-0003', capacityLiters: 10, status: 'empty' },
  { id: 'bot-004', serialNumber: 'OXY-20L-0001', capacityLiters: 20, status: 'empty' },
  { id: 'bot-005', serialNumber: 'OXY-20L-0002', capacityLiters: 20, status: 'empty' },
  { id: 'bot-006', serialNumber: 'OXY-40L-0001', capacityLiters: 40, status: 'empty' },
  { id: 'bot-007', serialNumber: 'OXY-40L-0002', capacityLiters: 40, status: 'empty' },
  { id: 'bot-008', serialNumber: 'OXY-50L-0001', capacityLiters: 50, status: 'empty' },

  // Filled bottles ready for sale
  { id: 'bot-009', serialNumber: 'OXY-10L-0004', capacityLiters: 10, status: 'filled', filledDate: '2026-01-19T08:00:00Z' },
  { id: 'bot-010', serialNumber: 'OXY-10L-0005', capacityLiters: 10, status: 'filled', filledDate: '2026-01-19T08:00:00Z' },
  { id: 'bot-011', serialNumber: 'OXY-10L-0006', capacityLiters: 10, status: 'filled', filledDate: '2026-01-19T08:00:00Z' },
  { id: 'bot-012', serialNumber: 'OXY-10L-0007', capacityLiters: 10, status: 'filled', filledDate: '2026-01-19T08:00:00Z' },
  { id: 'bot-013', serialNumber: 'OXY-10L-0008', capacityLiters: 10, status: 'filled', filledDate: '2026-01-19T08:00:00Z' },
  { id: 'bot-014', serialNumber: 'OXY-20L-0003', capacityLiters: 20, status: 'filled', filledDate: '2026-01-19T08:00:00Z' },
  { id: 'bot-015', serialNumber: 'OXY-20L-0004', capacityLiters: 20, status: 'filled', filledDate: '2026-01-19T08:00:00Z' },
  { id: 'bot-016', serialNumber: 'OXY-20L-0005', capacityLiters: 20, status: 'filled', filledDate: '2026-01-19T08:00:00Z' },
  { id: 'bot-017', serialNumber: 'OXY-40L-0003', capacityLiters: 40, status: 'filled', filledDate: '2026-01-19T08:00:00Z' },
  { id: 'bot-018', serialNumber: 'OXY-40L-0004', capacityLiters: 40, status: 'filled', filledDate: '2026-01-19T08:00:00Z' },
  { id: 'bot-019', serialNumber: 'OXY-50L-0002', capacityLiters: 50, status: 'filled', filledDate: '2026-01-19T08:00:00Z' },
  { id: 'bot-020', serialNumber: 'OXY-50L-0003', capacityLiters: 50, status: 'filled', filledDate: '2026-01-19T08:00:00Z' },

  // Bottles with customers
  { id: 'bot-021', serialNumber: 'OXY-10L-0009', capacityLiters: 10, status: 'with_customer', customerId: 'cust-001', customerName: 'City Hospital', issuedDate: '2026-01-18T14:00:00Z' },
  { id: 'bot-022', serialNumber: 'OXY-10L-0010', capacityLiters: 10, status: 'with_customer', customerId: 'cust-001', customerName: 'City Hospital', issuedDate: '2026-01-18T14:00:00Z' },
  { id: 'bot-023', serialNumber: 'OXY-20L-0006', capacityLiters: 20, status: 'with_customer', customerId: 'cust-001', customerName: 'City Hospital', issuedDate: '2026-01-17T10:00:00Z' },
  { id: 'bot-024', serialNumber: 'OXY-40L-0005', capacityLiters: 40, status: 'with_customer', customerId: 'cust-002', customerName: 'National Hospital', issuedDate: '2026-01-16T09:00:00Z' },
  { id: 'bot-025', serialNumber: 'OXY-40L-0006', capacityLiters: 40, status: 'with_customer', customerId: 'cust-002', customerName: 'National Hospital', issuedDate: '2026-01-16T09:00:00Z' },
  { id: 'bot-026', serialNumber: 'OXY-50L-0004', capacityLiters: 50, status: 'with_customer', customerId: 'cust-003', customerName: 'Welding Works Ltd', issuedDate: '2026-01-15T11:30:00Z' },
  { id: 'bot-027', serialNumber: 'OXY-10L-0011', capacityLiters: 10, status: 'with_customer', customerId: 'cust-004', customerName: 'Mr. Perera - Home Care', issuedDate: '2026-01-14T15:00:00Z' },
  { id: 'bot-028', serialNumber: 'OXY-20L-0007', capacityLiters: 20, status: 'with_customer', customerId: 'cust-005', customerName: 'Care Home Center', issuedDate: '2026-01-13T10:30:00Z' },
  { id: 'bot-029', serialNumber: 'OXY-20L-0008', capacityLiters: 20, status: 'with_customer', customerId: 'cust-005', customerName: 'Care Home Center', issuedDate: '2026-01-13T10:30:00Z' },
  { id: 'bot-030', serialNumber: 'OXY-50L-0005', capacityLiters: 50, status: 'with_customer', customerId: 'cust-006', customerName: 'Steel Factory', issuedDate: '2026-01-12T08:00:00Z' },
];

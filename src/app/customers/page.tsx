'use client';

import { useState, useEffect, useMemo } from 'react';
import { CustomerCard } from '@/components/customers/CustomerCard';
import { CustomerTransactionsTable } from '@/components/customers/CustomerTransactionsTable';
import { PDFPreviewModal } from '@/components/shared/PDFPreviewModal';
import { IssueBottleModal } from '@/components/customers/IssueBottleModal';
import { ReturnBottleModal } from '@/components/customers/ReturnBottleModal';
import { CollectPaymentModal } from '@/components/customers/CollectPaymentModal';
import { TransactionBottleLedgerModal } from '@/components/customers/TransactionBottleLedgerModal';
import { CustomerDetailModal } from '@/components/customers/CustomerDetailModal';
import { toast } from 'sonner';
import { isValidSriLankanPhone } from '@/lib/utils';
import {
  Button,
  LoadingSpinner,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Separator,
  Alert,
  AlertDescription,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { StatCard } from '@/components/dashboard';
import { customerService, bottleService, pdfService } from '@/services';
import { bottleTypes } from '@/data';
import { Customer, CustomerTransaction, OxygenBottle, BottleType } from '@/types';
import {
  Users,
  Package,
  CreditCard,
  CircleCheck,
  PackagePlus,
  PackageMinus,
  Banknote,
  UserPlus,
  AlertTriangle,
  X,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  ArrowRightLeft,
  FileText,
  CheckCircle2,
  Eye,
  Download,
  Search,
  Filter,
  Calendar
} from 'lucide-react';

export default function CustomersPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);
  const [bottles, setBottles] = useState<OxygenBottle[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [ledgerData, setLedgerData] = useState<{ ledger: any[], currentBottles: any[] } | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment success state
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [lastPayment, setLastPayment] = useState<{
    customerName: string;
    amount: number;
    remaining: number;
    id?: string;
  } | null>(null);

  // PDF Preview State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const openPreview = (url: string, title: string) => {
    setPreviewUrl(url);
    setPreviewTitle(title);
    setIsPreviewOpen(true);
  };

  // Bottle Ledger Modal State
  const [isBottleLedgerOpen, setIsBottleLedgerOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<CustomerTransaction | null>(null);
  const [bottleLedgerData, setBottleLedgerData] = useState<{
    bottlesIn: any[];
    bottlesOut: any[];
  }>({ bottlesIn: [], bottlesOut: [] });

  const handleViewBottles = async (transaction: CustomerTransaction) => {
    setSelectedTransaction(transaction);
    // TODO: Fetch bottle ledger data from API
    // For now, using mock data based on transaction
    setBottleLedgerData({
      bottlesIn: [], // Will be populated from API
      bottlesOut: transaction.bottleIds?.map((id, index) => ({
        id: `ledger-${index}`,
        bottleId: id,
        serialNumber: `Bottle-${index + 1}`,
        operationType: 'issued',
        previousStatus: 'filled',
        newStatus: 'with_customer',
        createdAt: transaction.createdAt,
      })) || [],
    });
    setIsBottleLedgerOpen(true);
  };

  // Customer Detail Modal State
  const [isCustomerDetailOpen, setIsCustomerDetailOpen] = useState(false);
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState<Customer | null>(null);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');

  // Advanced Filtering System
  const [timeRange, setTimeRange] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('all');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Advanced Filtering Logic
  const filterTransactions = (txns: CustomerTransaction[]) => {
    if (timeRange === 'all') return txns;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return txns.filter(tx => {
      const txDate = new Date(tx.createdAt);
      switch (timeRange) {
        case 'daily': return txDate >= startOfToday;
        case 'weekly': return txDate >= startOfWeek;
        case 'monthly': return txDate >= startOfMonth;
        case 'yearly': return txDate >= startOfYear;
        case 'custom': {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          return txDate >= start && txDate <= end;
        }
        default: return true;
      }
    });
  };

  const filteredCustomers = customers.filter((customer) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query)
    );
  });

  const filteredTransactions = useMemo(() => {
    let result = filterTransactions(transactions);

    // Filter by selected customer
    if (selectedCustomer) {
      result = result.filter(tx => tx.customerId === selectedCustomer.id);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(tx =>
        tx.customerName.toLowerCase().includes(query) ||
        tx.id.toLowerCase().includes(query) ||
        tx.bottleType.toLowerCase().includes(query)
      );
    }

    return result;
  }, [transactions, selectedCustomer, searchQuery, timeRange, startDate, endDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [custs, txns, btlsRes] = await Promise.all([
        customerService.getAll(),
        customerService.getTransactions(),
        bottleService.getAll(),
      ]);
      setCustomers(custs);
      setTransactions(txns);
      // bottleService.getAll() returns ApiResponse<OxygenBottle[]>
      setBottles(btlsRes.data || []);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalCredit = customers.reduce((sum, c) => sum + c.totalCredit, 0);
  const totalBottlesOut = bottles.filter((b) => b.status === 'with_customer').length;
  const filledBottles = bottles.filter((b) => b.status === 'filled');
  const bottlesWithCustomers = bottles.filter((b) => b.status === 'with_customer');

  const handleIssueBottles = async (data: {
    customerId: string;
    bottleIds: string[];
    totalAmount: number;
    amountPaid: number;
    paymentStatus: 'full' | 'partial' | 'credit';
  }) => {
    const customer = customers.find((c) => c.id === data.customerId);
    if (!customer) return;

    // Get bottle info
    const issuedBottles = bottles.filter((b) => data.bottleIds.includes(b.id));
    const bottleType = issuedBottles[0]
      ? bottleTypes.find((t) => t.capacityLiters === issuedBottles[0].capacityLiters)?.name ||
      'Mixed'
      : 'Mixed';

    // Optimistic UI update - Update bottles status
    setBottles((prev) =>
      prev.map((bottle) =>
        data.bottleIds.includes(bottle.id)
            ...bottle,
        status: 'with_customer' as const,
        location: 'customer' as const,
        customerId: data.customerId,
        customerName: customer.name,
        issuedDate: new Date().toISOString(),
          }
          : bottle
      )
    );

  // Update customer
  const creditAmount = data.totalAmount - data.amountPaid;
  setCustomers((prev) =>
    prev.map((c) =>
      c.id === data.customerId
        ? {
          ...c,
          bottlesInHand: c.bottlesInHand + data.bottleIds.length,
          totalCredit: c.totalCredit + creditAmount,
        }
        : c
    )
  );

  // Add transaction locally
  const newTransaction: CustomerTransaction = {
    id: `ct-${Date.now()}`,
    customerId: data.customerId,
    customerName: customer.name,
    transactionType: 'issue',
    bottleIds: data.bottleIds,
    bottleCount: data.bottleIds.length,
    bottleType,
    totalAmount: data.totalAmount,
    amountPaid: data.amountPaid,
    creditAmount,
    paymentStatus: data.paymentStatus,
    createdAt: new Date().toISOString(),
  };

  setTransactions((prev) => [newTransaction, ...prev]);

  // Call API to sync with backend
  try {
    await customerService.issueBottles({
      customerId: data.customerId,
      bottleIds: data.bottleIds,
      totalAmount: data.totalAmount,
      amountPaid: data.amountPaid,
      paymentStatus: data.paymentStatus,
    });
  } catch (err) {
    console.error('Failed to sync issue bottles with server:', err);
  }
};

const handleReturnBottles = async (data: { customerId: string; bottleIds: string[] }) => {
  const customer = customers.find((c) => c.id === data.customerId);
  if (!customer) return;

  // Get bottle info for transaction
  const returnedBottles = bottles.filter((b) => data.bottleIds.includes(b.id));
  const bottleType = returnedBottles[0]
    ? bottleTypes.find((t) => t.capacityLiters === returnedBottles[0].capacityLiters)?.name ||
    'Mixed'
    : 'Mixed';

  // Optimistic UI update - Update bottles status to empty
  setBottles((prev) =>
    prev.map((bottle) =>
      data.bottleIds.includes(bottle.id)
        ? {
          ...bottle,
          status: 'empty' as const,
          location: 'center' as const,
          customerId: undefined,
          customerName: undefined,
          issuedDate: undefined,
          lastReturnedDate: new Date().toISOString(),
        }
        : bottle
    )
  );

  // Update customer bottles count
  setCustomers((prev) =>
    prev.map((c) =>
      c.id === data.customerId
        ? {
          ...c,
          bottlesInHand: Math.max(0, c.bottlesInHand - data.bottleIds.length),
        }
        : c
    )
  );

  // Add return transaction locally
  const newTransaction: CustomerTransaction = {
    id: `ct-${Date.now()}`,
    customerId: data.customerId,
    customerName: customer.name,
    transactionType: 'return',
    bottleIds: data.bottleIds,
    bottleCount: data.bottleIds.length,
    bottleType,
    totalAmount: 0,
    amountPaid: 0,
    creditAmount: 0,
    paymentStatus: 'full',
    notes: 'Empty bottles returned',
    createdAt: new Date().toISOString(),
  };

  setTransactions((prev) => [newTransaction, ...prev]);

  // Call API to sync with backend
  try {
    await customerService.returnBottles({
      customerId: data.customerId,
      bottleIds: data.bottleIds,
      notes: 'Empty bottles returned',
    });
  } catch (err) {
    console.error('Failed to sync return bottles with server:', err);
    // Could add error handling/rollback here if needed
  }
};

const handleCollectPayment = async (data: { customerId: string; amount: number }) => {
  const customer = customers.find((c) => c.id === data.customerId);
  if (!customer) return;

  // Optimistic UI update - Update customer credit
  setCustomers((prev) =>
    prev.map((c) =>
      c.id === data.customerId
        ? {
          ...c,
          totalCredit: Math.max(0, c.totalCredit - data.amount),
          loyaltyPoints: c.loyaltyPoints + Math.floor(data.amount / 100),
        }
        : c
    )
  );

  // Call API to sync with backend
  try {
    const result = await customerService.collectPayment({
      customerId: data.customerId,
      amount: data.amount,
      notes: 'Payment collected',
    });

    setLastPayment({
      customerName: customer.name,
      amount: data.amount,
      remaining: Math.max(0, customer.totalCredit - data.amount),
      id: `RCP-${Date.now()}`
    });
    setShowPaymentModal(false);
    setShowPaymentSuccess(true);
  } catch (err) {
    console.error('Failed to sync payment with server:', err);
  }
};

if (loading) {
  return (
    <div className="flex items-center justify-center h-96">
      <LoadingSpinner size="lg" />
    </div>
  );
}

return (
  <div className="space-y-6 p-1">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
          <Users className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">Manage customers, bottles, and credits</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setShowPaymentModal(true)} variant="outline" className="gap-2">
          <Banknote className="h-4 w-4" />
          Collect Payment
        </Button>
        <Button onClick={() => setShowReturnModal(true)} variant="outline" className="gap-2">
          <PackageMinus className="h-4 w-4" />
          Return Bottles
        </Button>
        <Button onClick={() => setShowIssueModal(true)} variant="secondary" className="gap-2">
          <PackagePlus className="h-4 w-4" />
          Issue Bottles
        </Button>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>
    </div>

    {error && (
      <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between w-full">
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchData()}
            className="h-8 gap-2 hover:bg-destructive/20"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )}

    {/* Stats */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Customers"
        value={customers.length}
        icon={Users}
        color="cyan"
      />
      <StatCard
        title="Bottles with Customers"
        value={totalBottlesOut}
        icon={Package}
        color="purple"
      />
      <StatCard
        title="Total Outstanding"
        value={`Rs. ${totalCredit.toLocaleString()}`}
        icon={CreditCard}
        color="orange"
      />
      <StatCard
        title="Ready to Issue"
        value={filledBottles.length}
        icon={CircleCheck}
        color="green"
      />
    </div>

    {/* Customers with Credit Warning */}
    {customers.filter((c) => c.totalCredit > 0).length > 0 && (
      <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-semibold text-amber-800 dark:text-amber-300">Customers with Outstanding Credit</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {customers
              .filter((c) => c.totalCredit > 0)
              .sort((a, b) => b.totalCredit - a.totalCredit)
              .map((c) => (
                <Button
                  key={c.id}
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCustomer(c)}
                  className="bg-card border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                >
                  <span className="font-medium">{c.name}</span>
                  <Badge variant="destructive" className="ml-2">Rs. {c.totalCredit.toLocaleString()}</Badge>
                </Button>
              ))}
          </div>
        </AlertDescription>
      </Alert>
    )}

    {/* Customer Cards */}
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold">All Customers</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-background"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          {selectedCustomer && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
              Clear Filter
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <div
            key={customer.id}
            className={`transition-all ${selectedCustomer?.id === customer.id
              ? 'ring-2 ring-cyan-500 rounded-xl'
              : ''
              }`}
          >
            <CustomerCard
              customer={customer}
              bottles={bottles}
              onPreview={openPreview}
              onClick={(c) => {
                setSelectedCustomerForDetail(c);
                setIsCustomerDetailOpen(true);
              }}
            />
          </div>
        ))}
      </div>
    </div>

    {/* Bottle Tracking Section */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Bottle Inventory & Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bottle Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <PackagePlus className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-400">With Customers</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {bottles.filter(b => b.status === 'with_customer').length}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <CircleCheck className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-700 dark:text-green-400">Filled & Ready</span>
            </div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {bottles.filter(b => b.status === 'filled').length}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <PackageMinus className="h-4 w-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-400">Empty</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {bottles.filter(b => b.status === 'empty').length}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-xs font-medium text-red-700 dark:text-red-400">Damaged</span>
            </div>
            <p className="text-2xl font-bold text-red-900 dark:text-red-100">
              {bottles.filter(b => (b.status as string) === 'damaged').length}
            </p>
          </div>
        </div>

        {/* Detailed Bottle List */}
        {bottles.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              All Bottles ({bottles.length})
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Serial #</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground uppercase">Capacity</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Location</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Customer</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground uppercase">Fill Count</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground uppercase">Issue Count</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Last Filled</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Issued Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {bottles.map((bottle) => (
                      <tr key={bottle.id} className="hover:bg-muted/50">
                        <td className="px-3 py-2 font-mono font-medium">{bottle.serialNumber}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {bottle.bottleType?.name || `${bottle.capacityLiters}L`}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge variant="outline">{bottle.capacityLiters}L</Badge>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge
                            variant={
                              (bottle.status as string) === 'filled' ? 'default' :
                                (bottle.status as string) === 'with_customer' ? 'secondary' :
                                  (bottle.status as string) === 'damaged' ? 'destructive' :
                                    'outline'
                            }
                            className="text-xs"
                          >
                            {bottle.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground capitalize">{bottle.location}</td>
                        <td className="px-3 py-2">
                          {bottle.customerName ? (
                            <span className="font-medium">{bottle.customerName}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold">
                            {bottle.fillCount || 0}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold">
                            {bottle.issueCount || 0}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground text-xs">
                          {bottle.filledDate ? new Date(bottle.filledDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground text-xs">
                          {bottle.issuedDate ? new Date(bottle.issuedDate).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {bottles.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No bottles in inventory</p>
          </div>
        )}
      </CardContent>
    </Card>

    {/* All Transactions Section */}
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Transaction History
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="daily">Today</SelectItem>
                  <SelectItem value="weekly">This Week</SelectItem>
                  <SelectItem value="monthly">This Month</SelectItem>
                  <SelectItem value="yearly">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {timeRange === 'custom' && (
              <>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-[140px] h-9"
                  />
                </div>
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-[140px] h-9"
                />
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTransactions.length > 0 ? (
          <CustomerTransactionsTable
            transactions={filteredTransactions}
            showCustomerName={!selectedCustomer}
            onPreview={openPreview}
            onViewBottles={handleViewBottles}
          />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No transactions found for the selected filters</p>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Selected Customer Details */}
    {selectedCustomer && (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {selectedCustomer.name} - Details
          </CardTitle>
          <div className="flex gap-2">
            {selectedCustomer.totalCredit > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPaymentModal(true)}
                className="gap-2"
              >
                <Banknote className="h-4 w-4" />
                Collect Payment
              </Button>
            )}
            {bottles.filter((b) => b.customerId === selectedCustomer.id).length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReturnModal(true)}
                className="gap-2"
              >
                <PackageMinus className="h-4 w-4" />
                Return Bottles
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                if (selectedCustomer) {
                  setLedgerLoading(true);
                  setShowLedgerModal(true);
                  try {
                    const res = await bottleService.getCustomerBottleLedger(selectedCustomer.id);
                    if (res.success) {
                      setLedgerData(res.data);
                    }
                  } catch (err) {
                    console.error('Failed to fetch ledger:', err);
                  } finally {
                    setLedgerLoading(false);
                  }
                }
              }}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Ledger
            </Button>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (selectedCustomer) {
                    openPreview(pdfService.getCustomerStatementUrl(selectedCustomer.id), `${selectedCustomer.name} - Statement`);
                  }
                }}
                className="gap-1 px-2"
                title="Preview Statement"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (selectedCustomer) {
                    pdfService.downloadCustomerStatement(selectedCustomer.id, selectedCustomer.name);
                  }
                }}
                className="gap-1 px-2"
                title="Download Statement"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <Button
              size="sm"
              onClick={() => setShowIssueModal(true)}
              className="gap-2"
            >
              <PackagePlus className="h-4 w-4" />
              Issue More
            </Button>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-4">
          {/* Customer's bottles */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Bottles in Customer's Possession ({selectedCustomer.bottlesInHand})
            </h4>
            <div className="flex flex-wrap gap-2">
              {bottles
                .filter((b) => b.customerId === selectedCustomer.id)
                .map((bottle) => (
                  <Badge
                    key={bottle.id}
                    variant="secondary"
                    className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                  >
                    {bottle.serialNumber} ({bottle.capacityLiters}L)
                  </Badge>
                ))}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-2">Transaction History</h4>
            <CustomerTransactionsTable
              transactions={filteredTransactions}
              showCustomerName={false}
            />
          </div>
        </CardContent>
      </Card>
    )}

    {/* All Transactions */}
    {!selectedCustomer && (
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
        <CustomerTransactionsTable transactions={transactions} />
      </div>
    )}

    {/* Add Customer Modal */}
    <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add New Customer
          </DialogTitle>
          <DialogDescription>
            Enter the customer details below to create a new customer account.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (isSubmitting) return;

            const formData = new FormData(e.currentTarget);
            const name = formData.get('name') as string;
            const phone = formData.get('phone') as string;
            const email = formData.get('email') as string;
            const address = formData.get('address') as string;

            if (!isValidSriLankanPhone(phone)) {
              toast.error('Please enter a valid Sri Lankan phone number (e.g., 077XXXXXXX)');
              return;
            }

            try {
              setIsSubmitting(true);
              const result = await customerService.create({
                name,
                phone,
                email: email || undefined,
                address: address || undefined,
              });

              setCustomers((prev) => [...prev, result]);
              setShowAddModal(false);
              // Reset form
              (e.target as HTMLFormElement).reset();
            } catch (err) {
              console.error('Failed to create customer:', err);
              // Error is handled by apiFetch toast
            } finally {
              setIsSubmitting(false);
            }
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Customer Name
            </Label>
            <Input
              name="name"
              type="text"
              required
              placeholder="Enter customer name"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Phone
            </Label>
            <Input
              name="phone"
              type="tel"
              required
              placeholder="+94 XX XXX XXXX"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email
            </Label>
            <Input
              name="email"
              type="email"
              placeholder="email@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Address
            </Label>
            <Input
              name="address"
              placeholder="Enter address"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 gap-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {isSubmitting ? 'Adding...' : 'Add Customer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Issue Bottles Modal */}
    <IssueBottleModal
      isOpen={showIssueModal}
      onClose={() => setShowIssueModal(false)}
      onIssue={handleIssueBottles}
      filledBottles={filledBottles}
      customers={customers}
      bottleTypes={bottleTypes}
    />

    {/* Return Bottles Modal */}
    <ReturnBottleModal
      isOpen={showReturnModal}
      onClose={() => setShowReturnModal(false)}
      onReturn={handleReturnBottles}
      customers={customers}
      bottlesWithCustomers={bottlesWithCustomers}
    />

    {/* Collect Payment Modal */}
    <CollectPaymentModal
      isOpen={showPaymentModal}
      onClose={() => setShowPaymentModal(false)}
      onCollect={handleCollectPayment}
      customers={customers}
    />

    {/* Bottle Ledger Modal */}
    <Dialog open={showLedgerModal} onOpenChange={setShowLedgerModal}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-1 overflow-hidden">
        <div className="flex flex-col h-full bg-background rounded-lg border overflow-hidden">
          <DialogHeader className="p-6 border-b bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Bottle Ledger</DialogTitle>
                <DialogDescription>
                  Movement history for <span className="font-semibold text-foreground">{selectedCustomer?.name}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            {ledgerLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-muted-foreground mt-4 font-medium">Fetching history...</p>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="p-4">
                  <div className="border rounded-xl overflow-hidden bg-card">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Date & Time</th>
                          <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Operation</th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Serial</th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status Change</th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {ledgerData?.ledger && ledgerData.ledger.length > 0 ? (
                          ledgerData.ledger.map((entry: any) => (
                            <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3">
                                <div className="font-medium">
                                  {new Date(entry.operationDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  {new Date(entry.operationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge
                                  variant={
                                    entry.operationType === 'issued' ? 'default' :
                                      entry.operationType === 'returned' ? 'secondary' : 'outline'
                                  }
                                  className="capitalize font-medium"
                                >
                                  {entry.operationType}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 font-mono text-xs font-semibold">{entry.serialNumber}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2 text-[11px]">
                                  <span className="text-muted-foreground line-through opacity-50">{entry.previousStatus || 'none'}</span>
                                  <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                                  <span className="font-bold text-primary">{entry.newStatus}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-[11px] text-muted-foreground max-w-[180px] break-words">
                                {entry.notes || '-'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-16 text-center">
                              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <RefreshCw className="h-10 w-10 opacity-10" />
                                <p className="font-medium text-base">No history found</p>
                                <p className="text-xs">This customer hasn't had any bottle movements yet.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>

          <div className="p-4 border-t bg-muted/10 flex justify-end">
            <Button onClick={() => setShowLedgerModal(false)} variant="secondary" className="px-8">
              Close History
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Payment Success Modal */}
    <Dialog open={showPaymentSuccess} onOpenChange={setShowPaymentSuccess}>
      <DialogContent className="sm:max-w-md text-center">
        <div className="flex flex-col items-center py-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold">Payment Collected!</DialogTitle>
            <DialogDescription className="text-base">
              Received <span className="font-bold text-foreground">Rs. {lastPayment?.amount.toLocaleString()}</span> from {lastPayment?.customerName}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 bg-muted/50 rounded-xl w-full border border-border">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Remaining Balance</span>
              <span className="font-bold">Rs. {lastPayment?.remaining.toLocaleString()}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full mt-6">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                if (lastPayment) {
                  pdfService.downloadPaymentReceipt({
                    id: lastPayment.id,
                    name: lastPayment.customerName,
                    amount: lastPayment.amount,
                    remainingBalance: lastPayment.remaining,
                    type: 'customer'
                  });
                }
              }}
            >
              <FileText className="h-4 w-4" />
              Receipt
            </Button>
            <Button onClick={() => setShowPaymentSuccess(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* PDF Preview Modal */}
    <PDFPreviewModal
      isOpen={isPreviewOpen}
      onClose={() => setIsPreviewOpen(false)}
      url={previewUrl}
      title={previewTitle}
    />

    {/* Transaction Bottle Ledger Modal */}
    <TransactionBottleLedgerModal
      isOpen={isBottleLedgerOpen}
      onClose={() => setIsBottleLedgerOpen(false)}
      transactionId={selectedTransaction?.id || ''}
      transactionType={selectedTransaction?.transactionType || ''}
      customerName={selectedTransaction?.customerName || ''}
      bottlesIn={bottleLedgerData.bottlesIn}
      bottlesOut={bottleLedgerData.bottlesOut}
    />

    {/* Customer Detail Modal */}
    <CustomerDetailModal
      isOpen={isCustomerDetailOpen}
      onClose={() => {
        setIsCustomerDetailOpen(false);
        setSelectedCustomerForDetail(null);
      }}
      customer={selectedCustomerForDetail ? {
        id: selectedCustomerForDetail.id,
        name: selectedCustomerForDetail.name,
        phone: selectedCustomerForDetail.phone,
        email: selectedCustomerForDetail.email,
        totalCredit: selectedCustomerForDetail.totalCredit,
        bottlesInHand: bottles.filter(b => b.customerId === selectedCustomerForDetail.id && b.status === 'with_customer').length,
      } : null}
      transactions={transactions}
      onViewBottles={handleViewBottles}
      onPreview={openPreview}
    />
  </div>
);
}

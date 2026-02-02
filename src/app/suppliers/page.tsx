'use client';

import { useState, useEffect, useMemo } from 'react';
import { SupplierCard } from '@/components/suppliers/SupplierCard';
import { SupplierTransactionsTable } from '@/components/suppliers/SupplierTransactionsTable';
import { SupplierPaymentsTable } from '@/components/suppliers/SupplierPaymentsTable';
import { Button, LoadingSpinner, Card, CardContent, CardHeader, CardTitle, Badge, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Separator, Alert, AlertDescription, AlertTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsList, TabsTrigger } from '@/components/ui';
import { StatCard } from '@/components/dashboard';
import { supplierService, pdfService } from '@/services';
import { Supplier, SupplierTransaction, SupplierPayment } from '@/types';
import { Factory, Droplets, Banknote, AlertTriangle, UserPlus, Phone, MapPin, CheckCircle2, FileText, Download, Receipt, ExternalLink, History, Calendar, Search, Filter, CreditCard, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PDFPreviewModal } from '@/components/shared/PDFPreviewModal';

export default function SuppliersPage() {
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<SupplierTransaction[]>([]);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [supplierForPay, setSupplierForPay] = useState<Supplier | null>(null);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [targetBalance, setTargetBalance] = useState(0);
  const [payNotes, setPayNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'audit' | 'payments'>('audit');

  // Filtering System
  const [timeRange, setTimeRange] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('all');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [globalSearch, setGlobalSearch] = useState('');

  // New states for Transaction Modal
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<SupplierTransaction | null>(null);
  const [showTxDetailModal, setShowTxDetailModal] = useState(false);

  // Payment success state
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [lastPayment, setLastPayment] = useState<{
    supplierName: string;
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [suppliersData, txnsData, paymentsData] = await Promise.all([
        supplierService.getAll(),
        supplierService.getTransactions(),
        supplierService.getPayments()
      ]);
      setSuppliers(suppliersData);
      setTransactions(txnsData);
      setPayments(paymentsData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Advanced Filtering Logic
  const filterTransactions = (txns: SupplierTransaction[]) => {
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

  const filterPayments = (pms: SupplierPayment[]) => {
    if (timeRange === 'all') return pms;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return pms.filter(p => {
      const pDate = new Date(p.paymentDate);
      switch (timeRange) {
        case 'daily': return pDate >= startOfToday;
        case 'weekly': return pDate >= startOfWeek;
        case 'monthly': return pDate >= startOfMonth;
        case 'yearly': return pDate >= startOfYear;
        case 'custom': {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          return pDate >= start && pDate <= end;
        }
        default: return true;
      }
    });
  };

  const filteredSuppliers = useMemo(() => {
    if (!globalSearch) return suppliers;
    const query = globalSearch.toLowerCase();
    return suppliers.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.id.toLowerCase().includes(query)
    );
  }, [suppliers, globalSearch]);

  const filteredTransactions = useMemo(() => {
    let result: SupplierTransaction[] = filterTransactions(transactions);
    if (globalSearch) {
      const query = globalSearch.toLowerCase();
      result = result.filter(tx =>
        tx.supplierName.toLowerCase().includes(query) ||
        tx.id.toLowerCase().includes(query)
      );
    }
    return result;
  }, [transactions, timeRange, globalSearch, startDate, endDate]);

  const supplierSpecificTransactions = useMemo(() => {
    if (!selectedSupplier) return [];
    const filtered = transactions.filter(t => t.supplierId === selectedSupplier.id);
    return filterTransactions(filtered);
  }, [transactions, selectedSupplier, timeRange, startDate, endDate]);

  const filteredPayments = useMemo(() => {
    if (!selectedSupplier) return [];
    const filtered = payments.filter(p => p.supplierId === selectedSupplier.id);
    return filterPayments(filtered);
  }, [payments, selectedSupplier, timeRange, startDate, endDate]);

  const handlePayOutstanding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForPay || !payAmount) return;

    try {
      setProcessing(true);
      const amount = parseFloat(payAmount);
      await supplierService.payOutstanding({
        supplierId: supplierForPay.id,
        amount,
        transactionId: selectedTxId || undefined,
        notes: payNotes,
      });

      setShowPayModal(false);
      setShowTxDetailModal(false);

      setLastPayment({
        supplierName: supplierForPay.name,
        amount,
        remaining: Math.max(0, targetBalance - amount),
        id: `RCP-${Date.now()}`
      });
      setShowPaymentSuccess(true);

      setPayAmount('');
      setPayNotes('');
      setSupplierForPay(null);
      setSelectedTxId(null);
      fetchData();
    } catch (err) {
      console.error('Payment failed:', err);
    } finally {
      setProcessing(false);
    }
  };

  const totalOutstanding = suppliers.reduce((sum, s) => sum + s.totalOutstanding, 0);
  const totalPaid = suppliers.reduce((sum, s) => sum + s.totalPaid, 0);
  const totalSupplied = suppliers.reduce((sum, s) => sum + s.totalSupplied, 0);

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = ["Date", "Supplier", "KG Supplied", "Total Amount", "Amount Paid", "Outstanding", "Status"];
    const csvContent = [
      headers.join(','),
      ...data.map(t => [
        new Date(t.createdAt).toLocaleDateString(),
        t.supplierName,
        t.kgSupplied,
        t.totalAmount,
        t.amountPaid,
        t.outstanding,
        t.paymentStatus
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openTransactionsModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setTimeRange('all');
    setActiveModalTab('audit');
    setShowTransactionsModal(true);
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
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/25">
            <Factory className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Suppliers Dashboard</h1>
            <p className="text-muted-foreground text-sm">Strategic procurement and financial overview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:flex gap-2" onClick={() => exportToCSV(suppliers, 'supplier_list')}>
            <Download className="h-4 w-4" /> Export List
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="gap-2 shadow-lg shadow-primary/20">
            <UserPlus className="h-4 w-4" /> Add Supplier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="h-full">
          <StatCard title="Partners" value={suppliers.length} icon={Factory} color="cyan" />
        </div>
        <div className="h-full">
          <StatCard
            title="Lifetime Supply"
            value={totalSupplied >= 1000 ? `${(totalSupplied / 1000).toFixed(2)} Tons` : `${totalSupplied.toLocaleString()} Kg`}
            icon={Droplets}
            color="green"
          />
        </div>
        <div className="h-full">
          <StatCard title="Payments" value={`Rs. ${(totalPaid / 1000).toFixed(0)}K`} icon={Banknote} color="purple" />
        </div>
        <div className="h-full">
          <StatCard title="Liability" value={`Rs. ${totalOutstanding?.toLocaleString() || '0'}`} icon={AlertTriangle} color="orange" />
        </div>
      </div>

      <Card className="border-border/50 shadow-md bg-white overflow-hidden">
        <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <History className="h-6 w-6 text-primary" />
                Organizational Oxygen Ledger
              </h2>
              <p className="text-muted-foreground text-xs font-medium">Global procurement audit and transaction history</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <Tabs value={timeRange} onValueChange={(v: any) => setTimeRange(v)} className="w-full lg:w-auto">
                <TabsList className="bg-muted/80 h-11 border border-border/50 shadow-sm w-full lg:w-auto justify-start p-1 overflow-x-auto no-scrollbar">
                  <TabsTrigger value="all" className="text-xs px-4 flex-1 lg:flex-none whitespace-nowrap">All Time</TabsTrigger>
                  <TabsTrigger value="daily" className="text-xs px-4 flex-1 lg:flex-none whitespace-nowrap">Daily</TabsTrigger>
                  <TabsTrigger value="weekly" className="text-xs px-4 flex-1 lg:flex-none whitespace-nowrap">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly" className="text-xs px-4 flex-1 lg:flex-none whitespace-nowrap">Monthly</TabsTrigger>
                  <TabsTrigger value="yearly" className="text-xs px-4 flex-1 lg:flex-none whitespace-nowrap">Yearly</TabsTrigger>
                  <TabsTrigger value="custom" className="text-xs px-4 flex-1 lg:flex-none whitespace-nowrap">Custom</TabsTrigger>
                </TabsList>
              </Tabs>

              {timeRange === 'custom' && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-10 w-[140px] text-xs bg-muted/30"
                  />
                  <Separator orientation="vertical" className="h-4" />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-10 w-[140px] text-xs bg-muted/30"
                  />
                </div>
              )}

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 h-10 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors font-bold"
                  onClick={() => openPreview(pdfService.getSupplierStatementUrl('all'), 'Global Procurement Statement')}
                >
                  <Eye className="h-4 w-4" /> View
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 h-10 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors font-bold"
                  onClick={() => exportToCSV(filteredTransactions, `global_ledger_${timeRange}`)}
                >
                  <Download className="h-4 w-4" /> CSV
                </Button>
              </div>
            </div>
          </div>

          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
            <Input
              placeholder="Deep search by supplier name, transaction ID, or notes..."
              className="pl-10 bg-muted/20 h-12 shadow-inner border-transparent rounded-2xl focus-visible:ring-primary/20 focus-visible:bg-white transition-all font-medium text-sm"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2 px-1">
            <Factory className="h-5 w-5 text-primary/80" />
            Supplier Network
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier) => (
            <div key={supplier.id} className="group" onClick={() => openTransactionsModal(supplier)}>
              <SupplierCard
                supplier={supplier}
                onClick={openTransactionsModal}
                onPreview={openPreview}
                onPay={(s) => {
                  setSupplierForPay(s);
                  setSelectedTxId(null);
                  setTargetBalance(s.totalOutstanding);
                  setPayAmount(s.totalOutstanding.toString());
                  setShowPayModal(true);
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <Card className="border-border/50 shadow-md">
        <CardContent className="p-0">
          <SupplierTransactionsTable
            transactions={filteredTransactions}
            showSearch={false}
            onPreview={openPreview}
            onRowClick={(tx) => {
              setSelectedTxForDetail(tx);
              setShowTxDetailModal(true);
            }}
            onPaymentUpdate={(tx) => {
              const supplier = suppliers.find(s => s.id === tx.supplierId);
              if (supplier) {
                setSupplierForPay(supplier);
                setSelectedTxId(tx.id);
                setTargetBalance(tx.outstanding);
                setPayAmount(tx.outstanding.toString());
                setShowPayModal(true);
              }
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={showTransactionsModal} onOpenChange={setShowTransactionsModal}>
        <DialogContent className="max-w-7xl w-[96vw] md:w-[94vw] h-[92vh] flex flex-col p-0 overflow-hidden shadow-2xl border-none">
          <DialogHeader className="p-4 md:p-6 pb-4 border-b bg-primary/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2.5 md:p-4 rounded-2xl md:rounded-3xl bg-white shadow-sm border border-primary/10 shrink-0">
                  {activeModalTab === 'audit' ? (
                    <History className="h-5 w-5 md:h-8 md:w-8 text-primary" />
                  ) : (
                    <CreditCard className="h-5 w-5 md:h-8 md:w-8 text-emerald-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-xl md:text-2xl font-black tracking-tight truncate">{selectedSupplier?.name}</DialogTitle>
                  <DialogDescription className="text-[11px] md:text-sm font-medium flex items-center gap-1.5 mt-0.5 md:mt-1">
                    <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5 shrink-0" />
                    <span className="truncate">
                      {activeModalTab === 'audit' ? 'Procurement Audit Ledger' : 'Liquid Payment History'}
                    </span>
                  </DialogDescription>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-3">
                <Tabs value={activeModalTab} onValueChange={(v: any) => setActiveModalTab(v)} className="bg-slate-100 p-1 rounded-xl">
                  <TabsList className="h-8 bg-transparent">
                    <TabsTrigger value="audit" className="text-[10px] md:text-xs">Audit Records</TabsTrigger>
                    <TabsTrigger value="payments" className="text-[10px] md:text-xs">Payment History</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Separator orientation="vertical" className="h-6 hidden md:block" />
                <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
                  <Tabs value={timeRange} onValueChange={(v: any) => setTimeRange(v)} className="scale-90 md:scale-100 origin-left">
                    <TabsList className="bg-primary/10 border border-primary/5">
                      <TabsTrigger value="all" className="px-2 md:px-4 text-[10px] md:text-sm">History</TabsTrigger>
                      <TabsTrigger value="daily" className="px-2 md:px-4 text-[10px] md:text-sm">Today</TabsTrigger>
                      <TabsTrigger value="monthly" className="px-2 md:px-4 text-[10px] md:text-sm">Month</TabsTrigger>
                      <TabsTrigger value="custom" className="px-2 md:px-4 text-[10px] md:text-sm">Custom</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {timeRange === 'custom' && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-8 w-[110px] text-[10px] bg-white border-primary/20"
                      />
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-8 w-[110px] text-[10px] bg-white border-primary/20"
                      />
                    </div>
                  )}

                  <Separator orientation="vertical" className="h-8 hidden md:block" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[10px]"
                    onClick={() => exportToCSV(activeModalTab === 'audit' ? supplierSpecificTransactions : filteredPayments, `${selectedSupplier?.name}_ledger`)}
                  >
                    <Download className="h-3 w-3 mr-1" /> CSV
                  </Button>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-[10px] bg-white"
                      onClick={() => openPreview(pdfService.getSupplierStatementUrl(selectedSupplier?.id || ''), `${selectedSupplier?.name} - Statement`)}
                    >
                      <Eye className="h-3 w-3 mr-1" /> View
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 text-[10px] shadow-sm"
                      onClick={() => pdfService.downloadSupplierStatement(selectedSupplier?.id || '', selectedSupplier?.name || 'Audit')}
                    >
                      <Download className="h-3 w-3 mr-1" /> PDF
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-4 md:p-8 bg-[#fafbfc]">
            {activeModalTab === 'audit' ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                  <Card className="shadow-sm border-none bg-white min-w-0">
                    <CardContent className="p-4 md:p-5">
                      <span className="text-[9px] md:text-[11px] font-black uppercase text-muted-foreground tracking-widest block mb-1">Lifetime Volume</span>
                      <div className="flex items-end gap-1">
                        <p className="text-xl md:text-2xl font-black text-emerald-600 leading-none">
                          {selectedSupplier && selectedSupplier.totalSupplied >= 1000
                            ? (selectedSupplier.totalSupplied / 1000).toFixed(2)
                            : selectedSupplier?.totalSupplied?.toLocaleString() || '0'}
                        </p>
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {selectedSupplier && selectedSupplier.totalSupplied >= 1000 ? 'Tons' : 'Kg'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm border-none bg-white min-w-0">
                    <CardContent className="p-4 md:p-5">
                      <span className="text-[9px] md:text-[11px] font-black uppercase text-muted-foreground tracking-widest block mb-1">Financial Inflow</span>
                      <p className="text-xl md:text-2xl font-black text-primary leading-none truncate overflow-hidden">
                        <span className="text-sm md:text-lg mr-0.5">Rs.</span>
                        {selectedSupplier?.totalPaid?.toLocaleString() || '0'}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm border-none bg-white min-w-0">
                    <CardContent className="p-4 md:p-5">
                      <span className="text-[9px] md:text-[11px] font-black uppercase text-muted-foreground tracking-widest block mb-1">Current Balance</span>
                      <p className="text-xl md:text-2xl font-black text-red-600 leading-none">
                        <span className="text-sm md:text-lg mr-0.5">Rs.</span>
                        {selectedSupplier?.totalOutstanding?.toLocaleString() || '0'}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm border-none bg-white min-w-0">
                    <CardContent className="p-4 md:p-5">
                      <span className="text-[9px] md:text-[11px] font-black uppercase text-muted-foreground tracking-widest block mb-1">Status</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={selectedSupplier?.totalOutstanding === 0 ? "default" : "destructive"} className="text-[9px] md:text-[11px] font-bold h-5 px-2">
                          {selectedSupplier?.totalOutstanding === 0 ? "Account Secure" : "Pending Assets"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden p-2">
                  <SupplierTransactionsTable
                    transactions={supplierSpecificTransactions}
                    hideSupplierColumn={true}
                    onPreview={openPreview}
                    onRowClick={(tx) => {
                      setSelectedTxForDetail(tx);
                      setShowTxDetailModal(true);
                    }}
                    onPaymentUpdate={(tx) => {
                      setSupplierForPay(selectedSupplier);
                      setSelectedTxId(tx.id);
                      setTargetBalance(tx.outstanding);
                      setPayAmount(tx.outstanding.toString());
                      setShowPayModal(true);
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black tracking-tight text-slate-800">Part-by-Part Settlement Ledger</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold">
                      {filteredPayments.length} Installments
                    </Badge>
                  </div>
                </div>
                <SupplierPaymentsTable payments={filteredPayments} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTxDetailModal} onOpenChange={setShowTxDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Receipt className="h-6 w-6 text-primary" />
              Detailed Transaction Audit
            </DialogTitle>
          </DialogHeader>

          {selectedTxForDetail && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-muted/30 p-6 rounded-2xl border border-border">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Source</span>
                  <p className="font-bold text-base">{selectedTxForDetail.supplierName}</p>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Audit Date</span>
                  <p className="font-medium text-sm">{new Date(selectedTxForDetail.createdAt || Date.now()).toLocaleString()}</p>
                </div>
                <Separator className="col-span-2 opacity-50" />
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Supply Volume</span>
                  <p className="font-black text-xl text-emerald-600">{selectedTxForDetail.kgSupplied?.toLocaleString() || '0'} <span className="text-xs">Kg</span></p>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Market Rate</span>
                  <p className="font-bold">Rs. {selectedTxForDetail.pricePerKg?.toLocaleString() || '0'}/Kg</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-white border border-border rounded-xl text-center shadow-sm">
                  <span className="text-[9px] font-black text-muted-foreground uppercase block mb-1">Invoice Total</span>
                  <p className="font-bold">Rs. {selectedTxForDetail.totalAmount?.toLocaleString() || '0'}</p>
                </div>
                <div className="p-4 bg-white border border-border rounded-xl text-center shadow-sm">
                  <span className="text-[9px] font-black text-muted-foreground uppercase block mb-1">Settled</span>
                  <p className="font-bold text-emerald-600">Rs. {selectedTxForDetail.amountPaid?.toLocaleString() || '0'}</p>
                </div>
                <div className="p-4 bg-white border border-border rounded-xl text-center shadow-sm border-red-100">
                  <span className="text-[9px] font-black text-muted-foreground uppercase block mb-1">Unpaid</span>
                  <p className="font-bold text-red-600">Rs. {selectedTxForDetail.outstanding?.toLocaleString() || '0'}</p>
                </div>
              </div>

              {selectedTxForDetail.outstanding > 0 && (
                <div className="p-6 border-2 border-emerald-500/10 bg-emerald-50/30 rounded-3xl space-y-4">
                  <h4 className="text-sm font-black uppercase text-emerald-800 tracking-wider flex items-center gap-2">
                    <Banknote className="h-4 w-4" /> Record Settlement
                  </h4>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="txPayAmount" className="text-xs font-bold text-emerald-700">Amount (LKR)</Label>
                      <Input
                        id="txPayAmount"
                        type="number"
                        placeholder="0.00"
                        className="font-black text-xl h-12 bg-white border-emerald-200"
                        max={selectedTxForDetail.outstanding}
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                      />
                    </div>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 h-12 px-10 font-bold shadow-lg shadow-emerald-600/20"
                      onClick={() => {
                        const supplier = suppliers.find(s => s.id === selectedTxForDetail.supplierId);
                        if (supplier) {
                          setSupplierForPay(supplier);
                          setSelectedTxId(selectedTxForDetail.id);
                          setTargetBalance(selectedTxForDetail.outstanding);
                          setPayAmount(selectedTxForDetail.outstanding.toString());
                          setShowPayModal(true);
                        }
                      }}
                    >
                      Pay Now
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t font-medium">
                <Button variant="ghost" className="h-11" onClick={() => setShowTxDetailModal(false)}>Dismiss</Button>
                <Button className="h-11 gap-2 bg-slate-900" onClick={() => pdfService.viewPaymentReceipt({
                  id: selectedTxForDetail.id,
                  name: selectedTxForDetail.supplierName,
                  amount: selectedTxForDetail.amountPaid,
                  type: 'supplier',
                  method: 'cash',
                  remainingBalance: selectedTxForDetail.outstanding
                })}>
                  <Receipt className="h-4 w-4" /> View Voucher
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Onboard Supplier
            </DialogTitle>
            <DialogDescription>
              Initialize new supplier partnership profile
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const formData = new FormData(e.currentTarget);
                const supplierData = {
                  name: formData.get('name') as string,
                  phone: formData.get('phone') as string,
                  phone2: formData.get('phone2') as string,
                  email: formData.get('email') as string,
                  address: formData.get('address') as string,
                };
                const newSupplier = await supplierService.create(supplierData);
                setSuppliers((prev) => [...prev, newSupplier]);
                setShowAddModal(false);
              } catch (err) {
                console.error('Failed to create supplier:', err);
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Supplier Entity Name</Label>
              <Input id="name" name="name" required placeholder="e.g. Acme Oxygen Corp" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Primary Contact</Label>
                <Input id="phone" name="phone" type="tel" required placeholder="+94..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone2" className="opacity-70">Secondary Contact</Label>
                <Input id="phone2" name="phone2" type="tel" placeholder="Mobile/Alt" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Official Email</Label>
              <Input id="email" name="email" type="email" placeholder="billing@supplier.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Registered Address</Label>
              <textarea
                id="address"
                name="address"
                className="w-full border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                placeholder="HQ Address..."
                rows={2}
              />
            </div>
            <Separator />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">Back</Button>
              <Button type="submit" className="flex-1 font-bold">Register Supplier</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showPayModal} onOpenChange={setShowPayModal}>
        <DialogContent className="max-w-md p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center gap-3 text-2xl font-black text-emerald-700">
              <Banknote className="h-8 w-8" />
              Confirm Payment
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePayOutstanding} className="space-y-6">
            <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-200/50 text-center">
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block mb-1">Verified Outstanding Balance</span>
              <span className="text-3xl font-black text-emerald-950">
                Rs. {targetBalance.toLocaleString()}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount" className="text-sm font-black uppercase text-slate-500 tracking-wider">Payment Amount (LKR)</Label>
                {payAmount && parseFloat(payAmount) > 0 && (
                  <Badge variant={parseFloat(payAmount) < targetBalance ? "secondary" : "default"} className="h-5 text-[10px] font-bold">
                    {parseFloat(payAmount) < targetBalance ? "Partial Payment" : "Full Settlement"}
                  </Badge>
                )}
              </div>
              <Input
                id="amount"
                type="number"
                required
                min="1"
                max={targetBalance}
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="text-3xl font-black h-16 border-2 border-emerald-200 focus-visible:ring-emerald-500 transition-all rounded-2xl text-center"
              />
              <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
                Press confirm to record this transaction
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payNotes" className="text-xs font-bold text-slate-500">Transaction Notes</Label>
              <Input
                id="payNotes"
                className="h-11 rounded-xl bg-slate-50 border-slate-200"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="Method, Bank Ref, etc."
              />
            </div>

            <div className="flex gap-3 pt-6">
              <Button type="button" variant="ghost" onClick={() => setShowPayModal(false)} className="flex-1 h-12" disabled={processing}>Cancel</Button>
              <Button type="submit" className="flex-[2] h-12 bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 font-black" disabled={processing || !payAmount || parseFloat(payAmount) <= 0}>
                {processing ? <LoadingSpinner size="sm" /> : 'Confirm Payment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentSuccess} onOpenChange={setShowPaymentSuccess}>
        <DialogContent className="sm:max-w-md text-center p-10">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-8 shadow-inner ring-8 ring-emerald-50">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
            </div>
            <DialogHeader className="text-center space-y-2">
              <DialogTitle className="text-3xl font-black text-emerald-900 leading-tight">Payment Recorded!</DialogTitle>
              <DialogDescription className="text-lg font-medium text-emerald-800">
                Processed Rs. <span className="font-extrabold text-black">{lastPayment?.amount?.toLocaleString() || '0'}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="mt-8 p-6 bg-slate-50 rounded-3xl w-full border border-slate-100 grid grid-cols-2 gap-4">
              <div className="text-left">
                <span className="text-[9px] font-black text-slate-400 uppercase block tracking-widest mb-1">Entity</span>
                <span className="font-bold text-slate-900">{lastPayment?.supplierName}</span>
              </div>
              <div className="text-right border-l border-slate-200 pl-4">
                <span className="text-[9px] font-black text-slate-400 uppercase block tracking-widest mb-1">New Balance</span>
                <span className="font-bold text-red-600">Rs. {lastPayment?.remaining?.toLocaleString() || '0'}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full mt-10">
              <Button
                variant="outline"
                className="gap-2 h-12 rounded-2xl border-2 border-emerald-100"
                onClick={() => {
                  if (lastPayment) {
                    pdfService.downloadPaymentReceipt({
                      id: lastPayment.id,
                      name: lastPayment.supplierName,
                      amount: lastPayment.amount,
                      remainingBalance: lastPayment.remaining,
                      type: 'supplier'
                    });
                  }
                }}
              >
                <FileText className="h-5 w-5" /> Download Receipt
              </Button>
              <Button onClick={() => setShowPaymentSuccess(false)} className="h-12 rounded-2xl shadow-lg ring-4 ring-primary/5">
                Back to Dashboard
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
    </div>
  );
}

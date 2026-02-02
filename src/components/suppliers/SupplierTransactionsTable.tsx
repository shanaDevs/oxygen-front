import { useState, useMemo } from 'react';
import { SupplierTransaction } from '@/types';
import { Card, CardContent, Badge, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui';
import { FileText, ChevronLeft, ChevronRight, Search, Settings2, Check, Eye, Download } from 'lucide-react';
import { pdfService } from '@/services';
import { cn } from '@/lib/utils';

interface SupplierTransactionsTableProps {
  transactions: SupplierTransaction[];
  onPaymentUpdate?: (transaction: SupplierTransaction) => void;
  onRowClick?: (transaction: SupplierTransaction) => void;
  onPreview?: (url: string, title: string) => void;
  showSearch?: boolean;
  hideSupplierColumn?: boolean;
}

type ColumnKey = 'date' | 'supplier' | 'liters' | 'total' | 'paid' | 'outstanding' | 'status' | 'actions';

export function SupplierTransactionsTable({
  transactions,
  onPaymentUpdate,
  onRowClick,
  onPreview,
  showSearch = true,
  hideSupplierColumn = false,
}: SupplierTransactionsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<string>('25');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>({
    date: false,
    supplier: !hideSupplierColumn,
    liters: true,
    total: true,
    paid: true,
    outstanding: true,
    status: false,
    actions: true,
  });

  const columns: { key: ColumnKey; label: string; align?: 'left' | 'right' | 'center' }[] = [
    { key: 'date', label: 'Date' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'liters', label: 'Quantity (Kg)', align: 'right' },
    { key: 'total', label: 'Total (LKR)', align: 'right' },
    { key: 'paid', label: 'Paid (LKR)', align: 'right' },
    { key: 'outstanding', label: 'Outstanding', align: 'right' },
    { key: 'status', label: 'Status', align: 'center' },
    { key: 'actions', label: 'Actions', align: 'center' },
  ];

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'full': return 'default';
      case 'partial': return 'secondary';
      case 'outstanding':
      case 'pending': return 'destructive';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter and Search Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const query = searchQuery.toLowerCase();
      return (
        tx.supplierName.toLowerCase().includes(query) ||
        (tx.notes?.toLowerCase() || '').includes(query) ||
        tx.id.toLowerCase().includes(query)
      );
    });
  }, [transactions, searchQuery]);

  // Pagination Logic
  const paginatedTransactions = useMemo(() => {
    if (pageSize === 'all') return filteredTransactions;
    const size = parseInt(pageSize);
    const start = (currentPage - 1) * size;
    return filteredTransactions.slice(start, start + size);
  }, [filteredTransactions, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    if (pageSize === 'all') return 1;
    return Math.ceil(filteredTransactions.length / parseInt(pageSize));
  }, [filteredTransactions, pageSize]);

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardContent className="p-0 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
          <div className="flex flex-wrap items-center gap-3">
            {showSearch && (
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-9 h-9"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Show:</span>
              <Select value={pageSize} onValueChange={(val) => { setPageSize(val); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 w-[80px]">
                  <SelectValue placeholder="25" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <Settings2 className="h-4 w-4" /> Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 p-2" align="end">
                <div className="space-y-1">
                  {columns.map(col => (
                    <div
                      key={col.key}
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer text-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleColumn(col.key);
                      }}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border border-primary flex items-center justify-center transition-colors",
                        visibleColumns[col.key] ? "bg-primary border-primary" : "bg-transparent border-input"
                      )}>
                        {visibleColumns[col.key] && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className={cn(visibleColumns[col.key] ? "font-medium" : "text-muted-foreground")}>
                        {col.label}
                      </span>
                    </div>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="text-sm text-muted-foreground hidden sm:block">
              Total {filteredTransactions.length} records
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                {columns.map(col => visibleColumns[col.key] && (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider",
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-4 py-8 text-center text-muted-foreground">
                    No transactions matching your search
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className={cn(
                      "transition-colors",
                      onRowClick ? "cursor-pointer hover:bg-muted/50" : "hover:bg-muted/30"
                    )}
                    onClick={() => onRowClick?.(tx)}
                  >
                    {visibleColumns.date && (
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(tx.createdAt)}
                      </td>
                    )}
                    {visibleColumns.supplier && (
                      <td className="px-4 py-3 text-sm font-medium">
                        {tx.supplierName}
                      </td>
                    )}
                    {visibleColumns.liters && (
                      <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                        <span className="font-medium text-emerald-600">
                          {(tx.kgSupplied || 0) >= 1000
                            ? `${((tx.kgSupplied || 0) / 1000).toFixed(2)}`
                            : (tx.kgSupplied || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] ml-1 text-muted-foreground">
                          {(tx.kgSupplied || 0) >= 1000 ? 'Tons' : 'Kg'}
                        </span>
                      </td>
                    )}
                    {visibleColumns.total && (
                      <td className="px-4 py-3 text-sm font-bold text-right whitespace-nowrap">
                        {tx.totalAmount?.toLocaleString() || '0'}
                      </td>
                    )}
                    {visibleColumns.paid && (
                      <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400 text-right font-bold whitespace-nowrap">
                        {tx.amountPaid?.toLocaleString() || '0'}
                      </td>
                    )}
                    {visibleColumns.outstanding && (
                      <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                        {tx.outstanding > 0 ? (
                          <span className="text-red-500 font-black">
                            {tx.outstanding?.toLocaleString() || '0'}
                          </span>
                        ) : (
                          <span className="text-emerald-500 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Paid</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="px-4 py-3 text-center">
                        <Badge variant={getStatusVariant(tx.paymentStatus)} className="capitalize h-5 text-[10px]">
                          {tx.paymentStatus}
                        </Badge>
                      </td>
                    )}
                    {visibleColumns.actions && (
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          {tx.outstanding > 0 && onPaymentUpdate && (
                            <Button
                              variant="default"
                              size="sm"
                              className="h-7 px-3 text-[10px] font-bold uppercase bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => onPaymentUpdate(tx)}
                            >
                              Pay
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:bg-primary/10"
                            title="Preview Receipt"
                            onClick={() => {
                              const url = pdfService.getPaymentReceiptUrl({
                                id: tx.id,
                                name: tx.supplierName,
                                amount: tx.amountPaid,
                                type: 'supplier',
                                method: 'cash',
                                remainingBalance: tx.outstanding
                              });
                              onPreview?.(url, `Receipt - ${tx.id.split('-').pop()}`);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:bg-slate-100"
                            title="Download Receipt"
                            onClick={() => pdfService.downloadPaymentReceipt({
                              id: tx.id,
                              name: tx.supplierName,
                              amount: tx.amountPaid,
                              type: 'supplier',
                              method: 'cash',
                              remainingBalance: tx.outstanding
                            })}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 px-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <div className="flex items-center gap-1.5 mx-2">
              <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 gap-1"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

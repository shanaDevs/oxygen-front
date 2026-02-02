'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { BottleGrid } from '@/components/bottles/BottleGrid';
import { FillBottlesModal } from '@/components/bottles/FillBottlesModal';
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
  DialogFooter,
  Separator,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
  AlertTitle,
  ScrollArea,
} from '@/components/ui';
import { StatCard } from '@/components/dashboard';
import { bottleService, bottleTypeService, tankService } from '@/services';
import { OxygenBottle, MainTank, BottleType, BottleFillHistory, BottleLedgerEntry } from '@/types';
import { cn } from '@/lib/utils';
import {
  Container,
  CircleCheck,
  CircleDot,
  Package,
  FlaskConical,
  Plus,
  AlertTriangle,
  History,
  Clock,
  Search,
  RefreshCw,
  Scan,
  ArrowDownToLine,
  FileText,
  User,
  Calendar,
  CheckCircle2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { pdfService } from '@/services';

export default function BottlesPage() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bottles, setBottles] = useState<OxygenBottle[]>([]);
  const [tank, setTank] = useState<MainTank | null>(null);
  const [filter, setFilter] = useState<'all' | 'empty' | 'filled' | 'with_customer'>('all');
  const [showFillModal, setShowFillModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [bottleTypes, setBottleTypes] = useState<BottleType[]>([]);
  const [selectedBottle, setSelectedBottle] = useState<OxygenBottle | null>(null);
  const [fillHistory, setFillHistory] = useState<BottleFillHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [ledgerEntries, setLedgerEntries] = useState<BottleLedgerEntry[]>([]);
  const [showBulkReceiveModal, setShowBulkReceiveModal] = useState(false);
  const [bulkReceiveData, setBulkReceiveData] = useState<Record<string, number>>({});
  const [bulkReceiveCustomer, setBulkReceiveCustomer] = useState<string>('');
  const [customers, setCustomers] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [btlsRes, tnkRes, historyRes, typesRes] = await Promise.all([
        bottleService.getAll(),
        tankService.getStatus(),
        bottleService.getFillHistory(10),
        bottleTypeService.getAll(true),
      ]);

      // Handle ApiResponse format
      setBottles(btlsRes.data || []);
      setTank(tnkRes);
      setFillHistory(historyRes.data || []);
      setBottleTypes(typesRes.data || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate stats
  const emptyBottles = useMemo(() => bottles.filter((b) => b.status === 'empty'), [bottles]);
  const filledBottles = useMemo(() => bottles.filter((b) => b.status === 'filled'), [bottles]);
  const bottlesWithCustomers = useMemo(() => bottles.filter((b) => b.status === 'with_customer'), [bottles]);
  const inCenterBottles = useMemo(() => bottles.filter((b) => b.location === 'center'), [bottles]);

  // Filter bottles by search and status
  const filteredBottles = useMemo(() => {
    let result = filter === 'all' ? bottles : bottles.filter((b) => b.status === filter);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.serialNumber.toLowerCase().includes(query) ||
        b.customerName?.toLowerCase().includes(query) ||
        b.capacityLiters.toString().includes(query)
      );
    }

    return result;
  }, [bottles, filter, searchQuery]);

  // Group by capacity
  const bottlesBySize = useMemo(() => {
    return bottles.reduce((acc, b) => {
      const key = b.capacityLiters;
      if (!acc[key]) acc[key] = { filled: 0, empty: 0, with_customer: 0, total: 0, maintenance: 0, retired: 0 };
      if (acc[key][b.status] !== undefined) {
        acc[key][b.status]++;
      }
      acc[key].total++;
      return acc;
    }, {} as Record<number, Record<string, number>>);
  }, [bottles]);

  // Get bottle type for a bottle
  const getBottleType = (bottle: OxygenBottle): BottleType | undefined => {
    if (bottle.bottleType) return bottle.bottleType;
    return bottleTypes.find(t =>
      t.id === bottle.bottleTypeId ||
      t.capacityLiters === bottle.capacityLiters
    );
  };

  const handleFillBottles = async (bottleIds: string[], bottleType: string, kgUsed: number) => {
    try {
      setProcessing(true);
      const result = await bottleService.fillBottles(bottleIds);

      if (result.success) {
        toast.success(`${bottleIds.length} bottles filled successfully! Tank level: ${result.tankLevel?.toFixed(1) || 'N/A'} kg`);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to fill bottles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fill bottles');
    } finally {
      setProcessing(false);
      setShowFillModal(false);
    }
  };

  const handleAddBottle = async (data: { serialNumber: string; capacityLiters: number; bottleTypeId?: string; ownerId?: string; ownerName?: string }) => {
    try {
      setProcessing(true);
      const result = await bottleService.create(data);

      if (result.success && result.data) {
        toast.success(`Bottle ${data.serialNumber} added successfully!`);
        setBottles((prev) => [...prev, result.data!]);
      }
    } catch (err) {
      console.error('Failed to add bottle:', err);
      setError(err instanceof Error ? err.message : 'Failed to add bottle');
    } finally {
      setProcessing(false);
      setShowAddModal(false);
    }
  };

  const handleReceiveBottle = async (data: { serialNumber: string; bottleTypeId?: string; customerId?: string; notes?: string }) => {
    try {
      setProcessing(true);
      const result = await bottleService.receiveBottle(data);

      if (result.success && result.data) {
        toast.success(`Bottle ${data.serialNumber} received successfully!`);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to receive bottle:', err);
      setError(err instanceof Error ? err.message : 'Failed to receive bottle');
    } finally {
      setProcessing(false);
      setShowReceiveModal(false);
    }
  };

  const handleBulkReceive = async () => {
    try {
      setProcessing(true);
      const items = Object.entries(bulkReceiveData)
        .filter(([_, count]) => count > 0)
        .map(([typeId, count]) => ({ bottleTypeId: typeId, count }));

      if (items.length === 0) return;

      const result = await bottleService.receiveBulk({
        items,
        customerId: bulkReceiveCustomer || undefined,
        notes: 'Bulk receive from management page'
      });

      if (result.success) {
        toast.success(`Successfully received ${result.data?.count} bottles!`);
        setBulkReceiveData({});
        setBulkReceiveCustomer('');
        fetchData();
      }
    } catch (err) {
      console.error('Failed bulk receive:', err);
      setError(err instanceof Error ? err.message : 'Failed bulk receive');
    } finally {
      setProcessing(false);
      setShowBulkReceiveModal(false);
    }
  };

  const fetchBottleLedger = async (bottleId: string) => {
    try {
      const result = await bottleService.getBottleLedger(bottleId);
      if (result.success && result.data) {
        setLedgerEntries(result.data.ledger || []);
      }
    } catch (err) {
      console.error('Failed to fetch bottle ledger:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !bottles.length) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => fetchData()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25">
            <Container className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bottle Management</h1>
            <p className="text-muted-foreground">Track and manage all oxygen bottles by serial number</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => fetchData()} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Link href="/bottle-types">
            <Button variant="outline" size="sm" className="gap-2">
              <Container className="h-4 w-4" />
              Categories
            </Button>
          </Link>
          <Button onClick={() => setShowReceiveModal(true)} variant="outline" className="gap-2">
            <Scan className="h-4 w-4" />
            Receive
          </Button>
          <Button onClick={() => setShowBulkReceiveModal(true)} variant="outline" className="gap-2">
            <ArrowDownToLine className="h-4 w-4" />
            Bulk Intake
          </Button>
          <Button onClick={() => setShowFillModal(true)} variant="outline" className="gap-2 text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100">
            <FlaskConical className="h-4 w-4" />
            Fill Bottles
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="gap-2 shadow-lg shadow-emerald-500/20">
            <Plus className="h-4 w-4" />
            Add Bottle
          </Button>
        </div>
      </div>


      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Bottles"
          value={bottles.length}
          icon={Container}
          color="cyan"
        />
        <StatCard
          title="In Center"
          value={inCenterBottles.length}
          icon={Package}
          color="blue"
          description="Available in center"
        />
        <StatCard
          title="Filled (Ready)"
          value={filledBottles.length}
          icon={CircleCheck}
          color="green"
          description="Ready for sale"
        />
        <StatCard
          title="Empty"
          value={emptyBottles.length}
          icon={CircleDot}
          color="orange"
          description="Need refilling"
        />
        <StatCard
          title="With Customers"
          value={bottlesWithCustomers.length}
          icon={User}
          color="purple"
          description="Out for use"
        />
      </div>

      {/* Tank Level Alert */}
      {tank && typeof tank.percentFull === 'number' && tank.percentFull < 30 && (
        <Alert variant="destructive" className="border-amber-200 bg-amber-50 text-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Low Tank Level</AlertTitle>
          <AlertDescription className="text-amber-700">
            Tank is at {Number(tank.percentFull).toFixed(1)}% ({Number(tank.currentLevelKg || 0).toFixed(1)} kg). Consider refilling soon.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary by Size */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Inventory by Size</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(bottlesBySize)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([size, counts]) => {
                const type = bottleTypes.find(t => t.capacityLiters.toString() === size);
                return (
                  <div key={size} className="bg-muted/50 rounded-xl p-3 hover:bg-muted transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold">{size}L</span>
                      <Badge variant="secondary" className="text-xs">{counts.total}</Badge>
                    </div>
                    {type && (
                      <p className="text-xs text-muted-foreground mb-2">{type.name}</p>
                    )}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>Filled</span>
                        </div>
                        <span className="font-medium">{counts.filled}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-gray-400" />
                          <span>Empty</span>
                        </div>
                        <span className="font-medium">{counts.empty}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span>Out</span>
                        </div>
                        <span className="font-medium">{counts.with_customer}</span>
                      </div>
                    </div>
                    {type?.pricePerFill && (
                      <p className="text-xs text-primary font-medium mt-2">Rs. {type.pricePerFill}/fill</p>
                    )}
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by serial number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 bg-card p-1.5 rounded-xl shadow-sm border flex-wrap">
          {[
            { key: 'all', label: 'All', count: bottles.length },
            { key: 'filled', label: 'Filled', count: filledBottles.length, color: 'green' },
            { key: 'empty', label: 'Empty', count: emptyBottles.length, color: 'gray' },
            { key: 'with_customer', label: 'With Customers', count: bottlesWithCustomers.length, color: 'blue' },
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={filter === tab.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter(tab.key as typeof filter)}
              className="gap-2"
            >
              {tab.label}
              <Badge variant={filter === tab.key ? 'secondary' : 'outline'} className="text-xs">
                {tab.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Fill History */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Recent Fill History</CardTitle>
            </div>
            <Badge variant="secondary">{fillHistory.length} records</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {fillHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No fill history yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date & Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Bottle</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Capacity</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Kg Used</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {fillHistory.map((record) => (
                    <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(record.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{record.serialNumber || record.bottleSerialNumber}</td>
                      <td className="px-4 py-3 text-sm text-right">{record.capacityLiters || record.bottleCapacity}L</td>
                      <td className="px-4 py-3 text-sm text-right text-emerald-600 dark:text-emerald-400 font-medium">
                        -{record.kgUsed || record.litersUsed}kg
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottle Grid */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Bottles ({filteredBottles.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <BottleGrid
            bottles={filteredBottles}
            filter="all"
            onBottleClick={(bottle) => {
              setSelectedBottle(bottle);
              fetchBottleLedger(bottle.id);
            }}
          />
        </CardContent>
      </Card>

      {/* Selected Bottle Details */}
      <Dialog open={!!selectedBottle} onOpenChange={() => setSelectedBottle(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Bottle Details
            </DialogTitle>
          </DialogHeader>

          {selectedBottle && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-24 relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-3 bg-gray-600 rounded-t" />
                  <div
                    className={cn(
                      "absolute top-3 inset-x-0 bottom-0 rounded-b-xl",
                      selectedBottle.status === 'filled' && 'bg-gradient-to-t from-green-400 to-green-200',
                      selectedBottle.status === 'with_customer' && 'bg-gradient-to-t from-blue-400 to-blue-200',
                      selectedBottle.status === 'empty' && 'bg-gray-200'
                    )}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xl font-bold">{selectedBottle.serialNumber}</p>
                  <p className="text-muted-foreground">{selectedBottle.capacityLiters}L Capacity</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant={
                        selectedBottle.status === 'filled' ? 'default' :
                          selectedBottle.status === 'with_customer' ? 'secondary' : 'outline'
                      }
                      className={cn(
                        selectedBottle.status === 'filled' && 'bg-green-500',
                        selectedBottle.status === 'with_customer' && 'bg-blue-500 text-white'
                      )}
                    >
                      {selectedBottle.status === 'filled' ? 'Filled' :
                        selectedBottle.status === 'with_customer' ? 'With Customer' : 'Empty'}
                    </Badge>
                    {selectedBottle.fillCount !== undefined && (
                      <Badge variant="outline">
                        {selectedBottle.fillCount} fills
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottle Type Info */}
              {getBottleType(selectedBottle) && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Bottle Type</p>
                  <p className="font-medium">{getBottleType(selectedBottle)?.name}</p>
                  <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                    <span>Refill: {getBottleType(selectedBottle)?.refillKg}kg</span>
                    <span>Price: Rs. {getBottleType(selectedBottle)?.pricePerFill}</span>
                  </div>
                </div>
              )}

              {selectedBottle.status === 'with_customer' && selectedBottle.customerName && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-900">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <p className="text-sm text-muted-foreground">Currently with:</p>
                  </div>
                  <p className="font-semibold mt-1">{selectedBottle.customerName}</p>
                  {selectedBottle.issuedDate && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Issued: {new Date(selectedBottle.issuedDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}

              {selectedBottle.filledDate && selectedBottle.status === 'filled' && (
                <div className="p-4 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-muted-foreground">Filled on:</p>
                  </div>
                  <p className="font-semibold mt-1">
                    {new Date(selectedBottle.filledDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Ledger History */}
              {ledgerEntries.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Recent Activity
                  </p>
                  <ScrollArea className="h-32">
                    <div className="space-y-2">
                      {ledgerEntries.slice(0, 5).map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                          <span className="capitalize">{entry.operationType?.replace('_', ' ')}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => pdfService.downloadBottleLedger(selectedBottle.id, selectedBottle.serialNumber)}
                  className="flex-1 gap-2 border-primary/20 text-primary hover:bg-primary/5"
                >
                  <FileText className="h-4 w-4" />
                  Ledger
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedBottle(null)}
                  className="flex-1"
                >
                  Close
                </Button>
                {selectedBottle.status === 'empty' && (
                  <Button
                    onClick={() => {
                      setSelectedBottle(null);
                      setShowFillModal(true);
                    }}
                    className="flex-1"
                  >
                    Fill This Bottle
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Bottle Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Bottle</DialogTitle>
            <DialogDescription>Register a new bottle in the system</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const typeId = formData.get('bottleTypeId') as string;
              const type = bottleTypes.find(t => t.id === typeId);
              handleAddBottle({
                serialNumber: formData.get('serialNumber') as string,
                capacityLiters: type?.capacityLiters || 40,
                bottleTypeId: typeId,
                ownerName: formData.get('ownerName') as string || undefined,
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number *</Label>
              <Input
                id="serialNumber"
                name="serialNumber"
                required
                placeholder="e.g., OXY-40L-0025"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bottleTypeId">Bottle Type *</Label>
              <Select name="bottleTypeId" defaultValue={bottleTypes[0]?.id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bottle type" />
                </SelectTrigger>
                <SelectContent>
                  {bottleTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} - {type.capacityLiters}L (Rs. {type.pricePerFill} per fill)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner (Optional)</Label>
              <Input
                id="ownerName"
                name="ownerName"
                placeholder="Leave empty if center-owned"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="flex-1"
                disabled={processing}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={processing}>
                {processing ? <LoadingSpinner size="sm" /> : 'Add Bottle'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Receive Bottle Modal */}
      <Dialog open={showReceiveModal} onOpenChange={setShowReceiveModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Receive Bottle</DialogTitle>
            <DialogDescription>Register an empty bottle returned or brought in</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleReceiveBottle({
                serialNumber: formData.get('serialNumber') as string,
                bottleTypeId: formData.get('bottleTypeId') as string || undefined,
                notes: formData.get('notes') as string || undefined,
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="receiveSerial">Serial Number *</Label>
              <Input
                id="receiveSerial"
                name="serialNumber"
                required
                placeholder="Scan or enter serial number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiveType">Bottle Type (for new bottles)</Label>
              <Select name="bottleTypeId">
                <SelectTrigger>
                  <SelectValue placeholder="Select if new bottle" />
                </SelectTrigger>
                <SelectContent>
                  {bottleTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} - {type.capacityLiters}L
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                name="notes"
                placeholder="Optional notes"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowReceiveModal(false)}
                className="flex-1"
                disabled={processing}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={processing}>
                {processing ? <LoadingSpinner size="sm" /> : 'Receive Bottle'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Fill Bottles Modal */}
      {tank && (
        <FillBottlesModal
          isOpen={showFillModal}
          onClose={() => setShowFillModal(false)}
          onFill={handleFillBottles}
          emptyBottles={emptyBottles.filter(b => b.location === 'center')}
          bottleTypes={bottleTypes}
          tankLevel={tank.currentLevelKg}
        />
      )}

      {/* Bulk Receive Modal */}
      <Dialog open={showBulkReceiveModal} onOpenChange={setShowBulkReceiveModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5 text-primary" />
              Bulk Bottle Intake
            </DialogTitle>
            <DialogDescription>Add bottle counts by category (type) for quick receiving</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Target Location / Customer (Optional)</Label>
              <Input
                placeholder="Enter customer name or center ID..."
                value={bulkReceiveCustomer}
                onChange={(e) => setBulkReceiveCustomer(e.target.value)}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-xs uppercase font-bold text-muted-foreground">Bottle Categories</Label>
              <div className="grid gap-3">
                {bottleTypes.map(type => (
                  <div key={type.id} className="flex items-center justify-between p-3 border rounded-xl bg-muted/30">
                    <div>
                      <p className="font-semibold text-sm">{type.name}</p>
                      <p className="text-[10px] text-muted-foreground">{type.capacityLiters}L Capacity</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        className="w-20 h-9 text-center font-bold"
                        value={bulkReceiveData[type.id] || 0}
                        onChange={(e) => setBulkReceiveData(prev => ({ ...prev, [type.id]: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 flex justify-between items-center">
                <span className="text-sm font-medium">Total Bottles to Receive</span>
                <span className="text-lg font-bold text-primary">
                  {Object.values(bulkReceiveData).reduce((a, b) => a + b, 0)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowBulkReceiveModal(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkReceive}
              className="gap-2"
              disabled={processing || Object.values(bulkReceiveData).reduce((a, b) => a + b, 0) === 0}
            >
              {processing ? <LoadingSpinner size="sm" /> : <Plus className="h-4 w-4" />}
              Receive Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

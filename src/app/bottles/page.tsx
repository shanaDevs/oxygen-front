'use client';

import { useState, useEffect } from 'react';
import { BottleGrid } from '@/components/bottles/BottleGrid';
import { BottleCard } from '@/components/bottles/BottleCard';
import { FillBottlesModal } from '@/components/bottles/FillBottlesModal';
import { Button, LoadingSpinner, Card, CardContent, CardHeader, CardTitle, Badge, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Separator, Tabs, TabsContent, TabsList, TabsTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Alert, AlertDescription, AlertTitle } from '@/components/ui';
import { StatCard } from '@/components/dashboard';
import { bottleService, tankService } from '@/services';
import { bottleTypes } from '@/data';
import { OxygenBottle, MainTank, BottleType, BottleFillHistory } from '@/types';
import { Container, CircleCheck, CircleDot, Package, FlaskConical, Plus, AlertTriangle, History, Clock } from 'lucide-react';

export default function BottlesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bottles, setBottles] = useState<OxygenBottle[]>([]);
  const [tank, setTank] = useState<MainTank | null>(null);
  const [filter, setFilter] = useState<'all' | 'empty' | 'filled' | 'with_customer'>('all');
  const [showFillModal, setShowFillModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBottle, setSelectedBottle] = useState<OxygenBottle | null>(null);
  const [fillHistory, setFillHistory] = useState<BottleFillHistory[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [btls, tnk, history] = await Promise.all([
        bottleService.getAll(),
        tankService.getStatus(),
        bottleService.getFillHistory(10),
      ]);
      setBottles(btls);
      setTank(tnk);
      setFillHistory(history);
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

  const emptyBottles = bottles.filter((b) => b.status === 'empty');
  const filledBottles = bottles.filter((b) => b.status === 'filled');
  const bottlesWithCustomers = bottles.filter((b) => b.status === 'with_customer');

  const handleFillBottles = async (bottleIds: string[], bottleType: string, litersUsed: number) => {
    try {
      // Backend handles tank deduction when filling bottles
      await bottleService.fillBottles(bottleIds);
      // Refresh data
      fetchData();
    } catch (err) {
      console.error('Failed to fill bottles:', err);
      // Fallback to local state update
      setBottles((prev) =>
        prev.map((bottle) =>
          bottleIds.includes(bottle.id)
            ? { ...bottle, status: 'filled' as const, filledDate: new Date().toISOString() }
            : bottle
        )
      );
      if (tank) {
        setTank((prev) => prev ? ({
          ...prev,
          currentLevelLiters: prev.currentLevelLiters - litersUsed,
        }) : prev);
      }
    }
  };

  const handleAddBottle = async (data: { serialNumber: string; capacityLiters: number }) => {
    try {
      const newBottle = await bottleService.create(data);
      setBottles((prev) => [...prev, newBottle]);
    } catch (err) {
      console.error('Failed to add bottle:', err);
      // Fallback to local state
      const newBottle: OxygenBottle = {
        id: `bot-${Date.now()}`,
        serialNumber: data.serialNumber,
        capacityLiters: data.capacityLiters,
        status: 'empty',
      };
      setBottles((prev) => [...prev, newBottle]);
    }
  };

  const filteredBottles =
    filter === 'all' ? bottles : bottles.filter((b) => b.status === filter);

  // Group by capacity
  const bottlesBySize = filteredBottles.reduce((acc, b) => {
    const key = b.capacityLiters;
    if (!acc[key]) acc[key] = { filled: 0, empty: 0, with_customer: 0, total: 0 };
    acc[key][b.status]++;
    acc[key].total++;
    return acc;
  }, {} as Record<number, { filled: number; empty: number; with_customer: number; total: number }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !tank) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>{error || 'Failed to load tank data'}</AlertDescription>
        </Alert>
        <Button onClick={() => fetchData()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25">
            <Container className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bottle Management</h1>
            <p className="text-muted-foreground">Track and manage all oxygen bottles</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowFillModal(true)} variant="outline" className="gap-2">
            <FlaskConical className="h-4 w-4" />
            Fill Bottles
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Bottle
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Bottles"
          value={bottles.length}
          icon={Container}
          color="cyan"
        />
        <StatCard
          title="Filled (Ready)"
          value={filledBottles.length}
          icon={CircleCheck}
          color="green"
        />
        <StatCard
          title="Empty (In Center)"
          value={emptyBottles.length}
          icon={CircleDot}
          color="orange"
        />
        <StatCard
          title="With Customers"
          value={bottlesWithCustomers.length}
          icon={Package}
          color="purple"
        />
      </div>

      {/* Summary by Size */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory by Size</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(bottlesBySize)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([size, counts]) => (
                <div key={size} className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold">{size}L</span>
                    <Badge variant="secondary">{counts.total} total</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Filled</span>
                      </div>
                      <span className="font-medium">{counts.filled}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        <span>Empty</span>
                      </div>
                      <span className="font-medium">{counts.empty}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>Out</span>
                      </div>
                      <span className="font-medium">{counts.with_customer}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-card p-2 rounded-xl shadow-sm border">
        {[
          { key: 'all', label: 'All', count: bottles.length },
          { key: 'filled', label: 'Filled', count: filledBottles.length, color: 'green' },
          { key: 'empty', label: 'Empty', count: emptyBottles.length, color: 'gray' },
          { key: 'with_customer', label: 'With Customers', count: bottlesWithCustomers.length, color: 'blue' },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={filter === tab.key ? 'default' : 'ghost'}
            onClick={() => setFilter(tab.key as typeof filter)}
            className="flex-1"
          >
            {tab.label}
            <Badge variant="secondary" className="ml-2">
              {tab.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Bottle Fill History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Bottle Fill History</CardTitle>
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
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Liters Used</th>
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
                      <td className="px-4 py-3 text-sm font-medium">{record.bottleSerialNumber}</td>
                      <td className="px-4 py-3 text-sm text-right">{record.bottleCapacity}L</td>
                      <td className="px-4 py-3 text-sm text-right text-emerald-600 dark:text-emerald-400 font-medium">
                        -{record.litersUsed}L
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
      <BottleGrid
        bottles={filteredBottles}
        filter="all"
        onBottleClick={(bottle) => setSelectedBottle(bottle)}
      />

      {/* Selected Bottle Details */}
      <Dialog open={!!selectedBottle} onOpenChange={() => setSelectedBottle(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bottle Details</DialogTitle>
          </DialogHeader>

          {selectedBottle && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-24 relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-3 bg-gray-600 rounded-t" />
                  <div
                    className={`absolute top-3 inset-x-0 bottom-0 rounded-b-xl ${
                      selectedBottle.status === 'filled'
                        ? 'bg-gradient-to-t from-green-400 to-green-200'
                        : selectedBottle.status === 'with_customer'
                        ? 'bg-gradient-to-t from-blue-400 to-blue-200'
                        : 'bg-gray-200'
                    }`}
                  />
                </div>
                <div>
                  <p className="text-xl font-bold">{selectedBottle.serialNumber}</p>
                  <p className="text-muted-foreground">{selectedBottle.capacityLiters}L Capacity</p>
                  <Badge
                    variant={
                      selectedBottle.status === 'filled'
                        ? 'default'
                        : selectedBottle.status === 'with_customer'
                        ? 'secondary'
                        : 'outline'
                    }
                    className={`mt-2 ${
                      selectedBottle.status === 'filled'
                        ? 'bg-green-500'
                        : selectedBottle.status === 'with_customer'
                        ? 'bg-blue-500 text-white'
                        : ''
                    }`}
                  >
                    {selectedBottle.status === 'filled'
                      ? 'Filled'
                      : selectedBottle.status === 'with_customer'
                      ? 'With Customer'
                      : 'Empty'}
                  </Badge>
                </div>
              </div>

              {selectedBottle.status === 'with_customer' && selectedBottle.customerName && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-900">
                  <p className="text-sm text-muted-foreground">Currently with:</p>
                  <p className="font-semibold">{selectedBottle.customerName}</p>
                  {selectedBottle.issuedDate && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Issued: {new Date(selectedBottle.issuedDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {selectedBottle.filledDate && selectedBottle.status === 'filled' && (
                <div className="p-4 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-900">
                  <p className="text-sm text-muted-foreground">Filled on:</p>
                  <p className="font-semibold">
                    {new Date(selectedBottle.filledDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
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
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleAddBottle({
                serialNumber: formData.get('serialNumber') as string,
                capacityLiters: Number(formData.get('capacityLiters')),
              });
              setShowAddModal(false);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                name="serialNumber"
                required
                placeholder="e.g., OXY-10L-0025"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacityLiters">Bottle Size</Label>
              <Select name="capacityLiters" defaultValue={bottleTypes[0]?.capacityLiters.toString()}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bottle size" />
                </SelectTrigger>
                <SelectContent>
                  {bottleTypes.map((type) => (
                    <SelectItem key={type.id} value={type.capacityLiters.toString()}>
                      {type.name} - {type.capacityLiters}L (Rs. {type.pricePerFill} per fill)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Add Bottle
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Fill Bottles Modal */}
      <FillBottlesModal
        isOpen={showFillModal}
        onClose={() => setShowFillModal(false)}
        onFill={handleFillBottles}
        emptyBottles={emptyBottles}
        bottleTypes={bottleTypes}
        tankLevel={tank.currentLevelLiters}
      />
    </div>
  );
}

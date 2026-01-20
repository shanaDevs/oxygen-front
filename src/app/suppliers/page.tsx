'use client';

import { useState, useEffect } from 'react';
import { SupplierCard } from '@/components/suppliers/SupplierCard';
import { SupplierTransactionsTable } from '@/components/suppliers/SupplierTransactionsTable';
import { Button, LoadingSpinner, Card, CardContent, CardHeader, CardTitle, Badge, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Separator, Alert, AlertDescription, AlertTitle } from '@/components/ui';
import { StatCard } from '@/components/dashboard';
import { supplierService } from '@/services';
import { Supplier, SupplierTransaction } from '@/types';
import { Factory, Droplets, Banknote, AlertTriangle, UserPlus, Phone, MapPin, User } from 'lucide-react';

export default function SuppliersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<SupplierTransaction[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [supps, txns] = await Promise.all([
        supplierService.getAll(),
        supplierService.getTransactions(),
      ]);
      setSuppliers(supps);
      setTransactions(txns);
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

  const totalOutstanding = suppliers.reduce((sum, s) => sum + s.totalOutstanding, 0);
  const totalPaid = suppliers.reduce((sum, s) => sum + s.totalPaid, 0);
  const totalSupplied = suppliers.reduce((sum, s) => sum + s.totalSupplied, 0);

  const filteredTransactions = selectedSupplier
    ? transactions.filter((t) => t.supplierId === selectedSupplier.id)
    : transactions;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/25">
            <Factory className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
            <p className="text-muted-foreground">Manage oxygen suppliers and payments</p>
          </div>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Suppliers"
          value={suppliers.length}
          icon={Factory}
          color="cyan"
        />
        <StatCard
          title="Total Supplied"
          value={`${(totalSupplied / 1000).toFixed(1)}K L`}
          icon={Droplets}
          color="green"
        />
        <StatCard
          title="Total Paid"
          value={`Rs. ${(totalPaid / 1000).toFixed(0)}K`}
          icon={Banknote}
          color="purple"
        />
        <StatCard
          title="Outstanding"
          value={`Rs. ${totalOutstanding.toLocaleString()}`}
          icon={AlertTriangle}
          color="orange"
        />
      </div>

      {/* Supplier Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">All Suppliers</h2>
          {selectedSupplier && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedSupplier(null)}>
              Clear Filter
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className={`transition-all ${
                selectedSupplier?.id === supplier.id
                  ? 'ring-2 ring-cyan-500 rounded-xl'
                  : ''
              }`}
            >
              <SupplierCard
                supplier={supplier}
                onClick={(s) =>
                  setSelectedSupplier(selectedSupplier?.id === s.id ? null : s)
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {selectedSupplier
            ? `Transactions with ${selectedSupplier.name}`
            : 'All Transactions'}
        </h2>
        <SupplierTransactionsTable transactions={filteredTransactions} />
      </div>

      {/* Add Supplier Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Add New Supplier
            </DialogTitle>
            <DialogDescription>
              Add a new oxygen supplier to your system
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const newSupplier: Supplier = {
                id: `sup-${Date.now()}`,
                name: formData.get('name') as string,
                phone: formData.get('phone') as string,
                email: formData.get('email') as string,
                address: formData.get('address') as string,
                totalSupplied: 0,
                totalPaid: 0,
                totalOutstanding: 0,
                createdAt: new Date().toISOString(),
              };
              setSuppliers((prev) => [...prev, newSupplier]);
              setShowAddModal(false);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Supplier Name</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Enter supplier name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="+94 XX XXX XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </Label>
              <textarea
                id="address"
                name="address"
                className="w-full border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter address"
                rows={2}
              />
            </div>
            <Separator />
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Add Supplier
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { TankVisualization, RefillTankModal } from '@/components/tank';
import { BottleGrid, FillBottlesModal } from '@/components/bottles';
import { Button, LoadingSpinner, Card, CardContent, CardHeader, CardTitle, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, Progress, Alert, AlertDescription, AlertTitle } from '@/components/ui';
import { pdfService } from '@/services';
import { StatCard } from '@/components/dashboard';
import { tankService, bottleService, supplierService } from '@/services';
import { bottleTypes } from '@/data';
import { MainTank, OxygenBottle, SupplierTransaction, Supplier, TankFillHistory } from '@/types';
import { Droplets, CircleCheck, CircleDot, Package, Fuel, FlaskConical, Gauge, AlertTriangle, CheckCircle2, History, Clock, FileText } from 'lucide-react';

export default function TankPage() {
  const [loading, setLoading] = useState(true);
  const [tank, setTank] = useState<MainTank | null>(null);
  const [bottles, setBottles] = useState<OxygenBottle[]>([]);
  const [transactions, setTransactions] = useState<SupplierTransaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [showFillBottlesModal, setShowFillBottlesModal] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [previousLevel, setPreviousLevel] = useState<number | undefined>(undefined);
  const [tankFillHistory, setTankFillHistory] = useState<TankFillHistory[]>([]);

  // Real-time filling state
  const [isFillingInProgress, setIsFillingInProgress] = useState(false);
  const [fillingProgress, setFillingProgress] = useState(0);
  const [fillingAmount, setFillingAmount] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tnk, btlsRes, txns, supps, tankHistory] = await Promise.all([
        tankService.getStatus(),
        bottleService.getAll(),
        supplierService.getTransactions(),
        supplierService.getAll(),
        tankService.getFillHistory(10),
      ]);
      setTank(tnk);
      setBottles(btlsRes.data || []);
      setTransactions(txns);
      setSuppliers(supps);
      setTankFillHistory(tankHistory);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefillTank = async (
    kg: number,
    supplierId: string,
    paymentInfo: {
      pricePerKg: number;
      amountPaid: number;
      paymentStatus: 'full' | 'partial' | 'outstanding';
    }
  ) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (!supplier || !tank) return;

    // Set previous level for animation
    const currentKg = Number(tank.currentLevelKg) || (Number(tank.currentLevelLiters) / 5);
    setPreviousLevel(currentKg);
    setFillingAmount(kg);
    setIsFillingInProgress(true);
    setFillingProgress(0);

    // Animate filling progress
    const duration = 3000;
    const startTime = Date.now();
    const startLevel = currentKg;

    const animateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setFillingProgress(progress * 100);
      setTank((prev) => prev ? ({
        ...prev,
        currentLevelKg: startLevel + (kg * progress),
      }) : prev);

      if (progress < 1) {
        requestAnimationFrame(animateProgress);
      } else {
        // Animation complete
        setTank((prev) => prev ? ({
          ...prev,
          currentLevelKg: startLevel + kg,
          lastRefillDate: new Date().toISOString(),
          lastRefillAmountKg: kg,
        }) : prev);

        // Call API to refill tank
        // Convert 'outstanding' UI status to 'pending' if types require it
        const apiPaymentStatus = paymentInfo.paymentStatus === 'outstanding' ? 'pending' : paymentInfo.paymentStatus as any;

        tankService.refill({
          supplierId,
          kgSupplied: kg,
          pricePerKg: paymentInfo.pricePerKg,
          amountPaid: paymentInfo.amountPaid,
          paymentStatus: apiPaymentStatus,
        })
          .then(() => {
            fetchData();
          })
          .catch((err) => {
            console.error('Refill API failed:', err);
          });

        // Close filling dialog after a short delay
        setTimeout(() => {
          setIsFillingInProgress(false);
          setShowAnimation(true);
          setTimeout(() => {
            setShowAnimation(false);
            setPreviousLevel(undefined);
          }, 1500);
        }, 500);
      }
    };

    requestAnimationFrame(animateProgress);
  };

  const handleFillBottles = async (bottleIds: string[], bottleType: string, kgUsed: number) => {
    setBottles((prev) =>
      prev.map((bottle) =>
        bottleIds.includes(bottle.id)
          ? { ...bottle, status: 'filled' as const, filledDate: new Date().toISOString() }
          : bottle
      )
    );

    setTank((prev) => prev ? ({
      ...prev,
      currentLevelKg: Number(prev.currentLevelKg) - kgUsed,
    }) : prev);

    try {
      await bottleService.fillBottles(bottleIds);
      fetchData();
    } catch (err) {
      console.error('Failed to sync with server:', err);
    }
  };

  const emptyBottles = bottles.filter((b) => b.status === 'empty');
  const filledBottles = bottles.filter((b) => b.status === 'filled');
  const bottlesWithCustomers = bottles.filter((b) => b.status === 'with_customer');

  const currentKg = Number(tank?.currentLevelKg) || 0;
  const capacityKg = (Number(tank?.capacityTons) || 1) * 1000;
  const tankPercentage = tank ? (currentKg / capacityKg) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!tank && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">Tank data unavailable. Please check connection.</p>
        <Button onClick={() => fetchData()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
            <Droplets className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tank Management</h1>
            <p className="text-muted-foreground">Monitor and refill your main oxygen tank (KG)</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowFillBottlesModal(true)} variant="outline" className="gap-2">
            <FlaskConical className="h-4 w-4" />
            <span className="hidden sm:inline">Fill Bottles</span>
          </Button>
          <Button onClick={() => setShowRefillModal(true)} className="gap-2">
            <Fuel className="h-4 w-4" />
            <span className="hidden sm:inline">Refill Tank</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TankVisualization
            capacity={capacityKg}
            currentLevel={currentKg}
            previousLevel={previousLevel}
            showAnimation={showAnimation}
            label="Main Storage Tank"
            unit="kg"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-primary" />
              Tank Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Tank Name</span>
              <span className="font-medium">{tank?.name}</span>
            </div>
            <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Total Capacity</span>
              <span className="font-medium">{capacityKg.toLocaleString()} kg</span>
            </div>
            <div className="flex justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
              <span className="text-primary">Current Level</span>
              <span className="font-bold text-primary">{Math.round(currentKg).toLocaleString()} kg</span>
            </div>
            <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Empty Space</span>
              <span className="font-medium">
                {Math.round(capacityKg - currentKg).toLocaleString()} kg
              </span>
            </div>
            <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Last Refill</span>
              <span className="font-medium">
                {tank?.lastRefillDate ? new Date(tank.lastRefillDate).toLocaleDateString() : 'Never'}
              </span>
            </div>
            <div className="flex justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <span className="text-green-600 dark:text-green-400">Last Refill Amount</span>
              <span className="font-bold text-green-600 dark:text-green-400">+{Number(tank?.lastRefillAmountKg || tank?.lastRefillAmount || 0).toLocaleString()} kg</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Tank Level"
          value={`${tankPercentage.toFixed(1)}%`}
          icon={Droplets}
          color="cyan"
          trend={tank?.lastRefillAmountKg ? {
            value: ((Number(tank.lastRefillAmountKg) / capacityKg) * 100),
            isPositive: true,
          } : undefined}
        />
        <StatCard
          title="Filled Bottles"
          value={filledBottles.length}
          icon={CircleCheck}
          color="green"
        />
        <StatCard
          title="Empty Bottles"
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

      <Card>
        <CardHeader>
          <CardTitle>Recent Supplier Deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Supplier</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Amount (kg)</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Total (LKR)</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.slice(0, 5).map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{tx.supplierName}</td>
                    <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400">
                      +{(tx.kgSupplied || tx.litersSupplied || 0).toLocaleString()} kg
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={tx.paymentStatus === 'full' ? 'default' : tx.paymentStatus === 'partial' ? 'secondary' : 'destructive'}
                        className={tx.paymentStatus === 'full' ? 'bg-green-500' : tx.paymentStatus === 'partial' ? 'bg-yellow-500 text-white' : ''}
                      >
                        {tx.paymentStatus.charAt(0).toUpperCase() + tx.paymentStatus.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => pdfService.viewPaymentReceipt({
                          id: tx.id,
                          name: tx.supplierName,
                          amount: tx.amountPaid,
                          type: 'supplier',
                          method: 'cash',
                          remainingBalance: tx.outstanding
                        })}
                        className="h-8 w-8 p-0"
                      >
                        <FileText className="h-4 w-4 text-primary" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent >
      </Card >

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Tank Refill History (Supplied)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {tankFillHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No history yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Supplier</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Kg Added</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Previous</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">New Level</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Total Amount</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tankFillHistory.map((record) => (
                    <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{record.supplierName}</td>
                      <td className="px-4 py-3 text-sm text-right text-cyan-600 dark:text-cyan-400 font-medium">
                        +{record.kgAdded || record.litersAdded} kg
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                        {(record.previousLevel || 0).toLocaleString()} kg
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {(record.newLevel || 0).toLocaleString()} kg
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {(record.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => pdfService.viewPaymentReceipt({
                            id: record.id,
                            name: record.supplierName,
                            amount: record.amountPaid,
                            type: 'supplier',
                            method: 'cash',
                            remainingBalance: record.outstanding
                          })}
                          className="h-8 w-8 p-0"
                        >
                          <FileText className="h-4 w-4 text-primary" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h3 className="text-lg font-semibold mb-4">Current Bottles</h3>
        <BottleGrid bottles={bottles} />
      </div>

      <Dialog open={isFillingInProgress} onOpenChange={() => { }}>
        <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-primary animate-pulse" />
              Refilling Main Tank...
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="relative mx-auto w-32 h-48">
              <div className="absolute inset-x-0 top-0 h-4 bg-muted-foreground/30 rounded-t-lg mx-4" />
              <div className="absolute inset-x-0 top-4 bottom-0 bg-muted/50 rounded-b-2xl border-2 border-border overflow-hidden">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-cyan-500 to-cyan-300 transition-all duration-100"
                  style={{ height: `${tankPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-linear-to-r from-white/20 via-transparent to-white/10" />
                  <div className="absolute bottom-2 left-1/4 w-2 h-2 bg-white/50 rounded-full animate-float" />
                  <div className="absolute bottom-4 left-1/2 w-1.5 h-1.5 bg-white/50 rounded-full animate-float" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Adding</span>
                <span className="font-bold text-primary">+{fillingAmount.toLocaleString()} kg</span>
              </div>
              <Progress value={fillingProgress} className="h-3" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Level</span>
                <span className="font-medium">{Math.round(currentKg).toLocaleString()} / {capacityKg.toLocaleString()} kg</span>
              </div>
            </div>

            {fillingProgress >= 100 && (
              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Refill Complete!</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <RefillTankModal
        isOpen={showRefillModal}
        onClose={() => setShowRefillModal(false)}
        onRefill={handleRefillTank}
        currentLevel={currentKg}
        capacity={capacityKg}
        suppliers={suppliers}
      />

      <FillBottlesModal
        isOpen={showFillBottlesModal}
        onClose={() => setShowFillBottlesModal(false)}
        onFill={handleFillBottles}
        emptyBottles={emptyBottles}
        bottleTypes={bottleTypes}
        tankLevel={currentKg}
      />
    </div >
  );
}

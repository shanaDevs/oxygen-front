'use client';

import { useState, useEffect } from 'react';
import { TankVisualization, RefillTankModal } from '@/components/tank';
import { BottleGrid, FillBottlesModal } from '@/components/bottles';
import { Button, LoadingSpinner, Card, CardContent, CardHeader, CardTitle, Separator, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, Progress, Alert, AlertDescription, AlertTitle } from '@/components/ui';
import { StatCard } from '@/components/dashboard';
import { tankService, bottleService, supplierService } from '@/services';
import { bottleTypes, suppliers as mockSuppliers } from '@/data';
import { MainTank, OxygenBottle, SupplierTransaction, Supplier, TankFillHistory } from '@/types';
import { Droplets, CircleCheck, CircleDot, Package, Fuel, FlaskConical, TrendingUp, Gauge, AlertTriangle, CheckCircle2, History, Clock } from 'lucide-react';

export default function TankPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const [targetLevel, setTargetLevel] = useState(0);
  const [fillingAmount, setFillingAmount] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [tnk, btls, txns, supps, tankHistory] = await Promise.all([
        tankService.getStatus(),
        bottleService.getAll(),
        supplierService.getTransactions(),
        supplierService.getAll(),
        tankService.getFillHistory(10),
      ]);
      setTank(tnk);
      setBottles(btls);
      setTransactions(txns);
      setSuppliers(supps);
      setTankFillHistory(tankHistory);
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

  const handleRefillTank = async (
    liters: number,
    supplierId: string,
    paymentInfo: {
      pricePerLiter: number;
      amountPaid: number;
      paymentStatus: 'full' | 'partial' | 'outstanding';
    }
  ) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (!supplier || !tank) return;

    // Set previous level for animation
    setPreviousLevel(tank.currentLevelLiters);
    setFillingAmount(liters);
    setTargetLevel(tank.currentLevelLiters + liters);
    setIsFillingInProgress(true);
    setFillingProgress(0);

    // Animate filling progress
    const duration = 3000; // 3 seconds
    const startTime = Date.now();
    const startLevel = tank.currentLevelLiters;
    
    const animateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      setFillingProgress(progress * 100);
      setTank((prev) => prev ? ({
        ...prev,
        currentLevelLiters: startLevel + (liters * progress),
      }) : prev);
      
      if (progress < 1) {
        requestAnimationFrame(animateProgress);
      } else {
        // Animation complete
        setTank((prev) => prev ? ({
          ...prev,
          currentLevelLiters: startLevel + liters,
          lastRefillDate: new Date().toISOString(),
          lastRefillAmount: liters,
        }) : prev);
        
        // Add transaction
        const newTransaction: SupplierTransaction = {
          id: `st-${Date.now()}`,
          supplierId,
          supplierName: supplier.name,
          litersSupplied: liters,
          pricePerLiter: paymentInfo.pricePerLiter,
          totalAmount: liters * paymentInfo.pricePerLiter,
          amountPaid: paymentInfo.amountPaid,
          outstanding: liters * paymentInfo.pricePerLiter - paymentInfo.amountPaid,
          paymentStatus: paymentInfo.paymentStatus,
          createdAt: new Date().toISOString(),
        };
        setTransactions((prev) => [newTransaction, ...prev]);
        
        // Call API to refill tank
        tankService.refill({
          supplierId,
          litersSupplied: liters,
          pricePerLiter: paymentInfo.pricePerLiter,
          amountPaid: paymentInfo.amountPaid,
          paymentStatus: paymentInfo.paymentStatus,
        }).catch(console.error);
        
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

  const handleFillBottles = async (bottleIds: string[], bottleType: string, litersUsed: number) => {
    // Update bottles status locally
    setBottles((prev) =>
      prev.map((bottle) =>
        bottleIds.includes(bottle.id)
          ? { ...bottle, status: 'filled' as const, filledDate: new Date().toISOString() }
          : bottle
      )
    );

    // Reduce tank level locally
    setTank((prev) => prev ? ({
      ...prev,
      currentLevelLiters: prev.currentLevelLiters - litersUsed,
    }) : prev);

    // Call API to fill bottles (backend handles tank deduction)
    try {
      await bottleService.fillBottles(bottleIds);
    } catch (err) {
      console.error('Failed to sync with server:', err);
    }
  };

  const emptyBottles = bottles.filter((b) => b.status === 'empty');
  const filledBottles = bottles.filter((b) => b.status === 'filled');
  const bottlesWithCustomers = bottles.filter((b) => b.status === 'with_customer');
  const tankPercentage = tank ? (tank.currentLevelLiters / tank.capacityLiters) * 100 : 0;

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
          <div className="p-2.5 rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
            <Droplets className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tank Management</h1>
            <p className="text-muted-foreground">Monitor and refill your main oxygen tank</p>
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

      {/* Tank Visualization - NOW AT TOP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TankVisualization
            capacity={tank.capacityLiters}
            currentLevel={tank.currentLevelLiters}
            previousLevel={previousLevel}
            showAnimation={showAnimation}
            label="Main Storage Tank"
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
              <span className="font-medium">{tank.name}</span>
            </div>
            <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Total Capacity</span>
              <span className="font-medium">{tank.capacityLiters.toLocaleString()} L</span>
            </div>
            <div className="flex justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
              <span className="text-primary">Current Level</span>
              <span className="font-bold text-primary">{Math.round(tank.currentLevelLiters).toLocaleString()} L</span>
            </div>
            <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Empty Space</span>
              <span className="font-medium">
                {Math.round(tank.capacityLiters - tank.currentLevelLiters).toLocaleString()} L
              </span>
            </div>
            <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Last Refill</span>
              <span className="font-medium">
                {new Date(tank.lastRefillDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <span className="text-green-600 dark:text-green-400">Last Refill Amount</span>
              <span className="font-bold text-green-600 dark:text-green-400">+{tank.lastRefillAmount.toLocaleString()} L</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Tank Level"
          value={`${tankPercentage.toFixed(1)}%`}
          icon={Droplets}
          color="cyan"
          trend={{
            value: ((tank.lastRefillAmount / tank.capacityLiters) * 100),
            isPositive: true,
          }}
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

      {/* Recent Supplier Transactions */}
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
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Liters</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.slice(0, 5).map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{tx.supplierName}</td>
                    <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400">+{tx.litersSupplied.toLocaleString()} L</td>
                    <td className="px-4 py-3 text-sm text-right">Rs. {tx.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={tx.paymentStatus === 'full' ? 'default' : tx.paymentStatus === 'partial' ? 'secondary' : 'destructive'}
                        className={tx.paymentStatus === 'full' ? 'bg-green-500' : tx.paymentStatus === 'partial' ? 'bg-yellow-500 text-white' : ''}
                      >
                        {tx.paymentStatus.charAt(0).toUpperCase() + tx.paymentStatus.slice(1)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tank Fill History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Tank Fill History</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {tankFillHistory.length === 0 ? (
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Supplier</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Liters Added</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Previous Level</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">New Level</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Amount</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tankFillHistory.map((record) => (
                    <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(record.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{record.supplierName}</td>
                      <td className="px-4 py-3 text-sm text-right text-cyan-600 dark:text-cyan-400 font-medium">
                        +{record.litersAdded.toLocaleString()}L
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-muted-foreground">{record.previousLevel.toLocaleString()}L</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">{record.newLevel.toLocaleString()}L</td>
                      <td className="px-4 py-3 text-sm text-right">Rs. {record.totalAmount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={record.paymentStatus === 'full' ? 'default' : record.paymentStatus === 'partial' ? 'secondary' : 'destructive'}
                          className={record.paymentStatus === 'full' ? 'bg-green-500' : record.paymentStatus === 'partial' ? 'bg-yellow-500 text-white' : ''}
                        >
                          {record.paymentStatus.charAt(0).toUpperCase() + record.paymentStatus.slice(1)}
                        </Badge>
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
      <div>
        <h3 className="text-lg font-semibold mb-4">All Bottles</h3>
        <BottleGrid bottles={bottles} />
      </div>

      {/* Real-time Filling Dialog */}
      <Dialog open={isFillingInProgress} onOpenChange={() => {}}>
        <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-primary animate-pulse" />
              Filling Tank...
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Animated Tank */}
            <div className="relative mx-auto w-32 h-48">
              <div className="absolute inset-x-0 top-0 h-4 bg-muted-foreground/30 rounded-t-lg mx-4" />
              <div className="absolute inset-x-0 top-4 bottom-0 bg-muted/50 rounded-b-2xl border-2 border-border overflow-hidden">
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-cyan-500 to-cyan-300 transition-all duration-100"
                  style={{ height: `${(tank.currentLevelLiters / tank.capacityLiters) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-linear-to-r from-white/20 via-transparent to-white/10" />
                  {/* Bubbles */}
                  <div className="absolute bottom-2 left-1/4 w-2 h-2 bg-white/50 rounded-full animate-float" style={{ animationDelay: '0s' }} />
                  <div className="absolute bottom-4 left-1/2 w-1.5 h-1.5 bg-white/50 rounded-full animate-float" style={{ animationDelay: '0.3s' }} />
                  <div className="absolute bottom-1 left-3/4 w-1 h-1 bg-white/50 rounded-full animate-float" style={{ animationDelay: '0.6s' }} />
                </div>
              </div>
            </div>
            
            {/* Progress Info */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Adding</span>
                <span className="font-bold text-primary">+{fillingAmount.toLocaleString()} L</span>
              </div>
              <Progress value={fillingProgress} className="h-3" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Level</span>
                <span className="font-medium">{Math.round(tank.currentLevelLiters).toLocaleString()} / {tank.capacityLiters.toLocaleString()} L</span>
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

      {/* Modals */}
      <RefillTankModal
        isOpen={showRefillModal}
        onClose={() => setShowRefillModal(false)}
        onRefill={handleRefillTank}
        currentLevel={tank.currentLevelLiters}
        capacity={tank.capacityLiters}
        suppliers={suppliers}
      />

      <FillBottlesModal
        isOpen={showFillBottlesModal}
        onClose={() => setShowFillBottlesModal(false)}
        onFill={handleFillBottles}
        emptyBottles={emptyBottles}
        bottleTypes={bottleTypes}
        tankLevel={tank.currentLevelLiters}
      />
    </div>
  );
}

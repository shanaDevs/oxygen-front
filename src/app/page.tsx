"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard";
import { LoadingSpinner, Card, CardContent, CardHeader, CardTitle, Badge, Button, Progress, Alert, AlertDescription, AlertTitle } from "@/components/ui";
import { TankVisualization } from "@/components/tank";
import { CustomerTransactionsTable } from "@/components/customers";
import { SupplierTransactionsTable } from "@/components/suppliers";
import { tankService, bottleService, customerService, supplierService } from "@/services";
import { MainTank, OxygenBottle, Customer, Supplier, CustomerTransaction, SupplierTransaction } from "@/types";
import Link from "next/link";
import {
  Droplets,
  CircleCheck,
  CircleDot,
  PackageCheck,
  ArrowDownToLine,
  ArrowUpFromLine,
  Activity,
  Fuel,
  FlaskConical,
  PackagePlus,
  PackageMinus,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for API data
  const [mainTank, setMainTank] = useState<MainTank | null>(null);
  const [oxygenBottles, setOxygenBottles] = useState<OxygenBottle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customerTransactions, setCustomerTransactions] = useState<CustomerTransaction[]>([]);
  const [supplierTransactions, setSupplierTransactions] = useState<SupplierTransaction[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [tank, bottlesRes, custs, supps, custTx, suppTx] = await Promise.all([
          tankService.getStatus(),
          bottleService.getAll(),
          customerService.getAll(),
          supplierService.getAll(),
          customerService.getTransactions(),
          supplierService.getTransactions(),
        ]);

        setMainTank(tank);
        // Handle both array and ApiResponse formats
        setOxygenBottles(Array.isArray(bottlesRes) ? bottlesRes : bottlesRes.data || []);
        setCustomers(Array.isArray(custs) ? custs : custs || []);
        setSuppliers(Array.isArray(supps) ? supps : supps || []);
        setCustomerTransactions(Array.isArray(custTx) ? custTx : custTx || []);
        setSupplierTransactions(Array.isArray(suppTx) ? suppTx : suppTx || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !mainTank) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            {error || 'Failed to connect to the server. Please check if the backend is running.'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  // Calculate stats
  const tankPercentage = typeof mainTank.percentFull === 'string' ? parseFloat(mainTank.percentFull) : mainTank.percentFull;
  const filledBottles = oxygenBottles.filter(b => b.status === 'filled').length;
  const emptyBottles = oxygenBottles.filter(b => b.status === 'empty').length;
  const bottlesWithCustomers = oxygenBottles.filter(b => b.status === 'with_customer').length;
  const totalCustomerCredit = customers.reduce((sum, c) => sum + c.totalCredit, 0);
  const totalSupplierOutstanding = suppliers.reduce((sum, s) => sum + s.totalOutstanding, 0);
  const todayTransactions = customerTransactions.filter(t => {
    const today = new Date().toDateString();
    return new Date(t.createdAt).toDateString() === today;
  }).length;

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your center overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/pos">
            <Button className="gap-2 shadow-lg shadow-primary/25">
              <PackagePlus className="h-4 w-4" />
              New Sale
            </Button>
          </Link>
        </div>
      </div>

      {/* Tank Visualization - Primary View */}
      <div className="grid grid-cols-1 gap-6">
        <TankVisualization
          capacity={mainTank.capacityKg}
          currentLevel={mainTank.currentLevelKg}
          label="Main Storage Tank Status"
          unit="kg"
        />
      </div>

      {/* Main Stats - 2x2 grid on mobile, 4 per row on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 overflow-hidden">
        <Link href="/tank" className="block h-full">
          <StatCard
            title="Tank Level"
            value={`${tankPercentage.toFixed(1)}%`}
            icon={Droplets}
            color="cyan"
            trend={{ value: 15, isPositive: true }}
          />
        </Link>
        <Link href="/bottles" className="block h-full">
          <StatCard
            title="Filled"
            value={filledBottles}
            icon={CircleCheck}
            color="green"
          />
        </Link>
        <Link href="/bottles" className="block h-full">
          <StatCard
            title="Empty"
            value={emptyBottles}
            icon={CircleDot}
            color="orange"
          />
        </Link>
        <Link href="/customers" className="block h-full">
          <StatCard
            title="Out"
            value={bottlesWithCustomers}
            icon={PackageCheck}
            color="purple"
          />
        </Link>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Receivable from Customers</CardTitle>
              <div className="p-2 rounded-lg bg-red-500/10">
                <ArrowDownToLine className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">Rs. {totalCustomerCredit.toLocaleString()}</p>
            <div className="flex items-center justify-between mt-4">
              <Badge variant="secondary" className="bg-red-100 text-red-700">
                {customers.filter(c => c.totalCredit > 0).length} customers
              </Badge>
              <Link href="/customers">
                <Button variant="ghost" size="sm" className="gap-1 text-primary">
                  View <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Payable to Suppliers</CardTitle>
              <div className="p-2 rounded-lg bg-amber-500/10">
                <ArrowUpFromLine className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">Rs. {totalSupplierOutstanding.toLocaleString()}</p>
            <div className="flex items-center justify-between mt-4">
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                {suppliers.filter(s => s.totalOutstanding > 0).length} suppliers
              </Badge>
              <Link href="/suppliers">
                <Button variant="ghost" size="sm" className="gap-1 text-primary">
                  View <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's Activity</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{todayTransactions}</p>
            <div className="flex items-center justify-between mt-4">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Transactions
              </Badge>
              <Link href="/sales">
                <Button variant="ghost" size="sm" className="gap-1 text-primary">
                  View <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tank and Quick Actions */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Link href="/tank">
                <div className="group flex flex-col items-center p-5 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100/50 hover:from-cyan-100 hover:to-cyan-200/50 border border-cyan-200/50 transition-all cursor-pointer hover:shadow-md">
                  <div className="p-3 rounded-full bg-white shadow-sm group-hover:shadow-md transition-shadow mb-3">
                    <Fuel className="h-6 w-6 text-cyan-600" />
                  </div>
                  <span className="font-semibold text-cyan-800">Refill Tank</span>
                  <span className="text-xs text-cyan-600 mt-1">From supplier</span>
                </div>
              </Link>
              <Link href="/tank">
                <div className="group flex flex-col items-center p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 hover:from-emerald-100 hover:to-emerald-200/50 border border-emerald-200/50 transition-all cursor-pointer hover:shadow-md">
                  <div className="p-3 rounded-full bg-white shadow-sm group-hover:shadow-md transition-shadow mb-3">
                    <FlaskConical className="h-6 w-6 text-emerald-600" />
                  </div>
                  <span className="font-semibold text-emerald-800">Fill Bottles</span>
                  <span className="text-xs text-emerald-600 mt-1">From tank</span>
                </div>
              </Link>
              <Link href="/pos">
                <div className="group flex flex-col items-center p-5 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 border border-blue-200/50 transition-all cursor-pointer hover:shadow-md">
                  <div className="p-3 rounded-full bg-white shadow-sm group-hover:shadow-md transition-shadow mb-3">
                    <PackagePlus className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="font-semibold text-blue-800">Issue Bottles</span>
                  <span className="text-xs text-blue-600 mt-1">To customer</span>
                </div>
              </Link>
              <Link href="/customers">
                <div className="group flex flex-col items-center p-5 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100/50 hover:from-violet-100 hover:to-violet-200/50 border border-violet-200/50 transition-all cursor-pointer hover:shadow-md">
                  <div className="p-3 rounded-full bg-white shadow-sm group-hover:shadow-md transition-shadow mb-3">
                    <PackageMinus className="h-6 w-6 text-violet-600" />
                  </div>
                  <span className="font-semibold text-violet-800">Return Bottles</span>
                  <span className="text-xs text-violet-600 mt-1">From customer</span>
                </div>
              </Link>
            </div>

            {/* Bottle summary */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-4">Bottle Inventory</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm">Filled</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={(filledBottles / oxygenBottles.length) * 100} className="w-24 h-2" />
                    <span className="text-sm font-semibold w-8">{filledBottles}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                    <span className="text-sm">Empty</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={(emptyBottles / oxygenBottles.length) * 100} className="w-24 h-2" />
                    <span className="text-sm font-semibold w-8">{emptyBottles}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm">With Customers</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={(bottlesWithCustomers / oxygenBottles.length) * 100} className="w-24 h-2" />
                    <span className="text-sm font-semibold w-8">{bottlesWithCustomers}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(tankPercentage < 30 || emptyBottles > filledBottles) && (
        <Alert variant="destructive" className="border-amber-200 bg-amber-50 text-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Attention Required</AlertTitle>
          <AlertDescription className="text-amber-700">
            <ul className="list-disc list-inside space-y-1 mt-2">
              {tankPercentage < 30 && (
                <li>Tank level is low ({tankPercentage.toFixed(1)}%). Consider refilling soon.</li>
              )}
              {emptyBottles > filledBottles && (
                <li>More empty bottles ({emptyBottles}) than filled ({filledBottles}). Fill more bottles.</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Recent Customer Transactions</CardTitle>
            <Link href="/customers">
              <Button variant="ghost" size="sm" className="gap-1 text-primary">
                View All <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <CustomerTransactionsTable transactions={customerTransactions.slice(0, 5)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Recent Supplier Deliveries</CardTitle>
            <Link href="/suppliers">
              <Button variant="ghost" size="sm" className="gap-1 text-primary">
                View All <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <SupplierTransactionsTable transactions={supplierTransactions.slice(0, 5)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

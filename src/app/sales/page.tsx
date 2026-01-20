"use client";

import { useEffect, useState } from "react";
import { SalesTable } from "@/components/sales";
import { LoadingSpinner, Card, CardContent, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge } from "@/components/ui";
import { StatCard } from "@/components/dashboard";
import { saleService } from "@/services";
import { Sale } from "@/types";
import { Receipt, CheckCircle2, Clock, DollarSign } from "lucide-react";

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const data = await saleService.getAll();
        setSales(data);
      } catch (error) {
        console.error("Failed to fetch sales:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  const filteredSales = sales.filter((sale) => {
    const matchesStatus = statusFilter === "all" || sale.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || sale.paymentMethod === paymentFilter;
    return matchesStatus && matchesPayment;
  });

  const totalRevenue = filteredSales
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + s.total, 0);

  const handleView = (sale: Sale) => {
    console.log("View sale:", sale);
  };

  const handleCancel = (sale: Sale) => {
    console.log("Cancel sale:", sale);
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
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
          <Receipt className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales History</h1>
          <p className="text-muted-foreground">View and manage all sales transactions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Sales"
          value={sales.length}
          icon={Receipt}
          color="cyan"
        />
        <StatCard
          title="Completed"
          value={sales.filter((s) => s.status === "completed").length}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="Pending"
          value={sales.filter((s) => s.status === "pending").length}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Total Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          color="purple"
        />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Payment Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        Showing {filteredSales.length} of {sales.length} sales
      </div>

      <SalesTable sales={filteredSales} onView={handleView} onCancel={handleCancel} />
    </div>
  );
}

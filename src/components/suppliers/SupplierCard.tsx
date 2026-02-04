'use client';

import { Supplier } from '@/types';
import { Card, CardContent, Badge, Button } from '@/components/ui';
import { Factory, Phone, Droplets, Banknote, AlertTriangle, Eye, Download } from 'lucide-react';
import { pdfService } from '@/services';

interface SupplierCardProps {
  supplier: Supplier;
  onClick?: (supplier: Supplier) => void;
  onPay?: (supplier: Supplier) => void;
  onPreview?: (url: string, title: string) => void;
}

export function SupplierCard({ supplier, onClick, onPay, onPreview }: SupplierCardProps) {
  return (
    <Card
      onClick={() => onClick?.(supplier)}
      className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.01] hover:border-primary/50"
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-linear-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-xl flex items-center justify-center shadow-sm">
              <Factory className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold">{supplier.name}</h3>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                {supplier.phone}
                {supplier.phone2 && (
                  <>
                    <span className="mx-1 text-gray-300">|</span>
                    {supplier.phone2}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-primary"
                title="Preview Statement"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview?.(pdfService.getSupplierStatementUrl(supplier.id), `${supplier.name} - Statement`);
                }}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-500"
                title="Download Statement"
                onClick={(e) => {
                  e.stopPropagation();
                  pdfService.downloadSupplierStatement(supplier.id, supplier.name);
                }}
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
            {supplier.totalOutstanding > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Outstanding
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center p-3 bg-muted/50 rounded-xl">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Droplets className="h-3 w-3" />
              Supplied (Kg)
            </div>
            <p className="text-sm font-bold">{supplier.totalSupplied.toLocaleString()}</p>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-xl">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Banknote className="h-3 w-3" />
              Paid (Rs.)
            </div>
            <p className="text-sm font-bold text-green-600 dark:text-green-400">{supplier.totalPaid.toLocaleString()}</p>
            {supplier.totalOutstanding > 0 && onPay && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 hover:border-red-300 gap-1 shadow-sm active:scale-95 transition-all mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onPay(supplier);
                }}
              >
                <Banknote className="h-3 w-3" />
                Settle
              </Button>
            )}
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-xl">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <AlertTriangle className="h-3 w-3" />
              Owed (Rs.)
            </div>
            <p className="text-sm font-bold text-red-600 dark:text-red-400">{supplier.totalOutstanding.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

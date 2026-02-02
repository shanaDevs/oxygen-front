'use client';

import { Customer, OxygenBottle, CustomerTransaction } from '@/types';
import { Card, CardContent, Badge, Separator } from '@/components/ui';
import { User, Hospital, Factory, Home, Phone, Package, Star, AlertTriangle, Container, Eye, Download } from 'lucide-react';
import { Button } from '../ui';
import { pdfService } from '@/services';

interface CustomerCardProps {
  customer: Customer;
  bottles?: OxygenBottle[];
  transactions?: CustomerTransaction[];
  onClick?: (customer: Customer) => void;
  onPreview?: (url: string, title: string) => void;
}

export function CustomerCard({ customer, bottles = [], transactions = [], onClick, onPreview }: CustomerCardProps) {
  const customerBottles = bottles.filter((b) => b.customerId === customer.id);

  const getCustomerIcon = () => {
    if (customer.name.includes('Hospital')) return <Hospital className="h-6 w-6 text-blue-600" />;
    if (customer.name.includes('Factory') || customer.name.includes('Works')) return <Factory className="h-6 w-6 text-orange-600" />;
    if (customer.name.includes('Home') || customer.name.includes('Care')) return <Home className="h-6 w-6 text-green-600" />;
    return <User className="h-6 w-6 text-violet-600" />;
  };

  return (
    <Card
      onClick={() => onClick?.(customer)}
      className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.01] hover:border-primary/50"
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-linear-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-xl flex items-center justify-center shadow-sm">
              {getCustomerIcon()}
            </div>
            <div>
              <h3 className="font-semibold">{customer.name}</h3>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                {customer.phone}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {customer.totalCredit > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Rs. {customer.totalCredit.toLocaleString()}
              </Badge>
            )}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-primary"
                title="Preview Statement"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview?.(pdfService.getCustomerStatementUrl(customer.id), `${customer.name} - Statement`);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500"
                title="Download Statement"
                onClick={(e) => {
                  e.stopPropagation();
                  pdfService.downloadCustomerStatement(customer.id, customer.name);
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Package className="h-3 w-3" />
              Bottles
            </div>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{customerBottles.length}</p>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-xl">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Star className="h-3 w-3" />
              Points
            </div>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{customer.loyaltyPoints}</p>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-xl">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <AlertTriangle className="h-3 w-3" />
              Owed
            </div>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">Rs. {customer.totalCredit.toLocaleString()}</p>
          </div>
        </div>

        {customerBottles.length > 0 && (
          <>
            <Separator className="my-4" />
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Container className="h-3 w-3" />
                Bottles with customer:
              </p>
              <div className="flex flex-wrap gap-2">
                {customerBottles.map((bottle) => (
                  <Badge
                    key={bottle.id}
                    variant="secondary"
                    className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                  >
                    {bottle.serialNumber} ({bottle.capacityLiters}L)
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

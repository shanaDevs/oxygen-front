import React from 'react';
import { SupplierPayment } from '@/types';
import { format } from 'date-fns';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface SupplierPaymentsTableProps {
    payments: SupplierPayment[];
}

export function SupplierPaymentsTable({ payments }: SupplierPaymentsTableProps) {
    if (payments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="m5 15 7-7 7 7" /></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Payments Recorded</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto text-sm">There are no payment installments recorded for this period.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                    <TableRow>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Date & Time</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Receipt ID</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Method</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Reference</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Notes</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 text-right">Amount (LKR)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payments.map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <TableCell className="font-medium whitespace-nowrap">
                                {format(new Date(payment.paymentDate), 'MMM dd, yyyy • hh:mm a')}
                            </TableCell>
                            <TableCell className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{payment.id}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className="capitalize text-[10px] font-bold py-0.5 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                    {payment.paymentMethod.replace('_', ' ')}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-slate-600 truncate max-w-[150px]">{payment.reference || '-'}</TableCell>
                            <TableCell className="text-slate-500 italic text-sm">{payment.notes || '-'}</TableCell>
                            <TableCell className="text-right font-black text-emerald-600">
                                {payment.amount.toLocaleString()}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

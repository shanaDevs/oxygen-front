import { API_CONFIG } from './config';

const getApiUrl = () => {
    if (typeof window !== 'undefined') {
        return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    }
    return 'http://localhost:5000/api';
};

interface PaymentReceiptData {
    id?: string;
    name: string;
    amount: number;
    type: 'customer' | 'supplier';
    method?: string;
    remainingBalance?: number;
    notes?: string;
    phone?: string;
}

export const pdfService = {
    // Get invoice PDF URL
    getInvoiceUrl: (saleId: string): string => {
        return `${getApiUrl()}/pdf/invoice/${saleId}`;
    },

    // Get invoice PDF URL by invoice number
    getInvoiceByNumberUrl: (invoiceNumber: string): string => {
        return `${getApiUrl()}/pdf/invoice-by-number/${invoiceNumber}`;
    },

    // Get bottle ledger PDF URL
    getBottleLedgerUrl: (bottleId: string): string => {
        return `${getApiUrl()}/pdf/bottle-ledger/${bottleId}`;
    },

    // Get bottle ledger PDF URL by serial number
    getBottleLedgerBySerialUrl: (serialNumber: string): string => {
        return `${getApiUrl()}/pdf/bottle-ledger-by-serial/${serialNumber}`;
    },

    // Get customer statement PDF URL
    getCustomerStatementUrl: (customerId: string): string => {
        return `${getApiUrl()}/pdf/customer-statement/${customerId}`;
    },

    // Download PDF helper
    downloadPdf: async (url: string, filename: string): Promise<void> => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to download PDF');
            }
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            throw error;
        }
    },

    // Open PDF in new tab
    openPdf: (url: string): void => {
        window.open(url, '_blank');
    },

    // Download invoice
    downloadInvoice: async (saleId: string, invoiceNumber: string): Promise<void> => {
        const url = `${getApiUrl()}/pdf/invoice/${saleId}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to download PDF');
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `Invoice-${invoiceNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            throw error;
        }
    },

    // Download bottle ledger
    downloadBottleLedger: async (bottleId: string, serialNumber: string): Promise<void> => {
        const url = `${getApiUrl()}/pdf/bottle-ledger/${bottleId}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to download PDF');
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `BottleLedger-${serialNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            throw error;
        }
    },

    // Download customer statement
    downloadCustomerStatement: async (customerId: string, customerName: string): Promise<void> => {
        const url = `${getApiUrl()}/pdf/customer-statement/${customerId}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to download PDF');
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `Statement-${customerName.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            throw error;
        }
    },

    // Get payment receipt PDF URL
    getPaymentReceiptUrl: (data: PaymentReceiptData): string => {
        const params = new URLSearchParams();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
                params.append(key, value.toString());
            }
        });
        return `${getApiUrl()}/pdf/payment-receipt?${params.toString()}`;
    },

    // Download payment receipt
    downloadPaymentReceipt: async (data: PaymentReceiptData): Promise<void> => {
        const params = new URLSearchParams();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
                params.append(key, value.toString());
            }
        });
        const url = `${getApiUrl()}/pdf/payment-receipt?${params.toString()}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to download PDF');
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `Receipt-${data.name.replace(/\s+/g, '_')}-${new Date().getTime()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            throw error;
        }
    },

    // View invoice in new tab
    viewInvoice: (saleId: string): void => {
        window.open(`${getApiUrl()}/pdf/invoice/${saleId}`, '_blank');
    },

    // View payment receipt in new tab
    viewPaymentReceipt: (data: PaymentReceiptData): void => {
        const params = new URLSearchParams();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
                params.append(key, value.toString());
            }
        });
        window.open(`${getApiUrl()}/pdf/payment-receipt?${params.toString()}`, '_blank');
    },
    // Download supplier statement
    downloadSupplierStatement: async (supplierId: string, supplierName: string): Promise<void> => {
        const url = `${getApiUrl()}/pdf/supplier-statement/${supplierId}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to download PDF');
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `Statement-${supplierName.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            throw error;
        }
    },

    // Get supplier statement URL
    getSupplierStatementUrl: (supplierId: string): string => {
        return `${getApiUrl()}/pdf/supplier-statement/${supplierId}`;
    },

    // Generic transaction report download
    downloadTransactionReport: async (transactions: any[], title: string): Promise<void> => {
        // Since we don't have a direct endpoint for custom filtered transactions,
        // we'll use the supplier statement if we have a supplierId
        const supplierId = transactions[0]?.supplierId;
        if (supplierId) {
            const url = `${getApiUrl()}/pdf/supplier-statement/${supplierId}`;
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to download PDF');
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = `${title.replace(/\s+/g, '_')}_Report.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(downloadUrl);
            } catch (error) {
                console.error('Error downloading PDF:', error);
                throw error;
            }
        }
    },
};

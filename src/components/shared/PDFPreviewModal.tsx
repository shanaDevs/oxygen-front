'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, ExternalLink, FileText, ShieldCheck } from 'lucide-react';

interface PDFPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    url: string;
    title: string;
    description?: string;
}

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
    isOpen,
    onClose,
    url,
    title,
    description = "SECURE DOCUMENT PREVIEW"
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-5xl w-[95vw] h-[92vh] p-0 flex flex-col overflow-hidden bg-slate-50 border-none shadow-2xl rounded-2xl ring-1 ring-black/5 [&>button]:hidden">
                {/* Accessible Title (Hidden) */}
                <DialogHeader className="sr-only">
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                {/* Modern Header */}
                <header className="px-4 sm:px-6 py-4 flex items-center justify-between shrink-0 bg-white border-b border-slate-200/60 shadow-sm relative z-10">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 rounded-xl sm:rounded-2xl flex items-center justify-center border border-indigo-100/50 shadow-inner shrink-0">
                            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                        </div>
                        <div className="flex flex-col text-left min-w-0 flex-1">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight mb-1.5 truncate">
                                {title}
                            </h2>
                            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                                <ShieldCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                                <span className="truncate">{description}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 ml-3 shrink-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 px-3 sm:px-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-indigo-600 transition-all font-medium gap-2"
                            onClick={() => window.open(url, '_blank')}
                        >
                            <ExternalLink className="h-4 w-4" />
                            <span className="hidden md:inline">External View</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 px-3 sm:px-4 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-slate-700 hover:text-emerald-600 transition-all font-medium gap-2"
                            onClick={async () => {
                                try {
                                    const response = await fetch(url);
                                    const blob = await response.blob();
                                    const downloadUrl = window.URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = downloadUrl;
                                    link.download = `${title.replace(/\s+/g, '_')}.pdf`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    window.URL.revokeObjectURL(downloadUrl);
                                } catch (e) {
                                    console.error("Download failed", e);
                                }
                            }}
                        >
                            <Download className="h-4 w-4" />
                            <span className="hidden md:inline">Download</span>
                        </Button>

                        <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all"
                            onClick={onClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </header>

                {/* Viewer Area */}
                <div className="flex-1 w-full h-full bg-slate-200/40 relative flex flex-col">
                    <div className="flex-1 flex items-center justify-center p-4 md:p-8">
                        <div className="w-full max-w-4xl h-full bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] ring-1 ring-black/5 rounded-0 md:rounded-lg overflow-hidden relative">
                            <iframe
                                src={`${url}#toolbar=0&navpanes=0&scrollbar=1`}
                                className="w-full h-full border-none"
                                title={title}
                            />
                        </div>
                    </div>

                    {/* Footer with View Voucher Button */}
                    <div className="px-4 sm:px-6 py-4 bg-white border-t border-slate-200/60 shadow-sm flex items-center justify-end gap-3">
                        <Button
                            variant="ghost"
                            className="h-11 px-6 font-medium text-slate-600 hover:text-slate-900"
                            onClick={onClose}
                        >
                            Dismiss
                        </Button>
                        <Button
                            className="h-11 px-6 gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-lg font-bold"
                            onClick={() => window.open(url, '_blank')}
                        >
                            <FileText className="h-4 w-4" />
                            View Voucher
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

// Helper component for vertical separator
const Separator = ({ orientation, className }: { orientation: 'vertical' | 'horizontal', className?: string }) => (
    <div className={`${orientation === 'vertical' ? 'w-[1px] h-full' : 'h-[1px] w-full'} bg-slate-200 ${className}`} />
);

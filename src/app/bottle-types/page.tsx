'use client';

import { useState, useEffect } from 'react';
import {
    Button,
    LoadingSpinner,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Input,
    Label,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    Alert,
    AlertDescription,
    AlertTitle,
    Badge,
    Separator,
} from '@/components/ui';
import { bottleTypeService } from '@/services';
import { BottleType } from '@/types';
import {
    Container,
    Plus,
    Edit2,
    Trash2,
    AlertTriangle,
    Package,
    DollarSign,
    Scale,
    FlaskConical,
    CheckCircle2,
} from 'lucide-react';

export default function BottleTypesPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bottleTypes, setBottleTypes] = useState<BottleType[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedType, setSelectedType] = useState<BottleType | null>(null);
    const [processing, setProcessing] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        capacityLiters: '',
        refillKg: '',
        pricePerFill: '',
        depositAmount: '',
        description: '',
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await bottleTypeService.getAll();
            setBottleTypes(response.data || []);
        } catch (err) {
            console.error('Failed to fetch bottle types:', err);
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => {
        setFormData({
            name: '',
            capacityLiters: '',
            refillKg: '',
            pricePerFill: '',
            depositAmount: '',
            description: '',
        });
    };

    const handleAddOpen = () => {
        resetForm();
        setShowAddModal(true);
    };

    const handleEditOpen = (type: BottleType) => {
        setSelectedType(type);
        setFormData({
            name: type.name,
            capacityLiters: type.capacityLiters.toString(),
            refillKg: type.refillKg.toString(),
            pricePerFill: type.pricePerFill.toString(),
            depositAmount: (type.depositAmount || 0).toString(),
            description: type.description || '',
        });
        setShowEditModal(true);
    };

    const handleDeleteOpen = (type: BottleType) => {
        setSelectedType(type);
        setShowDeleteModal(true);
    };

    const handleAdd = async () => {
        if (!formData.name || !formData.capacityLiters || !formData.refillKg || !formData.pricePerFill) {
            setError('Please fill in all required fields');
            return;
        }

        setProcessing(true);
        try {
            const response = await bottleTypeService.create({
                name: formData.name,
                capacityLiters: parseFloat(formData.capacityLiters),
                refillKg: parseFloat(formData.refillKg),
                pricePerFill: parseFloat(formData.pricePerFill),
                depositAmount: parseFloat(formData.depositAmount) || 0,
                description: formData.description,
            });
            setBottleTypes((prev) => [...prev, response.data]);
            setShowAddModal(false);
            setSuccessMessage('Bottle type added successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add bottle type');
        } finally {
            setProcessing(false);
        }
    };

    const handleEdit = async () => {
        if (!selectedType) return;

        setProcessing(true);
        try {
            const response = await bottleTypeService.update(selectedType.id, {
                name: formData.name,
                capacityLiters: parseFloat(formData.capacityLiters),
                refillKg: parseFloat(formData.refillKg),
                pricePerFill: parseFloat(formData.pricePerFill),
                depositAmount: parseFloat(formData.depositAmount) || 0,
                description: formData.description,
            });
            setBottleTypes((prev) =>
                prev.map((t) => (t.id === selectedType.id ? response.data : t))
            );
            setShowEditModal(false);
            setSuccessMessage('Bottle type updated successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update bottle type');
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedType) return;

        setProcessing(true);
        try {
            await bottleTypeService.delete(selectedType.id);
            setBottleTypes((prev) => prev.filter((t) => t.id !== selectedType.id));
            setShowDeleteModal(false);
            setSuccessMessage('Bottle type deleted successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete bottle type');
        } finally {
            setProcessing(false);
        }
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
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25">
                        <Container className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Bottle Types</h1>
                        <p className="text-muted-foreground">Manage bottle categories and pricing</p>
                    </div>
                </div>
                <Button onClick={handleAddOpen} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Bottle Type
                </Button>
            </div>

            {/* Success Alert */}
            {successMessage && (
                <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
            )}

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Bottle Types Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bottleTypes.map((type) => (
                    <Card key={type.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
                        <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                                <CardTitle className="text-lg">{type.name}</CardTitle>
                                <Badge variant={type.isActive ? 'default' : 'secondary'}>
                                    {type.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <FlaskConical className="h-4 w-4 text-cyan-500" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Capacity</p>
                                        <p className="font-semibold">{type.capacityLiters}L</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Scale className="h-4 w-4 text-orange-500" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Refill Amount</p>
                                        <p className="font-semibold">{type.refillKg}kg</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-green-500" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Fill Price</p>
                                        <p className="font-semibold">Rs. {type.pricePerFill.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-purple-500" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Deposit</p>
                                        <p className="font-semibold">Rs. {(type.depositAmount || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {type.description && (
                                <>
                                    <Separator />
                                    <p className="text-sm text-muted-foreground">{type.description}</p>
                                </>
                            )}

                            <div className="flex gap-2 pt-2">
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditOpen(type)}>
                                    <Edit2 className="h-4 w-4 mr-1" />
                                    Edit
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteOpen(type)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {bottleTypes.length === 0 && (
                    <Card className="col-span-full">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <Container className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium">No Bottle Types</h3>
                            <p className="text-muted-foreground">Create your first bottle type to get started</p>
                            <Button onClick={handleAddOpen} className="mt-4">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Bottle Type
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Add Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Bottle Type</DialogTitle>
                        <DialogDescription>Create a new bottle category with pricing</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g., 47.5L Industrial"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="capacity">Capacity (Liters) *</Label>
                                <Input
                                    id="capacity"
                                    type="number"
                                    step="0.5"
                                    placeholder="47.5"
                                    value={formData.capacityLiters}
                                    onChange={(e) => setFormData({ ...formData, capacityLiters: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="refillKg">Fill Amount (kg) *</Label>
                                <Input
                                    id="refillKg"
                                    type="number"
                                    step="0.5"
                                    placeholder="10"
                                    value={formData.refillKg}
                                    onChange={(e) => setFormData({ ...formData, refillKg: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Price per Fill (Rs.) *</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    placeholder="2500"
                                    value={formData.pricePerFill}
                                    onChange={(e) => setFormData({ ...formData, pricePerFill: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="deposit">Deposit Amount (Rs.)</Label>
                                <Input
                                    id="deposit"
                                    type="number"
                                    placeholder="5000"
                                    value={formData.depositAmount}
                                    onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                className="w-full border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm h-20"
                                placeholder="Industrial oxygen cylinder for welding"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={processing}>
                            Cancel
                        </Button>
                        <Button onClick={handleAdd} disabled={processing}>
                            {processing ? <LoadingSpinner size="sm" /> : 'Add Type'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Bottle Type</DialogTitle>
                        <DialogDescription>Update bottle type details</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Name *</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-capacity">Capacity (Liters) *</Label>
                                <Input
                                    id="edit-capacity"
                                    type="number"
                                    step="0.5"
                                    value={formData.capacityLiters}
                                    onChange={(e) => setFormData({ ...formData, capacityLiters: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-refillKg">Fill Amount (kg) *</Label>
                                <Input
                                    id="edit-refillKg"
                                    type="number"
                                    step="0.5"
                                    value={formData.refillKg}
                                    onChange={(e) => setFormData({ ...formData, refillKg: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-price">Price per Fill (Rs.) *</Label>
                                <Input
                                    id="edit-price"
                                    type="number"
                                    value={formData.pricePerFill}
                                    onChange={(e) => setFormData({ ...formData, pricePerFill: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-deposit">Deposit Amount (Rs.)</Label>
                                <Input
                                    id="edit-deposit"
                                    type="number"
                                    value={formData.depositAmount}
                                    onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <textarea
                                id="edit-description"
                                className="w-full border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm h-20"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={processing}>
                            Cancel
                        </Button>
                        <Button onClick={handleEdit} disabled={processing}>
                            {processing ? <LoadingSpinner size="sm" /> : 'Save Changes'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Bottle Type
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{selectedType?.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={processing}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={processing}>
                            {processing ? <LoadingSpinner size="sm" /> : 'Delete'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

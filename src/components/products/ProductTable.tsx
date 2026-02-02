import { Product } from '@/types';
import { categories } from '@/data';

interface ProductTableProps {
  products: Product[];
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Unknown';
  };

  const getStockColor = (stock: number) => {
    if (stock === 0) return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30';
    if (stock <= 10) return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/30';
    return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/30';
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
            <tr>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Product</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">SKU</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Category</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Price</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Stock</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="py-4 px-6">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-slate-100">{product.name}</p>
                    <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="text-sm text-gray-600">{product.sku}</span>
                </td>
                <td className="py-4 px-6">
                  <span className="text-sm text-gray-600">{getCategoryName(product.categoryId)}</span>
                </td>
                <td className="py-4 px-6">
                  <span className="font-semibold text-gray-900 dark:text-slate-100">${product.price.toFixed(2)}</span>
                </td>
                <td className="py-4 px-6">
                  <span className={`px-2 py-1 rounded-full text-sm ${getStockColor(product.stock)}`}>
                    {product.stock}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(product)}
                        className="text-cyan-600 hover:text-cyan-700 text-sm font-medium"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(product)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { Product } from '@/types';

interface TopProductsProps {
  products: { product: Product; quantity: number }[];
}

export function TopProducts({ products }: TopProductsProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
      <div className="p-6 border-b border-gray-100 dark:border-slate-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Top Selling Products</h3>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-slate-800">
        {products.map(({ product, quantity }, index) => (
          <div key={product.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-cyan-100 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 rounded-full flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-slate-100">{product.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{product.sku}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-slate-100">{quantity} sold</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">${product.price.toFixed(2)} each</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-100 dark:border-slate-800">
        <a href="/products" className="text-cyan-600 hover:text-cyan-700 text-sm font-medium">
          View all products →
        </a>
      </div>
    </div>
  );
}

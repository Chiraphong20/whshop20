import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import ProductCard from '../pages/ProductCard';
import { Product } from '../types';
import { API_URL, getAuthHeaders } from '../config';

interface ProductListPageProps {
  addToCart: (p: Product) => void;
  cartCount: number;
  // ❌ ลบ products และ isLoading ออกจาก Props เพราะเราจะดึงเอง
}

const ProductListPage: React.FC<ProductListPageProps> = ({ addToCart, cartCount }) => {
  const { categoryName } = useParams();
  const [searchQuery, setSearchQuery] = useState('');

  // 🟢 State สำหรับเก็บข้อมูลสินค้าและสถานะการโหลด
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const decodedCategory = decodeURIComponent(categoryName || '');

  // 🟢 ดึงข้อมูลสินค้าจาก Backend API เมื่อเปิดหน้านี้
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/products`, { headers: getAuthHeaders() });
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        } else {
          console.error('Failed to fetch products');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // กรองเฉพาะหมวดหมู่ และค้นหาชื่อ
  const filtered = products.filter((p) =>
    p.category?.split('/').includes(decodedCategory) &&
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen bg-slate-100 flex flex-col">
      <Header title={decodedCategory || 'สินค้า'} backTo="/shop" cartCount={cartCount} />

      <div className="bg-white px-4 py-3 shadow-sm border-b border-slate-200 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={`ค้นหาใน ${decodedCategory}...`}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 border border-slate-200 text-slate-900"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
        {/* ✅ ถ้ากำลังโหลดข้อมูลจาก Backend ให้แสดง Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 pb-20">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full animate-pulse">
                <div className="aspect-square bg-slate-200 flex items-center justify-center">
                  <Loader2 className="animate-spin text-slate-400" size={32} />
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="h-3 bg-slate-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <div className="h-5 bg-slate-200 rounded w-1/2"></div>
                    <div className="w-9 h-9 bg-slate-200 rounded-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Search size={48} className="mx-auto mb-4 opacity-50" />
            <p>ไม่พบสินค้าในหมวดหมู่นี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-20">
            {filtered.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isNew={false}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductListPage;
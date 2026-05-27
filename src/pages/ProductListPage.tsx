import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Loader2, TrendingUp, Star, ShoppingBag } from 'lucide-react';
import Header from '../components/Header';
import ProductCard from '../pages/ProductCard';
import { Product, Order } from '../types';
import { API_URL, getAuthHeaders } from '../config';

interface ProductListPageProps {
  addToCart: (p: Product) => void;
  cartCount: number;
  allOrders?: Order[];
}

const ProductListPage: React.FC<ProductListPageProps> = ({ addToCart, cartCount }) => {
  const { categoryName } = useParams();
  const [searchQuery, setSearchQuery] = useState('');

  // 🟢 State สำหรับเก็บข้อมูลสินค้าและสถานะการโหลด
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 📈 State สำหรับหน้าสินค้าขายดี
  const [bestSellers, setBestSellers] = useState<(Product & { soldQty?: number })[]>([]);
  const [trending, setTrending] = useState<(Product & { trendQty?: number })[]>([]);
  const [isBestLoading, setIsBestLoading] = useState(true);

  const decodedCategory = decodeURIComponent(categoryName || '');
  const isBestSellerPage = decodedCategory === 'สินค้าขายดี';

  // 🟢 ดึงข้อมูลสินค้าจาก Backend API เมื่อเปิดหน้านี้
  useEffect(() => {
    if (isBestSellerPage) {
      // โหมดสินค้าขายดี: ดึงจาก 2 endpoint พิเศษ
      const fetchBestData = async () => {
        setIsBestLoading(true);
        try {
          const [resTrend, resBest] = await Promise.all([
            fetch(`${API_URL}/api/products/trending?days=7&limit=20`, { headers: getAuthHeaders() }),
            fetch(`${API_URL}/api/products/best-sellers?limit=20`, { headers: getAuthHeaders() }),
          ]);
          if (resTrend.ok) setTrending(await resTrend.json());
          if (resBest.ok) setBestSellers(await resBest.json());
        } catch (error) {
          console.error('Error fetching best seller data:', error);
        } finally {
          setIsBestLoading(false);
          setIsLoading(false);
        }
      };
      fetchBestData();
    } else {
      // โหมดปกติ: ดึงสินค้าทั้งหมดแล้วกรองตามหมวดหมู่
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
    }
  }, [isBestSellerPage]);

  const twentyDaysAgo = new Date();
  twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

  // กรองสินค้าสำหรับหมวดหมู่ทั่วไปและสินค้าใหม่
  let filtered: Product[] = [];
  if (decodedCategory === 'สินค้าใหม่') {
    filtered = products.filter(p =>
      p.createdAt && new Date(p.createdAt) >= twentyDaysAgo &&
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  } else if (!isBestSellerPage) {
    filtered = products.filter((p) =>
      p.category?.split('/').includes(decodedCategory) &&
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // รวม trending + bestSellers เป็นรายการเดียว (trending มาก่อน, ไม่ซ้ำกัน)
  const bestSellerIds = new Set(bestSellers.map(p => p.id));
  const combinedMap = new Map<string, any>();
  trending.forEach(p => combinedMap.set(p.id, { ...p, _isTrending: true, _isBest: bestSellerIds.has(p.id) }));
  bestSellers.forEach(p => {
    if (!combinedMap.has(p.id)) combinedMap.set(p.id, { ...p, _isTrending: false, _isBest: true });
    else combinedMap.set(p.id, { ...combinedMap.get(p.id), _isBest: true });
  });
  const combined = Array.from(combinedMap.values())
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Skeleton loader
  const SkeletonGrid = () => (
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
  );

  // =====================================================
  // 🏆 UI สำหรับหน้าสินค้าขายดี (รวม มาแรง + ขายดีที่สุด)
  // =====================================================
  if (isBestSellerPage) {
    return (
      <div className="h-screen bg-slate-100 flex flex-col">
        <Header title="สินค้าขายดี" backTo="/shop" cartCount={cartCount} />

        {/* Search */}
        <div className="bg-white px-4 py-3 shadow-sm border-b border-slate-200 z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="ค้นหาสินค้า..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 border border-slate-200 text-slate-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Badge summary */}
        {!isBestLoading && (
          <div className="bg-white px-4 pb-2 pt-1 flex items-center gap-2 border-b border-slate-100">
            <span className="flex items-center gap-1 bg-orange-50 text-orange-600 text-xs font-bold px-2 py-1 rounded-full border border-orange-100">
              <TrendingUp size={11} /> มาแรง {trending.length}
            </span>
            <span className="text-slate-300 text-xs">+</span>
            <span className="flex items-center gap-1 bg-yellow-50 text-yellow-600 text-xs font-bold px-2 py-1 rounded-full border border-yellow-100">
              <Star size={11} /> ขายดีที่สุด {bestSellers.length}
            </span>
            <span className="ml-auto text-slate-400 text-xs">{combined.length} รายการ</span>
          </div>
        )}

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
          {isBestLoading ? (
            <SkeletonGrid />
          ) : combined.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium">ยังไม่มีข้อมูลสินค้าขายดี</p>
              <p className="text-xs mt-1 text-slate-300">ระบบจะอัปเดตเมื่อมีการสั่งซื้อสินค้า</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-20">
              {combined.map((p, index) => (
                <div key={p.id} className="relative">
                  {/* Badge อันดับ */}
                  {index < 3 && (
                    <div className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold text-white shadow ${
                      index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-slate-400' : 'bg-amber-600'
                    }`}>
                      {index + 1}
                    </div>
                  )}
                  {/* Badge ประเภท */}
                  {!p._isFallback && (
                    <div className="absolute top-2 right-2 z-10 flex flex-col gap-0.5 items-end">
                      {p._isTrending && (
                        <span className="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow leading-tight">
                          🔥 {p.trendQty || 0}{p._usedDays ? `/${p._usedDays}ว` : '/7ว'}
                        </span>
                      )}
                      {p._isBest && (p.soldQty || 0) > 0 && (
                        <span className="bg-yellow-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow leading-tight">
                          ⭐ {p.soldQty || 0} ชิ้น
                        </span>
                      )}
                    </div>
                  )}
                  <ProductCard product={p} isNew={false} onAddToCart={addToCart} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =====================================================
  // 🛍️ UI ปกติสำหรับหมวดหมู่อื่นๆ
  // =====================================================
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
        {isLoading ? (
          <SkeletonGrid />
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

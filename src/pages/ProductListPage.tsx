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
  const [activeTab, setActiveTab] = useState<'trending' | 'best'>('trending');
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

  // กรองสินค้าขายดีตาม searchQuery
  const filteredTrending = trending.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredBestSellers = bestSellers.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
  // 🏆 UI สำหรับหน้าสินค้าขายดี (2 แท็บ)
  // =====================================================
  if (isBestSellerPage) {
    const activeProducts = activeTab === 'trending' ? filteredTrending : filteredBestSellers;
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

        {/* Tab Switcher */}
        <div className="bg-white border-b border-slate-200 px-4 pt-3 pb-0">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('trending')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-t-lg transition-all border-b-2 ${
                activeTab === 'trending'
                  ? 'border-orange-500 text-orange-600 bg-orange-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <TrendingUp size={15} />
              มาแรง 🔥
              {!isBestLoading && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === 'trending' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  {filteredTrending.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('best')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-t-lg transition-all border-b-2 ${
                activeTab === 'best'
                  ? 'border-yellow-500 text-yellow-600 bg-yellow-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Star size={15} />
              ขายดีที่สุด ⭐
              {!isBestLoading && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === 'best' ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  {filteredBestSellers.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Description banner */}
        <div className={`px-4 py-2 text-xs font-medium ${
          activeTab === 'trending'
            ? 'bg-orange-50 text-orange-700 border-b border-orange-100'
            : 'bg-yellow-50 text-yellow-700 border-b border-yellow-100'
        }`}>
          {activeTab === 'trending'
            ? '🔥 สินค้าที่มีคนสั่งซื้อมากที่สุดใน 7 วันล่าสุด'
            : '⭐ สินค้าที่มียอดขายสะสมสูงสุดตลอดกาล'}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
          {isBestLoading ? (
            <SkeletonGrid />
          ) : activeProducts.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium">
                {activeTab === 'trending'
                  ? 'ยังไม่มีข้อมูลสินค้ามาแรงในช่วงนี้'
                  : 'ยังไม่มีข้อมูลสินค้าขายดี'}
              </p>
              <p className="text-xs mt-1 text-slate-300">
                ระบบจะอัปเดตข้อมูลเมื่อมีการสั่งซื้อสินค้า
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-20">
              {activeProducts.map((p, index) => (
                <div key={p.id} className="relative">
                  {/* Badge อันดับ */}
                  {index < 3 && (
                    <div className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold text-white shadow ${
                      index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-slate-400' : 'bg-amber-600'
                    }`}>
                      {index + 1}
                    </div>
                  )}
                  {/* Badge ยอดขาย (ซ่อนถ้าเป็น fallback) */}
                  {!(p as any)._isFallback && (
                    <div className={`absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow ${
                      activeTab === 'trending' ? 'bg-orange-500' : 'bg-yellow-500'
                    }`}>
                      {activeTab === 'trending'
                        ? `${(p as any).trendQty || 0} ชิ้น/${(p as any)._usedDays ? `${(p as any)._usedDays}วัน` : 'สัปดาห์'}`
                        : `${(p as any).soldQty || p.soldQty || 0} ชิ้น`}
                    </div>
                  )}
                  <ProductCard
                    product={p}
                    isNew={false}
                    onAddToCart={addToCart}
                  />
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

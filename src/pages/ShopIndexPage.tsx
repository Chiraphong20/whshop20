import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, Plus, ShoppingBag, Gift, Truck, HelpCircle } from 'lucide-react';
import Header from '../components/Header';
import { CATEGORIES } from '../constants';
import { Product } from '../types';

interface ShopIndexPageProps {
  cartCount: number;
  products: Product[];
  addToCart: (product: Product) => void;
  isLoading?: boolean; // ✅ เพิ่ม Prop สำหรับเช็คสถานะโหลดข้อมูล
}

const ShopIndexPage: React.FC<ShopIndexPageProps> = ({ cartCount, products, addToCart, isLoading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // 🔎 Logic การกรองสินค้า
  let filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.includes(searchTerm)
  );

  // 🔄 Logic การจัดเรียงสินค้า
  filteredProducts = filteredProducts.sort((a, b) => {
    switch (sortBy) {
      case 'price_asc':
        return a.retailPrice - b.retailPrice;
      case 'price_desc':
        return b.retailPrice - a.retailPrice;
      case 'name_asc':
        return a.name.localeCompare(b.name, 'th');
      case 'name_desc':
        return b.name.localeCompare(a.name, 'th');
      case 'newest':
      default:
        // สมมติว่า ID ยิ่งมากยิ่งใหม่ (หรือถ้าไม่มีฟิลด์วันที่ ให้ยึดลำดับเดิม)
        return b.id.localeCompare(a.id);
    }
  });

  return (
    <div className="h-screen bg-slate-100 flex flex-col">
      <Header title="เลือกซื้อสินค้า" cartCount={cartCount} />

      {/* 🔍 Search Bar Section */}
      <div className="bg-white p-4 pb-2 sticky top-[56px] z-10 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="ค้นหาสินค้า หรือหมวดหมู่..."
            className="w-full bg-slate-100 pl-10 pr-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-orange-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* 🔄 Sort Dropdown */}
        {searchTerm && (
          <div className="mt-3 flex justify-end">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block p-2 outline-none"
            >
              <option value="newest">อัพเดตล่าสุด</option>
              <option value="price_asc">ราคา: ต่ำ - สูง</option>
              <option value="price_desc">ราคา: สูง - ต่ำ</option>
              <option value="name_asc">ชื่อ: ก - ฮ</option>
              <option value="name_desc">ชื่อ: ฮ - ก</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 pt-2">

        {searchTerm ? (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-sm text-slate-500 font-medium mb-2">
              ผลการค้นหา "{searchTerm}" {!isLoading && `(${filteredProducts.length})`}
            </h2>

            {/* ✅ แสดง Skeleton ระหว่างค้นหาและโหลดข้อมูล */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white p-3 rounded-xl shadow-sm flex gap-3 animate-pulse">
                    <div className="w-20 h-20 bg-slate-200 rounded-lg"></div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      <div className="flex justify-between items-end mt-2">
                        <div className="h-5 bg-slate-200 rounded w-16"></div>
                        <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white p-2.5 rounded-xl shadow-sm flex gap-2.5 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => window.location.href = `/product/${product.id}`}
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-200 rounded-lg flex-shrink-0 overflow-hidden relative">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="absolute top-0 left-0 w-full h-[120%] object-cover object-top"
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400?text=No+Image'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No Image</div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm line-clamp-1 leading-snug">{product.name}</h3>
                      <p className="text-[10px] text-slate-400">{product.category}</p>
                    </div>
                    <div className="flex justify-between items-center mt-1.5 gap-1">
                      <div className="min-w-0">
                        <div className="text-orange-600 font-extrabold text-sm leading-none">
                          ฿{product.retailPrice > 0 ? product.retailPrice.toLocaleString() : product.wholesalePrice.toLocaleString()}
                          <span className="text-slate-400 font-normal text-[10px] ml-0.5">/{product.unit || 'ชิ้น'}</span>
                        </div>
                        {product.retailPrice > 0 && product.wholesalePrice > 0 && (
                          <div className="text-[9px] text-green-700 font-semibold mt-0.5 leading-tight">
                            ส่ง ฿{product.wholesalePrice} (≥{product.minWholesaleQty})
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                        className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center active:scale-90 transition-transform hover:bg-orange-200 flex-shrink-0"
                      >
                        <Plus size={18} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400">
                <Search size={48} className="mx-auto mb-2 opacity-20" />
                <p>ไม่พบสินค้าที่ค้นหา</p>
              </div>
            )}
          </div>
        ) : (
          /* CASE 2: ยังไม่ค้นหา (แสดงหมวดหมู่เหมือนเดิม) */
          <div className="grid grid-cols-2 gap-3 animate-in fade-in zoom-in duration-300">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                to={`/shop/${cat.name}`}
                className={`aspect-[4/3] ${cat.color} bg-white border rounded-xl flex flex-col items-center justify-center gap-2 shadow-sm transition-all active:scale-95 hover:shadow-md`}
              >
                <div className="p-2.5 bg-slate-50 rounded-full shadow-inner border border-slate-100 text-slate-700">
                  {cat.icon}
                </div>
                <span className="font-bold text-slate-800 text-sm text-center px-1">{cat.name}</span>
              </Link>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};

export default ShopIndexPage;
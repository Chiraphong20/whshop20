import React, { useState } from 'react';
import { Plus, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  isNew?: boolean;
  onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, isNew, onAddToCart }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 🌟 State สำหรับจับระยะการปัดหน้าจอ (Swipe) แบบแกน X, Y
  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number, y: number } | null>(null);

  // 🌟 ป้องกันกรณี Backend ส่ง images มาเป็น String (กันแอปพัง)
  let parsedImages: string[] = [];
  if (typeof product.images === 'string') {
    try { parsedImages = JSON.parse(product.images); } catch (e) { parsedImages = []; }
  } else if (Array.isArray(product.images)) {
    parsedImages = product.images;
  }

  // เตรียมรายการรูปทั้งหมด
  const allImages = parsedImages.length > 0 ? parsedImages : (product.image ? [product.image] : []);

  const handleOpenPreview = () => {
    if (allImages.length > 0) {
      setCurrentImageIndex(0);
      setShowPreview(true);
    }
  };

  const handlePrevImage = (e?: React.MouseEvent | Event) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNextImage = (e?: React.MouseEvent | Event) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  // 🌟 ฟังก์ชันจัดการการปัดหน้าจอ (Swipe) - ปรับปรุงใหม่ให้แม่นยำและลื่นขึ้น
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const xDistance = touchStart.x - touchEnd.x;
    const yDistance = touchStart.y - touchEnd.y;

    const minSwipeDistance = 40; // ระยะปัดขั้นต่ำ

    // ปัดแนวนอนต้องมีระยะมากกว่าแนวตั้ง (ป้องกันปัดขึ้นลงแล้วรูปเปลี่ยน)
    if (Math.abs(xDistance) > Math.abs(yDistance) && Math.abs(xDistance) > minSwipeDistance) {
      if (xDistance > 0) {
        handleNextImage(); // ปัดซ้ายไปขวา
      } else {
        handlePrevImage(); // ปัดขวาไปซ้าย
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <>
      {/* === ส่วนการ์ดสินค้า === */}
      <div
        className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full relative group cursor-pointer"
        onClick={() => window.location.href = `/product/${product.id}`}
      >
        <div
          className="aspect-square bg-slate-50 relative overflow-hidden"
        >
          {product.image ? (
            <>
              {/* 🌟 Crop ส่วนล่างทิ้งด้วย h-[120%] และ object-top เพื่อซ่อนราคาสินค้า */}
              <img
                src={product.image}
                alt={product.name}
                className="absolute top-0 left-0 w-full h-[120%] object-cover object-top transition-transform duration-500 group-hover:scale-110"
                draggable="false"
                onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400?text=No+Image'; }}
              />
              <div
                className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center"
                onClick={(e) => { e.stopPropagation(); handleOpenPreview(); }}
              >
                <div className="bg-black/60 text-white text-[10px] px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <Eye size={12} /> ดูภาพ ({allImages.length})
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100 text-xs">No Image</div>
          )}
          {isNew && <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10 pointer-events-none">ใหม่</span>}
          {allImages.length > 1 && (
            <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10 pointer-events-none">
              +{allImages.length - 1} รูป
            </span>
          )}
        </div>

        <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-slate-400 mb-0.5 leading-tight">{product.category}</p>
            <h3 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2 leading-tight mb-1.5">{product.name}</h3>
          </div>
        <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-slate-100">
            {/* กรณีมีทั้งราคาปลีกและส่ง (แสดง 2 ปุ่ม) และราคาส่งมากกว่า 20 บาท */}
            {product.retailPrice > 0 && product.wholesalePrice > 20 && product.minWholesaleQty > 1 ? (
              <>
                {/* 🛒 ปุ่มซื้อปลีก */}
                <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                  <div className="flex-1 min-w-0 pr-1 leading-tight">
                    <div className="flex items-baseline gap-1">
                      <span className="text-orange-600 font-extrabold text-base sm:text-lg">
                        ฿{product.retailPrice.toLocaleString()}
                      </span>
                      <span className="text-slate-400 text-[10px]">/{product.unit || 'ชิ้น'}</span>
                    </div>
                    {(product.unitQty ?? 1) > 1 && (
                      <div className="text-[9px] text-blue-600 bg-blue-50 font-medium px-1 py-0.5 rounded mt-0.5 inline-block">
                        📦 1 {product.unit} = {product.unitQty}ชิ้น
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                    className="w-8 h-8 flex-shrink-0 bg-slate-800 text-white rounded-md flex items-center justify-center shadow-md active:scale-90 transition-transform hover:bg-slate-700"
                    title="หยิบใส่ตะกร้า 1 ชิ้น"
                  >
                    <Plus size={18} strokeWidth={3} />
                  </button>
                </div>

                {/* 📦 ปุ่มซื้อส่ง */}
                <div className="flex justify-between items-center bg-green-50 p-1.5 rounded-lg border border-green-100">
                  <div className="flex-1 min-w-0 pr-1 leading-tight">
                    <div className="text-[10px] text-green-700 font-bold flex items-center gap-1 mb-0.5">
                      <span className="bg-green-600 text-white px-1 py-0.5 rounded text-[8px] leading-none uppercase tracking-wider">ราคาส่ง</span>
                    </div>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-green-700 font-extrabold text-sm sm:text-base">
                        {product.wholesalePrice.toLocaleString()} บาท
                      </span>
                      <span className="text-green-700 text-xs font-bold font-sans">
                         {product.minWholesaleQty}{product.unit || 'ชิ้น'} / แพ็ค
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      for(let i=0; i<product.minWholesaleQty; i++) {
                        onAddToCart(product); 
                      }
                    }}
                    className="flex-shrink-0 bg-green-600 text-white text-[10px] font-bold px-2 py-1.5 rounded-md flex items-center justify-center shadow-md active:scale-90 transition-transform hover:bg-green-700"
                  >
                    + {product.minWholesaleQty} ชิ้น
                  </button>
                </div>
              </>
            ) : (
              /* กรณีมีราคาเดียว (แสดงแบบเดิมๆ) */
              <div className="flex justify-between items-end mt-1">
                <div className="min-w-0 flex-1 pr-1">
                  {(product.unitQty ?? 1) > 1 && (
                    <div className="text-[9px] text-blue-600 bg-blue-50 font-medium px-1 py-0.5 rounded mb-1 inline-block leading-tight">
                      📦 1 {product.unit} = {product.unitQty}ชิ้น
                    </div>
                  )}
                  <div className="flex items-baseline gap-0.5 flex-wrap">
                    <span className="text-orange-600 font-extrabold text-base sm:text-lg leading-none">
                      ฿{product.retailPrice > 0 ? product.retailPrice.toLocaleString() : product.wholesalePrice.toLocaleString()}
                    </span>
                    <span className="text-slate-400 text-[10px]">/{product.unit || 'ชิ้น'}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                  className="w-9 h-9 flex-shrink-0 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg shadow-slate-900/20 active:scale-90 transition-transform hover:bg-slate-800"
                >
                  <Plus size={20} strokeWidth={3} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === ส่วน Modal Gallery พร้อมระบบ Swipe โฉมใหม่ === */}
      {showPreview && allImages.length > 0 && (
        <div
          // 🌟 เพิ่ม touch-none เพื่อป้องกัน Browser แย่งการปัดนิ้วไป scroll หน้าจอแทน
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200 touch-none"
          onClick={() => setShowPreview(false)}
          // 🌟 ย้าย Event มาไว้ที่คอนเทนเนอร์หลักสุด เพื่อให้ปัดตรงไหนบนจอก็เลื่อนรูปได้
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <button className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all z-50" onClick={(e) => { e.stopPropagation(); setShowPreview(false); }}>
            <X size={24} />
          </button>

          <div
            className="relative w-full max-w-4xl h-full max-h-[85vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >

            {allImages.length > 1 && (
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 p-3 rounded-full transition-all z-10 hidden md:block"
                onClick={handlePrevImage}
              >
                <ChevronLeft size={32} />
              </button>
            )}

            <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg shadow-2xl bg-white max-h-[70vh]">
              <img
                key={currentImageIndex}
                src={allImages[currentImageIndex]}
                alt={`${product.name} - ${currentImageIndex + 1}`}
                className="w-full h-[120%] object-cover object-top animate-in fade-in zoom-in duration-300 pointer-events-none select-none"
                draggable="false"
                onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400?text=No+Image'; }}
              />
            </div>

            {allImages.length > 1 && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 p-3 rounded-full transition-all z-10 hidden md:block"
                onClick={handleNextImage}
              >
                <ChevronRight size={32} />
              </button>
            )}

            <div className="text-white text-center mt-4 font-medium text-lg px-4 line-clamp-2">{product.name}</div>

            {/* 🌟 คำแนะนำให้ปัดบนมือถือ (แสดงเฉพาะเมื่อมีหลายรูป) */}
            {allImages.length > 1 && (
              <div className="text-white/50 text-xs mt-2 md:hidden flex items-center justify-center gap-2 animate-pulse w-full">
                <ChevronLeft size={12} /> ปัดซ้าย-ขวาเพื่อเลื่อนรูป <ChevronRight size={12} />
              </div>
            )}

            {allImages.length > 1 && (
              <div className="flex flex-wrap justify-center gap-2 mt-3 px-4">
                {allImages.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex ? 'bg-white w-4' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ProductCard;
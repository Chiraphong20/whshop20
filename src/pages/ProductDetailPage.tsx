import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Plus, Minus, Image as ImageIcon } from 'lucide-react';
import { Product } from '../types';

interface ProductDetailPageProps {
    products: Product[];
    addToCart: (product: Product) => void;
    cartCount: number;
}

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ products, addToCart, cartCount }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const product = products.find(p => p.id === id);

    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    if (!product) {
        return (
            <div className="h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <ImageIcon size={48} className="text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">ไม่พบสินค้า</h2>
                <button onClick={() => navigate(-1)} className="px-6 py-2 bg-orange-500 text-white rounded-xl">กลับ</button>
            </div>
        );
    }

    // รวมรูปภาพหลักและรูปภาพเพิ่มเติม
    const allImages = [product.image, ...(product.images || [])].filter(Boolean);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col pb-24">
            {/* Header โปร่งใสทับรูปภาพ */}
            <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
                <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-95 transition-transform">
                    <ArrowLeft size={20} />
                </button>
                <button onClick={() => navigate('/cart')} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white relative active:scale-95 transition-transform">
                    <ShoppingCart size={20} />
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-900">
                            {cartCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Image Gallery */}
            <div className="relative w-full aspect-square bg-white">
                {allImages.length > 0 ? (
                    <>
                        {/* 🌟 Crop ส่วนล่างทิ้งด้วย h-[120%] และ object-top เพื่อซ่อนราคาสินค้า */}
                        <img
                            src={allImages[currentImageIndex]}
                            alt={product.name}
                            className="w-full h-[120%] object-cover object-top"
                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400?text=No+Image'; }}
                        />
                        {/* Dots */}
                        {allImages.length > 1 && (
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                {allImages.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`w-2 h-2 rounded-full transition-all ${currentImageIndex === idx ? 'bg-orange-500 w-4' : 'bg-white/50 backdrop-blur-sm'}`}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-100">
                        <ImageIcon size={48} className="mb-2 opacity-50" />
                        <span className="text-sm font-medium">ไม่มีรูปภาพ</span>
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="flex-1 bg-white p-4 sm:p-5 rounded-t-3xl -mt-6 relative z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4"></div>
                <div className="text-orange-500 font-bold text-xs sm:text-sm mb-1">{product.category}</div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 mb-2 leading-tight">{product.name}</h1>

                <div className="flex flex-wrap items-end gap-3 mb-4 pb-4 border-b border-slate-100">
                    {/* ราคา 1 - Highlight ใหญ่โต */}
                    <div>
                        {/* Pack size info */}
                        {(product.unitQty ?? 1) > 1 && (
                            <div className="mb-1 inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-full">
                                📦 1 {product.unit} = {product.unitQty} ชิ้น
                            </div>
                        )}
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl sm:text-4xl font-black text-orange-600">
                                ฿{product.retailPrice > 0 ? product.retailPrice.toLocaleString() : product.wholesalePrice.toLocaleString()}
                            </span>
                            <span className="text-slate-400 text-sm">/ {product.unit || 'ชิ้น'}</span>
                        </div>
                        {/* เงื่อนไขราคา 1 (เมื่อมีราคา 2 ด้วย) */}
                        {product.retailPrice > 0 && product.wholesalePrice > 0 && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                                (สั่ง 1–{product.minWholesaleQty - 1} {product.unit})
                            </div>
                        )}
                    </div>
                    {/* ราคา 2 - Strong badge */}
                    {product.wholesalePrice > 20 && (
                        <div className="bg-green-50 border border-green-200 text-green-800 px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1 flex-wrap">
                            <span>🏷️</span>
                            <span>ส่ง <strong>฿{product.wholesalePrice.toLocaleString()}</strong></span>
                            <span className="text-[10px] text-green-600 font-normal">(≥{product.minWholesaleQty} {product.unit})</span>
                        </div>
                    )}
                </div>

                {/* 📦 ดีลราคาส่ง */}
                {(product.wholesalePrice ?? 0) > 20 && (product.minWholesaleQty ?? 1) > 1 && (
                    <div className="mb-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 animate-in fade-in duration-300">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-base">📦</span>
                                    <span className="text-xs font-bold text-orange-700 uppercase tracking-wide">ราคาส่ง</span>
                                </div>
                                <p className="text-sm font-bold text-slate-800">
                                    สั่ง <span className="text-orange-600">{product.minWholesaleQty} {product.unit || 'ชิ้น'}</span> ขึ้นไป
                                </p>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                    <span className="text-xl font-black text-orange-700">฿{product.wholesalePrice}</span>
                                    <span className="text-xs text-slate-400">/ {product.unit}</span>
                                    {(product.retailPrice ?? 0) > 0 && (
                                        <span className="text-[10px] text-slate-400 line-through">฿{product.retailPrice}</span>
                                    )}
                                </div>
                                {(product.retailPrice ?? 0) > 0 && (product.wholesalePrice ?? 0) < product.retailPrice && (
                                    <p className="text-[10px] text-green-600 font-semibold mt-0.5">
                                        ประหยัด ฿{(product.retailPrice - (product.wholesalePrice ?? 0))} / {product.unit}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    const bulkQty = product.minWholesaleQty ?? 1;
                                    for (let i = 0; i < bulkQty; i++) addToCart(product);
                                    navigate('/cart');
                                }}
                                className="flex-shrink-0 px-4 py-2.5 bg-orange-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-200 active:scale-95 transition-transform hover:bg-orange-600 whitespace-nowrap"
                            >
                                ➕ เพิ่มราคาส่ง
                            </button>
                        </div>
                    </div>
                )}

                {/* 🎉 ดีลพิเศษโล (Step) */}
                {(product.bulkPrice ?? 0) > 0 && (product.bulkQty ?? 0) > 0 && (
                    <div className="mb-5 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-2xl p-4 animate-in fade-in duration-300">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-base">🎉</span>
                                    <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">ราคา Step!</span>
                                </div>
                                <p className="text-sm font-bold text-slate-800">
                                    สั่ง <span className="text-purple-600">{product.bulkQty} {product.unit || 'ชิ้น'}</span> ขึ้นไป
                                </p>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                    <span className="text-xl font-black text-purple-700">฿{product.bulkPrice}</span>
                                    <span className="text-xs text-slate-400">/ {product.unit}</span>
                                    {(product.wholesalePrice ?? 0) > 0 && (
                                        <span className="text-[10px] text-slate-400 line-through">฿{product.wholesalePrice}</span>
                                    )}
                                </div>
                                {(product.wholesalePrice ?? 0) > 0 && (product.bulkPrice ?? 0) < product.wholesalePrice && (
                                    <p className="text-[10px] text-green-600 font-semibold mt-0.5">
                                        ประหยัด ฿{(product.wholesalePrice - (product.bulkPrice ?? 0))} / {product.unit}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    const bulkQty = product.bulkQty ?? 1;
                                    // เพิ่มสินค้าเข้าตะกร้า bulkQty ชิ้น
                                    for (let i = 0; i < bulkQty; i++) addToCart(product);
                                    navigate('/cart');
                                }}
                                className="flex-shrink-0 px-4 py-2.5 bg-purple-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-200 active:scale-95 transition-transform hover:bg-purple-700 whitespace-nowrap"
                            >
                                ✅ เพิ่มดีลนี้
                            </button>
                        </div>
                    </div>
                )}

                <div>
                    <h3 className="font-bold text-slate-800 mb-2">รายละเอียดสินค้า</h3>
                    <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-wrap">
                        {product.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
                    </p>
                </div>
            </div>

            {/* Footer Add to Cart */}
            <div className="fixed bottom-0 left-0 right-0 bg-white p-4 pb-6 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] border-t border-slate-100 z-20">
                <button
                    onClick={() => { addToCart(product); navigate('/cart'); }}
                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <ShoppingCart size={20} />
                    เพิ่มลงตะกร้า ฿{product.retailPrice > 0 ? product.retailPrice : product.wholesalePrice}
                </button>
            </div>
        </div>
    );
};

export default ProductDetailPage;

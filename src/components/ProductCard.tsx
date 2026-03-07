import React from 'react';
import { Product } from '../types'; // อย่าลืมสร้างไฟล์ types ของคุณเอง

interface ProductCardProps {
  product: Product;
  isNew: boolean;
  onAddToCart: (p: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, isNew, onAddToCart }) => (
  <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
    <div className="relative aspect-square bg-slate-50">
      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
      {isNew && (
        <span className="absolute top-2 right-2 bg-orange-600 text-white text-[10px] px-2 py-0.5 rounded font-bold shadow-sm">NEW</span>
      )}
    </div>
    <div className="p-2 flex-1 flex flex-col">
      <h3 className="font-medium text-slate-800 line-clamp-2 text-sm leading-tight h-10 mb-1">{product.name}</h3>
      <div className="mt-auto">
        <div className="flex flex-col gap-0.5 mb-2">
          <span className="font-bold text-lg text-orange-600">฿{product.retailPrice}</span>
          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded w-fit border border-slate-200">
            ส่ง ฿{product.wholesalePrice} ({product.minWholesaleQty}ชิ้น+)
          </span>
        </div>
        <button 
          onClick={(e) => { e.preventDefault(); onAddToCart(product); }}
          className="w-full py-1.5 bg-slate-900 text-white text-xs rounded-md hover:bg-black active:scale-95 transition-transform font-bold"
        >
          ใส่ตะกร้า
        </button>
      </div>
    </div>
  </div>
);

export default ProductCard;
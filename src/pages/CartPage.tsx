import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, MapPin, Phone, User, Truck, Store } from 'lucide-react';
import { message } from 'antd';
import { CartItem, Order } from '../types';

interface CartPageProps {
  cart: CartItem[];
  cartTotal: number;
  updateCartQty: (id: string, delta: number) => void;
  onPlaceOrder: (order: Partial<Order>) => Promise<void> | void;
  clearCart: () => void;
}

const CartPage: React.FC<CartPageProps> = ({ cart, cartTotal, updateCartQty, onPlaceOrder, clearCart }) => {
  const navigate = useNavigate();

  // State สำหรับเก็บข้อมูลลูกค้า และวิธีการรับสินค้า
  const [formData, setFormData] = useState({
    customerName: '',
    customerContact: '',
    address: '',
    deliveryMethod: 'DELIVERY' as 'DELIVERY' | 'PICKUP' // ค่าเริ่มต้นเป็นส่งถึงบ้าน
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      message.error('ตะกร้าสินค้าว่างเปล่า กรุณาเลือกสินค้าก่อนครับ');
      return;
    }

    // ถ้าเลือกแบบส่งถึงบ้าน ต้องกรอกที่อยู่ด้วย
    if (!formData.customerName || !formData.customerContact || (formData.deliveryMethod === 'DELIVERY' && !formData.address)) {
      message.error('กรุณากรอกข้อมูลให้ครบถ้วนนะครับ');
      return;
    }

    setIsSubmitting(true);

    const orderItems = cart.map(item => {
      const hasBulk = (item.bulkPrice ?? 0) > 0 && (item.bulkQty ?? 0) > 0;
      const isBulk = hasBulk && item.quantity >= (item.bulkQty ?? 0);
      const isWholesale = item.quantity >= item.minWholesaleQty;
      const price = isBulk ? (item.bulkPrice ?? 0) : isWholesale ? item.wholesalePrice : item.retailPrice;
      return {
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: price,
        totalPrice: price * item.quantity,
        productImage: item.image || ''
      };
    });

    try {
      await onPlaceOrder({
        customerName: formData.customerName,
        customerContact: formData.customerContact,
        address: formData.deliveryMethod === 'PICKUP' ? 'รับเองที่ร้าน' : formData.address,
        totalAmount: cartTotal,
        items: orderItems as any,
        deliveryMethod: formData.deliveryMethod
      });
      
      // ส่งข้อความไปหาแอดมิน (LINE OA) ในฐานะลูกค้า
      try {
        const liff = (await import('@line/liff')).default;
        if (liff.isInClient() && liff.isLoggedIn()) {
           await liff.sendMessages([
             {
               type: "text",
               text: "รับออเดอร์ด้วยน้าา"
             }
           ]);
        }
      } catch (liffErr) {
        console.error('Failed to send message via LIFF:', liffErr);
      }

      clearCart();
      navigate('/success');
    } catch (err) {
      console.error('Place order failed:', err);
      message.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
          <ShoppingBag size={48} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">ไม่มีสินค้าในตะกร้า</h2>
        <p className="text-slate-500 mb-8">ลองไปเลือกดูสินค้าเด็ดๆ ในร้านก่อนไหมครับ?</p>
        <Link to="/shop" className="px-8 py-3 bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-600 transition-colors">
          ไปช้อปปิ้งกันเลย
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-32">
      {/* Header */}
      <div className="bg-white p-4 flex items-center gap-4 shadow-sm sticky top-0 z-10">
        <Link to={-1 as any} className="p-2 bg-slate-100 rounded-full text-slate-600 active:scale-95 transition-transform"><ArrowLeft size={20} /></Link>
        <h1 className="text-lg font-bold text-slate-800 flex-1">ตะกร้าสินค้า</h1>
        <button onClick={clearCart} className="text-red-500 text-sm font-medium px-2 hover:bg-red-50 py-1 rounded-lg">ล้างตะกร้า</button>
      </div>

      <div className="flex-1 p-4 space-y-6">
        {/* รายการสินค้า */}
        <div className="space-y-2.5">
          {cart.map(item => {
            const hasBulk = (item.bulkPrice ?? 0) > 0 && (item.bulkQty ?? 0) > 0;
            const isBulk = hasBulk && item.quantity >= (item.bulkQty ?? 0);
            // ✅ Logic: qty >= minWholesaleQty → ราคา 2, มิฉะนั้น → ราคา 1
            const isWholesale = item.quantity >= item.minWholesaleQty;
            const price = isBulk ? (item.bulkPrice ?? 0) : isWholesale ? item.wholesalePrice : item.retailPrice;
            const neededForWholesale = !isWholesale && !isBulk && item.wholesalePrice > 0 && item.wholesalePrice < item.retailPrice
              ? item.minWholesaleQty - item.quantity
              : 0;
            return (
              <div key={item.id} className="bg-white p-2.5 rounded-xl shadow-sm flex gap-2.5 border border-slate-100">
                {/* รูปภาพ: ลดขนาดบนจอเล็ก */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 relative">
                  {item.image ? (
                    <img
                      src={item.image}
                      className="absolute top-0 left-0 w-full h-[120%] object-cover object-top"
                      onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400?text=No+Image'; }}
                    />
                  ) : (
                    <ShoppingBag className="w-full h-full p-3 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2 leading-snug">{item.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      {/* ราคา 1 - Highlight */}
                      <span className="text-orange-600 font-extrabold text-sm">฿{price.toLocaleString()}</span>
                      <span className="text-slate-400 text-[10px]">/{item.unit || 'ชิ้น'}</span>
                      {isBulk && <span className="text-[9px] font-bold bg-purple-100 text-purple-700 px-1 py-0.5 rounded-full">🎉 พิเศษ</span>}
                      {!isBulk && isWholesale && <span className="text-[9px] font-bold bg-green-100 text-green-700 px-1 py-0.5 rounded-full">🏷️ ส่ง</span>}
                    </div>
                    {/* Hint: เพิ่มอีก X เพื่อราคาส่ง */}
                    {neededForWholesale > 0 && (
                      <div className="text-[9px] text-amber-600 bg-amber-50 font-medium px-1.5 py-0.5 rounded mt-0.5 inline-block leading-tight">
                        +{neededForWholesale} {item.unit} → ฿{item.wholesalePrice}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1.5 gap-1">
                    <div className="font-black text-orange-600 text-sm">฿{(price * item.quantity).toLocaleString()}</div>
                    <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200 flex-shrink-0">
                      <button onClick={() => updateCartQty(item.id, -1)} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-l-lg active:bg-slate-300"><Minus size={14} /></button>
                      <span className="w-7 text-center font-bold text-sm text-slate-800">{item.quantity}</span>
                      <button onClick={() => updateCartQty(item.id, 1)} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-r-lg active:bg-slate-300"><Plus size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* เลือกวิธีรับสินค้า */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-50 pb-3">
            <Truck size={18} className="text-orange-500" /> เลือกวิธีรับสินค้า
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, deliveryMethod: 'DELIVERY' })}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${formData.deliveryMethod === 'DELIVERY' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-100 bg-slate-50 text-slate-500'}`}
            >
              <Truck size={24} />
              <span className="font-bold text-sm">จัดส่งถึงบ้าน</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, deliveryMethod: 'PICKUP' })}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${formData.deliveryMethod === 'PICKUP' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-100 bg-slate-50 text-slate-500'}`}
            >
              <Store size={24} />
              <span className="font-bold text-sm">รับเองที่ร้าน</span>
            </button>
          </div>
        </div>

        {/* ฟอร์มข้อมูลการจัดส่ง */}
        <form id="checkout-form" onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
            <User size={18} className="text-orange-500" /> ข้อมูลผู้ติดต่อ
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">ชื่อ-นามสกุล</label>
              <input required type="text" className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-orange-400 bg-slate-50 focus:bg-white transition-all"
                placeholder="ใส่ชื่อผู้รับ" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
              <input required type="tel" className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-orange-400 bg-slate-50 focus:bg-white transition-all"
                placeholder="08x-xxx-xxxx" value={formData.customerContact} onChange={e => setFormData({ ...formData, customerContact: e.target.value })} />
            </div>
          </div>

          {/* แสดงที่อยู่เฉพาะตอนเลือก DELIVERY */}
          {formData.deliveryMethod === 'DELIVERY' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-semibold text-slate-700 mb-1">ที่อยู่จัดส่งละเอียด</label>
              <textarea required rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-orange-400 bg-slate-50 focus:bg-white transition-all resize-none"
                placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด..." value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
            </div>
          )}

          {formData.deliveryMethod === 'PICKUP' && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-sm">
              📌 <b>หมายเหตุ:</b> แอดมินจะโทรยืนยันวัน-เวลาเข้ารับสินค้าอีกครั้งหลังจากได้รับออเดอร์ครับ
            </div>
          )}
        </form>
      </div>

      {/* Checkout Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] pb-8 z-20">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-end mb-4 px-2">
            <div className="text-slate-500 font-medium">ยอดรวมทั้งหมด</div>
            <div className="text-right">
              <div className="text-2xl font-black text-orange-600">฿{cartTotal.toLocaleString()}</div>
              {formData.deliveryMethod === 'DELIVERY' && (
                <div className="text-[10px] text-red-500 font-medium mt-1">📌 ค่าขนส่งจ่ายตามจริงปลายทาง</div>
              )}
            </div>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={isSubmitting}
            className={`w-full py-3.5 rounded-xl font-bold text-white text-lg transition-all shadow-lg flex items-center justify-center gap-2
                ${isSubmitting ? 'bg-slate-400 shadow-none' : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-orange-500/30'}`}
          >
            {isSubmitting ? 'กำลังส่งข้อมูล...' : 'ยืนยันการสั่งซื้อ'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
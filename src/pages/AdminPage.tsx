import React, { useState } from 'react';
import { Package, ShoppingBag, Plus } from 'lucide-react';
import { Product, Post } from '../types';

interface AdminPageProps {
  products: Product[];
  posts: Post[];
}

const AdminPage: React.FC<AdminPageProps> = ({ products, posts }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">ระบบจัดการร้านค้า (Admin)</h1>
          <button className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-sm hover:bg-orange-700">
            <Plus size={20} /> เพิ่มสินค้าใหม่
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${activeTab === 'products' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}
          >
            <Package size={20} /> สินค้า ({products.length})
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${activeTab === 'orders' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}
          >
            <ShoppingBag size={20} /> คำสั่งซื้อ (0)
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {activeTab === 'products' ? (
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-slate-600 font-bold">สินค้า</th>
                  <th className="p-4 text-slate-600 font-bold">ราคาปลีก</th>
                  <th className="p-4 text-slate-600 font-bold">ราคาส่ง</th>
                  <th className="p-4 text-slate-600 font-bold">หมวดหมู่</th>
                  <th className="p-4 text-slate-600 font-bold">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-4 flex items-center gap-3">
                      <img src={p.image} className="w-10 h-10 rounded object-cover bg-slate-100" />
                      <span className="font-medium text-slate-900">{p.name}</span>
                    </td>
                    <td className="p-4 text-slate-600">฿{p.retailPrice}</td>
                    <td className="p-4 text-green-600 font-bold">฿{p.wholesalePrice}</td>
                    <td className="p-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-600">{p.category}</span></td>
                    <td className="p-4">
                      <button className="text-orange-600 font-bold hover:underline">แก้ไข</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-500">
              ยังไม่มีคำสั่งซื้อเข้ามา
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
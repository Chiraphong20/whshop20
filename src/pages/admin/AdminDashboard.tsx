import React, { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, AlertCircle, Truck, DollarSign, Award, ShoppingBag,
  Users, Package, Loader2, RefreshCw
} from 'lucide-react';
import dayjs from 'dayjs';
import { Order } from '../../types';
import { API_URL, getAuthHeaders } from '../../config';

const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const userStr = localStorage.getItem('admin_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // --- 📡 1. ฟังก์ชันดึงข้อมูลจาก Database จริง ---
  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Refresh ข้อมูลอัตโนมัติทุก 1 นาที
    const interval = setInterval(fetchOrders, 60000);
    return () => clearInterval(interval);
  }, []);

  // --- 📊 2. BI LOGIC: คำนวณตัวเลขจาก Data จริง ---
  const stats = useMemo(() => {
    const today = dayjs().startOf('day');

    // ยอดขายวันนี้ (กรองจาก timestamp ใน DB)
    const todayOrders = orders.filter(o =>
      dayjs(o.timestamp).isSame(today, 'day') && o.status !== 'CANCELLED'
    );
    const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    // งานค้างที่ต้องจัดการ
    const pendingCount = orders.filter(o => o.status === 'PENDING').length;
    const toShipCount = orders.filter(o => o.status === 'CONFIRMED').length;

    const totalRevenue = orders
      .filter(o => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    // คำนวณยอดขายตามแอดมิน (พร้อมระบุออเดอร์)
    const adminSales: Record<string, { count: number, revenue: number, handledOrders: { id: string, amount: number, timestamp: string }[] }> = {};
    orders.forEach(order => {
      if (order.status === 'CANCELLED') return;
      const adminName = order.managedBy || 'ระบบ/ไม่ได้มอบหมาย';
      if (!adminSales[adminName]) {
        adminSales[adminName] = { count: 0, revenue: 0, handledOrders: [] };
      }
      adminSales[adminName].count += 1;
      adminSales[adminName].revenue += Number(order.totalAmount || 0);
      adminSales[adminName].handledOrders.push({
        id: order.id,
        amount: Number(order.totalAmount || 0),
        timestamp: order.timestamp
      });
    });

    const sortedAdmins = Object.entries(adminSales)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .map(([name, s]) => ({ name, ...s }));

    return {
      todayRevenue,
      todayOrdersCount: todayOrders.length,
      pendingCount,
      totalRevenue,
      adminPerformance: sortedAdmins
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 gap-4">
        <Loader2 className="animate-spin" size={40} />
        <p className="font-medium">กำลังโหลดข้อมูลจากระบบ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ภาพรวมร้านค้า (Real-time)</h1>
          <p className="text-slate-500 text-sm">ข้อมูลสรุปยอดขายและคำสั่งซื้อจากฐานข้อมูล</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100 text-slate-600 text-sm font-medium">
          📅 {dayjs().format('DD MMMM YYYY')}
        </div>
      </div>

      {/* --- 3. HIGHLIGHT CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today's Sales */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 rounded-3xl p-6 text-white shadow-[0_8px_30px_rgb(99,102,241,0.3)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute -right-6 -top-6 text-white/10 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
            <DollarSign size={140} />
          </div>
          <div className="flex items-center gap-2 mb-2 opacity-90 text-indigo-100 font-medium relative z-10"><TrendingUp size={18} /> ยอดขายวันนี้</div>
          <div className="text-4xl font-bold mb-1 relative z-10">฿{stats.todayRevenue.toLocaleString()}</div>
          <div className="flex items-center justify-between mt-4 relative z-10">
            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-medium shadow-inner">{stats.todayOrdersCount} ออเดอร์</span>
            <span className="opacity-70 text-[11px]">อัปเดตออโต้ 1 นาที</span>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-3xl p-6 border border-orange-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(249,115,22,0.15)] transition-all duration-300 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-br from-orange-100/50 to-orange-50/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="h-14 w-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 shadow-inner">
              <Users size={28} />
            </div>
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full animate-pulse">Action Needed</span>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-800 mb-1">{stats.pendingCount}</div>
            <div className="text-slate-500 font-medium">รอตรวจสอบ / รอสลิป</div>
          </div>
        </div>

        {/* To Ship Orders */}
        <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(59,130,246,0.15)] transition-all duration-300 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-br from-blue-100/50 to-blue-50/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner">
              <Package size={28} />
            </div>
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">Ready to Ship</span>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-800 mb-1">{stats.toShipCount}</div>
            <div className="text-slate-500 font-medium">คำสั่งซื้อรอจัดส่ง</div>
          </div>
        </div>
      </div>

      {/* --- 4. OVERALL SUMMARY --- */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-500"><ShoppingBag size={24} /></div>
              สรุปภาพรวมสะสมตั้งแต่เริ่ม
            </h3>
            <p className="text-slate-500 text-sm mt-1">ข้อมูลยอดขายและสถิติคำสั่งซื้อทั้งหมดในระบบ</p>
          </div>
          <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:shadow-md rounded-xl transition-all font-medium text-sm border border-indigo-100">
            <RefreshCw size={16} /> รีเฟรชข้อมูลล่าสุด
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-blue-50/50 border border-indigo-100/50 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-[0.03] transform rotate-12"><DollarSign size={100} /></div>
            <p className="text-indigo-600/80 text-sm font-semibold mb-2">ยอดขายสะสมสุทธิ</p>
            <p className="text-3xl font-black text-indigo-900">฿{stats.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-[0.02] transform rotate-12"><TrendingUp size={100} /></div>
            <p className="text-slate-500 text-sm font-semibold mb-2">ออเดอร์ทั้งหมด</p>
            <p className="text-3xl font-bold text-slate-800">{orders.length} <span className="text-sm font-normal text-slate-400">รายการ</span></p>
          </div>
          <div className="p-6 rounded-2xl bg-green-50/50 border border-green-100 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-[0.03] transform rotate-12"><Truck size={100} /></div>
            <p className="text-green-600/80 text-sm font-semibold mb-2">จัดส่งสำเร็จ</p>
            <p className="text-3xl font-bold text-green-700">{orders.filter(o => o.status === 'COMPLETED' || o.status === 'SHIPPED').length} <span className="text-sm font-normal text-green-600/50">รายการ</span></p>
          </div>
          <div className="p-6 rounded-2xl bg-red-50/50 border border-red-100 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-[0.03] transform rotate-12"><AlertCircle size={100} /></div>
            <p className="text-red-500/80 text-sm font-semibold mb-2">ยกเลิกรายการ</p>
            <p className="text-3xl font-bold text-red-600">{orders.filter(o => o.status === 'CANCELLED').length} <span className="text-sm font-normal text-red-400/50">รายการ</span></p>
          </div>
        </div>
      </div>

      {/* --- 5. ADMIN PERFORMANCE (Super Admin Only) --- */}
      {isSuperAdmin && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-500"><Award size={24} /></div>
            <h3 className="text-xl font-bold text-slate-800">ผลงานแอดมินประจำร้าน (Leaderboard)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {stats.adminPerformance.map((admin, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden group">
                {idx === 0 && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-400 to-yellow-500 text-white flex items-start justify-end p-2 rounded-bl-3xl shadow-sm z-10 font-bold"><Award size={20} /></div>}
                {idx === 1 && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-slate-300 to-slate-400 text-white flex items-start justify-end p-2 rounded-bl-3xl shadow-sm z-10 font-bold"><Award size={20} /></div>}
                {idx === 2 && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-orange-300 to-orange-400 text-white flex items-start justify-end p-2 rounded-bl-3xl shadow-sm z-10 font-bold"><Award size={20} /></div>}

                {/* Header */}
                <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xl uppercase shadow-lg shadow-indigo-500/20">
                      {admin.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg leading-tight">{admin.name}</h4>
                      <p className="text-xs text-slate-500 font-medium mt-1">{admin.count} ออเดอร์</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">ยอดขายทำได้</p>
                  <div className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 font-black text-2xl">฿{admin.revenue.toLocaleString()}</div>
                </div>

                {/* Orders List */}
                <div className="flex-1 space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar border-t border-slate-50 pt-3">
                  {admin.handledOrders.length === 0 ? (
                    <div className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl">ยังไม่มีออเดอร์</div>
                  ) : (
                    admin.handledOrders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10).map((o, i) => (
                      <Link to="/admin/orders" key={i} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-slate-50/50 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-colors group/item relative overflow-hidden">
                        <div className="flex items-center gap-2 relative z-10">
                          <span className="font-mono font-bold text-slate-600 group-hover/item:text-indigo-600 transition-colors">{o.id}</span>
                          <span className="text-[10px] text-slate-400">{dayjs(o.timestamp).format('DD/MM HH:mm')}</span>
                        </div>
                        <span className="font-bold text-slate-700 relative z-10">฿{o.amount.toLocaleString()}</span>
                      </Link>
                    ))
                  )}
                </div>
                {admin.count > 10 && (
                  <div className="text-center pt-3 mt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-medium block">... มีอีก {admin.count - 10} รายการ</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
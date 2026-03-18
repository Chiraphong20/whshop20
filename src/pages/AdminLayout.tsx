import React, { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, FileText, LogOut, Store, LayoutDashboard, BellRing, Users, BarChart2, Menu, X, Settings, UserCircle } from 'lucide-react';
import { notification } from 'antd';
import { Order } from '../types';

// รับ orders เข้ามาเพื่อใช้แจ้งเตือน
interface AdminLayoutProps {
  orders: Order[];
}
const AdminLayout: React.FC<AdminLayoutProps> = ({ orders }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const [api, contextHolder] = notification.useNotification();
  // ใช้ State เพื่อควบคุมการเปิด/ปิด Sidebar บนมือถือ
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // ใช้ state เพื่อเช็คว่าพนักงานกดเริ่มงานหรือยัง (เพื่อแก้ปัญหาเว็บ Browser ปิดเสียงอัตโนมัติ)
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const prevOrderCountRef = useRef(orders.length);

  // ---------------------------------------------
  // อัปเดตค่าล่าสุดเสมอเพื่อใช้ใช้อ้างอิงการเปลี่ยน state
  useEffect(() => {
    prevOrderCountRef.current = orders.length;
  }, [orders]);
  // ---------------------------------------------


  const userStr = localStorage.getItem('admin_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const menus = [
    { name: 'ภาพรวม (Dashboard)', icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
    { name: 'จัดการคำสั่งซื้อ', icon: <ShoppingBag size={20} />, path: '/admin/orders' },
    { name: 'รายงานยอดขาย', icon: <BarChart2 size={20} />, path: '/admin/reports' },
    { name: 'จัดการสินค้า', icon: <Package size={20} />, path: '/admin/products' },
  ];

  if (isSuperAdmin) {
    menus.push({ name: 'โปรโมชั่น (Post)', icon: <FileText size={20} />, path: '/admin/posts' });
    menus.push({ name: 'จัดการแอดมิน (Users)', icon: <Users size={20} />, path: '/admin/users' });
    menus.push({ name: 'การชำระเงิน', icon: <Settings size={20} />, path: '/admin/settings' });
  }

  const handleLogout = () => {
    if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
      localStorage.removeItem('isAdminLoggedIn');
      localStorage.removeItem('token');
      localStorage.removeItem('admin_user');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans max-w-[100vw] overflow-hidden">
      {contextHolder} {/* ตัวแสดง Notification */}

      {/* 🛑 Overlay แจ้งเตือนเพื่อให้ผู้ใช้ Click (แก้ปัญหา Autoplay Browser) */}
      {!isAudioUnlocked && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/90 flex flex-col items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-6 animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-orange-500 mb-4 shadow-inner">
              <BellRing size={48} className="animate-bounce" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">ระบบพร้อมรับออเดอร์</h2>
              <p className="text-slate-500 mt-2 leading-relaxed">เพื่อเปิดการทำงานของ <b className="text-slate-700">เสียงแจ้งเตือนอัตโนมัติ</b> ให้ข้ามข้อจำกัดของเบราว์เซอร์ กรุณากดปุ่มด้านล่างเพื่อเริ่มทำงานครับ</p>
            </div>
            <button 
              onClick={() => {
                const testAudio = new Audio('/order_notification.mp3');
                testAudio.volume = 0; // silent
                testAudio.play().then(() => testAudio.pause()).catch(()=>{});
                setIsAudioUnlocked(true);
              }}
              className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-6 py-4 rounded-xl text-lg font-bold shadow-xl shadow-orange-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              🚀 เริ่มทำงานรับออเดอร์
            </button>
          </div>
        </div>
      )}

      {/* 📱 Mobile Header (แสดงเฉพาะบนมือถือ) */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
            <Store size={18} />
          </div>
          <span className="font-bold text-lg">วงษ์หิรัญ</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-slate-800 rounded-lg active:scale-95 transition-transform">
          <Menu size={24} />
        </button>
      </div>

      {/* 🔒 Overlay พื้นหลังมืดเวลาเปิดเมนูด้านข้าง (มือถือ) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 💻 Sidebar Menu (ซ้าย) */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col h-screen transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/20">
              <Store size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-wide">วงษ์หิรัญ</h1>
              <p className="text-slate-400 text-xs">ระบบจัดการร้านค้า</p>
            </div>
          </div>

          {/* ปุ่มปิดเมนูบนมือถือ */}
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition">
            <X size={24} />
          </button>
        </div>

        {/* User Profile Info */}
        {user && (
          <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3 bg-slate-800/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-lg font-bold shadow-inner border border-slate-600">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-sm tracking-wide text-white">{user.name}</p>
              <span className="text-[10px] uppercase font-bold tracking-wider text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                {user.role}
              </span>
            </div>
          </div>
        )}

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menus.map((menu) => {
            const isActive = path === menu.path;
            return (
              <Link
                key={menu.path}
                to={menu.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group ${isActive
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>}
                {menu.icon}
                <span className="font-medium">{menu.name}</span>
                {menu.path === '/admin/orders' && orders.filter(o => o.status === 'PENDING').length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                    {orders.filter(o => o.status === 'PENDING').length}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800 space-y-2 bg-slate-900">
          <Link
            to="/admin/profile"
            onClick={() => setIsSidebarOpen(false)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${path === '/admin/profile'
              ? 'bg-orange-600 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <UserCircle size={20} />
            <span>โปรไฟล์ของฉัน</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-white hover:bg-red-500/20 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-64px)] md:h-screen bg-slate-50 w-full overflow-x-hidden">
        <div className="w-full mx-auto animate-fade-in pr-2">
          {/* Outlet คือจุดที่หน้าย่อย (Dashboard, Orders) จะมาแสดง */}
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
import React, { useState, useMemo, useEffect, useRef } from 'react';
import liff from '@line/liff';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { notification, message } from 'antd';
import { Product, Post, CartItem, Order, OrderStatus } from './types';
import { POSTS } from './services/mockData';
import { API_URL, getAuthHeaders } from './config';

// Pages - Client
import ShopIndexPage from './pages/ShopIndexPage';
import ProductListPage from './pages/ProductListPage';
import PromotionsPage from './pages/PromotionsPage';
import PostDetailPage from './pages/PostDetailPage';
import ProductDetailPage from './pages/ProductDetailPage';
import HowToPage from './pages/HowToPage';
import CartPage from './pages/CartPage';
import SuccessPage from './pages/SuccessPage';
import TrackOrderPage from './pages/TrackOrderPage';

// Pages - Admin & Auth
import LoginPage from './pages/admin/LoginPage';
import ProtectedRoute from './pages/ProtectedRoute';
import AdminLayout from './pages/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminPosts from './pages/admin/AdminPosts';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReport from './pages/admin/AdminReport';
import AdminSettings from './pages/admin/AdminSettings';
import LineCallbackPage from './pages/admin/LineCallbackPage';
import AdminProfile from './pages/admin/AdminProfile';

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [posts, setPosts] = useState<Post[]>(POSTS || []);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('shopping_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [customerLineUserId, setCustomerLineUserId] = useState<string>('');
  const [customerLineDisplayName, setCustomerLineDisplayName] = useState<string>('');
  const [customerLinePictureUrl, setCustomerLinePictureUrl] = useState<string>('');
  const [isLiffReady, setIsLiffReady] = useState<boolean>(false);

  const prevOrdersCount = useRef<number>(0);
  // ✨ ตัวป้องกัน Infinite Loop
  const isLiffInitializing = useRef(false);

  // 💾 Persist cart ลง localStorage ทุกครั้งที่ cart เปลี่ยน
  useEffect(() => {
    localStorage.setItem('shopping_cart', JSON.stringify(cart));
  }, [cart]);

  // =========================================================
  // 🔊 ระบบแจ้งเตือนเสียง
  // =========================================================
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/order_notification.mp3');
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err) => {
            console.log("Audio play blocked by browser", err);
            message.info("เบราว์เซอร์บล็อกเสียง รบกวนคลิกที่หน้าจอหนึ่งครั้งเพื่ออนุญาตให้เสียงแจ้งเตือนทำงานครับ");
        });
    }
  };

  // =========================================================
  // 📥 ฟังก์ชันดึงข้อมูล (Fetching)
  // =========================================================
  const fetchOrders = async (isInitial = false) => {
    try {
      const resOrders = await fetch(`${API_URL}/api/orders`, {
        cache: 'no-store',
        headers: getAuthHeaders()
      });

      if (resOrders.ok) {
        const dataOrders = await resOrders.json();
        const parsedOrders = dataOrders.map((order: any) => ({
          ...order,
          items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
        }));

        if (!isInitial && parsedOrders.length > prevOrdersCount.current) {
          const newCount = parsedOrders.length - prevOrdersCount.current;
          
          // แจ้งเตือนเฉพาะฝั่ง Admin (URL ขึ้นต้นด้วย /admin) 
          if (window.location.pathname.startsWith('/admin')) {
            notification.success({
              message: <span className="font-bold text-lg text-orange-600">📢 มีออเดอร์ใหม่เข้า!</span>,
              description: `ได้รับเพิ่ม ${newCount} รายการ`,
              duration: 0,
              placement: 'topRight',
            });
            playNotificationSound();
          }
        }

        setOrders(parsedOrders);
        prevOrdersCount.current = parsedOrders.length;
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchProductsData = async () => {
    try {
      const resProducts = await fetch(`${API_URL}/api/products`, {
        cache: 'no-store',
        headers: getAuthHeaders()
      });
      if (resProducts.ok) {
        const dataProducts = await resProducts.json();
        setProducts(dataProducts);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // =========================================================
  // ⚡ Lifecycle & Polling (Fix Infinite Loop Here)
  // =========================================================
  useEffect(() => {
    // ป้องกันการ Init ซ้ำซ้อน
    if (isLiffInitializing.current) return;
    isLiffInitializing.current = true;

    const setupLiff = async () => {
      const liffId = import.meta.env.VITE_LIFF_ID;
      console.log('[LIFF] LIFF_ID =', liffId);
      if (!liffId) {
        console.warn('[LIFF] ไม่พบ VITE_LIFF_ID ใน .env');
        setIsLiffReady(true);
        return;
      }

      try {
        await liff.init({ liffId });
        console.log('[LIFF] init สำเร็จ | isInClient:', liff.isInClient(), '| isLoggedIn:', liff.isLoggedIn());

        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          console.log('[LIFF] userId:', profile.userId);
          setCustomerLineUserId(profile.userId);
          setCustomerLineDisplayName(profile.displayName || '');
          setCustomerLinePictureUrl(profile.pictureUrl || '');
        } else if (liff.isInClient()) {
          // อยู่ใน LINE App แต่ยังไม่ได้ login → บังคับ login
          console.warn('[LIFF] isInClient=true แต่ isLoggedIn=false → สั่ง login()');
          liff.login();
          return; // หยุดรอ redirect กลับมา
        } else {
          // เปิดจาก Browser ธรรมดา → ข้ามได้
          console.log('[LIFF] เปิดจาก Browser — ไม่มี lineUserId');
        }
      } catch (e) {
        console.error('[LIFF] init error:', e);
      } finally {
        setIsLiffReady(true);
      }
    };

    setupLiff();
    fetchProductsData();
    fetchOrders(true);

    const interval = setInterval(() => {
      fetchOrders();
      fetchProductsData();
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  // =========================================================
  // 🛒 ตะกร้าสินค้า (Cart Logic)
  // =========================================================
  const cartCount = useMemo(() => cart.reduce((a, b) => a + b.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((sum, item) => {
    const isWholesale = item.quantity >= item.minWholesaleQty;
    const price = isWholesale ? item.wholesalePrice : item.retailPrice;
    return sum + (price * item.quantity);
  }, 0), [cart]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
    message.success(`เพิ่ม ${product.name} แล้ว`);
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter(item => item.quantity > 0));
  };

  // =========================================================
  // 📦 การจัดการออเดอร์ (Order Actions)
  // =========================================================
  const handlePlaceOrder = async (orderData: Partial<Order>) => {
    const newOrder = {
      ...orderData,
      id: orderData.id || `ORD-${Date.now()}`,
      status: 'PENDING',
      timestamp: new Date().toISOString(),
      customerLineUserId: customerLineUserId || undefined,
      customerLineDisplayName: customerLineDisplayName || undefined,
      customerLinePictureUrl: customerLinePictureUrl || undefined,
    };

    // POST ไปยัง Backend ก่อน – ถ้าส่งไม่สำเร็จ throw error กลับไปที่ CartPage
    const res = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(newOrder)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'ส่ง Order ไปยัง Server ไม่สำเร็จ');
    }

    // 🔄 รับ Order ID จริงที่ backend สร้างใหม่เอามาอัปเดต state
    const data = await res.json();
    const savedOrder = { ...newOrder, id: data.id || newOrder.id } as Order;

    setOrders(prev => [savedOrder, ...prev]);
    prevOrdersCount.current += 1;
  };

  const handleUpdateOrderDetails = async (id: string, updatedItems: any[], newTotalAmount: number) => {
    try {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, items: updatedItems, totalAmount: newTotalAmount } : o));
      await fetch(`${API_URL}/api/orders/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ items: JSON.stringify(updatedItems), totalAmount: newTotalAmount })
      });
      message.success('แก้ไขสำเร็จ');
    } catch (error) { console.error(error); }
  };

  const handleUpdateOrderStatus = async (id: string, status: OrderStatus) => {
    const adminData = JSON.parse(localStorage.getItem('admin_user') || '{}');
    const managedBy = adminData.name || adminData.username || 'Admin';

    try {
      const res = await fetch(`${API_URL}/api/orders/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status, managedBy })
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status, managedBy } : o));
        message.success(`เปลี่ยนเป็น ${status}`);
      }
    } catch (error) { message.error('ล้มเหลว'); }
  };

  const handleUpdateShipping = async (id: string, trackingNumber: string, courier: string, shippingCost?: number) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${id}/shipping`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ trackingNumber, courier, status: 'COMPLETED', shippingCost })
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, trackingNumber, courier, status: 'COMPLETED', shippingCost } : o));
        message.success('บันทึกขนส่งแล้ว');
      }
    } catch (error) { console.error(error); }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setOrders(prev => prev.filter(o => o.id !== id));
        message.success('ลบคำสั่งซื้อเรียบร้อยแล้ว');
      } else {
        message.error('ลบไม่สำเร็จ กรุณาลองใหม่');
      }
    } catch (error) {
      console.error(error);
      message.error('ลบไม่สำเร็จ ระบบขัดข้อง');
    }
  };

  if (!isLiffReady) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-orange-500 animate-spin mb-4"></div>
        <p>กำลังเตรียมข้อมูลแอปพลิเคชัน...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<ShopIndexPage cartCount={cartCount} products={products} addToCart={addToCart} />} />
        <Route path="/shop" element={<Navigate to="/" replace />} />
        <Route path="/shop/:categoryName" element={<ProductListPage addToCart={addToCart} cartCount={cartCount} />} />
        <Route path="/product/:id" element={<ProductDetailPage products={products} addToCart={addToCart} cartCount={cartCount} />} />
        <Route path="/promotions" element={<PromotionsPage cartCount={cartCount} />} />
        <Route path="/promotions/:postId" element={<PostDetailPage cartCount={cartCount} addToCart={addToCart} />} />
        <Route path="/track" element={<TrackOrderPage cartCount={cartCount} />} />
        <Route path="/how-to" element={<HowToPage cartCount={cartCount} />} />
        <Route path="/cart" element={<CartPage cart={cart} cartTotal={cartTotal} updateCartQty={updateCartQty} onPlaceOrder={handlePlaceOrder} clearCart={() => setCart([])} />} />
        <Route path="/success" element={<SuccessPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/line-callback" element={<LineCallbackPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout orders={orders} />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard orders={orders} />} />
            <Route path="orders" element={
              <AdminOrders
                orders={orders} products={products}
                onUpdateStatus={handleUpdateOrderStatus}
                onUpdateShipping={handleUpdateShipping}
                onAddOrder={handlePlaceOrder}
                onUpdateOrderDetails={handleUpdateOrderDetails}
                onDeleteOrder={handleDeleteOrder}
              />
            } />
            <Route path="products" element={
              <AdminProducts
                products={products}
                onAdd={(p) => setProducts(prev => [...prev, p])}
                onEdit={(p) => setProducts(prev => prev.map(prod => prod.id === p.id ? p : prod))}
                onDelete={(id) => setProducts(prev => prev.filter(prod => prod.id !== id))}
              />
            } />
            <Route path="posts" element={<AdminPosts posts={posts} products={products} onAdd={() => { }} onEdit={() => { }} onDelete={() => { }} />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="reports" element={<AdminReport orders={orders} products={products} />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App; 
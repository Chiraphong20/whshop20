import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserCircle2, ShoppingBag, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import { Post, Product } from '../types';
import { API_URL, getAuthHeaders } from '../config';

interface PromotionsPageProps {
  // ❌ ลบ posts และ products ออกจาก Props (ดึงข้อมูลเอง)
  cartCount: number;
}

const PromotionsPage: React.FC<PromotionsPageProps> = ({ cartCount }) => {
  // 🟢 State สำหรับเก็บข้อมูลที่ดึงมาจาก Backend
  const [posts, setPosts] = useState<Post[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🟢 ดึงข้อมูลสินค้าและโพสต์จาก Backend พร้อมกัน
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [postsRes, productsRes] = await Promise.all([
          fetch(`${API_URL}/api/posts`, { headers: getAuthHeaders() }),
          fetch(`${API_URL}/api/products`, { headers: getAuthHeaders() })
        ]);

        if (postsRes.ok && productsRes.ok) {
          const postsData = await postsRes.json();
          const productsData = await productsRes.json();

          // แปลง JSON string เป็น Array สำหรับ Post
          const formattedPosts = postsData.map((p: any) => ({
            ...p,
            linkedProductIds: typeof p.linkedProductIds === 'string' ? JSON.parse(p.linkedProductIds) : (p.linkedProductIds || []),
            isActive: Boolean(p.isActive)
          }));

          // แปลง JSON string เป็น Array สำหรับ Product
          const formattedProducts = productsData.map((item: any) => ({
            ...item,
            images: typeof item.images === 'string' ? JSON.parse(item.images) : (item.images || [])
          }));

          setPosts(formattedPosts);
          setProducts(formattedProducts);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // กรองเฉพาะโพสต์ที่ Active และเวลายังไม่หมดอายุ (หรือไม่มีวันหมดอายุ)
  const activePosts = posts.filter((post) => {
    const now = new Date();
    const start = new Date(post.createdAt);
    const end = post.expiresAt ? new Date(post.expiresAt) : null;
    return post.isActive && now >= start && (!end || now <= end);
  });

  return (
    <div className="h-screen bg-slate-100 flex flex-col">
      <Header title="ฟีดข่าวสาร & โปรโมชั่น" cartCount={cartCount} />
      <div className="flex-1 overflow-y-auto bg-slate-100 pb-10">

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin mb-4 text-orange-500" size={32} />
            <p>กำลังโหลดโปรโมชั่นล่าสุด...</p>
          </div>
        ) : activePosts.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
            <p>ยังไม่มีโปรโมชั่นในช่วงนี้</p>
          </div>
        ) : (
          activePosts.map((post) => (
            <div key={post.id} className="bg-white mb-3 shadow-sm border-y border-slate-200">
              <div className="flex items-center gap-3 p-4 pb-2">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-orange-500 font-bold border-2 border-orange-500"><UserCircle2 /></div>
                <div>
                  <h3 className="font-bold text-slate-900 leading-tight">Admin Shop</h3>
                  <p className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <div className="px-4 mb-3">
                <h4 className="font-bold mb-1 text-slate-800 text-lg">{post.title}</h4>
                <p className="text-slate-700 text-sm whitespace-pre-wrap">{post.description}</p>
              </div>

              <div className="px-4 mb-4">
                <div className="grid grid-cols-4 gap-2">
                  {products.filter(p => post.linkedProductIds.includes(p.id)).slice(0, 4).map(p => (
                    <div key={p.id} className="w-full aspect-square rounded-md overflow-hidden relative border border-slate-100 bg-slate-50">
                      {/* 🌟 Crop ส่วนล่างทิ้งด้วย h-[120%] และ object-top เพื่อซ่อนราคาสินค้า */}
                      <img
                        src={p.image}
                        className="absolute top-0 left-0 w-full h-[120%] object-cover object-top"
                        alt={p.name}
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400?text=No+Image'; }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-slate-100">
                <Link to={`/promotions/${post.id}`} className="w-full py-3 bg-slate-50 text-slate-700 font-bold rounded-lg border border-slate-200 flex items-center justify-center gap-2 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors shadow-sm">
                  <ShoppingBag size={18} /> ดูสินค้าในโปรโมชั่นนี้
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PromotionsPage;
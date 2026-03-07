import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Gift, Loader2, PackageX } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import Header from '../components/Header';
import ProductCard from '../pages/ProductCard'; // หรือ ../components/ProductCard ตามที่ตั้งไว้
import { Post, Product } from '../types';
import { API_URL, getAuthHeaders } from '../config';

interface PostDetailPageProps {
  // ❌ ลบ posts และ products ออกจาก Props
  addToCart: (p: Product) => void;
  cartCount: number;
}

const PostDetailPage: React.FC<PostDetailPageProps> = ({ cartCount, addToCart }) => {
  const { postId } = useParams();

  // 🟢 State สำหรับเก็บข้อมูล
  const [post, setPost] = useState<Post | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🟢 ดึงข้อมูลสินค้าและโพสต์จาก Backend API เมื่อเปิดหน้านี้
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

          // แปลงภาพ
          const formattedProducts = productsData.map((item: any) => ({
            ...item,
            images: typeof item.images === 'string' ? JSON.parse(item.images) : (item.images || [])
          }));
          setProducts(formattedProducts);

          // หาโพสต์ที่ตรงกับ postId และแปลง JSON
          const foundPost = postsData.find((p: any) => p.id === postId);
          if (foundPost) {
            foundPost.linkedProductIds = typeof foundPost.linkedProductIds === 'string' ? JSON.parse(foundPost.linkedProductIds) : (foundPost.linkedProductIds || []);
            foundPost.isActive = Boolean(foundPost.isActive);
            setPost(foundPost);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [postId]);

  // หาสินค้าที่เกี่ยวข้องกับโพสต์นี้
  const postProducts = post ? products.filter((p) => post.linkedProductIds.includes(p.id)) : [];

  const shareImage = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80";

  // หากโหลดเสร็จแล้วแต่ไม่เจอโพสต์
  if (!isLoading && !post) {
    return (
      <div className="h-screen bg-slate-100 flex flex-col">
        <Header title="สินค้าในโปรโมชั่น" backTo="/promotions" cartCount={cartCount} />
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
          <PackageX size={64} className="mb-4 opacity-20" />
          <p className="font-bold">ไม่พบโปรโมชั่นนี้ (Post not found)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-100 flex flex-col">
      {/* ส่วนกำหนด Meta Tags ให้ LINE อ่าน */}
      {post && (
        <Helmet>
          <title>{post.title} | ร้านทุกอย่าง 20</title>
          <meta name="description" content={post.description} />
          {/* Open Graph (Facebook & LINE) */}
          <meta property="og:type" content="article" />
          <meta property="og:title" content={post.title} />
          <meta property="og:description" content={post.description} />
          <meta property="og:image" content={shareImage} />
          <meta property="og:url" content={window.location.href} />
          <meta property="og:site_name" content="ร้านทุกอย่าง 20" />
          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={post.title} />
          <meta name="twitter:image" content={shareImage} />
        </Helmet>
      )}

      <Header title="สินค้าในโปรโมชั่น" backTo="/promotions" cartCount={cartCount} />

      {/* แสดงส่วนหัวโพสต์ระหว่างหรือหลังโหลดเสร็จ */}
      {post && (
        <div className="bg-white p-4 mb-2 shadow-sm border-b border-slate-200">
          <h2 className="font-bold text-lg mb-1 text-slate-900">{post.title}</h2>
          <p className="text-slate-600 text-sm whitespace-pre-wrap">{post.description}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
        <h3 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-2">
          <Gift size={16} /> สินค้าในโปรโมชั่น {isLoading ? '' : `(${postProducts.length})`}
        </h3>

        {/* ✅ ถ้ากำลังโหลดให้แสดง Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 pb-20">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full animate-pulse">
                <div className="aspect-square bg-slate-200 flex items-center justify-center">
                  <Loader2 className="animate-spin text-slate-400" size={32} />
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="h-3 bg-slate-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <div className="h-5 bg-slate-200 rounded w-1/2"></div>
                    <div className="w-9 h-9 bg-slate-200 rounded-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : postProducts.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Gift size={48} className="mx-auto mb-4 opacity-20" />
            <p>ไม่มีสินค้าที่ร่วมรายการโปรโมชั่นนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-20">
            {postProducts.map((p) => <ProductCard key={p.id} product={p} isNew={true} onAddToCart={addToCart} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetailPage;
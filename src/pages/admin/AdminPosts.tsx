import React, { useState, useEffect } from 'react';
import { Post, Product } from '../../types';
import { Plus, Eye, EyeOff, X, Trash2, Edit, Clock, Share2, Check, Sparkles, Search, Package, Loader2, Filter } from 'lucide-react';
import { API_URL, getAuthHeaders } from '../../config';

interface AdminPostsProps {
  onAdd?: (post: Post) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (id: string) => void;
}

const AdminPosts: React.FC<AdminPostsProps> = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Post>({} as Post);
  const [isEditing, setIsEditing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 🌟 State สำหรับค้นหาและกรองหมวดหมู่
  const [productSearch, setProductSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ทั้งหมด');

  // 🟢 ดึงข้อมูล Posts และ Products จาก Database
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

          const formattedPosts = postsData.map((p: any) => ({
            ...p,
            linkedProductIds: typeof p.linkedProductIds === 'string' ? JSON.parse(p.linkedProductIds) : (p.linkedProductIds || []),
            isActive: Boolean(p.isActive)
          }));

          const formattedProducts = productsData.map((p: any) => ({
            ...p,
            images: typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || [])
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

  // 🌟 ดึงหมวดหมู่ทั้งหมดที่มีในสินค้าแบบอัตโนมัติ
  const categories = ['ทั้งหมด', ...Array.from(new Set(products.map(p => p.category)))];

  const toInputDate = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  const openAdd = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    setFormData({
      id: `POST-${Date.now()}`,
      title: '',
      description: '',
      linkedProductIds: [],
      createdAt: now.toISOString(),
      expiresAt: tomorrow.toISOString(),
      isActive: true
    });
    setProductSearch('');
    setFilterCategory('ทั้งหมด'); // รีเซ็ตฟิลเตอร์
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const openEdit = (post: Post) => {
    setFormData(post);
    setProductSearch('');
    setFilterCategory('ทั้งหมด'); // รีเซ็ตฟิลเตอร์
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const response = await fetch(`${API_URL}/api/posts`, {
        method: method,
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        if (isEditing) {
          setPosts(prev => prev.map(p => p.id === formData.id ? formData : p));
        } else {
          setPosts(prev => [formData, ...prev]);
        }
        setIsFormOpen(false);
      } else {
        alert("บันทึกไม่สำเร็จ");
      }
    } catch (error) {
      console.error("API Error", error);
      alert("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("คุณต้องการลบโพสต์นี้ใช่หรือไม่?")) return;
    try {
      const response = await fetch(`${API_URL}/api/posts?id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        setPosts(prev => prev.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error("Delete Error", error);
    }
  };

  const toggleProductLink = (pid: string) => {
    const current = formData.linkedProductIds || [];
    setFormData({
      ...formData,
      linkedProductIds: current.includes(pid)
        ? current.filter(id => id !== pid)
        : [...current, pid]
    });
  };

  const isActuallyActive = (post: Post) => {
    const now = new Date();
    const start = new Date(post.createdAt);
    const end = post.expiresAt ? new Date(post.expiresAt) : null;
    return post.isActive && now >= start && (!end || now <= end);
  };

  const handleCopyLink = (post: Post) => {
    const url = `${window.location.origin}/promotions/${post.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(post.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleAIGenerate = () => {
    if (!formData.title) {
      alert("กรุณาใส่ 'หัวข้อโพสต์' ก่อน เพื่อให้ AI รู้เรื่องราวครับ");
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      const selectedProducts = products.filter(p => formData.linkedProductIds.includes(p.id));
      const productListText = selectedProducts.length > 0
        ? selectedProducts.map(p => `✅ ${p.name} - เพียง ฿${p.retailPrice}`).join('\n')
        : '✅ สินค้าคุณภาพมากมายรอคุณอยู่';

      const templates = [
        `🔥 ห้ามพลาด! ${formData.title} 🔥\n\nโอกาสดีๆ มาถึงแล้วกับดีลสุดพิเศษ!\n\n${productListText}\n\n🛒 รีบช้อปเลยก่อนของหมด!`,
        `📢 ประกาศ: ${formData.title}\n\nพบกับสินค้าคุณภาพเยี่ยมในราคาสุดคุ้ม:\n\n${productListText}\n\n✨ ส่งไว ได้ของชัวร์ บริการด้วยใจ`,
        `✨ ${formData.title} ✨\n\nเติมของแล้วจ้า! รอบนี้จัดเต็มเพื่อลูกค้าคนพิเศษ\n\n${productListText}\n\n🚚 มีบริการเก็บเงินปลายทาง`
      ];
      setFormData({ ...formData, description: templates[Math.floor(Math.random() * templates.length)] });
      setIsGenerating(false);
    }, 800);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800">จัดการโปรโมชั่น</h2>
          <p className="text-xs text-slate-500">สร้างแคมเปญกระตุ้นยอดขาย</p>
        </div>
        <button onClick={openAdd} className="bg-orange-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm hover:bg-orange-700 transition-all">
          <Plus size={18} /> สร้างโพสต์ใหม่
        </button>
      </div>

      {/* Post List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="animate-spin mb-2" size={32} />
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {posts.map(post => {
            const active = isActuallyActive(post);
            const isCopied = copiedId === post.id;
            const linkedProducts = products.filter(p => post.linkedProductIds.includes(p.id));

            return (
              <div key={post.id} className={`bg-white p-4 rounded-xl shadow-sm border transition-all hover:shadow-md ${active ? 'border-slate-200' : 'border-slate-100 opacity-75'}`}>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {active ?
                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 uppercase tracking-wide"><Eye size={10} /> Active</span> :
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-wide"><EyeOff size={10} /> Inactive</span>
                      }
                      <span className="text-xs text-slate-400">|</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12} /> {new Date(post.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <h3 className="font-bold text-slate-900 truncate">{post.title}</h3>
                    <p className="text-slate-600 text-xs mt-1 line-clamp-2 h-8 whitespace-pre-wrap">{post.description}</p>
                    {post.imageUrl && (
                      <img src={post.imageUrl} alt="banner" className="mt-2 w-full max-h-32 object-cover rounded-lg border border-slate-100" />
                    )}

                    {linkedProducts.length > 0 && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">สินค้า ({linkedProducts.length})</span>
                        <div className="flex -space-x-2">
                          {linkedProducts.slice(0, 5).map(p => (
                            <img key={p.id} src={p.image} className="w-6 h-6 rounded-full border-2 border-white object-cover shadow-sm bg-slate-100" title={p.name} alt="" />
                          ))}
                          {linkedProducts.length > 5 && <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] text-slate-500 font-bold">+{linkedProducts.length - 5}</div>}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex md:flex-col items-center justify-center gap-2 border-l border-slate-100 pl-4 md:w-28">
                    <button
                      onClick={() => handleCopyLink(post)}
                      className={`w-full py-1.5 rounded-md text-xs font-bold border flex items-center justify-center gap-1 transition-all ${isCopied ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600'}`}
                    >
                      {isCopied ? <Check size={14} /> : <Share2 size={14} />} {isCopied ? 'Copied' : 'Share'}
                    </button>
                    <div className="flex w-full gap-1">
                      <button onClick={() => openEdit(post)} className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-md border border-slate-200 flex items-center justify-center transition-colors">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(post.id)} className="flex-1 py-1.5 bg-white hover:bg-red-50 text-red-500 rounded-md border border-slate-200 hover:border-red-100 flex items-center justify-center transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {posts.length === 0 && (
            <div className="text-center py-20 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
              <Package size={48} className="mx-auto mb-2 opacity-20" />
              <p>ยังไม่มีโพสต์โปรโมชั่น</p>
            </div>
          )}
        </div>
      )}

      {/* 🌟 Full Screen Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col animate-in slide-in-from-bottom duration-300">

          {/* Modal Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-white shadow-sm shrink-0">
            <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
              {isEditing ? <Edit size={24} className="text-orange-600" /> : <Plus size={24} className="text-green-600" />}
              {isEditing ? 'แก้ไขโพสต์โปรโมชั่น' : 'สร้างโพสต์โปรโมชั่นใหม่'}
            </h3>
            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-red-500 bg-slate-100 hover:bg-red-50 p-2 rounded-full transition-colors"><X size={24} /></button>
          </div>

          {/* Modal Body: Two Columns */}
          <form id="postForm" onSubmit={handleSave} className="flex-1 overflow-hidden flex flex-col lg:flex-row">

            {/* Left Side: Inputs */}
            <div className="lg:w-7/12 flex flex-col gap-6 p-6 overflow-y-auto bg-white border-r border-slate-200">

              {/* Title */}
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block">หัวข้อโพสต์ <span className="text-red-500">*</span></label>
                <input required className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 outline-none transition-all text-lg"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="ใส่หัวข้อที่ดึงดูดใจ เช่น ลดล้างสต็อก 50%..."
                />
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">เวลาเริ่มต้น</label>
                  <input type="datetime-local" required className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-orange-500 outline-none"
                    value={toInputDate(formData.createdAt)}
                    onChange={e => setFormData({ ...formData, createdAt: new Date(e.target.value).toISOString() })}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">เวลาสิ้นสุด</label>
                  <input type="datetime-local" className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-orange-500 outline-none"
                    value={toInputDate(formData.expiresAt)}
                    onChange={e => setFormData({ ...formData, expiresAt: new Date(e.target.value).toISOString() })}
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block">ลิงก์รูปภาพแบนเนอร์ (URL)</label>
                <input className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-all"
                  value={formData.imageUrl || ''}
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
                {formData.imageUrl && (
                  <img src={formData.imageUrl} alt="Preview" className="mt-3 w-full h-40 object-cover rounded-xl border border-slate-200" />
                )}
              </div>

              {/* Description & AI */}
              <div className="flex-1 flex flex-col min-h-[250px]">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-slate-700">รายละเอียดโปรโมชั่น</label>
                  <button type="button" onClick={handleAIGenerate} disabled={isGenerating}
                    className="text-xs font-bold flex items-center gap-1 text-purple-700 bg-purple-100 px-3 py-1.5 rounded-full hover:bg-purple-200 transition-colors shadow-sm">
                    <Sparkles size={14} className={isGenerating ? 'animate-spin' : ''} /> {isGenerating ? 'AI กำลังคิด...' : 'ให้ AI ช่วยเขียน'}
                  </button>
                </div>
                <textarea required className="flex-1 w-full bg-white border-2 border-slate-200 rounded-xl p-4 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 outline-none resize-none"
                  placeholder="อธิบายรายละเอียดโปรโมชั่นของคุณ..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Status Checkbox */}
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 accent-orange-600 cursor-pointer rounded"
                />
                <label htmlFor="isActive" className="text-base text-slate-800 cursor-pointer select-none font-bold">เปิดใช้งานโพสต์นี้ทันที เพื่อแสดงให้ลูกค้าเห็น</label>
              </div>
            </div>

            {/* Right Side: Product Selector */}
            <div className="lg:w-5/12 flex flex-col p-6 h-full bg-slate-50">
              <div className="flex items-center justify-between mb-4">
                <label className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Package size={20} className="text-orange-600" /> เลือกสินค้าจัดโปรโมชั่น
                  <span className="bg-orange-600 text-white px-2 py-0.5 rounded-full text-sm">{formData.linkedProductIds?.length || 0}</span>
                </label>
              </div>

              {/* 🌟 Search & Filter Menu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-orange-500 outline-none shadow-sm"
                    placeholder="ค้นหาชื่อสินค้า..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-8 py-2.5 focus:ring-2 focus:ring-orange-500 outline-none appearance-none cursor-pointer shadow-sm"
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                </div>
              </div>

              {/* 🌟 Product Grid View */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar bg-white rounded-xl border border-slate-200 p-2 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {products
                    .filter(p => {
                      const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
                      const matchCategory = filterCategory === 'ทั้งหมด' || p.category === filterCategory;
                      return matchSearch && matchCategory;
                    })
                    .map(p => {
                      const isSelected = formData.linkedProductIds?.includes(p.id);
                      return (
                        <div key={p.id} onClick={() => toggleProductLink(p.id)}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${isSelected ? 'bg-orange-50 border-orange-500 shadow-md' : 'bg-white border-slate-100 hover:border-orange-200'}`}
                        >
                          {/* Checkbox */}
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-orange-500 border-orange-500' : 'border-slate-300 bg-white'}`}>
                            {isSelected && <Check size={14} className="text-white" />}
                          </div>

                          {/* Image */}
                          <img src={p.image} className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0" alt="" />

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate font-bold ${isSelected ? 'text-orange-900' : 'text-slate-800'}`}>{p.name}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[80px]">{p.category}</span>
                              <p className="text-xs font-bold text-orange-600">฿{p.retailPrice}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  }
                  {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) && (filterCategory === 'ทั้งหมด' || p.category === filterCategory)).length === 0 && (
                    <div className="col-span-1 sm:col-span-2 text-center py-12 text-slate-400">
                      <Search className="mx-auto mb-2 opacity-20" size={32} />
                      ไม่พบสินค้าในหมวดหมู่นี้
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)]">
            <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              ยกเลิก
            </button>
            <button form="postForm" type="submit" disabled={isSaving} className="px-8 py-3 text-sm font-bold bg-slate-900 text-white rounded-xl hover:bg-orange-600 shadow-lg shadow-slate-900/20 transition-all flex items-center gap-2 disabled:opacity-50">
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลโพสต์'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPosts;
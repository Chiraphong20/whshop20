import React, { useState, useEffect } from 'react';
import { Package, Search, PackageCheck, AlertCircle, ShoppingBag, Gift, HelpCircle, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import liff from '@line/liff';
import { API_URL, getAuthHeaders } from '../config';

interface TrackOrderProps {
    cartCount: number;
}

const TrackOrderPage: React.FC<TrackOrderProps> = ({ cartCount }) => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // States for manual lookup
    const [orderId, setOrderId] = useState('');
    const [contact, setContact] = useState('');
    const [searchError, setSearchError] = useState('');

    // 1. ลองดึงของจาก LINE ID ก่อนเผื่อเค้าล็อกอินมา
    useEffect(() => {
        const fetchOrdersByLineToken = async () => {
            setLoading(true);
            try {
                if (liff.isLoggedIn()) {
                    const profile = await liff.getProfile();
                    const res = await fetch(`${API_URL}/api/orders/track?lineUserId=${profile.userId}`, {
                        headers: getAuthHeaders()
                    });

                    if (!res.ok) {
                        throw new Error("Server Error: " + res.status);
                    }

                    const text = await res.text();
                    if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
                        throw new Error('Backend server is offline or froze (Timeout)');
                    }

                    const data = JSON.parse(text);
                    if (data.success && data.orders.length > 0) {
                        setOrders(data.orders);
                    }
                }
            } catch (error) {
                console.error("Error fetching automatic orders", error);
            } finally {
                setLoading(false);
            }
        };

        // Check if LIFF is initialized. It should be from App.tsx
        if (liff.id) {
            fetchOrdersByLineToken();
        } else {
            // If loaded too fast, try once later
            setTimeout(fetchOrdersByLineToken, 1000);
        }
    }, []);

    const handleManualSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId || !contact) return;

        setLoading(true);
        setSearchError('');
        try {
            const res = await fetch(`${API_URL}/api/orders/track?orderId=${orderId}&contact=${contact}`, {
                headers: getAuthHeaders()
            });

            if (!res.ok) {
                setSearchError("❌ เซิร์ฟเวอร์หลังบ้านมีปัญหา กรุณาลองใหม่");
                return;
            }

            const text = await res.text();
            if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
                setSearchError('❌ ไม่สามารถเชื่อมต่อกับหลังบ้านได้ (เซิร์ฟเวอร์อาจจะค้าง)');
                return;
            }

            const data = JSON.parse(text);

            if (data.success) {
                if (data.orders.length > 0) {
                    setOrders(data.orders);
                } else {
                    setSearchError('ไม่พบออเดอร์ หรือ ข้อมูลไม่ตรงกัน');
                    setOrders([]); // clear
                }
            } else {
                setSearchError(data.error || 'เกิดข้อผิดพลาดในการค้นหา');
            }
        } catch (error) {
            setSearchError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
        } finally {
            setLoading(false);
        }
    };

    // Helper สำหรับสีสถานะ
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'CONFIRMED': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'SHIPPED': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
            case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'PENDING': return 'รอรับออเดอร์';
            case 'CONFIRMED': return 'กำลังเตรียมของ';
            case 'SHIPPED': return 'อยู่ระหว่างจัดส่ง';
            case 'COMPLETED': return 'จัดส่งสำเร็จ';
            case 'CANCELLED': return 'ยกเลิกแล้ว';
            default: return status;
        }
    };

    return (
        <div className="h-screen bg-slate-50 flex flex-col relative">
            {/* Header */}
            <div className="bg-white px-4 py-4 shadow-sm z-10 sticky top-0 flex items-center justify-between">
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Package className="text-orange-500" /> ติดตามสถานะ
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto pb-6 px-4 pt-6">

                {/* Form ค้นหาด้วยตัวเองเผื่อหาไม่เจออัตโนมัติ */}
                {orders.length === 0 && !loading && (
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6">
                        <h2 className="font-bold text-slate-800 mb-2">ค้นหาออเดอร์ด้วยตัวเอง</h2>
                        <p className="text-xs text-slate-500 mb-4">กรุณากรอกเลขที่บิลและเบอร์โทรที่ใช้สั่งซื้อ</p>

                        <form onSubmit={handleManualSearch} className="space-y-3">
                            <div>
                                <input
                                    type="text"
                                    placeholder="เลขที่บิล (เช่น ORD-12345)"
                                    value={orderId}
                                    onChange={(e) => setOrderId(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-orange-500 focus:ring-orange-200"
                                    required
                                />
                            </div>
                            <div>
                                <input
                                    type="tel"
                                    placeholder="เบอร์โทรศัพท์"
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-orange-500 focus:ring-orange-200"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-slate-900 border border-slate-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:bg-slate-800 shadow-md"
                            >
                                <Search size={18} /> ค้นหาพัสดุ
                            </button>
                        </form>

                        {searchError && (
                            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                                <AlertCircle size={16} /> {searchError}
                            </div>
                        )}
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-orange-500 animate-spin mb-4"></div>
                        <p>กำลังค้นหาข้อมูลพัสดุ...</p>
                    </div>
                )}

                {/* Result List */}
                {!loading && orders.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end mb-2">
                            <h2 className="font-bold text-slate-800 text-lg">รายการของคุณ</h2>
                            {orders.length > 1 && <span className="text-xs text-slate-500">พบ {orders.length} ออเดอร์</span>}
                        </div>

                        {orders.map((order) => {
                            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

                            return (
                                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                    <div className={`p-4 border-b ${order.trackingNumber ? 'bg-orange-50/50' : 'bg-slate-50'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="text-xs text-slate-500 mb-1">{new Date(order.timestamp).toLocaleString('th-TH')}</div>
                                                <div className="font-bold text-slate-800">{order.id}</div>
                                            </div>
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(order.status)}`}>
                                                {getStatusText(order.status)}
                                            </span>
                                        </div>

                                        {/* Tracking Info if shipped */}
                                        {order.trackingNumber && (
                                            <div className="mt-3 p-3 bg-white border border-orange-100 rounded-xl flex items-center gap-3">
                                                <div className="w-10 h-10 bg-orange-100 rounded-full flex justify-center items-center text-orange-600 shrink-0">
                                                    <PackageCheck size={20} />
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-500">หมายเลขพัสดุ ({order.courier || 'ไม่ระบุขนส่ง'})</div>
                                                    <div className="font-bold text-slate-900 text-lg tracking-wider">{order.trackingNumber}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4">
                                        <div className="mb-3">
                                            <div className="text-xs text-slate-500 mb-2">รายการจองของ:</div>
                                            {items.map((item: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center py-1 text-sm">
                                                    <span className="text-slate-700 flex-1 line-clamp-1">{item.productName || item.name}</span>
                                                    <span className="text-slate-500 w-16 text-right">x {item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-500">ยอดสุทธิ</span>
                                            <span className="text-lg font-bold text-orange-600">฿{order.totalAmount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {/* ปุ่มเคลียร์สำหรับให้พิมพ์หาบิลอื่นแทน */}
                        {orders.length > 0 && orderId && (
                            <button
                                onClick={() => { setOrders([]); setOrderId(''); setContact(''); }}
                                className="w-full text-center text-sm text-slate-400 py-3"
                            >
                                ค้นหาบิลอื่น
                            </button>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
};

export default TrackOrderPage;

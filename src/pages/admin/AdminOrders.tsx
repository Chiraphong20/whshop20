import React, { useState, useEffect } from 'react';
import {
    Package, Truck, LayoutGrid, List, ChevronLeft, ChevronRight, Copy,
    Calendar, CheckSquare, Search, XCircle, RotateCcw, User, Filter,
    X, AlertTriangle, Calculator, DollarSign, Minus, Plus, ShoppingCart, Trash2
} from 'lucide-react';
import { Modal, message, Input, Select, Tag, Button, DatePicker, Tooltip } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/th';
import locale from 'antd/es/date-picker/locale/th_TH';
import { Order, OrderStatus, Product } from '../../types';
import { API_URL, getAuthHeaders } from '../../config';

interface AdminOrdersProps {
    orders: Order[];
    products: Product[]; // ✅ สำหรับเลือกสินค้าตอนสร้างออเดอร์
    onUpdateStatus: (id: string, status: OrderStatus, managedBy?: string) => void;
    onUpdateShipping?: (id: string, trackingNumber: string, courier: string) => void;
    onAddOrder?: (order: Partial<Order>) => void; // ✅ ฟังก์ชันสร้างออเดอร์
    onUpdateOrderDetails?: (id: string, items: any[], newTotal: number) => void;
    onDeleteOrder?: (id: string) => void;
}

type PickingStatus = 'PENDING' | 'PICKED' | 'OUT_OF_STOCK';

const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, products, onUpdateStatus, onUpdateShipping, onAddOrder, onUpdateOrderDetails, onDeleteOrder }) => {
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState<Dayjs | null>(null);
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = viewMode === 'card' ? 6 : 10;

    const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [courier, setCourier] = useState('Kerry Express');
    const [trackingNumber, setTrackingNumber] = useState('');

    const [isPickingModalOpen, setIsPickingModalOpen] = useState(false);
    const [pickingOrder, setPickingOrder] = useState<Order | null>(null);
    const [pickedItemsState, setPickedItemsState] = useState<Record<string, PickingStatus>>({});
    const [editedQuantities, setEditedQuantities] = useState<Record<string, number>>({});
    const [manualTotalAmount, setManualTotalAmount] = useState<string>('');

    // 🧾 State สำหรับ Receipt Slip Modal
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

    // ✅ State สำหรับสร้างออเดอร์ใหม่
    const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerContact, setNewCustomerContact] = useState('');
    const [newAddress, setNewAddress] = useState('');
    const [newItems, setNewItems] = useState<{ product: Product, quantity: number }[]>([]);

    const [messageApi, contextHolder] = message.useMessage();

    const userStr = localStorage.getItem('admin_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const adminName = user?.name || 'แอดมิน';

    const [paymentSettings, setPaymentSettings] = useState<any>(null);

    useEffect(() => { setCurrentPage(1); }, [filterStatus, searchTerm, viewMode, filterDate]);

    useEffect(() => {
        // ดึงข้อมูลการชำระเงินเพื่อแนบไปกับออเดอร์
        const fetchPaymentSettings = async () => {
            try {
                const res = await fetch(`${API_URL}/api/settings/payment`, {
                    headers: getAuthHeaders()
                });
                if (res.ok) {
                    const result = await res.json();
                    if (result.success) {
                        setPaymentSettings(result.data);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch payment settings", error);
            }
        };
        fetchPaymentSettings();
    }, []);

    // แก้ไขฟังก์ชัน calculateFinancials ภายใน AdminOrders.tsx
    const calculateFinancials = (order: Order) => {
        let newTotal = 0;
        let hasChanges = false;

        order.items.forEach((item, index) => {
            const originalQty = item.quantity;
            // ดึงค่าจำนวนที่แอดมินกำลังแก้ไขอยู่ในปัจจุบัน (ถ้ายังไม่แก้ให้ใช้ค่าเดิม)
            const currentQty = editedQuantities[`${order.id}-${index}`] ?? originalQty;

            // หาข้อมูลสินค้าต้นฉบับเพื่อดูราคา Retail/Wholesale และเกณฑ์ราคาส่ง
            const productRef = products.find(p => p.id === item.productId);

            let currentItemPrice = (item as any).price || 0;

            if (productRef) {
                // Logic สำคัญ: เช็คว่าจำนวนที่เหลืออยู่ (currentQty) ถึงเกณฑ์ราคาส่งหรือไม่
                const isWholesaleNow = currentQty >= productRef.minWholesaleQty;
                currentItemPrice = isWholesaleNow ? productRef.wholesalePrice : productRef.retailPrice;
            }

            // คำนวณยอดรวมของรายการนี้ (ถ้าจำนวนเป็น 0 ยอดจะเป็น 0 ทันที)
            newTotal += currentItemPrice * currentQty;

            if (currentQty !== originalQty) {
                hasChanges = true;
            }
        });

        const refundAmount = order.totalAmount - newTotal;
        const finalTotal = manualTotalAmount ? Number(manualTotalAmount) : newTotal;
        return {
            refundAmount: Math.max(0, refundAmount),
            netTotal: finalTotal,
            hasChanges: hasChanges || manualTotalAmount !== '' || refundAmount !== 0
        };
    };
    const generateOrderSummaryText = (order: Order) => {
        const { refundAmount, netTotal, hasChanges } = calculateFinancials(order);

        const itemsList = order.items.map((item, i) => {
            const originalQty = item.quantity;
            const currentQty = editedQuantities[`${order.id}-${i}`] ?? originalQty;
            if (currentQty === 0) return `${i + 1}. ❌ ${item.productName} (สินค้าหมด)`;
            else if (currentQty < originalQty) return `${i + 1}. ⚠️ ${item.productName} (มีแค่ x${currentQty})`;
            else return `${i + 1}. ✅ ${item.productName} (x${currentQty})`;
        }).join('\n');

        const headerTitle = hasChanges ? "⚠️ แจ้งสรุปรายการสินค้า (มีการปรับเปลี่ยน)" : "🛍️ สรุปรายการสั่งซื้อ";

        let financialSummary = "";
        if (hasChanges) {
            financialSummary = `------------------\n💰 ยอดเดิม: ${order.totalAmount.toLocaleString()} บาท\n💸 หักสินค้าที่ไม่มี: -${refundAmount.toLocaleString()} บาท\n✅ ยอดสุทธิที่ต้องโอน: ${netTotal.toLocaleString()} บาท`;
        } else {
            financialSummary = `------------------\n💰 ยอดรวมทั้งสิ้น: ${order.totalAmount.toLocaleString()} บาท`;
        }

        let paymentInfo = "";
        // แสดงบัญชีธนาคารเฉพาะตอนที่ยังไม่ต้องส่งของ
        if (paymentSettings && paymentSettings.bankName && !['SHIPPED', 'COMPLETED'].includes(order.status)) {
            paymentInfo = `\n\n🏦 ธนาคาร: ${paymentSettings.bankName}\nชื่อบัญชี: ${paymentSettings.accountName}\nเลขบัญชี: ${paymentSettings.accountNumber}`;
            if (paymentSettings.promptpayQr) {
                paymentInfo += `\nหรือสแกน QR Code: ${paymentSettings.promptpayQr}`;
            }
        }

        let footerText = `\n\nเมื่อโอนเงินแล้วแจ้งสลิปได้เลยนะครับ ขอบคุณครับ 🙏`;
        if (['SHIPPED', 'COMPLETED'].includes(order.status) || order.trackingNumber) {
            if (order.deliveryMethod === 'PICKUP') {
                footerText = `\n\n🛍️ วิธีรับสินค้า: มารับเองที่ร้าน\n✅ เตรียมสินค้าเรียบร้อยแล้ว ลูกค้าสามารถมารับได้เลยครับ\n\nขอบคุณที่อุดหนุนครับ 🙏😊`;
            } else {
                footerText = `\n\n🚚 ขนส่ง: ${order.courier || '-'}\n📦 เลขพัสดุ: ${order.trackingNumber || '(รอแจ้ง)'}\n\nจัดส่งเรียบร้อยแล้วครับ ขอบคุณที่อุดหนุนครับ 🙏😊`;
            }
        }

        return `${headerTitle}\nคุณลูกค้า: ${order.customerName}\nออเดอร์: #${order.id}\nผู้ดูแล: ${order.managedBy || adminName}\n------------------\n${itemsList}\n${financialSummary}${paymentInfo}${footerText}`;
    };

    const handleCopyOrderText = (order: Order) => {
        const text = generateOrderSummaryText(order);
        navigator.clipboard.writeText(text).then(() => messageApi.success('คัดลอกสรุปออเดอร์เรียบร้อย!'));
    };

    const handleConfirmOrderFromPicking = () => {
        if (!pickingOrder) return;

        const { netTotal } = calculateFinancials(pickingOrder);

        const updatedItems = pickingOrder.items.map((item, index) => {
            const qty = editedQuantities[`${pickingOrder.id}-${index}`] ?? item.quantity;
            return { ...item, quantity: qty };
        }).filter(item => item.quantity > 0);

        const updatedOrder = { ...pickingOrder, items: updatedItems, totalAmount: netTotal };

        if (onUpdateOrderDetails) {
            onUpdateOrderDetails(pickingOrder.id, updatedItems, netTotal);
        }

        // คัดลอกข้อความสรุป (ที่ยอดเงินลดแล้ว)
        handleCopyOrderText(updatedOrder);

        // อัปเดตสถานะ 
        onUpdateStatus(pickingOrder.id, 'CONFIRMED', adminName);

        setIsPickingModalOpen(false);
        messageApi.success('ยืนยันออเดอร์และปรับยอดเงินเรียบร้อย!');
    };

    const handleUpdateCurrentOrder = () => {
        if (!pickingOrder || !onUpdateOrderDetails) return;
        const { netTotal } = calculateFinancials(pickingOrder);

        const updatedItems = pickingOrder.items.map((item, index) => {
            const qty = editedQuantities[`${pickingOrder.id}-${index}`] ?? item.quantity;
            return { ...item, quantity: qty };
        }).filter(item => item.quantity > 0);

        onUpdateOrderDetails(pickingOrder.id, updatedItems, netTotal);
        messageApi.success('อัปเดตออเดอร์เรียบร้อยแล้ว!');
        setIsPickingModalOpen(false);
    };

    const handleResetFilters = () => { setSearchTerm(''); setFilterStatus('ALL'); setFilterDate(null); };

    const getStatusStyle = (s: string) => {
        switch (s) {
            case 'PENDING': return { color: 'gold', cardBg: 'bg-yellow-50', cardBorder: 'border-yellow-200', text: 'text-yellow-800', label: 'รอตรวจสอบ' };
            case 'CONFIRMED': return { color: 'blue', cardBg: 'bg-blue-50', cardBorder: 'border-blue-200', text: 'text-blue-800', label: 'รอจัดส่ง' };
            case 'SHIPPED': return { color: 'purple', cardBg: 'bg-purple-50', cardBorder: 'border-purple-200', text: 'text-purple-800', label: 'กำลังจัดส่ง' };
            case 'COMPLETED': return { color: 'green', cardBg: 'bg-green-50', cardBorder: 'border-green-200', text: 'text-green-800', label: 'สำเร็จ' };
            case 'CANCELLED': return { color: 'red', cardBg: 'bg-red-50', cardBorder: 'border-red-200', text: 'text-red-800', label: 'ยกเลิก' };
            default: return { color: 'default', cardBg: 'bg-gray-50', cardBorder: 'border-gray-200', text: 'text-gray-600', label: s };
        }
    };

    const getPickingProgress = (order: Order) => {
        if (!order || order.items.length === 0) return 0;
        const handledCount = order.items.reduce((acc, _, i) => {
            const status = pickedItemsState[`${order.id}-${i}`];
            return acc + (status === 'PICKED' || status === 'OUT_OF_STOCK' ? 1 : 0);
        }, 0);
        return Math.round((handledCount / order.items.length) * 100);
    };

    const handleQtyChange = (orderId: string, index: number, originalQty: number, delta: number) => {
        const currentKey = `${orderId}-${index}`;
        const currentQty = editedQuantities[currentKey] ?? originalQty;
        const newQty = Math.max(0, Math.min(originalQty, currentQty + delta));

        setEditedQuantities(prev => ({ ...prev, [currentKey]: newQty }));

        // ถ้าจำนวนเป็น 0 ให้ถือว่าสินค้าหมด/ยกเลิกรายการนี้
        if (newQty === 0) {
            setPickedItemsState(prev => ({ ...prev, [currentKey]: 'OUT_OF_STOCK' }));
        } else {
            setPickedItemsState(prev => ({ ...prev, [currentKey]: 'PICKED' }));
        }
    };

    const handleOpenPicking = (order: Order) => {
        setPickingOrder(order);
        setManualTotalAmount('');
        setIsPickingModalOpen(true);
    };

    const openShippingModal = (order: Order) => {
        setSelectedOrder(order);
        setCourier(order.courier || 'Kerry Express');
        setTrackingNumber(order.trackingNumber || '');
        setIsShippingModalOpen(true);
    };

    const handleConfirmShippingInfo = () => {
        if (selectedOrder) {
            if (selectedOrder.deliveryMethod === 'PICKUP') {
                onUpdateStatus(selectedOrder.id, 'COMPLETED');
                setIsShippingModalOpen(false);
                messageApi.success(`เสร็จสิ้นออเดอร์ (ลูกค้ารับเองที่ร้าน)`);
            } else if (trackingNumber) {
                if (onUpdateShipping) onUpdateShipping(selectedOrder.id, trackingNumber, courier);
                // ✅ เปลี่ยนจาก SHIPPED เป็น COMPLETED ตามที่ต้องการ
                onUpdateStatus(selectedOrder.id, 'COMPLETED');
                setIsShippingModalOpen(false);
                messageApi.success(`บันทึกเลขพัสดุและเสร็จสิ้นออเดอร์เรียบร้อยแล้ว`);
            } else {
                messageApi.warning('กรุณากรอกเลขพัสดุ');
            }
        }
    };

    const handleCopyShippingText = () => {
        if (!selectedOrder) return;
        let text = "";
        if (selectedOrder.deliveryMethod === 'PICKUP') {
            text = `ออเดอร์ #${selectedOrder.id} เตรียมสินค้าเรียบร้อย!\n\n🛍️ วิธีรับสินค้า: มารับเองที่ร้าน\n✅ ลูกค้าสามารถเข้ามารับสินค้าได้เลยครับ\n\nขอบคุณที่อุดหนุนร้านเรานะครับ โอกาสหน้าเชิญใหม่ครับ 🙏😊`;
        } else {
            const trackingText = trackingNumber ? trackingNumber : "(รอแจ้งเลขพัสดุ)";
            text = `ออเดอร์ #${selectedOrder.id} จัดส่งเรียบร้อยครับ!\n\n🚚 ขนส่ง: ${courier}\n📦 เลขพัสดุ: ${trackingText}\n\nขอบคุณที่อุดหนุนร้านเรานะครับ โอกาสหน้าเชิญใหม่ครับ 🙏😊`;
        }
        navigator.clipboard.writeText(text).then(() => { messageApi.success('คัดลอกข้อความแจ้งส่งของ/รับของแล้ว!'); });
    };

    const confirmStatusChange = (id: string, newStatus: OrderStatus) => {
        Modal.confirm({
            title: 'ยืนยันการเปลี่ยนสถานะ',
            icon: <ExclamationCircleOutlined />,
            content: `เปลี่ยนสถานะเป็น "${getStatusStyle(newStatus).label}"?`,
            onOk: () => { onUpdateStatus(id, newStatus, adminName); messageApi.success('อัปเดตสถานะแล้ว'); }
        });
    };

    const confirmDeleteOrder = (id: string) => {
        Modal.confirm({
            title: 'ยืนยันการลบคำสั่งซื้อ',
            icon: <AlertTriangle className="text-red-500" />,
            content: 'คุณต้องการลบคำสั่งซื้อนี้ออกจากระบบอย่างถาวรใช่หรือไม่? (ไม่สามารถกู้คืนได้)',
            okText: 'ลบข้อมูล',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            onOk: () => {
                if (onDeleteOrder) onDeleteOrder(id);
            }
        });
    };

    // ✅ ฟังก์ชันเพิ่มออเดอร์แมนนวล
    const handleSaveNewOrder = () => {
        if (!newCustomerName) return messageApi.error('กรุณากรอกชื่อลูกค้า');
        if (newItems.length === 0) return messageApi.error('กรุณาเลือกสินค้าอย่างน้อย 1 รายการ');

        const mappedItems = newItems.map(item => {
            const isWholesale = item.quantity >= item.product.minWholesaleQty;
            const price = isWholesale ? item.product.wholesalePrice : item.product.retailPrice;
            return {
                productId: item.product.id,
                productName: item.product.name,
                quantity: item.quantity,
                price: price,
                totalPrice: item.quantity * price,
                productImage: item.product.image || ''
            };
        });

        const totalAmount = mappedItems.reduce((sum, item) => sum + item.totalPrice, 0);

        if (onAddOrder) {
            onAddOrder({
                customerName: newCustomerName,
                customerContact: newCustomerContact,
                address: newAddress,
                items: mappedItems,
                totalAmount,
                deliveryMethod: 'DELIVERY'
            });
        }

        messageApi.success('สร้างออเดอร์ใหม่สำเร็จ');
        setIsAddOrderOpen(false);
        setNewCustomerName('');
        setNewCustomerContact('');
        setNewAddress('');
        setNewItems([]);
    };

    const filteredOrders = orders.filter(order => {
        const matchesStatus = filterStatus === 'ALL' || order.status === filterStatus;
        const lowerSearch = searchTerm.toLowerCase();
        const matchesSearch =
            order.id.toLowerCase().includes(lowerSearch) ||
            order.customerName.toLowerCase().includes(lowerSearch) ||
            order.customerContact.includes(lowerSearch) ||
            (order.trackingNumber && order.trackingNumber.toLowerCase().includes(lowerSearch));

        let matchesDate = true;
        if (filterDate) matchesDate = dayjs(order.timestamp).format('YYYY-MM-DD') === filterDate.format('YYYY-MM-DD');

        return matchesStatus && matchesSearch && matchesDate;
    });

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

    const statusOptions = [
        { value: 'ALL', label: 'ทั้งหมด' },
        { value: 'PENDING', label: 'รอตรวจสอบ' },
        { value: 'CONFIRMED', label: 'รอจัดส่ง' },
        { value: 'COMPLETED', label: 'สำเร็จ' },
        { value: 'CANCELLED', label: 'ยกเลิก' },
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {contextHolder}

            {/* 🧾 RECEIPT SLIP MODAL */}
            <Modal
                open={isReceiptOpen}
                onCancel={() => setIsReceiptOpen(false)}
                footer={null}
                width={400}
                centered
                styles={{ body: { padding: 0 } }}
                style={{ borderRadius: '16px', overflow: 'hidden' }}
            >
                {receiptOrder && (
                    <div className="font-mono bg-white">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-5 px-4">
                            <div className="text-2xl font-bold tracking-wide">🏪 วงษ์หิรัญค้าส่ง20</div>
                            <div className="text-indigo-100 text-xs mt-1">ใบสั่งซื้อสินค้า / Receipt</div>
                        </div>

                        {/* Zig-zag border */}
                        <div className="relative h-4 overflow-hidden">
                            <div className="absolute"
                                style={{
                                    width: '200%',
                                    height: '32px',
                                    top: '-16px',
                                    left: '-16px',
                                    backgroundImage: 'radial-gradient(circle at 8px 24px, white 8px, transparent 8px), radial-gradient(circle at 8px 24px, #e0e7ff 8px, transparent 8px)',
                                    backgroundSize: '16px 16px',
                                    backgroundPosition: '0 0, 8px 0',
                                    backgroundRepeat: 'repeat-x',
                                    backgroundColor: '#4f46e5'
                                }}
                            />
                        </div>

                        {/* Body */}
                        <div className="px-6 pt-2 pb-4 space-y-3 text-sm">
                            {/* Order Meta */}
                            <div className="flex justify-between text-gray-500 text-xs border-b border-dashed border-gray-200 pb-3">
                                <div>
                                    <div className="font-semibold text-gray-700">เลขออเดอร์</div>
                                    <div className="text-indigo-600 font-bold text-base">{receiptOrder.id}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-gray-700">วันที่</div>
                                    <div>{dayjs(receiptOrder.timestamp).format('DD/MM/YYYY HH:mm')}</div>
                                </div>
                            </div>

                            {/* Customer */}
                            <div className="border-b border-dashed border-gray-200 pb-3">
                                <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">ข้อมูลลูกค้า</div>
                                <div className="flex items-center gap-2">
                                    {receiptOrder.customerLinePictureUrl ? (
                                        <img src={receiptOrder.customerLinePictureUrl} alt="" className="w-9 h-9 rounded-full border-2 border-indigo-200 shrink-0" />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 shrink-0">👤</div>
                                    )}
                                    <div>
                                        <div className="font-bold text-gray-800">{receiptOrder.customerName}</div>
                                        <div className="text-xs text-gray-500">{receiptOrder.customerContact}</div>
                                    </div>
                                </div>
                                {receiptOrder.address && (
                                    <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
                                        🏠 {receiptOrder.address}
                                    </div>
                                )}
                            </div>

                            {/* Items */}
                            <div className="border-b border-dashed border-gray-200 pb-3">
                                <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">รายการสินค้า</div>
                                <div className="space-y-1.5">
                                    {receiptOrder.items.map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between items-start gap-2">
                                            <div className="flex-1">
                                                <div className="text-gray-800 text-xs leading-snug">{item.productName || item.name}</div>
                                                <div className="text-gray-400 text-xs">
                                                    {item.quantity} {item.unit || 'ชิ้น'} × ฿{(item.price || 0).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="font-bold text-gray-800 text-xs shrink-0">
                                                ฿{((item.price || 0) * item.quantity).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Total */}
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-600 font-semibold">ยอดรวมทั้งสิ้น</span>
                                <span className="text-xl font-bold text-indigo-600">฿{receiptOrder.totalAmount.toLocaleString()}</span>
                            </div>

                            {/* Tracking */}
                            {receiptOrder.deliveryMethod === 'PICKUP' ? (
                                <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3 text-xs flex items-center gap-2">
                                    <span className="text-cyan-500 text-base">🛍️</span>
                                    <div>
                                        <div className="text-cyan-700 font-semibold">วิธีรับสินค้า: มารับเองที่ร้าน</div>
                                    </div>
                                </div>
                            ) : receiptOrder.trackingNumber && (
                                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs flex items-center gap-2">
                                    <span className="text-purple-500 text-base">🚚</span>
                                    <div>
                                        <div className="text-purple-700 font-semibold">{receiptOrder.courier}</div>
                                        <div className="font-mono text-purple-900">{receiptOrder.trackingNumber}</div>
                                    </div>
                                </div>
                            )}

                            {/* Status */}
                            <div className="flex justify-center pt-1">
                                <span className={`text-xs px-4 py-1 rounded-full font-semibold ${receiptOrder.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                    receiptOrder.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                                        receiptOrder.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                            receiptOrder.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                'bg-gray-100 text-gray-600'
                                    }`}>
                                    {getStatusStyle(receiptOrder.status).label}
                                </span>
                            </div>

                            {/* Zigzag bottom + Copy */}
                            <div className="text-center text-gray-300 text-xs tracking-widest pt-2">
                                - - - - - - - - - - - - - -
                            </div>
                            <div className="text-center text-gray-400 text-xs">ขอบคุณที่อุดหนุนร้านเรา 🙏</div>
                        </div>

                        {/* Footer Action */}
                        <div className="border-t border-gray-100 px-6 py-3">
                            <button
                                onClick={() => {
                                    handleCopyOrderText(receiptOrder);
                                }}
                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                            >
                                <Copy size={16} /> คัดลอกสลิปออเดอร์
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* HEADER & FILTER */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">จัดการคำสั่งซื้อ (Orders)</h1>
                        <p className="text-gray-500 text-xs mt-1">ทั้งหมด {orders.length} | แสดง {filteredOrders.length} รายการ</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                            <button onClick={() => setViewMode('card')} className={`p-1.5 rounded-md transition-all ${viewMode === 'card' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}><LayoutGrid size={18} /></button>
                            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}><List size={18} /></button>
                        </div>
                        <Button type="primary" className="bg-slate-900 h-10 px-4 rounded-xl flex items-center gap-2" onClick={() => setIsAddOrderOpen(true)}>
                            <Plus size={18} /> สร้างออเดอร์ใหม่
                        </Button>
                    </div>
                </div>
                <hr className="border-gray-100" />
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-5 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="ค้นหาชื่อ, เบอร์, Order ID, เลขพัสดุ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 hover:bg-white focus:bg-white h-[42px]" />
                        {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"><XCircle size={16} /></button>}
                    </div>
                    <div className="md:col-span-3">
                        <Select value={filterStatus} onChange={setFilterStatus} options={statusOptions} style={{ width: '100%', height: '42px' }} className="custom-select-rounded" suffixIcon={<Filter size={16} className="text-gray-400" />} />
                    </div>
                    <div className="md:col-span-3">
                        <DatePicker placeholder="เลือกวันที่" format="DD/MM/YYYY" value={filterDate} onChange={(date) => setFilterDate(date)} style={{ width: '100%', height: '42px', borderRadius: '0.75rem', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }} locale={locale} />
                    </div>
                    <div className="md:col-span-1">
                        <button onClick={handleResetFilters} disabled={!searchTerm && !filterDate && filterStatus === 'ALL'} className={`w-full h-[42px] rounded-xl flex items-center justify-center transition-colors border ${!searchTerm && !filterDate && filterStatus === 'ALL' ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' : 'bg-white text-gray-500 border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200'}`}><RotateCcw size={18} /></button>
                    </div>
                </div>

                {/* STATUS LEGEND */}
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
                    <span className="text-xs font-semibold text-gray-500 mr-2">ความหมายสถานะ (สี):</span>
                    <div className="flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity cursor-default hidden md:flex"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span><span className="text-xs text-gray-600">รอตรวจสอบ</span></div>
                    <div className="flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity cursor-default hidden md:flex"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span><span className="text-xs text-gray-600">รอจัดส่ง</span></div>
                    <div className="flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity cursor-default hidden md:flex"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span><span className="text-xs text-gray-600">กำลังจัดส่ง</span></div>
                    <div className="flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity cursor-default hidden md:flex"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span><span className="text-xs text-gray-600">สำเร็จ</span></div>
                    <div className="flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity cursor-default hidden md:flex"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span><span className="text-xs text-gray-600">ยกเลิก</span></div>

                    {/* Mobile Legend (Tag style for wrap) */}
                    <div className="md:hidden flex flex-wrap gap-2 w-full mt-1">
                        <Tag color="gold" className="rounded-full m-0 border-0">รอตรวจสอบ</Tag>
                        <Tag color="blue" className="rounded-full m-0 border-0">รอจัดส่ง</Tag>
                        <Tag color="purple" className="rounded-full m-0 border-0">กำลังจัดส่ง</Tag>
                        <Tag color="green" className="rounded-full m-0 border-0">สำเร็จ</Tag>
                        <Tag color="red" className="rounded-full m-0 border-0">ยกเลิก</Tag>
                    </div>
                </div>
            </div>

            {/* ORDERS CONTENT */}
            {filteredOrders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4"><Package className="text-gray-300" size={32} /></div>
                    <h3 className="text-gray-900 font-medium">ไม่พบออเดอร์</h3>
                    <p className="text-gray-400 text-sm mt-1">ลองปรับตัวกรองดูใหม่นะครับ</p>
                </div>
            ) : (
                <>
                    {viewMode === 'card' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {paginatedOrders.map(order => {
                                const statusInfo = getStatusStyle(order.status);
                                return (
                                    <div key={order.id} className={`${statusInfo.cardBg} ${statusInfo.cardBorder} rounded-2xl border shadow-sm p-4 hover:shadow-md transition-all relative overflow-hidden group flex flex-col`}>
                                        <div className="flex justify-between mb-3 pb-3 border-b border-black/5">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold ${statusInfo.text}`}>{order.id}</span>
                                                    <Tag color={statusInfo.color} className="rounded-full border-0">{statusInfo.label}</Tag>
                                                    {order.deliveryMethod === 'PICKUP' ? (
                                                        <Tag color="cyan" className="rounded-full border-0 m-0">🛍️ รับเอง</Tag>
                                                    ) : (
                                                        <Tag color="blue" className="rounded-full border-0 m-0">🚚 จัดส่ง</Tag>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1 opacity-80"><Calendar size={10} /> {dayjs(order.timestamp).format('DD/MM/YYYY HH:mm')}</div>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <div className="font-bold text-lg text-gray-900">฿{order.totalAmount.toLocaleString()}</div>
                                                <div className="text-xs text-gray-500 opacity-80 mb-1">{order.items.length} รายการ</div>
                                                {order.managedBy && (
                                                    <span className="text-[10px] text-purple-600 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded shadow-sm inline-flex items-center gap-1 font-medium">👤 รับโดย {order.managedBy}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mb-4 flex-1">
                                            <div className="flex items-start gap-2 mb-2">
                                                {order.customerLinePictureUrl ? (
                                                    <img src={order.customerLinePictureUrl} alt="LINE" className="w-8 h-8 rounded-full border border-gray-200 object-cover" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200 shrink-0"><User size={16} /></div>
                                                )}
                                                <div>
                                                    <h4 className="font-bold text-sm text-gray-800 flex items-center flex-wrap gap-1">
                                                        {order.customerName}
                                                        {order.customerLineDisplayName && <span className="text-[10px] bg-[#00B900]/10 text-[#00B900] px-1.5 py-0.5 rounded font-medium whitespace-nowrap">LINE: {order.customerLineDisplayName}</span>}
                                                    </h4>
                                                    <p className="text-xs text-gray-600 opacity-80">{order.customerContact}</p>
                                                </div>
                                            </div>

                                            {order.deliveryMethod !== 'PICKUP' && order.trackingNumber && (
                                                <div className="mt-3 ml-6 text-xs text-purple-700 bg-purple-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-2 font-medium">
                                                    <Truck size={14} /> {order.courier}: <span className="font-mono bg-white px-2 py-0.5 rounded text-purple-900 border border-purple-200">{order.trackingNumber}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2 justify-end mt-auto pt-2 border-t border-black/5">
                                            <Tooltip title="ดูสลิปออเดอร์">
                                                <button onClick={() => { setReceiptOrder(order); setIsReceiptOpen(true); }} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg transition-all shadow-sm text-xs font-bold">🧾</button>
                                            </Tooltip>
                                            <Tooltip title="Copy บิล"><button onClick={() => handleCopyOrderText(order)} className="p-2 text-gray-600 bg-white/50 hover:bg-white border border-transparent rounded-lg transition-all shadow-sm"><Copy size={18} /></button></Tooltip>
                                            {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                                                <Tooltip title="จัดของ/แก้ไขออเดอร์"><button onClick={() => handleOpenPicking(order)} className="p-2 text-gray-600 bg-white/50 hover:bg-white rounded-lg shadow-sm"><CheckSquare size={18} /></button></Tooltip>
                                            )}

                                            {order.status === 'PENDING' && <Button type="primary" size="small" className="bg-indigo-600" onClick={() => confirmStatusChange(order.id, 'CONFIRMED')}>ยืนยัน</Button>}
                                            {order.status === 'CONFIRMED' && <Button type="primary" size="small" className="bg-purple-600" onClick={() => openShippingModal(order)}>{order.deliveryMethod === 'PICKUP' ? 'ลูกค้ารับของแล้ว' : 'แจ้งพัสดุ'}</Button>}
                                            {(order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && order.status !== 'SHIPPED') && (
                                                <Button danger size="small" onClick={() => confirmStatusChange(order.id, 'CANCELLED')}>ยกเลิก</Button>
                                            )}
                                            {(order.status === 'SHIPPED' || order.status === 'COMPLETED') && (
                                                <Button size="small" onClick={() => openShippingModal(order)}>{order.deliveryMethod === 'PICKUP' ? 'ดูสถานะรับของ' : 'ดู/แก้ไขพัสดุ'}</Button>
                                            )}
                                            {order.status === 'CANCELLED' && (
                                                <Tooltip title="ลบออเดอร์ถาวร">
                                                    <Button danger size="small" icon={<Trash2 size={14} />} onClick={() => confirmDeleteOrder(order.id)} />
                                                </Tooltip>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-semibold border-b uppercase text-xs">
                                        <tr>
                                            <th className="p-4 whitespace-nowrap">ID</th>
                                            <th className="p-4 whitespace-nowrap">วันที่</th>
                                            <th className="p-4 whitespace-nowrap">ลูกค้า</th>
                                            <th className="p-4 whitespace-nowrap">ยอดเงิน</th>
                                            <th className="p-4 whitespace-nowrap">สถานะ & พัสดุ</th>
                                            <th className="p-4 text-right whitespace-nowrap">จัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {paginatedOrders.map(order => (
                                            <tr key={order.id} className="hover:bg-gray-50">
                                                <td className="p-4 font-mono font-medium">{order.id}</td>
                                                <td className="p-4 text-gray-500">{dayjs(order.timestamp).format('DD/MM/YY')}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        {order.customerLinePictureUrl ? (
                                                            <img src={order.customerLinePictureUrl} alt="LINE" className="w-8 h-8 rounded-full border border-gray-200 shrink-0 object-cover" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200 shrink-0"><User size={16} /></div>
                                                        )}
                                                        <div>
                                                            <div className="font-bold text-gray-800 flex items-center flex-wrap gap-1">
                                                                {order.customerName}
                                                                {order.customerLineDisplayName && <span className="text-[10px] bg-[#00B900]/10 text-[#00B900] px-1.5 py-px rounded font-medium mt-px whitespace-nowrap">LINE: {order.customerLineDisplayName}</span>}
                                                            </div>
                                                            <div className="text-xs text-gray-400 mt-0.5">{order.customerContact}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 font-bold">฿{order.totalAmount.toLocaleString()}</td>
                                                <td className="p-4">
                                                    <div className="flex gap-1 w-max">
                                                        <Tag color={getStatusStyle(order.status).color}>{getStatusStyle(order.status).label}</Tag>
                                                        {order.deliveryMethod === 'PICKUP' ? (
                                                            <Tag color="cyan">🛍️ รับเอง</Tag>
                                                        ) : (
                                                            <Tag color="blue">🚚 จัดส่ง</Tag>
                                                        )}
                                                    </div>
                                                    {order.managedBy && (
                                                        <div className="text-[10px] mt-1.5 text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 w-fit inline-flex items-center gap-1 shadow-sm font-medium">
                                                            👤 {order.managedBy}
                                                        </div>
                                                    )}
                                                    {order.deliveryMethod !== 'PICKUP' && order.trackingNumber && (
                                                        <div className="text-[10px] mt-2 text-gray-500 flex flex-col bg-gray-50 p-1.5 rounded border border-gray-100">
                                                            <span className="font-medium text-purple-700">{order.courier}</span>
                                                            <span className="font-mono text-gray-800">{order.trackingNumber}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex justify-end items-center gap-2">
                                                        <Tooltip title="คัดลอกบิล">
                                                            <Button size="small" icon={<Copy size={14} />} onClick={() => handleCopyOrderText(order)} />
                                                        </Tooltip>

                                                        {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                                                            <Tooltip title="ตรวจสอบ / จัดของ">
                                                                <Button size="small" icon={<Package size={14} />} onClick={() => handleOpenPicking(order)}>จัดของ</Button>
                                                            </Tooltip>
                                                        )}

                                                        {order.status === 'PENDING' && (
                                                            <Tooltip title="ยืนยันคำสั่งซื้อ">
                                                                <Button type="primary" size="small" className="bg-indigo-600" onClick={() => confirmStatusChange(order.id, 'CONFIRMED')}>รับออเดอร์</Button>
                                                            </Tooltip>
                                                        )}
                                                        {order.status === 'CONFIRMED' && (
                                                            <Tooltip title={order.deliveryMethod === 'PICKUP' ? 'ลูกค้ารับของแล้ว' : 'แจ้งเลขพัสดุ / ส่งของ'}>
                                                                <Button type="primary" size="small" className="bg-purple-600 flex items-center gap-1" onClick={() => openShippingModal(order)}>
                                                                    {order.deliveryMethod === 'PICKUP' ? <CheckSquare size={14} /> : <Truck size={14} />} <span className="hidden sm:inline">{order.deliveryMethod === 'PICKUP' ? 'ลูกค้ารับของ' : 'ส่งของ'}</span>
                                                                </Button>
                                                            </Tooltip>
                                                        )}
                                                        {(order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && order.status !== 'SHIPPED') && (
                                                            <Tooltip title="ยกเลิกออเดอร์">
                                                                <Button danger size="small" onClick={() => confirmStatusChange(order.id, 'CANCELLED')}>ยกเลิก</Button>
                                                            </Tooltip>
                                                        )}
                                                        {(order.status === 'SHIPPED' || order.status === 'COMPLETED') && (
                                                            <Tooltip title={order.deliveryMethod === 'PICKUP' ? 'ดูข้อมูล' : 'แก้ไขเลขพัสดุ'}>
                                                                <Button size="small" icon={order.deliveryMethod === 'PICKUP' ? <CheckSquare size={14} /> : <Truck size={14} />} onClick={() => openShippingModal(order)} />
                                                            </Tooltip>
                                                        )}
                                                        {order.status === 'CANCELLED' && (
                                                            <Tooltip title="ลบออเดอร์ถาวร">
                                                                <Button danger size="small" icon={<Trash2 size={14} />} onClick={() => confirmDeleteOrder(order.id)} />
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 pt-6">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border bg-white disabled:opacity-50 hover:bg-gray-50"><ChevronLeft size={20} /></button>
                            <span className="text-sm font-medium text-gray-600">หน้า {currentPage} / {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border bg-white disabled:opacity-50 hover:bg-gray-50"><ChevronRight size={20} /></button>
                        </div>
                    )}
                </>
            )}

            {/* --- MODAL: PICKING LIST --- */}
            <Modal title={null} open={isPickingModalOpen} onCancel={() => setIsPickingModalOpen(false)} footer={null} width={600} centered className="rounded-2xl">
                {pickingOrder && (
                    <div className="p-2">
                        <div className="flex justify-between items-center mb-4 border-b pb-3">
                            <h2 className="text-lg font-bold">📦 รายการจัดของ ({pickingOrder.id})</h2>
                            <Tag color={getStatusStyle(pickingOrder.status).color}>{getStatusStyle(pickingOrder.status).label}</Tag>
                        </div>

                        <div className="space-y-3 mb-6 max-h-[350px] overflow-y-auto pr-1">
                            {pickingOrder.items.map((item, index) => {
                                const originalQty = item.quantity;
                                const currentQty = editedQuantities[`${pickingOrder.id}-${index}`] ?? originalQty;
                                const status = pickedItemsState[`${pickingOrder.id}-${index}`] || 'PENDING';
                                const itemPrice = (item as any).price || 0;

                                let itemClass = "bg-white border-gray-100";
                                if (currentQty === 0) itemClass = "bg-red-50 border-red-200";
                                else if (status === 'PICKED' && currentQty < originalQty) itemClass = "bg-yellow-50 border-yellow-200";
                                else if (status === 'PICKED') itemClass = "bg-green-50 border-green-200";

                                return (
                                    <div key={index} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl border transition-all gap-3 ${itemClass}`}>
                                        <div className="flex items-center gap-3 flex-1 w-full">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${currentQty === 0 ? 'bg-red-500 text-white' : status === 'PICKED' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                {currentQty === 0 ? <X size={18} /> : status === 'PICKED' ? <CheckSquare size={18} /> : <Package size={18} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className={`font-medium line-clamp-2 leading-tight ${currentQty === 0 ? 'text-red-700 line-through' : 'text-gray-800'}`}>
                                                    {item.productName}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">฿{itemPrice.toLocaleString()} / ชิ้น</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between w-full sm:w-auto bg-white sm:bg-transparent rounded-lg p-1 sm:p-0 border sm:border-transparent border-gray-200">
                                            <div className="flex items-center">
                                                <button onClick={() => handleQtyChange(pickingOrder.id, index, originalQty, -1)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-md"><Minus size={16} /></button>
                                                <span className={`w-10 text-center font-bold text-lg ${currentQty < originalQty ? 'text-orange-500' : 'text-gray-800'}`}>{currentQty}</span>
                                                <button onClick={() => handleQtyChange(pickingOrder.id, index, originalQty, 1)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-md"><Plus size={16} /></button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mb-4 border border-dashed border-gray-300 p-3 rounded-xl bg-gray-50">
                            <label className="text-xs font-semibold text-gray-700 block mb-2"><Plus size={12} className="inline mr-1" /> เพิ่มสินค้าเข้ารายการ</label>
                            <Select
                                showSearch
                                size="middle"
                                style={{ width: '100%' }}
                                placeholder="พิมพ์ค้นหาชื่อสินค้า..."
                                optionFilterProp="label"
                                value={null}
                                onChange={(val) => {
                                    const p = products.find(x => x.id === val);
                                    if (p) {
                                        const newItem = { productId: p.id, productName: p.name, quantity: 1, price: p.retailPrice };
                                        setPickingOrder({ ...pickingOrder, items: [...pickingOrder.items, newItem] });
                                        setEditedQuantities(prev => ({ ...prev, [`${pickingOrder.id}-${pickingOrder.items.length}`]: 1 }));
                                    }
                                }}
                                options={products.map(p => ({ value: p.id, label: `${p.name} (฿${p.retailPrice})` }))}
                            />
                        </div>

                        {(() => {
                            const { refundAmount, netTotal, hasChanges } = calculateFinancials(pickingOrder);
                            return (
                                <div className="bg-red-50 rounded-xl p-4 border border-red-100 mb-4 animate-fade-in">
                                    <div className="flex items-center justify-between mb-3 border-b border-red-200 pb-2">
                                        <div className="flex items-center gap-2 text-red-800 font-bold">
                                            <Calculator size={18} /> สรุปยอดเงิน
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm mb-4">
                                        <div className="flex justify-between text-gray-500">
                                            <span>ยอดรวมเดิม</span>
                                            <span className="line-through">฿{pickingOrder.totalAmount.toLocaleString()}</span>
                                        </div>
                                        {hasChanges && (
                                            <div className="flex justify-between text-red-600 font-medium">
                                                <span>ส่วนต่างที่ลด/เปลี่ยนแปลง</span>
                                                <span>-฿{refundAmount > 0 ? refundAmount.toLocaleString() : 0}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-gray-900 font-bold text-lg pt-2 border-t border-red-200">
                                            <span>ยอดคำนวณอัตโนมัติ</span>
                                            <span className="text-green-600 flex items-center gap-1"><DollarSign size={16} /> ฿{(netTotal).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-red-200">
                                        <label className="text-sm font-semibold text-gray-700 block mb-1">แก้ไขยอดเงินสุทธิ (ถ้าต้องการปรับเปลี่ยนเอง)</label>
                                        <Input
                                            placeholder={`เช่น ${netTotal}`}
                                            value={manualTotalAmount}
                                            onChange={(e) => setManualTotalAmount(e.target.value)}
                                            size="large"
                                            prefix="฿"
                                        />
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="space-y-3 pt-2">
                            {pickingOrder.status === 'PENDING' && (
                                <Button size="large" type="primary" className="bg-indigo-600 hover:bg-indigo-700 w-full h-12 text-base font-bold shadow-lg shadow-indigo-200" onClick={handleConfirmOrderFromPicking}>
                                    ยืนยันออเดอร์ พร้อมคัดลอกข้อความ
                                </Button>
                            )}
                            {(pickingOrder.status === 'PENDING' || pickingOrder.status === 'CONFIRMED') && (
                                <Button size="large" onClick={handleUpdateCurrentOrder} block className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-bold h-10">บันทึกออเดอร์ (ไม่ต้องยังยืนยัน)</Button>
                            )}
                            <Button size="large" block onClick={() => setIsPickingModalOpen(false)}>ปิดหน้าต่าง</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* --- MODAL: CREATE ORDER --- */}
            <Modal
                title={<div className="flex items-center gap-2 font-bold text-lg"><Plus className="text-indigo-600" /> สร้างออเดอร์ใหม่</div>}
                open={isAddOrderOpen}
                onCancel={() => setIsAddOrderOpen(false)}
                footer={null}
                width={700}
                centered
                className="rounded-2xl"
            >
                <div className="pt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="text-sm font-semibold text-gray-700 block mb-1">ชื่อลูกค้า <span className="text-red-500">*</span></label>
                            <Input placeholder="ชื่อ-สกุล / ชื่อร้าน..." value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} size="large" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="text-sm font-semibold text-gray-700 block mb-1">เบอร์ติดต่อ / Social</label>
                            <Input placeholder="08x-xxx-xxxx หรือ Line ID..." value={newCustomerContact} onChange={(e) => setNewCustomerContact(e.target.value)} size="large" />
                        </div>
                        <div className="col-span-2">
                            <label className="text-sm font-semibold text-gray-700 block mb-1">ที่อยู่สำหรับจัดส่ง</label>
                            <Input.TextArea rows={2} placeholder="บ้านเลขที่ ตำบล อำเภอ จังหวัด รหัสไปรษณีย์..." value={newAddress} onChange={(e) => setNewAddress(e.target.value)} />
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <label className="text-sm font-semibold text-gray-700 block mb-2">เลือกสินค้า</label>
                        <Select
                            showSearch
                            size="large"
                            style={{ width: '100%' }}
                            placeholder="พิมพ์ค้นหาชื่อสินค้า..."
                            optionFilterProp="label"
                            value={null}
                            onChange={(val) => {
                                // ✅ 1. เพิ่ม (products || []) ตรงนี้
                                const p = (products || []).find(x => x.id === val);
                                if (p && !newItems.find(i => i.product.id === p.id)) {
                                    setNewItems([...newItems, { product: p, quantity: 1 }]);
                                }
                            }}
                            // ✅ 2. เพิ่ม (products || []) ตรงนี้ (นี่คือจุดที่ทำให้ Error .map ครับ)
                            options={(products || []).map(p => ({ value: p.id, label: `${p.name} (฿${p.retailPrice})` }))}
                        />
                    </div>

                    {newItems.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                            <h4 className="font-semibold text-sm mb-2 text-gray-600 flex justify-between">
                                <span>รายการที่เลือก ({newItems.length})</span>
                                <span>รวม: ฿{newItems.reduce((s, i) => s + (i.quantity >= i.product.minWholesaleQty ? i.product.wholesalePrice : i.product.retailPrice) * i.quantity, 0).toLocaleString()}</span>
                            </h4>
                            <div className="space-y-2 max-h-[250px] overflow-y-auto">
                                {newItems.map((item, idx) => {
                                    const isWholesale = item.quantity >= item.product.minWholesaleQty;
                                    const currentPrice = isWholesale ? item.product.wholesalePrice : item.product.retailPrice;
                                    return (
                                        <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                                            <div className="flex items-center gap-2 flex-1">
                                                <div className="w-8 h-8 bg-gray-100 rounded overflow-hidden">
                                                    {item.product.image ? <img src={item.product.image} className="w-full h-full object-cover" /> : <Package className="w-full h-full p-1 text-gray-400" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium line-clamp-1">{item.product.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        ฿{currentPrice.toLocaleString()} {isWholesale && <span className="text-green-500 font-bold">(ราคาส่ง)</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                                                    <button className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600" onClick={() => {
                                                        const copy = [...newItems];
                                                        copy[idx].quantity = Math.max(1, copy[idx].quantity - 1);
                                                        setNewItems(copy);
                                                    }}><Minus size={14} /></button>
                                                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                                    <button className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600" onClick={() => {
                                                        const copy = [...newItems];
                                                        copy[idx].quantity += 1;
                                                        setNewItems(copy);
                                                    }}><Plus size={14} /></button>
                                                </div>
                                                <button className="p-1.5 text-red-500 hover:bg-red-50 rounded-md" onClick={() => setNewItems(newItems.filter((_, i) => i !== idx))}><X size={16} /></button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
                <div className="mt-6 flex gap-3">
                    <Button size="large" className="flex-1" onClick={() => setIsAddOrderOpen(false)}>ยกเลิก</Button>
                    <Button size="large" type="primary" className="flex-1 bg-indigo-600" onClick={handleSaveNewOrder} disabled={newItems.length === 0}>บันทึกออเดอร์ใหม่</Button>
                </div>
            </Modal>

            {/* --- MODAL: SHIPPING --- */}
            <Modal
                title={<div className="flex items-center gap-2 font-bold">{selectedOrder?.deliveryMethod === 'PICKUP' ? <><CheckSquare className="text-green-600" /> ยืนยันลูกค้ามารับสินค้า</> : <><Truck className="text-purple-600" /> แจ้งเลขพัสดุ</>}</div>}
                open={isShippingModalOpen}
                onOk={handleConfirmShippingInfo}
                onCancel={() => setIsShippingModalOpen(false)}
                centered
                okText={selectedOrder?.deliveryMethod === 'PICKUP' ? 'ยืนยันลูกค้ารับของ' : 'ยืนยันบันทึกพัสดุ'}
                cancelText="ยกเลิก"
                okButtonProps={{ className: selectedOrder?.deliveryMethod === 'PICKUP' ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700' }}
            >
                <div className="pt-4 space-y-4 pb-2">
                    {selectedOrder?.deliveryMethod === 'PICKUP' ? (
                        <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-center">
                            <Package className="mx-auto text-green-500 mb-2" size={32} />
                            <h3 className="text-green-800 font-bold mb-1">ลูกค้ารับสินค้าที่ร้าน</h3>
                            <p className="text-green-600 text-sm">ไม่ต้องกรอกเลขพัสดุ กดปุ่มยืนยันลูกค้ารับของได้เลย</p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="text-sm font-semibold text-gray-700">บริษัทขนส่ง</label>
                                <Select value={courier} onChange={setCourier} style={{ width: '100%' }} size="large" options={[{ value: 'Kerry Express', label: 'Kerry Express' }, { value: 'Flash Express', label: 'Flash Express' }, { value: 'Thailand Post', label: 'ไปรษณีย์ไทย' }, { value: 'J&T Express', label: 'J&T Express' }]} />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700">Tracking Number</label>
                                <Input placeholder="กรอกเลขพัสดุ..." value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} size="large" prefix={<Package className="text-gray-400" size={16} />} />
                            </div>
                        </>
                    )}
                    <div className="pt-2">
                        <Button block size="large" icon={<Copy size={16} />} onClick={handleCopyShippingText} className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200 flex items-center justify-center gap-2">
                            {selectedOrder?.deliveryMethod === 'PICKUP' ? 'คัดลอกข้อความแจ้งสินค้าพร้อมรับ' : 'คัดลอกข้อความแจ้งลูกค้า'}
                        </Button>
                        <p className="text-xs text-gray-400 text-center mt-2">อย่าลืมกดคัดลอกข้อความส่งให้ลูกค้าก่อนนะครับ</p>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminOrders;
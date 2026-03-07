import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Shield, User, Loader2, Pencil } from 'lucide-react';
import { Modal, Input, Select, Button, notification, Tag, Popconfirm } from 'antd';
import { API_URL, getAuthHeaders } from '../../config';

interface AdminUser {
    id: number;
    username: string;
    name: string;
    role: string;
    lineUserId?: string;
}

const AdminUsers: React.FC = () => {
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newAdmin, setNewAdmin] = useState({ username: '', password: '', name: '', role: 'ADMIN', lineUserId: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State สำหรับการแก้ไข LINE User ID
    const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
    const [editLineUserId, setEditLineUserId] = useState('');
    const lineChannelId = (import.meta as any).env.VITE_LINE_LOGIN_CHANNEL_ID || '2009281227';

    const handleConnectLine = () => {
        const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
        const adminId = adminUser?.id;
        if (!adminId) {
            notification.error({ message: 'ไม่พบข้อมูลแอดมิน' });
            return;
        }
        const redirectUri = encodeURIComponent(`${window.location.origin}/admin/line-callback`);
        const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${lineChannelId}&redirect_uri=${redirectUri}&state=${adminId}&scope=profile`;
        window.location.href = lineAuthUrl;
    };

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/api/admins`, { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                setAdmins(data);
            }
        } catch (error) {
            console.error('Failed to fetch admins:', error);
            notification.error({ message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ดูแลระบบ' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleAddAdmin = async () => {
        if (!newAdmin.username || !newAdmin.password || !newAdmin.name) {
            notification.warning({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
            return;
        }

        try {
            setIsSubmitting(true);
            const res = await fetch(`${API_URL}/api/admins`, {
                method: 'POST',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(newAdmin)
            });

            const data = await res.json();

            if (res.ok) {
                notification.success({ message: data.message });
                setIsAddModalOpen(false);
                setNewAdmin({ username: '', password: '', name: '', role: 'ADMIN', lineUserId: '' });
                fetchAdmins();
            } else {
                notification.error({ message: data.error || 'เกิดข้อผิดพลาดในการเพิ่มผู้ใช้' });
            }
        } catch (error) {
            notification.error({ message: 'เครือข่ายขัดข้อง' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAdmin = async (id: number) => {
        try {
            const res = await fetch(`${API_URL}/api/admins/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            const data = await res.json();

            if (res.ok) {
                notification.success({ message: data.message });
                fetchAdmins();
            } else {
                notification.error({ message: data.error || 'ไม่สามารถลบได้' });
            }
        } catch (error) {
            notification.error({ message: 'เครือข่ายขัดข้อง' });
        }
    };

    const handleOpenEdit = (admin: AdminUser) => {
        setEditingAdmin(admin);
        setEditLineUserId(admin.lineUserId || '');
    };

    const handleUpdateLineUserId = async () => {
        if (!editingAdmin) return;
        try {
            const res = await fetch(`${API_URL}/api/admins/${editingAdmin.id}`, {
                method: 'PATCH',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ lineUserId: editLineUserId })
            });
            const data = await res.json();
            if (res.ok) {
                notification.success({ message: `อัปเดต LINE User ID ของ ${editingAdmin.name} สำเร็จ!` });
                setEditingAdmin(null);
                fetchAdmins();
            } else {
                notification.error({ message: data.error || 'เกิดข้อผิดพลาด' });
            }
        } catch {
            notification.error({ message: 'เครือข่ายขัดข้อง' });
        }
    };

    if (loading) {
        return (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                <Loader2 className="animate-spin mb-2" size={32} />
                <p>กำลังโหลดรายชื่อผู้ดูแลระบบ...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="text-indigo-600" /> จัดการสิทธิ์แอดมิน (Admin Users)
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">เพิ่ม/ลบ บัญชีผู้ดูแลระบบ (Super Admin เท่านั้น)</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button
                        size="large"
                        className="flex items-center gap-2 rounded-xl border-green-500 text-green-600 hover:bg-green-50"
                        onClick={handleConnectLine}
                    >
                        📱 เชื่อมต่อ LINE ของฉัน
                    </Button>
                    <Button
                        type="primary"
                        size="large"
                        className="bg-indigo-600 flex items-center gap-2 rounded-xl"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        <Plus size={18} /> เพิ่มผู้ดูแลระบบใหม่
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                            <tr>
                                <th className="p-4 rounded-tl-xl text-center">ID</th>
                                <th className="p-4">ชื่อเข้าใช้งาน (Username)</th>
                                <th className="p-4">ชื่อเรียก (Display Name)</th>
                                <th className="p-4">ระดับสิทธิ์ (Role)</th>
                                <th className="p-4">LINE User ID</th>
                                <th className="p-4 text-center rounded-tr-xl">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {admins.map((admin) => (
                                <tr key={admin.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-center font-mono text-slate-500">{admin.id}</td>
                                    <td className="p-4 font-bold text-slate-700">{admin.username}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold">
                                                {admin.name.charAt(0)}
                                            </div>
                                            {admin.name}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {admin.role === 'SUPER_ADMIN' ? (
                                            <Tag color="purple" className="border-0 font-bold px-2 py-1 rounded">SUPER_ADMIN</Tag>
                                        ) : (
                                            <Tag color="blue" className="border-0 font-bold px-2 py-1 rounded">ADMIN</Tag>
                                        )}
                                    </td>
                                    <td className="p-4 font-mono text-xs text-slate-500">
                                        {admin.lineUserId || (
                                            <span className="text-slate-300 italic">ไม่ได้ระบุ</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                icon={<Pencil size={14} />}
                                                size="small"
                                                title="แก้ไข LINE User ID"
                                                onClick={() => handleOpenEdit(admin)}
                                                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                            />
                                            {admin.role !== 'SUPER_ADMIN' && (
                                                <Popconfirm
                                                    title="ลบแอดมินคนนี้?"
                                                    description={`คุณแน่ใจหรือไม่ที่จะลบ ${admin.username} ออกจากระบบ?`}
                                                    onConfirm={() => handleDeleteAdmin(admin.id)}
                                                    okText="ใช่, ลบเลย"
                                                    cancelText="ยกเลิก"
                                                    okButtonProps={{ danger: true }}
                                                >
                                                    <Button danger icon={<Trash2 size={16} />} />
                                                </Popconfirm>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {admins.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-10 text-center text-slate-400">ยังไม่มีผู้ดูแลระบบในฐานข้อมูล</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- Add Admin Modal --- */}
            <Modal
                title={<div className="flex items-center gap-2 font-bold text-lg"><User className="text-indigo-600" /> เพิ่มผู้ดูแลระบบใหม่</div>}
                open={isAddModalOpen}
                onCancel={() => setIsAddModalOpen(false)}
                footer={null}
                width={500}
                centered
                className="rounded-2xl"
            >
                <div className="pt-4 space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-1">ชื่อผู้ใช้งาน (Username) <span className="text-red-500">*</span></label>
                        <Input
                            placeholder="ตัวอักษรภาษาอังกฤษหรือตัวเลข"
                            value={newAdmin.username}
                            onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value.toLowerCase() })}
                            size="large"
                        />
                        <p className="text-xs text-slate-400 mt-1">ใช้สำหรับการล็อคอินเข้าระบบ</p>
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-1">รหัสผ่าน (Password) <span className="text-red-500">*</span></label>
                        <Input.Password
                            placeholder="กำหนดรหัสผ่าน..."
                            value={newAdmin.password}
                            onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                            size="large"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-1">ชื่อแสดงผล (Display Name) <span className="text-red-500">*</span></label>
                        <Input
                            placeholder="เช่น มีน, บี, พี่จิ๋ว..."
                            value={newAdmin.name}
                            onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                            size="large"
                        />
                        <p className="text-xs text-slate-400 mt-1">ชื่อนี้จะไปปรากฎเวลารับออเดอร์</p>
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-1">ระดับสิทธิ์ (Role)</label>
                        <Select
                            value={newAdmin.role}
                            onChange={(val) => setNewAdmin({ ...newAdmin, role: val })}
                            size="large"
                            style={{ width: '100%' }}
                            options={[
                                { value: 'ADMIN', label: 'Admin (จัดการออเดอร์/สินค้า)' },
                                { value: 'SUPER_ADMIN', label: 'Super Admin (ทำได้ทุกอย่าง)' }
                            ]}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-1">LINE User ID <span className="text-slate-400 font-normal">(เอาไว้รับแจ้งเตือน)</span></label>
                        <Input
                            placeholder="เช่น U1234abcd5678..."
                            value={newAdmin.lineUserId}
                            onChange={(e) => setNewAdmin({ ...newAdmin, lineUserId: e.target.value })}
                            size="large"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button size="large" onClick={() => setIsAddModalOpen(false)} className="flex-1">ยกเลิก</Button>
                        <Button size="large" type="primary" className="bg-indigo-600 flex-1" onClick={handleAddAdmin} loading={isSubmitting}>
                            สร้างบัญชีผู้ใช้
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* --- Edit LINE User ID Modal --- */}
            <Modal
                title={<div className="flex items-center gap-2 font-bold text-lg"><Pencil className="text-indigo-600" size={18} /> อัปเดต LINE User ID</div>}
                open={!!editingAdmin}
                onCancel={() => setEditingAdmin(null)}
                onOk={handleUpdateLineUserId}
                okText="บันทึก"
                cancelText="ยกเลิก"
                centered
                width={480}
            >
                <div className="py-4 space-y-3">
                    <p className="text-sm text-slate-500">ใส่ LINE User ID สำหรับ <strong className="text-slate-800">{editingAdmin?.name}</strong> เพื่อรับแจ้งเตือนออเดอร์ใหม่ผ่าน LINE</p>
                    <Input
                        placeholder="เช่น U1234abcd5678..."
                        value={editLineUserId}
                        onChange={(e) => setEditLineUserId(e.target.value)}
                        size="large"
                        allowClear
                    />
                    <p className="text-xs text-slate-400">พิมพ์ ยิงฮ่ายหา ID: เข้า LINE Developers Console → เลือก Channel → Basic settings → Your user ID</p>
                </div>
            </Modal>

        </div>
    );
};

export default AdminUsers;

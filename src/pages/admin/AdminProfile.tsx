// src/pages/admin/AdminProfile.tsx
import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, Save, CheckCircle, AlertCircle, ShieldCheck, Edit3 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminProfile: React.FC = () => {
    const userStr = localStorage.getItem('admin_user');
    const user = userStr ? JSON.parse(userStr) : null;

    // --- Profile State ---
    const [name, setName] = useState(user?.name || '');
    const [isEditingName, setIsEditingName] = useState(false);
    const [profileStatus, setProfileStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const [savingProfile, setSavingProfile] = useState(false);

    // --- Password State ---
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pwStatus, setPwStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const [savingPw, setSavingPw] = useState(false);

    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    // ---- Update profile name ----
    const handleSaveProfile = async () => {
        if (!name.trim()) return;
        setSavingProfile(true);
        setProfileStatus(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/admins/${user.id}/profile`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: name.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'ไม่สามารถบันทึกได้');

            // อัปเดต localStorage ด้วย
            const updated = { ...user, name: name.trim() };
            localStorage.setItem('admin_user', JSON.stringify(updated));
            setProfileStatus({ type: 'success', msg: 'บันทึกชื่อสำเร็จแล้ว' });
            setIsEditingName(false);
        } catch (err: any) {
            setProfileStatus({ type: 'error', msg: err.message });
        } finally {
            setSavingProfile(false);
        }
    };

    // ---- Change password ----
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwStatus(null);

        if (newPassword.length < 6) {
            setPwStatus({ type: 'error', msg: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPwStatus({ type: 'error', msg: 'รหัสผ่านใหม่และการยืนยันไม่ตรงกัน' });
            return;
        }

        setSavingPw(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username, oldPassword, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
            setPwStatus({ type: 'success', msg: 'เปลี่ยนรหัสผ่านสำเร็จแล้ว! กรุณาใช้รหัสผ่านใหม่ในครั้งถัดไป' });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setPwStatus({ type: 'error', msg: err.message });
        } finally {
            setSavingPw(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg">
                    <User size={22} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">โปรไฟล์ของฉัน</h1>
                    <p className="text-sm text-slate-500">ดูและแก้ไขข้อมูลบัญชีผู้ใช้</p>
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg border-2 border-white/20">
                        {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                    <div>
                        <p className="text-lg font-bold text-white">{user?.name}</p>
                        <p className="text-slate-300 text-sm">@{user?.username}</p>
                        <span className={`inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${isSuperAdmin ? 'text-yellow-300 bg-yellow-400/10 border-yellow-500/30' : 'text-orange-300 bg-orange-400/10 border-orange-500/30'}`}>
                            {isSuperAdmin ? '👑 Super Admin' : '🛡 Admin'}
                        </span>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {/* Name Field */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ชื่อแสดงผล</label>
                        <div className="mt-1 flex items-center gap-2">
                            {isEditingName ? (
                                <>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={savingProfile}
                                        className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition disabled:opacity-50"
                                    >
                                        <Save size={14} />
                                        บันทึก
                                    </button>
                                    <button
                                        onClick={() => { setIsEditingName(false); setName(user?.name || ''); }}
                                        className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-sm transition"
                                    >
                                        ยกเลิก
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p className="flex-1 text-slate-800 font-medium py-2">{user?.name}</p>
                                    <button
                                        onClick={() => setIsEditingName(true)}
                                        className="flex items-center gap-1 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-sm transition"
                                    >
                                        <Edit3 size={14} />
                                        แก้ไข
                                    </button>
                                </>
                            )}
                        </div>
                        {profileStatus && (
                            <div className={`mt-2 flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${profileStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                {profileStatus.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                {profileStatus.msg}
                            </div>
                        )}
                    </div>

                    {/* Username (read-only) */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Username</label>
                        <p className="mt-1 text-slate-800 font-mono bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-sm">
                            {user?.username}
                        </p>
                    </div>

                    {/* Role */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">สิทธิ์การใช้งาน</label>
                        <div className="mt-1 flex items-center gap-2">
                            <ShieldCheck size={16} className={isSuperAdmin ? 'text-yellow-500' : 'text-orange-500'} />
                            <p className="text-slate-800 font-medium text-sm">{isSuperAdmin ? 'Super Administrator' : 'Administrator'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                        <Lock size={16} />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800">เปลี่ยนรหัสผ่าน</h2>
                        <p className="text-xs text-slate-400">รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร</p>
                    </div>
                </div>

                <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                    {/* Old Password */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">รหัสผ่านเดิม</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type={showOld ? 'text' : 'password'}
                                required
                                value={oldPassword}
                                onChange={e => setOldPassword(e.target.value)}
                                placeholder="กรอกรหัสผ่านเดิม"
                                className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm transition"
                            />
                            <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">รหัสผ่านใหม่</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type={showNew ? 'text' : 'password'}
                                required
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)"
                                className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm transition"
                            />
                            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {/* Strength bar */}
                        {newPassword && (
                            <div className="mt-1.5 flex gap-1">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${newPassword.length >= i * 3 ? (newPassword.length >= 9 ? 'bg-green-500' : 'bg-orange-400') : 'bg-slate-200'}`} />
                                ))}
                                <span className="text-[10px] text-slate-400 ml-1">{newPassword.length < 6 ? 'สั้นไป' : newPassword.length < 9 ? 'พอใช้' : 'แข็งแกร่ง'}</span>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">ยืนยันรหัสผ่านใหม่</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                required
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                                className={`w-full pl-9 pr-10 py-2.5 border rounded-xl focus:outline-none focus:ring-2 text-sm transition ${confirmPassword && newPassword !== confirmPassword ? 'border-red-400 focus:ring-red-300' : 'border-slate-200 focus:ring-slate-900'}`}
                            />
                            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-xs text-red-500 mt-1">รหัสผ่านไม่ตรงกัน</p>
                        )}
                    </div>

                    {/* Status Message */}
                    {pwStatus && (
                        <div className={`flex items-start gap-2 text-sm px-4 py-3 rounded-xl ${pwStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                            {pwStatus.type === 'success' ? <CheckCircle size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
                            {pwStatus.msg}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={savingPw}
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition disabled:opacity-50 active:scale-95 shadow-md shadow-slate-900/10"
                    >
                        {savingPw ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Lock size={16} />
                        )}
                        {savingPw ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminProfile;

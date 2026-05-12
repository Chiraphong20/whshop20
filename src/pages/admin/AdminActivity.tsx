import React, { useEffect, useState } from 'react';
import { API_URL, getAuthHeaders } from '../../config';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

interface ActivityLog {
    id: number;
    action: string;
    entity_type: string;
    entity_id: string;
    description: string;
    performed_by: string;
    created_at: string;
}

const actionColor: Record<string, string> = {
    'ลบออเดอร์':       'bg-red-100 text-red-700 border-red-200',
    'สร้างออเดอร์':    'bg-green-100 text-green-700 border-green-200',
    'เปลี่ยนสถานะออเดอร์': 'bg-blue-100 text-blue-700 border-blue-200',
    'แก้ไขรายการออเดอร์':  'bg-yellow-100 text-yellow-700 border-yellow-200',
    'เพิ่มสินค้า':     'bg-emerald-100 text-emerald-700 border-emerald-200',
    'แก้ไขสินค้า':     'bg-orange-100 text-orange-700 border-orange-200',
    'ลบสินค้า':        'bg-rose-100 text-rose-700 border-rose-200',
};

const actionIcon: Record<string, string> = {
    'ลบออเดอร์': '🗑️',
    'สร้างออเดอร์': '🛍️',
    'เปลี่ยนสถานะออเดอร์': '🔄',
    'แก้ไขรายการออเดอร์': '✏️',
    'เพิ่มสินค้า': '➕',
    'แก้ไขสินค้า': '🔧',
    'ลบสินค้า': '❌',
};

const AdminActivity: React.FC = () => {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const limit = 50;

    const fetchLogs = async (offset = 0) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/activity-logs?limit=${limit}&offset=${offset}`, {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (data.success) {
                setLogs(data.logs);
                setTotal(data.total);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(page * limit); }, [page]);

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-5 animate-fade-in pb-10">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">📋 บันทึกกิจกรรม</h1>
                        <p className="text-gray-500 text-xs mt-1">ประวัติการเพิ่ม แก้ไข และลบข้อมูลทั้งหมด — เฉพาะ Super Admin</p>
                    </div>
                    <button onClick={() => fetchLogs(page * limit)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-sm font-medium border border-indigo-100 transition-colors">
                        🔄 รีเฟรช
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-gray-400">กำลังโหลด...</div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <span className="text-4xl mb-3">📭</span>
                        <p>ยังไม่มีกิจกรรมที่บันทึกไว้</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {logs.map(log => {
                            const colorClass = actionColor[log.action] || 'bg-gray-100 text-gray-600 border-gray-200';
                            const icon = actionIcon[log.action] || '📌';
                            return (
                                <div key={log.id} className="flex items-start gap-3 p-4 hover:bg-gray-50/50 transition-colors">
                                    <div className="shrink-0 w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-lg border border-gray-100">
                                        {icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center flex-wrap gap-2 mb-0.5">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${colorClass}`}>
                                                {log.action}
                                            </span>
                                            {log.entity_id && (
                                                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                    #{log.entity_id}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-700 leading-snug mt-1">
                                            {log.description || '-'}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                                            <span>👤 {log.performed_by}</span>
                                            <span>🕐 {dayjs(log.created_at).format('DD/MM/YYYY HH:mm:ss')}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3">
                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                        className="px-4 py-2 rounded-xl border bg-white text-sm disabled:opacity-40 hover:bg-gray-50">
                        ← ก่อนหน้า
                    </button>
                    <span className="text-sm text-gray-600 font-medium">หน้า {page + 1} / {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                        className="px-4 py-2 rounded-xl border bg-white text-sm disabled:opacity-40 hover:bg-gray-50">
                        ถัดไป →
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminActivity;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';

const LineCallbackPage: React.FC = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('กำลังเชื่อมต่อบัญชี LINE...');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const adminId = params.get('state');

        if (!code || !adminId) {
            setStatus('error');
            setMessage('ไม่พบรหัสยืนยันจาก LINE กรุณาลองใหม่อีกครั้ง');
            return;
        }

        const exchange = async () => {
            try {
                const res = await fetch(`${apiUrl}/api/admins/line-callback`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code, adminId })
                });
                const data = await res.json();
                if (res.ok) {
                    setStatus('success');
                    setMessage(`เชื่อมต่อบัญชี LINE สำเร็จ! User ID: ${data.lineUserId}`);
                    setTimeout(() => navigate('/admin/users'), 2500);
                } else {
                    setStatus('error');
                    setMessage(data.error || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
                }
            } catch {
                setStatus('error');
                setMessage('เครือข่ายขัดข้อง กรุณาลองใหม่');
            }
        };

        exchange();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center space-y-4">
                {status === 'loading' && (
                    <>
                        <Loader2 className="animate-spin text-indigo-500 mx-auto" size={48} />
                        <p className="text-slate-600">{message}</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <CheckCircle className="text-emerald-500 mx-auto" size={48} />
                        <h2 className="text-lg font-bold text-slate-800">เชื่อมต่อสำเร็จ! 🎉</h2>
                        <p className="text-sm text-slate-500">{message}</p>
                        <p className="text-xs text-slate-400">กำลังนำคุณกลับไปหน้าจัดการแอดมิน...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <XCircle className="text-red-500 mx-auto" size={48} />
                        <h2 className="text-lg font-bold text-slate-800">เกิดข้อผิดพลาด</h2>
                        <p className="text-sm text-slate-500">{message}</p>
                        <button
                            onClick={() => navigate('/admin/users')}
                            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
                        >
                            กลับไปหน้าจัดการแอดมิน
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default LineCallbackPage;

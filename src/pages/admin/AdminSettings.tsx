import React, { useState, useEffect } from 'react';
import { Input, Button, Form, message, Typography, Divider, Spin } from 'antd';
import { Save, Building2, CreditCard, User, QrCode } from 'lucide-react';
import { API_URL, getAuthHeaders } from '../../config';

const { Title, Text } = Typography;

interface PaymentSettings {
    bankName: string;
    accountName: string;
    accountNumber: string;
    promptpayQr: string;
}

const AdminSettings: React.FC = () => {
    const [form] = Form.useForm<PaymentSettings>();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/settings/payment`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const result = await res.json();
                if (result.success && result.data) {
                    form.setFieldsValue(result.data);
                }
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            message.error('ไม่สามารถดึงข้อมูลการตั้งค่าได้');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (values: PaymentSettings) => {
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/settings/payment`, {
                method: 'PUT',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(values)
            });

            if (res.ok) {
                message.success('บันทึกข้อมูลการชำระเงินสำเร็จ');
            } else {
                const errorData = await res.json();
                message.error(`บันทึกไม่สำเร็จ: ${errorData.error || 'ข้อผิดพลาดไม่ทราบสาเหตุ'}`);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-10">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าระบบ (Settings)</h1>
                <p className="text-gray-500 text-sm mt-1">จัดการข้อมูลพื้นฐานสำหรับการทำงานของระบบ</p>
            </div>

            <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-white">
                <div className="bg-indigo-50/50 p-6 border-b border-indigo-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <CreditCard size={20} />
                        </div>
                        <div>
                            <Title level={4} style={{ margin: 0 }} className="text-indigo-900">ข้อมูลการรับชำระเงิน</Title>
                            <Text type="secondary" className="text-sm">
                                ข้อมูลนี้จะถูกแนบไปพร้อมกับสลิปสรุปออเดอร์เมื่อแอดมินกดยืนยันคำสั่งซื้อ
                            </Text>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="py-12 flex justify-center">
                            <Spin size="large" tip="กำลังโหลดข้อมูล..." />
                        </div>
                    ) : (
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSave}
                            initialValues={{ bankName: '', accountName: '', accountNumber: '', promptpayQr: '' }}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <Form.Item
                                    name="bankName"
                                    label={<span className="font-semibold text-gray-700 flex items-center gap-2"><Building2 size={16} /> ธนาคาร</span>}
                                    rules={[{ required: true, message: 'กรุณาระบุชื่อธนาคาร' }]}
                                >
                                    <Input placeholder="เช่น กสิกรไทย, ไทยพาณิชย์" size="large" className="rounded-xl" />
                                </Form.Item>

                                <Form.Item
                                    name="accountName"
                                    label={<span className="font-semibold text-gray-700 flex items-center gap-2"><User size={16} /> ชื่อบัญชี</span>}
                                    rules={[{ required: true, message: 'กรุณาระบุชื่อบัญชี' }]}
                                >
                                    <Input placeholder="เช่น นายสมชาย ใจดี" size="large" className="rounded-xl" />
                                </Form.Item>

                                <Form.Item
                                    name="accountNumber"
                                    label={<span className="font-semibold text-gray-700 flex items-center gap-2"><CreditCard size={16} /> เลขที่บัญชี</span>}
                                    rules={[{ required: true, message: 'กรุณาระบุเลขที่บัญชี' }]}
                                >
                                    <Input placeholder="เช่น 012-3-45678-9" size="large" className="rounded-xl" />
                                </Form.Item>

                                <Form.Item
                                    name="promptpayQr"
                                    label={<span className="font-semibold text-gray-700 flex items-center gap-2"><QrCode size={16} /> ลิงก์รูป QR Code (PromptPay/บัญชี)</span>}
                                >
                                    <Input placeholder="เช่น https://example.com/qr.jpg (ถ้ามี)" size="large" className="rounded-xl" />
                                </Form.Item>
                            </div>

                            <Divider className="my-6" />

                            <div className="flex justify-end">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    icon={<Save size={18} />}
                                    loading={saving}
                                    className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-8 h-12 flex items-center shadow-md shadow-indigo-200"
                                >
                                    บันทึกข้อมูลการชำระเงิน
                                </Button>
                            </div>
                        </Form>
                    )}
                </div>
            </div>

            {/* ตัวอย่างการแสดงผล */}
            <div className="rounded-2xl border border-gray-100 shadow-sm mt-6 bg-white overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <span className="text-gray-700 font-semibold flex items-center gap-2">👀 ตัวอย่างข้อความที่จะแสดงท้ายสลิปออเดอร์</span>
                </div>
                <div className="p-6">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 font-mono text-sm whitespace-pre-line text-gray-700">
                        {`<...>
------------------
💰 ยอดรวมทั้งสิ้น: 1,500 บาท

🏦 ธนาคาร: ${form.getFieldValue('bankName') || '(รอระบุ)'}
ชื่อบัญชี: ${form.getFieldValue('accountName') || '(รอระบุ)'}
เลขบัญชี: ${form.getFieldValue('accountNumber') || '(รอระบุ)'}
{รูป QR Code ถ้ามี}

เมื่อโอนเงินแล้วแจ้งสลิปได้เลยนะครับ ขอบคุณครับ 🙏`}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;

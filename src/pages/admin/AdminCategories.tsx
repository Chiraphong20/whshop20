import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, LayoutGrid, Search, 
  Save, X, GripVertical, Info
} from 'lucide-react';
import { message, Modal, Table, Button, Input, Form, InputNumber, Select, Tooltip } from 'antd';
import * as LucideIcons from 'lucide-react';
import { API_URL, getAuthHeaders } from '../../config';
import { Category } from '../../types';

// รายการไอคอนที่อนุญาตให้เลือก (เพื่อให้ UI ไม่รกเกินไป)
const AVAILABLE_ICONS = [
  'Box', 'Package', 'Tag', 'ShoppingBag', 'Store', 'Gift', 
  'Gamepad2', 'Activity', 'Sparkles', 'CookingPot', 'Tent', 
  'Zap', 'Plug', 'PawPrint', 'Hammer', 'Coffee', 'Armchair', 
  'Heart', 'Flame', 'Pencil', 'Laptop', 'MoreHorizontal',
  'TrendingUp', 'Percent', 'Utensils', 'Smartphone', 'Baby',
  'Glasses', 'Sofa', 'Shirt', 'Watch', 'Mouse', 'Monitor'
];

const AVAILABLE_COLORS = [
  { name: 'Rose', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600' },
  { name: 'Red', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600' },
  { name: 'Pink', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600' },
  { name: 'Purple', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' },
  { name: 'Indigo', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600' },
  { name: 'Blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
  { name: 'Cyan', bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-600' },
  { name: 'Teal', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-600' },
  { name: 'Green', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' },
  { name: 'Emerald', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600' },
  { name: 'Yellow', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600' },
  { name: 'Amber', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600' },
  { name: 'Orange', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
  { name: 'Slate', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600' },
  { name: 'Gray', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600' },
];

const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.Box;
  return <IconComponent className={className} />;
};

const AdminCategories: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${API_URL}/api/categories`);
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (error) {
            message.error('โหลดข้อมูลหมวดหมู่ล้มเหลว');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (values: any) => {
        const payload = {
            ...values,
            color: values.color || 'bg-slate-50 border-slate-200'
        };

        try {
            if (editingCategory) {
                const res = await fetch(`${API_URL}/api/categories/${editingCategory.id}`, {
                    method: 'PUT',
                    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    message.success('แก้ไขหมวดหมู่สำเร็จ');
                    fetchCategories();
                    setIsModalOpen(false);
                }
            } else {
                const res = await fetch(`${API_URL}/api/categories`, {
                    method: 'POST',
                    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    message.success('เพิ่มหมวดหมู่สำเร็จ');
                    fetchCategories();
                    setIsModalOpen(false);
                }
            }
        } catch (error) {
            message.error('บันทึกข้อมูลล้มเหลว');
        }
    };

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: 'ยืนยันการลบ',
            content: 'คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้? สินค้าที่อยู่ในหมวดหมู่นี้จะยังคงอยู่ แต่ชื่อหมวดหมู่จะแอปแสดงผลไม่ตรงกันในหน้าลูกค้า',
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            async onOk() {
                try {
                    const res = await fetch(`${API_URL}/api/categories/${id}`, {
                        method: 'DELETE',
                        headers: getAuthHeaders()
                    });
                    if (res.ok) {
                        message.success('ลบหมวดหมู่สำเร็จ');
                        fetchCategories();
                    }
                } catch (error) {
                    message.error('ลบข้อมูลล้มเหลว');
                }
            }
        });
    };

    const openModal = (category: Category | null = null) => {
        setEditingCategory(category);
        if (category) {
            form.setFieldsValue(category);
        } else {
            form.resetFields();
            form.setFieldValue('displayOrder', categories.length);
            form.setFieldValue('icon', 'Box');
            form.setFieldValue('color', 'bg-slate-50 border-slate-200');
        }
        setIsModalOpen(true);
    };

    const columns = [
        {
            title: 'ลำดับ',
            dataIndex: 'displayOrder',
            key: 'displayOrder',
            width: 80,
            sorter: (a: Category, b: Category) => a.displayOrder - b.displayOrder,
        },
        {
            title: 'ตัวอย่าง',
            key: 'preview',
            width: 150,
            render: (_: any, record: Category) => (
                <div className={`p-3 rounded-xl border ${record.color} flex flex-col items-center gap-1 w-24 shadow-sm`}>
                    <DynamicIcon name={record.icon} className="w-6 h-6" />
                    <span className="text-[10px] font-bold text-slate-800 text-center line-clamp-1">{record.name}</span>
                </div>
            )
        },
        {
            title: 'ชื่อหมวดหมู่',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Icon',
            dataIndex: 'icon',
            key: 'icon',
            render: (icon: string) => (
                <div className="flex items-center gap-2">
                    <DynamicIcon name={icon} />
                    <span className="text-slate-400 text-xs">{icon}</span>
                </div>
            )
        },
        {
            title: 'จัดการ',
            key: 'action',
            className: 'text-right',
            render: (_: any, record: Category) => (
                <div className="flex justify-end gap-2">
                    <Button 
                        type="text" 
                        icon={<Edit size={16} className="text-blue-600" />} 
                        onClick={() => openModal(record)} 
                    />
                    <Button 
                        type="text" 
                        icon={<Trash2 size={16} className="text-red-500" />} 
                        onClick={() => handleDelete(record.id)} 
                    />
                </div>
            )
        }
    ];

    return (
        <div className="animate-fade-in p-2 md:p-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <LayoutGrid className="text-orange-500" /> จัดการหมวดหมู่สินค้า
                    </h1>
                    <p className="text-slate-500 text-sm">เพิ่ม ลบ หรือแก้ไขหมวดหมู่ที่จะไปแสดงผลในหน้าแรกของร้านค้า</p>
                </div>
                <Button 
                    type="primary" 
                    icon={<Plus size={18} />} 
                    onClick={() => openModal()}
                    className="bg-slate-900 h-12 px-6 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800"
                >
                    เพิ่มหมวดหมู่ใหม่
                </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <Table 
                    columns={columns} 
                    dataSource={categories} 
                    loading={loading}
                    rowKey="id"
                    pagination={false}
                />
            </div>

            <Modal
                title={editingCategory ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                className="rounded-2xl"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSave}
                    className="mt-4"
                >
                    <Form.Item name="name" label="ชื่อหมวดหมู่" rules={[{ required: true, message: 'กรุณาระบุชื่อหมวดหมู่' }]}>
                        <Input placeholder="เช่น ความงาม, อิเล็กทรอนิกส์" size="large" className="rounded-lg" />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="displayOrder" label="ลำดับการแสดงผล" rules={[{ required: true }]}>
                            <InputNumber min={0} className="w-full rounded-lg" size="large" />
                        </Form.Item>

                        <Form.Item name="icon" label="เลือก Icon">
                            <Select 
                                size="large" 
                                className="w-full" 
                                showSearch
                                options={AVAILABLE_ICONS.map(icon => ({
                                    value: icon,
                                    label: (
                                        <div className="flex items-center gap-2 cursor-pointer">
                                            <DynamicIcon name={icon} />
                                            <span>{icon}</span>
                                        </div>
                                    )
                                }))}
                            />
                        </Form.Item>
                    </div>

                    <Form.Item name="color" label="โทนสี (ธีม)">
                        <Select 
                            size="large" 
                            className="w-full"
                            options={AVAILABLE_COLORS.map(c => ({
                                value: `${c.bg} ${c.border}`,
                                label: (
                                    <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded ${c.bg} ${c.border}`}></div>
                                        <span>{c.name}</span>
                                    </div>
                                )
                            }))}
                        />
                    </Form.Item>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                        <p className="text-xs text-slate-500 mb-3 flex items-center gap-1 font-bold">
                            <Info size={14} /> ตัวอย่างการแสดงผลบนปุ่ม:
                        </p>
                        <Form.Item 
                            noStyle
                            shouldUpdate={(prevValues, currentValues) => 
                                prevValues.name !== currentValues.name || 
                                prevValues.icon !== currentValues.icon || 
                                prevValues.color !== currentValues.color
                            }
                        >
                            {({ getFieldsValue }) => {
                                const { name, icon, color } = getFieldsValue();
                                return (
                                    <div className="flex justify-center">
                                        <div className={`aspect-[4/3] w-32 ${color || 'bg-slate-50 border-slate-200'} border rounded-xl flex flex-col items-center justify-center gap-2 shadow-sm`}>
                                            <div className="p-2 bg-white/50 rounded-full shadow-inner border border-white/50 text-slate-700">
                                                <DynamicIcon name={icon || 'Box'} className="w-6 h-6" />
                                            </div>
                                            <span className="font-bold text-slate-800 text-xs text-center px-1 line-clamp-1">{name || 'ชื่อหมวดหมู่'}</span>
                                        </div>
                                    </div>
                                );
                            }}
                        </Form.Item>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button onClick={() => setIsModalOpen(false)} size="large" className="rounded-lg">ยกเลิก</Button>
                        <Button type="primary" htmlType="submit" size="large" icon={<Save size={18} />} className="bg-slate-900 rounded-lg h-12 px-8 flex items-center gap-2">บันทึกข้อมูล</Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminCategories;

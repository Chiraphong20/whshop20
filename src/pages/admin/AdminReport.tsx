import React, { useState, useMemo } from 'react';
import { DatePicker, Select, Table, Button, message } from 'antd';
import { BarChart2, TrendingUp, Package, Calendar, Download, FileText } from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/th';
import locale from 'antd/es/date-picker/locale/th_TH';
import { Order, Product } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

const { RangePicker } = DatePicker;

interface AdminReportProps {
    orders: Order[];
    products: Product[];
}

const AdminReport: React.FC<AdminReportProps> = ({ orders, products }) => {
    const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([dayjs().startOf('month'), dayjs().endOf('month')]);
    const [preset, setPreset] = useState<string>('month');

    const handlePresetChange = (value: string) => {
        setPreset(value);
        const now = dayjs();
        if (value === 'today') setDateRange([now.startOf('day'), now.endOf('day')]);
        else if (value === 'week') setDateRange([now.startOf('week'), now.endOf('week')]);
        else if (value === 'month') setDateRange([now.startOf('month'), now.endOf('month')]);
        else if (value === 'year') setDateRange([now.startOf('year'), now.endOf('year')]);
        else if (value === 'all') setDateRange([null, null]);
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            if (order.status === 'CANCELLED') return false;
            if (!dateRange[0] || !dateRange[1]) return true;
            const orderDate = dayjs(order.timestamp);
            return orderDate.isBetween(dateRange[0], dateRange[1], 'day', '[]');
        });
    }, [orders, dateRange]);

    const stats = useMemo(() => {
        const totalRevenue = filteredOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
        const totalOrders = filteredOrders.length;
        const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

        // Calculate Best Sellers
        const productSales: Record<string, { id: string, name: string, qty: number, revenue: number }> = {};

        filteredOrders.forEach(order => {
            order.items.forEach(item => {
                if (!productSales[item.productId]) {
                    productSales[item.productId] = {
                        id: item.productId,
                        name: item.productName || 'Unknown Product',
                        qty: 0,
                        revenue: 0
                    };
                }
                const qty = Number(item.quantity) || 0;
                productSales[item.productId].qty += qty;
                const priceMatch = (item as any).price || (item.totalPrice ? item.totalPrice / qty : 0);
                const price = Number(priceMatch) || 0;
                productSales[item.productId].revenue += price * qty;
            });
        });

        const bestSellers = Object.values(productSales).sort((a, b) => b.revenue - a.revenue);

        return { totalRevenue, totalOrders, avgOrderValue, bestSellers };
    }, [filteredOrders]);

    const exportToCSV = () => {
        const bom = "\uFEFF";
        let csvContent = "";

        // Sales Summary
        csvContent += "สรุปยอดขาย (Sales Summary)\n";
        csvContent += "ยอดขายสุทธิ,จำนวนออเดอร์,ยอดใช้จ่ายเฉลี่ยต่อบิล\n";
        csvContent += `${stats.totalRevenue},${stats.totalOrders},${stats.avgOrderValue}\n\n`;

        // Best Sellers
        csvContent += "สินค้าที่สร้างรายได้สูงสุด (Best Sellers)\n";
        csvContent += "อันดับ,ชื่อสินค้า,จำนวนที่ขายได้,ยอดขายสุทธิ\n";
        stats.bestSellers.forEach((s, index) => {
            const safeName = s.name.replace(/"/g, '""');
            csvContent += `${index + 1},"${safeName}",${s.qty},${s.revenue}\n`;
        });

        const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sales_report_${dayjs().format('YYYYMMDD')}.csv`;
        link.click();
    };

    const exportToPDF = async () => {
        const hideLoading = message.loading('กำลังสร้าง PDF...', 0);
        try {
            const fontUrl = '/fonts/tahoma.ttf';
            const response = await fetch(fontUrl);
            const blob = await response.blob();

            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64data = (reader.result as string).split(',')[1];
                const doc = new jsPDF();

                doc.addFileToVFS('tahoma.ttf', base64data);
                doc.addFont('tahoma.ttf', 'Tahoma', 'normal');
                doc.setFont('Tahoma');

                // Header Title
                doc.setFontSize(18);
                doc.text("รายงานยอดขายสุทธิ (Sales Report)", 14, 20);

                // Date Range
                doc.setFontSize(12);
                const dateText = (dateRange[0] && dateRange[1])
                    ? `วันที่: ${dateRange[0].format('DD/MM/YYYY')} ถึง ${dateRange[1].format('DD/MM/YYYY')}`
                    : 'วันที่: ทั้งหมด';
                doc.text(dateText, 14, 28);

                // Summary Boxes
                doc.setFontSize(11);
                doc.text(`ยอดขายสุทธิ: ฿${stats.totalRevenue.toLocaleString()}`, 14, 38);
                doc.text(`จำนวนออเดอร์: ${stats.totalOrders} รายการ`, 100, 38);
                doc.text(`ยอดเฉลี่ยต่อบิล: ฿${stats.avgOrderValue.toLocaleString()}`, 14, 46);

                // Table Title
                doc.setFontSize(14);
                doc.text("สินค้าขายดี (Best Sellers)", 14, 60);

                // Define Table Columns and Rows
                const tableColumn = ["อันดับ", "ชื่อสินค้า", "จำนวน (ชิ้น)", "ยอดขาย (บาท)"];
                const tableRows = stats.bestSellers.map((s, index) => [
                    index + 1,
                    s.name,
                    s.qty.toLocaleString(),
                    s.revenue.toLocaleString()
                ]);

                // Generate Table
                autoTable(doc, {
                    head: [tableColumn],
                    body: tableRows,
                    startY: 65,
                    styles: { fontSize: 10, font: "Tahoma" },
                    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], font: "Tahoma", fontStyle: "normal" }
                });

                // Save
                doc.save(`sales_report_${dayjs().format('YYYYMMDD')}.pdf`);
                hideLoading();
                message.success('ส่งออก PDF สำเร็จ');
            };
        } catch (error) {
            console.error("Error loading font for PDF", error);
            hideLoading();
            message.error('เกิดข้อผิดพลาดในการโหลดแบบอักษร');
        }
    };

    const columns = [
        { title: 'อันดับ', dataIndex: 'rank', key: 'rank', width: 80, align: 'center' as const, render: (_: any, __: any, index: number) => <span className="font-bold text-slate-500">{index + 1}</span> },
        { title: 'ชื่อสินค้า', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-bold text-slate-800">{text}</span> },
        { title: 'จำนวนที่ขายได้', dataIndex: 'qty', key: 'qty', align: 'right' as const, render: (val: number) => <span className="font-medium text-emerald-600">{val.toLocaleString()} ชิ้น</span> },
        { title: 'ยอดขายสุทธิ', dataIndex: 'revenue', key: 'revenue', align: 'right' as const, render: (val: number) => <span className="font-bold text-indigo-600">฿{val.toLocaleString()}</span> },
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex justify-end gap-3 mb-2">
                <Button type="default" icon={<FileText size={16} />} onClick={exportToCSV} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 font-medium px-4">
                    Export CSV
                </Button>
                <Button type="default" icon={<Download size={16} />} onClick={exportToPDF} className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-medium px-4">
                    Export PDF
                </Button>
            </div>

            <div id="report-content-to-print" className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="w-full md:w-auto">
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-500"><BarChart2 size={24} /></div>
                            รายงานยอดขาย (Sales Report)
                        </h1>
                        <p className="text-slate-500 text-sm mt-1 ml-11">วิเคราะห์ยอดขายและสินค้าขายดีตามช่วงเวลา</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <Select
                            value={preset}
                            onChange={handlePresetChange}
                            className="w-full sm:w-32 custom-select-rounded"
                            style={{ height: '42px' }}
                            options={[
                                { value: 'today', label: 'วันนี้' },
                                { value: 'week', label: 'สัปดาห์นี้' },
                                { value: 'month', label: 'เดือนนี้' },
                                { value: 'year', label: 'ปีนี้' },
                                { value: 'all', label: 'ทั้งหมด' },
                                { value: 'custom', label: 'กำหนดเอง' },
                            ]}
                        />
                        <RangePicker
                            locale={locale}
                            format="DD/MM/YYYY"
                            value={preset === 'all' ? null : dateRange}
                            onChange={(dates) => { setDateRange(dates as any); setPreset('custom'); }}
                            style={{ height: '42px', borderRadius: '0.75rem' }}
                            className="w-full sm:w-64"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-3xl text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 opacity-10 transform rotate-12"><TrendingUp size={120} /></div>
                        <p className="text-indigo-100 text-sm font-medium mb-1">ยอดขายสุทธิ (Revenue)</p>
                        <p className="text-4xl font-bold">฿{stats.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 opacity-[0.03] transform rotate-12"><Package size={120} /></div>
                        <p className="text-slate-500 text-sm font-medium mb-1">จำนวนออเดอร์ (Orders)</p>
                        <p className="text-4xl font-bold text-slate-800">{stats.totalOrders} <span className="text-base font-normal text-slate-400">รายการ</span></p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 opacity-[0.03] transform rotate-12"><BarChart2 size={120} /></div>
                        <p className="text-slate-500 text-sm font-medium mb-1">ยอดใช้จ่ายเฉลี่ยต่อบิล (AOV)</p>
                        <p className="text-4xl font-bold text-slate-800">฿{stats.avgOrderValue.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Package className="text-indigo-500" size={20} /> สินค้าที่สร้างรายได้สูงสุด (Best Sellers)
                        </h2>
                    </div>
                    <Table
                        columns={columns}
                        dataSource={stats.bestSellers.map((s, i) => ({ ...s, rank: i + 1, key: s.id }))}
                        pagination={{ pageSize: 10 }}
                        bordered={false}
                        rowClassName="hover:bg-slate-50 transition-colors"
                    />
                </div>

            </div>
        </div>
    );
};

export default AdminReport;

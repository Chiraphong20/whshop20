import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Plus, Edit, Trash2, Search, X, Image as ImageIcon, Upload, Loader2,
  Package, DollarSign, Tag, ScanBarcode, FileSpreadsheet, Download,
  LayoutGrid, List, Filter, Fingerprint
} from 'lucide-react';
import { message, Modal, Select } from 'antd';
import { API_URL, getAuthHeaders } from '../../config';
import { Category } from '../../types';

// --- Mocks & Types สำหรับ Preview Environment ---
export interface Product {
  id: string;
  name: string;
  category: string;
  retailPrice: number;
  wholesalePrice: number;
  minWholesaleQty: number;
  unitQty?: number;       // จำนวนชิ้นต่อหน่วย เช่น 1 แพ็ค = 12 ชิ้น
  stock: number;
  image: string;
  images?: string[];
}

const uploadImageToCloudinary = async (file: File, category: string): Promise<string> => {
  return new Promise((resolve) => {
    // จำลองการอัปโหลดรูปภาพด้วยการสร้าง Local Object URL เพื่อให้พรีวิวใน UI ได้
    setTimeout(() => resolve(URL.createObjectURL(file)), 1000);
  });
};

// ---------------------------------------------

// --------------------------------------------------------
// 🔧 ตั้งค่า Cloudinary Account ของคุณที่นี่
// --------------------------------------------------------
const CLOUD_NAME = "dffqpiizc";
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_auto,f_auto,w_800/`;
// --------------------------------------------------------

// CATEGORIES_LIST was removed and replaced by dynamic categories from props

const INITIAL_UNITS = [
  'ชิ้น', 'แพ็ค', 'โหล', 'ลัง', 'ขวด', 'กระป๋อง', 'ห่อ', 'ถุง', 'กล่อง', 'คู่', 'ชุด'
];

interface ProductWithGift extends Product {
  hasGift?: boolean;
  giftDescription?: string;
  unit?: string;
  unitQty?: number;
  bulkQty?: number;
  bulkPrice?: number;
  barcode?: string;
  imageId?: string;
  images?: string[];
  description?: string;
}

interface AdminProductsProps {
  products?: Product[];
  categories?: Category[];
  onAdd?: (p: Product) => void;
  onEdit?: (p: Product) => void;
  onDelete?: (id: string) => void;
}

const AdminProducts: React.FC<AdminProductsProps> = ({ onAdd, onEdit, onDelete, categories = [] }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ทั้งหมด');
  const [sortBy, setSortBy] = useState<string>('ล่าสุด');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [units, setUnits] = useState<string[]>(INITIAL_UNITS);

  const [isProcessingExcel, setIsProcessingExcel] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // 🌟 State สำหรับจัดเก็บ ID ของสินค้าที่ถูก Checkbox เลือกไว้
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ProductWithGift>({
    id: '', barcode: '', name: '', category: categories.length > 0 ? categories[0].name : '',
    retailPrice: 0, wholesalePrice: 0, minWholesaleQty: 1, unitQty: 1,
    bulkQty: 0, bulkPrice: 0, stock: 0,
    image: '', images: [], imageId: '', description: '', unit: 'ชิ้น', hasGift: false, giftDescription: ''
  });

  // ล้างการเลือก Checkbox ทุกครั้งที่เปลี่ยนช่องค้นหาหรือเปลี่ยนหมวดหมู่
  useEffect(() => {
    setSelectedIds([]);
  }, [searchTerm, filterCategory]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/api/products`, {
          headers: getAuthHeaders()
        });
        if (response.ok) {
          const data = await response.json();
          const formattedData = data.map((item: any) => ({
            ...item,
            images: typeof item.images === 'string' ? JSON.parse(item.images) : (item.images || [])
          }));
          setProducts(formattedData);
        } else {
          message.error('ไม่สามารถโหลดข้อมูลสินค้าได้');
        }
      } catch (error) {
        console.error('Fetch Error:', error);
        message.error('เซิร์ฟเวอร์หลังบ้านอาจจะยังไม่ได้เปิดการทำงาน (Port 5000)');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchProducts();
  }, []);

  const resetForm = () => {
    setFormData({
      id: '', barcode: '', name: '', category: categories.length > 0 ? categories[0].name : '',
      retailPrice: 0, wholesalePrice: 0, minWholesaleQty: 1, unitQty: 1,
      bulkQty: 0, bulkPrice: 0, stock: 0,
      image: '', images: [], imageId: '', description: '', unit: 'ชิ้น', hasGift: false, giftDescription: ''
    });
    setIsEditing(false);
    setIsFormOpen(false);
  };

  const handleEdit = (product: Product) => {
    setFormData({
      ...product,
      barcode: (product as ProductWithGift).barcode || '',
      imageId: (product as ProductWithGift).imageId || '',
      images: product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []),
      hasGift: false
    });
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category) {
      message.error('กรุณากรอกชื่อสินค้าและหมวดหมู่');
      return;
    }

    const finalId = formData.id?.trim() || `PROD-${Date.now()}`;
    if (!isEditing) {
      const duplicateId = products.find(p => p.id === finalId);
      if (duplicateId) {
        message.error(`รหัสสินค้า "${finalId}" มีอยู่ในระบบแล้ว`);
        return;
      }
    }

    if (formData.barcode && formData.barcode.trim() !== '') {
      const duplicateBarcode = products.find(p =>
        (p as ProductWithGift).barcode === formData.barcode && p.id !== finalId
      );
      if (duplicateBarcode) {
        message.error(`บาร์โค้ด "${formData.barcode}" ซ้ำกับสินค้า "${duplicateBarcode.name}"`);
        return;
      }
    }

    let finalImages = [...(formData.images || [])];

    if (formData.imageId) {
      const idUrl = `${CLOUDINARY_BASE_URL}${formData.imageId}.jpg`;
      if (!finalImages.includes(idUrl)) {
        finalImages.unshift(idUrl);
      }
    }

    const finalImageUrl = finalImages.length > 0 ? finalImages[0] : (formData.image || '');

    const productData = {
      id: finalId,
      barcode: formData.barcode,
      name: formData.name,
      category: formData.category,
      retailPrice: Number(formData.retailPrice),
      wholesalePrice: Number(formData.wholesalePrice),
      minWholesaleQty: Number(formData.minWholesaleQty),
      unitQty: Number(formData.unitQty) || 1,
      bulkQty: Number(formData.bulkQty) || 0,
      bulkPrice: Number(formData.bulkPrice) || 0,
      stock: Number(formData.stock),
      image: finalImageUrl,
      images: finalImages,
      imageId: formData.imageId,
      description: formData.description,
      unit: formData.unit || 'ชิ้น'
    } as Product;

    try {
      if (isEditing) {
        const response = await fetch(`${API_URL}/api/products`, {
          method: 'PUT',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(productData)
        });

        if (response.ok) {
          setProducts(prev => prev.map(p => p.id === productData.id ? productData : p));
          if (onEdit) onEdit(productData);
          message.success('อัปเดตข้อมูลสินค้าและรูปล่าสุดเรียบร้อย! 🎉');
          resetForm();
        } else {
          const result = await response.json();
          message.error(`แก้ไขไม่สำเร็จ: ${result.error || 'Unknown Error'}`);
        }
      } else {
        const response = await fetch(`${API_URL}/api/products`, {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(productData)
        });

        if (response.ok) {
          setProducts(prev => [...prev, productData]);
          if (onAdd) onAdd(productData);
          message.success('เพิ่มสินค้าลงฐานข้อมูลเรียบร้อย! 🎉');
          resetForm();
        } else {
          const result = await response.json();
          message.error(`บันทึกไม่สำเร็จ: ${result.error || 'Unknown Error'}`);
        }
      }
    } catch (error) {
      console.error('API Error:', error);
      message.error('ไม่สามารถติดต่อเซิร์ฟเวอร์ฐานข้อมูลได้');
    }
  };

  // 🌟 ฟังก์ชันลบสินค้า (เดี่ยว)
  const handleDeleteClick = (id: string) => {
    Modal.confirm({
      title: 'ยืนยันการลบสินค้า',
      content: `คุณต้องการลบสินค้ารหัส ${id} ใช่หรือไม่? ข้อมูลนี้จะถูกลบออกจากฐานข้อมูลถาวร`,
      okText: 'ลบข้อมูล',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      async onOk() {
        try {
          const response = await fetch(`${API_URL}/api/products?id=${id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            setProducts(prev => prev.filter(p => p.id !== id));
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id)); // ลบออกจากรายการที่เลือกด้วย
            if (onDelete) onDelete(id);
            message.success('ลบสินค้าออกจากฐานข้อมูลเรียบร้อย');
          } else {
            const result = await response.json();
            message.error(`ลบไม่สำเร็จ: ${result.error || 'Unknown Error'}`);
          }
        } catch (error) {
          console.error('API Error:', error);
          message.error('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
        }
      },
    });
  };

  // 🌟 ฟังก์ชันลบสินค้าที่เลือก (หลายรายการ)
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    Modal.confirm({
      title: 'ยืนยันการลบสินค้าหลายรายการ',
      content: `คุณต้องการลบสินค้าที่เลือกจำนวน ${selectedIds.length} รายการ ใช่หรือไม่? ข้อมูลทั้งหมดจะถูกลบออกจากฐานข้อมูลถาวร`,
      okText: 'ลบที่เลือก',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      async onOk() {
        try {
          // ยิง API ลบทีละตัวโดยใช้ Promise.all
          const deletePromises = selectedIds.map(id =>
            fetch(`${API_URL}/api/products?id=${id}`, { method: 'DELETE' })
          );
          await Promise.all(deletePromises);

          setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)));
          if (onDelete) {
            selectedIds.forEach(id => onDelete(id));
          }
          setSelectedIds([]);
          message.success(`ลบสินค้าที่เลือกสำเร็จจำนวน ${selectedIds.length} รายการ`);
        } catch (error) {
          console.error('API Bulk Delete Error:', error);
          message.error('เกิดข้อผิดพลาดในการลบสินค้าบางรายการ');
        }
      },
    });
  };

  // 🌟 ฟังก์ชันจัดการ Checkbox การเลือกสินค้า
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>, currentFilteredProducts: Product[]) => {
    if (e.target.checked) {
      setSelectedIds(currentFilteredProducts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      if (!bstr) return;

      try {
        const wb = XLSX.read(bstr, { type: 'binary' }); // Use real XLSX in production
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (data.length === 0) {
          message.error("ไม่พบข้อมูลในไฟล์ Excel");
          return;
        }

        setIsProcessingExcel(true);
        setImportProgress(0);

        let successCount = 0;
        let skippedCount = 0;
        let processedCount = 0;
        const totalRows = data.length;

        for (const row of data) {
          const rawId = row["รหัสสินค้า"] || row["ProductID"] || row["ID"] || "";
          const rawBarcode = row["บาร์โค้ด"] || row["Barcode"] || "";
          const imageIdFromExcel = row["รหัสรูปภาพ"] || row["ImageID"] || "";

          const barcode = String(rawBarcode).trim();

          // ใช้รหัสรูปภาพเป็น PK (Primary Key) ถ้ามี ตาม Requirement ใหม่
          const productId = String(imageIdFromExcel).trim() || String(rawId).trim() || barcode || `PROD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const productName = row["ชื่อสินค้า"] || row["Name"] || "สินค้าไม่มีชื่อ";

          const isDuplicate = products?.some(p => p.id === productId);
          if (isDuplicate) {
            skippedCount++;
            processedCount++;
            setImportProgress(Math.round((processedCount / totalRows) * 100));
            continue;
          }

          const unitFromExcel = row["หน่วยเรียก"] || row["หน่วยนับ"] || row["Unit"] || "ชิ้น";
          if (unitFromExcel && !units.includes(unitFromExcel)) {
            setUnits(prev => [...prev, unitFromExcel]);
          }

          const excelImage = row["รูปภาพ"] || row["Image"] || row["รูปภาพ (URL)"] || "";

          let excelImages: string[] = [];
          if (excelImage) {
            excelImages = String(excelImage).split(',').map(url => url.trim()).filter(url => url !== "");
          } else if (imageIdFromExcel) {
            excelImages = [`${CLOUDINARY_BASE_URL}${imageIdFromExcel}.jpg`];
          }

          const finalImageUrl = excelImages.length > 0 ? excelImages[0] : "";

          const newProduct: ProductWithGift = {
            id: productId,
            barcode: barcode,
            name: productName,
            category: row["หมวดหมู่"] || row["Category"] || "เบ็ดเต็ดลฌ",
            // รองรับทั้ง ชื่อใหม่ (ราคา 1 / ราคา 2) และชื่อเดิม (ราคาปลีก / ราคาส่ง) เพื่อความเข้ากันได้
            retailPrice: Number(row["ราคา 1"] || row["ราคาปลีก"] || row["RetailPrice"] || 0),
            wholesalePrice: Number(row["ราคา 2"] || row["ราคาส่ง"] || row["WholesalePrice"] || 0),
            minWholesaleQty: Number(row["ขั้นต่ำราคา 2"] || row["จำนวนขั้นต่ำ"] || row["MinQty"] || 1),
            unitQty: Number(row["ชิ้น/หน่วย"] || row["จำนวน/หน่วย"] || row["UnitQty"] || 1),
            bulkQty: Number(row["จำนวน(ราคา Step)"] || row["BulkQty"] || 0),
            bulkPrice: Number(row["ราคา Step"] || row["ราคา Step)"] || row["BulkPrice"] || 0),
            stock: Number(row["สต็อก"] || row["Stock"] || 0),
            unit: unitFromExcel,
            description: row["รายละเอียด"] || row["Description"] || "",
            image: finalImageUrl,
            images: excelImages,
            imageId: imageIdFromExcel,
            hasGift: false,
            giftDescription: ''
          };

          try {
            const response = await fetch(`${API_URL}/api/products`, {
              method: 'POST',
              headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
              body: JSON.stringify(newProduct)
            });

            if (response.ok) {
              setProducts(prev => [...prev, newProduct as Product]);
              if (onAdd) onAdd(newProduct as Product);
              successCount++;
            } else {
              skippedCount++;
            }
          } catch (err) {
            console.error('Failed to insert row from Excel', err);
            skippedCount++;
          }

          processedCount++;
          setImportProgress(Math.round((processedCount / totalRows) * 100));
        }

        if (skippedCount > 0) {
          message.warning(`นำเข้าสำเร็จ ${successCount} รายการ (ข้าม/ล้มเหลว ${skippedCount} รายการ)`);
        } else {
          message.success(`นำเข้าสินค้าสำเร็จ ${successCount} รายการ`);
        }

      } catch (error) {
        console.error(error);
        message.error("เกิดข้อผิดพลาดในการอ่านไฟล์ Excel");
      } finally {
        setIsProcessingExcel(false);
        setImportProgress(0);
        if (excelInputRef.current) excelInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        // ตัวอย่าง Case A: สินค้าขายปลีกชิ้น (ชิ้นละ 20)
        "รหัสสินค้า": "PROD-001",
        "บาร์โค้ด": "88519923001",
        "ชื่อสินค้า": "ทิชชู่ม้า (ตัวอย่าง Case A)",
        "หมวดหมู่": "เบ็ดเตล็ด",
        "ราคา 1": 20,
        "ราคา 2": 18,
        "ขั้นต่ำราคา 2": 10,
        "ชิ้น/หน่วย": 1,
        "จำนวน(ราคา Step)": 0,
        "ราคา Step": 0,
        "สต็อก": 100,
        "หน่วยเรียก": "ชิ้น",
        "รายละเอียด": "รายละเอียดเพิ่มเติม (optional)",
        "รหัสรูปภาพ": "01-01-0001",
        "รูปภาพ (URL)": ""
      },
      {
        // ตัวอย่าง Case B: สินค้าขายยกแพ็ค (แพ็คละ 96 / 6 ชิ้น)
        "รหัสสินค้า": "PROD-002",
        "บาร์โค้ด": "88519923002",
        "ชื่อสินค้า": "สินค้ายกแพ็ค (ตัวอย่าง Case B)",
        "หมวดหมู่": "เบ็ดเตล็ด",
        "ราคา 1": 96,
        "ราคา 2": 90,
        "ขั้นต่ำราคา 2": 10,
        "ชิ้น/หน่วย": 6,
        "จำนวน(ราคา Step)": 0,
        "ราคา Step": 0,
        "สต็อก": 50,
        "หน่วยเรียก": "แพ็ค",
        "รายละเอียด": "1 แพ็ค = 6 ชิ้น",
        "รหัสรูปภาพ": "01-01-0002",
        "รูปภาพ (URL)": ""
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "warehouse_product_template.xlsx");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length > 0) {
      setUploading(true);
      try {
        const uploadPromises = files.map((file: File) => uploadImageToCloudinary(file, formData.category));
        const imageUrls = await Promise.all(uploadPromises);

        setFormData(prev => {
          const currentImages = prev.images || [];
          const newImages = [...currentImages, ...imageUrls];
          return {
            ...prev,
            images: newImages,
            image: newImages.length > 0 ? newImages[0] : ''
          };
        });
        message.success(`อัปโหลดรูปภาพเพิ่มสำเร็จ ${imageUrls.length} รูป`);
      } catch (error) {
        message.error('อัปโหลดรูปภาพล้มเหลว');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormData(prev => {
      const currentImages = prev.images || [];
      const newImages = currentImages.filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        images: newImages,
        image: newImages.length > 0 ? newImages[0] : ''
      };
    });
  };

  const filteredProducts = products.filter(p => {
    const productBarcode = (p as ProductWithGift).barcode;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (productBarcode && productBarcode.includes(searchTerm)) ||
      (p.id.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'ทั้งหมด' || p.category?.split('/').includes(filterCategory);
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'ราคา: ต่ำ-สูง': return a.retailPrice - b.retailPrice;
      case 'ราคา: สูง-ต่ำ': return b.retailPrice - a.retailPrice;
      case 'สต็อก: น้อย-มาก': return a.stock - b.stock;
      case 'สต็อก: มาก-น้อย': return b.stock - a.stock;
      case 'ล่าสุด':
      default:
        return b.id.localeCompare(a.id);
    }
  });

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* --- Header Area --- */}
      <div className="bg-white p-4 shadow-sm border-b border-slate-200">
        <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Package className="text-orange-500" /> จัดการสินค้า (โกดัง)
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              สินค้าทั้งหมด <span className="font-bold text-slate-800">{products.length}</span> รายการ |
              แสดงผล <span className="font-bold text-orange-600">{filteredProducts.length}</span> รายการ
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* 🌟 ปุ่มลบทีละหลายๆ รายการ จะโชว์เมื่อมีสินค้าถูกติ๊กเลือกไว้ */}
            {selectedIds.length > 0 && (
              <button onClick={handleBulkDelete} className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-200 text-sm font-medium animate-in fade-in zoom-in duration-200">
                <Trash2 size={16} /> ลบที่เลือก ({selectedIds.length})
              </button>
            )}

            <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200 text-sm font-medium">
              <Download size={16} /> Template
            </button>

            <button onClick={() => excelInputRef.current?.click()} disabled={isProcessingExcel} className={`relative overflow-hidden flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg transition-colors border border-green-200 text-sm font-medium ${isProcessingExcel ? 'cursor-not-allowed' : 'hover:bg-green-100'}`}>
              {isProcessingExcel && (
                <div className="absolute left-0 top-0 bottom-0 bg-green-200/60 transition-all duration-300 z-0" style={{ width: `${importProgress}%` }}></div>
              )}
              <div className="relative z-10 flex items-center gap-2">
                {isProcessingExcel ? <Loader2 className="animate-spin text-green-700" size={16} /> : <FileSpreadsheet size={16} />}
                {isProcessingExcel ? `กำลังนำเข้า ${importProgress}%` : 'Import Excel'}
              </div>
            </button>
            <input type="file" ref={excelInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleImportExcel} />

            <button onClick={() => { resetForm(); setIsFormOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 text-sm font-bold">
              <Plus size={18} /> เพิ่มสินค้า
            </button>
          </div>
        </div>

        {/* --- Toolbar: Search, Filter, View Toggle --- */}
        <div className="flex flex-col sm:flex-row gap-3 items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="ค้นหาชื่อสินค้า, รหัสสินค้า หรือ บาร์โค้ด..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-slate-800 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-slate-800 text-sm appearance-none cursor-pointer"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="ทั้งหมด">หมวดหมู่ทั้งหมด</option>
              {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
          </div>
          <div className="relative w-full sm:w-40 shrink-0">
            <select
              className="w-full pl-4 pr-8 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-slate-800 text-sm appearance-none cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="ล่าสุด">ล่าสุด</option>
              <option value="ราคา: ต่ำ-สูง">ราคา: ต่ำ-สูง</option>
              <option value="ราคา: สูง-ต่ำ">ราคา: สูง-ต่ำ</option>
              <option value="สต็อก: น้อย-มาก">สต็อก: น้อย-มาก</option>
              <option value="สต็อก: มาก-น้อย">สต็อก: มาก-น้อย</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
          </div>
          <div className="flex bg-white rounded-lg border border-slate-200 p-1 shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* --- Content Area --- */}
      <div className="flex-1 overflow-auto p-4">
        {isLoadingData ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Loader2 className="animate-spin mb-4 text-orange-500" size={48} />
            <p>กำลังโหลดข้อมูลสินค้าจากฐานข้อมูล...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
            <Package size={64} className="mb-4 opacity-20" />
            <p>ไม่พบสินค้าในระบบ หรือยังไม่ได้เพิ่มสินค้า</p>
          </div>
        ) : (
          <>
            {viewMode === 'table' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
                      <tr>
                        {/* 🌟 Checkbox เลือกทั้งหมด (Select All) */}
                        <th className="py-3 px-4 w-12 text-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-orange-600 cursor-pointer"
                            checked={filteredProducts.length > 0 && selectedIds.length === filteredProducts.length}
                            onChange={(e) => toggleAll(e, filteredProducts)}
                          />
                        </th>
                        <th className="py-3 px-4 w-16">รูป</th>
                        <th className="py-3 px-4">สินค้า</th>
                        <th className="py-3 px-4 text-center">หมวดหมู่</th>
                        <th className="py-3 px-4 text-right">
                          <span className="text-orange-500"></span> ราคา 1
                        </th>
                        <th className="py-3 px-4 text-right">
                          <span className="text-green-500"></span> ราคา 2
                        </th>
                        <th className="py-3 px-4 text-right">ขั้นต่ำ 2</th>
                        <th className="py-3 px-4 text-center">ชิ้น/หน่วย</th>
                        <th className="py-3 px-4 text-center">สต็อก</th>
                        <th className="py-3 px-4 text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className={`hover:bg-slate-50 transition-colors group ${selectedIds.includes(product.id) ? 'bg-orange-50/30' : ''}`}>
                          {/* 🌟 Checkbox ในแต่ละแถว */}
                          <td className="py-2 px-4 text-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 accent-orange-600 cursor-pointer"
                              checked={selectedIds.includes(product.id)}
                              onChange={() => toggleSelection(product.id)}
                            />
                          </td>
                          <td className="py-2 px-4">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative">
                              {product.image ? (
                                <img src={product.image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-full h-full p-2 text-slate-300" />
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-4">
                            <div className="font-bold text-slate-800">{product.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-0.5" title="รหัสสินค้า"><Fingerprint size={10} /> {product.id}</span>
                              {product.barcode && <span className="flex items-center gap-0.5" title="บาร์โค้ด"><ScanBarcode size={10} /> {product.barcode}</span>}
                            </div>
                          </td>
                          <td className="py-2 px-4 text-center">
                            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs">
                              {product.category}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-right font-medium text-slate-700">
                            ฿{product.retailPrice.toLocaleString()}
                          </td>
                          <td className="py-2 px-4 text-right font-medium text-orange-600">
                            {product.wholesalePrice > 0 ? `฿${product.wholesalePrice.toLocaleString()}` : '-'}
                          </td>
                          <td className="py-2 px-4 text-right font-medium text-purple-600">
                            {product.minWholesaleQty && product.minWholesaleQty > 0 ? `${product.minWholesaleQty.toLocaleString()}` : '-'}
                          </td>
                          <td className="py-2 px-4 text-center text-xs text-slate-500">
                            {product.unitQty && product.unitQty > 1 ? `${product.unitQty} ชิ้น` : '-'}
                          </td>
                          <td className="py-2 px-4 text-center">
                            <span className={`font-medium ${product.stock <= 5 ? 'text-red-500' : 'text-slate-600'}`}>
                              {product.stock.toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-400 ml-1">{product.unit}</span>
                          </td>
                          <td className="py-2 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleEdit(product)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="แก้ไข">
                                <Edit size={16} />
                              </button>
                              <button onClick={() => handleDeleteClick(product.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="ลบ">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredProducts.map((product) => {
                  const isSelected = selectedIds.includes(product.id);
                  return (
                    <div key={product.id} className={`bg-white rounded-xl shadow-sm border transition-shadow group flex flex-col h-full overflow-hidden ${isSelected ? 'border-orange-500 ring-2 ring-orange-100' : 'border-slate-200 hover:shadow-md'}`}>
                      <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden border-b border-slate-100">

                        {/* 🌟 Checkbox ในมุมมองแบบการ์ด (อยู่มุมซ้ายบน) */}
                        <div className="absolute top-2 left-2 z-20" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="w-5 h-5 accent-orange-600 cursor-pointer drop-shadow-md border-white"
                            checked={isSelected}
                            onChange={() => toggleSelection(product.id)}
                          />
                        </div>

                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400?text=No+Image'; }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                            <ImageIcon size={32} className="mb-2 opacity-50" />
                            <span className="text-xs">No Image</span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5 truncate px-1 font-mono">
                          ID: {product.id}
                        </div>
                        {product.images && product.images.length > 1 && (
                          <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1 z-10">
                            <ImageIcon size={10} /> +{product.images.length}
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium truncate">
                              {product.category}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-800 line-clamp-2 text-sm mb-1" title={product.name}>{product.name}</h3>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <div className="flex items-end justify-between">
                            <div>
                              <div className="text-sm font-bold text-orange-600">฿{product.retailPrice}</div>
                              <div className="text-[10px] text-slate-500">คงเหลือ {product.stock} {product.unit}</div>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => handleEdit(product)} className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"><Edit size={14} /></button>
                              <button onClick={() => handleDeleteClick(product.id)} className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* --- Modal Form --- */}
      {
        isFormOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-visible">
            <div className="bg-white rounded-2xl w-full max-w-7xl h-[95vh] shadow-2xl flex flex-col relative overflow-visible">
              <div className="flex justify-between items-center p-4 md:p-5 border-b border-slate-100 shrink-0">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  {isEditing ? <Edit className="text-blue-500" size={20} /> : <Plus className="text-green-500" size={20} />}
                  {isEditing ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
                </h2>
                <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-y-auto min-h-0 pl-1">
                <div className="p-4 md:p-6 space-y-4 flex-1">
                  <div className="flex flex-col lg:flex-row gap-6">

                    {/* 🖼️ ส่วนอัปโหลดรูปภาพ & ID */}
                    <div className="lg:w-72 shrink-0 flex flex-col gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">รูปภาพสินค้า <span className="text-xs text-slate-400 font-normal">(เพิ่มได้หลายรูป)</span></label>
                        <div className="grid grid-cols-2 gap-2">
                          {(formData.images || []).map((imgUrl, idx) => (
                            <div key={idx} className="aspect-square bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden group">
                              <img src={imgUrl} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                <button type="button" onClick={() => handleRemoveImage(idx)} className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600" title="ลบรูปนี้"><Trash2 size={14} /></button>
                              </div>
                              {idx === 0 && <span className="absolute top-1 left-1 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold shadow-sm">รูปหลัก</span>}
                            </div>
                          ))}

                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50/50 transition-all"
                          >
                            {uploading ? (
                              <Loader2 className="animate-spin text-orange-500 mb-1" size={24} />
                            ) : (
                              <Plus className="text-slate-400 mb-1" size={24} />
                            )}
                            <span className="text-[10px] text-slate-500 font-medium">{uploading ? 'กำลังโหลด...' : 'เพิ่มรูปภาพ'}</span>
                          </div>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">รหัสรูปภาพหลัก (ถ้ามี)</label>
                        <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition-all font-mono text-sm"
                          value={formData.imageId || ''} onChange={e => setFormData({ ...formData, imageId: e.target.value })} placeholder="เช่น IMG-001" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <Fingerprint size={14} /> รหัสสินค้า (ID)
                        </label>
                        <input
                          type="text"
                          className={`w-full border border-slate-200 rounded-lg px-3 py-2 outline-none transition-all font-mono text-sm ${isEditing ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:border-blue-400 focus:ring-4 focus:ring-blue-50'}`}
                          value={formData.id}
                          onChange={e => setFormData({ ...formData, id: e.target.value })}
                          placeholder="ปล่อยว่างเพื่อสุ่มอัตโนมัติ"
                          disabled={isEditing}
                          title={isEditing ? "ไม่สามารถแก้ไขรหัสสินค้าได้" : "กรอกรหัสสินค้า หรือปล่อยว่างเพื่อสุ่มอัตโนมัติ"}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1"><ScanBarcode size={14} /> รหัสบาร์โค้ด</label>
                        <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition-all font-mono text-sm"
                          value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} placeholder="สแกน/พิมพ์รหัส" />
                      </div>
                    </div>

                    {/* 📝 ส่วนกรอกข้อมูลสินค้า (Expanded Grid) */}
                    <div className="flex-1 flex flex-col gap-4 overflow-x-hidden pr-2">
                      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                        <div className="xl:col-span-1">
                          <label className="block text-sm font-bold text-slate-700 mb-1">หมวดหมู่ <span className="text-red-500">*</span></label>
                          <Select 
                            mode="multiple"
                            allowClear
                            size="large"
                            placeholder="เลือกหมวดหมู่ (ได้หลายอัน)"
                            className="w-full text-sm"
                            value={formData.category ? formData.category.split('/') : []} 
                            onChange={(val: string[]) => setFormData({ ...formData, category: val.join('/') })}
                            options={categories.map(cat => ({ value: cat.name, label: cat.name }))}
                          />
                        </div>
                        <div className="xl:col-span-3">
                          <label className="block text-sm font-bold text-slate-700 mb-1">ชื่อสินค้า <span className="text-red-500">*</span></label>
                          <input type="text" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all text-sm"
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="เช่น เสื้อยืดคอกลมสีขาว" />
                        </div>
                      </div>

                      {/* 💰 Section ราคา & หน่วยนับ */}
                      <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4">
                        <p className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                          <DollarSign size={16} className="text-orange-500" /> การตั้งราคาและคลังสินค้า
                        </p>

                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-x-4 gap-y-4">
                          {/* Row 1 */}
                          <div className="xl:col-span-2">
                            <label className="block text-xs font-bold text-orange-500 mb-1">
                              ⭐ ราคา 1 <span className="font-normal text-slate-400">(Highlight / ราคาปลีก)</span> <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                              <input type="number" min="0" className="w-full pl-9 pr-3 py-2.5 border border-orange-200 rounded-lg outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 text-sm bg-white font-bold"
                                value={formData.retailPrice} onChange={e => setFormData({ ...formData, retailPrice: Number(e.target.value) })} />
                            </div>
                          </div>

                          <div className="xl:col-span-2">
                            <label className="block text-xs font-bold text-green-600 mb-1">
                              🏷️ ราคา 2 <span className="font-normal text-slate-400">(Strong / ราคาส่ง)</span>
                            </label>
                            <div className="relative">
                              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400" size={14} />
                              <input type="number" min="0" className="w-full pl-9 pr-3 py-2.5 border border-green-200 rounded-lg outline-none focus:border-green-400 focus:ring-2 focus:ring-green-50 text-sm bg-white"
                                value={formData.wholesalePrice} onChange={e => setFormData({ ...formData, wholesalePrice: Number(e.target.value) })} />
                            </div>
                          </div>

                          <div className="xl:col-span-1">
                            <label className="block text-xs font-bold text-slate-600 mb-1" title="จำนวนขั้นต่ำที่จะได้ราคา 2">
                              ขั้นต่ำ ราคา 2 <span className="text-slate-400 font-normal">(จำนวน)</span>
                            </label>
                            <input type="number" min="1" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-green-400 text-sm bg-white"
                              value={formData.minWholesaleQty} onChange={e => setFormData({ ...formData, minWholesaleQty: Number(e.target.value) })} />
                          </div>

                          <div className="xl:col-span-1">
                            <label className="block text-xs font-bold text-blue-600 mb-1" title="1 หน่วย = กี่ชิ้น (ถ้าขายชิ้นใส่ 1)">
                              ชิ้น/หน่วย <span className="text-slate-400 font-normal">(pack size)</span>
                            </label>
                            <input type="number" min="1" className="w-full px-3 py-2.5 border border-blue-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-sm bg-white"
                              value={formData.unitQty ?? 1} onChange={e => setFormData({ ...formData, unitQty: Number(e.target.value) })} />
                          </div>

                          {/* Row 2 */}
                          <div className="xl:col-span-2">
                            <label className="block text-xs font-bold text-purple-600 mb-1">🎉 จำนวน(ราคา Step)</label>
                            <input type="number" min="0" className="w-full px-3 py-2.5 border border-purple-200 rounded-lg outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 text-sm bg-white"
                              value={formData.bulkQty ?? 0} onChange={e => setFormData({ ...formData, bulkQty: Number(e.target.value) })} placeholder="0 = ไม่ใช้" />
                          </div>
                          <div className="xl:col-span-2">
                            <label className="block text-xs font-bold text-purple-600 mb-1">🎉 ราคา Step (฿)</label>
                            <div className="relative">
                              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={14} />
                              <input type="number" min="0" className="w-full pl-9 pr-3 py-2.5 border border-purple-200 rounded-lg outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 text-sm bg-white"
                                value={formData.bulkPrice ?? 0} onChange={e => setFormData({ ...formData, bulkPrice: Number(e.target.value) })} />
                            </div>
                          </div>

                          <div className="xl:col-span-1">
                            <label className="block text-xs font-bold text-slate-600 mb-1">สต็อก</label>
                            <input type="number" min="0" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-slate-400 text-sm bg-white"
                              value={formData.stock} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} />
                          </div>
                          <div className="xl:col-span-1">
                            <label className="block text-xs font-bold text-slate-600 mb-1">หน่วยนับ</label>
                            <input list="unit-options" type="text" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-slate-400 text-sm bg-white"
                              value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} placeholder="ชิ้น/แพ็ค" />
                            <datalist id="unit-options">{units.map(u => <option key={u} value={u} />)}</datalist>
                          </div>
                        </div>

                        {/* Preview ราคา real-time */}
                        <div className="mt-4 bg-white border border-dashed border-slate-300 rounded-lg px-4 py-3 text-xs md:text-sm text-slate-600 flex flex-col md:flex-row md:flex-wrap gap-x-6 gap-y-2 items-start md:items-center">
                          <span className="font-bold text-slate-500 flex items-center gap-1.5"><Tag size={14} /> สรุปราคา:</span>
                          {formData.minWholesaleQty <= 1 ? (
                            <span className="text-orange-600 font-semibold bg-orange-50 px-2.5 py-1 rounded">ส่ง ฿{formData.wholesalePrice} (ทุกจำนาน)</span>
                          ) : (
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="bg-slate-100 px-2.5 py-1 rounded">1 - {formData.minWholesaleQty - 1} {formData.unit || 'ชิ้น'} = <strong className="text-slate-800">฿{formData.retailPrice}</strong></span>
                              <span className="text-slate-300 hidden md:inline">→</span>
                              <span className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded">≥ {formData.minWholesaleQty} {formData.unit || 'ชิ้น'} = <strong>฿{formData.wholesalePrice}</strong></span>
                            </div>
                          )}

                          {(formData.bulkQty ?? 0) > 0 && (formData.bulkPrice ?? 0) > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-300 hidden md:inline">→</span>
                              <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded border border-purple-100"><span className="text-xs mr-1">🎉</span>≥ {formData.bulkQty} {formData.unit || 'ชิ้น'} = <strong>฿{formData.bulkPrice}</strong></span>
                            </div>
                          )}

                          {(formData.unitQty ?? 1) > 1 && (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-300 hidden md:inline">|</span>
                              <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded border border-blue-100">1 {formData.unit || 'หน่วย'} = <strong>{formData.unitQty} ชิ้น</strong></span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* รายละเอียด */}
                      <div className="flex-1 min-h-[120px] flex flex-col">
                        <label className="block text-sm font-bold text-slate-700 mb-1">รายละเอียดเพิ่มเติม</label>
                        <textarea className="w-full flex-1 min-h-[100px] border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-50 resize-none text-sm leading-relaxed"
                          value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="ใส่รายละเอียดสินค้า หรือคุณสมบัติต่างๆ..." />
                      </div>

                    </div>

                  </div>
                </div>

                {/* Footer Buttons (Compact) */}
                <div className="p-4 md:p-5 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50 rounded-b-2xl">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors text-sm">ยกเลิก</button>
                  <button type="submit" className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 text-sm flex items-center gap-2">
                    {isEditing ? <Edit size={16} /> : <Plus size={16} />}
                    {isEditing ? 'บันทึกการแก้ไข' : 'ยืนยันเพิ่มสินค้า'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default AdminProducts;
const CLOUD_NAME = "dffqpiizc"; 
const UPLOAD_PRESET = "my_shop_preset"; 

// 🌟 เพิ่มการรับค่า category เข้ามาในฟังก์ชัน
export const uploadImageToCloudinary = async (file: File, category?: string): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  
  // 🌟 ถ้ามี category ส่งมา ให้ใช้ชื่อ category เป็นชื่อโฟลเดอร์ 
  // แต่ถ้าไม่มี (เช่น อัปโหลดแบบไม่ได้เลือกหมวดหมู่) ให้ลง 'General' หรือ 'warehouse_products'
  const folderName = category ? category : 'warehouse_products';
  formData.append('folder', folderName); 

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return data.secure_url; 
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};
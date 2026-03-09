# Class Diagram ของระบบ (System Class Diagram)

เอกสารนี้แสดงโครงสร้างออบเจ็กต์/คลาสระดับแอปพลิเคชัน (อ้างอิงจาก TypeScript Interfaces ใน `src/types.ts`) ซึ่งถูกใช้จัดการข้อมูลทั้งบริเวณ Frontend React และฐานข้อมูล

```mermaid
classDiagram
    class User {
        <<Abstract>>
        +String id
        +String name
    }

    class Admin {
        +String username
        +String password
        +Role role
        +String lineUserId
        +Date createdAt
        +login()
        +changePassword()
        +manageOrder()
    }

    class Customer {
        +String contact
        +String address
        +String lineUserId
        +String lineDisplayName
        +String linePictureUrl
        +placeOrder()
        +trackOrder()
    }

    class Product {
        +String id
        +String barcode
        +String name
        +String category
        +Number retailPrice
        +Number wholesalePrice
        +Number minWholesaleQty
        +Number unitQty
        +Number bulkQty
        +Number bulkPrice
        +Number stock
        +String unit
        +String image
        +String[] images
        +String description
        +calculatePrice(qty)
    }

    class Order {
        +String id
        +String deliveryMethod
        +Number totalAmount
        +Number refundAmount
        +Number netAmount
        +OrderStatus status
        +String trackingNumber
        +String courier
        +Date timestamp
        +String notes
        +updateStatus()
        +addTracking()
    }

    class OrderItem {
        +String productId
        +String productName
        +String productImage
        +Number quantity
        +Number price
        +Number totalPrice
    }

    class Post {
        +String id
        +String title
        +String description
        +String[] linkedProductIds
        +boolean isActive
        +Date createdAt
        +Date expiresAt
        +checkExpiry()
    }

    class Cart {
        +CartItem[] items
        +Number total
        +addItem(Product, qty)
        +removeItem(productId)
        +clearCart()
        +checkout()
    }

    class CartItem {
        +Number quantity
    }

    %% Relationships
    User <|-- Admin : "Inherits"
    User <|-- Customer : "Inherits"

    Customer "1" -- "0..*" Order : "places"
    Admin "1" -- "0..*" Order : "manages (managedBy)"
    
    Order "1" *-- "1..*" OrderItem : "contains (JSON)"
    
    Cart "1" *-- "0..*" CartItem : "contains"
    CartItem "1" o-- "1" Product : "references"
    OrderItem "1" o-- "1" Product : "snapshots"
    
    Post "0..*" o-- "0..*" Product : "links to (linkedProductIds)"
```

---

### คำอธิบายโครงสร้างคลาส (Class Descriptions)

1. **User (Abstract)**
   - คลาสแม่สำหรับออบเจ็กต์ผู้ใช้งานในระบบ ซึ่งประกอบไปด้วยแอททริบิวต์พื้นฐานอย่าง ID และ Name

2. **Admin** (สืบทอดจาก User)
   - ตัวแทนของผู้จำหน่ายหรือผู้ดูแลระบบ มี Role เป็นตัวกำหนดสิทธิ์ย่อย มีหน้าที่จัดการคำสั่งซื้อ (`manageOrder`), เปลี่ยนแปลงข้อมูลสินค้า และเข้าสู่ระบบ (`login`)

3. **Customer** (สืบทอดจาก User)
   - ตัวแทนของลูกค้า สามารถซื้อสินค้า (`placeOrder`) ติดตามสถานะพัสดุ (`trackOrder`) และมีข้อมูลเชื่อมต่อมาจาก LINE LIFF (Line Profile) เพื่อความสะดวกในการติดต่อ

4. **Product**
   - คลาสสินค้า ทำหน้าที่เก็บรายละเอียดทุกอย่าง ตั้งแต่ภาพ, สต๊อก, จนถึงกลไกราคา (ราคาปลีก, ราคาส่ง, ราคายกลัง)
   - ฟังก์ชัน `calculatePrice(qty)` รับผิดชอบในการคำนวณราคาว่าควรจะเป็นราคาปลีก หรือราคาส่งเมื่อลูกค้าหยิบใส่ตะกร้า

5. **Order & OrderItem**
   - **Order**: ตัวแทนของบิลคำสั่งซื้อ 1 ใบ เก็บยอดรวม ยอดคืนเงิน ข้อมูลการจัดส่ง และสถานะ
   - **OrderItem**: รายการสินค้าย่อยใน 1 บิล เป็นการ Snapshot ค่าต่างๆ จาก `Product` ณ ตอนนั้น (เช่น `productName`, `price`) เพื่อป้องกันการเปลี่ยนแปลงราคาในอนาคต

6. **Cart & CartItem**
   - ตะกร้าสินค้าหน้าร้าน (อยู่บน Frontend State) มีฟังก์ชันสำหรับเพิ่ม (`addItem`), ลบ (`removeItem`), รวบยอด (`checkout`) เพื่อแปลงเป็นข้อมูลบิลในตาราง `Order` ต่อไป

7. **Post**
   - คลาสตัวแทนสำหรับโพสต์ข่าวสารและโปรโมชั่น สามารถเก็บรายการสินค้าย่อยที่เกี่ยวข้อง (`linkedProductIds`) และมีลอจิกอัตโนมัติในการซ่อนประกาศเมื่อถึงเวลา `expiresAt`

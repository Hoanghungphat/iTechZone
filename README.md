# 🚀 ITechZone — Nâng tầm trải nghiệm công nghệ

Website thương mại điện tử chuyên bán **Điện thoại** và **Máy tính bảng** chính hãng.

---

## 📁 Cấu trúc dự án

```
doan/
├── client/          # React 19 + Vite + Tailwind CSS v3
│   └── src/
│       ├── components/    # UI components
│       ├── pages/         # Các trang
│       ├── store/         # Zustand state management
│       ├── services/      # API service layer
│       ├── mocks/         # Mock data (dev only)
│       ├── utils/         # Helper functions
│       ├── hooks/         # Custom React hooks
│       ├── constants/     # App constants & routes
│       └── routes/        # React Router config
│
└── server/          # Express.js REST API
    └── src/
        ├── routes/        # API routes
        ├── controllers/   # Business logic
        ├── middlewares/   # JWT auth, error handler
        └── utils/         # Response helpers
```

---

## 🏃 Chạy dự án

### Frontend (React)
```bash
cd client
npm install
npm run dev
# ➜ http://localhost:5173
```

### Backend (Express API)
```bash
cd server
npm install
cp .env.example .env
node server.js
# ➜ http://localhost:5000
```

---

## 🛠️ Tech Stack

| Layer       | Công nghệ |
|-------------|-----------|
| Frontend    | React 19, Vite 8, Tailwind CSS v3 |
| State       | Zustand + persist middleware |
| Animations  | Framer Motion |
| Icons       | Lucide React |
| Routing     | React Router v7 |
| Toasts      | React Hot Toast |
| Backend     | Express.js |
| Auth        | JWT + bcryptjs |
| HTTP Client | Axios |

---

## 📄 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/products` | Danh sách sản phẩm |
| GET | `/api/products/:slug` | Chi tiết sản phẩm |
| GET | `/api/products/search?q=` | Tìm kiếm |
| GET | `/api/products/featured` | Sản phẩm nổi bật |
| GET | `/api/products/flash-sale` | Flash Sale |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/register` | Đăng ký |
| GET | `/api/auth/me` | Thông tin user (🔒) |
| POST | `/api/orders` | Tạo đơn hàng (🔒) |
| GET | `/api/orders` | Đơn hàng của tôi (🔒) |
| GET | `/api/categories` | Danh mục |

> 🔒 = Yêu cầu Bearer Token

---

## 🎨 Thương hiệu

- **Tên:** ITechZone
- **Slogan:** Nâng tầm trải nghiệm công nghệ
- **Màu chính:** `#e51c1c` (đỏ ITechZone)
- **Font:** Plus Jakarta Sans (display), Inter (body)

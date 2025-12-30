# 🚨 ScamCheck

ScamCheck là website giúp **kiểm tra và báo cáo lừa đảo** thông qua:
- 📞 Số điện thoại
- 🔗 Đường link

Hệ thống hỗ trợ **người dùng thường** và **quản trị viên (admin)**, giao diện tối ưu cho **máy tính & điện thoại**.

---

## ✨ Chức năng chính

### 👤 Người dùng
- Đăng ký / Đăng nhập
- Quên mật khẩu (gửi link đặt lại)
- Kiểm tra:
  - Số điện thoại
  - Đường link
- Nhận kết quả bằng **popup thông báo** (dễ nhìn, không reload trang)
- Gửi báo cáo nghi ngờ lừa đảo
- Quản lý thông tin tài khoản
- Đổi mật khẩu

---

### 🛡️ Admin
- Quản lý người dùng (sửa tên, email, quyền)
- Duyệt báo cáo:
  - Chờ duyệt
  - Đã duyệt (An toàn / Lừa đảo)
- Thêm cảnh báo trực tiếp (không cần chờ duyệt)
- Danh sách cảnh báo:
  - Lọc theo loại (SĐT / Link)
  - Lọc theo trạng thái
  - Tìm kiếm
  - Phân trang
- Thống kê:
  - Tổng số điện thoại lừa đảo
  - Tổng số link lừa đảo
- Giao diện admin **full width**, tối ưu PC & mobile

---

## 🖥️ Công nghệ sử dụng

- **Backend**
  - Node.js
  - Express.js
  - MySQL
  - JWT (xác thực)
  - bcrypt (mã hóa mật khẩu)

- **Frontend**
  - HTML, CSS, JavaScript thuần
  - Google Fonts (Material Symbols)
  - Responsive (PC / Tablet / Mobile)
  - Toast popup thông báo

---

## 📂 Cấu trúc thư mục

```text
ScamCheck/
├─ server.js
├─ logger.js
├─ package.json
├─ public/
│  ├─ login.html
│  ├─ register.html
│  ├─ forgot.html
│  ├─ reset-password.html
│  ├─ select.html
│  ├─ check-phone.html
│  ├─ check-link.html
│  ├─ report.html
│  ├─ admin.html
│  ├─ account.html
│  ├─ css/
│  │  ├─ app.css
│  │  └─ responsive.css
│  └─ js/
│     ├─ api.js
│     ├─ auth-page.js
│     └─ toast.js

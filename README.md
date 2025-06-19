## 📥 Clone mã nguồn từ GitHub

```bash
git clone https://github.com/tri-0412/ticketTools.git
cd ticketTools
   ```
📦 Cài đặt thư viện phụ thuộc
   ```bash
  npm install
   ```
# hoặc
   ```bash
  yarn install
   ```
▶️ Chạy ứng dụng
   ```bash
  npm start
   ```

🧑‍💼 HƯỚNG DẪN SỬ DỤNG HỆ THỐNG DÀNH CHO ADMIN (BAN TỔ CHỨC)
1. Đăng nhập hệ thống quản trị
- Truy cập trang web quản trị (Back-office Web).

- Đăng nhập bằng tài khoản quản trị viên (admin) được cấp.

2. Quản lý sự kiện (Event Management)
- Vào mục Sự kiện / Events:

   ➕ Tạo sự kiện mới: Nhập tên, mô tả, thời gian, địa điểm, số lượng vé,...

   📝 Chỉnh sửa thông tin sự kiện bất kỳ.

   🗑️ Xóa sự kiện không còn sử dụng.

3. Quản lý khách hàng (Customer Management)
- Vào mục Khách hàng / Customers:

- Xem danh sách khách đã đăng ký, nhận vé,...

- Cập nhật hoặc xoá thông tin khách hàng nếu cần.

4. Quản lý vé (Ticket Management)
- Vào mục Vé / Tickets:

- Tạo vé mới (theo từng sự kiện).

- Gửi vé đến khách hàng (qua email hoặc thông báo trong app).

- Cập nhật trạng thái vé (đã gửi, đã sử dụng, huỷ, v.v.).

5. Quản lý nhân viên (User / Staff Management)
- Vào mục Người dùng / Users:

   ➕ Tạo tài khoản nhân viên mới.

   📝 Cập nhật hoặc xoá tài khoản nhân viên.

   👨‍💼 Phân công nhân viên cho từng sự kiện cụ thể.

- Mỗi nhân viên chỉ thấy và check-in được các sự kiện được phân công.

6. Xem thống kê & lịch sử
- Admin có thể truy cập:

   📊 Báo cáo tổng quan: số lượng khách đã check-in, số lượng vé còn lại,...

   📜 Lịch sử hoạt động: chi tiết các lượt check-in theo thời gian, nhân viên, sự kiện.

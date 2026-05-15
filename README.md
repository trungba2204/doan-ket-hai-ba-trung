# Đoàn kết Hai Bà Trưng

Ứng dụng Next.js/PWA quản lý thành viên và tiền đội bóng với giao diện responsive theo phong cách app mobile.

## Chức năng

- Nhập tên thành viên để xem ngày sinh và ảnh đại diện.
- Thêm thành viên mới với họ tên và ngày sinh.
- Tính tiền đóng đội bóng theo mức 50.000đ/trận.
- Cộng dồn nhiều lần đóng tiền cho từng người.
- Bảng trạng thái hiển thị đã đóng, chưa đủ và số tiền còn thiếu.
- Upload ảnh cầu thủ và lưu dữ liệu trên máy sau khi refresh.
- Thông báo sinh nhật trên điện thoại/trình duyệt của người đang dùng app.

## Chạy local

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`.

## Thông báo sinh nhật trên điện thoại

App dùng Web Notification của trình duyệt. Người dùng bấm `Bật thông báo trên
điện thoại` để cấp quyền. Sau đó, mỗi ngày khi mở app, nếu hôm đó là sinh nhật
của thành viên nào thì app sẽ tự hiện thông báo trên thiết bị.

Lưu ý: trên điện thoại, trình duyệt thường yêu cầu app chạy qua HTTPS. Với iPhone,
thông báo web cần mở bản deploy HTTPS, xoá icon cũ nếu đã thêm trước đó, rồi thêm
lại app vào màn hình chính để nhận manifest/service worker mới.

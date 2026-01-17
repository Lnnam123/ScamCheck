-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Máy chủ: localhost:3306
-- Thời gian đã tạo: Th1 17, 2026 lúc 09:59 AM
-- Phiên bản máy phục vụ: 8.4.3
-- Phiên bản PHP: 8.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `scamcheck`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `token_hash` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `password_resets`
--

INSERT INTO `password_resets` (`id`, `user_id`, `token_hash`, `expires_at`, `used`, `created_at`) VALUES
(10, 7, 'cd860aa84213e1aafb62f87f6a47efb8dd041559cc11b7ce588acf6e832808ac', '2025-12-30 10:06:50', 0, '2025-12-30 16:51:50'),
(11, 7, '4fb3a1c15da7dcc54880809e0ba9e2d22744eac56a68352edc12c70983cfb75e', '2025-12-30 17:09:55', 1, '2025-12-30 16:54:55'),
(12, 8, 'ca2fb7a6536c8f1e7ea044446db0dbc5b69b41ad7d82ab8c4f8cdba4a287e2e0', '2026-01-11 02:02:19', 1, '2026-01-11 01:47:19'),
(13, 6, '0ef2897a61ae0eda7c335106ca9290646a01b94ba301f6416d93df896bfe7e53', '2026-01-11 02:18:05', 1, '2026-01-11 02:03:05');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `reports`
--

CREATE TABLE `reports` (
  `id` int NOT NULL,
  `type` enum('phone','link') DEFAULT NULL,
  `value` varchar(255) DEFAULT NULL,
  `description` text,
  `status` enum('pending','safe','scam') DEFAULT 'pending',
  `user_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `scam_reports`
--

CREATE TABLE `scam_reports` (
  `id` int NOT NULL,
  `type` varchar(10) DEFAULT NULL,
  `value` varchar(255) DEFAULT NULL,
  `description` text,
  `status` varchar(20) DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `scam_reports`
--

INSERT INTO `scam_reports` (`id`, `type`, `value`, `description`, `status`, `created_at`) VALUES
(1, 'phone', '0987654321', 'Giả danh công an lừa tiền', 'scam', '2025-12-28 14:14:57'),
(2, 'phone', '0987654321', '', 'scam', '2025-12-28 14:15:59'),
(3, 'link', 'https://www.youtube.com/watch?v=JBx2UJwMHt4', '', 'scam', '2025-12-29 15:51:57'),
(4, 'phone', '0947419525', 'Campuchia', 'scam', '2025-12-30 09:01:04'),
(5, 'phone', '0927252522', 'dds', 'scam', '2025-12-30 09:04:08');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL COMMENT 'Mã người dùng',
  `fullname` varchar(255) NOT NULL,
  `username` varchar(100) NOT NULL DEFAULT '0' COMMENT 'Tên đăng nhập thường',
  `email` varchar(100) NOT NULL DEFAULT '0' COMMENT 'Email',
  `phone` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL DEFAULT '0' COMMENT 'Mật khẩu',
  `role` enum('user','admin') NOT NULL DEFAULT 'user' COMMENT 'user / admin',
  `created_at` timestamp NOT NULL DEFAULT (now()) COMMENT 'Ngày tạo',
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expire` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Phần lưu users';

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `fullname`, `username`, `email`, `phone`, `password`, `role`, `created_at`, `reset_token`, `reset_token_expire`) VALUES
(6, 'Quản trị Viên', 'admin', 'admin@scamcheck.com', NULL, '$2b$10$JaPeL8l88dUGWaTBIWkV0.lB/74nmCOJujzyezVzQuIOJft8QSMJ6', 'admin', '2025-12-29 13:20:29', NULL, NULL),
(7, 'Nhật Nam', 'nam', 'maihoang20182006@gmail.com', NULL, '$2b$10$UcSzosxuJwM31RK4BnezaeiCTpxqHOC3mrFhrJqoqsR/.3xmbQmka', 'user', '2025-12-29 13:29:44', NULL, NULL),
(8, 'Nguyễn Hữu Quân', 'nguyenhuuquan', 'nguyenhuuquan123@gmail.com', NULL, '$2b$10$DQ3Vw53pJhMUeYoJMzgfq.ZyvEKdOXM/sHNfOwW3BgMC5d2M3WSNa', 'user', '2025-12-29 17:31:01', NULL, NULL),
(9, 'Phương Giang', 'phuonggiang', 'giang123@gmail.com', NULL, '$2b$10$GJvqKZi40vNkRebmDCKacuQCxj2uSeHduUTap0udZQm8dOKT5tJ0i', 'user', '2025-12-30 15:31:20', NULL, NULL);

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `token_hash` (`token_hash`);

--
-- Chỉ mục cho bảng `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `scam_reports`
--
ALTER TABLE `scam_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_type_value` (`type`,`value`),
  ADD KEY `idx_status` (`status`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_email` (`email`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT cho bảng `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `scam_reports`
--
ALTER TABLE `scam_reports`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT COMMENT 'Mã người dùng', AUTO_INCREMENT=10;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

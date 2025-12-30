const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const cors = require("cors");
const logger = require("./logger");
const crypto = require("crypto");
let nodemailer = null;
try { nodemailer = require("nodemailer"); } catch {}

const app = express();
const PORT = 3000;
const SECRET_KEY = "scamcheck_secret_key";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "scamcheck",
});

db.connect((err) => {
  if (err) logger.error("DB_CONNECT_FAIL", { error: err.message });
  else logger.info("DB_CONNECT_SUCCESS");
});

/* =========================
   AUTH MIDDLEWARE
========================= */
function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Thiếu token" });

  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch {
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
}

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Bạn không có quyền admin" });
  }
  next();
}


/* =========================
   AUTH APIs
========================= */

// Register
app.post("/api/register", async (req, res) => {
  const { fullname, username, email, password } = req.body;
  if (!fullname || !username || !email || !password) return res.json({ message: "Thiếu thông tin" });

  try {
    const hash = await bcrypt.hash(password, 10);
    db.query(
      "INSERT INTO users (fullname, username, email, password) VALUES (?, ?, ?, ?)",
      [fullname, username, email, hash],
      (err) => {
        if (err) return res.json({ message: "Username hoặc Email đã tồn tại" });
        return res.json({ message: "Đăng ký thành công" });
      }
    );
  } catch (e) {
    logger.error("REGISTER_ERROR", { error: e.message });
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
});

// Login + log
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "";
  const userAgent = req.headers["user-agent"] || "";

  db.query("SELECT * FROM users WHERE username = ?", [username], async (err, result) => {
    if (err) {
      logger.error("LOGIN_ERROR_DB", { username, ip, userAgent, error: err.message });
      return res.status(500).json({ message: "Lỗi hệ thống" });
    }

    if (!result || result.length === 0) {
      logger.warn("LOGIN_FAIL_USERNAME", { username, ip, userAgent });
      return res.json({ message: "Sai tài khoản" });
    }

    const user = result[0];

    let match = false;
    try {
      match = await bcrypt.compare(password, user.password);
    } catch (e) {
      logger.error("LOGIN_ERROR_BCRYPT", { username, ip, userAgent, error: e.message });
      return res.status(500).json({ message: "Lỗi hệ thống" });
    }

    if (!match) {
      logger.warn("LOGIN_FAIL_PASSWORD", { username, userId: user.id, ip, userAgent });
      return res.json({ message: "Sai mật khẩu" });
    }

    const payload = { id: user.id, username: user.username, role: user.role };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "2h" });

    logger.info("LOGIN_SUCCESS", {
      userId: user.id,
      username: user.username,
      role: user.role,
      ip,
      userAgent,
    });

    return res.json({ message: "Đăng nhập thành công", user: payload, token });
  });
});

/* =========================
   ACCOUNT APIs
========================= */

// Get account
app.get("/api/account", authRequired, (req, res) => {
  db.query(
    "SELECT username, fullname, email, phone, role FROM users WHERE id=?",
    [req.user.id],
    (err, result) => {
      if (err || !result || result.length === 0) {
        return res.status(500).json({ message: "Không lấy được thông tin tài khoản" });
      }
      return res.json(result[0]);
    }
  );
});

// Update account
app.post("/api/account/update", authRequired, (req, res) => {
  const { email, phone, fullname } = req.body;

  // user thường chỉ update email/phone
  if (req.user.role !== "admin") {
    return db.query(
      "UPDATE users SET email=?, phone=? WHERE id=?",
      [email || null, phone || null, req.user.id],
      (err) => {
        if (err) return res.status(500).json({ message: "Cập nhật thất bại" });
        return res.json({ message: "Cập nhật thông tin thành công" });
      }
    );
  }

  // admin: update thêm fullname
  return db.query(
    "UPDATE users SET fullname=?, email=?, phone=? WHERE id=?",
    [fullname || null, email || null, phone || null, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ message: "Cập nhật thất bại" });
      return res.json({ message: "Cập nhật thông tin thành công" });
    }
  );
});


// Change password (Account)
app.post("/api/account/change-password", authRequired, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Thiếu dữ liệu" });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ message: "Mật khẩu mới tối thiểu 6 ký tự" });
  }

  db.query("SELECT password FROM users WHERE id=?", [req.user.id], async (err, result) => {
    if (err || !result || result.length === 0) {
      return res.status(500).json({ message: "Không tìm thấy tài khoản" });
    }

    const hash = result[0].password;
    let ok = false;

    try {
      ok = await bcrypt.compare(currentPassword, hash);
    } catch {
      return res.status(500).json({ message: "Lỗi hệ thống" });
    }

    if (!ok) return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });

    try {
      const newHash = await bcrypt.hash(newPassword, 10);
      db.query("UPDATE users SET password=? WHERE id=?", [newHash, req.user.id], (err2) => {
        if (err2) return res.status(500).json({ message: "Đổi mật khẩu thất bại" });
        return res.json({ message: "Đổi mật khẩu thành công" });
      });
    } catch {
      return res.status(500).json({ message: "Lỗi hệ thống" });
    }
  });
});

/* =========================
   REPORT / CHECK
========================= */

// Report + log
app.post("/api/report", (req, res) => {
  const { type, value, description } = req.body;

  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "";

  if (!type || !value) {
    logger.warn("REPORT_FAIL_VALIDATION", { type, value, ip });
    return res.json({ message: "Thiếu thông tin báo cáo" });
  }

  db.query(
    "INSERT INTO scam_reports (type, value, description) VALUES (?, ?, ?)",
    [type, value, description || ""],
    (err, result) => {
      if (err) {
        logger.error("REPORT_ERROR_DB", { type, value, ip, error: err.message });
        return res.status(500).json({ message: "Lỗi hệ thống" });
      }

      logger.info("REPORT_CREATED", {
        reportId: result?.insertId,
        type,
        value,
        ip,
      });

      return res.json({ message: "Đã gửi báo cáo. Chờ admin duyệt." });
    }
  );
});

// Check scam: chỉ scam nếu status='scam'
app.post("/api/check", (req, res) => {
  const { type, value } = req.body;

  db.query(
    "SELECT id FROM scam_reports WHERE type=? AND value=? AND status='scam' LIMIT 1",
    [type, value],
    (err, result) => {
      if (err) {
        logger.error("CHECK_ERROR_DB", { type, value, error: err.message });
        return res.status(500).json({ message: "Lỗi hệ thống" });
      }

      if (result.length > 0) return res.json({ result: "⚠️ CẢNH BÁO: ĐÂY LÀ LỪA ĐẢO!" });
      return res.json({ result: "✅ Hiện tại chưa có báo cáo xấu về thông tin này." });
    }
  );
});

/* =========================
   ADMIN APIs
========================= */

app.get("/api/admin/reports", authRequired, adminOnly, (req, res) => {
  db.query("SELECT * FROM scam_reports ORDER BY id DESC", (err, result) => {
    if (err) {
      logger.error("ADMIN_REPORTS_ERROR_DB", { admin: req.user?.username, error: err.message });
      return res.status(500).json({ message: "Lỗi hệ thống" });
    }
    return res.json(result);
  });
});

app.post("/api/admin/update", authRequired, adminOnly, (req, res) => {
  const { id, status } = req.body;

  const allowed = new Set(["pending", "safe", "scam"]);
  if (!id || !allowed.has(status)) return res.status(400).json({ message: "Dữ liệu không hợp lệ" });

  db.query("UPDATE scam_reports SET status=? WHERE id=?", [status, id], (err, result) => {
    if (err) return res.status(500).json({ message: "Lỗi hệ thống" });
    if (!result || result.affectedRows === 0) return res.status(404).json({ message: "Không tìm thấy báo cáo" });
    return res.json({ success: true });
  });
});

app.get("/api/admin/stats", authRequired, adminOnly, (req, res) => {
  db.query("SELECT status, COUNT(*) as total FROM scam_reports GROUP BY status", (err, result) => {
    if (err) return res.status(500).json({ message: "Lỗi hệ thống" });
    return res.json(result);
  });
});

app.post("/api/admin/scam/add", authRequired, adminOnly, (req, res) => {
  const { type, value, description } = req.body;

  const allowedType = new Set(["phone", "link"]);
  if (!allowedType.has(type) || !value) {
    return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
  }

  // Admin thêm trực tiếp => status='scam'
  db.query(
    "INSERT INTO scam_reports (type, value, description, status) VALUES (?, ?, ?, 'scam')",
    [type, value, description || ""],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Lỗi hệ thống" });
      return res.json({ message: "Đã thêm vào danh sách cảnh báo", id: result?.insertId });
    }
  );
});

app.get("/api/admin/type-counts", authRequired, adminOnly, (req, res) => {
  db.query(
    "SELECT type, COUNT(*) AS total FROM scam_reports WHERE status='scam' GROUP BY type",
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Lỗi hệ thống" });

      // đảm bảo luôn có đủ key
      const out = { phone: 0, link: 0 };
      (rows || []).forEach(r => { out[r.type] = Number(r.total) || 0; });
      res.json(out);
    }
  );
});

app.get("/api/admin/scam/list", authRequired, adminOnly, (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const pageSize = Math.min(100, Math.max(5, parseInt(req.query.pageSize || "10", 10)));

  const type = (req.query.type || "all").toLowerCase();     // all|phone|link
  const sort = (req.query.sort || "new").toLowerCase();     // new|old
  const q = String(req.query.q || "").trim();

  const where = [];
  const params = [];

  where.push("status='scam'"); // chỉ list những cái admin đã add (cảnh báo)

  if (type === "phone" || type === "link") {
    where.push("type=?");
    params.push(type);
  }

  if (q) {
    where.push("(value LIKE ? OR description LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const orderSql = sort === "old" ? "ORDER BY id ASC" : "ORDER BY id DESC";
  const offset = (page - 1) * pageSize;

  db.query(
    `SELECT COUNT(*) AS total FROM scam_reports ${whereSql}`,
    params,
    (err, countRows) => {
      if (err) return res.status(500).json({ message: "Lỗi DB" });

      const total = Number(countRows?.[0]?.total || 0);

      db.query(
        `SELECT id, type, value, description, status, created_at
         FROM scam_reports
         ${whereSql}
         ${orderSql}
         LIMIT ? OFFSET ?`,
        [...params, pageSize, offset],
        (err2, rows) => {
          if (err2) return res.status(500).json({ message: "Lỗi DB" });
          res.json({
            page,
            pageSize,
            total,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
            items: rows || [],
          });
        }
      );
    }
  );
});

// =========================
// FORGOT PASSWORD (gửi link reset)
// =========================
app.post("/api/forgot", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Vui lòng nhập email" });

  db.query("SELECT id, email, username FROM users WHERE email=?", [email], async (err, result) => {
    // Tránh lộ email có tồn tại hay không => luôn trả message giống nhau
    if (err) {
      logger.error("FORGOT_DB_ERROR", { error: err.message, email });
      return res.json({ message: "Nếu email tồn tại, hệ thống sẽ gửi link đặt lại mật khẩu." });
    }

    if (!result || result.length === 0) {
      logger.warn("FORGOT_EMAIL_NOT_FOUND", { email });
      return res.json({ message: "Nếu email tồn tại, hệ thống sẽ gửi link đặt lại mật khẩu." });
    }

    const user = result[0];

    // Token thật gửi cho user
    const token = crypto.randomBytes(32).toString("hex");
    // Hash token lưu DB (an toàn hơn)
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Hết hạn sau 15 phút
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    const expiresSql = expires.toISOString().slice(0, 19).replace("T", " ");

    db.query(
      "INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
      [user.id, tokenHash, expiresSql],
      async (err2) => {
        if (err2) {
          logger.error("FORGOT_INSERT_ERROR", { error: err2.message, userId: user.id, email });
          return res.json({ message: "Nếu email tồn tại, hệ thống sẽ gửi link đặt lại mật khẩu." });
        }

        const resetLink = `http://localhost:${PORT}/reset-password.html?token=${token}`;

        // Nếu có nodemailer + cấu hình SMTP => gửi email thật
        // Nếu không => log link để test
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        if (nodemailer && smtpUser && smtpPass) {
          try {
            const transporter = nodemailer.createTransport({
              service: "gmail",
              auth: { user: smtpUser, pass: smtpPass },
            });

            await transporter.sendMail({
              from: smtpUser,
              to: user.email,
              subject: "ScamCheck - Đặt lại mật khẩu",
              html: `
                <p>Xin chào ${user.username},</p>
                <p>Bạn vừa yêu cầu đặt lại mật khẩu. Bấm link bên dưới (hết hạn sau 15 phút):</p>
                <p><a href="${resetLink}">${resetLink}</a></p>
                <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
              `,
            });

            logger.info("FORGOT_EMAIL_SENT", { userId: user.id, email: user.email });
          } catch (e) {
            logger.error("FORGOT_EMAIL_SEND_FAIL", { error: e.message, userId: user.id, email: user.email });
            logger.info("FORGOT_RESET_LINK", { resetLink }); // fallback
          }
        } else {
          // Không có SMTP => in link để test
          logger.info("FORGOT_RESET_LINK", { resetLink });
          console.log("🔐 RESET LINK:", resetLink);
        }

        return res.json({ message: "Nếu email tồn tại, hệ thống sẽ gửi link đặt lại mật khẩu." });
      }
    );
  });
});


// =========================
// RESET PASSWORD (đổi mật khẩu bằng token)
// =========================
app.post("/api/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ message: "Thiếu dữ liệu" });
  if (String(newPassword).length < 6) return res.status(400).json({ message: "Mật khẩu tối thiểu 6 ký tự" });

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  db.query(
    "SELECT * FROM password_resets WHERE token_hash=? AND used=0 AND expires_at > NOW() ORDER BY id DESC LIMIT 1",
    [tokenHash],
    async (err, rows) => {
      if (err) {
        logger.error("RESET_DB_ERROR", { error: err.message });
        return res.status(500).json({ message: "Lỗi hệ thống" });
      }
      if (!rows || rows.length === 0) {
        return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
      }

      const pr = rows[0];

      try {
        const newHash = await bcrypt.hash(newPassword, 10);

        db.query("UPDATE users SET password=? WHERE id=?", [newHash, pr.user_id], (err2) => {
          if (err2) {
            logger.error("RESET_UPDATE_USER_FAIL", { error: err2.message, userId: pr.user_id });
            return res.status(500).json({ message: "Đổi mật khẩu thất bại" });
          }

          db.query("UPDATE password_resets SET used=1 WHERE id=?", [pr.id], (err3) => {
            if (err3) logger.error("RESET_MARK_USED_FAIL", { error: err3.message, resetId: pr.id });

            logger.info("RESET_PASSWORD_SUCCESS", { userId: pr.user_id, resetId: pr.id });
            return res.json({ message: "Đổi mật khẩu thành công. Bạn có thể đăng nhập lại." });
          });
        });
      } catch (e) {
        logger.error("RESET_HASH_FAIL", { error: e.message });
        return res.status(500).json({ message: "Lỗi hệ thống" });
      }
    }
  );
});

app.get("/api/admin/users", authRequired, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Không có quyền" });
  }

  db.query(
    "SELECT id, username, fullname, email, phone, role FROM users ORDER BY id DESC",
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Lỗi DB" });
      res.json(rows);
    }
  );
});

app.post("/api/admin/user/update", authRequired, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Không có quyền" });
  }

  const { id, fullname, email, phone, role } = req.body;
  if (!id) return res.status(400).json({ message: "Thiếu ID user" });

  db.query(
    "UPDATE users SET fullname=?, email=?, phone=?, role=? WHERE id=?",
    [fullname || null, email || null, phone || null, role || "user", id],
    (err) => {
      if (err) return res.status(500).json({ message: "Cập nhật thất bại" });
      res.json({ message: "Cập nhật user thành công" });
    }
  );
});

app.delete("/api/admin/scam/:id", authRequired, adminOnly, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ message: "ID không hợp lệ" });

  db.query("DELETE FROM scam_reports WHERE id=?", [id], (err) => {
    if (err) return res.status(500).json({ message: "Xoá thất bại" });
    res.json({ message: "Đã xoá" });
  });
});

/* =========================
   ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  logger.error("SERVER_ERROR", { path: req.originalUrl, error: err?.message || String(err) });
  return res.status(500).json({ message: "Lỗi hệ thống" });
});

app.listen(PORT, () => {
  logger.info("SERVER_STARTED", { port: PORT });
  console.log(`Server chạy: http://localhost:${PORT}/login.html`);
});

const fs = require("fs");
const path = require("path");

// Thư mục lưu log
const logDir = path.join(__dirname, "logs");

// Tạo folder logs nếu chưa có
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// File log theo ngày: logs/YYYY-MM-DD.log
function getLogFilePath() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return path.join(logDir, `${yyyy}-${mm}-${dd}.log`);
}

// Ghi log vào file
function write(level, message, meta = {}) {
  const time = new Date().toISOString();
  const metaText =
    meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  const line = `[${time}] [${level}] ${message}${metaText}\n`;

  try {
    fs.appendFileSync(getLogFilePath(), line, "utf8");
  } catch (e) {
    // nếu ghi file lỗi thì fallback ra console
    console.error("LOGGER_WRITE_FAIL:", e.message);
    console.error(line);
  }
}

module.exports = {
  info: (message, meta) => write("INFO", message, meta),
  warn: (message, meta) => write("WARN", message, meta),
  error: (message, meta) => write("ERROR", message, meta),
};

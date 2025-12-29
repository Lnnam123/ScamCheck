const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "scamcheck"
});

db.connect(err => {
  if (err) console.log("❌ Lỗi DB", err);
  else console.log("✅ Kết nối MySQL thành công");
});

module.exports = db;

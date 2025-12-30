import { apiFetch } from "./api.js";

const notice = document.getElementById("rpNotice");
const form = document.getElementById("resetForm");

function setNotice(type, msg) {
  notice.style.display = msg ? "block" : "none";
  notice.className = "notice " + (type || "");
  notice.textContent = msg || "";
}

function getTokenFromUrl() {
  const u = new URL(window.location.href);
  return u.searchParams.get("token") || "";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const token = getTokenFromUrl();
  const newPassword = document.getElementById("newPassword").value;

  if (!token) {
    setNotice("err", "Thiếu token. Hãy mở đúng link reset trong email.");
    return;
  }

  try {
    setNotice("", "Đang đổi mật khẩu...");
    const data = await apiFetch("/api/reset-password", { method: "POST", auth: false, body: { token, newPassword } });
    setNotice("ok", data.message || "Đổi mật khẩu thành công. Bạn có thể đăng nhập lại.");
  } catch (err) {
    setNotice("err", err.message || "Đổi mật khẩu thất bại");
  }
});

// ScamCheck - reset password client

const token = new URLSearchParams(window.location.search).get("token") || "";

const resetForm = document.getElementById("resetForm");
const passwordEl = document.getElementById("password");
const msgEl = document.getElementById("msg");

if (!token) {
  if (msgEl) {
    msgEl.style.color = "#dc2626";
    msgEl.innerText = "Link đặt lại mật khẩu không hợp lệ (thiếu token).";
  }
}

resetForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!msgEl || !passwordEl) return;

  msgEl.style.color = "#64748b";
  msgEl.innerText = "Đang xử lý...";

  const newPassword = String(passwordEl.value || "");
  if (newPassword.length < 6) {
    msgEl.style.color = "#dc2626";
    msgEl.innerText = "Mật khẩu tối thiểu 6 ký tự";
    return;
  }
  if (!token) {
    msgEl.style.color = "#dc2626";
    msgEl.innerText = "Token không hợp lệ";
    return;
  }

  try {
    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    const data = await res.json().catch(() => ({}));

    const ok = String(data?.message || "").toLowerCase().includes("thành công");
    msgEl.style.color = ok ? "#10b981" : "#dc2626";
    msgEl.innerText = data?.message || "Có lỗi xảy ra";

    if (ok) {
      passwordEl.value = "";
      setTimeout(() => (window.location.href = "login.html"), 900);
    }
  } catch {
    msgEl.style.color = "#dc2626";
    msgEl.innerText = "Không thể kết nối server";
  }
});

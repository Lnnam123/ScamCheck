import { setAuth, clearAuth } from "./api.js";

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const forgotForm = document.getElementById("forgotForm");
const formTitle = document.getElementById("formTitle");
const noticeEl = document.getElementById("authNotice");

const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const tabForgot = document.getElementById("tabForgot");

function setNotice(type, msg) {
  noticeEl.style.display = msg ? "block" : "none";
  noticeEl.className = "notice " + (type || "");
  noticeEl.textContent = msg || "";
}

function setTab(active) {
  [tabLogin, tabRegister, tabForgot].forEach(t => t.classList.remove("active"));
  if (active === "login") tabLogin.classList.add("active");
  if (active === "register") tabRegister.classList.add("active");
  if (active === "forgot") tabForgot.classList.add("active");
}

function setForm(showEl, titleText, tabName) {
  formTitle.innerText = titleText;
  setNotice("", "");

  [loginForm, registerForm, forgotForm].forEach(f => {
    f.classList.remove("form-shown");
    f.classList.add("form-hidden");
  });

  showEl.classList.remove("form-hidden");
  showEl.classList.add("form-shown");
  setTab(tabName);
}

// init
clearAuth();

// tabs
tabLogin.addEventListener("click", () => setForm(loginForm, "Đăng nhập", "login"));
tabRegister.addEventListener("click", () => setForm(registerForm, "Tạo tài khoản", "register"));
tabForgot.addEventListener("click", () => setForm(forgotForm, "Quên mật khẩu", "forgot"));

// links
document.getElementById("goForgot").addEventListener("click", (e) => { e.preventDefault(); tabForgot.click(); });
document.getElementById("goRegister").addEventListener("click", (e) => { e.preventDefault(); tabRegister.click(); });
document.getElementById("goLogin1").addEventListener("click", (e) => { e.preventDefault(); tabLogin.click(); });
document.getElementById("goLogin2").addEventListener("click", (e) => { e.preventDefault(); tabLogin.click(); });

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

// LOGIN (không reload trang)
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  setNotice("", "Đang kiểm tra...");

  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    const { ok, data } = await postJSON("/api/login", { username, password });

    // Server bạn trả 200 cả khi sai. Thành công khi có token.
    if (!ok || !data?.token) {
      const msg = data?.message || "Đăng nhập không thành công";
      setNotice("err", msg);
      return; // ✅ ở lại trang login, không reload
    }

    setAuth(data.token, data.user);
    setNotice("ok", "Đăng nhập thành công!");
    window.location.href = "./select.html";
  } catch (err) {
    setNotice("err", err.message || "Có lỗi, vui lòng thử lại.");
  }
});

// REGISTER
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  setNotice("", "Đang tạo tài khoản...");

  const fullname = document.getElementById("regFullname").value.trim();
  const username = document.getElementById("regUsername").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;

  try {
    const { ok, data } = await postJSON("/api/register", { fullname, username, email, password });

    // server thường trả 200 + message
    const msg = data?.message || (ok ? "Tạo tài khoản thành công" : "Tạo tài khoản thất bại");

    // nếu “Thiếu thông tin” hay trùng user/email thì coi là lỗi
    if (!ok || /thiếu|tồn tại/i.test(msg)) {
      setNotice("err", msg);
      return;
    }

    setNotice("ok", msg + " — Bạn có thể đăng nhập ngay.");
    tabLogin.click();
  } catch (err) {
    setNotice("err", err.message || "Có lỗi, vui lòng thử lại.");
  }
});

// FORGOT
forgotForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  setNotice("", "Đang gửi yêu cầu...");

  const email = document.getElementById("forgotEmail").value.trim();

  try {
    const { data } = await postJSON("/api/forgot", { email });
    setNotice("ok", data?.message || "Nếu email tồn tại, hệ thống sẽ gửi hướng dẫn đặt lại mật khẩu.");
  } catch (err) {
    setNotice("err", err.message || "Có lỗi, vui lòng thử lại.");
  }
});

// ===== Eye toggle for password fields =====
document.querySelectorAll("[data-eye]").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const id = btn.getAttribute("data-eye");
    const input = document.getElementById(id);
    const icon = btn.querySelector(".material-symbols-outlined");
    if (!input) return;

    const isPw = input.type === "password";
    input.type = isPw ? "text" : "password";
    if (icon) icon.textContent = isPw ? "visibility_off" : "visibility";
  });
});

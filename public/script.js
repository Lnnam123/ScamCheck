/*
  ScamCheck - Client Auth (clean)
  - login.html: login + forgot (switch view via hash #forgot)
  - register.html: standalone register
  - reset-password.html: reset with token
*/

const $ = (id) => document.getElementById(id);

function isEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(str || "").trim());
}

async function postJSON(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

function toast(message) {
  const el = $("toast");
  if (!el) return alert(message);
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2600);
}

function setLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = !!loading;
  btn.classList.toggle("loading", !!loading);
}

function setErr(inputId, msgId, message) {
  const inp = $(inputId);
  const msg = $(msgId);
  if (inp) inp.classList.toggle("error", !!message);
  if (msg) msg.textContent = message || "";
}

function getToken() {
  return localStorage.getItem("token") || "";
}

function saveAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user || {}));
}

/* =======================
   PASSWORD TOGGLES
======================= */
function wireToggle(toggleId, inputId) {
  const t = $(toggleId);
  const i = $(inputId);
  if (!t || !i) return;

  t.addEventListener("click", () => {
    const show = i.type === "password";
    i.type = show ? "text" : "password";
    t.classList.toggle("show-password", show);
  });
}

wireToggle("passwordToggle", "password");
wireToggle("regPasswordToggle", "regPassword");
wireToggle("resetPasswordToggle", "newPassword");

/* =======================
   LOGIN PAGE: login + forgot
======================= */
(function setupLoginPage() {
  const views = $("views");
  const loginForm = $("loginForm");
  const forgotForm = $("forgotForm");
  const titleEl = $("formTitle");
  if (!views || (!loginForm && !forgotForm)) return;

  function activate(viewName) {
    const all = views.querySelectorAll(".view");
    all.forEach((v) => v.classList.remove("is-active"));
    const el = views.querySelector(`[data-view="${viewName}"]`);
    if (el) el.classList.add("is-active");

    if (titleEl) {
      titleEl.textContent = viewName === "forgot" ? "Quên mật khẩu" : "Đăng nhập";
    }
  }

  // initial by hash
  if (location.hash === "#forgot") activate("forgot");
  else activate("login");

  // link & back button
  const forgotLink = $("forgotLink");
  const backBtn = $("backToLoginBtn");

  if (forgotLink) {
    forgotLink.addEventListener("click", (e) => {
      e.preventDefault();
      history.replaceState(null, "", "#forgot");
      activate("forgot");
    });
  }

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      history.replaceState(null, "", " ");
      activate("login");
    });
  }

  // LOGIN submit
  if (loginForm) {
    const btn = $("submitBtn");

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = ($("username")?.value || "").trim();
      const password = $("password")?.value || "";

      setErr("username", "usernameError", "");
      setErr("password", "passwordError", "");

      let ok = true;
      if (!username) {
        setErr("username", "usernameError", "Vui lòng nhập tên đăng nhập");
        ok = false;
      }
      if (!password) {
        setErr("password", "passwordError", "Vui lòng nhập mật khẩu");
        ok = false;
      }
      if (!ok) return;

      setLoading(btn, true);
      try {
        const { data } = await postJSON("/api/login", { username, password });

        if (data?.token) {
          saveAuth(data.token, data.user);

          // admin -> admin.html, user -> select.html
          const role = data?.user?.role;
          window.location.href = role === "admin" ? "admin.html" : "select.html";
          return;
        }

        toast(data?.message || "Đăng nhập thất bại");
      } catch {
        toast("Không thể kết nối server");
      } finally {
        setLoading(btn, false);
      }
    });
  }

  // FORGOT submit
  if (forgotForm) {
    const btn = $("forgotSubmitBtn");

    forgotForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = ($("forgotEmail")?.value || "").trim();
      setErr("forgotEmail", "forgotEmailError", "");

      if (!email || !isEmail(email)) {
        setErr("forgotEmail", "forgotEmailError", "Email không hợp lệ");
        return;
      }

      setLoading(btn, true);
      try {
        const { data } = await postJSON("/api/forgot", { email });
        toast(data?.message || "Đã gửi yêu cầu");
      } catch {
        toast("Không thể kết nối server");
      } finally {
        setLoading(btn, false);
      }
    });
  }
})();

/* =======================
   REGISTER PAGE
======================= */
(function setupRegisterPage() {
  const form = $("registerForm");
  if (!form) return;

  const btn = $("regSubmitBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullname = ($("regFullname")?.value || "").trim();
    const username = ($("regUsername")?.value || "").trim();
    const email = ($("regEmail")?.value || "").trim();
    const password = $("regPassword")?.value || "";
    const confirm = $("regConfirm")?.value || "";

    setErr("regFullname", "regFullnameError", "");
    setErr("regUsername", "regUsernameError", "");
    setErr("regEmail", "regEmailError", "");
    setErr("regPassword", "regPasswordError", "");
    setErr("regConfirm", "regConfirmError", "");

    let ok = true;
    if (!fullname) {
      setErr("regFullname", "regFullnameError", "Vui lòng nhập họ và tên");
      ok = false;
    }
    if (!username) {
      setErr("regUsername", "regUsernameError", "Vui lòng nhập tên đăng nhập");
      ok = false;
    }
    if (!email || !isEmail(email)) {
      setErr("regEmail", "regEmailError", "Email không hợp lệ");
      ok = false;
    }
    if (!password || String(password).length < 6) {
      setErr("regPassword", "regPasswordError", "Mật khẩu tối thiểu 6 ký tự");
      ok = false;
    }
    if (confirm !== password) {
      setErr("regConfirm", "regConfirmError", "Mật khẩu nhập lại không khớp");
      ok = false;
    }
    if (!ok) return;

    setLoading(btn, true);
    try {
      const { data } = await postJSON("/api/register", { fullnameusername, email, password });

      const msg = data?.message || "Xong";
      toast(msg);

      if (String(msg).toLowerCase().includes("thành công")) {
        // đưa về login
        setTimeout(() => (window.location.href = "login.html"), 350);
      }
    } catch {
      toast("Không thể kết nối server");
    } finally {
      setLoading(btn, false);
    }
  });
})();

/* =======================
   RESET PASSWORD PAGE
======================= */
(function setupResetPage() {
  const form = $("resetForm");
  if (!form) return;

  const btn = $("resetSubmitBtn");
  const tokenFromUrl = new URLSearchParams(location.search).get("token");
  if (tokenFromUrl && $("token")) $("token").value = tokenFromUrl;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = ($("token")?.value || "").trim();
    const newPassword = $("newPassword")?.value || "";
    const confirm = $("confirmPassword")?.value || "";

    setErr("token", "tokenError", "");
    setErr("newPassword", "newPasswordError", "");
    setErr("confirmPassword", "confirmPasswordError", "");

    let ok = true;
    if (!token) {
      setErr("token", "tokenError", "Vui lòng nhập token");
      ok = false;
    }
    if (!newPassword || String(newPassword).length < 6) {
      setErr("newPassword", "newPasswordError", "Mật khẩu tối thiểu 6 ký tự");
      ok = false;
    }
    if (confirm !== newPassword) {
      setErr("confirmPassword", "confirmPasswordError", "Mật khẩu nhập lại không khớp");
      ok = false;
    }
    if (!ok) return;

    setLoading(btn, true);
    try {
      const { data } = await postJSON("/api/reset-password", { token, newPassword });
      toast(data?.message || "Xong");

      if (String(data?.message || "").toLowerCase().includes("thành công")) {
        setTimeout(() => (window.location.href = "login.html"), 400);
      }
    } catch {
      toast("Không thể kết nối server");
    } finally {
      setLoading(btn, false);
    }
  });
})();

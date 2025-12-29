/*
  ScamCheck - Auth client
  - Login page: login + forgot views (animated)
  - Register page: standalone
*/

// ================= Helpers =================
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

function setFieldError(fieldEl, errorEl, message) {
  if (!fieldEl || !errorEl) return;
  if (message) {
    fieldEl.classList.add("error");
    errorEl.textContent = message;
    errorEl.classList.add("show");
  } else {
    fieldEl.classList.remove("error");
    errorEl.textContent = "";
    errorEl.classList.remove("show");
  }
}

function toast(message) {
  const el = $("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  window.clearTimeout(toast._t);
  toast._t = window.setTimeout(() => el.classList.remove("show"), 2600);
}

function setLoading(btn, isLoading) {
  if (!btn) return;
  btn.disabled = isLoading;
  btn.classList.toggle("loading", isLoading);
}

// ================= Password toggles =================
(function setupPasswordToggles() {
  const pairs = [
    { toggle: "passwordToggle", input: "password" },
    { toggle: "regPasswordToggle", input: "regPassword" },
  ];

  pairs.forEach(({ toggle, input }) => {
    const t = $(toggle);
    const i = $(input);
    if (!t || !i) return;
    t.addEventListener("click", () => {
      const show = i.type === "password";
      i.type = show ? "text" : "password";
      t.classList.toggle("show-password", show);
    });
  });
})();

// ================= Login page (login + forgot views) =================
(function setupLoginPage() {
  const loginForm = $("loginForm");
  const forgotForm = $("forgotForm");
  const viewsEl = $("views");
  if (!viewsEl || (!loginForm && !forgotForm)) return;

  const titleEl = $("formTitle");
  const forgotLink = $("forgotLink");
  const backBtn = $("backToLoginBtn");

  function showView(name, pushHash = true) {
    const current = viewsEl.querySelector(".view.is-active");
    const next = viewsEl.querySelector(`.view[data-view="${name}"]`);
    if (!next) return;

    if (current && current !== next) {
      current.classList.add("is-leaving");
      current.classList.remove("is-active");
      window.setTimeout(() => current.classList.remove("is-leaving"), 380);
    }

    next.classList.add("is-active");
    next.classList.remove("is-leaving");

    if (titleEl) titleEl.textContent = name === "forgot" ? "Quên mật khẩu" : "Đăng nhập";
    if (pushHash) {
      if (name === "forgot") {
        if (location.hash !== "#forgot") location.hash = "forgot";
      } else {
        // remove hash without jumping
        if (location.hash) history.replaceState(null, "", window.location.pathname);
      }
    }
  }

  function syncFromHash() {
    showView(location.hash === "#forgot" ? "forgot" : "login", false);
  }

  window.addEventListener("hashchange", syncFromHash);
  syncFromHash();

  if (forgotLink) forgotLink.addEventListener("click", (e) => {
    e.preventDefault();
    showView("forgot");
  });
  if (backBtn) backBtn.addEventListener("click", () => showView("login"));

  // ----- LOGIN submit -----
  if (loginForm) {
    const usernameEl = $("username");
    const passwordEl = $("password");
    const submitBtn = $("submitBtn");

    const usernameField = $("usernameField") || usernameEl?.closest(".field");
    const passwordField = $("passwordField") || passwordEl?.closest(".field");

    const usernameError = $("usernameError");
    const passwordError = $("passwordError");

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = String(usernameEl?.value || "").trim();
      const password = String(passwordEl?.value || "");

      setFieldError(usernameField, usernameError, "");
      setFieldError(passwordField, passwordError, "");

      let ok = true;
      if (!username) {
        setFieldError(usernameField, usernameError, "Vui lòng nhập tên đăng nhập");
        ok = false;
      }
      if (!password) {
        setFieldError(passwordField, passwordError, "Vui lòng nhập mật khẩu");
        ok = false;
      }
      if (!ok) return;

      setLoading(submitBtn, true);
      try {
        const { data } = await postJSON("/api/login", { username, password });

        if (data?.token && data?.user) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));

          toast("Đăng nhập thành công. Đang chuyển trang...");
          const next = data.user.role === "admin" ? "admin.html" : "select.html";
          setTimeout(() => (window.location.href = next), 650);
        } else {
          const msg = data?.message || "Đăng nhập thất bại";
          setFieldError(usernameField, usernameError, msg);
          setFieldError(passwordField, passwordError, msg);
        }
      } catch {
        setFieldError(passwordField, passwordError, "Không thể kết nối server");
      } finally {
        setLoading(submitBtn, false);
      }
    });
  }

  // ----- FORGOT submit -----
  if (forgotForm) {
    const emailEl = $("forgotEmail");
    const submitBtn = $("forgotSubmitBtn");
    const emailField = $("forgotEmailField") || emailEl?.closest(".field");
    const emailError = $("forgotEmailError");

    forgotForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = String(emailEl?.value || "").trim();
      setFieldError(emailField, emailError, "");

      if (!email) {
        setFieldError(emailField, emailError, "Vui lòng nhập email");
        return;
      }
      if (!isEmail(email)) {
        setFieldError(emailField, emailError, "Email không hợp lệ");
        return;
      }

      setLoading(submitBtn, true);
      try {
        const { data } = await postJSON("/api/forgot", { email });
        toast(data?.message || "Nếu email tồn tại, hệ thống sẽ gửi link đặt lại mật khẩu.");
      } catch {
        toast("Không thể kết nối server");
      } finally {
        setLoading(submitBtn, false);
      }
    });
  }
})();

// ================= Register page =================
(function setupRegisterPage() {
  const form = $("registerForm");
  if (!form) return;

  const usernameEl = $("regUsername");
  const emailEl = $("regEmail");
  const passwordEl = $("regPassword");
  const confirmEl = $("regConfirm");
  const submitBtn = $("regSubmitBtn");

  const usernameField = $("regUsernameField") || usernameEl?.closest(".field");
  const emailField = $("regEmailField") || emailEl?.closest(".field");
  const passwordField = $("regPasswordField") || passwordEl?.closest(".field");
  const confirmField = $("regConfirmField") || confirmEl?.closest(".field");

  const usernameError = $("regUsernameError");
  const emailError = $("regEmailError");
  const passwordError = $("regPasswordError");
  const confirmError = $("regConfirmError");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = String(usernameEl?.value || "").trim();
    const email = String(emailEl?.value || "").trim();
    const password = String(passwordEl?.value || "");
    const confirm = String(confirmEl?.value || "");

    setFieldError(usernameField, usernameError, "");
    setFieldError(emailField, emailError, "");
    setFieldError(passwordField, passwordError, "");
    setFieldError(confirmField, confirmError, "");

    let ok = true;
    if (!username) {
      setFieldError(usernameField, usernameError, "Vui lòng nhập tên đăng nhập");
      ok = false;
    }
    if (!email) {
      setFieldError(emailField, emailError, "Vui lòng nhập email");
      ok = false;
    } else if (!isEmail(email)) {
      setFieldError(emailField, emailError, "Email không hợp lệ");
      ok = false;
    }
    if (!password) {
      setFieldError(passwordField, passwordError, "Vui lòng nhập mật khẩu");
      ok = false;
    } else if (password.length < 6) {
      setFieldError(passwordField, passwordError, "Mật khẩu tối thiểu 6 ký tự");
      ok = false;
    }
    if (confirm !== password) {
      setFieldError(confirmField, confirmError, "Mật khẩu nhập lại không khớp");
      ok = false;
    }
    if (!ok) return;

    setLoading(submitBtn, true);
    try {
      const { data } = await postJSON("/api/register", { username, email, password });
      const msg = data?.message || "Có lỗi xảy ra";

      if (String(msg).toLowerCase().includes("thành công")) {
        toast("Đăng ký thành công! Vui lòng đăng nhập.");
        setTimeout(() => (window.location.href = "login.html"), 650);
      } else {
        // thường là trùng username/email
        setFieldError(usernameField, usernameError, msg);
        setFieldError(emailField, emailError, msg);
      }
    } catch {
      toast("Không thể kết nối server");
    } finally {
      setLoading(submitBtn, false);
    }
  });
})();

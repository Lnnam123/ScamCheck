export function mountPopup() {
  if (document.getElementById("popupBackdrop")) return;

  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.id = "popupBackdrop";

  backdrop.innerHTML = `
    <div class="modal" id="popupBox" role="dialog" aria-modal="true">
      <div class="modal-head">
        <div class="modal-title" id="popupTitle">Thông báo</div>
        <button class="modal-close" id="popupClose" type="button">✕</button>
      </div>
      <div class="modal-body">
        <p class="modal-msg" id="popupMsg"></p>
      </div>
      <div class="modal-foot">
        <button class="btn" id="popupOk" type="button">Đã hiểu</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  const close = () => hidePopup();
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });
  document.getElementById("popupClose").addEventListener("click", close);
  document.getElementById("popupOk").addEventListener("click", close);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

export function showPopup({ type = "ok", title = "Thông báo", message = "" } = {}) {
  mountPopup();

  const backdrop = document.getElementById("popupBackdrop");
  const box = document.getElementById("popupBox");
  const t = document.getElementById("popupTitle");
  const m = document.getElementById("popupMsg");

  box.classList.remove("ok", "warn", "err");
  box.classList.add(type);

  t.textContent = title;
  m.textContent = message;

  backdrop.style.display = "flex";
}

export function hidePopup() {
  const backdrop = document.getElementById("popupBackdrop");
  if (backdrop) backdrop.style.display = "none";
}

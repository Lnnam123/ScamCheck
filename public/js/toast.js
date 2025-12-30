let timer = null;

function mountToast(){
  if (document.getElementById("toastWrap")) return;

  const wrap = document.createElement("div");
  wrap.className = "toast-wrap";
  wrap.id = "toastWrap";
  wrap.innerHTML = `
    <div class="toast" id="toastBox" role="status" aria-live="polite">
      <p class="msg" id="toastMsg"></p>
      <div class="right">
        <button class="xbtn" id="toastClose" type="button" aria-label="Đóng">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  document.getElementById("toastClose").addEventListener("click", hideToast);
}

export function showToast({ type="ok", message="", duration=3500 } = {}){
  mountToast();

  const box = document.getElementById("toastBox");
  const msg = document.getElementById("toastMsg");

  box.classList.remove("ok","warn","err");
  box.classList.add(type);
  msg.textContent = message;

  box.style.display = "flex";

  if (timer) clearTimeout(timer);
  timer = setTimeout(() => hideToast(), duration);
}

export function hideToast(){
  const box = document.getElementById("toastBox");
  if (!box) return;
  box.style.display = "none";
  if (timer) { clearTimeout(timer); timer = null; }
}

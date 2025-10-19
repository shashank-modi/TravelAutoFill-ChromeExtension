(function(){
  let host, root, box, list, currentIndex = -1, currentAnchor = null, onPickCb = null;

  function ensureOverlay(){
    if (host) return;
    host = document.createElement("div");
    host.style.position = "fixed";
    host.style.zIndex = "2147483647"; 
    host.style.left = "0px"; host.style.top = "0px"; host.style.width = "0"; host.style.height = "0";
    host.style.pointerEvents = "none"; 
    document.documentElement.appendChild(host);

    root = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
      .box {
        position: absolute;
        min-width: 240px;
        max-width: 360px;
        max-height: 240px;
        overflow-y: auto;
        background: rgba(255,255,255,0.96);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(70, 90, 255, 0.16);
        border-radius: 14px;
        box-shadow: 0 18px 34px rgba(25, 38, 92, 0.18);
        font: 13px/1.45 "Inter", system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        pointer-events: auto;
      }
      .item {
        padding: 10px 14px;
        cursor: pointer;
        display: grid;
        grid-template-columns: 18px 1fr;
        gap: 10px;
        align-items: center;
        transition: background 0.15s ease, transform 0.12s ease;
      }
      .item:not(:last-child) {
        border-bottom: 1px solid rgba(40, 56, 120, 0.08);
      }
      .item[data-active="true"] {
        background: linear-gradient(135deg, rgba(74, 101, 255, 0.14), rgba(74, 101, 255, 0.06));
        transform: translateY(-1px);
      }
      .kbd {
        font-size: 11px;
        color: #5160a6;
        background: rgba(69,95,255,0.14);
        border-radius: 999px;
        padding: 2px 6px;
        justify-self: start;
      }
      .title {
        font-weight: 600;
        color: #233057;
      }
      .muted {
        color: #6a7597;
        font-size: 12px;
      }
    `;
    box = document.createElement("div");
    box.className = "box";
    list = document.createElement("div");
    box.appendChild(list);
    root.appendChild(style);
    root.appendChild(box);

    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition, true);
    document.addEventListener("click", (e) => {
      if (!root) return;
      const path = e.composedPath();
      if (path.includes(box)) return;
      if (currentAnchor && path.includes(currentAnchor)) return;
      hide();
    }, true);
  }

  function buildItems(items){
    list.innerHTML = "";
    items.forEach((it, i) => {
      const div = document.createElement("div");
      div.className = "item";
      div.setAttribute("role", "option");
      div.dataset.index = i;
      div.innerHTML = `
        <span class="kbd">↵</span>
        <div>
          <div class="title">${escapeHtml(it.title || "Fill from profile")}</div>
          <div class="muted">${escapeHtml(it.subtitle || it.value || "")}</div>
        </div>
      `;
      div.addEventListener("mouseenter", () => setActive(i));
      div.addEventListener("mousedown", (ev) => { ev.preventDefault(); }); // avoid blurring input
      div.addEventListener("click", () => pick(i));
      list.appendChild(div);
    });
    currentIndex = items.length ? 0 : -1;
    setActive(currentIndex);
  }

  function escapeHtml(s){ return (s||"").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }

  function setActive(i){
    [...list.children].forEach((n, idx) => n.dataset.active = (idx===i ? "true" : "false"));
    currentIndex = i;
  }

  function reposition(){
    if (!currentAnchor) return;
    const r = currentAnchor.getBoundingClientRect();
    const topBelow = r.bottom + 4;
    const topAbove = r.top - 4 - Math.min(240, 200);
    const top = (topBelow + 240 <= window.innerHeight) ? topBelow : Math.max(6, topAbove);
    const left = Math.max(6, Math.min(r.left, window.innerWidth - 260));
    box.style.left = `${left + window.scrollX}px`;
    box.style.top  = `${top + window.scrollY}px`;
    box.style.minWidth = `${Math.min(360, Math.max(240, r.width))}px`;
  }

  function show(anchorEl, items, onPick){
    if (!items || !items.length) return hide();
    ensureOverlay();
    currentAnchor = anchorEl;
    onPickCb = onPick;
    buildItems(items);
    reposition();
    host.style.display = "block";
  }

  function hide(){
    if (host) host.style.display = "none";
    currentAnchor = null;
    onPickCb = null;
    currentIndex = -1;
  }

  function pick(i){
    if (i < 0) return hide();
    const node = list.children[i];
    if (!node) return hide();
    const value = node.querySelector(".muted")?.textContent || "";
    if (onPickCb) onPickCb(value);
    hide();
  }

  function handleKey(e){
    if (!currentAnchor || host.style.display === "none") return false;
    if (e.key === "Escape") { hide(); return true; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(Math.min(currentIndex+1, list.children.length-1)); return true; }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActive(Math.max(currentIndex-1, 0)); return true; }
    if (e.key === "Enter" || e.key === "Tab") {
      const idx = currentIndex >= 0 ? currentIndex : 0;
      pick(idx);
      return (e.key === "Enter");
    }
    return false;
  }

  document.addEventListener("keydown", (e) => {
    if (handleKey(e)) e.stopPropagation();
  }, true);

  function getAnchor(){
    return currentAnchor;
  }

  function isOpen(){
    return !!currentAnchor && host && host.style.display !== "none";
  }

  window.InlineAutofill = { show, hide, getAnchor, isOpen };
})();

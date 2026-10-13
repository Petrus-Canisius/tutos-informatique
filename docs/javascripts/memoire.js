/* Visionneuse locale WebP : pas de PDF embarqué.
   Le contenu affiché publiquement reste techniquement récupérable. */
(function () {
  function init() {
    var root = document.querySelector("[data-memo-reader]");
    if (!root || root.dataset.mbrReady === "1") return;
    root.dataset.mbrReady = "1";

    var total = 47, page = 1, zoom = 1;
    var image = root.querySelector('[data-mbr="image"]');
    var input = root.querySelector('[data-mbr="input"]');
    var stage = root.querySelector('[data-mbr="stage"]');
    var progress = root.querySelector('[data-mbr="progress"]');
    var bar = root.querySelector(".mbr-progress");
    var zoomText = root.querySelector('[data-mbr="zoom-value"]');
    var err = root.querySelector('[data-mbr="error"]');
    var pending = root.querySelector('[data-mbr="loading"]');
    var prev = root.querySelector('[data-mbr="prev"]');
    var next = root.querySelector('[data-mbr="next"]');
    var chapters = Array.from(root.querySelectorAll("[data-mbr-page]"));
    var loaded = new Map();

    function url(n) {
      return "pages/page-" + String(n).padStart(2, "0") + ".webp";
    }
    function applyZoom() {
      image.style.width = Math.round(zoom * 100) + "%";
      zoomText.textContent = Math.round(zoom * 100) + " %";
    }
    function prefetch(n) {
      if (n < 1 || n > total || loaded.has(n)) return;
      var img = new Image();
      img.src = url(n);
      loaded.set(n, img);
    }
    function draw(n) {
      n = Math.max(1, Math.min(total, Math.floor(Number(n) || 1)));
      if (page === n && image.complete && image.naturalWidth) return;
      page = n;
      input.value = String(n);
      prev.disabled = n === 1;
      next.disabled = n === total;
      progress.style.width = (n / total * 100) + "%";
      bar.setAttribute("aria-valuenow", String(n));
      chapters.forEach(function (btn) {
        var active = Number(btn.dataset.mbrPage) <= n;
        btn.classList.toggle("mbr-chapter-passed", active);
        if (Number(btn.dataset.mbrPage) === n) btn.setAttribute("aria-current", "page");
        else btn.removeAttribute("aria-current");
      });
      err.hidden = true;
      pending.hidden = false;
      image.alt = "Page " + n + " sur 47 du mémoire de fin d'études";
      image.src = url(n);
      stage.scrollTop = 0;
      stage.scrollLeft = 0;
      window.setTimeout(function () { prefetch(n + 1); }, 150);
    }
    image.addEventListener("load", function () { pending.hidden = true; err.hidden = true; });
    image.addEventListener("error", function () { pending.hidden = true; err.hidden = false; });
    prev.addEventListener("click", function () { draw(page - 1); });
    next.addEventListener("click", function () { draw(page + 1); });
    input.addEventListener("change", function () { draw(input.value); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); draw(input.value); stage.focus(); }
    });
    root.querySelector('[data-mbr="zoom-in"]').addEventListener("click", function () { zoom = Math.min(2.5, Math.round((zoom + .25) * 100) / 100); applyZoom(); });
    root.querySelector('[data-mbr="zoom-out"]').addEventListener("click", function () { zoom = Math.max(1, Math.round((zoom - .25) * 100) / 100); applyZoom(); });
    root.querySelector('[data-mbr="zoom-reset"]').addEventListener("click", function () { zoom = 1; applyZoom(); });
    root.querySelector('[data-mbr="fullscreen"]').addEventListener("click", function () {
      if (document.fullscreenElement) { document.exitFullscreen(); }
      else if (root.requestFullscreen) { root.requestFullscreen().catch(function () {}); }
    });
    chapters.forEach(function (btn) {
      btn.addEventListener("click", function () { draw(btn.dataset.mbrPage); stage.focus(); });
    });
    root.addEventListener("keydown", function (e) {
      if (e.target.matches("input, textarea") || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowRight") { e.preventDefault(); draw(page + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); draw(page - 1); }
      if (e.key === "Home") { e.preventDefault(); draw(1); }
      if (e.key === "End") { e.preventDefault(); draw(total); }
    });
    stage.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    stage.addEventListener("dragstart", function (e) { e.preventDefault(); });
    stage.addEventListener("copy", function (e) { e.preventDefault(); });
    var swipeX = null;
    stage.addEventListener("touchstart", function (e) {
      if (zoom !== 1 || !e.touches.length) return;
      swipeX = e.touches[0].clientX;
    }, { passive:true });
    stage.addEventListener("touchend", function (e) {
      if (swipeX === null || !e.changedTouches.length || zoom !== 1) return;
      var dx = e.changedTouches[0].clientX - swipeX;
      swipeX = null;
      if (Math.abs(dx) > 65) draw(page + (dx < 0 ? 1 : -1));
    }, { passive:true });
    page = 0;
    applyZoom();
    draw(1);
  }
  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(init);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else init();
})();

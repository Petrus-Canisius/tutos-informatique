/* Met à jour le bandeau avec le catalogue généré lors de chaque publication. */
(function () {
  "use strict";
  function renderLatest() {
    var banner = document.querySelector("[data-latest-procedure]");
    if (!banner) return;
    fetch("data/latest-procedure.json", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("Catalogue indisponible");
        return response.json();
      })
      .then(function (latest) {
        if (!latest || typeof latest.title !== "string" ||
            typeof latest.url !== "string" ||
            !/^[a-z0-9][a-z0-9/_-]*\/$/i.test(latest.url)) return;
        banner.querySelector("[data-latest-title]").textContent = latest.title;
        banner.querySelector("[data-latest-description]").textContent = latest.description || "";
        banner.querySelector("[data-latest-link]").href = latest.url;
        var time = banner.querySelector("[data-latest-date]");
        var iso = latest.published_at;
        if (typeof iso === "string" && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
          var day = new Date(iso + "T12:00:00");
          if (!isNaN(day.getTime())) {
            time.setAttribute("datetime", iso);
            time.textContent = day.toLocaleDateString("fr-FR", {
              day: "numeric", month: "long", year: "numeric"
            });
          }
        }
      })
      .catch(function () {
        // Le guide FOG déjà présent en HTML reste accessible si le JSON échoue.
      });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderLatest);
  } else {
    renderLatest();
  }
})();

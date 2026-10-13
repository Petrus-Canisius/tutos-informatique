/* Connecte la recherche de la page d'accueil à la recherche Zensical. */
(function () {
  document.addEventListener("submit", function (e) {
    if (!e.target.matches("form[data-kb-search]")) return;
    e.preventDefault();
    var input = e.target.querySelector('input[type="search"]');
    var q = input ? input.value.trim() : "";
    var toggle = document.querySelector('input[data-md-toggle="search"]') || document.querySelector("input#__search");
    if (toggle && toggle.type === "checkbox") {
      toggle.checked = true;
      toggle.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      var label = document.querySelector('label[for="__search"]');
      if (label) label.click();
    }
    window.setTimeout(function () {
      var search = document.querySelector("input.md-search__input") ||
                   document.querySelector('input[data-md-component="search-query"]');
      if (search) {
        search.focus();
        if (q) {
          search.value = q;
          search.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    }, 100);
  });
})();

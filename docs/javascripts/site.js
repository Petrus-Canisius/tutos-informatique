/* Recherche d'accueil : moteur natif Zensical, sans temporisation arbitraire. */
(function () {
  "use strict";
  function field() {
    return document.querySelector("input.md-search__input") ||
           document.querySelector('input[data-md-component="search-query"]');
  }
  function populate(query) {
    var search = field();
    if (!search) return false;
    search.focus();
    if (query) {
      search.value = query;
      search.dispatchEvent(new Event("input", { bubbles: true }));
    }
    return true;
  }
  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!form.matches("form[data-kb-search]")) return;
    event.preventDefault();
    var input = form.querySelector('input[type="search"]');
    var query = input ? input.value.trim() : "";
    var toggle = document.querySelector('input[data-md-toggle="search"]') ||
                 document.querySelector("input#__search");
    if (toggle && toggle.type === "checkbox") {
      toggle.checked = true;
      toggle.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      var label = document.querySelector('label[for="__search"]');
      if (label) label.click();
    }
    if (populate(query)) return;
    var observer = new MutationObserver(function () {
      if (populate(query)) observer.disconnect();
    });
    observer.observe(document.body, { subtree: true, childList: true });
    window.setTimeout(function () { observer.disconnect(); }, 2000);
  });
})();

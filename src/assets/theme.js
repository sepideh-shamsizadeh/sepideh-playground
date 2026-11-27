(function () {
  try {
    if (localStorage.getItem("playground-theme") === "light") document.documentElement.dataset.theme = "light";
  } catch {
    // The initial dark theme is still available without browser storage.
  }
})();

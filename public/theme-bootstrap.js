(function () {
  try {
    var meta = document.querySelector('meta[name="app-theme-storage-key"]');
    var key = meta && meta.getAttribute("content");
    if (!key || key.indexOf("%") === 0) return;
    var theme = localStorage.getItem(key) || "system";
    var resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;
    var root = document.documentElement;
    root.classList.add(resolved);
    root.style.colorScheme = resolved;
    var colorMeta = document.querySelector('meta[name="theme-color"]');
    var paletteMeta = document.querySelector('meta[name="app-theme-color-' + resolved + '"]');
    var color = paletteMeta && paletteMeta.getAttribute("content");
    if (colorMeta && color && color.indexOf("%") !== 0) {
      colorMeta.setAttribute("content", color);
    }
  } catch (_) {}
})();

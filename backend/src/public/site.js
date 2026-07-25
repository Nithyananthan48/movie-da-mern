const root = document.documentElement;
const key = "theme_mode";
const current = localStorage.getItem(key) || "dark";
root.setAttribute("data-theme", current);

const btn = document.getElementById("themeToggle");
if (btn) {
  btn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem(key, next);
  });
}

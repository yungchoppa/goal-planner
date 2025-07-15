// Theme toggle logic

const themeToggle = document.getElementById('theme-toggle');
const root = document.documentElement;

function setTheme(dark) {
  if (dark) {
    root.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    root.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
}

// Инициализация темы при загрузке
(function() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    setTheme(true);
  } else {
    setTheme(false);
  }
})();

themeToggle.addEventListener('click', function() {
  setTheme(!root.classList.contains('dark'));
});

/* SoongSanTech site.js — navigation toggle + theme switcher */
(function() {
  // ===== Mobile nav toggle =====
  var navToggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.site-nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', function() {
      var isOpen = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // ===== Theme toggle =====
  var STORAGE_KEY = 'sit-theme';
  var root = document.documentElement;
  var themeBtn = document.querySelector('.theme-toggle');

  function applyTheme(theme) {
    if (theme === 'dark' || theme === 'light') {
      root.setAttribute('data-theme', theme);
    } else {
      root.removeAttribute('data-theme');
    }
    if (themeBtn) {
      themeBtn.setAttribute('aria-label',
        (theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'));
    }
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', function() {
      // Determine the effective current theme
      var current = root.getAttribute('data-theme');
      if (!current) {
        current = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark' : 'light';
      }
      var next = current === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
      applyTheme(next);
    });
  }
})();

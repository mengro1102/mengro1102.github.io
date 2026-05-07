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

// ===== Table of Contents (TOC) Generator =====
(function() {
  var tocList = document.getElementById('toc-list');
  var tocFloatList = document.getElementById('toc-float-list');
  if (!tocList) return;

  var content = document.querySelector('.post-content');
  if (!content) return;

  var headings = content.querySelectorAll('h2, h3');
  if (headings.length < 2) {
    var toc = document.querySelector('.toc');
    var tocFloat = document.getElementById('toc-float');
    if (toc) toc.style.display = 'none';
    if (tocFloat) tocFloat.style.display = 'none';
    return;
  }

  var html = '<ul>';
  headings.forEach(function(h, i) {
    if (!h.id) {
      h.id = 'heading-' + i;
    }
    var level = h.tagName === 'H2' ? 'toc__item--h2' : 'toc__item--h3';
    html += '<li class="toc__item ' + level + '">';
    html += '<a href="#' + h.id + '">' + h.textContent + '</a>';
    html += '</li>';
  });
  html += '</ul>';

  tocList.innerHTML = html;
  if (tocFloatList) tocFloatList.innerHTML = html;

  // ===== Floating TOC: show when inline TOC scrolls out of view =====
  var tocInline = document.getElementById('toc-inline');
  var tocFloat = document.getElementById('toc-float');
  if (!tocInline || !tocFloat) return;

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          tocFloat.classList.remove('is-visible');
        } else {
          tocFloat.classList.add('is-visible');
        }
      });
    }, { threshold: 0 });
    observer.observe(tocInline);
  }

  // ===== Highlight active heading in floating TOC =====
  if ('IntersectionObserver' in window) {
    var floatLinks = tocFloat.querySelectorAll('.toc__item a');
    var headingObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          floatLinks.forEach(function(link) {
            link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-80px 0px -60% 0px', threshold: 0 });

    headings.forEach(function(h) { headingObserver.observe(h); });
  }
})();

/* ═══════════════════════════════════════════════════
   CyberNova — Public Site Header
   public-nav.js
═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Active page link ─────────────────────────── */
  function setActiveLink() {
    const filename = location.pathname.split('/').pop() || 'index.html';
    const page = filename.replace('.html', '') || 'index';
    document.querySelectorAll('[data-page]').forEach(function (a) {
      if (a.dataset.page === page) {
        a.classList.add('active');
      }
    });
  }

  /* ── Scroll shadow ────────────────────────────── */
  function initScrollShadow() {
    var header = document.getElementById('pubHeader');
    if (!header) return;
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 8);
    }, { passive: true });
  }

  /* ── Hamburger / drawer ───────────────────────── */
  function initMobileDrawer() {
    var btn    = document.getElementById('pubHamburger');
    var drawer = document.getElementById('pubDrawer');
    var header = document.getElementById('pubHeader');
    if (!btn || !drawer) return;

    function openDrawer() {
      btn.classList.add('open');
      drawer.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      btn.classList.remove('open');
      drawer.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    btn.addEventListener('click', function () {
      var isOpen = drawer.classList.contains('open');
      isOpen ? closeDrawer() : openDrawer();
    });

    /* Close on any drawer link tap */
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeDrawer);
    });

    /* Close on outside click */
    document.addEventListener('click', function (e) {
      if (
        drawer.classList.contains('open') &&
        !header.contains(e.target) &&
        !drawer.contains(e.target)
      ) {
        closeDrawer();
      }
    });

    /* Close on Escape key */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('open')) {
        closeDrawer();
        btn.focus();
      }
    });
  }

  /* ── Admin session badge ──────────────────────── */
  function checkAdminSession() {
    var badge = document.getElementById('pubSiteBadge');
    if (!badge) return;
    try {
      var session = window.CyberNovaDB &&
                    typeof window.CyberNovaDB.getCurrentSession === 'function'
                    ? window.CyberNovaDB.getCurrentSession()
                    : null;
      var isAdmin = !!(session && session.role === 'admin');
      badge.classList.toggle('visible', isAdmin);
    } catch (e) {
      badge.classList.remove('visible');
    }
  }

  /* ── Init ─────────────────────────────────────── */
  function init() {
    setActiveLink();
    initScrollShadow();
    initMobileDrawer();
    checkAdminSession();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
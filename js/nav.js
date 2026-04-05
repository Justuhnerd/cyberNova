(function() {
    var hamburger = document.getElementById('hamburger');
    var drawer = document.getElementById('mobileNavDrawer');
    var overlay = document.getElementById('mobileNavOverlay');

    if (!hamburger || !drawer || !overlay) return;

    function openNav() {
      hamburger.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
      drawer.classList.add('open');
      overlay.classList.add('visible');
      document.body.classList.add('nav-open');
    }

    function closeNav() {
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      drawer.classList.remove('open');
      overlay.classList.remove('visible');
      document.body.classList.remove('nav-open');
    }

    hamburger.addEventListener('click', function() {
      if (drawer.classList.contains('open')) closeNav();
      else openNav();
    });

    overlay.addEventListener('click', closeNav);
    document.querySelectorAll('#mobileNavDrawer a').forEach(function(link) {
      link.addEventListener('click', closeNav);
    });
    window.addEventListener('resize', function() {
      if (window.innerWidth >= 768) closeNav();
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeNav();
    });
  })();
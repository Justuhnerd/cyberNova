// admin-nav.js - Automatic top navigation highlighting
(function() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  function init() {
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1) || 'admin.html';
    
    const mapping = {
      'admin.html': 'nav-dashboard',
      'requests.html': 'nav-requests',
      'analytics.html': 'nav-analytics',
      'traffic-analytics.html': 'nav-traffic',
      'content.html': 'nav-content',
      'audit.html': 'nav-audit'
    };
    
    const targetId = mapping[page];
    if (targetId) {
      const link = document.getElementById(targetId);
      if (link) link.classList.add('topnav-active');
    }
  }
})();
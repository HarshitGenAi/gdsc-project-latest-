/* router.js
   Simple hash-based router. Maps routes to render functions.
   Exposes DevBlog.router with navigateTo & start router.
   Routes:
     #/ or #/home -> renderHome
     #/auth -> renderAuth
     #/create -> renderCreateEdit(null)
     #/edit/{id} -> renderCreateEdit(id)
     #/manage -> renderManage
     #/post/{slug} -> renderPost(slug)
     #/profile -> renderProfile
*/
(function () {
  const ns = window.DevBlog = window.DevBlog || {};
  const app = { root: document.getElementById('main') };

  // Basic query string parser for hash query
  function parseHash(hash) {
    // remove leading #
    if (!hash) hash = location.hash || '';
    if (hash.startsWith('#')) hash = hash.slice(1);
    const [pathPart, queryPart] = hash.split('?');
    const path = (pathPart || '/').replace(/^\/+/, '/');
    const segments = path.split('/').filter(Boolean);
    const query = {};
    if (queryPart) {
      queryPart.split('&').forEach(kv=>{
        const [k,v] = kv.split('=');
        if (k) query[decodeURIComponent(k)] = decodeURIComponent(v||'');
      });
    }
    return { path, segments, query };
  }

  function navigateTo(hash) {
    if (!hash.startsWith('#')) hash = '#'+hash;
    location.hash = hash;
  }

  // Render router
  async function renderRoute() {
    const { path, segments, query } = parseHash(location.hash);
    // dispatch
    const main = app.root;
    main.innerHTML = ''; // clear
    // Provide default
    if (path === '/' || path === '/home') {
      ns.renderHome(main, query);
    } else if (path === '/auth') {
      ns.renderAuth(main, query);
    } else if (path === '/create') {
      ns.renderCreateEdit(main, null);
    } else if (path === '/manage') {
      ns.renderManage(main, query);
    } else if (segments[0] === 'edit' && segments[1]) {
      ns.renderCreateEdit(main, segments[1]);
    } else if (segments[0] === 'post' && segments[1]) {
      ns.renderPost(main, segments[1]);
    } else if (path === '/profile') {
      ns.renderProfile(main);
    } else {
      // default home
      ns.renderHome(main, query);
    }
    // update header (nav)
    if (ns.updateHeader) ns.updateHeader();
    // Do not auto-focus main to avoid visible focus outline on re-renders
  }

  function start() {
    window.addEventListener('hashchange', renderRoute, false);
    // search input push to navigate
    const search = document.getElementById('search-input');
    if (search) {
      let t;
      search.addEventListener('input', (e)=>{
        const q = e.target.value.trim();
        const newHash = '#/home?search=' + encodeURIComponent(q);
        history.replaceState(null, '', newHash);
        clearTimeout(t);
        t = setTimeout(()=>{
          // re-render without blurring the input
          renderRoute();
          // restore focus to search
          const s2 = document.getElementById('search-input');
          if (s2) s2.focus();
        }, 200);
      });
    }
    renderRoute();
  }

  ns.router = { navigateTo, start, parseHash, renderRoute };
})();

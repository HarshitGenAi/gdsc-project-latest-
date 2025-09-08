/* storage.js
   Centralized storage helpers and demo seeding for DevBlog.
   Exposes: DevBlog.storage with methods getPosts, savePosts, getUsers, saveUsers, getSession, setSession, seedDemo, resetData
*/
(function () {
  window.DevBlog = window.DevBlog || {};
  const KEYS = {
    POSTS: 'devblog_v1_posts',
    USERS: 'devblog_v1_users',
    SESSION: 'devblog_v1_session'
  };

  // Simple UUID generator (RFC4122-lite)
  function uuid() {
    return 'xxxxxx4xxxyxxxxxxx'.replace(/[xy]/g, function(c){
      const r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }

  // Basic deep clone
  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  // Read helpers
  function read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Storage read error', e);
      return null;
    }
  }
  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage write error', e);
    }
  }

  // Schema helpers: minimal validation to ensure arrays
  function getPosts() {
    const p = read(KEYS.POSTS);
    return Array.isArray(p) ? p : [];
  }
  function savePosts(posts) {
    write(KEYS.POSTS, posts);
  }
  function getUsers() {
    const u = read(KEYS.USERS);
    return Array.isArray(u) ? u : [];
  }
  function saveUsers(users) {
    write(KEYS.USERS, users);
  }
  function getSession() {
    const s = read(KEYS.SESSION);
    return s || null;
  }
  function setSession(session) {
    write(KEYS.SESSION, session);
  }

  // Seed demo data only if empty or forced
  function seedDemo(force = false) {
    const users = getUsers();
    const posts = getPosts();
    if (!force && users.length > 0 && posts.length > 0) return;

    // Helper to hash password for demo (btoa simple obfuscation). NOTE: only demo use.
    const hash = (pwd, email) => btoa(pwd + '|' + email);

    const demoUsers = [
      {
        id: 'user-' + uuid(),
        name: 'Demo Author',
        email: 'author@example.com',
        passwdHash: hash('password123', 'author@example.com'),
        createdAt: new Date().toISOString()
      },
      {
        id: 'user-' + uuid(),
        name: 'Reader One',
        email: 'reader@example.com',
        passwdHash: hash('reader123', 'reader@example.com'),
        createdAt: new Date().toISOString()
      }
    ];

    // Two sample cover image URLs (Unsplash)
    const cover1 = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1400&q=60&auto=format&fit=crop';
    const cover2 = 'https://images.unsplash.com/photo-1506765515384-028b60a970df?w=1400&q=60&auto=format&fit=crop';
    const cover3 = 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1400&q=60&auto=format&fit=crop';

    const demoPosts = [
      {
        id: 'post-' + uuid(),
        slug: 'getting-started-with-vanilla-js',
        title: 'Getting Started with Vanilla JavaScript',
        category: 'JavaScript',
        tags: ['javascript','frontend','basics'],
        excerpt: 'How to get started building apps with only plain JavaScript — no frameworks.',
        content: '<p>Vanilla JavaScript is powerful because it ships everywhere. With a few small patterns, you can build fast, maintainable apps without reaching for a framework.</p><p>This guide walks through the fundamentals you will use every day:</p><ul><li><strong>DOM</strong>: querying, creating, and updating elements efficiently</li><li><strong>Events</strong>: listening, delegating, and cleaning up</li><li><strong>State</strong>: keeping data separate from the UI</li><li><strong>Composition</strong>: organizing features into tiny modules</li></ul><p>Start small: wire up a counter, a modal, and a toast. Then level up with a simple router and localStorage-backed data layer.</p><p>As you grow, focus on readability. Create helpers for repeated patterns, prefer clear names over clever ones, and keep your functions short. These habits scale as your app scales.</p>',
        coverImage: cover1,
        author: { id: demoUsers[0].id, name: demoUsers[0].name },
        createdAt: new Date(Date.now()-86400000*6).toISOString(),
        updatedAt: new Date(Date.now()-86400000*5).toISOString(),
        published: true,
        likes: 4,
        bookmarks: [ demoUsers[1].id ],
        comments: [
          { id: 'c-'+uuid(), authorName: 'Reader One', authorId: demoUsers[1].id, content: 'Great intro — clear and practical.', createdAt: new Date(Date.now()-86400000*5.5).toISOString() },
          { id: 'c-'+uuid(), authorName: '', authorId: null, content: 'Very helpful, thanks!', createdAt: new Date(Date.now()-86400000*5.2).toISOString() }
        ]
      },
      {
        id: 'post-' + uuid(),
        slug: 'css-tricks-for-clean-layouts',
        title: 'CSS Tricks for Clean Layouts',
        category: 'CSS',
        tags: ['css','layout','design'],
        excerpt: 'A small set of CSS techniques that make layouts more robust and pleasant.',
        content: '<p>Great layout feels effortless. The trick is to rely on a few composable primitives and let the browser do the heavy lifting.</p><p>At the core:</p><ul><li>Use <code>display: grid</code> and <code>gap</code> to manage spacing between items</li><li>Prefer <code>minmax()</code> and fluid units for responsive tracks</li><li>Adopt CSS variables for color, spacing, and radii</li><li>Keep components simple: a card, a button, a chip — and reuse them</li></ul><p>Typography matters too. Choose a comfortable line-height, limit line length, and use contrast thoughtfully. Pair these with subtle shadows and borders for depth.</p><p>Remember: consistency beats complexity. A tiny, consistent design system will make every screen feel tidy.</p>',
        coverImage: cover2,
        author: { id: demoUsers[0].id, name: demoUsers[0].name },
        createdAt: new Date(Date.now()-86400000*3).toISOString(),
        updatedAt: new Date(Date.now()-86400000*2.5).toISOString(),
        published: true,
        likes: 6,
        bookmarks: [],
        comments: [
          { id: 'c-'+uuid(), authorName: 'Anna', authorId: null, content: 'Nicely explained examples.', createdAt: new Date(Date.now()-86400000*2.8).toISOString() },
          { id: 'c-'+uuid(), authorName: 'Reader One', authorId: demoUsers[1].id, content: 'Saved me time, thanks!', createdAt: new Date(Date.now()-86400000*2.6).toISOString() }
        ]
      },
      {
        id: 'post-' + uuid(),
        slug: 'writing-accessible-frontend',
        title: 'Writing Accessible Frontend',
        category: 'Accessibility',
        tags: ['accessibility','a11y','ux'],
        excerpt: 'Practical tips for making your frontend accessible for users and screen readers.',
        content: '<p>Accessibility is not optional — it is essential usability. Start by using the right HTML elements: buttons for actions, anchors for navigation, and headings for structure.</p><p>Ensure everything works with a keyboard: visible focus, logical tab order, and no keyboard traps. Test with only the keyboard for five minutes and you will find issues quickly.</p><p>Color contrast and readable text help everyone. Validate contrast ratios and avoid using color alone to convey meaning.</p><blockquote>Accessible apps reach more people and feel better for everyone.</blockquote><p>Finally, label form controls, add alt text for images, and announce dynamic changes to assistive tech. Make accessibility part of your definition of done.</p>',
        coverImage: cover3,
        author: { id: demoUsers[1].id, name: demoUsers[1].name },
        createdAt: new Date(Date.now()-86400000*1.5).toISOString(),
        updatedAt: new Date(Date.now()-86400000*1.2).toISOString(),
        published: true,
        likes: 2,
        bookmarks: [],
        comments: [
          { id: 'c-'+uuid(), authorName: 'Accessibility Fan', authorId: null, content: 'More people should care about this!', createdAt: new Date(Date.now()-86400000*1.4).toISOString() },
          { id: 'c-'+uuid(), authorName: '', authorId: null, content: 'Good checklist.', createdAt: new Date(Date.now()-86400000*1.2).toISOString() }
        ]
      }
    ];

    saveUsers(demoUsers);
    savePosts(demoPosts);
    setSession(null);
    console.info('DevBlog: demo data seeded');
  }

  function resetData() {
    localStorage.removeItem(KEYS.POSTS);
    localStorage.removeItem(KEYS.USERS);
    localStorage.removeItem(KEYS.SESSION);
    // Also clear likes stored in sessionStorage
    try { sessionStorage.removeItem('devblog_v1_liked'); } catch(e){}
    seedDemo(true);
  }

  // Expose storage API
  window.DevBlog.storage = {
    KEYS,
    uuid,
    clone,
    getPosts,
    savePosts,
    getUsers,
    saveUsers,
    getSession,
    setSession,
    seedDemo,
    resetData
  };

  // Auto-seed on load
  try {
    storage = window.DevBlog.storage; // eslint-disable-line no-undef
    storage.seedDemo(false);
  } catch (e) {
    console.error(e);
  }
})();

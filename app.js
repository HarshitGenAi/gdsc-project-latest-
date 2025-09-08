/* app.js
   App glue for DevBlog. Renders views and wires up UI.
   This file contains the main render* view functions and boot logic.
   Exposes several render* functions used by router.js
*/
(function () {
  const ns = window.DevBlog = window.DevBlog || {};
  const storage = ns.storage;
  const auth = ns.auth;
  const postsAPI = ns.posts;
  const ui = ns.ui;
  const router = ns.router;

  // Helper to format date
  function fmtDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch (e) {
      return iso;
    }
  }

  // Header update
  function updateHeader() {
    const nav = document.getElementById('nav-links');
    nav.innerHTML = '';
    const currentUser = auth.getCurrentUser();
    // hide search on auth route
    try {
      const { path } = router.parseHash(location.hash);
      const headerCenter = document.querySelector('.header-center');
      if (headerCenter) headerCenter.style.display = (path === '/auth') ? 'none' : '';
    } catch(e) {}

    const homeLink = document.createElement('a');
    homeLink.className = 'btn-ghost';
    homeLink.href = '#/home';
    homeLink.textContent = 'Home';
    nav.appendChild(homeLink);

    if (currentUser) {
      const createBtn = document.createElement('a');
      createBtn.className = 'btn';
      createBtn.href = '#/create';
      createBtn.textContent = 'Create';
      nav.appendChild(createBtn);

      const manageBtn = document.createElement('a');
      manageBtn.className = 'btn-ghost';
      manageBtn.href = '#/manage';
      manageBtn.textContent = 'Manage';
      nav.appendChild(manageBtn);

      const profileBtn = document.createElement('button');
      profileBtn.className = 'btn-ghost';
      profileBtn.textContent = currentUser.name;
      profileBtn.onclick = () => router.navigateTo('#/profile');
      nav.appendChild(profileBtn);

      const logoutBtn = document.createElement('button');
      logoutBtn.className = 'btn-ghost';
      logoutBtn.textContent = 'Logout';
      logoutBtn.onclick = () => {
        auth.logout();
        ui.showToast('Logged out');
        router.renderRoute();
      };
      nav.appendChild(logoutBtn);
    } else {
      const authBtn = document.createElement('a');
      authBtn.className = 'btn';
      authBtn.href = '#/auth';
      authBtn.textContent = 'Sign In / Up';
      nav.appendChild(authBtn);
    }
  }

  ns.updateHeader = updateHeader;

  /* ------------------------
     Render: Home
     ------------------------ */
  function renderHome(container, query = {}) {
    const wrapper = document.createElement('div');
    wrapper.className = 'fade-in';
    const header = document.createElement('div');
    header.innerHTML = `<h2>Latest posts</h2>`;
    wrapper.appendChild(header);

    // Filters UI (category select + sort + pagination)
    const filterRow = document.createElement('div');
    filterRow.className = 'filter-bar';

    const catSelect = document.createElement('select');
    catSelect.className = 'input';
    catSelect.innerHTML = `<option value="">All categories</option>`;
    // gather categories
    const posts = postsAPI.getPublishedPosts();
    const cats = Array.from(new Set(posts.map(p=>p.category).filter(Boolean)));
    cats.forEach(c=>{
      const o = document.createElement('option');
      o.value = c;
      o.textContent = c;
      catSelect.appendChild(o);
    });
    catSelect.value = query.cat || '';
    catSelect.onchange = () => {
      const newHash = `#/home?search=${encodeURIComponent(query.search||'')}&cat=${encodeURIComponent(catSelect.value)}&page=1`;
      router.navigateTo(newHash);
    };
    filterRow.appendChild(catSelect);

    const sortSelect = document.createElement('select');
    sortSelect.className = 'input';
    sortSelect.innerHTML = `<option value="newest">Newest</option><option value="oldest">Oldest</option>`;
    sortSelect.value = query.sort || 'newest';
    sortSelect.onchange = ()=> {
      const newHash = `#/home?search=${encodeURIComponent(query.search||'')}&cat=${encodeURIComponent(query.cat||'')}&sort=${encodeURIComponent(sortSelect.value)}&page=1`;
      router.navigateTo(newHash);
    };
    filterRow.appendChild(sortSelect);

    wrapper.appendChild(filterRow);

    // Search & tag filtering applied
    let list = postsAPI.getPublishedPosts();

    // search
    const q = (query.search || '').trim().toLowerCase();
    if (q) {
      list = list.filter(p => (p.title + ' ' + ui.stripHtml(p.content) + ' ' + p.excerpt).toLowerCase().includes(q));
      const si = document.getElementById('search-input');
      if (si && si.value.trim() !== query.search) si.value = query.search || '';
    }

    // category
    if (query.cat) {
      list = list.filter(p => p.category === query.cat);
    }

    // tags filter (query.tags comma separated)
    if (query.tags) {
      const tagArr = query.tags.split(',').filter(Boolean);
      list = list.filter(p => tagArr.every(t => p.tags.includes(t)));
    }

    // sort
    if ((query.sort || 'newest') === 'oldest') {
      list = list.sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      list = list.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Pagination
    const page = Math.max(1, parseInt(query.page||'1',10) || 1);
    const perPage = 10;
    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / perPage));
    const start = (page-1)*perPage;
    const end = start + perPage;
    const paged = list.slice(start, end);

    // Posts grid
    const grid = document.createElement('div');
    grid.className = 'posts-grid';
    if (paged.length === 0) {
      grid.innerHTML = '<p>No posts found. Try adjusting filters.</p>';
    } else {
      paged.forEach(post => {
        const card = document.createElement('article');
        card.className = 'card';
        const img = document.createElement('img');
        img.src = post.coverImage || '';
        img.alt = post.title;
        card.appendChild(img);
        const body = document.createElement('div');
        body.className = 'card-body';
        const cat = document.createElement('div');
        cat.className = 'chip';
        cat.textContent = post.category || 'Uncategorized';
        cat.onclick = ()=> {
          const newHash = `#/home?cat=${encodeURIComponent(post.category)}&page=1`;
          router.navigateTo(newHash);
        };
        body.appendChild(cat);
        const title = document.createElement('h3');
        title.className = 'card-title';
        title.textContent = post.title;
        body.appendChild(title);
        const excerpt = document.createElement('p');
        excerpt.className = 'card-excerpt';
        excerpt.textContent = post.excerpt || ui.stripHtml(post.content).slice(0,160);
        body.appendChild(excerpt);

        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.innerHTML = `<span>${post.author.name}</span><span>•</span><span>${fmtDate(post.createdAt)}</span><span>•</span><span>${ui.estimateReadTime(post.content)} min read</span>`;
        body.appendChild(meta);

        const tagsWrap = document.createElement('div');
        tagsWrap.className = 'tag-list';
        post.tags.forEach(t=>{
          const chip = ui.createTagChip(t, { tag: t });
          chip.onclick = ()=>{
            const newHash = `#/home?tags=${encodeURIComponent(t)}&page=1`;
            router.navigateTo(newHash);
          };
          tagsWrap.appendChild(chip);
        });
        body.appendChild(tagsWrap);

        const actions = document.createElement('div');
        actions.className = 'card-actions';
        const likeBtn = document.createElement('button');
        likeBtn.className = 'icon-btn heart-btn';
        likeBtn.textContent = `♥ ${post.likes||0}`;
        try {
          const likedRaw = sessionStorage.getItem('devblog_v1_liked');
          const liked = likedRaw ? JSON.parse(likedRaw) : [];
          if (liked.includes(post.id)) likeBtn.classList.add('liked');
        } catch(e) {}
        likeBtn.onclick = ()=>{
          const res = postsAPI.toggleLike(post.id);
          if (res.success) {
            likeBtn.textContent = `♥ ${res.likes}`;
            likeBtn.classList.toggle('liked', !!res.liked);
          }
        };
        actions.appendChild(likeBtn);

        const readBtn = document.createElement('a');
        readBtn.className = 'btn';
        readBtn.href = '#/post/' + post.slug;
        readBtn.textContent = 'Read';
        actions.appendChild(readBtn);

        const shareBtn = document.createElement('button');
        shareBtn.className = 'icon-btn';
        shareBtn.textContent = 'Share';
        shareBtn.onclick = ()=>{
          const url = location.origin + location.pathname + '#/post/' + post.slug;
          ui.copyToClipboard(url);
        };
        actions.appendChild(shareBtn);

        body.appendChild(actions);
        card.appendChild(body);
        grid.appendChild(card);
      });
    }

    wrapper.appendChild(grid);

    // Pagination controls
    const pager = document.createElement('div');
    pager.className = 'pagination';
    const prev = document.createElement('button');
    prev.className = 'btn-ghost';
    prev.textContent = 'Previous';
    prev.disabled = page <= 1;
    prev.onclick = ()=> {
      const newPage = Math.max(1, page-1);
      router.navigateTo(`#/home?search=${encodeURIComponent(query.search||'')}&cat=${encodeURIComponent(query.cat||'')}&page=${newPage}&sort=${encodeURIComponent(query.sort||'')}`);
    };
    pager.appendChild(prev);

    const pageInfo = document.createElement('div');
    pageInfo.textContent = `Page ${page} of ${pages}`;
    pageInfo.style.alignSelf = 'center';
    pager.appendChild(pageInfo);

    const next = document.createElement('button');
    next.className = 'btn-ghost';
    next.textContent = 'Next';
    next.disabled = page >= pages;
    next.onclick = ()=> {
      const newPage = Math.min(pages, page+1);
      router.navigateTo(`#/home?search=${encodeURIComponent(query.search||'')}&cat=${encodeURIComponent(query.cat||'')}&page=${newPage}&sort=${encodeURIComponent(query.sort||'')}`);
    };
    pager.appendChild(next);

    wrapper.appendChild(pager);

    container.appendChild(wrapper);
  }

  /* ------------------------
     Render: Auth (Sign In / Sign Up)
     ------------------------ */
  function renderAuth(container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'fade-in auth-page';
    const tabs = document.createElement('div');
    tabs.className = 'segmented';
    const signInBtn = document.createElement('button');
    const signUpBtn = document.createElement('button');
    signInBtn.className = 'seg-item active';
    signInBtn.textContent = 'Sign In';
    signUpBtn.className = 'seg-item';
    signUpBtn.textContent = 'Sign Up';
    tabs.appendChild(signInBtn);
    tabs.appendChild(signUpBtn);
    wrapper.appendChild(tabs);

    const formWrap = document.createElement('div');
    formWrap.style.marginTop = '12px';
    formWrap.className = 'auth-form-wrap';

    function renderSignIn() {
      formWrap.innerHTML = '';
      signInBtn.className = 'seg-item active';
      signUpBtn.className = 'seg-item';
      const f = document.createElement('div');
      f.className = 'form auth-form';
      f.innerHTML = `
        <label class="label">Email</label>
        <input id="si-email" class="input" type="email" aria-label="Sign in email" />
        <label class="label">Password</label>
        <div class="input-eye">
          <input id="si-pass" class="input" type="password" aria-label="Sign in password" />
          <button id="si-eye" class="eye-btn" type="button" aria-label="Show password">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
        <div style="margin-top:10px; display:flex; gap:8px">
          <button id="si-btn" class="btn">Sign In</button>
          <button id="si-demo" class="btn-ghost" type="button">Use Demo Author</button>
        </div>
      `;
      // password eye toggle
      const siEye = f.querySelector('#si-eye');
      siEye.onclick = ()=>{
        const inp = f.querySelector('#si-pass');
        const showing = inp.type === 'text';
        inp.type = showing ? 'password' : 'text';
        siEye.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
      };
      formWrap.appendChild(f);
      f.querySelector('#si-btn').onclick = ()=>{
        const email = f.querySelector('#si-email').value.trim();
        const pwd = f.querySelector('#si-pass').value;
        const res = auth.login({ email, password: pwd });
        if (res.success) {
          ui.showToast('Signed in');
          ui.showSuccessOverlay();
          router.navigateTo('#/home');
        } else {
          ui.showToast(res.error || 'Sign in failed');
        }
      };
      f.querySelector('#si-demo').onclick = ()=>{
        f.querySelector('#si-email').value = 'author@example.com';
        f.querySelector('#si-pass').value = 'password123';
      };
    }

    function renderSignUp() {
      formWrap.innerHTML = '';
      signInBtn.className = 'seg-item';
      signUpBtn.className = 'seg-item active';
      const f = document.createElement('div');
      f.className = 'form auth-form';
      f.innerHTML = `
        <label class="label">Display name</label>
        <input id="su-name" class="input" />
        <label class="label">Email</label>
        <input id="su-email" class="input" type="email" />
        <label class="label">Password</label>
        <div class="input-eye">
          <input id="su-pass" class="input" type="password" />
          <button id="su-eye1" class="eye-btn" type="button" aria-label="Show password">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
        <label class="label">Confirm Password</label>
        <div class="input-eye">
          <input id="su-pass2" class="input" type="password" />
          <button id="su-eye2" class="eye-btn" type="button" aria-label="Show password">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
        <div style="margin-top:10px">
          <button id="su-btn" class="btn">Create account</button>
        </div>
      `;
      // eyes
      const suEye1 = f.querySelector('#su-eye1');
      suEye1.onclick = ()=>{
        const inp = f.querySelector('#su-pass');
        const showing = inp.type === 'text';
        inp.type = showing ? 'password' : 'text';
        suEye1.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
      };
      const suEye2 = f.querySelector('#su-eye2');
      suEye2.onclick = ()=>{
        const inp = f.querySelector('#su-pass2');
        const showing = inp.type === 'text';
        inp.type = showing ? 'password' : 'text';
        suEye2.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
      };
      formWrap.appendChild(f);
      f.querySelector('#su-btn').onclick = ()=>{
        const name = f.querySelector('#su-name').value.trim();
        const email = f.querySelector('#su-email').value.trim();
        const pass = f.querySelector('#su-pass').value;
        const pass2 = f.querySelector('#su-pass2').value;
        if (pass !== pass2) {
          ui.showToast('Passwords do not match');
          return;
        }
        const res = auth.signup({ name, email, password: pass });
        if (res.success) {
          ui.showToast('Account created and signed in');
          ui.showSuccessOverlay();
          router.navigateTo('#/home');
        } else {
          ui.showToast(res.error || 'Signup failed');
        }
      };
    }

    signInBtn.onclick = renderSignIn;
    signUpBtn.onclick = renderSignUp;
    renderSignIn();
    wrapper.appendChild(formWrap);
    container.appendChild(wrapper);
  }

  /* ------------------------
     Render: Create / Edit Post
     ------------------------ */
  function renderCreateEdit(container, postId = null) {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      container.innerHTML = '<div class="form"><p>Please <a href="#/auth">sign in</a> to create or edit posts.</p></div>';
      return;
    }

    const isEdit = !!postId;
    const post = isEdit ? postsAPI.getPostById(postId) : null;
    const wrapper = document.createElement('div');
    wrapper.className = 'fade-in';
    const header = document.createElement('h2');
    header.textContent = isEdit ? 'Edit post' : 'Create new post';
    wrapper.appendChild(header);

    const form = document.createElement('div');
    form.className = 'form';
    form.innerHTML = `
      <label class="label">Title</label>
      <input id="p-title" class="input" />
      <div class="row">
        <div>
          <label class="label">Category</label>
          <select id="p-category" class="input">
            <option value="">Select or type new</option>
          </select>
        </div>
        <div>
          <label class="label">New category</label>
          <input id="p-category-new" class="input" placeholder="Add new category" />
        </div>
      </div>
      <label class="label">Tags (comma separated)</label>
      <input id="p-tags" class="input" placeholder="e.g. javascript,frontend" />
      <label class="label">Cover image URL</label>
      <input id="p-cover" class="input" placeholder="https://..." />
      <label class="label">Content</label>
      <div class="toolbar" id="editor-toolbar">
        <button data-cmd="bold" title="Bold"><strong>B</strong></button>
        <button data-cmd="italic" title="Italic"><em>I</em></button>
        <button data-cmd="createLink" title="Insert link">Link</button>
        <button data-cmd="insertUnorderedList" title="Bullet list">UL</button>
        <button data-cmd="insertOrderedList" title="Numbered list">OL</button>
        <button data-cmd="formatBlock" data-value="blockquote" title="Quote">❝</button>
      </div>
      <div id="p-content" class="editor" contenteditable="true" role="textbox" aria-multiline="true"></div>
      <label class="label">Excerpt (auto-generated, editable)</label>
      <textarea id="p-excerpt" class="input" rows="3"></textarea>
      <div style="margin-top:10px; display:flex; gap:8px; align-items:center">
        <label class="label" style="margin:0">Published</label>
        <input id="p-published" type="checkbox" />
      </div>
      <div style="margin-top:12px; display:flex; gap:8px">
        <button id="p-save" class="btn">Save</button>
        <button id="p-cancel" class="btn-ghost">Cancel</button>
      </div>
    `;
    wrapper.appendChild(form);
    container.appendChild(wrapper);

    // Populate categories from existing posts
    const categories = Array.from(new Set(storage.getPosts().map(p => p.category).filter(Boolean)));
    const catSelect = form.querySelector('#p-category');
    categories.forEach(c => {
      const o = document.createElement('option'); o.value = c; o.textContent = c; catSelect.appendChild(o);
    });

    if (isEdit && post) {
      form.querySelector('#p-title').value = post.title;
      form.querySelector('#p-category').value = post.category;
      form.querySelector('#p-tags').value = post.tags.join(',');
      form.querySelector('#p-cover').value = post.coverImage;
      form.querySelector('#p-content').innerHTML = post.content;
      form.querySelector('#p-excerpt').value = post.excerpt;
      form.querySelector('#p-published').checked = !!post.published;
    }

    // Toolbar actions
    const toolbar = form.querySelector('#editor-toolbar');
    toolbar.addEventListener('click', (e)=> {
      const btn = e.target.closest('button');
      if (!btn) return;
      const cmd = btn.dataset.cmd;
      const val = btn.dataset.value || null;
      if (cmd === 'createLink') {
        const url = prompt('Enter URL');
        if (url) document.execCommand('createLink', false, url);
      } else if (cmd === 'formatBlock' && val) {
        document.execCommand('formatBlock', false, val);
      } else {
        document.execCommand(cmd, false, val);
      }
    });

    // Tags parsing on blur
    const tagsInput = form.querySelector('#p-tags');
    tagsInput.addEventListener('blur', ()=>{
      const arr = tagsInput.value.split(',').map(t=>t.trim()).filter(Boolean);
      tagsInput.value = arr.join(',');
    });

    // Excerpt auto-generate when content changes
    const contentEl = form.querySelector('#p-content');
    function autoExcerpt() {
      const text = ui.stripHtml(contentEl.innerHTML || '');
      const excerpt = text.slice(0,140);
      const exEl = form.querySelector('#p-excerpt');
      if (!exEl.value) exEl.value = excerpt;
    }
    contentEl.addEventListener('input', autoExcerpt);

    // Save
    form.querySelector('#p-save').onclick = ()=>{
      const title = form.querySelector('#p-title').value.trim();
      let category = form.querySelector('#p-category').value.trim();
      const newCat = form.querySelector('#p-category-new').value.trim();
      if (newCat) category = newCat;
      const tags = form.querySelector('#p-tags').value.split(',').map(t=>t.trim()).filter(Boolean);
      const cover = form.querySelector('#p-cover').value.trim();
      const content = contentEl.innerHTML;
      let excerpt = form.querySelector('#p-excerpt').value.trim();
      if (!excerpt) excerpt = ui.stripHtml(content).slice(0,140);

      if (!title) { ui.showToast('Title required'); return; }

      const res = postsAPI.savePost({
        id: isEdit ? post.id : null,
        title, category, tags, excerpt, content, coverImage: cover, published: form.querySelector('#p-published').checked
      });
      if (res.success) {
        ui.showToast(isEdit ? 'Post updated' : 'Post created');
        router.navigateTo('#/manage');
      } else {
        ui.showToast(res.error || 'Save failed');
      }
    };

    form.querySelector('#p-cancel').onclick = ()=> router.navigateTo('#/home');
  }

  /* ------------------------
     Render: Manage posts for current user
     ------------------------ */
  function renderManage(container) {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      container.innerHTML = '<div class="form"><p>Please <a href="#/auth">sign in</a> to manage posts.</p></div>';
      return;
    }
    const wrapper = document.createElement('div');
    wrapper.className = 'fade-in';
    wrapper.innerHTML = `<h2>Your posts</h2>`;
    const posts = storage.getPosts().filter(p => p.author && p.author.id === currentUser.id);

    const table = document.createElement('table');
    table.className = 'table';
    table.innerHTML = `<thead><tr><th>Title</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>`;
    const tbody = document.createElement('tbody');
    posts.forEach(p => {
      const tr = document.createElement('tr');
      const tdTitle = document.createElement('td');
      tdTitle.textContent = p.title;
      const tdStatus = document.createElement('td');
      tdStatus.textContent = p.published ? 'Published' : 'Draft';
      const tdDate = document.createElement('td');
      tdDate.textContent = fmtDate(p.createdAt);
      const tdActions = document.createElement('td');
      const editBtn = document.createElement('button');
      editBtn.className = 'btn-ghost';
      editBtn.textContent = 'Edit';
      editBtn.onclick = ()=> router.navigateTo('#/edit/' + p.id);
      tdActions.appendChild(editBtn);

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-ghost';
      delBtn.textContent = 'Delete';
      delBtn.onclick = ()=> {
        if (ui.confirmAction('Delete this post?')) {
          const ok = postsAPI.deletePost(p.id);
          if (ok) {
            ui.showToast('Deleted');
            renderManage(container);
          } else {
            ui.showToast('Delete failed');
          }
        }
      };
      tdActions.appendChild(delBtn);

      tr.appendChild(tdTitle);
      tr.appendChild(tdStatus);
      tr.appendChild(tdDate);
      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrapper.appendChild(table);
    container.appendChild(wrapper);
  }

  /* ------------------------
     Render: Single Post view + comments
     ------------------------ */
  function renderPost(container, slug) {
    const post = postsAPI.getPostBySlug(slug);
    if (!post) {
      container.innerHTML = '<div class="form"><p>Post not found.</p></div>';
      return;
    }
    const wrapper = document.createElement('article');
    wrapper.className = 'fade-in post';

    // Hero image
    const hero = document.createElement('div');
    hero.className = 'post-hero';
    const cover = document.createElement('img');
    cover.className = 'post-cover';
    cover.src = post.coverImage || '';
    cover.alt = post.title;
    hero.appendChild(cover);
    wrapper.appendChild(hero);

    // Title and meta
    const title = document.createElement('h1');
    title.className = 'post-title';
    title.textContent = post.title;
    wrapper.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'post-meta';
    meta.innerHTML = `<div class=\"chip\">${post.category || 'Uncategorized'}</div><div>${post.author.name}</div><div>•</div><div>${fmtDate(post.createdAt)}</div><div>•</div><div>${ui.estimateReadTime(post.content)} min read</div>`;
    wrapper.appendChild(meta);

    // Tags
    const tagsWrap = document.createElement('div');
    tagsWrap.className = 'post-tags';
    post.tags.forEach(t=>{
      const chip = ui.createTagChip(t, { tag: t });
      chip.onclick = ()=> router.navigateTo(`#/home?tags=${encodeURIComponent(t)}&page=1`);
      tagsWrap.appendChild(chip);
    });
    wrapper.appendChild(tagsWrap);

    // Content
    const content = document.createElement('div');
    content.className = 'post-content';
    ui.setSafeHtml(content, post.content);
    wrapper.appendChild(content);

    // Actions: like, bookmark, share
    const actions = document.createElement('div');
    actions.className = 'post-actions';
    const likeBtn = document.createElement('button'); likeBtn.className = 'icon-btn heart-btn'; likeBtn.textContent = `♥ ${post.likes||0}`;
    try {
      const likedRaw = sessionStorage.getItem('devblog_v1_liked');
      const liked = likedRaw ? JSON.parse(likedRaw) : [];
      if (liked.includes(post.id)) likeBtn.classList.add('liked');
    } catch(e) {}
    likeBtn.onclick = ()=> {
      const res = postsAPI.toggleLike(post.id);
      if (res.success) { likeBtn.textContent = `♥ ${res.likes}`; likeBtn.classList.toggle('liked', !!res.liked); }
    };
    actions.appendChild(likeBtn);

    const bookmarkBtn = document.createElement('button'); bookmarkBtn.className = 'btn-ghost';
    const currentUser = auth.getCurrentUser();
    const bookmarked = currentUser ? (post.bookmarks || []).includes(currentUser.id) : false;
    bookmarkBtn.textContent = bookmarked ? 'Bookmarked' : 'Bookmark';
    bookmarkBtn.onclick = ()=> {
      if (!auth.getCurrentUser()) { ui.showToast('Sign in to bookmark'); return; }
      const res = postsAPI.toggleBookmark(post.id, auth.getCurrentUser().id);
      if (res.success) {
        bookmarkBtn.textContent = res.bookmarked ? 'Bookmarked' : 'Bookmark';
        ui.showToast(res.bookmarked ? 'Bookmarked' : 'Removed bookmark');
      }
    };
    actions.appendChild(bookmarkBtn);

    const shareBtn = document.createElement('button'); shareBtn.className = 'btn-ghost'; shareBtn.textContent = 'Share';
    shareBtn.onclick = ()=> ui.copyToClipboard(location.origin + location.pathname + '#/post/' + post.slug);
    actions.appendChild(shareBtn);

    wrapper.appendChild(actions);

    // Comments
    const commentsWrap = document.createElement('div');
    commentsWrap.className = 'post-comments';
    const commentsHeader = document.createElement('h3'); commentsHeader.textContent = 'Comments';
    commentsWrap.appendChild(commentsHeader);

    const commentList = document.createElement('div');
    (post.comments || []).sort((a,b)=> new Date(a.createdAt)-new Date(b.createdAt)).forEach(c=>{
      const cEl = document.createElement('div');
      cEl.className = 'comment';
      const meta = document.createElement('div'); meta.className = 'meta';
      meta.innerHTML = `<span class=\"kv\">${c.authorName || 'Anonymous'}</span> • <span>${fmtDate(c.createdAt)}</span>`;
      cEl.appendChild(meta);
      const body = document.createElement('div'); body.style.marginTop='8px'; body.textContent = c.content;
      cEl.appendChild(body);
      // delete button for owner
      const current = auth.getCurrentUser();
      if (current && c.authorId && c.authorId === current.id) {
        const del = document.createElement('button'); del.className='btn-ghost'; del.textContent='Delete';
        del.onclick = ()=>{
          if (ui.confirmAction('Delete comment?')) {
            const ok = postsAPI.deleteComment(post.id, c.id, current.id);
            if (ok) { ui.showToast('Comment deleted'); router.renderRoute(); }
            else ui.showToast('Delete failed');
          }
        };
        cEl.appendChild(del);
      }
      commentList.appendChild(cEl);
    });
    commentsWrap.appendChild(commentList);

    // Add comment form
    const commentForm = document.createElement('div');
    commentForm.className = 'comment-form';
    commentForm.style.marginTop = '12px';
    const nameInput = document.createElement('input');
    nameInput.className = 'input';
    nameInput.placeholder = 'Your name (optional)';
    const commentInput = document.createElement('input');
    commentInput.className = 'input';
    commentInput.placeholder = 'Write a comment...';
    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn';
    submitBtn.textContent = 'Post';
    commentForm.appendChild(nameInput);
    commentForm.appendChild(commentInput);
    commentForm.appendChild(submitBtn);
    commentsWrap.appendChild(commentForm);

    submitBtn.onclick = ()=>{
      const name = nameInput.value.trim();
      const contentText = commentInput.value.trim();
      const current = auth.getCurrentUser();
      const res = postsAPI.addComment(post.id, {
        authorName: name || (current ? current.name : ''),
        authorId: current ? current.id : null,
        content: contentText
      });
      if (res.success) {
        ui.showToast('Comment posted');
        router.renderRoute();
      } else {
        ui.showToast(res.error || 'Comment failed');
      }
    };

    wrapper.appendChild(commentsWrap);
    container.appendChild(wrapper);
  }

  /* ------------------------
     Render: Profile
     ------------------------ */
  function renderProfile(container) {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      container.innerHTML = '<div class="form"><p>Please <a href="#/auth">sign in</a>.</p></div>';
      return;
    }
    const box = document.createElement('div');
    box.className = 'form';
    box.innerHTML = `<h2>${currentUser.name}</h2><p>Email: ${currentUser.email}</p><p>Member since: ${fmtDate(currentUser.createdAt)}</p>`;
    const bookmarks = storage.getPosts().filter(p=> (p.bookmarks||[]).includes(currentUser.id));
    box.appendChild(document.createElement('hr'));
    const bhead = document.createElement('h3'); bhead.textContent = 'Bookmarks';
    box.appendChild(bhead);
    if (bookmarks.length === 0) {
      box.appendChild(Object.assign(document.createElement('p'), { textContent: 'No bookmarks yet.'}));
    } else {
      bookmarks.forEach(p=>{
        const a = document.createElement('a'); a.href = '#/post/' + p.slug; a.textContent = p.title; a.className='kv';
        box.appendChild(a); box.appendChild(document.createElement('br'));
      });
    }
    container.appendChild(box);
  }

  /* ------------------------
     Boot app
     ------------------------ */
  function boot() {
    // Wire header controls
    document.getElementById('reset-data').addEventListener('click', ()=>{
      if (ui.confirmAction('Reset all demo data? This will clear localStorage.')) {
        storage.resetData();
        ui.showToast('Demo data reset');
        router.renderRoute();
      }
    });

    document.getElementById('toggle-theme').addEventListener('click', ()=>{
      const html = document.documentElement;
      const current = html.dataset.theme || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      html.dataset.theme = next;
    });

    // Update header
    updateHeader();

    // Start router
    router.start();

    // Bind search input to hash if user navigates away
    const search = document.getElementById('search-input');
    if (search) {
      const q = router.parseHash(location.hash).query.search || '';
      if (!search.value) search.value = q;
    }

    // accessibility: focus skip
    document.querySelectorAll('a,button,input,textarea,select').forEach(el=>{
      el.addEventListener('keydown', (e)=> {
        if (e.key === 'Enter' && el.tagName === 'A') el.click();
      });
    });
  }

  // Expose render functions used by router
  ns.renderHome = renderHome;
  ns.renderAuth = renderAuth;
  ns.renderCreateEdit = renderCreateEdit;
  ns.renderManage = renderManage;
  ns.renderPost = renderPost;
  ns.renderProfile = renderProfile;
  ns.renderRoute = router.renderRoute;

  // Start
  document.addEventListener('DOMContentLoaded', boot);
})();

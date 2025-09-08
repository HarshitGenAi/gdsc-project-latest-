/* posts.js
   Post CRUD, helpers, and render helpers for DevBlog.
   Exposes DevBlog.posts with create, update, delete, getBySlug, list, toggleLike, toggleBookmark, addComment.
*/
(function () {
  const ns = window.DevBlog = window.DevBlog || {};
  const storage = ns.storage;
  const ui = ns.ui;
  const auth = ns.auth;

  // Helpers
  function slugify(title) {
    const base = String(title).toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g,'-');
    return base || ('post-'+Date.now());
  }

  function uniqueSlug(baseSlug, posts) {
    let slug = baseSlug;
    let i = 1;
    const existing = posts.map(p => p.slug);
    while (existing.includes(slug)) {
      const suffix = '-' + (new Date()).toISOString().slice(0,10).replace(/-/g,'') + '-' + i;
      slug = baseSlug + suffix;
      i++;
    }
    return slug;
  }

  function getAllPosts() {
    return storage.getPosts().slice().sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));
  }

  function getPublishedPosts() {
    return getAllPosts().filter(p => p.published);
  }

  // Create or update post object
  function savePost({id, title, category, tags, excerpt, content, coverImage, published}) {
    const posts = storage.getPosts();
    const now = new Date().toISOString();
    if (id) {
      // update
      const idx = posts.findIndex(p => p.id === id);
      if (idx === -1) return { success:false, error:'Not found' };
      const p = posts[idx];
      p.title = title;
      p.category = category;
      p.tags = tags;
      p.excerpt = excerpt;
      p.content = content;
      p.coverImage = coverImage || '';
      p.updatedAt = now;
      p.published = !!published;
      storage.savePosts(posts);
      return { success:true, post:p };
    } else {
      // create
      const current = auth.getCurrentUser();
      if (!current) return { success:false, error:'Must be logged in' };
      const baseSlug = slugify(title);
      const slug = uniqueSlug(baseSlug, posts);
      const post = {
        id: 'post-' + storage.uuid(),
        slug,
        title,
        category,
        tags,
        excerpt,
        content,
        coverImage: coverImage || '',
        author: { id: current.id, name: current.name },
        createdAt: now,
        updatedAt: now,
        published: !!published,
        likes: 0,
        bookmarks: [],
        comments: []
      };
      posts.push(post);
      storage.savePosts(posts);
      return { success:true, post };
    }
  }

  function deletePost(id) {
    const posts = storage.getPosts();
    const idx = posts.findIndex(p => p.id === id);
    if (idx === -1) return false;
    posts.splice(idx,1);
    storage.savePosts(posts);
    return true;
  }

  function getPostBySlug(slug) {
    const posts = storage.getPosts();
    return posts.find(p => p.slug === slug) || null;
  }

  function getPostById(id) {
    const posts = storage.getPosts();
    return posts.find(p => p.id === id) || null;
  }

  // Comments
  function addComment(postId, { authorName, authorId, content }) {
    if (!content || !content.trim()) return { success:false, error:'Empty comment' };
    const posts = storage.getPosts();
    const p = posts.find(x=>x.id===postId);
    if (!p) return { success:false, error:'Post not found' };
    const c = {
      id: 'c-' + storage.uuid(),
      authorName: authorName ? authorName.trim() : '',
      authorId: authorId || null,
      content: content.trim(),
      createdAt: new Date().toISOString()
    };
    p.comments.push(c);
    storage.savePosts(posts);
    return { success:true, comment:c };
  }

  function deleteComment(postId, commentId, requesterId=null) {
    const posts = storage.getPosts();
    const p = posts.find(x=>x.id===postId);
    if (!p) return false;
    const idx = p.comments.findIndex(c => c.id === commentId);
    if (idx === -1) return false;
    // allow deletion if requesterId matches comment.authorId
    if (p.comments[idx].authorId && requesterId && p.comments[idx].authorId === requesterId) {
      p.comments.splice(idx,1);
      storage.savePosts(posts);
      return true;
    }
    // allow deletion if anonymous owner and requester is original author? No reliable check — require owner.
    return false;
  }

  // Likes: only once per browser session (track in sessionStorage)
  function toggleLike(postId) {
    const likedRaw = sessionStorage.getItem('devblog_v1_liked');
    const liked = likedRaw ? JSON.parse(likedRaw) : [];
    const posts = storage.getPosts();
    const post = posts.find(p=>p.id===postId);
    if (!post) return { success:false };
    if (liked.includes(postId)) {
      // unlike
      post.likes = Math.max(0, (post.likes||0) - 1);
      const idx = liked.indexOf(postId);
      liked.splice(idx,1);
      sessionStorage.setItem('devblog_v1_liked', JSON.stringify(liked));
      storage.savePosts(posts);
      return { success:true, liked:false, likes:post.likes };
    } else {
      post.likes = (post.likes||0) + 1;
      liked.push(postId);
      sessionStorage.setItem('devblog_v1_liked', JSON.stringify(liked));
      storage.savePosts(posts);
      return { success:true, liked:true, likes:post.likes };
    }
  }

  // Bookmarks: per post.bookmarks array with userId
  function toggleBookmark(postId, userId) {
    if (!userId) return { success:false, error:'Not logged in' };
    const posts = storage.getPosts();
    const post = posts.find(p=>p.id===postId);
    if (!post) return { success:false, error:'Post not found' };
    const idx = (post.bookmarks || []).indexOf(userId);
    if (idx === -1) {
      post.bookmarks.push(userId);
      storage.savePosts(posts);
      return { success:true, bookmarked:true };
    } else {
      post.bookmarks.splice(idx,1);
      storage.savePosts(posts);
      return { success:true, bookmarked:false };
    }
  }

  // Public API
  ns.posts = {
    slugify,
    uniqueSlug,
    getAllPosts,
    getPublishedPosts,
    savePost,
    deletePost,
    getPostBySlug,
    getPostById,
    addComment,
    deleteComment,
    toggleLike,
    toggleBookmark
  };
})();

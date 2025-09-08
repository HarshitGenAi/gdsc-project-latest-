# DevBlog

DevBlog is a lightweight frontend-only blogging Single Page Application (SPA) built with plain **HTML**, **CSS**, and **vanilla JavaScript**. It uses `localStorage` for persistence and hash-based routing so you can run it by opening `index.html` in your browser (no server required).

---

## Features (summary)
- Single-page app with hash routing (`#/home`, `#/post/{slug}`, `#/create`, `#/manage`, `#/auth`, `#/profile`).
- Plain HTML/CSS/JS (no frameworks). Google Font: Inter.
- Local-only storage using `localStorage` keys: `devblog_v1_posts`, `devblog_v1_users`, `devblog_v1_session`.
- Demo users & posts seeded automatically if empty.
- Signup / Login / Logout (demo hashing with `btoa`).
- Create/Edit posts with a simple contenteditable rich editor and toolbar.
- Likes (session-limited), bookmarks (per-user), comments, and basic management (edit/delete).
- Search, filters (category, tags), sort, and pagination.
- Toasts, copy-to-clipboard share, reset demo data button.

---

## File list & purpose
- `index.html` — App entry and basic layout.
- `styles.css` — All styles (mobile-first & responsive).
- `storage.js` — `localStorage` helpers, demo seeding, schema keys.
- `auth.js` — Signup/Login/Logout helpers and session tracking.
- `posts.js` — Post CRUD and business logic (likes, bookmarks, comments).
- `ui.js` — Toasts, small utilities (read-time, strip HTML).
- `router.js` — Simple hash-based router and query parsing.
- `app.js` — Rendering views (home, auth, create/edit, manage, post, profile) and boot logic.
- `assets/ASSETS_README.txt` — Notes about placeholder images used by demo posts.

---

## Data keys & schema (exact)
- `devblog_v1_posts` — JSON array of post objects:
```json
{
  "id":"<uuid>",
  "slug":"<url-friendly-string>",
  "title":"<string>",
  "category":"<string>",
  "tags":["tag1","tag2"],
  "excerpt":"<short string>",
  "content":"<html string>",
  "coverImage":"<image URL or empty>",
  "author":{ "id":"<userId>", "name":"<displayName>" },
  "createdAt":"<ISO datetime>",
  "updatedAt":"<ISO datetime>",
  "published": true,
  "likes": 0,
  "bookmarks": ["<userId>"],
  "comments":[
    { "id":"<uuid>", "authorName":"<string-or-empty>", "authorId": null, "content":"<string>", "createdAt":"<ISO datetime>" }
  ]
}

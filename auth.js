/* auth.js
   Authentication helpers (signup/login/logout) for DevBlog.
   Exposes DevBlog.auth with signin/signup/logout/getCurrentUser.
   Password storage uses btoa(password + '|' + email) (DEMO ONLY).
*/
(function () {
  const ns = window.DevBlog = window.DevBlog || {};
  const storage = ns.storage;

  // Hashing function (DEMO only)
  function hashPassword(password, email) {
    return btoa(password + '|' + email);
  }

  function findUserByEmail(email) {
    const users = storage.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  // Signup -> returns { success, error, user }
  function signup({name, email, password}) {
    if (!name || !email || !password) return { success:false, error:'Missing fields' };
    if (!/^\S+@\S+\.\S+$/.test(email)) return { success:false, error:'Invalid email' };
    if (findUserByEmail(email)) return { success:false, error:'Email already used' };

    const users = storage.getUsers();
    const user = {
      id: 'user-' + storage.uuid(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwdHash: hashPassword(password, email),
      createdAt: new Date().toISOString()
    };
    users.push(user);
    storage.saveUsers(users);
    storage.setSession({ userId: user.id, expiresAt: null });
    return { success:true, user };
  }

  // Login -> returns { success, error, user }
  function login({email, password}) {
    if (!email || !password) return { success:false, error:'Missing fields' };
    const user = findUserByEmail(email);
    if (!user) return { success:false, error:'Wrong email or password' };
    if (user.passwdHash !== hashPassword(password, email)) return { success:false, error:'Wrong email or password' };
    storage.setSession({ userId: user.id, expiresAt: null });
    return { success:true, user };
  }

  function logout() {
    storage.setSession(null);
    return true;
  }

  function getCurrentUser() {
    const session = storage.getSession();
    if (!session || !session.userId) return null;
    const users = storage.getUsers();
    return users.find(u => u.id === session.userId) || null;
  }

  ns.auth = {
    signup,
    login,
    logout,
    getCurrentUser,
    findUserByEmail
  };
})();

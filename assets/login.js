/**
 * login.js — dipakai di halaman login GitHub Pages
 * Ganti APPS_SCRIPT_URL dengan URL Web App hasil deploy
 * (Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone)
 */

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx6S2h0GnwaTcAZ6Huykq6Qygr2DNXDNpNsm0dauVvZ84Ep-i7e3WLHtwRnEdzw_hg/exec';

async function login(username, password) {
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      // Sengaja text/plain, BUKAN application/json, supaya browser
      // tidak mengirim preflight OPTIONS (Apps Script tidak menanganinya).
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'login', username, password })
    });

    const data = await res.json();

    if (data.success) {
      // Simpan sesi di localStorage (ini kode produksi di GitHub Pages,
      // bukan artifact Claude — localStorage aman dipakai di sini)
      localStorage.setItem('induk_token', data.token);
      localStorage.setItem('induk_role', data.role);
      localStorage.setItem('induk_nama', data.nama);
      return { success: true, role: data.role, nama: data.nama };
    } else {
      return { success: false, error: data.error };
    }
  } catch (err) {
    return { success: false, error: 'Gagal terhubung ke server. Coba lagi.' };
  }
}

async function checkSession() {
  const token = localStorage.getItem('induk_token');
  if (!token) return { valid: false };

  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: 'validateSession', token })
  });
  const data = await res.json();

  if (!data.success) {
    localStorage.removeItem('induk_token');
    return { valid: false };
  }
  return { valid: true, role: data.role, username: data.username };
}

async function logout() {
  const token = localStorage.getItem('induk_token');
  await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: 'logout', token })
  });
  localStorage.clear();
  window.location.href = 'login.html';
}

// Contoh pemakaian di form login:
//
// document.getElementById('loginForm').addEventListener('submit', async (e) => {
//   e.preventDefault();
//   const username = document.getElementById('username').value;
//   const password = document.getElementById('password').value;
//   const result = await login(username, password);
//   if (result.success) {
//     window.location.href = 'dashboard.html';
//   } else {
//     document.getElementById('errorMsg').textContent = result.error;
//   }
// });

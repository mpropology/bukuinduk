/**
 * api.js
 * ============================================================
 * Semua fungsi di sini "ngobrol" ke Apps Script lewat fetch().
 * Dimuat SETELAH config.js di tiap halaman HTML, supaya
 * APPS_SCRIPT_URL sudah tersedia.
 * ============================================================
 */

/**
 * Fungsi pembantu inti — semua fungsi lain di bawah memakai ini.
 * Kirim POST dengan Content-Type: text/plain (sengaja, biar
 * browser tidak kirim preflight OPTIONS yang bikin gagal diam-diam).
 */
async function panggilBackend(payload) {
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: 'Gagal terhubung ke server. Cek koneksi internet.' };
  }
}

/* ============================================================
 * AUTENTIKASI
 * ============================================================ */

async function login(username, password) {
  const data = await panggilBackend({ action: 'login', username, password });
  if (data.success) {
    localStorage.setItem('induk_token', data.token);
    localStorage.setItem('induk_role', data.role);
    localStorage.setItem('induk_nama', data.nama);
  }
  return data;
}

async function checkSession() {
  const token = localStorage.getItem('induk_token');
  if (!token) return { valid: false };

  const data = await panggilBackend({ action: 'validateSession', token });
  if (!data.success) {
    localStorage.removeItem('induk_token');
    return { valid: false };
  }
  return { valid: true, role: data.role, username: data.username };
}

async function logout() {
  const token = localStorage.getItem('induk_token');
  await panggilBackend({ action: 'logout', token });
  localStorage.clear();
  window.location.href = 'login.html';
}

/**
 * Dipasang di AWAL setiap halaman selain login.html.
 * Kalau sesi tidak valid, langsung dilempar ke login.html
 * sebelum konten halaman sempat kelihatan.
 */
async function wajibLogin() {
  const hasil = await checkSession();
  if (!hasil.valid) {
    window.location.href = 'login.html';
  }
  return hasil;
}

/* ============================================================
 * DATA SISWA
 * ============================================================ */

async function ambilStatistikDashboard() {
  return panggilBackend({ action: 'dashboardStats' });
}

async function ambilRingkasanKlapper() {
  return panggilBackend({ action: 'klapperSummary' });
}

async function cariSiswa(params) {
  return panggilBackend({ action: 'searchStudents', params });
}

async function ambilSiswa(nis) {
  return panggilBackend({ action: 'getStudent', nis });
}

async function simpanSiswa(dataSiswa) {
  const token = localStorage.getItem('induk_token');
  return panggilBackend({ action: 'saveStudent', token, data: dataSiswa });
}

/* ============================================================
 * OCR
 * ============================================================ */

/**
 * Terima objek File dari <input type="file">, ubah jadi base64,
 * kirim ke backend untuk dipindai.
 */
async function pindaiGambar(fileGambar) {
  const base64 = await fileKeBase64(fileGambar);
  const token = localStorage.getItem('induk_token');
  return panggilBackend({
    action: 'ocrGambar',
    token,
    base64Image: base64,
    mimeType: fileGambar.type
  });
}

function fileKeBase64(file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onload = function () {
      // reader.result formatnya "data:image/jpeg;base64,XXXXX"
      // kita cuma butuh bagian setelah koma
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

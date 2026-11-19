'use strict';
/* ===== Util ===== */
const $ = s => document.querySelector(s);
const pad = n => String(n).padStart(2, '0');
const I = n => `<svg class="i"><use href="#i-${n}"/></svg>`;
const dkey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const hh = h => `${pad(Math.floor(h))}.${pad(Math.round((h%1)*60))}`;
const tm = d => `${pad(d.getHours())}.${pad(d.getMinutes())}`;
const fd = (d, o) => d.toLocaleDateString('id-ID', o || {weekday:'long', day:'numeric', month:'long', year:'numeric'});
const sd = d => fd(d, {day:'numeric', month:'short', year:'numeric'});
const add = (d, m) => new Date(d.getTime() + m*60000);
const hash = s => [...s].reduce((a, c) => (a*31 + c.charCodeAt(0)) >>> 0, 7);
const toast = m => { const t = $('#toast'); t.textContent = m; t.className = 'on'; clearTimeout(toast.t); toast.t = setTimeout(() => t.className = '', 2600); };
const OPEN = 10, CLOSE = 16;

/* ===== Data simulasi ===== */
const DIR = {'255150201111045':'M Najih Salmas Sabil','25510207111033':'Rindu Alisa','255150200111062':'Naira Ayudhya Binastana','255150200111059':'Rizal Ghany Cahyadi'};
const T0 = new Date(), nextH = Math.min(Math.max(Math.ceil(T0.getHours()+T0.getMinutes()/60), OPEN), CLOSE-1);
let seq = 21;
const mk = (o) => Object.assign({date: dkey(T0), dur: 60, status: 'wait', code: `GC-${pad(T0.getDate())}${pad(T0.getMonth()+1)}${String(T0.getFullYear()).slice(2)}-0${seq++}`}, o);
const S = {
  user: null, route: '', open: {}, scanned: false, chk: {}, notif: [],
  units: ['01','02','03','04'].map(n => ({id: 'PS5-'+n, inv: 'GC-INV-0'+n, loc: 'Game Corner FILKOM', st: 'Aktif', why: ''})),
  B: [
    mk({unit:'PS5-02', who:'Dito Prakoso', nim:'-', h:T0.getHours(), status:'run', tEnd: add(T0, 25)}),
    mk({unit:'PS5-04', who:'Sinta Laras', nim:'-', h:T0.getHours(), status:'ret', tEnd: T0}),
    mk({unit:'PS5-01', who:'Raka Aditya', nim:'-', h:nextH}),
    mk({unit:'PS5-03', who:'Nadia Putri', nim:'-', h:Math.min(nextH+1, CLOSE-1)}),
    ...[1,2,3].map(i => mk({unit:'PS5-0'+i, who:'me', h:10+i, status:'done', date: dkey(add(T0, -1440*i)), code:`GC-H0${i}-0${10+i}`}))
  ],
  R: [
    {id:'KR-024', unit:'PS5-04', at:add(T0,-1440*6), text:'tv-nya mati', st:'Selesai', by:'Bima Santoso', who:'-', code:'-', note:''},
    {id:'KR-025', unit:'PS5-02', at:add(T0,-1440*2), text:'tes, mas bima', st:'Selesai', by:'Bima Santoso', who:'-', code:'-', note:''}
  ],
  tx: [], form: {unit:'PS5-01', date: dkey(T0), time: '', dur: 60}, range: 14, selR: null, edit: null, fmt: 'PDF', ex: {unit:'all'}
};
S.B.forEach(b => { if (b.status === 'done') { b.ret = new Date(); b.ok = true; } });
const me = () => S.B.find(b => b.who === 'me' && ['wait','run','ret'].includes(b.status));
const start = b => { const [y,m,d] = b.date.split('-'); return new Date(y, m-1, d, Math.floor(b.h), (b.h%1)*60); };
const U = id => S.units.find(u => u.id === id);
const state = u => {
  if (u.st !== 'Aktif') return {s:'m'};
  const b = S.B.find(b => b.unit === u.id && ['run','ret'].includes(b.status));
  return b ? {s:'u', end: b.tEnd} : {s:'f'};
};
const seeded = (u, d, h) => d !== dkey(T0) || h > T0.getHours() ? hash(u+d+Math.floor(h)) % 5 === 0 : false;
function conflict(u, d, h, dur) {
  const a = h*60, z = a + dur;
  if (seeded(u, d, Math.floor(h)) || (dur > 30 && seeded(u, d, Math.floor(h)+1) && (h%1 + dur/60) > 1 - (h%1 ? 0 : 0) && Math.floor((h*60+dur-1)/60) > Math.floor(h))) return true;
  return S.B.some(b => b.unit === u && b.date === d && ['wait','run','ret'].includes(b.status) && a < b.h*60 + b.dur && b.h*60 < z);
}
function times() {
  const f = S.form, out = [];
  for (let h = OPEN; h + f.dur/60 <= CLOSE; h += .5) {
    if (f.date === dkey(T0) && h*60 < T0.getHours()*60 + T0.getMinutes()) continue;
    out.push(h);
  }
  return out;
}

/* ===== QR visual (simulasi, bukan QR terstandar) ===== */
function qr(code) {
  let r = hash(code), c = '', n = 21;
  const fin = (x, y) => [[0,0],[n-7,0],[0,n-7]].some(([a,b]) => x>=a && x<a+7 && y>=b && y<b+7);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let on;
    if (fin(x, y)) { const [a,b] = [[0,0],[n-7,0],[0,n-7]].find(([a,b]) => x>=a && x<a+7 && y>=b && y<b+7); const dx = x-a, dy = y-b; on = dx==0||dx==6||dy==0||dy==6||(dx>1&&dx<5&&dy>1&&dy<5); }
    else { r = (r*1664525 + 1013904223) >>> 0; on = r >> 28 & 1; }
    if (on) c += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }
  return `<svg class="qr" viewBox="-1 -1 23 23" fill="#14213d" role="img" aria-label="QR ${code}">${c}</svg>`;
}

/* ===== Layout ===== */
const note = (t, h, k = '', ic = 'info') => `<div class="note ${k}">${I(ic)}<div><b>${t}</b><span>${h}</span></div></div>`;
const head = role => `<header class="top"><div class="logo">${I('pad')}</div><div class="t"><b>Game Corner <span class="blue">FILKOM</span></b><br><small>Universitas Brawijaya</small></div><button class="ibtn" data-act="${role==='m'?'bell':'acct'}" aria-label="${role==='m'?'Notifikasi':'Akun petugas'}">${I(role==='m'?'bell':'shield')}</button></header>`;
const tabs = (items, on) => `<nav class="tabs">${items.map(([h, ic, l]) => `<a href="#${h}" class="${on===h?'on':''}">${I(ic)}${l}</a>`).join('')}</nav>`;
const MT = [['/m/home','home','Beranda'],['/m/ticket','ticket','Tiket'],['/m/history','hist','Riwayat'],['/m/profile','user','Profil']];
const PT = [['/p/home','home','Beranda'],['/p/checkin','scan','Pindai'],['/p/history','hist','Riwayat']];
const shell = (role, on, body, T) => `<div class="phone">${head(role)}<main>${body}<p class="mut sm" style="margin-top:28px">${fd(T0)}</p></main>${tabs(T, on)}</div>`;
const AT = [['/a/stats','chart','Statistik'],['/a/damage','clip','Laporan kerusakan'],['/a/units','pad','Data unit PS5'],['/a/export','dl','Export laporan']];
const admin = (on, crumb, title, sub, body) => `<div class="adm"><aside class="side"><div class="logo">${I('pad')}</div><h2>Game Corner <span class="blue">FILKOM</span></h2><p class="mut sm hide">Fakultas Ilmu Komputer<br>Universitas Brawijaya</p><nav style="margin-top:18px">${AT.map(([h,ic,l]) => `<a href="#${h}" class="${on===h?'on':''}">${I(ic)}${l}</a>`).join('')}</nav>
${note('Akses berbasis SSO','Data identitas dikelola kampus. Tidak menyimpan KTP fisik.')}<p class="b" style="margin-top:18px">${S.user.name}</p><p class="mut sm">Admin sarana-prasarana</p><button class="link" data-act="logout">Keluar akun</button></aside>
<main><div class="q"><p class="mut sm">Portal admin / ${crumb}</p><span class="tag">Data simulasi</span></div><h1>${title}</h1><p class="mut">${sub}</p>${body}<p class="mut sm" style="margin-top:28px">${fd(T0)}</p></main></div>`;

/* ===== Halaman: login ===== */
const consoleSvg = `<svg viewBox="0 0 300 150" style="width:100%;max-width:300px;display:block;margin:auto" role="img" aria-label="PlayStation 5 dan controller"><rect x="70" y="8" width="62" height="130" rx="30" fill="#fff" stroke="#cfd8ec"/><rect x="92" y="14" width="18" height="118" rx="9" fill="#1b2a49"/><rect x="146" y="92" width="130" height="46" rx="23" fill="#fff" stroke="#cfd8ec"/><circle cx="178" cy="115" r="8" fill="#1b2a49"/><circle cx="244" cy="115" r="8" fill="#1b2a49"/><rect x="204" y="98" width="12" height="12" rx="2" fill="#2563eb"/></svg>`;
const V = {};
V['/login'] = () => `<div class="phone"><header class="top"><div class="logo" style="background:#13264a">${I('shield')}</div><div class="t"><b>Game Corner <span class="blue">FILKOM</span></b><br><small>Universitas Brawijaya</small></div></header><main>
<div class="console">${consoleSvg}</div><p class="blue sm b">JEDA KULIAH, MAIN LEBIH MUDAH.</p><h1 style="font-size:34px;margin-top:6px">Cek unit. Pesan slot. Tunjukkan tiket.</h1><p class="mut">Sistem Reservasi PS5 Fakultas Ilmu Komputer Universitas Brawijaya</p>
<div class="card" style="margin-top:22px"><h2 style="font-size:22px">Masuk dengan akun kampus</h2><div id="ferr" role="alert" class="sm" style="color:var(--red)"></div>
<label for="u">Akun SSO / NIM</label><input id="u" autocomplete="username" placeholder="Masukkan akun SSO atau NIM"><label for="p">Kata sandi SSO</label><input id="p" type="password" autocomplete="current-password" placeholder="Masukkan kata sandi">
<button class="btn p" data-act="login" style="margin-top:18px">${I('send')}Masuk</button><p class="mut sm">Portal mahasiswa, petugas, atau admin ditentukan otomatis sesuai hak akses akun Anda.</p>
<p class="sm" style="margin-top:10px">Coba cepat: <button class="link sm" data-act="demo" data-a="255150201111045">Mahasiswa</button> · <button class="link sm" data-act="demo" data-a="petugas">Petugas</button> · <button class="link sm" data-act="demo" data-a="admin">Admin</button></p></div>
${note('Perhatian pengguna!','Identitas diverifikasi melalui SSO/NIM. Tidak perlu mengunggah atau menitipkan KTP.')}<p class="mut sm" style="text-align:center">FILKOMAPPS</p></main></div>`;
V['/sso'] = () => `<div class="sso"><div><div class="spin"></div><h2>Menghubungkan ke SSO kampus…</h2><p>Halaman simulasi. Ganti dengan redirect SSO resmi UB bila sudah ada izin.</p></div></div>`;

/* ===== Mahasiswa ===== */
V['/m/home'] = () => {
  const free = S.units.filter(u => state(u).s === 'f').length, b = me();
  const cards = S.units.map(u => { const s = state(u); return `<div class="card unit ${s.s!=='f'?'x':''}">${I('pad')}<h3>${u.id}</h3><span class="tag ${s.s==='f'?'g':s.s==='u'?'y':'s'}">${s.s==='f'?'Kosong':s.s==='u'?'Terpakai':'Maintenance'}</span><p class="mut sm" style="margin-top:10px">${s.s==='f'?'Tersedia sekarang':s.s==='u'?'Estimasi tersedia<br>'+tm(s.end)+' WIB':'Tidak dapat dipesan'}</p>${s.s==='f'?`<button class="link sm" data-act="pick" data-a="${u.id}">Pesan unit ini</button>`:''}</div>`; }).join('');
  return shell('m', '/m/home', `<h1>Halo, ${S.user.name.split(' ')[0] === 'M' ? S.user.name.split(' ')[1] : S.user.name.split(' ')[0]} 👋</h1><p class="mut">Ada waktu luang? Temukan unit dan jadwal yang pas untukmu, sekarang!</p>
  <div class="hero" style="margin-top:16px"><b>${free}/${S.units.length}</b><div><div style="font-size:18px">Unit Tersedia Saat Ini</div><small>${sd(T0)} · ${tm(T0)} WIB</small></div></div>
  <div class="q" style="margin-top:20px"><h2>Ketersediaan PS5</h2><span class="mut sm">${S.units.length} unit</span></div><div class="grid2">${cards}</div><p class="mut sm">Status diperbarui setelah petugas mengonfirmasi penerimaan konsol.</p>
  <button class="btn p" data-go="/m/book">${I('ticket')}Booking Sekarang</button><h2 style="margin-top:20px">Tiket saya</h2>
  <div class="card">${b ? `<h3>${b.unit} · ${hh(b.h)} WIB</h3><p class="mut sm">${b.code} · ${{wait:'Menunggu check-in',run:'Sesi berjalan',ret:'Menunggu verifikasi'}[b.status]}</p><button class="link" data-go="/m/ticket">Lihat tiket →</button>` : `<h3>Belum ada reservasi</h3><p class="mut" style="margin:6px 0">Tiket QR dan sesi aktif akan muncul di sini setelah kamu membuat booking.</p><button class="link" data-go="/m/history">Lihat riwayat peminjaman →</button>`}</div>
  ${note('Jangan lewatkan jadwalmu','Setelah booking, kamu akan mendapat pengingat 15 menit sebelum jadwal bermain.')}`, MT);
};
V['/m/book'] = () => {
  const f = S.form, ts = times(), dates = [...Array(7)].map((_, i) => add(T0, 1440*i));
  if (!ts.includes(+f.time)) f.time = ts[0] ?? '';
  const ok = f.time !== '' && !conflict(f.unit, f.date, +f.time, f.dur) && U(f.unit).st === 'Aktif';
  const sl = []; for (let h = OPEN; h < CLOSE; h++) { const sel = f.time !== '' && h >= +f.time && h*60 < +f.time*60 + f.dur && ok; sl.push(`<div class="slot ${sel?'s':seeded(f.unit,f.date,h)||S.B.some(b=>b.unit===f.unit&&b.date===f.date&&['wait','run','ret'].includes(b.status)&&h*60<b.h*60+b.dur&&b.h*60<h*60+60)?'':'f'}">${hh(h)}<small>${sel?'Dipilih':seeded(f.unit,f.date,h)||S.B.some(b=>b.unit===f.unit&&b.date===f.date&&['wait','run','ret'].includes(b.status)&&h*60<b.h*60+b.dur&&b.h*60<h*60+60)?'Terisi':'Tersedia'}</small></div>`); }
  const [y,m,d] = f.date.split('-'), D = new Date(y, m-1, d), e = f.time === '' ? '' : hh(+f.time + f.dur/60);
  return shell('m', '/m/ticket', `<h1>Booking slot</h1><p class="mut">Pilih unit dan waktu bermain. Ketersediaan diperiksa sebelum reservasi.</p>
  <div class="card"><h2>Pilih jadwal</h2><b class="sm">Unit PlayStation 5</b><div class="chips" style="margin-top:8px">${S.units.map(u => `<button class="chip ${f.unit===u.id?'on':''}" ${u.st!=='Aktif'?'disabled':''} data-act="funit" data-a="${u.id}">${u.id}</button>`).join('')}</div>
  <label for="fd">Tanggal</label><select id="fd" data-f="date">${dates.map(x => `<option value="${dkey(x)}" ${dkey(x)===f.date?'selected':''}>${fd(x)}</option>`).join('')}</select>
  <label for="ft">Jam mulai</label><select id="ft" data-f="time">${ts.map(h => `<option value="${h}" ${h==f.time?'selected':''}>${hh(h)} WIB</option>`).join('') || '<option>Tidak ada jam tersisa</option>'}</select>
  <label for="fu">Durasi bermain</label><select id="fu" data-f="dur">${[30,60,90].map(x => `<option value="${x}" ${x==f.dur?'selected':''}>${x} menit</option>`).join('')}</select></div>
  <div class="q"><h2>Jadwal ${f.unit}</h2><span class="mut sm">${sd(D)}</span></div><div class="slots">${sl.join('')}</div>
  <button class="btn" data-act="check">${I('hist')}Cek ketersediaan</button>
  ${ok ? note('Slot tersedia untuk dipesan', `${f.unit}, ${sd(D)} pukul ${hh(+f.time)}–${e} WIB tidak bertabrakan dengan reservasi lain.`, 'g', 'ok') : note('Slot tidak tersedia', 'Pilih jam atau unit lain. Slot yang terisi tidak dapat dipesan.', 'y', 'warn')}
  <div class="card"><h2>Ringkasan reservasi</h2><div class="row"><span>Mahasiswa</span><span>${S.user.name}</span></div><div class="row"><span>Unit</span><span>${f.unit}</span></div><div class="row"><span>Tanggal</span><span>${sd(D)}</span></div><div class="row"><span>Sesi</span><span>${f.time===''?'-':hh(+f.time)+'–'+e+' WIB · '+f.dur+' menit'}</span></div></div>
  <button class="btn p" data-act="book" ${ok?'':'disabled'}>${I('ticket')}Konfirmasi Booking</button><button class="btn" data-go="/m/home">Batal</button>`, MT);
};
V['/m/ticket'] = () => {
  const b = me(); if (!b) return location.hash = '#/m/book', '';
  if (b.status === 'run') return location.hash = '#/m/session', '';
  if (b.status === 'ret') return location.hash = '#/m/session', '';
  const s = start(b);
  return shell('m', '/m/ticket', `<h1>Booking berhasil!</h1><p class="mut">Slotmu sudah tersimpan. Datang ke Game Corner FILKOM untuk check-in.</p>
  <div class="ticket"><div class="hd"><small>TIKET GAME CORNER FILKOM</small><h2>${b.unit}</h2>${sd(s)} · ${hh(b.h)}–${hh(b.h+b.dur/60)} WIB</div><div class="bd"><span class="tag">Menunggu check-in</span>${qr(b.code)}<div class="code">${b.code}</div>
  <div class="row"><span>Mahasiswa</span><span>${S.user.name}</span></div><div class="row"><span>NIM</span><span>${S.user.nim}</span></div><div class="row"><span>Durasi</span><span>${b.dur} menit</span></div><div class="row"><span>Lokasi</span><span>Game Corner FILKOM</span></div></div></div>
  ${note('Tunjukkan QR ke petugas','Petugas harus verifikasi QR dan memeriksa hardware sebelum unit diserahkan. Timer dimulai setelah verifikasi selesai.')}${note('Pengingat H-15 menit · '+tm(add(s,-15))+' WIB','Notifikasi akan muncul 15 menit sebelum '+hh(b.h)+' WIB.','y','bell')}
  <button class="btn p" data-act="save">${I('dl')}Simpan tiket</button><button class="btn" data-go="/m/home">Kembali ke beranda</button><button class="btn d" data-act="cancel">Batalkan booking</button>`, MT);
};
V['/m/session'] = () => {
  const b = me(); if (!b || b.status === 'wait') return location.hash = '#/m/ticket', '';
  const ret = b.status === 'ret';
  return shell('m', '/m/ticket', `<h1>Sesi sedang berjalan</h1><p class="mut">${b.unit} · ${S.user.name} · ${b.code}</p>
  <div class="timer" style="margin-top:16px"><small>SISA WAKTU BERMAIN</small><b id="tm">--:--</b><small id="tn"></small><div class="bar"><i id="tb" style="width:0"></i></div><small id="tl"></small></div><div id="warn"></div>
  <div class="card"><div class="row"><span>Unit</span><span>${b.unit} · Game Corner FILKOM</span></div><div class="row"><span>Mulai</span><span>${tm(b.tStart)} WIB · diserahkan petugas</span></div><div class="row"><span>Selesai</span><span>${tm(b.tEnd)} WIB</span></div><p class="mut sm">Timer dimulai setelah petugas mengonfirmasi penyerahan unit, bukan saat booking dibuat.</p></div>
  ${ret ? '' : `<button class="btn p" data-act="ret">${I('scan')}Selesai / Kembalikan Unit</button><button class="link sm" data-act="skip">Demo: lompat ke 5 menit terakhir</button>`}
  ${ret ? `<h2>QR Pengembalian</h2><div class="card" style="text-align:center"><span class="tag y">Menunggu verifikasi petugas</span>${qr('R'+b.code)}<p>QR pengembalian · ${b.code}</p><p class="mut sm">Tunjukkan QR ini dan serahkan konsol kepada petugas.</p></div>` : ''}`, MT);
};
V['/m/history'] = () => {
  const l = S.B.filter(b => b.who === 'me' && ['done','cancel'].includes(b.status)).reverse();
  return shell('m', '/m/history', `<h1>Riwayat peminjaman</h1><p class="mut">Semua sesi dan hasil pengembalianmu, tersimpan dalam satu tempat.</p>
  <div class="q" style="margin-top:14px"><h2>${l.length} peminjaman</h2><span class="mut sm">Terbaru dahulu</span></div>${l.map(b => `<div class="card"><div class="q"><h3 style="font-size:20px">${b.unit}</h3><span class="tag ${b.status==='done'?'g':'s'}">${b.status==='done'?'Selesai':'Dibatalkan'}</span></div><p style="margin:8px 0">${sd(start(b))} · ${hh(b.h)}–${hh(b.h+b.dur/60)}</p><p class="mut sm">${b.code} · ${b.dur} menit</p>
  ${S.open[b.code] ? `<div class="row"><span>Dikembalikan</span><span>${b.ret ? sd(b.ret)+', '+tm(b.ret) : '-'}</span></div><div class="row"><span>Pemeriksaan</span><span>${b.ok ? 'Lengkap & baik' : 'Ada temuan'}</span></div><div class="row"><span>Diverifikasi</span><span>Bima Santoso · Petugas</span></div>` : ''}
  <button class="link" data-act="open" data-a="${b.code}">${S.open[b.code] ? 'Tutup detail ↑' : 'Lihat detail ↓'}</button></div>`).join('') || '<div class="card"><p class="mut">Belum ada riwayat. Booking pertamamu akan muncul di sini.</p></div>'}<p class="mut sm" style="text-align:center">Semua riwayat sudah ditampilkan.</p>`, MT);
};
V['/m/profile'] = () => shell('m', '/m/profile', `<h1>Profil saya</h1><p class="mut">Identitas kampus yang digunakan untuk reservasi dan verifikasi peminjaman.</p>
  <div class="card" style="text-align:center"><div class="logo" style="width:84px;height:84px;border-radius:50%;margin:8px auto;font-size:30px">${S.user.name[0]}</div><h2 style="font-size:24px">${S.user.name}</h2><span class="tag g">Mahasiswa</span></div>
  <div class="card"><h2>Identitas mahasiswa</h2>${[['Nama lengkap', S.user.name],['NIM', S.user.nim],['Peran akun','Mahasiswa']].map(([l, v]) => `<label>${l}</label><input readonly value="${v}">`).join('')}</div>
  ${note('Privasimu terjaga!','Penitipan KTP fisik sudah tidak berlaku, gunakan layanan Game Corner FILKOM untuk bermain!')}<button class="btn" data-act="logout">${I('out')}Keluar akun</button>`, MT);

/* ===== Petugas ===== */
const pend = k => S.B.filter(b => b.status === k && b.who).sort((a, z) => start(a) - start(z));
const who = b => b.who === 'me' ? S.user.name : b.who;
const nim = b => b.who === 'me' ? S.user.nim : (b.nim === '-' ? '2551502' + (hash(b.who) % 100000000) : b.nim);
V['/p/home'] = () => {
  const ci = pend('wait'), rt = pend('ret'), q = [...rt.map(b => [b, 'ret']), ...ci.map(b => [b, 'wait'])];
  return shell('p', '/p/home', `<h1>Selamat ${T0.getHours()<11?'pagi':T0.getHours()<15?'siang':T0.getHours()<18?'sore':'malam'}, Bima</h1><p class="mut">${fd(T0)} · Diperbarui ${tm(T0)} WIB</p>
  <div class="grid2" style="margin-top:14px"><div class="card" style="margin:0"><b class="blue" style="font-size:32px">${ci.length}</b><p class="mut sm">Check-in berikutnya</p></div><div class="card" style="margin:0"><b class="blue" style="font-size:32px">${rt.length}</b><p class="mut sm">Menunggu kembali</p></div></div>
  <button class="btn p" data-go="/p/checkin">${I('scan')}Scan QR Check-in</button><button class="btn" data-go="/p/return">${I('scan')}Scan QR Pengembalian</button><h2 style="margin-top:18px">Antrean hari ini</h2>
  ${q.map(([b, k]) => `<div class="card" data-act="queue" data-a="${b.code}|${k}" style="cursor:pointer"><div class="q"><span class="tag ${k==='ret'?'y':''}">${k==='ret'?'Pengembalian':'Check-in'}</span><b>${hh(b.h)} WIB</b></div><h3 style="margin:10px 0 4px;font-size:18px">${who(b)} · ${b.unit}</h3><p class="mut sm">${k==='ret'?'Menunggu pemeriksaan hardware':'Booking terkonfirmasi · belum diserahkan'}</p><p class="mut sm">${b.code}</p></div>`).join('') || '<div class="card mut">Tidak ada antrean saat ini.</div>'}
  ${note('Pemeriksaan fisik tetap diperlukan','QR memvalidasi transaksi. Kondisi controller, kabel, dan aksesoris diperiksa langsung oleh petugas.')}<button class="btn" data-go="/p/history">${I('hist')}Riwayat transaksi harian</button>`, PT);
};
function scanPage(kind) {
  const ret = kind === 'ret', b = S.B.find(x => x.code === S.sel && x.status === (ret ? 'ret' : 'wait')), ck = S.chk, all = ck.id !== false && ck.c && ck.k && ck.a && (ret || ck.id);
  const items = [['c','Controller / stick','2 controller · tombol & analog berfungsi'],['k','Kabel','HDMI, daya, dan USB · lengkap & baik'],['a','Aksesoris','Perlengkapan unit lengkap & baik']];
  return shell('p', '/p/checkin', `<h1>Scan QR ${ret?'Pengembalian':'Check-in'}</h1><p class="mut">${ret?'Sesi belum selesai sampai pengembalian dan pemeriksaan fisik dikonfirmasi.':'Validasi tiket, cocokkan identitas, lalu periksa hardware sebelum penyerahan.'}</p>
  <button class="scan" data-act="scan" data-a="${kind}"><div class="fr">${I('scan')}</div>Arahkan QR ${ret?'pengembalian':'tiket'} ke kamera<br><small>Simulasi: ketuk untuk memindai antrean berikutnya</small></button>
  ${!b ? '<div class="card mut">Belum ada tiket dipindai.</div>' : `<div class="card"><div class="q"><b class="blue">${b.code}</b><span class="tag ${ret?'y':'g'}">${ret?'QR valid · menunggu verifikasi':'Booking valid'}</span></div><div class="row"><span>Nama</span><span>${who(b)}</span></div><div class="row"><span>NIM</span><span>${nim(b)}</span></div><div class="row"><span>Unit</span><span>${b.unit}</span></div><div class="row"><span>Jadwal</span><span>${sd(start(b))}<br>${hh(b.h)}–${hh(b.h+b.dur/60)} WIB · ${b.dur} menit</span></div>
  ${ret ? '' : `<label class="ck"><input type="checkbox" data-ck="id" ${ck.id?'checked':''}><span><b>Identitas digital cocok</b><span class="mut sm">Nama dan NIM sudah dicocokkan dengan akun SSO mahasiswa.</span></span></label>`}</div>
  <div class="card"><h2>${ret?'Checklist setelah penggunaan':'Checklists'}</h2>${items.map(([k, t, d]) => `<label class="ck" style="margin:0 0 6px"><input type="checkbox" data-ck="${k}" ${ck[k]?'checked':''}><span><b>${t}</b><span class="mut sm">${d}</span></span></label>`).join('')}<span class="tag ${all?'g':'y'}">${items.filter(([k]) => ck[k]).length} dari 3 item telah diperiksa</span></div>
  ${note(all ? (ret?'Siap dikonfirmasi':'Siap diserahkan · '+hh(b.h)+'–'+hh(b.h+b.dur/60)+' WIB') : 'Lengkapi pemeriksaan', all ? (ret?'Konfirmasi akan mengubah transaksi menjadi Selesai dan memperbarui ketersediaan '+b.unit+'.':'Timer dimulai setelah kamu menyerahkan unit.') : 'Centang semua item sebelum melanjutkan.', all?'g':'y', all?'ok':'warn')}
  <button class="btn p" data-act="${ret?'doret':'hand'}" ${all?'':'disabled'}>${I('ok')}${ret?'Konfirmasi Pengembalian':'Serahkan Unit'}</button>
  ${ret ? `<button class="btn d" data-go="/p/damage">${I('warn')}Laporkan Kerusakan</button><p class="mut sm">Laporkan Kerusakan hanya jika pemeriksaan menemukan masalah.</p>` : ''}<button class="btn" data-act="rescan">${ret?'Batal / pindai ulang':'Batal / pindai ulang'}</button>`}`, PT);
}
V['/p/checkin'] = () => scanPage('wait');
V['/p/return'] = () => scanPage('ret');
V['/p/damage'] = () => {
  const b = S.B.find(x => x.code === S.sel && x.status === 'ret'); if (!b) return location.hash = '#/p/return', '';
  return shell('p', '/p/checkin', `<h1>Laporan kerusakan</h1><p class="mut">Cabang kondisional: diisi hanya saat petugas menemukan kerusakan pada hardware.</p>
  <div class="card"><span class="tag">Referensi terisi otomatis</span>${[['Unit', b.unit],['Transaksi', b.code],['Mahasiswa', who(b)+' · '+nim(b)]].map(([l, v]) => `<label>${l}</label><input readonly value="${v}">`).join('')}</div>
  <label for="dt">Deskripsi kerusakan *</label><textarea id="dt" placeholder="Contoh: analog kiri controller drift"></textarea><div class="dz">${I('cam')}<p class="sm">Unggah foto belum tersedia di prototipe</p></div>
  ${note('Diteruskan ke admin sarpras','Status unit diperbarui admin; pengembalian tetap diverifikasi petugas.')}<button class="btn p" data-act="report">${I('send')}Kirim Laporan Kerusakan</button><button class="btn" data-go="/p/return">Batal</button>`, PT);
};
V['/p/history'] = () => {
  const f = S.pf || 'all', l = S.tx.filter(t => f === 'all' || t.k === f);
  return shell('p', '/p/history', `<h1>Transaksi hari ini</h1><p class="mut">Seluruh serah-terima hari ini, ${fd(T0, {day:'numeric',month:'long',year:'numeric'})}. Petugas: Bima Santoso.</p>
  <div class="chips">${[['all','Semua'],['ci','Check-in'],['rt','Kembali']].map(([k, t]) => `<button class="chip ${f===k?'on':''}" data-act="pf" data-a="${k}">${t}</button>`).join('')}</div>
  <h2 style="margin-top:18px">${S.tx.length} serah-terima</h2>${l.map(t => `<div class="card"><div class="q"><b>${t.t} WIB</b><span class="tag ${t.k==='rt'?'g':''}">${t.k==='rt'?'Kembali':'Check-in'}</span></div><p style="margin:8px 0 2px">${t.unit} · ${t.who}</p><p class="mut sm">${t.code}</p><p class="b sm" style="color:${t.bad?'var(--amber)':'var(--green)'}">${t.msg}</p></div>`).join('') || '<div class="card mut">Belum ada transaksi.</div>'}`, PT);
};

/* ===== Admin ===== */
function stats() {
  const k = S.range/14, base = [28,24,20,24], hrs = [10,14,20,24,18,10], sel = S.ex.unit;
  const per = S.units.map((u, i) => { const real = S.B.filter(b => b.unit === u.id && b.status === 'done' && b.ok !== undefined && b.who !== 'me' || b.unit === u.id && b.status === 'done' && b.who === 'me' && b.code.startsWith('GC-H') === false).length; return {u: u.id, n: Math.round((base[i] ?? 20) * k) + real}; }).filter(p => sel === 'all' || p.u === sel);
  const tot = per.reduce((a, p) => a + p.n, 0), obs = 40 * k * per.length, bars = hrs.map(h => Math.round(h * k * tot / (96 * k * S.units.length / per.length || 1) * per.length / S.units.length));
  const bs = hrs.map(h => Math.round(h * tot / 96)), pk = Math.max(...bs);
  return {per, tot, obs, bs, pk, occ: Math.round(tot / obs * 100), open: S.R.filter(r => r.st !== 'Selesai').length};
}
const dr = () => `${sd(add(T0, -S.range*1440 + 1440))} – ${sd(T0)}`;
V['/a/stats'] = () => { const s = stats(), pi = s.bs.indexOf(s.pk), r = S.R.find(x => x.st !== 'Selesai');
  return admin('/a/stats', 'Statistik', 'Statistik penggunaan', 'Pantau pemanfaatan unit PS5 dan tentukan tindak lanjut sarana.', `
  <div class="filters" style="margin:18px 0"><div><label for="r">Rentang tanggal</label><select id="r" data-f="range">${[7,14,30].map(x => `<option value="${x}" ${S.range==x?'selected':''}>${x} hari terakhir</option>`).join('')}</select><span class="mut sm">${dr()}</span></div><div><label for="un">Unit</label><select id="un" data-f="exu"><option value="all">Semua unit (${S.units.length})</option>${S.units.map(u => `<option ${S.ex.unit===u.id?'selected':''}>${u.id}</option>`).join('')}</select></div><div><button class="btn p" data-go="/a/export" style="margin:0">${I('dl')}Export laporan</button></div></div>
  <div class="kpi">${[['Sesi selesai', s.tot, 'Pengembalian terkonfirmasi'],['Total pemakaian', s.tot+' jam', 'Akumulasi durasi sesi'],['Okupansi rata-rata', s.occ+'%', s.tot+' dari '+Math.round(s.obs)+' jam observasi'],['Kerusakan terbuka', s.open+' laporan', S.R.filter(x => x.st !== 'Selesai').map(x => x.id).join(', ') || 'Tidak ada']].map(([a, b, c]) => `<div class="card"><span class="mut sm">${a}</span><b>${b}</b><span class="mut sm">${c}</span></div>`).join('')}</div>
  <div class="split"><div class="card"><div class="q"><h2>Jam mulai paling ramai</h2><span class="mut sm">${s.tot} sesi</span></div><div class="bars">${s.bs.map((v, i) => `<div class="${i===pi?'pk':''}"><b>${v}</b><i style="height:${v/s.pk*75}%"></i><span class="mut">${10+i}.00</span></div>`).join('')}</div><span class="tag">Puncak: ${10+pi}.00 WIB · ${s.pk} sesi (${Math.round(s.pk/s.tot*100)}%)</span></div>
  <div class="card"><h2>Okupansi per unit</h2>${s.per.map(p => { const o = Math.round(p.n/(40*S.range/14)*100); return `<div class="q b sm"><span>${p.u}</span><span class="blue">${o}% · ${p.n} jam</span></div><div class="meter"><i style="width:${Math.min(o,100)}%"></i></div>`; }).join('')}</div></div>
  ${r ? note(`${r.unit} dalam maintenance`, `Laporan ${r.id} dari ${r.by}: ${r.text}`, 'y', 'bell') : ''}<div class="acts"><a class="btn" href="#/a/damage">Lihat laporan kerusakan</a><a class="btn" href="#/a/units">Kelola master unit</a></div>`); };
V['/a/damage'] = () => {
  const sel = S.R.find(r => r.id === S.selR) || S.R[S.R.length-1];
  return admin('/a/damage', 'Laporan kerusakan', 'Laporan riwayat kerusakan', 'Temuan petugas dan tindak lanjut perbaikan hardware Game Corner.', `<p class="mut sm" style="text-align:right">${S.R.length} laporan · ${S.R.filter(r => r.st !== 'Selesai').length} perlu tindak lanjut</p>
  <div class="split"><div class="card" style="padding:0;overflow-x:auto"><h2 style="padding:16px 16px 0">Laporan dari petugas</h2><table><tr><th>LAPORAN<th>UNIT<th>TANGGAL<th>TEMUAN<th>STATUS</tr>${[...S.R].reverse().map(r => `<tr class="${r===sel?'on':''}" data-act="selr" data-a="${r.id}"><td class="blue">${r.id}<td>${r.unit}<td class="sm mut">${sd(r.at)}<br>${tm(r.at)}<td>${r.text}<td><span class="tag ${r.st==='Selesai'?'g':'y'}">${r.st}</span></tr>`).join('')}</table></div>
  <div class="card"><h2>Detail ${sel.id}</h2><span class="tag ${sel.st==='Selesai'?'g':'y'}">${sel.st}</span>${[['Unit', sel.unit],['Transaksi', sel.code],['Mahasiswa', sel.who],['Pelapor', sel.by+' · Petugas'],['Dilaporkan', sd(sel.at)+' · '+tm(sel.at)]].map(([l, v]) => `<div class="row"><span>${l}</span><span>${v}</span></div>`).join('')}<p style="margin-top:8px">${sel.text}</p>
  <label for="st">Perbarui status tindak lanjut</label><select id="st">${['Baru','Diproses','Selesai'].map(x => `<option ${sel.st===x?'selected':''}>${x}</option>`).join('')}</select><label for="nt">Catatan admin</label><textarea id="nt">${sel.note}</textarea><button class="btn p" data-act="savr" data-a="${sel.id}" style="margin-top:14px">Simpan pembaruan status</button></div></div>
  ${note('Status unit mengikuti tindak lanjut admin','Unit masuk maintenance saat laporan dibuat dan kembali aktif saat laporan ditandai Selesai.')}`); };
V['/a/units'] = () => {
  const e = S.edit ? S.units.find(u => u.id === S.edit) || {id:'', inv:'', loc:'Game Corner FILKOM', st:'Aktif', why:'', isNew:true} : S.units.find(u => u.st !== 'Aktif') || S.units[0];
  return admin('/a/units', 'Data unit PS5', 'Manajemen data unit PS5', 'Kelola identitas unit dan aktifkan reservasi hanya untuk hardware yang siap digunakan.', `
  <div class="q" style="margin:14px 0"><div class="chips"><span class="tag">${S.units.length} unit tersimpan</span><span class="tag g">${S.units.filter(u => u.st==='Aktif').length} aktif</span><span class="tag y">${S.units.filter(u => u.st!=='Aktif').length} nonaktif</span></div><button class="btn p" data-act="newu" style="width:auto;margin:0">${I('plus')}Tambah unit</button></div>
  <div class="split"><div class="card" style="padding:0;overflow-x:auto"><h2 style="padding:16px 16px 0">Daftar unit Game Corner</h2><table><tr><th>IDENTITAS UNIT<th>STATUS MASTER<th>RESERVASI<th>AKSI</tr>${S.units.map(u => `<tr class="${u.id===e.id?'on':''}"><td><b>${u.id}</b><br><span class="mut sm">${u.inv} · 2 controller</span><td><span class="tag ${u.st==='Aktif'?'g':'y'}">${u.st}</span><td class="b sm" style="color:${u.st==='Aktif'?'var(--green)':'var(--amber)'}">${u.st==='Aktif'?'Tersedia':'Nonaktif'}<td><button class="link sm" data-act="editu" data-a="${u.id}">Edit unit</button><br>${u.st==='Aktif'?`<button class="link sm" style="color:var(--red)" data-act="offu" data-a="${u.id}">Nonaktifkan</button>`:'<span class="mut sm">Sudah nonaktif</span>'}</tr>`).join('')}</table></div>
  <div class="card"><h2>${e.isNew?'Unit baru':'Edit '+e.id}</h2><label for="k">Kode unit</label><input id="k" value="${e.id}"><label for="iv">Nomor inventaris</label><input id="iv" value="${e.inv}"><label for="lc">Lokasi</label><input id="lc" value="${e.loc}"><label for="sm">Status master</label><select id="sm">${['Aktif','Maintenance','Rusak'].map(x => `<option ${e.st===x?'selected':''}>${x}</option>`).join('')}</select><label>Status reservasi</label><input readonly value="${e.st==='Aktif'?'Dapat dipesan':'Nonaktif sementara'}"><label for="al">Alasan / referensi</label><textarea id="al">${e.why}</textarea>
  <button class="btn p" data-act="saveu" data-a="${e.isNew?'':e.id}" style="margin-top:14px">Simpan perubahan</button><button class="btn" data-act="canu">Batal</button></div></div>
  ${note('Maintenance bukan penghapusan unit','Unit tetap tercatat di master, namun tidak dapat dipesan selama nonaktif.', 'y', 'bell')}`); };
V['/a/export'] = () => { const s = stats(), pdf = S.fmt === 'PDF', fn = `GameCorner_FILKOM_${dkey(T0)}.${pdf?'pdf':'csv'}`;
  return admin('/a/export', 'Export laporan', 'Export laporan', 'Siapkan laporan penggunaan untuk dokumentasi dan evaluasi sarana-prasarana.', `<div class="split" style="grid-template-columns:1fr 1.5fr;margin-top:18px"><div><div class="card"><h2>Pengaturan laporan</h2><label for="r">Rentang waktu</label><select id="r" data-f="range">${[7,14,30].map(x => `<option value="${x}" ${S.range==x?'selected':''}>${x} hari terakhir</option>`).join('')}</select><label for="un">Cakupan unit</label><select id="un" data-f="exu"><option value="all">Semua unit (${S.units.length})</option>${S.units.map(u => `<option ${S.ex.unit===u.id?'selected':''}>${u.id}</option>`).join('')}</select><label>Format file</label><div class="fmt">${['PDF','Excel'].map(f => `<button class="${S.fmt===f?'on':''}" data-act="fmt" data-a="${f}">${I(f==='PDF'?'file':'table')}<br>${f}${S.fmt===f?' ✓':''}</button>`).join('')}</div><p class="mut sm" style="margin-top:10px">Mencakup sesi selesai, durasi, okupansi per unit, dan jam sibuk. Data identitas tidak disertakan.</p></div>${note('Siap ekspor','Rentang dan format sudah dipilih. Preview menampilkan data yang akan masuk laporan.','g','ok')}<button class="btn p" data-act="export">${I('dl')}Export / Unduh ${pdf?'PDF':'Excel (CSV)'}</button><a class="btn" href="#/a/stats">Kembali ke statistik</a></div>
  <div><h2>Preview laporan</h2><div class="pv"><p class="blue sm b">FILKOM · UNIVERSITAS BRAWIJAYA</p><h1>Laporan penggunaan Game Corner FILKOM</h1><p class="mut">Periode ${dr()} · ${s.per.length} unit PS5</p><span class="tag">DATA SIMULASI · PRESENTASI IMK</span><div class="kpi" style="grid-template-columns:repeat(3,1fr);margin:18px 0"><div><b>${s.tot}</b><span class="mut sm">Sesi selesai</span></div><div><b>${s.tot} jam</b><span class="mut sm">Total pemakaian</span></div><div><b>${s.occ}%</b><span class="mut sm">Okupansi rata-rata</span></div></div>
  <table><tr><th>Unit<th>Sesi selesai<th>Durasi<th>Okupansi</tr>${s.per.map(p => `<tr><td>${p.u}<td>${p.n}<td>${p.n} jam<td>${Math.round(p.n/(40*S.range/14)*100)}%</tr>`).join('')}<tr><td class="blue b">Total / rata-rata<td class="blue b">${s.tot}<td class="blue b">${s.tot} jam<td class="blue b">${s.occ}%</tr></table><p style="margin-top:14px">Jam mulai tersibuk: ${10+s.bs.indexOf(s.pk)}.00 WIB · ${s.pk} sesi</p><p class="mut sm">Okupansi dihitung dari 40 jam observasi per unit per 14 hari. Angka ini basis simulasi.</p><p class="mut sm">${fn}</p></div></div></div>`); };

/* ===== Router ===== */
const ROLE = {m: 'mahasiswa', p: 'petugas', a: 'admin'};
function render() {
  let h = (location.hash || '#/login').slice(1);
  if (!V[h]) h = '/login';
  const r = h.split('/')[1];
  if (ROLE[r] && (!S.user || S.user.role !== ROLE[r])) { location.hash = '#/login'; return; }
  if (!ROLE[r] && S.user && h === '/login') { location.hash = '#/' + S.user.role[0] + (S.user.role === 'admin' ? '/stats' : '/home'); return; }
  const html = V[h](); if (typeof html !== 'string' || !html) return;
  $('#app').innerHTML = html; S.route = h; window.scrollTo(0, 0); tick();
}
function tick() {
  const b = S.route.startsWith('/m/') && me(); if (!b || b.status === 'wait' || !$('#tm')) return;
  const rem = Math.max(0, b.tEnd - new Date()), tot = b.dur*60000, mm = Math.floor(rem/60000), ss = Math.floor(rem%60000/1000);
  $('#tm').textContent = `${pad(mm)}:${pad(ss)}`; $('#tb').style.width = (100 - rem/tot*100) + '%';
  $('#tn').textContent = `${sd(new Date())} · saat ini ${tm(new Date())} WIB`; $('#tl').textContent = `${Math.round((tot-rem)/60000)} menit berlalu dari sesi ${b.dur} menit`;
  $('#warn').innerHTML = rem < 300000 ? note('Sisa waktu kurang dari 5 menit', 'Bersiap mengakhiri permainan dan mengembalikan controller, kabel, serta aksesoris kepada petugas.', 'y', 'bell') : '';
}
setInterval(tick, 1000);
const go = h => { location.hash = '#' + h; };
const seedTx = () => { S.tx = [{t: hh(T0.getHours()-1 + 0.92), k:'rt', unit:'PS5-04', who:'Sinta Laras', code:'GC-018', msg:'Selesai · pengembalian terkonfirmasi'},{t: hh(T0.getHours()-1), k:'ci', unit:'PS5-02', who:'Dito Prakoso', code:'GC-019', msg:'Penyerahan dikonfirmasi · timer dimulai'}]; };
seedTx();
const log = (b, k, msg, bad) => S.tx.unshift({t: tm(new Date()), k, unit: b.unit, who: who(b), code: b.code, msg, bad});

/* ===== Aksi ===== */
const A = {
  login() {
    const u = $('#u').value.trim(), p = $('#p').value;
    if (!u || !p) { $('#ferr').textContent = 'Isi akun SSO/NIM dan kata sandi terlebih dahulu.'; return; }
    A.enter(u);
  },
  demo(a) { $('#u').value = a; $('#p').value = 'demo1234'; A.login(); },
  enter(u) {
    const l = u.toLowerCase(), role = l.startsWith('admin') ? 'admin' : l.startsWith('petugas') ? 'petugas' : 'mahasiswa';
    S.user = {role, nim: role === 'mahasiswa' ? (/^\d+$/.test(u) ? u : '255150201111045') : '-', name: role === 'admin' ? 'Dina Pramesti' : role === 'petugas' ? 'Bima Santoso' : (DIR[u] || DIR['255150201111045'])};
    if (role === 'mahasiswa' && DIR[u]) S.user.nim = u;
    location.hash = '#/sso'; setTimeout(() => go(role === 'admin' ? '/a/stats' : role === 'petugas' ? '/p/home' : '/m/home'), 1200);
  },
  logout() { S.user = null; go('/login'); },
  acct() { if (confirm('Keluar dari akun petugas?')) A.logout(); },
  bell() { toast(S.notif.slice(-1)[0] || 'Belum ada notifikasi baru.'); },
  pick(id) { S.form.unit = id; go('/m/book'); },
  funit(id) { S.form.unit = id; render(); },
  check() { toast(conflict(S.form.unit, S.form.date, +S.form.time, S.form.dur) ? 'Slot bertabrakan dengan reservasi lain.' : 'Slot tersedia.'); },
  book() {
    const f = S.form; if (me()) return toast('Kamu masih punya reservasi aktif.');
    const b = mk({unit: f.unit, who: 'me', h: +f.time, date: f.date, dur: f.dur}); S.B.push(b);
    S.notif.push(`Booking ${b.unit} ${hh(b.h)} WIB berhasil. Pengingat 15 menit sebelumnya.`); go('/m/ticket');
  },
  cancel() { const b = me(); if (b && confirm('Batalkan booking ini?')) { b.status = 'cancel'; go('/m/home'); toast('Booking dibatalkan.'); } },
  save() { toast('Tiket disimpan. Kamu juga bisa screenshot layar ini.'); },
  ret() { me().status = 'ret'; render(); toast('Menunggu verifikasi petugas.'); },
  skip() { const b = me(); b.tEnd = add(new Date(), 4.98); b.dur = Math.max(b.dur, 5); tick(); },
  open(c) { S.open[c] = !S.open[c]; render(); },
  pf(k) { S.pf = k; render(); },
  queue(a) { const [c, k] = a.split('|'); S.sel = c; S.scanned = true; S.chk = {id: true}; go(k === 'ret' ? '/p/return' : '/p/checkin'); },
  scan(k) { const b = pend(k)[0]; if (!b) return toast('Tidak ada antrean untuk dipindai.'); S.sel = b.code; S.chk = {id: false}; render(); },
  rescan() { S.sel = null; S.chk = {}; render(); },
  hand() { const b = S.B.find(x => x.code === S.sel); b.status = 'run'; b.tStart = new Date(); b.tEnd = add(b.tStart, b.dur); log(b, 'ci', 'Penyerahan dikonfirmasi · timer dimulai'); S.sel = null; S.chk = {}; toast('Unit diserahkan. Timer dimulai.'); go('/p/home'); },
  doret() { const b = S.B.find(x => x.code === S.sel); b.status = 'done'; b.ret = new Date(); b.ok = true; log(b, 'rt', 'Selesai · pengembalian terkonfirmasi'); S.sel = null; S.chk = {}; toast('Pengembalian dikonfirmasi.'); go('/p/home'); },
  report() {
    const t = $('#dt').value.trim(); if (!t) return toast('Deskripsi kerusakan wajib diisi.');
    const b = S.B.find(x => x.code === S.sel), id = 'KR-0' + (26 + S.R.length - 2);
    S.R.push({id, unit: b.unit, at: new Date(), text: t, st: 'Baru', by: 'Bima Santoso', who: who(b), code: b.code, note: ''});
    U(b.unit).st = 'Maintenance'; U(b.unit).why = `${id} · ${t}`; b.status = 'done'; b.ret = new Date(); b.ok = false; log(b, 'rt', `${t} · laporan ${id} terkirim`, true);
    S.sel = null; S.chk = {}; toast('Laporan terkirim ke admin.'); go('/p/home');
  },
  selr(id) { S.selR = id; render(); },
  savr(id) {
    const r = S.R.find(x => x.id === id); r.st = $('#st').value; r.note = $('#nt').value;
    if (r.st === 'Selesai') U(r.unit).st = 'Aktif'; else U(r.unit).st = 'Maintenance'; toast('Status laporan disimpan.'); render();
  },
  editu(id) { S.edit = id; render(); }, canu() { S.edit = null; render(); },
  newu() { S.edit = 'baru'; render(); },
  offu(id) { U(id).st = 'Maintenance'; render(); toast(id + ' dinonaktifkan.'); },
  saveu(id) {
    const v = x => $('#' + x).value.trim(), kode = v('k'); if (!kode) return toast('Kode unit wajib diisi.');
    const o = {id: kode, inv: v('iv'), loc: v('lc'), st: v('sm'), why: v('al')};
    if (id) Object.assign(U(id), o); else S.units.push(o); S.edit = null; toast('Perubahan disimpan.'); render();
  },
  fmt(f) { S.fmt = f; render(); },
  export() {
    if (S.fmt === 'PDF') return window.print();
    const s = stats(), csv = ['Unit,Sesi,Durasi (jam),Okupansi', ...s.per.map(p => `${p.u},${p.n},${p.n},${Math.round(p.n/(40*S.range/14)*100)}%`)].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv'})); a.download = `GameCorner_FILKOM_${dkey(T0)}.csv`; a.click();
  }
};
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]'); if (g) return go(g.dataset.go);
  const a = e.target.closest('[data-act]'); if (a && A[a.dataset.act]) A[a.dataset.act](a.dataset.a);
});
document.addEventListener('change', e => {
  const f = e.target.dataset.f, c = e.target.dataset.ck;
  if (f) { if (f === 'range') S.range = +e.target.value; else if (f === 'exu') S.ex.unit = e.target.value; else S.form[f] = f === 'dur' ? +e.target.value : e.target.value; render(); }
  if (c) { S.chk[c] = e.target.checked; render(); }
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id && ['u', 'p'].includes(e.target.id)) A.login(); });
window.addEventListener('hashchange', render);
render();

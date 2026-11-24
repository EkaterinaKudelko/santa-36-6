/* Тайный Санта · интерактив */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Загрузочный экран ---------------- */
  const loader = $("loader");
  function hideLoader() { loader.classList.add("done"); }
  const heroImage = document.querySelector(".scene-bg");
  const heroReady = heroImage
    ? (typeof heroImage.decode === "function"
        ? heroImage.decode().catch(() => {})
        : new Promise(resolve => {
            if (heroImage.complete) resolve();
            else { heroImage.onload = resolve; heroImage.onerror = resolve; }
          }))
    : Promise.resolve();
  Promise.race([
    Promise.all([heroReady, document.fonts ? document.fonts.ready : Promise.resolve()]),
    new Promise(resolve => setTimeout(resolve, 6500)),
  ]).then(() => setTimeout(hideLoader, 150));

  /* ---------------- Снег и искорки (canvas) ---------------- */
  const cv = $("fx"), ctx = cv.getContext("2d");
  let W = 0, H = 0, DPR = 1, flakes = [], sparks = [];
  const rand = (a, b) => a + Math.random() * (b - a);

  function resize() {
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const n = Math.min(110, Math.round(W * H / 16000));
    flakes = Array.from({ length: n }, () => makeFlake(true));
  }
  function makeFlake(init) {
    const far = Math.random() < .45;
    return { x: rand(0, W), y: init ? rand(0, H) : -10, r: far ? rand(.6, 1.6) : rand(1.6, 3.6),
      vy: far ? rand(8, 16) : rand(18, 38), sway: rand(8, 26), ph: rand(0, Math.PI * 2),
      sp: rand(.25, .7), a: far ? rand(.25, .5) : rand(.55, .95) };
  }
  function addSparks(x, y, n, colors) {
    for (let i = 0; i < n; i++)
      sparks.push({ x: x + rand(-14, 14), y: y + rand(-14, 14), vx: rand(-80, 80), vy: rand(-130, -10),
        life: rand(.7, 1.7), t: 0, r: rand(1, 2.8), col: colors[Math.floor(Math.random() * colors.length)] });
  }
  // волшебная мерцающая пыль — как россыпь фей-света после взмаха палочки
  function addMagicDust(cx, cy, spread) {
    const cols = ["#ffd98c", "#ffe9b0", "#f6f0dc", "#e8b45a", "#fff7df"];
    for (let i = 0; i < 110; i++) {
      const ang = Math.random() * Math.PI * 2, rad = Math.pow(Math.random(), .6) * spread;
      const sp = rand(18, 150);
      sparks.push({ dust: true, x: cx + Math.cos(ang) * rad, y: cy + Math.sin(ang) * rad,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp * .5 - rand(12, 64),
        life: rand(1.6, 3.4), t: 0, r: rand(.8, 2.6), ph: rand(0, 7), f: rand(3, 9), sw: rand(6, 28),
        col: cols[i % cols.length] });
    }
  }
  let last = performance.now(), running = true;
  function frame(now) {
    const dt = Math.min((now - last) / 1000, .05); last = now;
    ctx.clearRect(0, 0, W, H);
    for (const f of flakes) {
      f.ph += f.sp * dt; f.y += f.vy * dt; f.x += Math.sin(f.ph) * f.sway * dt;
      if (f.y > H + 8) Object.assign(f, makeFlake(false));
      ctx.globalAlpha = f.a;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fillStyle = "#eef6fa"; ctx.fill();
    }
    ctx.shadowBlur = 0;
    if (Math.random() < dt * .8) { // редкие золотые искорки в зоне ёлки
      const left = innerWidth > innerHeight;
      sparks.push({ x: left ? rand(2, W * .3) : rand(W * .2, W * .8), y: rand(H * .15, H * .8),
        vx: rand(-6, 6), vy: rand(-16, -4), life: rand(1, 2.2), t: 0, r: rand(.8, 1.8), col: "#ffd98c" });
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i]; s.t += dt;
      if (s.t > s.life) { sparks.splice(i, 1); continue; }
      const k = 1 - s.t / s.life;
      if (s.dust) { // пыль: инерция гаснет, частицы колышутся и мерцают
        s.vx -= s.vx * 1.15 * dt; s.vy -= s.vy * .4 * dt; s.vy += 9 * dt;
        s.x += (s.vx + Math.sin(s.ph + s.t * s.f) * s.sw) * dt; s.y += s.vy * dt;
        const tw = .25 + .75 * Math.abs(Math.sin(s.ph + s.t * s.f * 2));
        ctx.globalAlpha = k * tw * .95;
        ctx.fillStyle = s.col; ctx.shadowColor = s.col; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * (.55 + .7 * tw), 0, 7); ctx.fill();
      } else {
        s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 60 * dt;
        ctx.globalAlpha = k * .9;
        ctx.fillStyle = s.col; ctx.shadowColor = s.col; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * k + .3, 0, 7); ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
    if (running) requestAnimationFrame(frame);
  }
  resize(); addEventListener("resize", resize);
  if (reduced) {
    for (const f of flakes) { ctx.globalAlpha = f.a; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fillStyle = "#eef6fa"; ctx.fill(); }
  } else {
    requestAnimationFrame(frame);
    document.addEventListener("visibilitychange", () => {
      running = !document.hidden; if (running) { last = performance.now(); requestAnimationFrame(frame); }
    });
  }

  /* ---------------- Плеер «Зимние мелодии» ---------------- */
  const TRACKS = [
    { src: "assets/melody1.mp3", title: "Первый снег" },
    { src: "assets/melody2.mp3", title: "Зимний вечер" },
    { src: "assets/melody3.mp3", title: "Свет гирлянды" },
    { src: "assets/melody4.mp3", title: "Тихая метель" },
    { src: "assets/melody5.mp3", title: "Новогоднее чудо" },
  ];
  const player = $("player"), playBtn = $("playBtn"), trackName = $("trackName");
  const audio = new Audio();
  audio.preload = "none";
  let idx = 0, playing = false, fadeTimer = null;

  function loadTrack(i, autoplay) {
    idx = (i + TRACKS.length) % TRACKS.length;
    audio.src = TRACKS[idx].src;
    trackName.textContent = `${idx + 1}/${TRACKS.length} · ${TRACKS[idx].title}`;
    if (autoplay) playCurrent();
  }
  function fade(to, dur) {
    clearInterval(fadeTimer);
    const from = audio.volume, step = (to - from) / (dur * 20);
    fadeTimer = setInterval(() => {
      audio.volume = Math.max(0, Math.min(1, audio.volume + step));
      if ((step > 0 && audio.volume >= to) || (step < 0 && audio.volume <= to)) clearInterval(fadeTimer);
    }, 50);
  }
  function playCurrent() {
    audio.play().then(() => {
      playing = true; playBtn.textContent = "⏸"; playBtn.setAttribute("aria-label", "Пауза");
      fade(.55, 3);
    }).catch(() => {});
  }
  function pauseCurrent() {
    audio.pause(); playing = false; playBtn.textContent = "▶"; playBtn.setAttribute("aria-label", "Играть музыку");
  }
  audio.addEventListener("ended", () => loadTrack(idx + 1, true));
  playBtn.addEventListener("click", () => {
    playing ? pauseCurrent() : (audio.src ? (fade(0, .3), playCurrent()) : loadTrack(0, true));
    remember();
  });
  $("prevBtn").addEventListener("click", () => { loadTrack(idx - 1, true); remember(); });
  $("nextBtn").addEventListener("click", () => { loadTrack(idx + 1, true); remember(); });
  function remember() { try { localStorage.setItem("santa-music", playing ? "on" : "off"); } catch (e) {} }
  setTimeout(() => player.classList.add("ready"), 2600);

  /* ---------------- Токен и данные ---------------- */
  // Мини-SHA-256: crypto.subtle недоступен на небезопасном http://
  const K256 = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  function sha256(msg) {
    const H0 = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const len = msg.length, bits = len * 8;
    const padLen = ((len + 9 + 63) >> 6 << 6);
    const m = new Uint8Array(padLen); m.set(msg); m[len] = 0x80;
    const dv = new DataView(m.buffer);
    dv.setUint32(padLen - 4, bits >>> 0); dv.setUint32(padLen - 8, Math.floor(bits / 4294967296));
    const H = H0.slice(), w = new Uint32Array(64);
    const rr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let off = 0; off < padLen; off += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
      for (let i = 16; i < 64; i++) {
        const s0 = rr(w[i-15],7) ^ rr(w[i-15],18) ^ (w[i-15]>>>3);
        const s1 = rr(w[i-2],17) ^ rr(w[i-2],19) ^ (w[i-2]>>>10);
        w[i] = (w[i-16] + s0 + w[i-7] + s1) >>> 0;
      }
      let [a,b,c,d,e,f,g,h] = H;
      for (let i = 0; i < 64; i++) {
        const S1 = rr(e,6)^rr(e,11)^rr(e,25), ch = (e&f)^(~e&g);
        const t1 = (h + S1 + ch + K256[i] + w[i]) >>> 0;
        const S0 = rr(a,2)^rr(a,13)^rr(a,22), mj = (a&b)^(a&c)^(b&c);
        const t2 = (S0 + mj) >>> 0;
        h=g; g=f; f=e; e=(d+t1)>>>0; d=c; c=b; b=a; a=(t1+t2)>>>0;
      }
      H[0]=(H[0]+a)>>>0; H[1]=(H[1]+b)>>>0; H[2]=(H[2]+c)>>>0; H[3]=(H[3]+d)>>>0;
      H[4]=(H[4]+e)>>>0; H[5]=(H[5]+f)>>>0; H[6]=(H[6]+g)>>>0; H[7]=(H[7]+h)>>>0;
    }
    const out = new Uint8Array(32), odv = new DataView(out.buffer);
    H.forEach((v, i) => odv.setUint32(i * 4, v));
    return out;
  }
  async function sha(str) {
    const enc = new TextEncoder().encode(str);
    if (self.crypto && crypto.subtle) {
      try { return new Uint8Array(await crypto.subtle.digest("SHA-256", enc)); } catch (e) {}
    }
    return sha256(enc);
  }
  async function decrypt(token) {
    const params = new URLSearchParams(location.hash.slice(1));
    // New links carry an encrypted payload in the URL fragment.
    // Existing links using window.SANTA_DATA remain supported.
    const inlinePack = params.get("d");
    const pack = inlinePack || (window.SANTA_DATA || {})[token];
    if (!pack) return null;
    const raw = Uint8Array.from(atob(pack.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
    let ks = new Uint8Array(0);
    for (let i = 0; ks.length < raw.length; i++) ks = new Uint8Array([...ks, ...(await sha(`${token}|${i}`))]);
    const out = raw.map((b, i) => b ^ ks[i]);
    return JSON.parse(new TextDecoder().decode(out));
  }

  const token = new URLSearchParams(location.hash.slice(1)).get("t") || (location.hash.match(/[#&]t=([\\w-]+)/) || [])[1];
  const stage = $("stage"), envWrap = $("envelope"), envBox = $("envelopeBox");
  const card = $("letterCard"), errCard = $("errorCard");

  let payload = null;
  const ready = token ? decrypt(token) : Promise.resolve(null);
  ready.then(p => {
    payload = p;
    if (!p && token) { stage.style.display = "none"; show(errCard); }
  });

  function show(el) { el.hidden = false; requestAnimationFrame(() => el.classList.add("show")); }

  /* ---------------- Открытие конверта ---------------- */
  let opened = false;
  envWrap.addEventListener("click", () => {
    if (opened) return; opened = true;
    try { if ((localStorage.getItem("santa-music") || "on") === "on" && !playing) loadTrack(0, true); } catch (e) {}
    const r = envBox.getBoundingClientRect();
    const cx = r.left + r.width * .5145, cy = r.top + r.height * .517; // центр печати на фото
    addSparks(cx, cy, 34, ["#ffd98c", "#e8b45a", "#f2e6c4"]);
    for (let i = 1; i <= 5; i++)
      setTimeout(() => addSparks(cx + (i % 2 ? -1 : 1) * i * 11, cy - i * i * 12, 7, ["#ffd98c", "#e8b45a"]), i * 150);
    // волшебная пыль «проходит» по конверту, как фокус взмахом палочки
    if (!reduced) {
      addMagicDust(cx, cy, 30);
      const R = Math.max(r.width, r.height) * .38;
      [[-.8, -.35], [.75, -.5], [-.45, .6], [.5, .55]].forEach(([dx, dy], i) =>
        setTimeout(() => addMagicDust(cx + dx * R, cy + dy * R, 26), 220 + i * 240));
    }
    stage.classList.add("opening");
    envBox.classList.add("cracked");
    if (reduced) { finishOpen(); return; }
    setTimeout(finishOpen, 1500);
  });

  function finishOpen() {
    stage.classList.add("gone");
    ready.then(() => {
      if (payload) {
        $("wardName").textContent = payload.name_gen || payload.name;
        $("wardPos").textContent = payload.pos_gen || payload.pos;
      }
      show(card);
    });
  }

})();

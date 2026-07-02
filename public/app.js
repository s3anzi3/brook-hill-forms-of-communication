/* ===== Forms of Communication — interactions ===== */
(function () {
  'use strict';

  /* ---------------- scene routing ---------------- */
  const scenes = {
    intro:   document.getElementById('scene-intro'),
    present: document.getElementById('scene-present'),
    teams:   document.getElementById('scene-teams'),
    round1:  document.getElementById('scene-round1'),
    round2:  document.getElementById('scene-round2'),
    round3:  document.getElementById('scene-round3'),
    finale:  document.getElementById('scene-finale'),
  };
  const scorebar = document.getElementById('scorebar');
  const roundTag = document.getElementById('roundTag');

  const TAGS = {
    intro: 'Start', present: 'Start', teams: 'Teams',
    round1: 'Game 1 · No Words', round2: 'Game 2 · Heads Up',
    round3: 'Game 3 · Write It', finale: 'Final',
  };
  const SHOW_BAR = ['teams', 'round1', 'round2', 'round3', 'finale'];

  function show(name, opts) {
    Object.values(scenes).forEach(s => s.classList.remove('active'));
    const el = scenes[name];
    if (!el) return;
    el.classList.add('active');
    scorebar.hidden = !SHOW_BAR.includes(name);
    roundTag.textContent = TAGS[name] || '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (name === 'finale') runFinale();
    if (opts && opts.slide != null) goToSlide(opts.slide);
  }

  // data-go handlers
  document.addEventListener('click', (e) => {
    const trg = e.target.closest('[data-go]');
    if (!trg) return;
    const dest = trg.getAttribute('data-go');
    if (dest.startsWith('present-')) {
      show('present', { slide: parseInt(dest.split('-')[1], 10) });
    } else {
      show(dest);
    }
  });

  /* ---------------- presentation slides ---------------- */
  const slideEls = Array.from(document.querySelectorAll('.slide'));
  const dotsWrap = document.getElementById('dots');
  const prevBtn = document.getElementById('prevSlide');
  const nextBtn = document.getElementById('nextSlide');
  let curSlide = 0;

  slideEls.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'dot';
    d.setAttribute('aria-label', 'Slide ' + (i + 1));
    d.addEventListener('click', () => goToSlide(i));
    dotsWrap.appendChild(d);
  });
  const dotEls = Array.from(dotsWrap.children);

  function goToSlide(i, back) {
    curSlide = Math.max(0, Math.min(slideEls.length - 1, i));
    slideEls.forEach((s, idx) => {
      s.classList.remove('show', 'back');
      if (idx === curSlide) {
        s.classList.add('show');
        if (back) s.classList.add('back');
      }
    });
    dotEls.forEach((d, idx) => d.classList.toggle('on', idx === curSlide));
    prevBtn.disabled = curSlide === 0;
    nextBtn.disabled = curSlide === slideEls.length - 1;
  }
  prevBtn.addEventListener('click', () => goToSlide(curSlide - 1, true));
  nextBtn.addEventListener('click', () => goToSlide(curSlide + 1));
  goToSlide(0);

  // keyboard arrows while presenting
  document.addEventListener('keydown', (e) => {
    if (!scenes.present.classList.contains('active')) return;
    if (e.key === 'ArrowRight') goToSlide(curSlide + 1);
    if (e.key === 'ArrowLeft') goToSlide(curSlide - 1, true);
  });

  /* ---------------- scoreboard ---------------- */
  const score = { boys: 0, girls: 0 };
  const els = {
    boys: document.getElementById('scoreBoys'),
    girls: document.getElementById('scoreGirls'),
  };
  document.querySelectorAll('.team-score').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.getAttribute('data-team');
      score[t]++;
      paintScore(t);
      burst(btn);
    });
    // right-click / long-press to subtract
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const t = btn.getAttribute('data-team');
      score[t] = Math.max(0, score[t] - 1);
      paintScore(t);
    });
  });
  function paintScore(t) {
    els[t].textContent = score[t];
    els[t].classList.remove('bump');
    void els[t].offsetWidth;
    els[t].classList.add('bump');
  }
  document.getElementById('miniReset').addEventListener('click', () => {
    score.boys = 0; score.girls = 0;
    paintScore('boys'); paintScore('girls');
  });

  /* ---------------- timers ---------------- */
  const CIRC = 339.29; // 2πr for r=54
  const timers = {
    1: { num: 't1num', ring: 'ring1', shell: 't1shell', total: 60, left: 60, id: null },
    2: { num: 't2num', ring: null,    shell: null,       total: 60, left: 60, id: null },
    3: { num: 't3num', ring: 'ring3', shell: 't3shell', total: 420, left: 420, id: null },
  };

  function formatTime(s) {
    if (s < 60) return String(s);
    const m = Math.floor(s / 60);
    const ss = String(s % 60).padStart(2, '0');
    return m + ':' + ss;
  }

  function paintTimer(k) {
    const t = timers[k];
    // ring timers (rounds 1 & 3) show m:ss; the round-2 mini timer stays plain seconds
    document.getElementById(t.num).textContent = t.ring ? formatTime(t.left) : t.left;
    if (t.ring) {
      const frac = t.total ? t.left / t.total : 0;
      document.getElementById(t.ring).style.strokeDashoffset = CIRC * (1 - frac);
    }
    const shell = t.shell ? document.getElementById(t.shell) : null;
    const danger = t.left <= 10 && t.left > 0;
    if (shell) shell.classList.toggle('danger', danger);
    // round 2 mini timer danger state
    if (k === 2) {
      document.querySelector('.mini-timer').classList.toggle('danger', danger);
    }
  }

  function startTimer(k) {
    const t = timers[k];
    if (t.id) return; // already running
    if (t.left <= 0) t.left = t.total;
    const shell = t.shell ? document.getElementById(t.shell) : null;
    if (shell) shell.classList.remove('done');
    t.id = setInterval(() => {
      t.left--;
      paintTimer(k);
      if (t.left <= 0) {
        clearInterval(t.id); t.id = null;
        if (shell) { shell.classList.remove('danger'); shell.classList.add('done'); }
        if (k === 2) endHeadsUp();
        buzz();
      }
    }, 1000);
  }
  function resetTimer(k, sec) {
    const t = timers[k];
    if (t.id) { clearInterval(t.id); t.id = null; }
    if (sec != null) t.total = sec;
    t.left = t.total;
    const shell = t.shell ? document.getElementById(t.shell) : null;
    if (shell) shell.classList.remove('danger', 'done');
    paintTimer(k);
  }

  document.querySelectorAll('[data-timer]').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.getAttribute('data-timer');
      const action = btn.getAttribute('data-action');
      if (action === 'start') { if (k === '2') startHeadsUp(); else startTimer(k); }
      else resetTimer(k);
    });
  });
  document.querySelectorAll('[data-set]').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.getAttribute('data-set');
      const sec = parseInt(btn.getAttribute('data-sec'), 10);
      resetTimer(k, sec);
    });
  });
  paintTimer(1); paintTimer(3);

  /* ---------------- round 1 & 3 prompt generators ---------------- */
  const R1_WORDS = [
    // physical actions
    'Do push-ups',
    'Do jumping jacks',
    'Do squats',
    'Shake Sean\'s hand',
    'High five Sean',
    'Hop on one foot',
    'Spin around in a circle',
    'Touch your toes',
    'Give someone a fist bump',
    'Clap your hands',
    // use items around the room
    'Sit in a chair',
    'Sit in one of the chairs at the middle table in the second row',
    'Sit in the chair closest to the exit door that is open',
    'Sit in the chair closest to the exit door that is closed',
    'Turn the light switch off and on',
    'Walk out the door',
    'Throw the crumpled paper in the trash',
    'Grab a water bottle and take a sip',
    'Knock on the door 3 times',
    'Push in a chair',
    'Dribble a basketball',
    'Pump up a ball',
    'Put the basketball in the wagon',
    'Put the speaker in the wagon',
  ];
  function pick(arr, out, caption) {
    const v = arr[Math.floor(Math.random() * arr.length)];
    out.hidden = false;
    out.innerHTML = v + '<small>' + caption + '</small>';
  }
  // Round 1: receive ONE random task, then hide/show it on screen
  const r1Out = document.getElementById('r1PromptOut');
  const r1Toggle = document.getElementById('r1Toggle');
  document.getElementById('r1Prompt').addEventListener('click', () => {
    pick(R1_WORDS, r1Out, 'do not show your team!');
    r1Out.hidden = false;
    r1Toggle.hidden = false;
    r1Toggle.textContent = '🙈 Hide task';
  });
  r1Toggle.addEventListener('click', () => {
    const showing = !r1Out.hidden;
    r1Out.hidden = showing;
    r1Toggle.textContent = showing ? '👁 Show task' : '🙈 Hide task';
  });

  /* ---------------- round 2 : heads up deck ---------------- */
  const DECK = [
    ['Places in Italy', ['Rome', 'Venice', 'Milan', 'Florence', 'Naples', 'Sicily', 'The Colosseum', 'Leaning Tower of Pisa', 'The Vatican', 'Amalfi Coast', 'Trevi Fountain', 'Gondola']],
    ['Italian Food', ['Pizza', 'Pasta', 'Gelato', 'Lasagna', 'Espresso', 'Tiramisu', 'Cannoli', 'Spaghetti', 'Mozzarella', 'Focaccia', 'Nutella', 'Prosciutto']],
    ['Only in NYC', ['Times Square', 'Statue of Liberty', 'Central Park', 'Empire State Building', 'Brooklyn Bridge', 'Yellow taxi', 'Broadway', 'The subway', 'Hot dog stand', 'Skyscraper']],
    ['Soccer / Calcio', ['Cristiano Ronaldo', 'Lionel Messi', 'Juventus', 'AC Milan', 'Inter Milan', 'Napoli', 'World Cup', 'Penalty kick', 'Goalkeeper', 'Red card']],
    ['Pop Culture', ['TikTok', 'Instagram', 'Taylor Swift', 'Kanye West', '"6-7" (six seven)', 'Måneskin', 'Spider-Man', 'Netflix', 'FIFA video game', 'Fortnite', 'Barbie', 'Minecraft']],
    ['Italian Icons', ['Ferrari', 'Lamborghini', 'Vespa scooter', 'Gucci', 'Super Mario', 'Pinocchio', 'Mona Lisa', 'Leonardo da Vinci', 'Fiat 500', 'The Pope']],
    ['Easy Warm-ups', ['Dog', 'Cat', 'Sun', 'Guitar', 'Sunglasses', 'Dancing', 'Selfie', 'Airplane', 'Ice cream', 'Beach']],
  ];
  const flatDeck = [];
  DECK.forEach(([cat, words]) => words.forEach(w => flatDeck.push({ cat, word: w })));

  let queue = [];
  let hu = { got: 0, skip: 0, live: false };
  const hupCard = document.getElementById('hupCard');
  const hupCat = document.getElementById('hupCat');
  const hupWord = document.getElementById('hupWord');
  const huGotEl = document.getElementById('huGot');
  const huSkipEl = document.getElementById('huSkip');

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function nextCard() {
    if (!queue.length) queue = shuffle(flatDeck.slice());
    const c = queue.pop();
    hupCat.textContent = c.cat;
    hupWord.textContent = c.word;
    hupCard.classList.remove('flip');
    void hupCard.offsetWidth;
    hupCard.classList.add('flip');
  }
  function startHeadsUp() {
    hu = { got: 0, skip: 0, live: true };
    huGotEl.textContent = '0';
    huSkipEl.textContent = '0';
    queue = shuffle(flatDeck.slice());
    nextCard();
    startTimer(2);
  }
  function endHeadsUp() {
    hu.live = false;
    hupCat.textContent = 'Time!';
    hupWord.textContent = hu.got + ' correct';
    hupCard.classList.remove('flip'); void hupCard.offsetWidth; hupCard.classList.add('flip');
  }
  document.getElementById('huGotBtn').addEventListener('click', () => {
    if (!hu.live) return;
    hu.got++; huGotEl.textContent = hu.got; nextCard();
  });
  document.getElementById('huSkipBtn').addEventListener('click', () => {
    if (!hu.live) return;
    hu.skip++; huSkipEl.textContent = hu.skip; nextCard();
  });

  /* ---------------- finale ---------------- */
  function runFinale() {
    document.getElementById('finalBoys').textContent = score.boys;
    document.getElementById('finalGirls').textContent = score.girls;
    const bCard = document.querySelector('.fs.boys');
    const gCard = document.querySelector('.fs.girls');
    bCard.classList.remove('win'); gCard.classList.remove('win');
    const line = document.getElementById('winnerLine');
    if (score.boys === score.girls) {
      line.textContent = 'It\'s a tie! Both teams are good! 🤝';
    } else if (score.boys > score.girls) {
      line.textContent = 'Boys win! 🧢🏆';
      bCard.classList.add('win');
      confetti();
    } else {
      line.textContent = 'Girls win! 💅🏆';
      gCard.classList.add('win');
      confetti();
    }
  }

  /* ---------------- effects: confetti + score burst + buzz ---------------- */
  const canvas = document.getElementById('confetti');
  const ctx = canvas.getContext('2d');
  let pieces = [];
  function sizeCanvas() { canvas.width = innerWidth; canvas.height = innerHeight; }
  addEventListener('resize', sizeCanvas); sizeCanvas();

  function confetti() {
    const colors = ['#E7C75A', '#a855f7', '#3aa0ff', '#ff5fa2', '#4ade80'];
    for (let i = 0; i < 160; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.4,
        r: 4 + Math.random() * 6,
        c: colors[Math.floor(Math.random() * colors.length)],
        vy: 2 + Math.random() * 4,
        vx: -2 + Math.random() * 4,
        rot: Math.random() * 6.28,
        vr: -0.2 + Math.random() * 0.4,
      });
    }
    if (!confetti.running) { confetti.running = true; requestAnimationFrame(tick); }
  }
  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
      ctx.restore();
    });
    pieces = pieces.filter(p => p.y < canvas.height + 30);
    if (pieces.length) requestAnimationFrame(tick);
    else { confetti.running = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }

  // small confetti burst from a scoring button
  function burst(el) {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const colors = ['#E7C75A', '#a855f7', '#4ade80', '#3aa0ff', '#ff5fa2'];
    for (let i = 0; i < 24; i++) {
      pieces.push({
        x: cx, y: cy, r: 4 + Math.random() * 5,
        c: colors[Math.floor(Math.random() * colors.length)],
        vy: -3 - Math.random() * 4, vx: -3 + Math.random() * 6,
        rot: Math.random() * 6.28, vr: -0.3 + Math.random() * 0.6,
      });
    }
    if (!confetti.running) { confetti.running = true; requestAnimationFrame(tick); }
  }

  // subtle beep when a timer ends (WebAudio, no asset needed)
  function buzz() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const ac = new AC();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sawtooth'; o.frequency.value = 220;
      o.connect(g); g.connect(ac.destination);
      g.gain.setValueAtTime(0.001, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.25, ac.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.7);
      o.start(); o.stop(ac.currentTime + 0.72);
    } catch (_) { /* audio blocked; ignore */ }
  }

})();

const ICON_GRID = 90;
const ICON_PAD = 32;

function getOccupiedCells() {
  const cells = new Set();
  document.querySelectorAll('.icon').forEach(icon => {
    cells.add(icon.style.left + ',' + icon.style.top);
  });
  return cells;
}

function snapToGrid(val) {
  return Math.round((val - ICON_PAD) / ICON_GRID) * ICON_GRID + ICON_PAD;
}

function getGridBounds() {
  const desktop = document.getElementById('desktop');
  const taskbarH = 42;
  const maxCols = Math.floor((desktop.offsetWidth - ICON_PAD - 90) / ICON_GRID);
  const maxRows = Math.floor((desktop.offsetHeight - taskbarH - ICON_PAD - 90) / ICON_GRID);
  return { maxCols, maxRows };
}

function clampCell(col, row) {
  const { maxCols, maxRows } = getGridBounds();
  return {
    col: Math.max(0, Math.min(col, maxCols)),
    row: Math.max(0, Math.min(row, maxRows))
  };
}

function findFreeCell(preferredLeft, preferredTop, excludeEl) {
  const occupied = new Set();
  document.querySelectorAll('.icon').forEach(icon => {
    if (icon !== excludeEl) occupied.add(icon.style.left + ',' + icon.style.top);
  });
  let col = Math.round((preferredLeft - ICON_PAD) / ICON_GRID);
  let row = Math.round((preferredTop - ICON_PAD) / ICON_GRID);
  for (let r = 0; r < 20; r++) {
    for (let c = 0; c < 20; c++) {
      const clamped = clampCell(col + c, row + r);
      const l = clamped.col * ICON_GRID + ICON_PAD + 'px';
      const t = clamped.row * ICON_GRID + ICON_PAD + 'px';
      if (!occupied.has(l + ',' + t)) return { left: l, top: t };
    }
  }
  return { left: preferredLeft + 'px', top: preferredTop + 'px' };
}

// ── Achievements ──────────────────────────────────────────────
const ACHIEVEMENTS = [
  {
    id: 'hidden_page',
    icon: '👀',
    title: "You're not my DADD",
    hint: 'Find the hidden menu on the loading start-up screen',
    secret: true
  },
  {
    id: 'pong_losses',
    icon: '🏓',
    title: 'Insane Skill Issue',
    hint: 'Be bad at pong.',
    secret: false
  },
  {
    id: 'bin_crash',
    icon: '🗑️',
    title: "how'd you do that kaspian?",
    hint: 'Maybe the real trash was the computer all along.',
    secret: true
  },
  {
    id: 'snake_resize',
    icon: '🐍',
    title: 'Cyberpsycho',
    hint: 'It’s not a bug, it’s a feature. Just a buggy resize feature.',
    secret: true
  },
  {
    id: 'cat_nose',
    icon: '🐱',
    title: 'oo iaa ooi iaaa',
    hint: 'do not touch the cat nose 100 times',
    secret: false
  }
];

function getAchievements() {
  return JSON.parse(localStorage.getItem('achievements') || '{}');
}

window.resetAchievements = function() {
  localStorage.removeItem('achievements');
  localStorage.removeItem('pongLosses');
  localStorage.removeItem('catNoseCount');
  console.log('Achievements reset.');
};

function unlockAchievement(id) {
  const data = getAchievements();
  if (data[id]) return;
  data[id] = Date.now();
  localStorage.setItem('achievements', JSON.stringify(data));
  const a = ACHIEVEMENTS.find(x => x.id === id);
  if (a) showAchievementToast(a);
  if (document.getElementById('achievements-window').style.display !== 'none') renderAchievements();
}

function showAchievementToast(a) {
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;top:0;left:50%;transform:translateX(-50%) translateY(-100%);background:#000080;color:#fff;border:3px solid #fff;border-top:none;padding:0.8rem 1.4rem;font-size:0.95rem;z-index:9999999;border-radius:0;min-width:320px;box-shadow:inset 1px 1px 0 #aaaaff, inset -1px -1px 0 #000033, 4px 4px 0 #000;transition:transform 0.4s ease;font-family:"Perfect DOS VGA 437","Courier New",monospace;';
  toast.innerHTML = `<div style="background:linear-gradient(90deg,#000080,#1084d0);color:#fff;font-weight:bold;margin:-0.8rem -1.4rem 0.6rem;padding:0.3rem 0.6rem;font-size:0.85rem;border-bottom:2px solid #fff;letter-spacing:0.05em;">Achievement Unlocked!</div><div style="font-size:1rem;letter-spacing:0.03em;">${a.title}</div>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(-50%) translateY(12px)';
      setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(-100%)';
        setTimeout(() => toast.remove(), 400);
      }, 3200);
    });
  });
}

function renderAchievements() {
  const data = getAchievements();
  const list = document.getElementById('achievements-list');
  if (!list) return;
  list.innerHTML = '';
  ACHIEVEMENTS.forEach(a => {
    const unlocked = !!data[a.id];
    const div = document.createElement('div');
    div.className = 'achievement' + (unlocked ? '' : ' locked');
    div.innerHTML = `<div class="achievement-icon">${unlocked ? '<div style="width:32px;height:32px;"></div>' : '<img src="assets/icons/lockedAchivement.png" style="width:32px;height:32px;image-rendering:pixelated;">'}</div><div><div class="achievement-title">${unlocked ? a.title : '???'}</div><div class="achievement-desc">${unlocked ? a.hint : a.hint}</div></div>`;
    list.appendChild(div);
  });
}

let topZ = 10;

function bringToFront(el) {
  topZ++;
  el.style.zIndex = topZ;
}

function makeDraggable(el, handle, snap) {
  if (isMobile) return;
  handle = handle || el;
  handle.style.cursor = 'grab';
  handle.addEventListener('mousedown', function(e) {
    if (e.target.tagName === 'BUTTON') return;
    e.preventDefault();
    if (!snap) bringToFront(el);

    window._draggingEl = el;
    const rect = el.getBoundingClientRect();
    const offX = e.clientX - rect.left;
    const offY = e.clientY - rect.top;
    el.style.position = 'absolute';
    el.style.margin = '0';
    handle.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    function onMove(e) {
      if (snap) {
        const desktop = document.getElementById('desktop');
        const taskbarH = 42;
        const maxLeft = desktop.offsetWidth - 90;
        const maxTop = desktop.offsetHeight - taskbarH - 90;
        el.style.left = Math.max(0, Math.min(e.clientX - offX, maxLeft)) + 'px';
        el.style.top = Math.max(0, Math.min(e.clientY - offY, maxTop)) + 'px';
      } else {
        const desktop = document.getElementById('desktop');
        const taskbarH = 42;
        const titlebarH = 32;
        const minVisible = 60;
        const newLeft = e.clientX - offX;
        const newTop = e.clientY - offY;
        el.style.left = Math.max(-(el.offsetWidth - minVisible), Math.min(newLeft, desktop.offsetWidth - minVisible)) + 'px';
        el.style.top = Math.max(0, Math.min(newTop, desktop.offsetHeight - taskbarH - titlebarH)) + 'px';
      }
      el.style.transform = 'none';
    }
    function onUp(e) {
      handle.style.cursor = 'grab';
      document.body.style.userSelect = '';
      window._lastDraggedEl = el;
      window._draggingEl = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if (snap) {
        const bin = document.getElementById('bin-icon');
        const binRect = bin.getBoundingClientRect();
        const overBin = e.clientX >= binRect.left && e.clientX <= binRect.right &&
                        e.clientY >= binRect.top  && e.clientY <= binRect.bottom;
        if (overBin && el !== bin) {
          bin.classList.remove('bin-drop-active');
          if (el.querySelector('.icon-graphic.computer')) {
            unlockAchievement('bin_crash');
            triggerBSOD();
          } else {
            el.remove();
          }
          return;
        }
        const snappedLeft = snapToGrid(e.clientX - offX);
        const snappedTop = snapToGrid(e.clientY - offY);
        const cell = findFreeCell(snappedLeft, snappedTop, el);
        el.style.left = cell.left;
        el.style.top = cell.top;
      }
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

const hourglassEl = document.getElementById('hourglass-cursor');
const mouseCursorEl = document.getElementById('mouse-cursor');

if (!isMobile) {
document.addEventListener('mousemove', e => {
  hourglassEl.style.left = e.clientX + 'px';
  hourglassEl.style.top = e.clientY + 'px';
  mouseCursorEl.style.left = e.clientX + 'px';
  mouseCursorEl.style.top = e.clientY + 'px';

  const t = e.target;
  const isGrab = t.closest('.window-titlebar') || t.closest('.icon');
  const isText = ['INPUT','TEXTAREA'].includes(t.tagName) || t.closest('.window-content');
  const isClickable = t.tagName === 'BUTTON' || t.tagName === 'A' || t.closest('.game-tile') || t.closest('.start-menu-item') || t.closest('.taskbar-tab');

  if (isGrab) {
    mouseCursorEl.style.transform = 'rotate(-20deg)';
  } else if (isText) {
    mouseCursorEl.style.transform = 'rotate(0deg)';
    mouseCursorEl.style.filter = 'brightness(1.5)';
  } else if (isClickable) {
    mouseCursorEl.style.transform = 'scale(0.85)';
    mouseCursorEl.style.filter = 'none';
  } else {
    mouseCursorEl.style.transform = 'none';
    mouseCursorEl.style.filter = 'none';
  }
});

document.addEventListener('mousedown', () => {
  mouseCursorEl.style.transform = 'scale(0.8)';
});
document.addEventListener('mouseup', () => {
  mouseCursorEl.style.transform = 'none';
});
} // end !isMobile

function showHourglass() {
  document.body.classList.add('cursor-wait');
  hourglassEl.style.display = 'block';
  setTimeout(() => {
    document.body.classList.remove('cursor-wait');
    hourglassEl.style.display = 'none';
  }, 500);
}

function openWindow(id) {
  showHourglass();
  const w = document.getElementById(id);
  w.style.display = id === 'spotify-window' ? 'flex' : 'block';
  bringToFront(w);
  removeTaskbarTab(id);
  if (id === 'computer-window') populateSysInfo();
  if (id === 'achievements-window') renderAchievements();
  if (id === 'notepad-window') {
    const ta = document.getElementById('notepad-text');
    ta.value = localStorage.getItem('notepad') || '';
    ta.oninput = () => localStorage.setItem('notepad', ta.value);
  }
}

function closeWindow(id) {
  document.getElementById(id).style.display = 'none';
  removeTaskbarTab(id);
}

function minimizeWindow(id) {
  const w = document.getElementById(id);
  w.style.display = 'none';
  addTaskbarTab(id);
}

function addTaskbarTab(id) {
  const taskbarTabs = document.getElementById('taskbar-tabs');
  if (taskbarTabs.querySelector(`[data-id="${id}"]`)) return;
  const w = document.getElementById(id);
  const title = w.querySelector('.window-titlebar span').textContent;
  const tab = document.createElement('button');
  tab.className = 'taskbar-tab';
  tab.dataset.id = id;
  tab.textContent = title;
  tab.onclick = () => openWindow(id);
  taskbarTabs.appendChild(tab);
}

function removeTaskbarTab(id) {
  const tab = document.querySelector(`#taskbar-tabs [data-id="${id}"]`);
  if (tab) tab.remove();
}

// Wallpapers
const wallpapers = [
  'assets/wallpapers/exploding-cat.jpg',
  'assets/wallpapers/pixelated.png',
  'assets/wallpapers/xp.jpeg',
];

function applyWallpaper(src) {
  const d = document.getElementById('desktop');
  if (src) {
    d.style.backgroundImage = `url('${src}')`;
    d.style.backgroundSize = 'cover';
    d.style.backgroundPosition = 'center';
  } else {
    d.style.backgroundImage = '';
  }
  localStorage.setItem('wallpaper', src || '');
  const nose = document.getElementById('cat-nose');
  if (src && src.includes('exploding-cat')) {
    nose.style.display = 'block';
    positionCatNose();
  } else {
    nose.style.display = 'none';
  }
}

function positionCatNose() {
  const d = document.getElementById('desktop');
  const nose = document.getElementById('cat-nose');
  nose.style.left = Math.round(d.offsetWidth * 0.520) + 'px';
  nose.style.top  = Math.round(d.offsetHeight * 0.775) + 'px';
  nose.style.width = Math.round(d.offsetWidth * 0.055) + 'px';
  nose.style.height = Math.round(d.offsetHeight * 0.055) + 'px';
}

let catNoseCount = parseInt(localStorage.getItem('catNoseCount') || '0');
document.getElementById('cat-nose').addEventListener('click', () => {
  catNoseCount++;
  localStorage.setItem('catNoseCount', catNoseCount);
  if (catNoseCount >= 100) {
    unlockAchievement('cat_nose');
    new Audio('assets/mp3/oooaiiaa.m4a').play();
  } else {
    new Audio('assets/mp3/noseBoop.mp3').play();
  }
});
window.addEventListener('resize', () => {
  const nose = document.getElementById('cat-nose');
  if (nose.style.display !== 'none') positionCatNose();
});

function initWallpapers() {
  const list = document.getElementById('wallpaper-list');
  const saved = localStorage.getItem('wallpaper');
  if (saved) applyWallpaper(saved);

  const none = document.createElement('div');
  none.title = 'None';
  none.style.cssText = 'width:120px;height:80px;cursor:pointer;border:2px solid #aaa;background:linear-gradient(135deg,#0f5da8 0%,#5cb8ff 100%);display:flex;align-items:center;justify-content:center;font-size:0.75rem;color:#fff;';
  none.textContent = 'None';
  if (!saved) none.style.borderColor = '#0a4ea1';
  none.addEventListener('click', () => {
    applyWallpaper('');
    list.querySelectorAll('img, div').forEach(i => i.style.borderColor = 'transparent');
    none.style.borderColor = '#0a4ea1';
  });
  list.appendChild(none);

  wallpapers.forEach(src => {
    const img = document.createElement('img');
    img.src = src;
    img.title = src.split('/').pop();
    img.style.cssText = 'width:120px;height:80px;object-fit:cover;cursor:pointer;border:2px solid transparent;';
    if (saved === src) img.style.borderColor = '#0a4ea1';
    img.addEventListener('click', () => {
      applyWallpaper(src);
      list.querySelectorAll('img, div').forEach(i => i.style.borderColor = 'transparent');
      img.style.borderColor = '#0a4ea1';
    });
    list.appendChild(img);
  });
}
initWallpapers();

// Visitor counter
fetch('https://api.counterapi.dev/v1/flabbsterr/visits/up')
  .then(r => r.json())
  .then(data => {
    const count = String(data.count).padStart(6, '0');
    const el1 = document.getElementById('visit-count');
    const el2 = document.getElementById('visit-count-2');
    if (el1) el1.textContent = count;
    if (el2) el2.textContent = data.count;
  })
  .catch(() => {
    const el1 = document.getElementById('visit-count');
    if (el1) el1.textContent = '??????';
  });

function updateClock() {
  const now = new Date();
  const h = now.getHours() % 12 || 12;
  const m = String(now.getMinutes()).padStart(2, '0');
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  const el = document.getElementById('taskbar-clock');
  if (el) el.textContent = `${h}:${m} ${ampm}`;

  const popup = document.getElementById('clock-popup');
  if (popup && popup.style.display !== 'none') updateClockPopup();
}
updateClock();
setInterval(updateClock, 1000);

function updateClockPopup() {
  const now = new Date();
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const h = now.getHours() % 12 || 12;
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  document.getElementById('clock-popup-time').textContent = `${h}:${m}:${s} ${ampm}`;
  document.getElementById('clock-popup-date').textContent =
    `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
}

function toggleStartMenu() {
  const menu = document.getElementById('start-menu');
  const isHidden = menu.style.display === 'none';
  menu.style.display = isHidden ? 'block' : 'none';
  if (isHidden) {
    const popup = document.getElementById('clock-popup');
    if (popup) popup.style.display = 'none';
  }
}

function triggerShutdown() {
  const menu = document.getElementById('start-menu');
  menu.style.display = 'none';
  const d = document.getElementById('desktop');
  d.style.transition = 'opacity 1.5s';
  d.style.opacity = '0';
  d.style.pointerEvents = 'none';
  setTimeout(() => {
    d.style.background = '#000';
    d.style.opacity = '1';
    const msg = document.createElement('div');
    msg.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-family:"Trebuchet MS",sans-serif;font-size:1.1rem;text-align:center;line-height:2;';
    msg.innerHTML = 'It is now safe to turn off your computer.<br><span style="font-size:0.8rem;color:#aaa;">( refresh to restart )</span>';
    d.appendChild(msg);
  }, 1500);
}

document.addEventListener('click', function(e) {
  const menu = document.getElementById('start-menu');
  const startBtn = document.querySelector('.start-btn');
  if (menu && !menu.contains(e.target) && e.target !== startBtn) {
    menu.style.display = 'none';
  }
  const popup = document.getElementById('clock-popup');
  const clock = document.getElementById('taskbar-clock');
  if (popup && !popup.contains(e.target) && e.target !== clock) {
    popup.style.display = 'none';
  }
});


document.getElementById('taskbar-clock').style.cursor = 'pointer';
document.getElementById('taskbar-clock').addEventListener('click', function() {
  const popup = document.getElementById('clock-popup');
  if (popup.style.display === 'none') {
    updateClockPopup();
    popup.style.display = 'block';
  } else {
    popup.style.display = 'none';
  }
});

function populateSysInfo() {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  document.getElementById('si-browser').textContent = browser;
  document.getElementById('si-platform').textContent = navigator.platform || 'Unknown';
  document.getElementById('si-screen').textContent = `${screen.width} x ${screen.height}`;
  document.getElementById('si-colour').textContent = screen.colorDepth + '-bit';
  document.getElementById('si-memory').textContent = navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'N/A';
  document.getElementById('si-cores').textContent = navigator.hardwareConcurrency || 'N/A';
  document.getElementById('si-lang').textContent = navigator.language;
  document.getElementById('si-online').textContent = navigator.onLine ? 'Yes' : 'No';
}

let gameLoop = null;
let gameResizeObserver = null;

function backToGames() {
  if (gameLoop) { cancelAnimationFrame(gameLoop); gameLoop = null; }
  if (window._pongCleanup) { window._pongCleanup(); window._pongCleanup = null; }
  if (gameResizeObserver) { gameResizeObserver.disconnect(); gameResizeObserver = null; }
  document.getElementById('game-picker').style.display = 'flex';
  document.getElementById('game-area').style.display = 'none';
}

function loadGame(name) {
  document.getElementById('game-picker').style.display = 'none';
  document.getElementById('game-area').style.display = 'block';
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  if (gameLoop) { cancelAnimationFrame(gameLoop); gameLoop = null; }
  if (gameResizeObserver) { gameResizeObserver.disconnect(); gameResizeObserver = null; }

  function resizeAndStart() {
    const area = document.getElementById('game-area');
    canvas.width = canvas.offsetWidth || area.offsetWidth;
    canvas.height = Math.round(canvas.width * (280/360));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameLoop) { cancelAnimationFrame(gameLoop); gameLoop = null; }
    if (window._pongCleanup) { window._pongCleanup(); window._pongCleanup = null; }
    if (name === 'snake') startSnake(canvas, ctx);
    if (name === 'pong') startPong(canvas, ctx);
  }

  resizeAndStart();
  document.getElementById('game-title').textContent = name === 'snake' ? 'Snake' : 'Pong';
  document.getElementById('game-area').style.display = 'flex';
  let snakeResizeReady = false;
  setTimeout(() => { snakeResizeReady = true; }, 500);
  gameResizeObserver = new ResizeObserver(() => {
    resizeAndStart();
    if (name === 'snake' && snakeResizeReady) unlockAchievement('snake_resize');
  });
  gameResizeObserver.observe(document.getElementById('internet-window'));
}

function startSnake(canvas, ctx) {
  const W = canvas.width, H = canvas.height, S = 20;
  let snake = [{x:5,y:5}], dir = {x:1,y:0}, next = {x:1,y:0};
  let food = randomFood();
  let score = 0, dead = false;
  document.getElementById('game-msg').textContent = 'WASD or arrows to move';

  function randomFood() {
    return { x: Math.floor(Math.random()*(W/S)), y: Math.floor(Math.random()*(H/S)) };
  }

  function onKey(e) {
    if ((e.key==='ArrowUp'||e.key==='w') && dir.y===0) next={x:0,y:-1};
    if ((e.key==='ArrowDown'||e.key==='s') && dir.y===0) next={x:0,y:1};
    if ((e.key==='ArrowLeft'||e.key==='a') && dir.x===0) next={x:-1,y:0};
    if ((e.key==='ArrowRight'||e.key==='d') && dir.x===0) next={x:1,y:0};
    e.preventDefault();
  }
  document.addEventListener('keydown', onKey);

  let last = 0;
  function tick(ts) {
    if (dead) { document.removeEventListener('keydown', onKey); return; }
    gameLoop = requestAnimationFrame(tick);
    if (ts - last < 150) return;
    last = ts;
    dir = next;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x<0||head.y<0||head.x>=W/S||head.y>=H/S||snake.some(s=>s.x===head.x&&s.y===head.y)) {
      dead = true;
      ctx.fillStyle='rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#f00';
      ctx.font='bold 24px monospace';
      ctx.textAlign='center';
      ctx.fillText('GAME OVER',W/2,H/2);
      ctx.fillStyle='#fff';
      ctx.font='14px monospace';
      ctx.fillText('Score: '+score,W/2,H/2+28);
      document.removeEventListener('keydown', onKey);
      return;
    }
    snake.unshift(head);
    if (head.x===food.x && head.y===food.y) { food=randomFood(); score++; document.getElementById('game-msg').textContent='Score: '+score; }
    else snake.pop();
    ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#0f0';
    snake.forEach(s=>ctx.fillRect(s.x*S+1,s.y*S+1,S-2,S-2));
    ctx.fillStyle='#f00';
    ctx.fillRect(food.x*S+2,food.y*S+2,S-4,S-4);
  }
  gameLoop = requestAnimationFrame(tick);
}

function startPong(canvas, ctx) {
  let pongLosses = parseInt(localStorage.getItem('pongLosses') || '0');
  const PAD = {w:8,h:50};
  let p1={y:canvas.height/2-25}, p2={y:canvas.height/2-25};
  let ball={x:canvas.width/2,y:canvas.height/2,vx:2,vy:1.5};
  let s1=0, s2=0;
  const keys={};
  document.getElementById('game-msg').textContent = 'W/S or arrows to move  |  Right paddle is AI';

  function onKey(e) { keys[e.key]=e.type==='keydown'; if(['w','s','a','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault(); }
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', onKey);

  let last = 0;
  function tick(ts) {
    const W = canvas.width, H = canvas.height;
    gameLoop = requestAnimationFrame(tick);
    if (ts - last < 1000/60) return;
    last = ts;
    if(keys['w']||keys['ArrowUp']) p1.y=Math.max(0,p1.y-4);
    if(keys['s']||keys['ArrowDown']) p1.y=Math.min(H-PAD.h,p1.y+4);
    const aiCenter = p2.y + PAD.h/2;
    const aiSpeed = 2.5;
    if (aiCenter < ball.y - 4) p2.y = Math.min(H-PAD.h, p2.y+aiSpeed);
    else if (aiCenter > ball.y + 4) p2.y = Math.max(0, p2.y-aiSpeed);
    ball.x+=ball.vx; ball.y+=ball.vy;
    if(ball.y<=0||ball.y>=H) ball.vy*=-1;
    if(ball.x<=16&&ball.y>=p1.y&&ball.y<=p1.y+PAD.h) { ball.vx=Math.abs(ball.vx)*1.05; }
    if(ball.x>=W-16&&ball.y>=p2.y&&ball.y<=p2.y+PAD.h) { ball.vx=-Math.abs(ball.vx)*1.05; }
    if(ball.x<0){s2++;reset(W,H); pongLosses++; localStorage.setItem('pongLosses',pongLosses); if(pongLosses>=10) unlockAchievement('pong_losses');}
    if(ball.x>W){s1++;reset(W,H);}
    ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff';
    ctx.fillRect(8,p1.y,PAD.w,PAD.h);
    ctx.fillRect(W-16,p2.y,PAD.w,PAD.h);
    ctx.beginPath();ctx.arc(ball.x,ball.y,6,0,Math.PI*2);ctx.fill();
    ctx.font='20px monospace';ctx.textAlign='center';
    ctx.fillText(s1+' : '+s2,W/2,28);
    ctx.setLineDash([6,6]);ctx.strokeStyle='#333';
    ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();
    ctx.setLineDash([]);
  }
  function reset(W,H){ball={x:W/2,y:H/2,vx:ball.vx>0?-2:2,vy:1.5};}

  window._pongCleanup = () => { document.removeEventListener('keydown',onKey); document.removeEventListener('keyup',onKey); };
  gameLoop = requestAnimationFrame(tick);
}

function initBin() {
  const bin = document.getElementById('bin-icon');
  makeDraggable(bin, bin, true);

  bin.addEventListener('dblclick', () => {
    const remaining = document.querySelectorAll('.icon:not(#bin-icon)');
    if (remaining.length === 0) {
      unlockAchievement('bin_crash');
      triggerBSOD();
    }
  });

  document.addEventListener('mouseup', function(e) {
    const dragged = window._lastDraggedEl;
    const binRect = bin.getBoundingClientRect();
    const overBin = e.clientX >= binRect.left && e.clientX <= binRect.right &&
                    e.clientY >= binRect.top  && e.clientY <= binRect.bottom;
    bin.classList.remove('bin-drop-active');
    if (!overBin || !dragged) return;
    if (dragged.classList.contains('icon') && dragged !== bin) {
      dragged.remove();
    }
  });

  document.addEventListener('mousemove', function(e) {
    if (!window._draggingEl) return;
    const binRect = bin.getBoundingClientRect();
    const overBin = e.clientX >= binRect.left && e.clientX <= binRect.right &&
                    e.clientY >= binRect.top  && e.clientY <= binRect.bottom;
    if (overBin && window._draggingEl !== bin) bin.classList.add('bin-drop-active');
    else bin.classList.remove('bin-drop-active');
  });
}

function triggerBSOD() {
  const bsod = document.createElement('div');
  bsod.style.cssText = 'position:fixed;inset:0;background:#0000aa;color:#fff;font-family:"Perfect DOS VGA 437","Courier New",monospace;font-size:1rem;z-index:999999;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:4rem;line-height:2;';
  bsod.innerHTML = `
    <div style="font-size:1.1rem;margin-bottom:2rem;">A problem has been detected and FLABBSTERR OS has been shut down to prevent damage to your computer.</div>
    <div style="color:#fff;margin-bottom:2rem;">BIN_IN_BIN_EXCEPTION</div>
    <div style="font-size:0.85rem;color:#aaa;">If this is the first time you've seen this Stop error screen, refresh the page. If this screen appears again, follow these steps:</div>
    <div style="font-size:0.85rem;margin-top:1rem;">Do not put the PC in the bin. Why did you even do that?</div>
    <div style="margin-top:3rem;font-size:0.85rem;">Technical information:</div>
    <div style="font-size:0.85rem;">*** STOP: 0x000000BIN (0xB1N0000, 0x00B1N000, 0x0000B1N0, 0x00000B1N)</div>
    <div style="margin-top:3rem;font-size:0.8rem;color:#aaa;">Press any key to restart</div>
  `;
  document.body.appendChild(bsod);
  document.addEventListener('keydown', () => location.reload(), { once: true });
  bsod.addEventListener('click', () => location.reload(), { once: true });
}

// ── Scanline overlay
const canvas = document.getElementById('static-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function drawScanlines() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y += 2) {
    const flicker = Math.random() > 0.98;
    ctx.fillStyle = flicker
      ? `rgba(255,255,255,${(Math.random() * 0.06).toFixed(3)})`
      : 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, y, canvas.width, 1);
  }
  requestAnimationFrame(drawScanlines);
}
drawScanlines();

// Boot sequence
const bootLines = document.getElementById('boot-lines');
const cursor = document.getElementById('cursor');
const bootScreen = document.getElementById('boot-screen');
const desktop = document.getElementById('desktop');

const lines = [
  'FLABBSTERR (C) 2026, Inc.',
  'BIOS Version 2.54',
  '',
  'CPU: Intel Pentium III  800MHz',
  'Co-Processor: Installed',
  'Memory Test:  262144K OK',
  '',
  '  Detecting Primary Master  ... ST320413A',
  '  Detecting Primary Slave   ... None',
  '  Detecting Secondary Master... CD-ROM',
  '  Detecting Secondary Slave ... None',
  '',
  'Verifying DMI Pool Data...',
  'Boot from CD/DVD : Fail',
  'Boot from Hard Disk...',
  '',
  'NOT Microsoft Windows XP',
  'Loading system files...',
  'Initializing drivers...',
  'Starting Windows...',
  `
░██╗░░░░░░░██╗███████╗██╗░░░░░░█████╗░░█████╗░███╗░░░███╗███████╗
░██║░░██╗░░██║██╔════╝██║░░░░░██╔══██╗██╔══██╗████╗░████║██╔════╝
░╚██╗████╗██╔╝█████╗░░██║░░░░░██║░░╚═╝██║░░██║██╔████╔██║█████╗░░
░░████╔═████║░██╔══╝░░██║░░░░░██║░░██╗██║░░██║██║╚██╔╝██║██╔══╝░░
░░╚██╔╝░╚██╔╝░███████╗███████╗╚█████╔╝╚█████╔╝██║░╚═╝░██║███████╗
░░░╚═╝░░░╚═╝░░╚══════╝╚══════╝░╚════╝░░╚════╝░╚═╝░░░░░╚═╝╚══════╝`
];

const dadJokes = [
  "Why don't scientists trust atoms? Because they make up everything.",
  "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them.",
  "Someone said he was hungry, I said 'Hi Hungry, I'm Flabbsterr!', and then they said who are you, how did you get in my house? I Dunno, I was just trying to make a joke.",
  "Someone lost their lost their arm in an accident, I asked if they're alright, they said they're all left! Was that how the joke went? I don't know, I wasn't there.",
  "I got a joke, uhhhhhhh uhhhhhhhhhhhhhhhhh i forgot sorry",
  "Did you hear the cheese factory that exploded? There was nothing left but de-brie.",
  "I used to play piano by ear, but now I use my hands.",
  "Why did the bicycle fall over? Because it was two-tired.",
  "I told my wife she was drawing her eyebrows too high. She looked surprised.",
  "Why did the tomato turn red? Because it saw the salad dressing.",
  "I would tell you a construction joke, but I'm still working on it. Its gonna be finished when rell seas drops.",
  "Where does Darth Vader shop to get his sneakers? At the Darth Maul.",
  "Where does Darth Maul shoes to get his shoes? At the Darth Vader. what?",
  "Ridwan told me to make a joke about his name, but I don't think it would be very Ridwan-iculous.",
];

document.addEventListener('keydown', function onDel(e) {
  const popup = document.getElementById('del-popup');
  if (e.key === 'Delete' && popup.style.display === 'none') {
    document.getElementById('dad-joke').textContent = dadJokes[Math.floor(Math.random() * dadJokes.length)];
    popup.style.display = 'block';
    unlockAchievement('hidden_page');
    document.addEventListener('keydown', function closePopup(e2) {
      if (e2.key !== 'Delete') return;
      popup.style.display = 'none';
      document.removeEventListener('keydown', closePopup);
    });
  }
});

let bootAudio = null;

// Boot beep
function beep() {
  bootAudio = new Audio('assets/mp3/BootingSequence.mp3');
  bootAudio.play();
}

// Show PRESS ENTER immediately
const firstDiv = document.createElement('div');
firstDiv.textContent = '[ PRESS ENTER TO START ]';
bootLines.appendChild(firstDiv);

function startBoot() {
  bootLines.innerHTML = '';
  document.getElementById('award-header').style.display = 'flex';
  document.getElementById('skip-btn').style.display = 'block';
  if (isMobile) {
    const delHint = document.getElementById('del-hint');
    delHint.style.textDecoration = 'underline';
    delHint.style.cursor = 'pointer';
    delHint.addEventListener('click', () => document.dispatchEvent(new KeyboardEvent('keydown', {key:'Delete'})));
  }
  bootScreen.removeEventListener('click', startBoot);
  document.removeEventListener('keydown', onEnter);
  beep();
  setTimeout(() => { printNextLine(); }, 3000);
}

function onEnter(e) {
  if (e.key !== 'Enter') return;
  startBoot();
}

let lineIndex = 0;

document.addEventListener('keydown', function(e) {
  if (e.key === 'F4') finish();
});

document.addEventListener('keydown', onEnter);
bootScreen.addEventListener('click', startBoot);
bootScreen.focus();

function printNextLine() {
  if (lineIndex >= lines.length) {
    setTimeout(finish, 600);
    return;
  }
  const div = document.createElement('div');
  div.textContent = lines[lineIndex];
  if (lines[lineIndex] === 'NOT Microsoft Windows XP') {
    div.style.color = '#00aa00';
  }
  if (lines[lineIndex].startsWith('░') || lines[lineIndex].startsWith('\n░')) {
    const ascii = document.createElement('pre');
    ascii.style.cssText = 'position:absolute;right:4rem;top:50%;transform:translateY(-50%);font-size:0.85rem;line-height:1.2;color:#aaa;margin:0;white-space:pre';
    ascii.textContent = [
      '         __',
      '        / /\\',
      '       / /  \\',
      '      / /    \\__________',
      '     / /      \\        /\\',
      '    /_/        \\      / /',
      ' ___\\ \\      ___\\____/_/_',
      '/____\\ \\    /___________/\\',
      '\\     \\ \\   \\           \\ \\',
      ' \\     \\ \\   \\____       \\ \\',
      '  \\     \\ \\  /   /\\       \\ \\',
      '   \\   / \\_\\/   / /        \\ \\',
      '    \\ /        / /__________\\/',
      '     /        / /     /',
      '    /        / /     /',
      '   /________/ /\\    /',
      '   \\________\\/\\ \\  /',
      '               \\_\\/'
    ].join('\n');
    bootLines.appendChild(ascii);
    div.textContent = lines[lineIndex];
  }
  bootLines.appendChild(div);
  bootLines.scrollTop = bootLines.scrollHeight;
  lineIndex++;
  setTimeout(printNextLine, lineIndex < 12 ? 300 : 1000);
}

let finished = false;

function finish() {
  if (finished) return;
  finished = true;
  if (bootAudio) { bootAudio.pause(); bootAudio.currentTime = 0; }
  cursor.style.display = 'none';
  bootScreen.style.transition = 'opacity 0.6s';
  bootScreen.style.opacity = '0';
  bootScreen.style.pointerEvents = 'none';
  desktop.classList.remove('hidden');
  const iconContainer = document.querySelector('.desktop-icons');
  const iconData = Array.from(document.querySelectorAll('.icon')).map(icon => ({
    el: icon,
    left: icon.offsetLeft + iconContainer.offsetLeft,
    top: icon.offsetTop + iconContainer.offsetTop
  }));
  const startup = new Audio('assets/mp3/Startup.mp3');
  startup.volume = 0.3;
  startup.play();
  setTimeout(() => {
    bootScreen.style.display = 'none';
    if (document.getElementById('cat-nose').style.display !== 'none') positionCatNose();
    document.querySelectorAll('.window').forEach(w => {
      makeDraggable(w, w.querySelector('.window-titlebar'), false);
      // add minimize button
      const titlebar = w.querySelector('.window-titlebar');
      const closeBtn = titlebar.querySelector('button');
      const minBtn = document.createElement('button');
      minBtn.textContent = '_';
      minBtn.className = 'min-btn';
      minBtn.onclick = () => minimizeWindow(w.id);
      const btnGroup = document.createElement('div');
      btnGroup.style.cssText = 'display:flex;gap:0.2rem;';
      closeBtn.parentNode.insertBefore(btnGroup, closeBtn);
      btnGroup.appendChild(minBtn);
      btnGroup.appendChild(closeBtn);
      // add resize handle
      const resizeHandle = document.createElement('div');
      resizeHandle.className = 'resize-handle';
      resizeHandle.style.cssText = 'position:absolute;right:0;bottom:0;width:14px;height:14px;cursor:se-resize;background:linear-gradient(135deg,transparent 50%,#aaa 50%);';
      w.style.position = 'absolute';
      w.appendChild(resizeHandle);
      resizeHandle.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startW = w.offsetWidth, startH = w.offsetHeight;
        document.body.style.userSelect = 'none';
        const shield = document.createElement('div');
        shield.style.cssText = 'position:fixed;inset:0;z-index:9999;';
        document.body.appendChild(shield);
        function onMove(e) {
          w.style.width = Math.max(200, startW + e.clientX - startX) + 'px';
          w.style.height = Math.max(100, startH + e.clientY - startY) + 'px';
        }
        function onUp() {
          document.body.style.userSelect = '';
          shield.remove();
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
    iconData.forEach(({ el, left, top }, i) => {
      desktop.appendChild(el);
      el.style.position = 'absolute';
      el.style.left = '32px';
      el.style.top = (32 + i * 90) + 'px';
      el.style.margin = '0';
      makeDraggable(el, el, true);
    });
    // place bin icon on desktop
    const bin = document.getElementById('bin-icon');
    desktop.appendChild(bin);
    bin.style.position = 'absolute';
    bin.style.left = '32px';
    bin.style.top = (desktop.offsetHeight - 42 - 90 - 32) + 'px';
    bin.style.margin = '0';
    iconContainer.remove();
    initBin();
  }, 600);
}

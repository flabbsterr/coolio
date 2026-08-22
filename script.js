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
    title: "Whats worse than a dad joke, Two dad jokes.",
    hint: 'find the hidden menu on the start-up screen',
    secret: true
  },
  {
    id: 'pong_losses',
    title: 'Insane Skill Issue',
    hint: 'be bad at pong.',
    secret: false
  },
  {
    id: 'bin_crash',
    title: "how'd you do that kaspian?",
    hint: 'maybe the real trash was the computer all along.',
    secret: true
  },
  {
    id: 'ouroboros',
    title: 'Ouroboros',
    hint: 'a boundless cycle',
    secret: true
  },
  {
    id: 'cat_nose',
    title: 'oo iaa ooi iaaa',
    hint: 'do not touch the cat nose 100 times (this is really buggy, sorry if it doesnt work)',
    secret: false
  },
 {
    id: 'world',
    title: 'Around the World',
    hint: 'click on the world icon',
    secret: true
  },
  {
    id: 'shutdown',
    title: 'Goodnight',
    hint: 'Shut down the PC',
    secret: false
  },
  {
    id: 'konami_code',
    title: 'REF HES CHEATING',
    hint: 'up up down down left right left right B A',
    secret: true
  },
  {
    id: 'scp096',
    title: 'Four Pixels',
    hint: 'you looked at it.',
    secret: true
  }
];

function getAchievements() {
  return JSON.parse(localStorage.getItem('achievements') || '{}');
}

window.resetAchievements = function() {
  localStorage.removeItem('achievements');
  localStorage.removeItem('pongLosses');
  localStorage.removeItem('catNoseCount');
  localStorage.removeItem('goldTaskbar');
  localStorage.removeItem('goldTaskbarOn');
  console.log('Achievements reset.');
};

function promptResetAchievements() {
  document.getElementById('reset-confirm').style.display = 'flex';
}

function confirmResetAchievements() {
  window.resetAchievements();
  catNoseCount = 0;
  document.getElementById('reset-confirm').style.display = 'none';
  renderAchievements();
  applyGoldTaskbar();
  updateGoldToggleButton();
}

function unlockAchievement(id) {
  const data = getAchievements();
  if (data[id]) return;
  data[id] = Date.now();
  localStorage.setItem('achievements', JSON.stringify(data));
  const a = ACHIEVEMENTS.find(x => x.id === id);
  if (a) { new Audio('assets/mp3/achievementUnlock.mp3').play(); showAchievementToast(a); }
  if (document.getElementById('achievements-window').style.display !== 'none') renderAchievements();
  if (ACHIEVEMENTS.every(x => data[x.id])) triggerGoldTaskbar();
}

function triggerGoldTaskbar() {
  if (localStorage.getItem('goldTaskbar') !== '1') {
    localStorage.setItem('goldTaskbar', '1');
    showAchievementToast({ title: 'well done, you got all achievements. As a reward, you can now use a golden taskbar (how mundane, i know)' });
  }
  applyGoldTaskbar();
  updateGoldToggleButton();
}

function applyGoldTaskbar() {
  const taskbar = document.querySelector('.taskbar');
  if (!taskbar) return;
  // only apply gold visuals if achievements are fully unlocked
  const ach = getAchievements();
  const allUnlocked = ACHIEVEMENTS.every(x => ach[x.id]);
  if (!allUnlocked) {
    taskbar.style.background = '';
    taskbar.style.color = '';
    document.body.classList.remove('gold-theme');
    return;
  }
  const on = localStorage.getItem('goldTaskbarOn') !== '0';
  if (on) {
    taskbar.style.background = 'linear-gradient(180deg,#ffe066 0%,#c8960a 100%)';
    taskbar.style.color = '#3a2a00';
  } else {
    taskbar.style.background = '';
    taskbar.style.color = '';
  }
  try {
    document.body.classList.toggle('gold-theme', on);
  } catch (e) {
  }
}

function toggleGoldTaskbar() {
  if (localStorage.getItem('goldTaskbar') !== '1') return;
  const on = localStorage.getItem('goldTaskbarOn') !== '0';
  localStorage.setItem('goldTaskbarOn', on ? '0' : '1');
  // Update visuals immediately
  applyGoldTaskbar();
  updateGoldToggleButton();
}

function updateGoldToggleButton() {
  const btn = document.getElementById('gold-toggle');
  if (!btn) return;
  // Only shows the toggle if the achievements are fully complete and gold unlocked
  const ach = getAchievements();
  const allUnlocked = ACHIEVEMENTS.every(x => ach[x.id]);
  const unlocked = localStorage.getItem('goldTaskbar') === '1';
  if (!allUnlocked || !unlocked) {
    btn.style.display = 'none';
    return;
  }
  btn.style.display = 'inline-block';
  const on = localStorage.getItem('goldTaskbarOn') !== '0';
  btn.textContent = on ? 'Gold: ON' : 'Gold: OFF';
}

function showAchievementToast(a) {
  const toast = document.createElement('div');
  toast.className = 'achievement-toast';
  toast.innerHTML = `<div class="achievement-toast-bar"><span class="achievement-toast-label">Achievement Unlocked!</span></div><div class="achievement-toast-title">${a.title}</div>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.add('achievement-toast-in');
      setTimeout(() => {
        toast.classList.remove('achievement-toast-in');
        setTimeout(() => toast.remove(), 500);
      }, 3200);
    });
  });
}

function renderAchievements() {
  const data = getAchievements();
  const list = document.getElementById('achievements-list');
  if (!list) return;
  list.innerHTML = '';
  const unlocked = ACHIEVEMENTS.filter(a => data[a.id]).length;
  const pct = Math.round((unlocked / ACHIEVEMENTS.length) * 100);
  const pctEl = document.getElementById('ach-percent');
  if (pctEl) {
    pctEl.textContent = pct + '%';
    pctEl.style.color = pct === 100 ? '#c8960a' : '#555';
    pctEl.style.textShadow = pct === 100 ? '0 0 6px #ffe066' : 'none';
  }
  ACHIEVEMENTS.forEach(a => {
    const unlocked = !!data[a.id];
    const div = document.createElement('div');
    div.className = 'achievement' + (unlocked ? '' : ' locked');
    const ext = a.id === 'cat_nose' ? 'gif' : a.id === 'konami_code' ? 'webp' : 'png';
    const imgSrc = `assets/icons/achivement/${a.id}.${ext}`;
    const iconHtml = unlocked
      ? `<img src="${imgSrc}" style="width:40px;height:40px;object-fit:contain;image-rendering:pixelated;">`
      : `<div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;color:#aaa;font-weight:bold;">?</div>`;
    div.innerHTML = `<div class="achievement-icon">${iconHtml}</div><div><div class="achievement-title">${unlocked ? a.title : '???'}</div><div class="achievement-desc">${a.hint}</div></div>`;
    list.appendChild(div);
  });
}

let topZ = 10;

function bringToFront(el) {
  topZ++;
  el.style.zIndex = topZ;
}

function makeDraggable(el, handle, snap) {
  handle = handle || el;
  handle.style.cursor = 'grab';
  handle.addEventListener('mousedown', function(e) {
    if (e.target.tagName === 'BUTTON') return;
    e.preventDefault();
    if (!snap) bringToFront(el);

    window._draggingEl = el;
      window._wasDragging = false;
    const rect = el.getBoundingClientRect();
    const offX = e.clientX - rect.left;
    const offY = e.clientY - rect.top;
    el.style.position = 'absolute';
    el.style.margin = '0';
    handle.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    function onMove(e) {
      window._wasDragging = true;
      const desktop = document.getElementById('desktop');
      const taskbarH = 42;
      const titlebarH = 32;
      const minVisible = 60;
      const newLeft = e.clientX - offX;
      const newTop = e.clientY - offY;
      if (snap) {
        el.style.left = Math.max(-(el.offsetWidth - minVisible), Math.min(newLeft, desktop.offsetWidth - minVisible)) + 'px';
        el.style.top = Math.max(0, Math.min(newTop, desktop.offsetHeight - taskbarH - titlebarH)) + 'px';
      } else {
        const boundedLeft = Math.max(-(el.offsetWidth - minVisible), Math.min(newLeft, desktop.offsetWidth - minVisible));
        const boundedTop = Math.max(0, Math.min(newTop, desktop.offsetHeight - taskbarH - (el.offsetHeight || el.getBoundingClientRect().height)));
        el.style.left = boundedLeft + 'px';
        el.style.top = boundedTop + 'px';
      }
      el.style.transform = 'none';
    }
    function onUp(e) {
      handle.style.cursor = 'grab';
      document.body.style.userSelect = '';
      window._lastDraggedEl = el;
      window._wasDragging = true;
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
            const winId = el.getAttribute('onclick');
            if (winId) {
              const match = winId.match(/openWindow\('([^']+)'\)/);
              if (match) closeWindow(match[1]);
            }
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
} 

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
  w.style.display = id === 'spotify-window' || id === 'notepad-window' || id === 'internet-window' || id === 'achievements-window' ? 'flex' : 'block';
  bringToFront(w);
  removeTaskbarTab(id);
  if (id === 'computer-window') populateSysInfo();
  if (id === 'achievements-window') renderAchievements();
  if (id === 'notepad-window') {
    const ta = document.getElementById('notepad-text');
    ta.value = localStorage.getItem('notepad') || '';
    ta.oninput = () => localStorage.setItem('notepad', ta.value);
  }
  if (id === 'internet-window') {
    document.getElementById('game-picker').style.display = 'flex';
    document.getElementById('game-area').style.display = 'none';
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
  'assets/wallpapers/Scp069.jpg',
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
  if (src && src.includes('Scp069')) {
    let hitArea = document.getElementById('scp096-hit');
    if (!hitArea) {
      hitArea = document.createElement('div');
      hitArea.id = 'scp096-hit';
      hitArea.style.cssText = 'position:absolute;width:160px;height:160px;border-radius:50%;z-index:9998;cursor:pointer;';
      document.getElementById('desktop').appendChild(hitArea);
    }
    function positionHit() {
      const dw = d.offsetWidth, dh = d.offsetHeight;
      hitArea.style.left = (dw * 0.72 - 30) + 'px';
      hitArea.style.top  = (dh * 0.54 - 30) + 'px';
    }
    positionHit();
    window._scpHitResize = positionHit;
    window.addEventListener('resize', window._scpHitResize);
    hitArea.style.display = 'block';
    hitArea.onclick = function() {
      hitArea.onclick = null;
      hitArea.style.display = 'none';
      unlockAchievement('scp096');
      const scream = new Audio('assets/mp3/scp096scream.mp3');
      scream.play();
      scream.addEventListener('ended', triggerBSOD);
    };
  } else {
    const hitArea = document.getElementById('scp096-hit');
    if (hitArea) hitArea.style.display = 'none';
    if (window._scpHitResize) { window.removeEventListener('resize', window._scpHitResize); window._scpHitResize = null; }
    d.onclick = null;
    d.style.cursor = '';
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
if (localStorage.getItem('goldTaskbar') === '1') applyGoldTaskbar();
updateGoldToggleButton();

// Discord status
function updateDiscordStatus() {
  fetch('https://api.lanyard.rest/v1/users/627839997604528128')
    .then(r => r.json())
    .then(({ data }) => {
      const dot = document.getElementById('discord-status-dot');
      const text = document.getElementById('discord-status-text');
      if (!dot || !text) return;
      const status = data.discord_status;
      const colors = { online: '#4cff4c', idle: '#ffcc00', dnd: '#ff4444', offline: '#aaa' };
      const labels = { online: 'online', idle: 'idle', dnd: 'do not disturb', offline: 'offline (probably sleeping)' };
      dot.style.background = colors[status] || '#aaa';
      text.textContent = labels[status] || status;
    })
    .catch(() => {
      const text = document.getElementById('discord-status-text');
      if (text) text.textContent = 'status unavailable';
    });
}
updateDiscordStatus();
setInterval(updateDiscordStatus, 30000);

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
    if (el1) el1.textContent = 'ts dont work bro';
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
  const popup = document.getElementById('clock-popup');
  if (popup) popup.style.display = 'none';
  const taskbar = document.querySelector('.taskbar');
  if (isHidden) {
    updateGoldToggleButton();
  } else {
    applyGoldTaskbar();
  }
}

function triggerShutdown() {
  document.getElementById('start-menu').style.display = 'none';
  unlockAchievement('shutdown');
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:#000;z-index:999998;opacity:0;transition:opacity 1.5s;display:flex;align-items:center;justify-content:center;';
  const msg = document.createElement('div');
  msg.style.cssText = 'color:#fff;font-family:"Trebuchet MS",sans-serif;font-size:1.1rem;text-align:center;line-height:2;opacity:0;transition:opacity 0.5s;';
  msg.innerHTML = 'It is now safe to turn off your computer.<br><span style="font-size:0.8rem;color:#aaa;">( refresh to restart )</span>';
  overlay.appendChild(msg);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      setTimeout(() => { msg.style.opacity = '1'; }, 1500);
    });
  });
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


document.getElementById('world-icon-btn').addEventListener('click', function() {
  unlockAchievement('world');
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:99995;display:flex;align-items:center;justify-content:center;';
  const gif = document.createElement('img');
  gif.src = 'assets/icons/aroundTheWorld.gif';
  gif.style.cssText = 'max-width:80vw;max-height:80vh;image-rendering:pixelated;';
  overlay.appendChild(gif);
  document.body.appendChild(overlay);
  const audio = new Audio('assets/mp3/aroundTheWorld.mp3');
  audio.play();
  audio.addEventListener('ended', () => { overlay.remove(); });
  overlay.addEventListener('click', () => { audio.pause(); overlay.remove(); });
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
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  if (gameLoop) { cancelAnimationFrame(gameLoop); gameLoop = null; }
  if (gameResizeObserver) { gameResizeObserver.disconnect(); gameResizeObserver = null; }
  if (window._pongCleanup) { window._pongCleanup(); window._pongCleanup = null; }

  document.getElementById('game-title').textContent = name === 'snake' ? 'Snake' : 'Pong';
  document.getElementById('game-area').style.display = 'flex';

  function setCanvasSize() {
    const area = document.getElementById('game-area');
    const toolbar = area.querySelector('div');
    canvas.width = area.offsetWidth;
    canvas.height = area.offsetHeight - (toolbar ? toolbar.offsetHeight : 0);
  }

  setCanvasSize();
  if (name === 'snake') startSnake(canvas, ctx);
  if (name === 'pong') startPong(canvas, ctx);

  // attach observer AFTER game starts to avoid triggering pause on load
  setTimeout(() => {
    gameResizeObserver = new ResizeObserver(() => {
      if (name === 'snake') {
        window._snakePauseResize && window._snakePauseResize();
      } else {
        if (gameLoop) { cancelAnimationFrame(gameLoop); gameLoop = null; }
        if (window._pongCleanup) { window._pongCleanup(); window._pongCleanup = null; }
        setCanvasSize();
        startPong(canvas, ctx);
      }
    });
    gameResizeObserver.observe(document.getElementById('internet-window'));
  }, 200);
}

function startSnake(canvas, ctx) {
  const S = 20;
  let W = canvas.width, H = canvas.height;
  let snake = [{x:5,y:5}], dir = {x:1,y:0}, next = {x:1,y:0};
  let food = randomFood();
  let score = 0, dead = false, paused = false;
  document.getElementById('game-msg').textContent = 'WASD or arrows to move  |  ESC to pause';

  function randomFood() {
    return { x: Math.floor(Math.random()*(W/S)), y: Math.floor(Math.random()*(H/S)) };
  }

  function drawPaused() {
    ctx.fillStyle='rgba(0,0,0,0.55)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff';
    ctx.font='bold 22px monospace';
    ctx.textAlign='center';
    ctx.fillText('PAUSED',W/2,H/2-10);
    ctx.font='16px monospace';
    ctx.fillText('Score: '+score,W/2,H/2+15);
    ctx.font='14px monospace';
    ctx.fillText('RESUME',W/2,H/2+40);
  }

  function drawGame() {
    ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#0f0';
    snake.forEach(s=>ctx.fillRect(s.x*S+1,s.y*S+1,S-2,S-2));
    ctx.fillStyle='#f00';
    ctx.fillRect(food.x*S+2,food.y*S+2,S-4,S-4);
  }

  function resume() {
    paused = false;
    document.addEventListener('keydown', onKey);
    gameLoop = requestAnimationFrame(tick);
  }

  function manuallyPauseGame() {
    if (dead) return;
    if (paused) {
      resume();
    } else {
      paused = true;
      if (gameLoop) { cancelAnimationFrame(gameLoop); gameLoop = null; }
      document.removeEventListener('keydown', onKey);
      drawGame();
      drawPaused();
    }
  }

  function onEsc(e) {
    if (e.key === 'Escape') manuallyPauseGame();
  }
  window.addEventListener('keydown', onEsc);

  window._snakePauseResize = () => {
    if (dead) return;
    paused = true;
    if (gameLoop) { cancelAnimationFrame(gameLoop); gameLoop = null; }
    document.removeEventListener('keydown', onKey);
    const area = document.getElementById('game-area');
    const toolbar = area.querySelector('div');
    canvas.width = area.offsetWidth;
    canvas.height = area.offsetHeight - (toolbar ? toolbar.offsetHeight : 0);
    W = canvas.width; H = canvas.height;
    // clamp food inside new bounds
    food.x = Math.min(food.x, Math.floor(W/S) - 1);
    food.y = Math.min(food.y, Math.floor(H/S) - 1);
    drawGame();
    drawPaused();
  };

  canvas.onclick = () => {
    if (dead) {
      canvas.onclick = null;
      window._snakePauseResize = null;
      window.removeEventListener('keydown', onEsc);
      startSnake(canvas, ctx);
      return;
    }
    if (paused) resume();
  };

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
    if (dead || paused) return;
    gameLoop = requestAnimationFrame(tick);
    if (ts - last < 150) return;
    last = ts;
    dir = next;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    const hitWall = head.x<0||head.y<0||head.x>=W/S||head.y>=H/S;
    const tail = snake[snake.length-1];
    const biteTail = tail && head.x===tail.x && head.y===tail.y;
    const hitsBody = snake.slice(0,-1).some(s=>s.x===head.x&&s.y===head.y);
    if (biteTail) unlockAchievement('ouroboros');
    if (hitWall || hitsBody || biteTail) {
      dead = true;
      window.removeEventListener('keydown', onEsc);
      ctx.fillStyle='rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#f00';
      ctx.font='bold 24px monospace';
      ctx.textAlign='center';
      ctx.fillText('GAME OVER',W/2,H/2);
      ctx.fillStyle='#fff';
      ctx.font='14px monospace';
      ctx.fillText('Score: '+score,W/2,H/2+28);
      ctx.fillText('RESTART',W/2,H/2+50);
      document.removeEventListener('keydown', onKey);
      return;
    }
    snake.unshift(head);
    if (head.x===food.x && head.y===food.y) { food=randomFood(); score++; document.getElementById('game-msg').textContent='Score: '+score; }
    else snake.pop();
    drawGame();
  }
  gameLoop = requestAnimationFrame(tick);
}

function startPong(canvas, ctx) {
  let pongLosses = parseInt(localStorage.getItem('pongLosses') || '0');
  const PAD = {w:8,h:50};
  let p1={y:canvas.height/2-25}, p2={y:canvas.height/2-25};
  let ball={x:canvas.width/2,y:canvas.height/2,vx:2,vy:1.5};
  let s1=0, s2=0, paused=false;
  const keys={};
  document.getElementById('game-msg').textContent = 'W/S or arrows to move  |  Right paddle is AI  |  ESC to pause';

  function onKey(e) { keys[e.key]=e.type==='keydown'; if(['w','s','a','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault(); }
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', onKey);

  function drawPaused() {
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle='rgba(0,0,0,0.55)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff';
    ctx.font='bold 22px monospace';
    ctx.textAlign='center';
    ctx.fillText('PAUSED',W/2,H/2-10);
    ctx.font='14px monospace';
    ctx.fillText('RESUME',W/2,H/2+18);
  }

  function onEsc(e) {
    if (e.key !== 'Escape') return;
    if (paused) {
      paused = false;
      gameLoop = requestAnimationFrame(tick);
    } else {
      paused = true;
      if (gameLoop) { cancelAnimationFrame(gameLoop); gameLoop = null; }
      drawPaused();
    }
  }
  window.addEventListener('keydown', onEsc);

  let last = 0;
  function tick(ts) {
    if (paused) return;
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
    if(ball.x<0){s2++;reset(W,H); pongLosses++; localStorage.setItem('pongLosses',pongLosses); if(pongLosses>=3) unlockAchievement('pong_losses');}
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

  window._pongCleanup = () => {
    document.removeEventListener('keydown',onKey);
    document.removeEventListener('keyup',onKey);
    window.removeEventListener('keydown',onEsc);
  };
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
    if (!overBin || !dragged || !window._wasDragging) return;
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
    <div style="font-size:0.85rem;margin-top:1rem;">Why did you even do that?</div>
    <div style="margin-top:3rem;font-size:0.85rem;">Technical information:</div>
    <div style="font-size:0.85rem;">*** STOP: 0x000000BIN (0xB1N0000, 0x00B1N000, 0x0000B1N0, 0x00000B1N)</div>
    <div style="margin-top:3rem;font-size:0.8rem;color:#aaa;">Press any key to restart</div>
  `;
  document.body.appendChild(bsod);
  document.addEventListener('keydown', () => location.reload(), { once: true });
  bsod.addEventListener('click', () => location.reload(), { once: true });
}

// ── Music Player ─────────────────────────────────────────────
const MP_SONGS = [
  { title: 'Do For Love', artist: '2Pac ft. Eric Williams', src: 'https://github.com/flabbsterr/coolio/releases/download/music/2Pac.-.Do.For.Love.Official.Music.Video.ft.Eric.Williams.mp3' },
  { title: 'ALL_URS', artist: 'Alan Vuong', src: 'https://github.com/flabbsterr/coolio/releases/download/music/alan.vuong.-.ALL_URS.Official.Visualizer.mp3' },
  { title: 'Sunscreen', artist: 'Ax and the Hatchetmen', src: 'https://github.com/flabbsterr/coolio/releases/download/music/Ax.and.the.Hatchetmen.-.Sunscreen.Live.in.Studio.mp3' },
  { title: 'Honest', artist: 'Baby Keem', src: 'https://github.com/flabbsterr/coolio/releases/download/music/Baby.Keem.-.Honest.Official.Video.mp3' },
  { title: 'DtMF', artist: 'Bad Bunny', src: 'https://github.com/flabbsterr/coolio/releases/download/music/Bad.Bunny.-.DtMF.Letra.mp3' },
  { title: 'Akaza', artist: 'Blanco', src: 'https://github.com/flabbsterr/coolio/releases/download/music/Blanco.-.Akaza.Official.Music.Video.mp3' },
  { title: 'Regime', artist: 'Blanco', src: 'https://github.com/flabbsterr/coolio/releases/download/music/Blanco.-.Regime.Official.Music.Video.mp3' },
  { title: 'CLOUDED', artist: 'Brent Faiyaz', src: 'https://github.com/flabbsterr/coolio/releases/download/music/Brent.Faiyaz.-.CLOUDED.Official.Audio.mp3' },
  { title: 'I Really Want to Stay at Your House', artist: 'Rosa Walton & Hallie Coggins', src: 'https://github.com/flabbsterr/coolio/releases/download/music/CYBERPUNK.2077.SOUNDTRACK.-.I.REALLY.WANT.TO.STAY.AT.YOUR.HOUSE.by.Rosa.Walton.Hallie.Coggins.mp3' },
  { title: 'Let You Down', artist: 'Dawid Podsiadło', src: 'https://github.com/flabbsterr/coolio/releases/download/music/Cyberpunk_.Edgerunners.Ending.Theme._.Let.You.Down.by.Dawid.Podsiado._.Netflix.mp3' },
  { title: 'Like I Want You', artist: 'GIVON', src: 'https://github.com/flabbsterr/coolio/releases/download/music/GIVON.-.Like.I.Want.You.Official.Audio.mp3' },
  { title: 'In the Pool', artist: '', src: 'https://github.com/flabbsterr/coolio/releases/download/music/in.the.pool.mp3' },
  { title: 'YUKON', artist: 'Justin Bieber', src: 'https://github.com/flabbsterr/coolio/releases/download/music/Justin.Bieber.-.YUKON.mp3' },
  { title: 'Liquid Smooth (Lumatone Version)', artist: '', src: 'https://github.com/flabbsterr/coolio/releases/download/music/Liquid.Smooth.Lumatone.Version.-.super.slowed_dreamy.version.mp3' },
  { title: 'Loose Cannon', artist: '', src: 'https://github.com/flabbsterr/coolio/releases/download/music/Loose.Cannon.mp3' },
  { title: '4me 4me', artist: 'Malcolm Todd', src: 'https://github.com/flabbsterr/coolio/releases/download/music/Malcolm.Todd.-.4me.4me.Lyrics.mp3' },
  { title: 'Gold Teeth', artist: 'Marlon Craft', src: 'https://github.com/flabbsterr/coolio/releases/download/music/Marlon.Craft.-.Gold.Teeth.Official.Music.Video.mp3' },
  { title: 'RUSSIAN ROULETTE (I ADORE YOU)', artist: 'millkzy', src: 'https://github.com/flabbsterr/coolio/releases/download/music/millkzy-RUSSIAN.ROULETTEI.ADORE.YOU.official.kind.of.sorta.visualizer.mp3' },
  { title: 'Wonderwall', artist: 'Oasis', src: 'https://github.com/flabbsterr/coolio/releases/download/music/Oasis.-.Wonderwall.Official.Video.mp3' },
  { title: 'Circles', artist: 'Post Malone', src: 'https://github.com/flabbsterr/coolio/releases/download/music/Post.Malone.-.Circles.mp3' },
  { title: 'BABY IM BACK', artist: 'The Kid LAROI', src: 'https://github.com/flabbsterr/coolio/releases/download/music/The.Kid.LAROI.-.BABY.IM.BACK.Official.Audio.mp3' },
  { title: 'Runnin', artist: 'The Pharcyde', src: 'https://github.com/flabbsterr/coolio/releases/download/music/The.Pharcyde.-.Runnin.Official.HD.Music.Video.mp3' },
  { title: 'Tuna Salad Samba', artist: '', src: 'https://github.com/flabbsterr/coolio/releases/download/music/Tuna.Salad.Samba.mp3' },
  { title: 'Willing', artist: 'feat. LF SCARZ', src: 'https://github.com/flabbsterr/coolio/releases/download/music/Willing.feat.LF.SCARZ.mp3' },
];

let mpIndex = 0, mpPlaying = false, mpShuffled = false;
const mpAudio = new Audio();

mpAudio.addEventListener('timeupdate', () => {
  const prog = document.getElementById('mp-progress');
  const cur = document.getElementById('mp-cur');
  if (!prog || !mpAudio.duration) return;
  prog.max = Math.floor(mpAudio.duration);
  prog.value = Math.floor(mpAudio.currentTime);
  cur.textContent = mpFmt(mpAudio.currentTime);
});

mpAudio.addEventListener('loadedmetadata', () => {
  document.getElementById('mp-dur').textContent = mpFmt(mpAudio.duration);
});

mpAudio.addEventListener('ended', () => mpNext());

document.getElementById('mp-volume').addEventListener('input', function() {
  mpAudio.volume = this.value / 100;
});

document.getElementById('mp-progress').addEventListener('input', function() {
  mpAudio.currentTime = this.value;
});

function mpFmt(s) {
  s = Math.floor(s || 0);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

function mpLoad(index) {
  if (!MP_SONGS.length) return;
  mpIndex = (index + MP_SONGS.length) % MP_SONGS.length;
  const song = MP_SONGS[mpIndex];
  mpAudio.src = song.src;
  document.getElementById('mp-title').textContent = song.title;
  document.getElementById('mp-artist').textContent = song.artist || '';
  document.getElementById('mp-cur').textContent = '0:00';
  document.getElementById('mp-dur').textContent = '0:00';
  document.getElementById('mp-progress').value = 0;
  document.querySelectorAll('.mp-item').forEach((el, i) => el.classList.toggle('active', i === mpIndex));
  if (mpPlaying) mpAudio.play();
}

function mpToggle() {
  if (!MP_SONGS.length) return;
  if (!mpAudio.src) mpLoad(0);
  if (mpPlaying) { mpAudio.pause(); mpPlaying = false; }
  else { mpAudio.play(); mpPlaying = true; }
  document.getElementById('mp-playbtn').innerHTML = mpPlaying ? '&#9646;&#9646;' : '&#9654;';
}

function mpNext() {
  mpPlaying = true;
  if (mpShuffled) { mpLoad(Math.floor(Math.random() * MP_SONGS.length)); }
  else { mpLoad(mpIndex + 1); }
}
function mpPrev() { mpPlaying = true; mpLoad(mpIndex - 1); }

function mpShuffle() {
  mpShuffled = !mpShuffled;
  document.getElementById('mp-shufflebtn').classList.toggle('active', mpShuffled);
}

function mpInitList() {
  const list = document.getElementById('mp-list');
  list.innerHTML = '';
  if (!MP_SONGS.length) {
    list.innerHTML = '<div style="padding:1rem;color:#666;font-size:0.8rem;text-align:center;">No songs added yet</div>';
    return;
  }
  MP_SONGS.forEach((song, i) => {
    const div = document.createElement('div');
    div.className = 'mp-item' + (i === mpIndex ? ' active' : '');
    div.style.cssText = 'display:flex;justify-content:space-between;align-items:center;';
    const name = document.createElement('span');
    name.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;';
    name.textContent = (song.artist ? song.artist + ' - ' : '') + song.title;
    const dur = document.createElement('span');
    dur.style.cssText = 'font-size:0.7rem;color:#888;flex-shrink:0;margin-left:0.5rem;';
    dur.textContent = '—:——';
    const tmp = new Audio();
    tmp.src = song.src;
    tmp.addEventListener('loadedmetadata', () => { dur.textContent = mpFmt(tmp.duration); });
    div.appendChild(name);
    div.appendChild(dur);
    div.onclick = () => { mpPlaying = true; mpLoad(i); document.getElementById('mp-playbtn').innerHTML = '&#9646;&#9646;'; };
    list.appendChild(div);
  });
}
mpInitList();

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
  "Someone lost their arm in an accident, I asked if they're alright, they said they're all left! Was that how the joke went? I don't know, he bled out.",
  "I got a joke, uhhhhhhh uhhhhhhhhhhhhhhhhh i forgot sorry",
  "Did you hear the cheese factory that exploded? There was nothing left but de-brie.",
  "I used to play piano by ear, but now I use my hands.",
  "Why did the bicycle fall over? Because it was two-tired.",
  "I told my wife she was drawing her eyebrows too high. She looked surprised.",
  "Why did the tomato turn red? Because it saw the salad dressing.",
  "I would tell you a construction joke, but I'm still working on it. Its gonna be finished when half life 3 drops.",
  "Where does Darth Vader shop to get his sneakers? At the Darth Maul.",
  "Where does Darth Maul shoes to get his shoes? At the Darth Vader. what?",
  "Ridwan told me not to make a joke about his name, but I think it would be very Ridwan-iculous if I didn't.",
  "Why did the gym close down? It just didn't work out.",
  "I passed my driving test on the first try. I guess you could say I was driven to succeed.",
  "If you're an american when you enter the bathroom, and an american when you leave, what are you while you're in the bathroom? European.",
  "What did the fish say when he swam into a wall? Dam.",
  "How do you keep an idiot in suspense? I'll tell you tomorrow.",
  "I'm tired of making these jokes boss, please no more, I can't think of any more jokes, I need to go to bed, please no more jokes, I can't think of any more jokes, please no more jokes, I can't think of any more jokes, please no more jokes, I can't think of any more jokes, please no more jokes, I can't think of any more jokes, please no more jokes, I can't think of any more jokes, please no more jokes, I can't think of any more jokes, please no more jokes, I can't think of any more jokes, please no more jokes, I can't think of any more jokes, please no more jokes.",
  "I was going to tell a time-travel joke, but you guys didn't like it.",
  "It's lupus,",
  "What do you call a spider with 10 eyes, a Spiiiiiiiiiider",
  "What side of a chicken has the most feathers? The outside.",
  "What do you call a cow with no legs? Ground beef.",
  "Why did the coffee file a police report? It got mugged.",
  "Why did the math book look sad? Because it had too many problems.",
  "Why did the chicken cross the playground? To get to the other slide.",
  "Why did the banana go to the doctor? Because it wasn't peeling well.",
  "Why did the computer go to the doctor? It had a virus.",
  "Why did the golfer bring two pairs of pants? In case he got a hole in one.",
  "What do you call a fish with no eyes? Fsh.",
  "What do you call a fish with a bowtie? Sofishticated.",
  "Three blondes walk into a bar, you think the other two would have seen it!"
];

// Konami Code
(function() {
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let ki = 0;
  document.addEventListener('keydown', function(e) {
    if (e.key === KONAMI[ki]) { ki++; if (ki === KONAMI.length) { unlockAchievement('konami_code'); ki = 0; } }
    else ki = e.key === KONAMI[0] ? 1 : 0;
  });
})();

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

const firstDiv = document.createElement('div');
firstDiv.textContent = '[ PRESS ENTER TO START ]';
bootLines.appendChild(firstDiv);

function startBoot() {
  bootLines.innerHTML = '';
  document.getElementById('award-header').style.display = 'flex';
  document.getElementById('skip-btn').style.display = 'block';
  const delHint = document.getElementById('del-hint');
  delHint.style.textDecoration = 'underline';
  delHint.style.cursor = 'pointer';
  delHint.addEventListener('click', () => document.dispatchEvent(new KeyboardEvent('keydown', {key:'Delete'})));
  if (isMobile) {
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
  const iconData = Array.from(document.querySelectorAll('.icon')).map(icon => {
    const onclickAttr = icon.getAttribute('onclick') || '';
    const match = onclickAttr.match(/openWindow\('([^']+)'\)/);
    const winId = match ? match[1] : null;
    return {
      el: icon,
      left: icon.offsetLeft + iconContainer.offsetLeft,
      top: icon.offsetTop + iconContainer.offsetTop,
      winId
    };
  });
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
      resizeHandle.style.cssText = 'position:absolute;right:0;bottom:0;width:24px;height:24px;cursor:se-resize;background:linear-gradient(135deg,transparent 50%,#888 50%);z-index:10;';
      w.style.position = 'absolute';
      w.appendChild(resizeHandle);
      resizeHandle.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startW = w.offsetWidth, startH = w.offsetHeight;
        const content = w.querySelector('.window-content');
        document.body.style.userSelect = 'none';
        if (content) content.style.pointerEvents = 'none';
        function onMove(e) {
          w.style.width = Math.max(300, startW + e.clientX - startX) + 'px';
          w.style.height = Math.max(225, startH + e.clientY - startY) + 'px';
        }
        function onUp() {
          document.body.style.userSelect = '';
          if (content) content.style.pointerEvents = '';
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
    iconData.forEach(({ el, winId }, i) => {
      const totalIcons = iconData.length + 1;
      const availH = desktop.offsetHeight - 42 - 64;
      const dynGrid = Math.min(90, Math.floor(availH / totalIcons));
      desktop.appendChild(el);
      el.style.position = 'absolute';
      el.style.left = '32px';
      el.style.top = (32 + i * dynGrid) + 'px';
      el.style.margin = '0';
      // require double-click to open; remove single-click handler if present
      if (winId) {
        el.removeAttribute('onclick');
        el.addEventListener('dblclick', function(e) {
          // prevent dblclick from also triggering drag behavior
          e.stopPropagation();
          openWindow(winId);
        });
      }
      makeDraggable(el, el, true);
    });
    // place bin icon on desktop
    const bin = document.getElementById('bin-icon');
    const totalIcons = iconData.length + 1;
    const availH = desktop.offsetHeight - 42 - 64;
    const dynGrid = Math.min(90, Math.floor(availH / totalIcons));
    desktop.appendChild(bin);
    bin.style.position = 'absolute';
    bin.style.left = '32px';
    bin.style.top = (32 + iconData.length * dynGrid) + 'px';
    bin.style.margin = '0';
    iconContainer.remove();
    initBin();
    // Update Start menu gold toggle button visibility/state
    updateGoldToggleButton();
  }, 600);
}

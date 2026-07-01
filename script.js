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

function findFreeCell(preferredLeft, preferredTop, excludeEl) {
  const occupied = new Set();
  document.querySelectorAll('.icon').forEach(icon => {
    if (icon !== excludeEl) occupied.add(icon.style.left + ',' + icon.style.top);
  });
  let col = Math.round((preferredLeft - ICON_PAD) / ICON_GRID);
  let row = Math.round((preferredTop - ICON_PAD) / ICON_GRID);
  // spiral out to find a free cell
  for (let r = 0; r < 20; r++) {
    for (let c = 0; c < 20; c++) {
      const l = (col + c) * ICON_GRID + ICON_PAD + 'px';
      const t = (row + r) * ICON_GRID + ICON_PAD + 'px';
      if (!occupied.has(l + ',' + t)) return { left: l, top: t };
    }
  }
  return { left: preferredLeft + 'px', top: preferredTop + 'px' };
}

function makeDraggable(el, handle, snap) {
  handle = handle || el;
  handle.style.cursor = 'grab';
  handle.addEventListener('mousedown', function(e) {
    if (e.target.tagName === 'BUTTON') return;
    e.preventDefault();
    const rect = el.getBoundingClientRect();
    const offX = e.clientX - rect.left;
    const offY = e.clientY - rect.top;
    el.style.position = 'absolute';
    el.style.margin = '0';
    handle.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    function onMove(e) {
      el.style.left = (e.clientX - offX) + 'px';
      el.style.top = (e.clientY - offY) + 'px';
      el.style.transform = 'none';
    }
    function onUp(e) {
      if (snap) {
        const snappedLeft = snapToGrid(e.clientX - offX);
        const snappedTop = snapToGrid(e.clientY - offY);
        const cell = findFreeCell(snappedLeft, snappedTop, el);
        el.style.left = cell.left;
        el.style.top = cell.top;
      }
      handle.style.cursor = 'grab';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

function openWindow(id) {
  const w = document.getElementById(id);
  w.style.display = 'block';
  w.style.removeProperty('height');
  const content = w.querySelector('.window-content');
  if (content) content.style.display = '';
  const minBtn = w.querySelector('.min-btn');
  if (minBtn) minBtn.textContent = '_';
  removeTaskbarTab(id);
}

function closeWindow(id) {
  document.getElementById(id).style.display = 'none';
  removeTaskbarTab(id);
}

function minimizeWindow(id) {
  const w = document.getElementById(id);
  const content = w.querySelector('.window-content');
  const minBtn = w.querySelector('.min-btn');
  const resizeHandle = w.querySelector('.resize-handle');
  if (content.style.display === 'none') {
    content.style.display = '';
    if (resizeHandle) resizeHandle.style.display = '';
    minBtn.textContent = '_';
  } else {
    content.style.display = 'none';
    if (resizeHandle) resizeHandle.style.display = 'none';
    minBtn.textContent = '▢';
  }
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
}

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
}
updateClock();
setInterval(updateClock, 10000);

// Scanline overlay
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
  'Microsoft Windows XP',
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
  "I'm reading a book about anti-gravity. It's impossible to put down.",
  "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them.",
  "Why did the scarecrow win an award? Because he was outstanding in his field.",
  "I used to hate facial hair, but then it grew on me."
];

document.addEventListener('keydown', function onDel(e) {
  const popup = document.getElementById('del-popup');
  if (e.key === 'Delete' && popup.style.display === 'none') {
    document.getElementById('dad-joke').textContent = dadJokes[Math.floor(Math.random() * dadJokes.length)];
    popup.style.display = 'block';
    document.addEventListener('keydown', function closePopup(e2) {
      if (e2.key === 'Delete') return;
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
  if (lines[lineIndex] === 'Microsoft Windows XP') div.style.color = '#00aa00';
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
        function onMove(e) {
          w.style.width = Math.max(200, startW + e.clientX - startX) + 'px';
          w.style.height = Math.max(100, startH + e.clientY - startY) + 'px';
        }
        function onUp() {
          document.body.style.userSelect = '';
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
    iconContainer.remove();
  }, 600);
}

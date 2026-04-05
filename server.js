const express = require('express');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// ─── CONFIG ────────────────────────────────────────────────────────────────
// Set this to your actual images root folder
const IMAGE_ROOT = process.argv[2] || process.env.IMAGE_ROOT || './images';
const PORT = 3434;

// Supported extensions
const SUPPORTED = ['.webp', '.jpg', '.jpeg', '.png'];

// ─── SCAN ALL IMAGES ───────────────────────────────────────────────────────
function scanImages(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(scanImages(full));
    } else if (SUPPORTED.includes(path.extname(item.name).toLowerCase())) {
      results.push(full);
    }
  }
  return results;
}

let images = scanImages(path.resolve(IMAGE_ROOT));
let currentIndex = 0;
const decisions = {}; // path -> rotation degrees (0, 90, 270)

console.log(`\n✅ Found ${images.length} images in: ${path.resolve(IMAGE_ROOT)}`);
console.log(`🌐 Open http://localhost:${PORT} in your browser\n`);

// ─── ROUTES ────────────────────────────────────────────────────────────────

// Serve current image as binary
app.get('/img/current', (req, res) => {
  if (currentIndex >= images.length) return res.status(404).send('Done');
  const imgPath = images[currentIndex];
  res.setHeader('Content-Type', 'image/webp');
  // Stream the image
  fs.createReadStream(imgPath).pipe(res);
});

// Serve image by index (for preview)
app.get('/img/:index', (req, res) => {
  const idx = parseInt(req.params.index);
  if (idx < 0 || idx >= images.length) return res.status(404).send('Not found');
  res.setHeader('Content-Type', 'image/webp');
  fs.createReadStream(images[idx]).pipe(res);
});

// Get current state
app.get('/state', (req, res) => {
  res.json({
    total: images.length,
    current: currentIndex,
    done: currentIndex >= images.length,
    path: currentIndex < images.length ? images[currentIndex] : null,
    filename: currentIndex < images.length ? path.basename(images[currentIndex]) : null,
    folder: currentIndex < images.length ? path.basename(path.dirname(images[currentIndex])) : null,
    decision: currentIndex < images.length ? (decisions[images[currentIndex]] ?? null) : null,
  });
});

// Submit decision for current image
app.post('/submit', async (req, res) => {
  const { rotation } = req.body; // 0, 90, or 270
  if (currentIndex >= images.length) return res.json({ done: true });

  const imgPath = images[currentIndex];
  decisions[imgPath] = rotation;

  if (rotation !== 0) {
    try {
      const tmpPath = imgPath + '.tmp';
      await sharp(imgPath)
        .rotate(rotation)
        .toFile(tmpPath);
      fs.renameSync(tmpPath, imgPath);
      console.log(`✅ Rotated ${path.basename(imgPath)} by ${rotation}°`);
    } catch (err) {
      console.error(`❌ Failed to rotate ${imgPath}:`, err.message);
      return res.status(500).json({ error: err.message });
    }
  } else {
    console.log(`⏭️  Skipped ${path.basename(imgPath)}`);
  }

  currentIndex++;
  res.json({
    done: currentIndex >= images.length,
    next: currentIndex,
    total: images.length,
  });
});

// Go back to previous image
app.post('/back', (req, res) => {
  if (currentIndex > 0) currentIndex--;
  res.json({ current: currentIndex });
});

// Jump to specific index
app.post('/goto', (req, res) => {
  const { index } = req.body;
  if (index >= 0 && index < images.length) currentIndex = index;
  res.json({ current: currentIndex });
});

// Summary of all decisions
app.get('/summary', (req, res) => {
  const rotated = Object.entries(decisions)
    .filter(([, r]) => r !== 0)
    .map(([p, r]) => ({ file: path.relative(IMAGE_ROOT, p), rotation: r }));
  res.json({ total: images.length, rotated });
});

// ─── FRONTEND ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>sketch.ink — Image Rotator</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&display=swap');

  :root {
    --bg: #0f0e0c;
    --surface: #1a1917;
    --border: #2e2d2a;
    --accent: #e8c97a;
    --accent2: #c96a3a;
    --text: #f0ece4;
    --muted: #7a786f;
    --green: #5aad7a;
    --red: #c95252;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Mono', monospace;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  header {
    width: 100%;
    padding: 18px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }

  .logo {
    font-family: 'DM Serif Display', serif;
    font-size: 1.4rem;
    color: var(--accent);
    letter-spacing: 0.04em;
  }

  .logo span { font-style: italic; color: var(--muted); }

  #progress-bar-wrap {
    flex: 1;
    margin: 0 32px;
    height: 4px;
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
  }
  #progress-bar {
    height: 100%;
    background: var(--accent);
    transition: width 0.3s ease;
    border-radius: 2px;
  }

  #counter {
    font-size: 0.75rem;
    color: var(--muted);
    white-space: nowrap;
  }

  .main {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    width: 100%;
    max-width: 900px;
    padding: 28px 16px;
    gap: 20px;
  }

  .meta {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  .folder-tag {
    background: var(--accent);
    color: #0f0e0c;
    font-size: 0.7rem;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 4px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .filename {
    font-size: 0.82rem;
    color: var(--text);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .img-stage {
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 420px;
  }



  #preview.rotating {
    opacity: 0.5;
    transform: scale(0.97);
  }

  .rotation-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(0,0,0,0.7);
    border: 1px solid var(--accent);
    color: var(--accent);
    font-size: 0.75rem;
    padding: 4px 10px;
    border-radius: 20px;
    backdrop-filter: blur(4px);
    transition: all 0.2s;
  }

  .rotation-badge.none { border-color: var(--muted); color: var(--muted); }

  .controls {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-family: 'DM Mono', monospace;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.15s;
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  .btn:active { transform: scale(0.96); }

  .btn-rotate {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text);
  }
  .btn-rotate:hover { border-color: var(--accent); color: var(--accent); }
  .btn-rotate.active { border-color: var(--accent); color: var(--accent); background: rgba(232,201,122,0.08); }

  .btn-skip {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--muted);
  }
  .btn-skip:hover { border-color: var(--muted); color: var(--text); }
  .btn-skip.active { border-color: var(--green); color: var(--green); background: rgba(90,173,122,0.08); }

  .btn-submit {
    background: var(--accent);
    color: #0f0e0c;
    padding: 12px 36px;
    font-weight: 500;
  }
  .btn-submit:hover { background: #f0d48a; }
  .btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }

  .btn-back {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--muted);
    padding: 10px 16px;
  }
  .btn-back:hover { color: var(--text); border-color: var(--muted); }

  .btn-next {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--muted);
  }
  .btn-next:hover { color: var(--text); border-color: var(--muted); }

  .img-stage {
    position: relative;
    overflow: hidden;
  }

  #preview {
    max-width: 80%;
    max-height: 480px;
    object-fit: contain;
    display: block;
    transition: opacity 0.25s ease;
  }

  #preview.fading {
    opacity: 0;
  }

  .icon { font-size: 1.1rem; }

  .divider {
    width: 1px;
    height: 32px;
    background: var(--border);
  }

  #done-screen {
    display: none;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 60px 20px;
    text-align: center;
  }

  #done-screen h2 {
    font-family: 'DM Serif Display', serif;
    font-size: 2.2rem;
    color: var(--accent);
  }

  #done-screen p { color: var(--muted); font-size: 0.9rem; }

  .summary-box {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 20px 28px;
    font-size: 0.8rem;
    color: var(--muted);
    max-width: 500px;
    line-height: 1.8;
    text-align: left;
  }

  .toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: var(--green);
    color: #0f0e0c;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 500;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.25s;
    pointer-events: none;
    z-index: 100;
  }
  .toast.show { opacity: 1; transform: translateY(0); }

  kbd {
    display: inline-block;
    background: var(--border);
    border-radius: 4px;
    padding: 1px 6px;
    font-size: 0.7rem;
    color: var(--muted);
  }

  .shortcuts {
    font-size: 0.72rem;
    color: var(--muted);
    display: flex;
    gap: 16px;
  }
</style>
</head>
<body>

<header>
  <div class="logo">sketch<span>.ink</span> — rotator</div>
  <div id="progress-bar-wrap"><div id="progress-bar" style="width:0%"></div></div>
  <div id="counter">0 / 0</div>
</header>

<div class="main" id="app">

  <div class="meta">
    <span class="folder-tag" id="folder-tag">folder</span>
    <span class="filename" id="filename">loading...</span>
  </div>

  <div class="img-stage">
    <img id="preview" src="" alt="preview" />
    <div class="rotation-badge none" id="rotation-badge">No Rotation</div>
  </div>

  <div class="controls">
    <button class="btn btn-back" onclick="goBack()">← Back</button>
    <div class="divider"></div>
    <button class="btn btn-rotate" id="btn-left" onclick="setRotation(270)">
      <span class="icon">↺</span> Rotate Left
    </button>
    <button class="btn btn-rotate" id="btn-right" onclick="setRotation(90)">
      <span class="icon">↻</span> Rotate Right
    </button>
    <button class="btn btn-skip" id="btn-none" onclick="resetRotation()">
      ✓ No Change
    </button>
    <div class="divider"></div>
    <button class="btn btn-next" id="btn-next" onclick="skipImage()">
      Next →
    </button>
    <button class="btn btn-submit" id="btn-submit" onclick="submitDecision()" disabled>
      Save & Next ✓
    </button>
  </div>

  <div class="shortcuts">
    <span><kbd>←</kbd> rotate left</span>
    <span><kbd>→</kbd> rotate right</span>
    <span><kbd>Space</kbd> no change</span>
    <span><kbd>Enter</kbd> save & next</span>
    <span><kbd>N</kbd> skip</span>
    <span><kbd>Backspace</kbd> go back</span>
  </div>
</div>

<div id="done-screen">
  <h2>All Done! 🎉</h2>
  <p>All images have been reviewed and saved to disk.</p>
  <div class="summary-box" id="summary-box">Loading summary...</div>
</div>

<div class="toast" id="toast"></div>

<script>
let selectedRotation = null;
let currentDeg = 0;
let busy = false; // prevent double-clicks during transitions

function fadeOutImg() {
  return new Promise(resolve => {
    const img = document.getElementById('preview');
    img.classList.add('fading');
    setTimeout(resolve, 250); // match CSS transition duration
  });
}

function fadeInImg() {
  const img = document.getElementById('preview');
  img.classList.remove('fading');
}

async function loadState() {
  const res = await fetch('/state');
  const state = await res.json();

  if (state.done) { showDoneScreen(); return; }

  const pct = state.total ? (state.current / state.total * 100).toFixed(1) : 0;
  document.getElementById('progress-bar').style.width = pct + '%';
  document.getElementById('counter').textContent = \`\${state.current + 1} / \${state.total}\`;
  document.getElementById('folder-tag').textContent = state.folder;
  document.getElementById('filename').textContent = state.filename;

  // Reset rotation snap (no opacity transition on transform)
  const img = document.getElementById('preview');
  img.style.transition = 'none';
  img.style.transform = 'rotate(0deg)';
  currentDeg = 0;

  // Load new image while faded out, then fade in
  img.onload = () => { fadeInImg(); busy = false; };
  img.src = '/img/current?' + Date.now();

  selectedRotation = null;
  document.getElementById('rotation-badge').textContent = 'No Rotation';
  document.getElementById('rotation-badge').className = 'rotation-badge none';
  updateButtons();
}

function setRotation(deg) {
  if (deg === 270) currentDeg -= 90;
  else if (deg === 90) currentDeg += 90;
  else currentDeg = 0;

  selectedRotation = ((currentDeg % 360) + 360) % 360;

  const img = document.getElementById('preview');
  img.style.transition = 'none';
  img.style.transform = \`rotate(\${currentDeg}deg)\`;

  const badge = document.getElementById('rotation-badge');
  if (currentDeg === 0) {
    badge.textContent = 'No Rotation';
    badge.className = 'rotation-badge none';
  } else {
    badge.textContent = \`\${currentDeg > 0 ? '↻' : '↺'} \${currentDeg}°\`;
    badge.className = 'rotation-badge';
  }
  updateButtons();
}

function resetRotation() {
  currentDeg = 0;
  selectedRotation = 0;
  const img = document.getElementById('preview');
  img.style.transition = 'none';
  img.style.transform = 'rotate(0deg)';
  document.getElementById('rotation-badge').textContent = 'No Rotation';
  document.getElementById('rotation-badge').className = 'rotation-badge none';
  updateButtons();
}

function updateButtons() {
  document.getElementById('btn-submit').disabled = selectedRotation === null;
  document.getElementById('btn-none').className = 'btn btn-skip' + (selectedRotation === 0 ? ' active' : '');
}

async function submitDecision() {
  if (selectedRotation === null || busy) return;
  busy = true;
  setAllButtonsDisabled(true);

  // 1. Fade out current image
  await fadeOutImg();

  // 2. Send to server (sharp rotates on disk)
  const res = await fetch('/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rotation: selectedRotation })
  });
  const data = await res.json();

  showToast(selectedRotation === 0 ? 'Saved ✓' : \`Rotated \${currentDeg}° & Saved ✓\`);

  if (data.done) {
    showDoneScreen();
  } else {
    selectedRotation = null;
    setAllButtonsDisabled(false);
    await loadState(); // loads next image, fades in via onload
  }
}

async function skipImage() {
  if (busy) return;
  busy = true;
  setAllButtonsDisabled(true);

  await fadeOutImg();

  // Skip = move to next without saving any rotation
  await fetch('/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rotation: 0 })
  });

  showToast('Skipped →');
  selectedRotation = null;
  setAllButtonsDisabled(false);
  await loadState();
}

async function goBack() {
  if (busy) return;
  busy = true;
  setAllButtonsDisabled(true);

  await fadeOutImg();
  await fetch('/back', { method: 'POST' });

  selectedRotation = null;
  setAllButtonsDisabled(false);
  await loadState();
}

function setAllButtonsDisabled(disabled) {
  ['btn-left','btn-right','btn-none','btn-next','btn-submit'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = disabled;
  });
  document.querySelector('.btn-back').disabled = disabled;
}

async function showDoneScreen() {
  document.querySelector('.main').style.display = 'none';
  const done = document.getElementById('done-screen');
  done.style.display = 'flex';
  const res = await fetch('/summary');
  const data = await res.json();
  document.getElementById('summary-box').innerHTML =
    \`Total images: <b>\${data.total}</b><br>Rotated: <b>\${data.rotated.length}</b><br>Unchanged: <b>\${data.total - data.rotated.length}</b>\`;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1800);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') setRotation(270);
  else if (e.key === 'ArrowRight') setRotation(90);
  else if (e.key === ' ') { e.preventDefault(); resetRotation(); }
  else if (e.key === 'Enter') submitDecision();
  else if (e.key === 'n' || e.key === 'N') skipImage();
  else if (e.key === 'Backspace') goBack();
});

loadState();
</script>
</body>
</html>`);
});

app.listen(PORT, () => {});
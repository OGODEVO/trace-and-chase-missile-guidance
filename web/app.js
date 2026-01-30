const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const ammoEl = document.getElementById("ammo");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");

const state = {
  width: 0,
  height: 0,
  lastTime: 0,
  score: 0,
  ammo: 3,
  banditEscapes: 0,
  reticle: { x: 0, y: 0, slow: false },
  bandit: null,
  missiles: [],
  explosions: [],
  shake: 0,
  terrain: null,
};

const config = {
  banditSpeed: 120,
  banditTurnRate: 0.8,
  missileSpeed: 320,
  missileTurnRate: 3.0,
  missileFuel: 5.5,
  boundaryPadding: 80,
};

function resize() {
  const dpr = window.devicePixelRatio || 1;
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  canvas.width = state.width * dpr;
  canvas.height = state.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  state.terrain = buildTerrain(640, 640);
  if (state.reticle.x === 0 && state.reticle.y === 0) {
    state.reticle.x = state.width * 0.5;
    state.reticle.y = state.height * 0.5;
  }
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function length(x, y) {
  return Math.hypot(x, y);
}

function normalize(x, y) {
  const len = length(x, y) || 1;
  return { x: x / len, y: y / len };
}

function buildTerrain(size, seed) {
  const offscreen = document.createElement("canvas");
  offscreen.width = size;
  offscreen.height = size;
  const ox = offscreen.getContext("2d");

  const gradient = ox.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#0c1a23");
  gradient.addColorStop(0.5, "#0c2b33");
  gradient.addColorStop(1, "#1a2c1f");
  ox.fillStyle = gradient;
  ox.fillRect(0, 0, size, size);

  for (let i = 0; i < 2200; i += 1) {
    const x = rand(0, size);
    const y = rand(0, size);
    const radius = rand(8, 44);
    const alpha = rand(0.02, 0.08);
    ox.fillStyle = `rgba(140, 200, 140, ${alpha})`;
    ox.beginPath();
    ox.arc(x, y, radius, 0, Math.PI * 2);
    ox.fill();
  }

  ox.strokeStyle = "rgba(120, 200, 255, 0.08)";
  ox.lineWidth = 1;
  for (let i = 0; i < size; i += 40) {
    ox.beginPath();
    ox.moveTo(i, 0);
    ox.lineTo(i, size);
    ox.stroke();
    ox.beginPath();
    ox.moveTo(0, i);
    ox.lineTo(size, i);
    ox.stroke();
  }

  return offscreen;
}

function resetBandit() {
  const edge = Math.floor(rand(0, 4));
  const pad = config.boundaryPadding;
  let x = rand(pad, state.width - pad);
  let y = rand(pad, state.height - pad);

  if (edge === 0) y = pad;
  if (edge === 1) x = state.width - pad;
  if (edge === 2) y = state.height - pad;
  if (edge === 3) x = pad;

  state.bandit = {
    x,
    y,
    heading: rand(0, Math.PI * 2),
    wiggle: rand(0.6, 1.4),
  };
}

function fireMissile() {
  if (state.ammo <= 0) return;
  state.ammo -= 1;
  ammoEl.textContent = state.ammo;

  const origin = {
    x: state.width * 0.5,
    y: state.height * 0.15,
  };

  state.missiles.push({
    x: origin.x,
    y: origin.y,
    vx: 0,
    vy: config.missileSpeed,
    fuel: config.missileFuel,
    locked: true,
    trail: [],
  });
}

function spawnExplosion(x, y, color) {
  state.explosions.push({
    x,
    y,
    radius: 0,
    max: rand(24, 44),
    alpha: 1,
    color,
  });
  state.shake = 0.45;
}

function updateBandit(dt) {
  if (!state.bandit) return;
  const targetHeading = state.bandit.heading + rand(-1, 1) * config.banditTurnRate * dt;
  state.bandit.heading = targetHeading;

  state.bandit.x += Math.cos(state.bandit.heading) * config.banditSpeed * dt;
  state.bandit.y += Math.sin(state.bandit.heading) * config.banditSpeed * dt;

  const pad = config.boundaryPadding;
  if (
    state.bandit.x < pad ||
    state.bandit.x > state.width - pad ||
    state.bandit.y < pad ||
    state.bandit.y > state.height - pad
  ) {
    state.bandit.heading += Math.PI * 0.9;
  }
}

function updateMissiles(dt) {
  for (const missile of state.missiles) {
    if (missile.fuel <= 0) continue;

    const target = state.bandit;
    if (!target) continue;

    const toTarget = { x: target.x - missile.x, y: target.y - missile.y };
    const desired = normalize(toTarget.x, toTarget.y);
    const current = normalize(missile.vx, missile.vy);

    const blend = clamp(config.missileTurnRate * dt, 0, 1);
    const steering = normalize(
      current.x * (1 - blend) + desired.x * blend,
      current.y * (1 - blend) + desired.y * blend
    );

    missile.vx = steering.x * config.missileSpeed;
    missile.vy = steering.y * config.missileSpeed;
    missile.x += missile.vx * dt;
    missile.y += missile.vy * dt;
    missile.fuel -= dt;

    missile.trail.push({ x: missile.x, y: missile.y });
    if (missile.trail.length > 36) missile.trail.shift();
  }

  state.missiles = state.missiles.filter((missile) => {
    const inBounds =
      missile.x > -120 &&
      missile.x < state.width + 120 &&
      missile.y > -120 &&
      missile.y < state.height + 120;
    return missile.fuel > 0 && inBounds;
  });
}

function updateExplosions(dt) {
  state.explosions.forEach((explosion) => {
    explosion.radius += dt * 120;
    explosion.alpha -= dt * 1.4;
  });
  state.explosions = state.explosions.filter((e) => e.alpha > 0);
}

function checkHits() {
  if (!state.bandit) return;
  for (const missile of state.missiles) {
    const dist = length(state.bandit.x - missile.x, state.bandit.y - missile.y);
    if (dist < 18) {
      spawnExplosion(state.bandit.x, state.bandit.y, "#8fffc9");
      state.score += 1;
      scoreEl.textContent = state.score;
      statusEl.textContent = "Bandit neutralized";
      resetBandit();
      return;
    }
  }
}

function drawTerrain() {
  const pattern = ctx.createPattern(state.terrain, "repeat");
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = "#9ad5ff";
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    ctx.arc(
      state.width * 0.5,
      state.height * 0.5,
      120 + i * 90,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawBandit() {
  if (!state.bandit) return;
  ctx.save();
  ctx.translate(state.bandit.x, state.bandit.y);
  ctx.rotate(state.bandit.heading);
  ctx.fillStyle = "rgba(244, 195, 139, 0.9)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-10, -8);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-10, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawMissiles() {
  for (const missile of state.missiles) {
    ctx.save();
    ctx.strokeStyle = "rgba(143, 255, 201, 0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    missile.trail.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(missile.x, missile.y);
    ctx.fillStyle = "#8fffc9";
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawExplosions() {
  for (const explosion of state.explosions) {
    ctx.save();
    ctx.globalAlpha = explosion.alpha;
    ctx.strokeStyle = explosion.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawReticle() {
  ctx.save();
  ctx.translate(state.reticle.x, state.reticle.y);
  ctx.strokeStyle = "rgba(140, 210, 255, 0.9)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.lineTo(-6, 0);
  ctx.moveTo(6, 0);
  ctx.lineTo(16, 0);
  ctx.moveTo(0, -16);
  ctx.lineTo(0, -6);
  ctx.moveTo(0, 6);
  ctx.lineTo(0, 16);
  ctx.stroke();
  ctx.restore();
}

function drawDrone() {
  const x = state.width * 0.5;
  const y = state.height * 0.12;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(140, 210, 255, 0.7)";
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function update(dt) {
  updateBandit(dt);
  updateMissiles(dt);
  updateExplosions(dt);
  checkHits();

  if (state.shake > 0) {
    state.shake = Math.max(0, state.shake - dt * 2.4);
  }
}

function render() {
  ctx.save();
  if (state.shake > 0) {
    ctx.translate(rand(-6, 6) * state.shake, rand(-6, 6) * state.shake);
  }

  drawTerrain();
  drawDrone();
  drawMissiles();
  drawBandit();
  drawExplosions();
  drawReticle();
  ctx.restore();
}

function loop(timestamp) {
  if (!state.lastTime) state.lastTime = timestamp;
  const dt = Math.min(0.033, (timestamp - state.lastTime) / 1000);
  state.lastTime = timestamp;

  update(dt);
  render();
  requestAnimationFrame(loop);
}

function handlePointer(event) {
  const rect = canvas.getBoundingClientRect();
  state.reticle.x = event.clientX - rect.left;
  state.reticle.y = event.clientY - rect.top;
}

function handleClick() {
  fireMissile();
}

function resetGame() {
  state.score = 0;
  state.ammo = 3;
  state.missiles = [];
  state.explosions = [];
  scoreEl.textContent = state.score;
  ammoEl.textContent = state.ammo;
  statusEl.textContent = "Sweep in progress";
  resetBandit();
}

window.addEventListener("resize", resize);
window.addEventListener("mousemove", handlePointer);
window.addEventListener("click", handleClick);
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "r") {
    resetGame();
  }
});

resize();
resetBandit();
requestAnimationFrame(loop);

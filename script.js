// Interactive moving-web background
// Creates a grid of points connected by lines; points respond to mouse movement
 (function () {
  const canvas = document.getElementById('interactive-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = 0;
  let height = 0;
  let points = [];
  let cols = 0;
  let rows = 0;
  const spacing = 100; // base spacing between grid points (larger gives bigger shapes)
  const maxDist = 180; // max distance to draw a connecting line
  const mouse = { x: null, y: null };

  // color for the web: light blue by default (you can change to green)
  const webColor = { r: 120, g: 200, b: 255 };

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    cols = Math.ceil(width / spacing) + 1;
    rows = Math.ceil(height / spacing) + 1;
    initPoints();
  }

  function initPoints() {
    points = [];
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        // create a staggered grid so connections form diamond/kite shapes
        const stagger = (j % 2 === 0) ? 0 : spacing / 2;
        const x = i * spacing + stagger + (Math.random() * 12 - 6);
        const y = j * spacing + (Math.random() * 12 - 6);
        points.push({
          x,
          y,
          ox: x,
          oy: y,
          vx: (Math.random() - 0.5) * 0.04, // slower initial speed (halved)
          vy: (Math.random() - 0.5) * 0.04,
          col: i,
          row: j
        });
      }
    }
  }

  function idx(i, j) {
    return i * rows + j;
  }

  function onMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }

  function onLeave() {
    mouse.x = null;
    mouse.y = null;
  }

  function update() {
    // gentle float + mouse interaction (all reduced for slower motion)
    for (let p of points) {
      p.x += p.vx;
      p.y += p.vy;

      // return toward origin (weaker)
      p.vx += (p.ox - p.x) * 0.00012;
      p.vy += (p.oy - p.y) * 0.00012;

      // small random jitter (weaker)
      p.vx += (Math.random() - 0.5) * 0.00008;
      p.vy += (Math.random() - 0.5) * 0.00008;

      // mouse repel (gentler)
      if (mouse.x !== null) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < maxDist) {
          const force = (maxDist - dist) / maxDist * 0.6;
          p.x += (dx / dist) * force * 0.9; // reduced multiplier
          p.y += (dy / dist) * force * 0.9;
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // draw points and connect specific neighboring points to form diamond/kite shapes
    for (let k = 0; k < points.length; k++) {
      const p = points[k];

      // draw a small subtle dot (more visible)
      ctx.save();
      ctx.fillStyle = `rgba(${webColor.r},${webColor.g},${webColor.b},0.22)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // connect to right, bottom, bottom-right and bottom-left neighbors to make diamond shapes
      const i = p.col;
      const j = p.row;

      const neighbors = [];
      if (i + 1 < cols) neighbors.push(idx(i + 1, j)); // right
      if (j + 1 < rows) neighbors.push(idx(i, j + 1)); // bottom
      if (i + 1 < cols && j + 1 < rows) neighbors.push(idx(i + 1, j + 1)); // bottom-right
      if (i + 1 < cols && j - 1 >= 0) neighbors.push(idx(i + 1, j - 1)); // top-right (creates kite/diamond feel)

      for (const n of neighbors) {
        const q = points[n];
        if (!q) continue;
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = 1 - dist / maxDist;
          ctx.save();
          ctx.strokeStyle = `rgba(${webColor.r},${webColor.g},${webColor.b},${alpha * 0.32})`;
          ctx.lineWidth = 0.3; // very thin lines
          // soft glow
          ctx.shadowBlur = 6;
          ctx.shadowColor = `rgba(${webColor.r},${webColor.g},${webColor.b},0.06)`;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // soft highlight circle near the mouse
    if (mouse.x !== null) {
      ctx.beginPath();
      ctx.fillStyle = `rgba(${webColor.r},${webColor.g},${webColor.b},0.05)`;
      ctx.arc(mouse.x, mouse.y, 28, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function animate() {
    // reduce activity during scrolling to improve scroll smoothness
    frameCount++;
    const now = Date.now();
    const scrolling = now - lastScrollTime < 160;
    const skip = scrolling ? 3 : 0; // draw less frequently while scrolling
    if (frameCount % (skip + 1) === 0) {
      update();
      draw();
    }
    requestAnimationFrame(animate);
  }

  // events
  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseout', onLeave);
  window.addEventListener('mouseleave', onLeave);
  // reduce animation frequency while user is scrolling
  let lastScrollTime = 0;
  window.addEventListener('scroll', () => {
    lastScrollTime = Date.now();
  }, { passive: true });

  let frameCount = 0;

  // start
  resize();
  animate();
  
  // Mobile menu toggle (hamburger)
  try {
    const menu = document.querySelector('.mobile-menu');
    const toggle = document.querySelector('.mobile-toggle');
    const drawer = document.querySelector('.mobile-drawer');
    if (menu && toggle && drawer) {
      toggle.addEventListener('click', () => {
        const open = menu.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
      });
      drawer.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          menu.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
          drawer.setAttribute('aria-hidden', 'true');
        });
      });
    }
  } catch (e) {
    // ignore if DOM not ready or missing elements
  }
})();

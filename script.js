// ---------- Load projects from config.json ----------
const workGrid = document.getElementById('workGrid');
let projects = [];

fetch('config.json')
  .then(res => {
    if (!res.ok) throw new Error('config.json not found');
    return res.json();
  })
  .then(data => {
    projects = data.projects || [];
    renderProjects(projects);
  })
  .catch(err => {
    console.warn('Could not load config.json:', err);
    workGrid.innerHTML = `<p style="color:#8991a6;font-family:var(--font-mono);font-size:0.85rem;">
      Couldn't load config.json. If you're opening this file directly on your computer,
      run a local server (e.g. <code>python3 -m http.server</code>) or view it via GitHub Pages —
      browsers block local file fetches.
    </p>`;
  });

// ---------- Media type detection ----------
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)$/i;
function isVideo(path) {
  return typeof path === 'string' && VIDEO_EXT.test(path.split('?')[0]);
}

function renderProjects(list) {
  workGrid.innerHTML = '';
  list.forEach((project, i) => {
    const card = document.createElement('div');
    card.className = 'work-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View details for ${project.title}`);

    const src = project.media || project.image; // "media" is the current field, "image" kept for older configs
    const mediaHTML = isVideo(src)
      ? `<video class="work-card-media" src="${src}" muted loop playsinline autoplay
           onerror="this.closest('.work-card').style.opacity=0.35"></video>`
      : `<img class="work-card-media" src="${src}" alt="${project.title}"
           onerror="this.style.opacity=0.15;this.style.background='#151a22'">`;

    card.innerHTML = `
      ${mediaHTML}
      <div class="work-card-overlay">
        <span class="work-card-title">${project.title}</span>
        ${project.tags && project.tags[0] ? `<span class="work-card-tag">${project.tags[0]}</span>` : ''}
      </div>
    `;

    card.addEventListener('click', () => openProject(i));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProject(i); }
    });

    workGrid.appendChild(card);
  });
}

// ---------- Project detail overlay ----------
const overlay = document.getElementById('projectOverlay');
const overlayMedia = document.getElementById('overlayMedia');
const overlayTitle = document.getElementById('overlayTitle');
const overlayDesc = document.getElementById('overlayDesc');
const overlayTags = document.getElementById('overlayTags');
const closeOverlayBtn = document.getElementById('closeOverlay');

function openProject(index) {
  const project = projects[index];
  if (!project) return;

  const src = project.media || project.image;
  overlayMedia.innerHTML = isVideo(src)
    ? `<video src="${src}" controls playsinline></video>`
    : `<img src="${src}" alt="${project.title}">`;

  overlayTitle.textContent = project.title;
  overlayDesc.textContent = project.description || '';

  overlayTags.innerHTML = (project.tags || [])
    .map(tag => `<span class="tag-pill">${tag}</span>`)
    .join('');

  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeProject() {
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';

  // stop any playing video when the overlay closes
  const video = overlayMedia.querySelector('video');
  if (video) video.pause();
}

closeOverlayBtn.addEventListener('click', closeProject);
overlay.addEventListener('click', (e) => {
  if (e.target === overlay) closeProject();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && overlay.classList.contains('active')) closeProject();
});

// ---------- Dock nav: scrollspy + animated indicator ----------
const dock = document.getElementById('dock');
const dockItems = Array.from(document.querySelectorAll('.dock-item'));
const dockIndicator = document.getElementById('dockIndicator');
const sections = dockItems.map(btn => document.getElementById(btn.dataset.target));

function moveIndicatorTo(button) {
  if (!button) return;
  const dockRect = dock.getBoundingClientRect();
  const btnRect = button.getBoundingClientRect();
  const x = btnRect.left - dockRect.left;
  const y = btnRect.top - dockRect.top;
  dockIndicator.style.transform = `translate(${x - 10}px, ${y - 10}px)`;
}

function setActive(target) {
  dockItems.forEach(btn => btn.classList.toggle('active', btn.dataset.target === target));
  const activeBtn = dockItems.find(btn => btn.dataset.target === target);
  moveIndicatorTo(activeBtn);
}

dockItems.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      setActive(entry.target.id);
    }
  });
}, { threshold: 0.5 });

sections.forEach(section => { if (section) observer.observe(section); });

// initialize + keep indicator correct on resize
window.addEventListener('load', () => setActive('hero'));
window.addEventListener('resize', () => {
  const activeBtn = dockItems.find(btn => btn.classList.contains('active')) || dockItems[0];
  moveIndicatorTo(activeBtn);
});

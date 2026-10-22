/**
 * CertifyVault - Unlimited Certificate Portfolio & Manager
 * IndexedDB Backend, Lightbox Viewer, Search & Filters, Multi-view & Backup
 */

(function () {
  'use strict';

  // ==========================================
  // IndexedDB Storage Layer ("sem limites")
  // ==========================================
  const DB_NAME = 'CertifyVault_DB';
  const DB_VERSION = 1;
  const STORE_NAME = 'certificates';

  class CertificateDatabase {
    constructor() {
      this.db = null;
    }

    async init() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('category', 'category', { unique: false });
            store.createIndex('issuer', 'issuer', { unique: false });
            store.createIndex('date', 'date', { unique: false });
            store.createIndex('createdAt', 'createdAt', { unique: false });
          }
        };

        request.onsuccess = (event) => {
          this.db = event.target.result;
          resolve(this.db);
        };

        request.onerror = (event) => {
          console.error('Erro ao abrir IndexedDB:', event.target.error);
          reject(event.target.error);
        };
      });
    }

    async getAll() {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    }

    async getById(id) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    async put(certificate) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(certificate);

        req.onsuccess = () => resolve(certificate);
        req.onerror = () => reject(req.error);
      });
    }

    async delete(id) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);

        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    }

    async clear() {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();

        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    }

    async bulkPut(certificates) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        certificates.forEach((cert) => store.put(cert));

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    }
  }

  // ==========================================
  // Application State
  // ==========================================
  const db = new CertificateDatabase();

  const state = {
    certificates: [],
    selectedCategory: 'ALL',
    searchQuery: '',
    sortBy: 'newest',
    currentView: 'grid', // 'grid' | 'list' | 'timeline'
    activeCertificate: null,
    zoomLevel: 100,
    currentUploadedFile: null // { name, type, size, dataUrl }
  };

  // ==========================================
  // DOM Elements
  // ==========================================
  const elements = {
    // Theme
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIconSun: document.getElementById('themeIconSun'),
    themeIconMoon: document.getElementById('themeIconMoon'),

    // Backup Menu
    backupMenuBtn: document.getElementById('backupMenuBtn'),
    backupDropdown: document.getElementById('backupDropdown'),
    exportBackupBtn: document.getElementById('exportBackupBtn'),
    importBackupInput: document.getElementById('importBackupInput'),
    loadDemoBtn: document.getElementById('loadDemoBtn'),
    clearAllBtn: document.getElementById('clearAllBtn'),

    // Stats
    statTotalCerts: document.getElementById('statTotalCerts'),
    statTotalHours: document.getElementById('statTotalHours'),
    statTotalIssuers: document.getElementById('statTotalIssuers'),
    statTotalSkills: document.getElementById('statTotalSkills'),

    // Search & Filters
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    categoryPills: document.getElementById('categoryPills'),
    sortSelect: document.getElementById('sortSelect'),
    countAll: document.getElementById('countAll'),
    resultsCountText: document.getElementById('resultsCountText'),
    activeFiltersBadge: document.getElementById('activeFiltersBadge'),
    currentFilterName: document.getElementById('currentFilterName'),
    resetFilterBtn: document.getElementById('resetFilterBtn'),

    // View switch
    viewGridBtn: document.getElementById('viewGridBtn'),
    viewListBtn: document.getElementById('viewListBtn'),
    viewTimelineBtn: document.getElementById('viewTimelineBtn'),

    // Container & Empty
    certificatesContainer: document.getElementById('certificatesContainer'),
    emptyState: document.getElementById('emptyState'),
    emptyAddBtn: document.getElementById('emptyAddBtn'),
    emptyDemoBtn: document.getElementById('emptyDemoBtn'),

    // Add / Edit Modal
    openAddModalBtn: document.getElementById('openAddModalBtn'),
    certModal: document.getElementById('certModal'),
    modalTitle: document.getElementById('modalTitle'),
    certForm: document.getElementById('certForm'),
    certId: document.getElementById('certId'),
    certTitleInput: document.getElementById('certTitleInput'),
    certIssuerInput: document.getElementById('certIssuerInput'),
    certCategoryInput: document.getElementById('certCategoryInput'),
    certDateInput: document.getElementById('certDateInput'),
    certHoursInput: document.getElementById('certHoursInput'),
    certCodeInput: document.getElementById('certCodeInput'),
    certUrlInput: document.getElementById('certUrlInput'),
    certSkillsInput: document.getElementById('certSkillsInput'),
    certNotesInput: document.getElementById('certNotesInput'),
    closeCertModalBtn: document.getElementById('closeCertModalBtn'),
    cancelCertModalBtn: document.getElementById('cancelCertModalBtn'),

    // Dropzone
    dropZone: document.getElementById('dropZone'),
    certFileInput: document.getElementById('certFileInput'),
    dropZonePrompt: document.getElementById('dropZonePrompt'),
    filePreviewContainer: document.getElementById('filePreviewContainer'),
    previewMediaBox: document.getElementById('previewMediaBox'),
    previewFileName: document.getElementById('previewFileName'),
    previewFileSize: document.getElementById('previewFileSize'),
    removeFileBtn: document.getElementById('removeFileBtn'),

    // Viewer Lightbox Modal
    viewerModal: document.getElementById('viewerModal'),
    viewModalCategory: document.getElementById('viewModalCategory'),
    viewModalTitle: document.getElementById('viewModalTitle'),
    viewModalIssuer: document.getElementById('viewModalIssuer'),
    viewModalDate: document.getElementById('viewModalDate'),
    viewModalHours: document.getElementById('viewModalHours'),
    viewModalCode: document.getElementById('viewModalCode'),
    viewModalCodeWrap: document.getElementById('viewModalCodeWrap'),
    viewModalUrl: document.getElementById('viewModalUrl'),
    viewModalUrlWrap: document.getElementById('viewModalUrlWrap'),
    viewModalSkills: document.getElementById('viewModalSkills'),
    viewModalSkillsWrap: document.getElementById('viewModalSkillsWrap'),
    viewModalNotes: document.getElementById('viewModalNotes'),
    viewModalNotesWrap: document.getElementById('viewModalNotesWrap'),
    viewerMediaContainer: document.getElementById('viewerMediaContainer'),
    closeViewerModalBtn: document.getElementById('closeViewerModalBtn'),
    viewerDownloadBtn: document.getElementById('viewerDownloadBtn'),
    viewerPrintBtn: document.getElementById('viewerPrintBtn'),
    viewerEditBtn: document.getElementById('viewerEditBtn'),
    viewerDeleteBtn: document.getElementById('viewerDeleteBtn'),
    copyCodeBtn: document.getElementById('copyCodeBtn'),
    zoomInBtn: document.getElementById('zoomInBtn'),
    zoomOutBtn: document.getElementById('zoomOutBtn'),
    zoomResetBtn: document.getElementById('zoomResetBtn'),
    zoomLevelText: document.getElementById('zoomLevelText'),

    // Toast Container
    toastContainer: document.getElementById('toastContainer')
  };

  // ==========================================
  // Helper: Toast Notifications
  // ==========================================
  function showToast(message, type = 'info', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    } else {
      iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function formatDatePtBR(dateString) {
    if (!dateString) return '-';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  }

  // ==========================================
  // Sample Data Generator (SVG Badges/Certificates)
  // ==========================================
  function createSampleSvg(title, subtitle, issuer, accentColor = '#6366f1') {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 550" width="100%" height="100%">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0e131f"/>
            <stop offset="100%" stop-color="#182033"/>
          </linearGradient>
          <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${accentColor}"/>
            <stop offset="100%" stop-color="#38bdf8"/>
          </linearGradient>
        </defs>
        <rect width="800" height="550" fill="url(#bgGrad)"/>
        <rect x="25" y="25" width="750" height="500" rx="16" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>
        <rect x="40" y="40" width="720" height="470" rx="12" fill="none" stroke="${accentColor}" stroke-opacity="0.3" stroke-width="1"/>
        
        <!-- Corner decorations -->
        <circle cx="50" cy="50" r="6" fill="${accentColor}"/>
        <circle cx="750" cy="50" r="6" fill="${accentColor}"/>
        <circle cx="50" cy="500" r="6" fill="${accentColor}"/>
        <circle cx="750" cy="500" r="6" fill="${accentColor}"/>

        <!-- Logo/Medal -->
        <circle cx="400" cy="130" r="45" fill="${accentColor}" fill-opacity="0.2" stroke="${accentColor}" stroke-width="2"/>
        <polygon points="400,105 407,122 425,124 411,136 415,154 400,144 385,154 389,136 375,124 393,122" fill="${accentColor}"/>

        <!-- Texts -->
        <text x="400" y="215" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="700" fill="${accentColor}" text-anchor="middle" letter-spacing="4">CERTIFICADO DE CONCLUSÃO</text>
        <text x="400" y="275" font-family="'Outfit', sans-serif" font-size="28" font-weight="800" fill="#ffffff" text-anchor="middle">${escapeHtml(title)}</text>
        <text x="400" y="320" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" fill="#94a3b8" text-anchor="middle">${escapeHtml(subtitle)}</text>
        
        <!-- Divider -->
        <line x1="280" y1="360" x2="520" y2="360" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>

        <!-- Footer details -->
        <text x="400" y="405" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="600" fill="#e2e8f0" text-anchor="middle">Emitido por ${escapeHtml(issuer)}</text>
        <text x="400" y="440" font-family="'SFMono-Regular', monospace" font-size="11" fill="#64748b" text-anchor="middle">Credencial Autêntica e Verificada</text>
      </svg>
    `;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function getDemoCertificates() {
    return [
      {
        id: 'demo-aws-arch',
        title: 'AWS Certified Solutions Architect - Associate',
        issuer: 'Amazon Web Services',
        category: 'Cloud & DevOps',
        date: '2026-03-15',
        hours: 60,
        code: 'AWS-SAA-839210-BR',
        url: 'https://aws.amazon.com/verification',
        skills: ['AWS', 'Cloud Architecture', 'IAM', 'VPC', 'S3', 'EC2', 'Serverless'],
        notes: 'Certificação internacional que valida competência em arquitetura resiliente e segura em nuvem.',
        file: {
          name: 'aws_solutions_architect.svg',
          type: 'image/svg+xml',
          size: 15400,
          dataUrl: createSampleSvg('AWS Solutions Architect', 'Validação Oficial de Competência em Nuvem', 'Amazon Web Services', '#f59e0b')
        },
        createdAt: Date.now() - 5000000
      },
      {
        id: 'demo-python-data',
        title: 'Formação Engenharia de Dados & Machine Learning com Python',
        issuer: 'Coursera & DeepLearning.AI',
        category: 'Tecnologia',
        date: '2026-05-20',
        hours: 80,
        code: 'DL-PY-2026-9021',
        url: 'https://coursera.org/verify/demo',
        skills: ['Python', 'Pandas', 'PySpark', 'ETL', 'Docker', 'PostgreSQL', 'Scikit-Learn'],
        notes: 'Programa abrangente focado em pipelines de dados, modelagem preditiva e arquitetura escalável.',
        file: {
          name: 'python_data_engineer.svg',
          type: 'image/svg+xml',
          size: 16200,
          dataUrl: createSampleSvg('Engenharia de Dados & Python', 'Especialização Profissional em Pipelines e IA', 'DeepLearning.AI', '#06b6d4')
        },
        createdAt: Date.now() - 4000000
      },
      {
        id: 'demo-scrum-master',
        title: 'Professional Scrum Master™ I (PSM I)',
        issuer: 'Scrum.org',
        category: 'Gestão & Negócios',
        date: '2026-07-10',
        hours: 32,
        code: 'PSM-99214-ORG',
        url: 'https://scrum.org/certificates/demo',
        skills: ['Scrum', 'Metodologias Ágeis', 'Kanban', 'Facilitação', 'Liderança Servidora'],
        notes: 'Aprovação com pontuação superior a 95% em avaliação teórica e prática.',
        file: {
          name: 'scrum_master_psm.svg',
          type: 'image/svg+xml',
          size: 14800,
          dataUrl: createSampleSvg('Professional Scrum Master I', 'Certificação Internacional de Liderança Ágil', 'Scrum.org', '#10b981')
        },
        createdAt: Date.now() - 2000000
      },
      {
        id: 'demo-ux-design',
        title: 'Formação Google UX Design Certificate',
        issuer: 'Google Career Certificates',
        category: 'Design & UX',
        date: '2026-08-04',
        hours: 120,
        code: 'GOOG-UX-88129',
        url: 'https://grow.google/certificates',
        skills: ['Figma', 'UX Research', 'Prototipagem', 'Design System', 'Usabilidade'],
        notes: 'Desenvolvimento de 3 projetos completos de portfólio ponta a ponta com testes de usuários.',
        file: {
          name: 'google_ux_certificate.svg',
          type: 'image/svg+xml',
          size: 15600,
          dataUrl: createSampleSvg('Google UX Design Professional', 'Design Centrado no Usuário & Prototipagem', 'Google', '#8b5cf6')
        },
        createdAt: Date.now() - 1000000
      }
    ];
  }

  // ==========================================
  // Render & UI Update Engine
  // ==========================================
  function updateDashboardStats() {
    const certs = state.certificates;

    // Total de Certificados
    elements.statTotalCerts.textContent = certs.length;
    elements.countAll.textContent = certs.length;

    // Carga Horária Total
    const totalHours = certs.reduce((acc, c) => acc + (parseFloat(c.hours) || 0), 0);
    elements.statTotalHours.textContent = totalHours > 0 ? `${totalHours}h` : '0h';

    // Instituições Distintas
    const issuers = new Set(certs.map(c => c.issuer.trim().toLowerCase()).filter(Boolean));
    elements.statTotalIssuers.textContent = issuers.size;

    // Habilidades Mapeadas
    const allSkills = new Set();
    certs.forEach(c => {
      if (Array.isArray(c.skills)) {
        c.skills.forEach(s => allSkills.add(s.trim().toLowerCase()));
      }
    });
    elements.statTotalSkills.textContent = allSkills.size;
  }

  function getFilteredCertificates() {
    let list = [...state.certificates];

    // Categoria
    if (state.selectedCategory !== 'ALL') {
      list = list.filter(c => c.category === state.selectedCategory);
    }

    // Busca textual
    if (state.searchQuery.trim() !== '') {
      const q = state.searchQuery.toLowerCase().trim();
      list = list.filter(c => {
        const titleMatch = (c.title || '').toLowerCase().includes(q);
        const issuerMatch = (c.issuer || '').toLowerCase().includes(q);
        const codeMatch = (c.code || '').toLowerCase().includes(q);
        const notesMatch = (c.notes || '').toLowerCase().includes(q);
        const skillsMatch = Array.isArray(c.skills) && c.skills.some(s => s.toLowerCase().includes(q));
        return titleMatch || issuerMatch || codeMatch || notesMatch || skillsMatch;
      });
    }

    // Ordenação
    list.sort((a, b) => {
      if (state.sortBy === 'newest') {
        return new Date(b.date || 0) - new Date(a.date || 0);
      } else if (state.sortBy === 'oldest') {
        return new Date(a.date || 0) - new Date(b.date || 0);
      } else if (state.sortBy === 'hours-desc') {
        return (parseFloat(b.hours) || 0) - (parseFloat(a.hours) || 0);
      } else if (state.sortBy === 'title-asc') {
        return (a.title || '').localeCompare(b.title || '');
      } else if (state.sortBy === 'issuer-asc') {
        return (a.issuer || '').localeCompare(b.issuer || '');
      }
      return 0;
    });

    return list;
  }

  function renderCertificates() {
    const filtered = getFilteredCertificates();
    const total = state.certificates.length;

    // Results feedback text
    if (total === 0) {
      elements.resultsCountText.textContent = 'Nenhum certificado cadastrado';
      elements.certificatesContainer.classList.add('hidden');
      elements.emptyState.classList.remove('hidden');
      return;
    }

    elements.emptyState.classList.add('hidden');
    elements.certificatesContainer.classList.remove('hidden');

    elements.resultsCountText.textContent = `Mostrando ${filtered.length} de ${total} certificado${total !== 1 ? 's' : ''}`;

    // Active category filter tag feedback
    if (state.selectedCategory !== 'ALL') {
      elements.activeFiltersBadge.classList.remove('hidden');
      elements.currentFilterName.textContent = state.selectedCategory;
    } else {
      elements.activeFiltersBadge.classList.add('hidden');
    }

    // Render based on current view
    if (state.currentView === 'grid') {
      renderGridView(filtered);
    } else if (state.currentView === 'list') {
      renderListView(filtered);
    } else if (state.currentView === 'timeline') {
      renderTimelineView(filtered);
    }
  }

  // --- GRID RENDERER ---
  function renderGridView(certs) {
    elements.certificatesContainer.className = 'certificates-grid';
    elements.certificatesContainer.innerHTML = '';

    if (certs.length === 0) {
      renderNoResultsMessage();
      return;
    }

    certs.forEach(cert => {
      const card = document.createElement('div');
      card.className = 'cert-card';
      card.dataset.id = cert.id;

      // Thumbnail / Preview
      let previewHtml = '';
      const isPdf = cert.file && cert.file.type === 'application/pdf';
      if (isPdf) {
        previewHtml = `
          <div class="pdf-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            <span style="font-size:0.75rem;font-weight:700;color:var(--text-secondary)">DOCUMENTO PDF</span>
          </div>
        `;
      } else if (cert.file && cert.file.dataUrl) {
        previewHtml = `<img src="${cert.file.dataUrl}" alt="${escapeHtml(cert.title)}" loading="lazy">`;
      } else {
        previewHtml = `
          <div class="pdf-placeholder" style="color:var(--primary)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span style="font-size:0.75rem;font-weight:700">SEM ANEXO</span>
          </div>
        `;
      }

      // Skills HTML
      const skillsHtml = (cert.skills || [])
        .slice(0, 4)
        .map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`)
        .join('');

      const remainingSkills = (cert.skills || []).length > 4 ? `<span class="skill-tag">+${cert.skills.length - 4}</span>` : '';

      card.innerHTML = `
        <div class="cert-card-preview" data-action="view">
          <span class="cert-category-badge">${escapeHtml(cert.category || 'Geral')}</span>
          ${previewHtml}
          <div class="preview-overlay">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <span>Visualizar</span>
          </div>
        </div>

        <div class="cert-card-body">
          <div class="cert-issuer-line">${escapeHtml(cert.issuer || 'Instituição')}</div>
          <h3 class="cert-title" title="${escapeHtml(cert.title)}">${escapeHtml(cert.title)}</h3>

          <div class="cert-meta-row">
            <div class="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>${formatDatePtBR(cert.date)}</span>
            </div>
            ${cert.hours ? `
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>${cert.hours}h</span>
              </div>
            ` : ''}
          </div>

          <div class="cert-tags-row">
            ${skillsHtml}
            ${remainingSkills}
          </div>

          <div class="cert-card-footer">
            <div class="card-actions-left">
              <button class="btn-card-action" data-action="view" title="Abrir em Tela Cheia">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                Abrir
              </button>
              ${cert.url ? `
                <a href="${escapeHtml(cert.url)}" target="_blank" rel="noopener noreferrer" class="btn-card-action" title="Verificar no site">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              ` : ''}
            </div>

            <div class="card-actions-right">
              <button class="btn-icon-secondary" data-action="edit" title="Editar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn-icon-secondary danger-icon" data-action="delete" title="Excluir">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;

      elements.certificatesContainer.appendChild(card);
    });
  }

  // --- LIST RENDERER ---
  function renderListView(certs) {
    elements.certificatesContainer.className = 'certificates-list';
    elements.certificatesContainer.innerHTML = '';

    if (certs.length === 0) {
      renderNoResultsMessage();
      return;
    }

    certs.forEach(cert => {
      const card = document.createElement('div');
      card.className = 'cert-card';
      card.dataset.id = cert.id;

      const isPdf = cert.file && cert.file.type === 'application/pdf';
      let previewHtml = '';
      if (isPdf) {
        previewHtml = `<div class="pdf-placeholder"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg></div>`;
      } else if (cert.file && cert.file.dataUrl) {
        previewHtml = `<img src="${cert.file.dataUrl}" alt="${escapeHtml(cert.title)}" loading="lazy">`;
      } else {
        previewHtml = `<div class="pdf-placeholder" style="color:var(--text-muted)"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg></div>`;
      }

      card.innerHTML = `
        <div class="cert-card-preview" data-action="view">
          ${previewHtml}
        </div>

        <div class="cert-card-body">
          <div class="cert-issuer-line">${escapeHtml(cert.issuer || 'Instituição')} &bull; ${escapeHtml(cert.category || 'Geral')}</div>
          <h3 class="cert-title" data-action="view" style="cursor:pointer">${escapeHtml(cert.title)}</h3>
          <div class="cert-meta-row" style="margin-bottom:0">
            <div class="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>${formatDatePtBR(cert.date)}</span>
            </div>
            ${cert.hours ? `
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>${cert.hours}h</span>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="cert-card-footer">
          <button class="btn-card-action" data-action="view">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Ver
          </button>
          <button class="btn-icon-secondary" data-action="edit" title="Editar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon-secondary danger-icon" data-action="delete" title="Excluir">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      `;

      elements.certificatesContainer.appendChild(card);
    });
  }

  // --- TIMELINE RENDERER ---
  function renderTimelineView(certs) {
    elements.certificatesContainer.className = 'certificates-timeline';
    elements.certificatesContainer.innerHTML = '';

    if (certs.length === 0) {
      renderNoResultsMessage();
      return;
    }

    // Agrupar por ano
    const groups = {};
    certs.forEach(cert => {
      const year = cert.date ? cert.date.substring(0, 4) : 'Outros';
      if (!groups[year]) groups[year] = [];
      groups[year].push(cert);
    });

    // Ordenar anos
    const sortedYears = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    sortedYears.forEach(year => {
      const yearWrap = document.createElement('div');
      yearWrap.className = 'timeline-year-group';

      yearWrap.innerHTML = `
        <div class="timeline-year-badge">${year}</div>
        <div class="timeline-items-wrap"></div>
      `;

      const itemsWrap = yearWrap.querySelector('.timeline-items-wrap');

      groups[year].forEach(cert => {
        const item = document.createElement('div');
        item.className = 'timeline-item cert-card';
        item.dataset.id = cert.id;
        item.style.padding = '1.2rem';

        item.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; flex-wrap:wrap">
            <div>
              <div class="cert-issuer-line">${escapeHtml(cert.issuer || 'Instituição')} &bull; ${escapeHtml(cert.category || 'Geral')}</div>
              <h3 class="cert-title" data-action="view" style="cursor:pointer; margin-bottom:0.4rem">${escapeHtml(cert.title)}</h3>
              <div class="cert-meta-row" style="margin-bottom:0">
                <div class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span>Concluído em ${formatDatePtBR(cert.date)}</span>
                </div>
                ${cert.hours ? `
                  <div class="meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>${cert.hours} Horas</span>
                  </div>
                ` : ''}
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:0.5rem">
              <button class="btn-card-action" data-action="view">Visualizar</button>
              <button class="btn-icon-secondary" data-action="edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
              <button class="btn-icon-secondary danger-icon" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
            </div>
          </div>
        `;

        itemsWrap.appendChild(item);
      });

      elements.certificatesContainer.appendChild(yearWrap);
    });
  }

  function renderNoResultsMessage() {
    elements.certificatesContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding: 3rem 1rem; color:var(--text-secondary)">
        <p style="font-size:1.1rem; font-weight:600; margin-bottom:0.5rem">Nenhum certificado encontrado para estes filtros.</p>
        <p style="font-size:0.88rem; color:var(--text-muted)">Tente ajustar o termo de pesquisa ou selecionar outra categoria.</p>
      </div>
    `;
  }

  // ==========================================
  // Certificate Modal (Add / Edit) Management
  // ==========================================
  function openAddModal(certificateToEdit = null) {
    elements.certForm.reset();
    state.currentUploadedFile = null;
    clearFilePreview();

    if (certificateToEdit) {
      elements.modalTitle.textContent = 'Editar Certificado';
      elements.certId.value = certificateToEdit.id;
      elements.certTitleInput.value = certificateToEdit.title || '';
      elements.certIssuerInput.value = certificateToEdit.issuer || '';
      elements.certCategoryInput.value = certificateToEdit.category || 'Tecnologia';
      elements.certDateInput.value = certificateToEdit.date || '';
      elements.certHoursInput.value = certificateToEdit.hours || '';
      elements.certCodeInput.value = certificateToEdit.code || '';
      elements.certUrlInput.value = certificateToEdit.url || '';
      elements.certSkillsInput.value = (certificateToEdit.skills || []).join(', ');
      elements.certNotesInput.value = certificateToEdit.notes || '';

      if (certificateToEdit.file) {
        state.currentUploadedFile = certificateToEdit.file;
        showFilePreview(certificateToEdit.file);
      }
    } else {
      elements.modalTitle.textContent = 'Adicionar Certificado';
      elements.certId.value = '';
      // Default to today's date
      const today = new Date().toISOString().split('T')[0];
      elements.certDateInput.value = today;
    }

    elements.certModal.classList.add('active');
    elements.certTitleInput.focus();
  }

  function closeAddModal() {
    elements.certModal.classList.remove('active');
  }

  function handleFileSelected(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      state.currentUploadedFile = {
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: e.target.result
      };
      showFilePreview(state.currentUploadedFile);
    };

    reader.onerror = () => {
      showToast('Erro ao ler arquivo selecionado.', 'error');
    };

    reader.readAsDataURL(file);
  }

  function showFilePreview(fileObj) {
    elements.dropZonePrompt.classList.add('hidden');
    elements.filePreviewContainer.classList.remove('hidden');

    elements.previewFileName.textContent = fileObj.name || 'documento';
    elements.previewFileSize.textContent = formatBytes(fileObj.size);

    if (fileObj.type === 'application/pdf') {
      elements.previewMediaBox.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="9" y1="15" x2="15" y2="15"></line>
        </svg>
      `;
    } else {
      elements.previewMediaBox.innerHTML = `<img src="${fileObj.dataUrl}" alt="Preview">`;
    }
  }

  function clearFilePreview() {
    elements.dropZonePrompt.classList.remove('hidden');
    elements.filePreviewContainer.classList.add('hidden');
    elements.previewMediaBox.innerHTML = '';
    elements.certFileInput.value = '';
    state.currentUploadedFile = null;
  }

  async function handleFormSubmit(e) {
    e.preventDefault();

    const title = elements.certTitleInput.value.trim();
    const issuer = elements.certIssuerInput.value.trim();
    const category = elements.certCategoryInput.value;
    const date = elements.certDateInput.value;
    const hours = elements.certHoursInput.value ? parseFloat(elements.certHoursInput.value) : null;
    const code = elements.certCodeInput.value.trim();
    const url = elements.certUrlInput.value.trim();
    const notes = elements.certNotesInput.value.trim();

    const skillsRaw = elements.certSkillsInput.value;
    const skills = skillsRaw
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const existingId = elements.certId.value;

    let certData;
    if (existingId) {
      const existing = await db.getById(existingId);
      certData = {
        ...existing,
        title,
        issuer,
        category,
        date,
        hours,
        code,
        url,
        skills,
        notes,
        file: state.currentUploadedFile || existing.file || null,
        updatedAt: Date.now()
      };
    } else {
      certData = {
        id: 'cert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        title,
        issuer,
        category,
        date,
        hours,
        code,
        url,
        skills,
        notes,
        file: state.currentUploadedFile || null,
        createdAt: Date.now()
      };
    }

    try {
      await db.put(certData);

      // Atualiza estado local
      const idx = state.certificates.findIndex(c => c.id === certData.id);
      if (idx !== -1) {
        state.certificates[idx] = certData;
      } else {
        state.certificates.unshift(certData);
      }

      updateDashboardStats();
      renderCertificates();
      closeAddModal();
      showToast(existingId ? 'Certificado atualizado com sucesso!' : 'Novo certificado salvo!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar no banco de dados.', 'error');
    }
  }

  // ==========================================
  // Viewer Lightbox & Inspector
  // ==========================================
  function openViewerModal(certificate) {
    state.activeCertificate = certificate;
    state.zoomLevel = 100;
    updateZoomDisplay();

    elements.viewModalCategory.textContent = certificate.category || 'Geral';
    elements.viewModalTitle.textContent = certificate.title || 'Certificado';
    elements.viewModalIssuer.textContent = `Emitido por ${certificate.issuer || '-'}`;
    elements.viewModalDate.textContent = formatDatePtBR(certificate.date);
    elements.viewModalHours.textContent = certificate.hours ? `${certificate.hours} Horas` : 'Não informada';

    // Code
    if (certificate.code) {
      elements.viewModalCodeWrap.classList.remove('hidden');
      elements.viewModalCode.textContent = certificate.code;
    } else {
      elements.viewModalCodeWrap.classList.add('hidden');
    }

    // URL
    if (certificate.url) {
      elements.viewModalUrlWrap.classList.remove('hidden');
      elements.viewModalUrl.href = certificate.url;
    } else {
      elements.viewModalUrlWrap.classList.add('hidden');
    }

    // Skills
    if (certificate.skills && certificate.skills.length > 0) {
      elements.viewModalSkillsWrap.classList.remove('hidden');
      elements.viewModalSkills.innerHTML = certificate.skills
        .map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`)
        .join('');
    } else {
      elements.viewModalSkillsWrap.classList.add('hidden');
    }

    // Notes
    if (certificate.notes) {
      elements.viewModalNotesWrap.classList.remove('hidden');
      elements.viewModalNotes.textContent = certificate.notes;
    } else {
      elements.viewModalNotesWrap.classList.add('hidden');
    }

    // Media Display
    elements.viewerMediaContainer.innerHTML = '';
    const zoomControls = document.getElementById('zoomControls');

    if (certificate.file && certificate.file.dataUrl) {
      if (certificate.file.type === 'application/pdf') {
        zoomControls.classList.add('hidden');
        const iframe = document.createElement('iframe');
        iframe.src = certificate.file.dataUrl;
        iframe.title = certificate.title;
        elements.viewerMediaContainer.appendChild(iframe);
      } else {
        zoomControls.classList.remove('hidden');
        const img = document.createElement('img');
        img.src = certificate.file.dataUrl;
        img.alt = certificate.title;
        img.id = 'viewerActiveImage';
        elements.viewerMediaContainer.appendChild(img);
      }
    } else {
      zoomControls.classList.add('hidden');
      elements.viewerMediaContainer.innerHTML = `
        <div style="text-align:center; color:var(--text-muted)">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <p style="margin-top:0.8rem">Nenhum anexo foi carregado para este certificado.</p>
        </div>
      `;
    }

    elements.viewerModal.classList.add('active');
  }

  function closeViewerModal() {
    elements.viewerModal.classList.remove('active');
    state.activeCertificate = null;
  }

  function updateZoomDisplay() {
    elements.zoomLevelText.textContent = `${state.zoomLevel}%`;
    const img = document.getElementById('viewerActiveImage');
    if (img) {
      img.style.transform = `scale(${state.zoomLevel / 100})`;
    }
  }

  function downloadActiveCertificateFile() {
    if (!state.activeCertificate || !state.activeCertificate.file) {
      showToast('Nenhum arquivo para download neste certificado.', 'info');
      return;
    }
    const file = state.activeCertificate.file;
    const a = document.createElement('a');
    a.href = file.dataUrl;
    a.download = file.name || `${state.activeCertificate.title.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Download iniciado!', 'success');
  }

  // ==========================================
  // Delete Certificate Action
  // ==========================================
  async function confirmAndDeleteCertificate(id) {
    const cert = state.certificates.find(c => c.id === id);
    if (!cert) return;

    const confirmMsg = `Tem certeza que deseja excluir o certificado "${cert.title}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await db.delete(id);
      state.certificates = state.certificates.filter(c => c.id !== id);
      updateDashboardStats();
      renderCertificates();

      if (state.activeCertificate && state.activeCertificate.id === id) {
        closeViewerModal();
      }

      showToast('Certificado excluído com sucesso.', 'info');
    } catch (err) {
      console.error(err);
      showToast('Erro ao excluir certificado.', 'error');
    }
  }

  // ==========================================
  // Export & Import Backup (Zero limites)
  // ==========================================
  function exportBackup() {
    if (state.certificates.length === 0) {
      showToast('Não há certificados para exportar.', 'info');
      return;
    }

    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      total: state.certificates.length,
      certificates: state.certificates
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];

    const a = document.createElement('a');
    a.href = url;
    a.download = `certifyvault_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Backup de ${state.certificates.length} certificados exportado!`, 'success');
  }

  async function handleImportBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.certificates || !Array.isArray(data.certificates)) {
        throw new Error('Arquivo de backup inválido.');
      }

      const importedCerts = data.certificates;
      await db.bulkPut(importedCerts);

      state.certificates = await db.getAll();
      updateDashboardStats();
      renderCertificates();

      showToast(`${importedCerts.length} certificados importados com sucesso!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao importar backup: arquivo corrompido ou formato inválido.', 'error');
    } finally {
      elements.importBackupInput.value = '';
    }
  }

  async function loadDemoData() {
    const demos = getDemoCertificates();
    await db.bulkPut(demos);
    state.certificates = await db.getAll();
    updateDashboardStats();
    renderCertificates();
    showToast('4 Certificados de exemplo foram carregados!', 'success');
  }

  async function clearAllData() {
    if (state.certificates.length === 0) {
      showToast('A biblioteca já está vazia.', 'info');
      return;
    }

    const confirmed = window.confirm('ATENÇÃO: Deseja realmente excluir TODOS os certificados salvos? Esta ação não pode ser desfeita.');
    if (!confirmed) return;

    await db.clear();
    state.certificates = [];
    updateDashboardStats();
    renderCertificates();
    showToast('Todos os certificados foram removidos.', 'info');
  }

  // ==========================================
  // Theme Toggle (Dark / Light)
  // ==========================================
  function initTheme() {
    const savedTheme = localStorage.getItem('certifyvault_theme') || 'dark';
    applyTheme(savedTheme);
  }

  function applyTheme(theme) {
    if (theme === 'light') {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      elements.themeIconSun.classList.add('hidden');
      elements.themeIconMoon.classList.remove('hidden');
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      elements.themeIconSun.classList.remove('hidden');
      elements.themeIconMoon.classList.add('hidden');
    }
    localStorage.setItem('certifyvault_theme', theme);
  }

  function toggleTheme() {
    const isLight = document.body.classList.contains('light-theme');
    applyTheme(isLight ? 'dark' : 'light');
  }

  // ==========================================
  // Event Listeners Setup
  // ==========================================
  function attachEventListeners() {
    // Theme toggle
    elements.themeToggleBtn.addEventListener('click', toggleTheme);

    // Backup dropdown toggle
    elements.backupMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      elements.backupMenuBtn.closest('.dropdown').classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
      }
    });

    // Backup Actions
    elements.exportBackupBtn.addEventListener('click', () => {
      elements.backupMenuBtn.closest('.dropdown').classList.remove('open');
      exportBackup();
    });

    elements.importBackupInput.addEventListener('change', (e) => {
      elements.backupMenuBtn.closest('.dropdown').classList.remove('open');
      handleImportBackup(e);
    });

    elements.loadDemoBtn.addEventListener('click', () => {
      elements.backupMenuBtn.closest('.dropdown').classList.remove('open');
      loadDemoData();
    });

    elements.clearAllBtn.addEventListener('click', () => {
      elements.backupMenuBtn.closest('.dropdown').classList.remove('open');
      clearAllData();
    });

    // Modal Add / Edit
    elements.openAddModalBtn.addEventListener('click', () => openAddModal());
    elements.emptyAddBtn.addEventListener('click', () => openAddModal());
    elements.emptyDemoBtn.addEventListener('click', () => loadDemoData());
    elements.closeCertModalBtn.addEventListener('click', closeAddModal);
    elements.cancelCertModalBtn.addEventListener('click', closeAddModal);
    elements.certModal.addEventListener('click', (e) => {
      if (e.target === elements.certModal) closeAddModal();
    });

    elements.certForm.addEventListener('submit', handleFormSubmit);

    // Dropzone Events
    elements.dropZone.addEventListener('click', () => elements.certFileInput.click());

    elements.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      elements.dropZone.classList.add('drag-over');
    });

    elements.dropZone.addEventListener('dragleave', () => {
      elements.dropZone.classList.remove('drag-over');
    });

    elements.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      elements.dropZone.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelected(e.dataTransfer.files[0]);
      }
    });

    elements.certFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelected(e.target.files[0]);
      }
    });

    elements.removeFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearFilePreview();
    });

    // Viewer Lightbox Events
    elements.closeViewerModalBtn.addEventListener('click', closeViewerModal);
    elements.viewerModal.addEventListener('click', (e) => {
      if (e.target === elements.viewerModal) closeViewerModal();
    });

    elements.viewerDownloadBtn.addEventListener('click', downloadActiveCertificateFile);
    elements.viewerPrintBtn.addEventListener('click', () => window.print());

    elements.viewerEditBtn.addEventListener('click', () => {
      if (state.activeCertificate) {
        const cert = state.activeCertificate;
        closeViewerModal();
        openAddModal(cert);
      }
    });

    elements.viewerDeleteBtn.addEventListener('click', () => {
      if (state.activeCertificate) {
        confirmAndDeleteCertificate(state.activeCertificate.id);
      }
    });

    // Zoom Controls
    elements.zoomInBtn.addEventListener('click', () => {
      if (state.zoomLevel < 300) {
        state.zoomLevel += 25;
        updateZoomDisplay();
      }
    });

    elements.zoomOutBtn.addEventListener('click', () => {
      if (state.zoomLevel > 50) {
        state.zoomLevel -= 25;
        updateZoomDisplay();
      }
    });

    elements.zoomResetBtn.addEventListener('click', () => {
      state.zoomLevel = 100;
      updateZoomDisplay();
    });

    // Copy Code Button
    elements.copyCodeBtn.addEventListener('click', () => {
      const code = elements.viewModalCode.textContent;
      if (code && code !== '-') {
        navigator.clipboard.writeText(code).then(() => {
          showToast('Código copiado para a área de transferência!', 'success');
        });
      }
    });

    // Search Input
    elements.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      if (state.searchQuery) {
        elements.clearSearchBtn.classList.remove('hidden');
      } else {
        elements.clearSearchBtn.classList.add('hidden');
      }
      renderCertificates();
    });

    elements.clearSearchBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      state.searchQuery = '';
      elements.clearSearchBtn.classList.add('hidden');
      renderCertificates();
      elements.searchInput.focus();
    });

    // Category Filter Pills
    elements.categoryPills.addEventListener('click', (e) => {
      const pill = e.target.closest('.pill');
      if (!pill) return;

      elements.categoryPills.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      state.selectedCategory = pill.dataset.category;
      renderCertificates();
    });

    // Reset Filter Button
    elements.resetFilterBtn.addEventListener('click', () => {
      state.selectedCategory = 'ALL';
      elements.categoryPills.querySelectorAll('.pill').forEach(p => {
        p.classList.toggle('active', p.dataset.category === 'ALL');
      });
      renderCertificates();
    });

    // Sort Select
    elements.sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderCertificates();
    });

    // View Switching
    elements.viewGridBtn.addEventListener('click', () => {
      state.currentView = 'grid';
      elements.viewGridBtn.classList.add('active');
      elements.viewListBtn.classList.remove('active');
      elements.viewTimelineBtn.classList.remove('active');
      renderCertificates();
    });

    elements.viewListBtn.addEventListener('click', () => {
      state.currentView = 'list';
      elements.viewListBtn.classList.add('active');
      elements.viewGridBtn.classList.remove('active');
      elements.viewTimelineBtn.classList.remove('active');
      renderCertificates();
    });

    elements.viewTimelineBtn.addEventListener('click', () => {
      state.currentView = 'timeline';
      elements.viewTimelineBtn.classList.add('active');
      elements.viewGridBtn.classList.remove('active');
      elements.viewListBtn.classList.remove('active');
      renderCertificates();
    });

    // Certificate Card Delegated Clicks (View, Edit, Delete)
    elements.certificatesContainer.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const card = target.closest('[data-id]');
      if (!card) return;

      const certId = card.dataset.id;
      const cert = state.certificates.find(c => c.id === certId);
      if (!cert) return;

      const action = target.dataset.action;
      if (action === 'view') {
        openViewerModal(cert);
      } else if (action === 'edit') {
        openAddModal(cert);
      } else if (action === 'delete') {
        confirmAndDeleteCertificate(certId);
      }
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (elements.viewerModal.classList.contains('active')) {
          closeViewerModal();
        } else if (elements.certModal.classList.contains('active')) {
          closeAddModal();
        }
      }
    });
  }

  // ==========================================
  // Initialization
  // ==========================================
  async function init() {
    try {
      initTheme();
      attachEventListeners();

      await db.init();
      state.certificates = await db.getAll();

      // Se for a primeira vez e estiver vazio, carregar exemplos para encantar de primeira
      if (state.certificates.length === 0) {
        const demos = getDemoCertificates();
        await db.bulkPut(demos);
        state.certificates = await db.getAll();
      }

      updateDashboardStats();
      renderCertificates();
    } catch (err) {
      console.error('Falha na inicialização do CertifyVault:', err);
      showToast('Erro ao carregar o repositório de certificados.', 'error');
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

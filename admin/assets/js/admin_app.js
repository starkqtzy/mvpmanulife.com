/* MVP Falcon Unit — Admin Dashboard with localStorage backend */

tailwind.config = {
  theme: {
    extend: {
      colors: {
        forest: {
          950: '#081C15',
          900: '#0B2A1F',
          800: '#0F3D2E',
          700: '#155E3E',
          600: '#1A7A4D',
          500: '#1E9A5A',
          400: '#4ADE80',
          200: '#BBF0D2',
          100: '#DFF7E8',
          50:  '#F3FBF6'
        }
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      boxShadow: {
        ring: '0 1px 2px rgba(11,42,31,0.06), 0 8px 24px -8px rgba(11,42,31,0.15)'
      }
    }
  }
};

const SESSION_KEY = 'mvpFalconAdminSession';

const GET_LEADS_URL = '../backend/get_leads.php';
const DELETE_LEAD_URL = '../backend/delete_lead.php';

/* Demo credentials — update before going live */
const ADMIN_EMAIL = 'admin@mvpfalcon.com';
const ADMIN_PASSWORD = 'falcon2026';

let currentView = 'all';
let lineChartInstance = null;
let barChartInstance = null;
let allLeadsCache = [];

async function fetchLeads() {
  try {
    const res = await fetch(GET_LEADS_URL);
    const data = await res.json();
    if (data.success && Array.isArray(data.leads)) {
      allLeadsCache = data.leads.map(lead => ({
        ...lead,
        file_data_url: lead.file_data_url ? '../' + lead.file_data_url : ''
      }));
      return allLeadsCache;
    }
    allLeadsCache = [];
    return [];
  } catch (e) {
    console.error('Failed to fetch leads:', e);
    allLeadsCache = [];
    return [];
  }
}

function updateStatCards(leads) {
  const statTotal = document.getElementById('statTotal');
  const statApps = document.getElementById('statApps');
  const statQuotes = document.getElementById('statQuotes');
  const statInqs = document.getElementById('statInqs');

  if (statTotal) statTotal.textContent = leads.length;
  if (statApps) statApps.textContent = leads.filter(l => l.type === 'Application').length;
  if (statQuotes) statQuotes.textContent = leads.filter(l => l.type === 'Quote').length;
  if (statInqs) statInqs.textContent = leads.filter(l => l.type === 'Inquiry').length;
}

function getLast7DayLabels() {
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
  }
  return labels;
}

function getLast7DayKeys() {
  const keys = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    keys.push(d.toDateString());
  }
  return keys;
}

async function renderDashboardAnalytics() {
  const lineCanvas = document.getElementById('submissionsLineChart');
  const barCanvas = document.getElementById('submissionsBarChart');
  if (!lineCanvas || !barCanvas || typeof Chart === 'undefined') return;

  const allLeads = await fetchLeads();
  updateStatCards(allLeads);

  const dayKeys = getLast7DayKeys();
  const dayLabels = getLast7DayLabels();
  const countsByDay = Object.fromEntries(dayKeys.map(k => [k, 0]));

  allLeads.forEach(lead => {
    const d = new Date(lead.date);
    if (isNaN(d)) return;
    d.setHours(0, 0, 0, 0);
    const key = d.toDateString();
    if (key in countsByDay) countsByDay[key]++;
  });

  const lineData = dayKeys.map(k => countsByDay[k]);
  const apps = allLeads.filter(l => l.type === 'Application').length;
  const quotes = allLeads.filter(l => l.type === 'Quote').length;
  const inquiries = allLeads.filter(l => l.type === 'Inquiry').length;

  if (lineChartInstance) lineChartInstance.destroy();
  if (barChartInstance) barChartInstance.destroy();

  lineChartInstance = new Chart(lineCanvas, {
    type: 'line',
    data: {
      labels: dayLabels,
      datasets: [{
        label: 'Forms Submitted',
        data: lineData,
        borderColor: '#1E9A5A',
        backgroundColor: 'rgba(30,154,90,0.12)',
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#0F3D2E',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, color: '#155E3E' }, grid: { color: 'rgba(11,42,31,0.06)' } },
        x: { ticks: { color: '#155E3E' }, grid: { display: false } }
      }
    }
  });

  barChartInstance = new Chart(barCanvas, {
    type: 'bar',
    data: {
      labels: ['Applications', 'Quotes', 'Inquiries'],
      datasets: [{
        label: 'Submitted Forms',
        data: [apps, quotes, inquiries],
        backgroundColor: ['#1A7A4D', '#1E9A5A', '#4ADE80'],
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, color: '#155E3E' }, grid: { color: 'rgba(11,42,31,0.06)' } },
        x: { ticks: { color: '#155E3E' }, grid: { display: false } }
      }
    }
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatModalValue(value) {
  return escapeHtml(value ?? '—').replace(/\n/g, '<br>');
}

function renderLeadFileCell(lead) {
  if (!lead.file_data_url) {
    return '<span class="text-forest-400">—</span>';
  }

  const fileName = escapeHtml(lead.file_name || 'Attachment');
  const fileUrl = escapeHtml(lead.file_data_url);
  return `<a href="${fileUrl}" download="${fileName}" class="text-forest-700 underline decoration-forest-300 hover:text-forest-900">${fileName}</a>`;
}

function openLeadModal(index) {
  const lead = allLeadsCache[index];
  const modal = document.getElementById('leadModal');
  const title = document.getElementById('leadModalTitle');
  const body = document.getElementById('leadModalBody');

  if (!modal || !title || !body || !lead) return;

  title.textContent = `${lead.name || 'Lead'} Details`;
  body.innerHTML = `
    <div class="grid gap-4 md:grid-cols-2">
      <div class="rounded-2xl border border-forest-100 bg-forest-50 p-4">
        <p class="text-[10px] uppercase tracking-[0.2em] text-forest-500">Date</p>
        <p class="mt-1 text-sm font-semibold text-forest-900">${formatModalValue(lead.date)}</p>
      </div>
      <div class="rounded-2xl border border-forest-100 bg-forest-50 p-4">
        <p class="text-[10px] uppercase tracking-[0.2em] text-forest-500">Type</p>
        <p class="mt-1 text-sm font-semibold text-forest-900">${formatModalValue(lead.type)}</p>
      </div>
      <div class="rounded-2xl border border-forest-100 bg-forest-50 p-4">
        <p class="text-[10px] uppercase tracking-[0.2em] text-forest-500">Name</p>
        <p class="mt-1 text-sm font-semibold text-forest-900">${formatModalValue(lead.name)}</p>
      </div>
      <div class="rounded-2xl border border-forest-100 bg-forest-50 p-4">
        <p class="text-[10px] uppercase tracking-[0.2em] text-forest-500">Mobile</p>
        <p class="mt-1 text-sm font-semibold text-forest-900">${formatModalValue(lead.mobile)}</p>
      </div>
      <div class="rounded-2xl border border-forest-100 bg-forest-50 p-4">
        <p class="text-[10px] uppercase tracking-[0.2em] text-forest-500">Email</p>
        <p class="mt-1 text-sm font-semibold text-forest-900">${formatModalValue(lead.email)}</p>
      </div>
      <div class="rounded-2xl border border-forest-100 bg-forest-50 p-4">
        <p class="text-[10px] uppercase tracking-[0.2em] text-forest-500">Facebook</p>
        <p class="mt-1 text-sm font-semibold text-forest-900">${formatModalValue(lead.facebook || '—')}</p>
      </div>
      <div class="rounded-2xl border border-forest-100 bg-forest-50 p-4">
        <p class="text-[10px] uppercase tracking-[0.2em] text-forest-500">Interest</p>
        <p class="mt-1 text-sm font-semibold text-forest-900">${formatModalValue(lead.interest)}</p>
      </div>
    </div>
    <div class="rounded-2xl border border-forest-100 bg-forest-50 p-4">
      <p class="text-[10px] uppercase tracking-[0.2em] text-forest-500">Attachment</p>
      <div class="mt-2 text-sm text-forest-800">${renderLeadFileCell(lead)}</div>
    </div>
    <div class="rounded-2xl border border-forest-100 bg-forest-50 p-4">
      <p class="text-[10px] uppercase tracking-[0.2em] text-forest-500">Message</p>
      <p class="mt-2 text-sm text-forest-800 whitespace-pre-wrap">${formatModalValue(lead.message)}</p>
    </div>`;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.classList.add('modal-open');
}

function closeLeadModal() {
  const modal = document.getElementById('leadModal');
  if (!modal) return;

  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.classList.remove('modal-open');
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = 'loginForm.html';
}

function filterLeads(leads) {
  const query = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
  let filtered = leads;

  if (currentView === 'applications') {
    filtered = filtered.filter(l => l.type === 'Application');
  } else if (currentView === 'quotes') {
    filtered = filtered.filter(l => l.type === 'Quote');
  } else if (currentView === 'inquiries') {
    filtered = filtered.filter(l => l.type === 'Inquiry');
  }

  if (query) {
    filtered = filtered.filter(l =>
      [l.name, l.mobile, l.email, l.facebook, l.file_name, l.interest, l.message, l.type]
        .some(v => String(v || '').toLowerCase().includes(query))
    );
  }

  return filtered;
}

function renderDistBars(leads) {
  const container = document.getElementById('distBars');
  if (!container) return;

  const total = leads.length || 1;
  const types = [
    { label: 'Applications', count: leads.filter(l => l.type === 'Application').length, color: 'bg-forest-600' },
    { label: 'Quotes', count: leads.filter(l => l.type === 'Quote').length, color: 'bg-forest-500' },
    { label: 'Inquiries', count: leads.filter(l => l.type === 'Inquiry').length, color: 'bg-forest-400' }
  ];

  container.innerHTML = types.map(t => {
    const pct = Math.round((t.count / total) * 100);
    return `
      <div>
        <div class="flex justify-between text-xs text-forest-600 mb-1">
          <span>${t.label}</span>
          <span class="font-mono">${t.count} (${pct}%)</span>
        </div>
        <div class="h-2 rounded-full bg-forest-50 overflow-hidden">
          <div class="${t.color} h-full rounded-full transition-all" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join('');
}

async function deleteLead(index) {
  const lead = allLeadsCache[index];
  if (!lead) return;
  if (!confirm('Remove this lead?')) return;

  try {
    const res = await fetch(DELETE_LEAD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lead.id })
    });
    const data = await res.json();
    if (!data.success) {
      alert('Failed to delete lead: ' + (data.message || 'Unknown error'));
      return;
    }
  } catch (e) {
    console.error('Delete failed:', e);
    alert('Network error deleting lead.');
    return;
  }

  await renderLeads();
  if (document.getElementById('submissionsLineChart')) await renderDashboardAnalytics();
}

function renderLeadsTable(leads, allLeads) {
  const tbody = document.getElementById('leadsTableBody');
  const emptyState = document.getElementById('emptyState');

  updateStatCards(allLeads);
  renderDistBars(allLeads);

  if (!tbody) return;

  tbody.innerHTML = '';

  if (leads.length === 0) {
    emptyState?.classList.remove('hidden');
    return;
  }

  emptyState?.classList.add('hidden');

  leads.forEach((lead) => {
    const index = allLeadsCache.indexOf(lead);
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-forest-50';
    tr.innerHTML = `
      <td class="px-4 py-3 whitespace-nowrap text-forest-700">${escapeHtml(lead.date)}</td>
      <td class="px-4 py-3 whitespace-nowrap font-medium text-forest-900">${escapeHtml(lead.type)}</td>
      <td class="px-4 py-3 whitespace-nowrap">${escapeHtml(lead.name)}</td>
      <td class="px-4 py-3 whitespace-nowrap">${escapeHtml(lead.mobile)}</td>
      <td class="px-4 py-3 whitespace-nowrap">${escapeHtml(lead.email)}</td>
      <td class="px-4 py-3 whitespace-nowrap">${escapeHtml(lead.facebook || '—')}</td>
      <td class="px-4 py-3 whitespace-nowrap">${renderLeadFileCell(lead)}</td>
      <td class="px-4 py-3 whitespace-nowrap">${escapeHtml(lead.interest)}</td>
      <td class="px-4 py-3 max-w-xs truncate" title="${escapeHtml(lead.message)}">${escapeHtml(lead.message)}</td>
      <td class="px-4 py-3 whitespace-nowrap">
        <div class="flex items-center gap-2">
          <button onclick="openLeadModal(${index})" class="text-xs px-3 py-1 rounded-full border border-forest-200 text-forest-700 hover:bg-forest-50 transition-colors">View</button>
          <button onclick="deleteLead(${index})" class="text-xs px-3 py-1 rounded-full border border-red-200 text-red-600 hover:bg-red-50 transition-colors">Delete</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
}

async function renderLeads() {
  const allLeads = await fetchLeads();
  const leads = filterLeads(allLeads);
  renderLeadsTable(leads, allLeads);
}

function rerenderLeadsFromCache() {
  const filtered = filterLeads(allLeadsCache);
  renderLeadsTable(filtered, allLeadsCache);
}

function csvEscape(value) {
  const s = String(value ?? '');
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

async function exportCSV() {
  const leads = await fetchLeads();
  if (leads.length === 0) {
    alert('No leads to export yet.');
    return;
  }

  const headers = ['Date', 'Type', 'Name', 'Mobile', 'Email', 'Facebook', 'File', 'Interest', 'Message'];
  const rows = leads.map(l => [l.date, l.type, l.name, l.mobile, l.email, l.facebook || '', l.file_name || '', l.interest, l.message]);
  const csv = [headers, ...rows]
    .map(row => row.map(csvEscape).join(','))
    .join('\r\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mvp-falcon-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

document.getElementById('loginForm')?.addEventListener('submit', function (e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    sessionStorage.setItem(SESSION_KEY, '1');
    errorEl.classList.add('hidden');
    window.location.href = 'dashboard.html';
  } else {
    errorEl.classList.remove('hidden');
  }
});

document.getElementById('searchInput')?.addEventListener('input', rerenderLeadsFromCache);

document.getElementById('closeLeadModal')?.addEventListener('click', closeLeadModal);

document.getElementById('leadModal')?.addEventListener('click', (event) => {
  if (event.target.id === 'leadModal') closeLeadModal();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeLeadModal();
    closeSidebar();
  }
});

function toggleSidebar(force) {
  const sidebar = document.getElementById('sidebarNav');
  const backdrop = document.getElementById('sidebarBackdrop');
  const toggleButton = document.getElementById('sidebarToggle');
  const shouldOpen = typeof force === 'boolean' ? force : sidebar?.classList.contains('hidden');

  if (!sidebar || !backdrop) return;

  sidebar.classList.toggle('hidden', !shouldOpen);
  backdrop.classList.toggle('hidden', !shouldOpen);
  document.body.classList.toggle('overflow-hidden', shouldOpen && window.innerWidth < 768);
  toggleButton?.setAttribute('aria-expanded', String(shouldOpen));
}

function closeSidebar() {
  toggleSidebar(false);
}

document.getElementById('sidebarToggle')?.addEventListener('click', () => {
  toggleSidebar();
});

document.getElementById('sidebarClose')?.addEventListener('click', closeSidebar);
document.getElementById('sidebarBackdrop')?.addEventListener('click', closeSidebar);

document.querySelectorAll('#sidebarNav a, #sidebarNav button[data-view]').forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth < 768) closeSidebar();
  });
});

window.addEventListener('resize', () => {
  if (window.innerWidth >= 768) {
    closeSidebar();
  }
});

document.querySelectorAll('[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    currentView = btn.dataset.view;
    document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const titles = { all: 'Overview', applications: 'Applications', quotes: 'Quotes', inquiries: 'Inquiries' };
    document.getElementById('viewTitle').textContent = titles[currentView] || 'Overview';
    rerenderLeadsFromCache();
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const dashboardScreen = document.getElementById('dashboardScreen');

  if (loginForm) {
    if (sessionStorage.getItem(SESSION_KEY)) {
      window.location.href = 'dashboard.html';
    }
    return;
  }

  if (dashboardScreen) {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      window.location.href = 'loginForm.html';
      return;
    }
    if (document.getElementById('submissionsLineChart')) {
      renderDashboardAnalytics();
    } else if (document.getElementById('leadsTableBody')) {
      renderLeads();
    }
  }
});

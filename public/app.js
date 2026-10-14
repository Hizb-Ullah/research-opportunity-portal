// Frontend logic: all data comes from the REST API (no hard-coded data).
const API = '/api/opportunities';

let opportunities = [];
let pendingDeleteId = null;

const $ = (id) => document.getElementById(id);
const detailsModal = new bootstrap.Modal($('detailsModal'));
const formModal = new bootstrap.Modal($('formModal'));
const deleteModal = new bootstrap.Modal($('deleteModal'));
const renewModal = new bootstrap.Modal($('renewModal'));

const FIELDS = ['title', 'description', 'research_area', 'faculty_name', 'department', 'required_skills', 'positions', 'deadline', 'status'];

// ---------- helpers ----------
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function showAlert(message, type = 'success') {
  $('alertBox').innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${escapeHtml(message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => { $('alertBox').innerHTML = ''; }, 6000);
}

async function api(url, options = {}) {
  let res;
  try {
    res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  } catch (e) {
    throw new Error('Cannot reach the server. Is the backend running?');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data.errors ? ': ' + data.errors.join(', ') : '';
    throw new Error((data.message || `Request failed (${res.status})`) + detail);
  }
  return data;
}

const badge = (status) =>
  `<span class="badge ${status === 'Open' ? 'text-bg-success' : 'text-bg-secondary'}">${escapeHtml(status)}</span>`;

// ---------- list ----------
async function loadOpportunities() {
  try {
    opportunities = await api(API);
    renderTable();
  } catch (e) {
    showAlert(e.message, 'danger');
  }
}

function renderTable() {
  const q = $('searchBox').value.toLowerCase().trim();
  const st = $('statusFilter').value;
  const list = opportunities.filter((o) => {
    const text = [o.title, o.research_area, o.faculty_name, o.required_skills].join(' ').toLowerCase();
    return (!q || text.includes(q)) && (!st || o.status === st);
  });

  $('emptyMsg').classList.toggle('d-none', list.length > 0);
  $('tableBody').innerHTML = list
    .map(
      (o) => `
    <tr>
      <td>${escapeHtml(o.title)}</td>
      <td>${escapeHtml(o.research_area)}</td>
      <td>${escapeHtml(o.faculty_name)}</td>
      <td>${o.positions}</td>
      <td>${escapeHtml(o.deadline)}</td>
      <td>${badge(o.status)}</td>
      <td class="text-end text-nowrap">
        <button class="btn btn-sm btn-outline-primary" data-action="view" data-id="${o.id}">View</button>
        <button class="btn btn-sm btn-outline-secondary" data-action="edit" data-id="${o.id}">Edit</button>
        ${o.status === 'Open'
          ? `<button class="btn btn-sm btn-outline-warning" data-action="close" data-id="${o.id}">Close</button>`
          : `<button class="btn btn-sm btn-outline-success" data-action="renew" data-id="${o.id}">Renew</button>`}
        <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${o.id}">Delete</button>
      </td>
    </tr>`
    )
    .join('');
}

// ---------- details ----------
async function viewOpportunity(id) {
  try {
    const o = await api(`${API}/${id}`); // fetched from the API by ID
    $('detailsTitle').textContent = o.title;
    const row = (label, value) =>
      `<div class="detail-label">${label}</div><div class="detail-value">${escapeHtml(value)}</div>`;
    $('detailsBody').innerHTML = `
      <div class="mb-3">${badge(o.status)}</div>
      ${row('Description', o.description)}
      <div class="row">
        <div class="col-md-6">${row('Research area', o.research_area)}${row('Faculty member', o.faculty_name)}${row('Department', o.department)}</div>
        <div class="col-md-6">${row('Required skills', o.required_skills)}${row('Available positions', o.positions)}${row('Application deadline', o.deadline)}</div>
      </div>`;
    detailsModal.show();
  } catch (e) {
    showAlert(e.message, 'danger');
    loadOpportunities();
  }
}

// ---------- create / edit ----------
function openForm(o = null) {
  const form = $('oppForm');
  form.classList.remove('was-validated');
  form.reset();
  $('oppId').value = o ? o.id : '';
  $('formTitle').textContent = o ? 'Edit Opportunity' : 'New Opportunity';
  FIELDS.forEach((f) => { $(f).value = o ? o[f] : ''; });
  if (!o) $('status').value = 'Open';
  formModal.show();
}

$('oppForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }
  const payload = {};
  FIELDS.forEach((f) => { payload[f] = $(f).value.trim(); });
  payload.positions = Number(payload.positions);

  const id = $('oppId').value;
  $('btnSave').disabled = true;
  try {
    await api(id ? `${API}/${id}` : API, { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    formModal.hide();
    showAlert(id ? 'Opportunity updated successfully.' : 'Opportunity created successfully.');
    loadOpportunities();
  } catch (err) {
    showAlert(err.message, 'danger');
  } finally {
    $('btnSave').disabled = false;
  }
});

// ---------- close ----------
async function closeOpportunity(id) {
  try {
    await api(`${API}/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'Closed' }) });
    showAlert('Opportunity marked as Closed.');
    loadOpportunities();
  } catch (e) {
    showAlert(e.message, 'danger');
  }
}

// ---------- renew (reopen with a new deadline) ----------
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function openRenew(id) {
  const o = opportunities.find((x) => x.id === id);
  if (!o) return;
  $('renewForm').classList.remove('was-validated');
  $('renewId').value = id;
  $('renewName').textContent = o.title;
  $('renewDeadline').min = todayStr();
  $('renewDeadline').value = '';
  renewModal.show();
}

$('renewForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const deadline = $('renewDeadline').value;
  if (!deadline || deadline < todayStr()) {
    $('renewForm').classList.add('was-validated');
    $('renewDeadline').setCustomValidity('invalid');
    return;
  }
  $('renewDeadline').setCustomValidity('');
  $('btnRenew').disabled = true;
  try {
    await api(`${API}/${$('renewId').value}`, { method: 'PUT', body: JSON.stringify({ status: 'Open', deadline }) });
    renewModal.hide();
    showAlert('Opportunity renewed and reopened.');
    loadOpportunities();
  } catch (err) {
    showAlert(err.message, 'danger');
  } finally {
    $('btnRenew').disabled = false;
  }
});
$('renewDeadline').addEventListener('input', () => $('renewDeadline').setCustomValidity(''));

// ---------- delete ----------
function askDelete(id) {
  const o = opportunities.find((x) => x.id === id);
  pendingDeleteId = id;
  $('deleteName').textContent = o ? o.title : `#${id}`;
  deleteModal.show();
}

$('btnConfirmDelete').addEventListener('click', async () => {
  try {
    await api(`${API}/${pendingDeleteId}`, { method: 'DELETE' });
    showAlert('Opportunity deleted successfully.');
  } catch (e) {
    showAlert(e.message, 'danger');
  } finally {
    deleteModal.hide();
    pendingDeleteId = null;
    loadOpportunities();
  }
});

// ---------- events ----------
$('tableBody').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;
  if (action === 'view') viewOpportunity(id);
  if (action === 'edit') openForm(opportunities.find((o) => o.id === id));
  if (action === 'close') closeOpportunity(id);
  if (action === 'renew') openRenew(id);
  if (action === 'delete') askDelete(id);
});

$('btnNew').addEventListener('click', () => openForm());
$('searchBox').addEventListener('input', renderTable);
$('statusFilter').addEventListener('change', renderTable);

loadOpportunities();

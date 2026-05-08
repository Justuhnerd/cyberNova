// storage.js — CyberNova Analytics localStorage Data Layer
// Import this in every page that needs data access.
// No raw localStorage calls outside this file.

const DB = {
  TICKETS:  'cn_tickets',
  CONTENT:  'cn_content',
  AUDIT:    'cn_audit',
  SESSION:  'cn_session',
};

// ─── UTILITIES ───────────────────────────────────────────────────────────────

function _read(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function _write(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function _timestamp() {
  return new Date().toISOString();
}

function _id(prefix) {
  return `${prefix}_${Date.now()}`;
}

function _ticketId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const tickets = _read(DB.TICKETS);
  const seq = String(tickets.length + 1).padStart(4, '0');
  return `CNS-${date}-${seq}`;
}


// ─── TICKETS ─────────────────────────────────────────────────────────────────

function getTickets() {
  return _read(DB.TICKETS);
}

function addTicket(data) {
  const tickets = _read(DB.TICKETS);
  const ticket = {
    id:          _ticketId(),
    name:        data.name        || '',
    email:       data.email       || '',
    phone:       data.phone       || '',
    org:         data.org         || '',
    country:     data.country     || '',
    jobTitle:    data.jobTitle    || '',
    threatType:  data.threatType  || '',
    description: data.description || '',
    status:      'new',
    priority:    data.priority    || 'medium',
    createdAt:   _timestamp(),
  };
  tickets.push(ticket);
  _write(DB.TICKETS, tickets);
  return ticket;
}

function updateTicketStatus(id, status) {
  const tickets = _read(DB.TICKETS);
  const index = tickets.findIndex(t => t.id === id);
  if (index === -1) return null;
  tickets[index].status = status;
  tickets[index].updatedAt = _timestamp();
  _write(DB.TICKETS, tickets);
  return tickets[index];
}

function filterTickets({ threatType, country, status, keyword, dateFrom, dateTo } = {}) {
  let tickets = _read(DB.TICKETS);

  if (threatType) tickets = tickets.filter(t => t.threatType === threatType);
  if (country)    tickets = tickets.filter(t => t.country === country);
  if (status)     tickets = tickets.filter(t => t.status === status);
  if (dateFrom)   tickets = tickets.filter(t => t.createdAt >= dateFrom);
  if (dateTo)     tickets = tickets.filter(t => t.createdAt <= dateTo + 'T23:59:59Z');

  if (keyword) {
    const kw = keyword.toLowerCase();
    tickets = tickets.filter(t =>
      t.name.toLowerCase().includes(kw)        ||
      t.org.toLowerCase().includes(kw)         ||
      t.description.toLowerCase().includes(kw) ||
      t.id.toLowerCase().includes(kw)
    );
  }

  return tickets;
}


// ─── CONTENT ─────────────────────────────────────────────────────────────────

function getContent(type = null) {
  const all = _read(DB.CONTENT);
  return type ? all.filter(c => c.type === type) : all;
}

function addContent(data) {
  const all = _read(DB.CONTENT);
  const item = {
    id:        _id('content'),
    type:      data.type    || 'blog',
    title:     data.title   || '',
    body:      data.body    || '',
    meta:      data.meta    || {},
    status:    'published',
    createdAt: _timestamp(),
    updatedAt: _timestamp(),
  };
  all.push(item);
  _write(DB.CONTENT, all);

  // Pass actor if provided, otherwise fallback to 'admin'
  const actor = data.actor || 'admin';
  addAuditEntry({
    action: 'published',
    targetType: item.type,
    targetId: item.id,
    targetTitle: item.title,
    actor,                  // <-- now recorded
  });

  return item;
}

function updateContent(id, changes) {
  const all = _read(DB.CONTENT);
  const index = all.findIndex(c => c.id === id);
  if (index === -1) return null;

  const previous = { ...all[index] };
  all[index] = { ...all[index], ...changes, updatedAt: _timestamp() };
  _write(DB.CONTENT, all);

  const actor = changes.actor || 'admin';
  addAuditEntry({
    action:      'edited',
    targetType:  all[index].type,
    targetId:    id,
    targetTitle: all[index].title,
    actor,                  // <-- now recorded
    previous,
  });

  return all[index];
}

function archiveContent(id, actor = 'admin') {   // accept actor
  const all = _read(DB.CONTENT);
  const index = all.findIndex(c => c.id === id);
  if (index === -1) return null;

  all[index].status    = 'archived';
  all[index].updatedAt = _timestamp();
  _write(DB.CONTENT, all);

  addAuditEntry({
    action:      'archived',
    targetType:  all[index].type,
    targetId:    id,
    targetTitle: all[index].title,
    actor,                  // <-- now recorded
  });

  return all[index];
}

// Undo: restore last archived item of any type (NFR-03)
function undoLastArchive(actor = 'admin') {     // accept actor
  const audit = _read(DB.AUDIT);
  const lastArchive = [...audit].reverse().find(e => e.action === 'archived');
  if (!lastArchive) return null;

  const all = _read(DB.CONTENT);
  const index = all.findIndex(c => c.id === lastArchive.targetId);
  if (index === -1) return null;

  all[index].status    = 'published';
  all[index].updatedAt = _timestamp();
  _write(DB.CONTENT, all);

  addAuditEntry({
    action:      'restored',
    targetType:  all[index].type,
    targetId:    all[index].id,
    targetTitle: all[index].title,
    actor,                  // <-- now recorded
  });

  return all[index];
}


// ─── AUDIT TRAIL ─────────────────────────────────────────────────────────────

function getAudit() {
  return _read(DB.AUDIT);
}

function addAuditEntry({ action, targetType, targetId, targetTitle, previous = null, actor = 'admin' }) {
  const audit = _read(DB.AUDIT);
  const entry = {
    id:          _id('audit'),
    actor,                // <-- now uses the passed-in actor (or default 'admin')
    action,               // published | edited | archived | restored
    targetType,           // case-study | blog | testimonial | gallery
    targetId,
    targetTitle,
    previous,             // snapshot before edit, for undo reference
    timestamp:   _timestamp(),
  };
  audit.push(entry);
  _write(DB.AUDIT, audit);
  return entry;
}


// ─── SESSION ─────────────────────────────────────────────────────────────────

function setSession(active) {
  localStorage.setItem(DB.SESSION, JSON.stringify({ active, timestamp: _timestamp() }));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(DB.SESSION)) || { active: false };
  } catch {
    return { active: false };
  }
}

function clearSession() {
  localStorage.removeItem(DB.SESSION);
}


// ─── SEED DATA (call once to populate demo content) ──────────────────────────

function seedIfEmpty() {
  if (_read(DB.TICKETS).length > 0) return; // already seeded

  // Seed tickets
  ['Ransomware', 'Phishing', 'DDoS'].forEach((threat, i) => {
    addTicket({
      name: ['Sipho Dlamini', 'Amara Mensah', 'Fatima Nkosi'][i],
      email: `contact${i+1}@example.co.za`,
      phone: '+27 82 000 000' + i,
      org: ['ZimFinance MFI', 'Cape Town Metro', 'Durban Logistics Ltd'][i],
      country: ['Zimbabwe', 'South Africa', 'South Africa'][i],
      jobTitle: ['IT Manager', 'Security Officer', 'CTO'][i],
      threatType: threat,
      description: `Urgent: ${threat} incident requiring immediate response.`,
      priority: ['high', 'medium', 'high'][i],
    });
  });

  // Seed content
  addContent({
    type: 'case-study',
    title: 'SOC Implementation for ZimFinance MFI',
    body: 'CyberNova deployed a full Security Operations Centre for a Zimbabwean microfinance institution, reducing incident response time by 60%.',
    meta: { industry: 'Finance', threatType: 'Ransomware' },
  });

  addContent({
    type: 'blog',
    title: 'Understanding Ransomware in the African Context',
    body: 'Ransomware attacks targeting African SMEs have increased 300% since 2022. This article explores the threat landscape and mitigation strategies.',
    meta: { category: 'Threat Intelligence' },
  });

  addContent({
    type: 'testimonial',
    title: 'Cape Town Municipality',
    body: 'CyberNova\'s phishing simulation exposed critical gaps in our staff awareness. Their team was professional and their recommendations actionable.',
    meta: { rating: 5, org: 'Cape Town Municipality', author: 'Thabo Khumalo' },
  });
}


// ─── EXPORTS ─────────────────────────────────────────────────────────────────

window.CyberNovaDB = {
  // Tickets
  getTickets,
  addTicket,
  updateTicketStatus,
  filterTickets,
  // Content
  getContent,
  addContent,
  updateContent,
  archiveContent,
  undoLastArchive,
  // Audit
  getAudit,
  addAuditEntry,
  // Session
  setSession,
  getSession,
  clearSession,
  // Setup
  seedIfEmpty,
};
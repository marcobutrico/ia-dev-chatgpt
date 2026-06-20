const STORAGE_KEY = "serviceDeskTickets";

const seedTickets = [
  {
    id: 1001,
    requester: "Marina Costa",
    email: "marina.costa@empresa.com",
    category: "Acesso",
    priority: "Alta",
    status: "Aberto",
    title: "Senha expirada no sistema de vendas",
    description: "Ao tentar entrar no sistema de vendas, recebo a mensagem de senha expirada e não consigo redefinir pelo portal.",
    correction: "",
    createdAt: "2026-06-18T11:20:00.000Z",
    updatedAt: "2026-06-18T11:20:00.000Z",
    events: [
      "Chamado aberto por Marina Costa."
    ]
  },
  {
    id: 1002,
    requester: "Rafael Lima",
    email: "rafael.lima@empresa.com",
    category: "Hardware",
    priority: "Média",
    status: "Em atendimento",
    title: "Notebook reiniciando sozinho",
    description: "O notebook reinicia durante reuniões e apresentações. Isso ocorreu quatro vezes nesta semana.",
    correction: "Equipamento em análise para troca preventiva de memória.",
    createdAt: "2026-06-17T14:40:00.000Z",
    updatedAt: "2026-06-18T09:15:00.000Z",
    events: [
      "Chamado aberto por Rafael Lima.",
      "Status alterado para Em atendimento."
    ]
  }
];

let tickets = loadTickets();
let selectedTicketId = tickets[0]?.id ?? null;

const views = document.querySelectorAll(".view");
const tabs = document.querySelectorAll(".tab");
const ticketForm = document.querySelector("#ticketForm");
const ticketList = document.querySelector("#ticketList");
const ticketDetails = document.querySelector("#ticketDetails");
const ticketCounter = document.querySelector("#ticketCounter");
const historyTable = document.querySelector("#historyTable");
const searchInput = document.querySelector("#searchInput");
const categoryFilter = document.querySelector("#categoryFilter");
const clearFilters = document.querySelector("#clearFilters");
const historySearchInput = document.querySelector("#historySearchInput");
const historyCategoryFilter = document.querySelector("#historyCategoryFilter");
const historyStatusFilter = document.querySelector("#historyStatusFilter");
const historyPriorityFilter = document.querySelector("#historyPriorityFilter");
const clearHistoryFilters = document.querySelector("#clearHistoryFilters");
const dashboardKpis = document.querySelector("#dashboardKpis");
const dashboardCategoryChart = document.querySelector("#dashboardCategoryChart");
const dashboardCategoryCards = document.querySelector("#dashboardCategoryCards");
const clearData = document.querySelector("#clearData");
const toast = document.querySelector("#toast");

let historySortField = "id";
let historySortOrder = "asc";

document.querySelector("#requester").addEventListener("input", () => {
  document.querySelector("#requester").setCustomValidity("");
});

document.querySelector("#email").addEventListener("input", () => {
  document.querySelector("#email").setCustomValidity("");
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((item) => item.classList.remove("is-active"));
    views.forEach((view) => view.classList.remove("is-active"));
    tab.classList.add("is-active");
    document.querySelector(`#${tab.dataset.view}`).classList.add("is-active");
    render();
  });
});

ticketForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const requesterField = document.querySelector("#requester");
  const requesterValue = requesterField.value.trim();
  const emailField = document.querySelector("#email");
  const emailValue = emailField.value.trim();
  const fullEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  requesterField.setCustomValidity("");
  emailField.setCustomValidity("");

  if (requesterValue.length < 5) {
    requesterField.setCustomValidity("Digite pelo menos 5 caracteres no nome do solicitante.");
    requesterField.reportValidity();
    return;
  }

  requesterField.setCustomValidity("");

  if (!fullEmailPattern.test(emailValue)) {
    emailField.setCustomValidity("Digite um e-mail completo, como nome@empresa.com.");
    emailField.reportValidity();
    return;
  }

  emailField.setCustomValidity("");

  const formTicket = {
    id: nextId(),
    requester: requesterValue,
    email: emailValue,
    category: document.querySelector("#category").value,
    priority: document.querySelector("#priority").value,
    status: "Aberto",
    title: document.querySelector("#title").value.trim(),
    description: document.querySelector("#description").value.trim(),
    correction: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    events: [
      `Chamado aberto por ${requesterValue}.`
    ]
  };

  tickets.unshift(formTicket);
  selectedTicketId = formTicket.id;
  saveTickets();
  ticketForm.reset();
  showToast(`Chamado #${formTicket.id} aberto com sucesso.`);
  render();
});

searchInput.addEventListener("input", renderTicketList);
categoryFilter.addEventListener("change", renderTicketList);
clearFilters.addEventListener("click", resetAnalystFilters);
historySearchInput.addEventListener("input", renderHistory);
historyCategoryFilter.addEventListener("change", renderHistory);
historyStatusFilter.addEventListener("change", renderHistory);
historyPriorityFilter.addEventListener("change", renderHistory);
clearHistoryFilters.addEventListener("click", resetHistoryFilters);

document.querySelectorAll(".sort-header").forEach((button) => {
  button.addEventListener("click", () => handleHistorySort(button.dataset.sortField));
});

clearData.addEventListener("click", () => {
  tickets = [];
  selectedTicketId = null;
  saveTickets();
  showToast("Base local limpa.");
  render();
});

function loadTickets() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedTickets));
    return [...seedTickets];
  }

  try {
    return JSON.parse(stored);
  } catch {
    return [...seedTickets];
  }
}

function saveTickets() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function nextId() {
  const currentMaxId = tickets.length
    ? Math.max(...tickets.map((ticket) => ticket.id))
    : 1000;

  return currentMaxId + 1;
}

function render() {
  renderTicketList();
  renderTicketDetails();
  renderHistory();
  renderDashboard();
}

function renderTicketList() {
  const term = searchInput.value.trim().toLowerCase();
  const selectedCategory = categoryFilter.value;
  const filteredTickets = tickets.filter((ticket) => {
    const matchesTerm = matchesSearchTerm(ticket, term);
    const matchesCategory = !selectedCategory || ticket.category === selectedCategory;
    const isOpenTicket = ticket.status !== "Resolvido";

    return matchesTerm && matchesCategory && isOpenTicket;
  });

  if (!filteredTickets.some((ticket) => ticket.id === selectedTicketId)) {
    selectedTicketId = filteredTickets[0]?.id ?? null;
  }

  ticketCounter.textContent = `${filteredTickets.length} chamado${filteredTickets.length === 1 ? "" : "s"}`;

  if (filteredTickets.length === 0) {
    ticketList.innerHTML = '<div class="empty-state"><p>Nenhum chamado encontrado.</p></div>';
    return;
  }

  ticketList.innerHTML = filteredTickets.map((ticket) => `
    <button class="ticket-card ${ticket.id === selectedTicketId ? "is-selected" : ""}" data-ticket-id="${ticket.id}">
      <span class="ticket-title">#${ticket.id} - ${escapeHtml(ticket.title)}</span>
      <span class="ticket-meta">${escapeHtml(ticket.requester)} • ${formatDate(ticket.updatedAt)}</span>
      <span class="badge-row">
        ${renderBadge(ticket.status, statusClass(ticket.status), statusIcon(ticket.status))}
        ${renderBadge(ticket.priority, priorityClass(ticket.priority), priorityIcon(ticket.priority))}
      </span>
    </button>
  `).join("");

  document.querySelectorAll(".ticket-card").forEach((card) => {
    card.addEventListener("click", () => {
      selectedTicketId = Number(card.dataset.ticketId);
      renderTicketList();
      renderTicketDetails();
    });
  });
}

function resetAnalystFilters() {
  searchInput.value = "";
  categoryFilter.value = "";
  renderTicketList();
}

function resetHistoryFilters() {
  historySearchInput.value = "";
  historyCategoryFilter.value = "";
  historyStatusFilter.value = "";
  historyPriorityFilter.value = "";
  historySortField = "id";
  historySortOrder = "asc";
  updateHistorySortHeaders();
  renderHistory();
}

function handleHistorySort(sortField) {
  if (historySortField === sortField) {
    historySortOrder = historySortOrder === "asc" ? "desc" : "asc";
  } else {
    historySortField = sortField;
    historySortOrder = sortField === "id" ? "asc" : "asc";
  }

  updateHistorySortHeaders();
  renderHistory();
}

function renderTicketDetails() {
  const ticket = tickets.find((item) => item.id === selectedTicketId);

  if (!ticket) {
    ticketDetails.innerHTML = `
      <div class="empty-state">
        <h3>Selecione um chamado</h3>
        <p>Ao escolher um item da fila, os campos de status, prioridade e correção aparecem aqui.</p>
      </div>
    `;
    return;
  }

  ticketDetails.innerHTML = `
    <div class="details-header">
      <div>
        <p class="eyebrow">Chamado #${ticket.id}</p>
        <h3>${escapeHtml(ticket.title)}</h3>
        <p class="ticket-meta">Aberto por ${escapeHtml(ticket.requester)} em ${formatDate(ticket.createdAt)}</p>
      </div>
      ${renderBadge(ticket.status, statusClass(ticket.status), statusIcon(ticket.status))}
    </div>

    <div class="details-grid">
      <label>
        Status
        <select id="detailStatus">
          <option ${ticket.status === "Aberto" ? "selected" : ""}>Aberto</option>
          <option ${ticket.status === "Em atendimento" ? "selected" : ""}>Em atendimento</option>
          <option ${ticket.status === "Aguardando usuário" ? "selected" : ""}>Aguardando usuário</option>
          <option ${ticket.status === "Resolvido" ? "selected" : ""}>Resolvido</option>
        </select>
      </label>
      <label>
        Prioridade
        <select id="detailPriority">
          <option ${ticket.priority === "Baixa" ? "selected" : ""}>Baixa</option>
          <option ${ticket.priority === "Média" ? "selected" : ""}>Média</option>
          <option ${ticket.priority === "Alta" ? "selected" : ""}>Alta</option>
          <option ${ticket.priority === "Crítica" ? "selected" : ""}>Crítica</option>
        </select>
      </label>
    </div>

    <label>
      Descrever correção
      <textarea id="detailCorrection" rows="5" placeholder="Informe a solução aplicada ou próxima ação.">${escapeHtml(ticket.correction)}</textarea>
    </label>

    <div class="description-box">
      <strong>Descrição do usuário</strong>
      <p>${escapeHtml(ticket.description)}</p>
      <p class="ticket-meta">${escapeHtml(ticket.category)} • ${escapeHtml(ticket.email)}</p>
    </div>

    <div class="form-actions">
      <button class="primary" id="saveTicket">Salvar alterações</button>
    </div>

    <div class="history-box">
      <strong>Histórico deste chamado</strong>
      <ul>
        ${ticket.events.map((event) => `<li class="history-line">${escapeHtml(event)}</li>`).join("")}
      </ul>
    </div>
  `;

  document.querySelector("#saveTicket").addEventListener("click", () => updateSelectedTicket(ticket.id));
}

function updateSelectedTicket(ticketId) {
  const ticket = tickets.find((item) => item.id === ticketId);
  if (!ticket) return;

  const newStatus = document.querySelector("#detailStatus").value;
  const newPriority = document.querySelector("#detailPriority").value;
  const newCorrection = document.querySelector("#detailCorrection").value.trim();
  const eventList = [];

  if (ticket.status !== newStatus) {
    eventList.push(`Status alterado de ${ticket.status} para ${newStatus}.`);
  }

  if (ticket.priority !== newPriority) {
    eventList.push(`Prioridade alterada de ${ticket.priority} para ${newPriority}.`);
  }

  if (ticket.correction !== newCorrection && newCorrection) {
    eventList.push(`Correção registrada: ${newCorrection}`);
  }

  ticket.status = newStatus;
  ticket.priority = newPriority;
  ticket.correction = newCorrection;
  ticket.updatedAt = new Date().toISOString();
  ticket.events = ticket.events.concat(eventList);

  saveTickets();
  showToast(`Chamado #${ticket.id} atualizado.`);
  render();
}

function renderHistory() {
  updateHistorySortHeaders();

  const term = historySearchInput.value.trim().toLowerCase();
  const selectedCategory = historyCategoryFilter.value;
  const selectedStatus = historyStatusFilter.value;
  const selectedPriority = historyPriorityFilter.value;
  const filteredTickets = tickets.filter((ticket) => {
    return (
      matchesSearchTerm(ticket, term) &&
      (!selectedCategory || ticket.category === selectedCategory) &&
      (!selectedStatus || ticket.status === selectedStatus) &&
      (!selectedPriority || ticket.priority === selectedPriority)
    );
  }).sort((firstTicket, secondTicket) => compareTickets(firstTicket, secondTicket, historySortField, historySortOrder));

  historyTable.innerHTML = filteredTickets.map((ticket) => `
    <tr>
      <td>#${ticket.id}</td>
      <td>${escapeHtml(ticket.title)}</td>
      <td>${escapeHtml(ticket.requester)}</td>
      <td>${renderBadge(ticket.status, statusClass(ticket.status), statusIcon(ticket.status))}</td>
      <td>${renderBadge(ticket.priority, priorityClass(ticket.priority), priorityIcon(ticket.priority))}</td>
      <td>${formatDate(ticket.updatedAt)}</td>
      <td>${renderReopenAction(ticket)}</td>
    </tr>
  `).join("");

  document.querySelectorAll(".reopen-ticket").forEach((button) => {
    button.addEventListener("click", () => reopenTicket(Number(button.dataset.ticketId)));
  });
}

function updateHistorySortHeaders() {
  document.querySelectorAll(".sort-header").forEach((button) => {
    const isActive = button.dataset.sortField === historySortField;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-sort", isActive ? (historySortOrder === "asc" ? "ascending" : "descending") : "none");
    button.textContent = `${sortHeaderLabel(button.dataset.sortField)}${isActive ? historySortOrder === "asc" ? " ▲" : " ▼" : ""}`;
  });
}

function sortHeaderLabel(sortField) {
  const labels = {
    id: "ID",
    title: "Título",
    requester: "Solicitante",
    updatedAt: "Atualizado em"
  };

  return labels[sortField] ?? sortField;
}

function compareTickets(firstTicket, secondTicket, sortField, sortOrder) {
  const direction = sortOrder === "desc" ? -1 : 1;

  if (sortField === "id") {
    return direction * (firstTicket.id - secondTicket.id);
  }

  const firstValue = String(firstTicket[sortField] ?? "").toLowerCase();
  const secondValue = String(secondTicket[sortField] ?? "").toLowerCase();

  return direction * firstValue.localeCompare(secondValue, "pt-BR", { sensitivity: "base" });
}

function renderDashboard() {
  const dashboardData = buildDashboardData();

  dashboardKpis.innerHTML = [
    {
      label: "Total de chamados",
      value: dashboardData.totalTickets,
      hint: `${dashboardData.openTickets} em aberto`
    },
    {
      label: "Taxa de resolução",
      value: `${dashboardData.resolutionRate}%`,
      hint: `${dashboardData.resolvedTickets} chamados resolvidos`
    },
    {
      label: "Tempo médio",
      value: `${dashboardData.averageAgeHours}h`,
      hint: "Tempo médio desde a abertura"
    },
    {
      label: "Performance geral",
      value: `${dashboardData.overallScore}%`,
      hint: "Média ponderada por categoria"
    }
  ].map((item) => `
    <article class="kpi-card">
      <p>${escapeHtml(item.label)}</p>
      <strong>${escapeHtml(String(item.value))}</strong>
      <span>${escapeHtml(item.hint)}</span>
    </article>
  `).join("");

  dashboardCategoryChart.innerHTML = dashboardData.categories.map((category) => `
    <article class="category-bar-card">
      <div class="category-bar-head">
        <div>
          <strong>${escapeHtml(category.name)}</strong>
          <p>${category.total} chamados · ${category.resolved} resolvidos</p>
        </div>
        <span class="category-score ${scoreClass(category.score)}">${category.score}%</span>
      </div>
      <div class="bar-track" aria-hidden="true">
        <div class="bar-fill" style="width: ${category.score}%"></div>
      </div>
      <div class="category-bar-foot">
        <span>${category.backlog} em fila</span>
        <span>${category.avgAgeHours}h médio</span>
      </div>
    </article>
  `).join("");

  dashboardCategoryCards.innerHTML = dashboardData.categories.map((category) => `
    <article class="team-card">
      <div class="team-card-head">
        <div>
          <p class="eyebrow">${escapeHtml(category.name)}</p>
          <h4>${escapeHtml(category.owner)}</h4>
        </div>
        <span class="team-score ${scoreClass(category.score)}">${category.score}%</span>
      </div>
      <p class="team-summary">${category.total} chamados no período, com ${category.resolved} resolvidos e ${category.backlog} ainda em atendimento.</p>
      <ul class="team-metrics">
        <li><strong>${category.resolutionRate}%</strong><span>resolução</span></li>
        <li><strong>${category.avgAgeHours}h</strong><span>tempo médio</span></li>
        <li><strong>${category.openTickets}</strong><span>abertos</span></li>
      </ul>
    </article>
  `).join("");
}

function buildDashboardData() {
  const categories = ["Hardware", "Software", "Rede", "Acesso", "Outro"];
  const owners = {
    Hardware: "Equipe de Infraestrutura",
    Software: "Equipe de Sistemas",
    Rede: "Equipe de Conectividade",
    Acesso: "Equipe de Identidade",
    Outro: "Equipe de Triagem"
  };

  const categoryStats = categories.map((name) => {
    const groupTickets = tickets.filter((ticket) => ticket.category === name);
    const resolvedTickets = groupTickets.filter((ticket) => ticket.status === "Resolvido");
    const openTickets = groupTickets.filter((ticket) => ticket.status !== "Resolvido");
    const avgAgeHours = groupTickets.length
      ? Math.round(groupTickets.reduce((sum, ticket) => sum + hoursBetween(ticket.createdAt, ticket.updatedAt), 0) / groupTickets.length)
      : 0;
    const resolutionRate = groupTickets.length ? Math.round((resolvedTickets.length / groupTickets.length) * 100) : 0;
    const backlogPenalty = Math.min(openTickets.length * 7, 35);
    const agePenalty = Math.min(avgAgeHours, 35);
    const score = Math.max(0, Math.min(100, Math.round(resolutionRate * 0.7 + (100 - backlogPenalty - agePenalty) * 0.3)));

    return {
      name,
      owner: owners[name],
      total: groupTickets.length,
      resolved: resolvedTickets.length,
      openTickets: openTickets.length,
      backlog: openTickets.length,
      avgAgeHours,
      resolutionRate,
      score
    };
  });

  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter((ticket) => ticket.status === "Resolvido").length;
  const openTickets = totalTickets - resolvedTickets;
  const averageAgeHours = totalTickets
    ? Math.round(tickets.reduce((sum, ticket) => sum + hoursBetween(ticket.createdAt, ticket.updatedAt), 0) / totalTickets)
    : 0;
  const resolutionRate = totalTickets ? Math.round((resolvedTickets / totalTickets) * 100) : 0;
  const overallScore = categoryStats.length
    ? Math.round(categoryStats.reduce((sum, category) => sum + category.score, 0) / categoryStats.length)
    : 0;

  return {
    totalTickets,
    resolvedTickets,
    openTickets,
    averageAgeHours,
    resolutionRate,
    overallScore,
    categories: categoryStats
  };
}

function hoursBetween(start, end) {
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 36e5));
}

function scoreClass(score) {
  if (score >= 80) {
    return "score-good";
  }

  if (score >= 60) {
    return "score-warning";
  }

  return "score-bad";
}

function matchesSearchTerm(ticket, term) {
  return (
    String(ticket.id).includes(term) ||
    ticket.title.toLowerCase().includes(term) ||
    ticket.requester.toLowerCase().includes(term) ||
    ticket.email.toLowerCase().includes(term)
  );
}

function renderReopenAction(ticket) {
  if (ticket.status !== "Resolvido") {
    return '<span class="muted-action">-</span>';
  }

  return `<button class="table-action reopen-ticket" type="button" data-ticket-id="${ticket.id}">Reabrir</button>`;
}

function reopenTicket(ticketId) {
  const ticket = tickets.find((item) => item.id === ticketId);
  if (!ticket || ticket.status !== "Resolvido") return;

  ticket.status = "Aberto";
  ticket.updatedAt = new Date().toISOString();
  ticket.events = ticket.events.concat("Chamado reaberto a partir do histórico.");
  selectedTicketId = ticket.id;

  saveTickets();
  showToast(`Chamado #${ticket.id} reaberto.`);
  render();
}

function renderBadge(label, className, iconName) {
  return `
    <span class="badge ${className}">
      ${iconSvg(iconName)}
      <span>${escapeHtml(label)}</span>
    </span>
  `;
}

function statusIcon(status) {
  const icons = {
    "Aberto": "plus",
    "Em atendimento": "clock",
    "Aguardando usuário": "pause",
    "Resolvido": "check"
  };

  return icons[status] ?? "circle";
}

function priorityIcon(priority) {
  const icons = {
    "Baixa": "arrow-down",
    "Média": "minus",
    "Alta": "arrow-up",
    "Crítica": "alert"
  };

  return icons[priority] ?? "circle";
}

function iconSvg(name) {
  const icons = {
    "alert": '<path d="M12 4 3.5 19h17L12 4Z"></path><path d="M12 9v4"></path><path d="M12 16h.01"></path>',
    "arrow-down": '<path d="M12 5v14"></path><path d="m6 13 6 6 6-6"></path>',
    "arrow-up": '<path d="M12 19V5"></path><path d="m6 11 6-6 6 6"></path>',
    "check": '<path d="M20 6 9 17l-5-5"></path>',
    "circle": '<circle cx="12" cy="12" r="7"></circle>',
    "clock": '<circle cx="12" cy="12" r="8"></circle><path d="M12 7v5l3 2"></path>',
    "minus": '<path d="M5 12h14"></path>',
    "pause": '<path d="M8 5v14"></path><path d="M16 5v14"></path>',
    "plus": '<path d="M12 5v14"></path><path d="M5 12h14"></path>'
  };

  return `<svg class="badge-icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name] ?? icons.circle}</svg>`;
}

function statusClass(status) {
  return `status-${status.toLowerCase().replaceAll(" ", "-")}`;
}

function priorityClass(priority) {
  return `priority-${priority.toLowerCase()}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

render();

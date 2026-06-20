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
const clearData = document.querySelector("#clearData");
const toast = document.querySelector("#toast");

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

  const formTicket = {
    id: nextId(),
    requester: document.querySelector("#requester").value.trim(),
    email: document.querySelector("#email").value.trim(),
    category: document.querySelector("#category").value,
    priority: document.querySelector("#priority").value,
    status: "Aberto",
    title: document.querySelector("#title").value.trim(),
    description: document.querySelector("#description").value.trim(),
    correction: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    events: [
      `Chamado aberto por ${document.querySelector("#requester").value.trim()}.`
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
}

function renderTicketList() {
  const term = searchInput.value.trim().toLowerCase();
  const filteredTickets = tickets.filter((ticket) => {
    return (
      String(ticket.id).includes(term) ||
      ticket.title.toLowerCase().includes(term)
    );
  });

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
        <span class="badge ${statusClass(ticket.status)}">${ticket.status}</span>
        <span class="badge ${priorityClass(ticket.priority)}">${ticket.priority}</span>
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
      <span class="badge ${statusClass(ticket.status)}">${ticket.status}</span>
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

  showToast(`Chamado #${ticket.id} atualizado.`);
  render();
}

function renderHistory() {
  historyTable.innerHTML = tickets.map((ticket) => `
    <tr>
      <td>#${ticket.id}</td>
      <td>${escapeHtml(ticket.title)}</td>
      <td>${escapeHtml(ticket.requester)}</td>
      <td><span class="badge ${statusClass(ticket.status)}">${ticket.status}</span></td>
      <td><span class="badge ${priorityClass(ticket.priority)}">${ticket.priority}</span></td>
      <td>${formatDate(ticket.updatedAt)}</td>
    </tr>
  `).join("");
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

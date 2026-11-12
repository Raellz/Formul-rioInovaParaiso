import { db } from "./firebase-config.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { hasRankingAccess, isValidRankingLogin, grantRankingAccess } from "./ranking-access.js";
let allEvaluations = [];
let rankingListenerStarted = false;

const rankingBody = document.getElementById("rankingBody");
const rankingContent = document.getElementById("rankingContent");
const observationDialog = document.getElementById("observationDialog");
const observationTitle = document.getElementById("observationTitle");
const observationContent = document.getElementById("observationContent");
const loginDialog = document.getElementById("loginDialog");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

document.getElementById("closeObservationDialog").addEventListener("click", () => {
  observationDialog.close();
});

document.getElementById("closeLoginDialog").addEventListener("click", () => {
  window.location.replace("index.html");
});

loginDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loginError.hidden = true;
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!isValidRankingLogin(username, password)) {
    loginError.textContent = "Login ou senha inválidos. Tente novamente.";
    loginError.hidden = false;
    return;
  }

  try {
    grantRankingAccess();
    loginForm.reset();
    openRanking();
  } catch (err) {
    console.error("Não foi possível guardar o acesso ao ranking nesta sessão:", err);
    loginError.textContent = "Não foi possível continuar. Verifique as configurações do navegador.";
    loginError.hidden = false;
  }
});

function openRanking() {
  loginDialog.close();
  rankingContent.hidden = false;
  if (!rankingListenerStarted) startWatchingRanking();
}

try {
  if (hasRankingAccess()) {
    openRanking();
  } else {
    loginDialog.showModal();
  }
} catch (err) {
  console.error("Não foi possível verificar o acesso ao ranking nesta sessão:", err);
  loginDialog.showModal();
}

function startWatchingRanking() {
  rankingListenerStarted = true;
  onSnapshot(collection(db, "evaluations_paraiso"), (snapshot) => {
    allEvaluations = [];
    snapshot.forEach(doc => allEvaluations.push(doc.data()));
    renderRanking();
  }, (err) => {
    console.error("Erro ao carregar avaliações de Paraíso:", err);
    rankingBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Não foi possível carregar o ranking. Verifique sua conexão e as regras de acesso do Firebase.</td></tr>';
  });
}

function renderRanking() {
  // Soma as pontuações de cada startup
  const summary = {};

  allEvaluations.forEach((ev) => {
    const startupName = ev.startup || "Startup sem nome";
    if (!summary[startupName]) {
      summary[startupName] = {
        name: startupName,
        totalScoreSum: 0,
        evaluationsCount: 0,
        observations: []
      };
    }
    const score = Number(ev.totalScore) || ["c1", "c2", "c3", "c4", "c5", "c6", "c7"]
      .reduce((sum, criterion) => sum + (Number(ev[criterion]) || 0), 0);
    summary[startupName].totalScoreSum += score;
    summary[startupName].evaluationsCount += 1;

    const note = typeof ev.notes === "string" ? ev.notes.trim() : "";
    if (note) {
      summary[startupName].observations.push({
        evaluator: typeof ev.evaluator === "string" ? ev.evaluator.trim() : "",
        note
      });
    }
  });

  const ranked = Object.values(summary)
    .sort((a, b) => b.totalScoreSum - a.totalScoreSum);

  // Renderiza tabela
  rankingBody.innerHTML = "";

  if (ranked.length === 0) {
    rankingBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Nenhuma avaliação registrada.</td></tr>`;
    return;
  }

  ranked.forEach((item, idx) => {
    const tr = document.createElement("tr");
    const posClass = idx === 0 ? "pos-1" : idx === 1 ? "pos-2" : idx === 2 ? "pos-3" : "";

    const positionCell = document.createElement("td");
    positionCell.className = posClass;
    positionCell.textContent = `#${idx + 1}`;

    const nameCell = document.createElement("td");
    nameCell.className = "startup-name";
    nameCell.textContent = item.name;

    const evaluationsCell = document.createElement("td");
    evaluationsCell.textContent = item.evaluationsCount;

    const scoreCell = document.createElement("td");
    scoreCell.className = "ranking-total-score";
    scoreCell.textContent = `${item.totalScoreSum} pts`;

    const observationsCell = document.createElement("td");
    if (item.observations.length > 0) {
      const eyeButton = document.createElement("button");
      eyeButton.type = "button";
      eyeButton.className = "observation-button";
      eyeButton.setAttribute("aria-label", `Ver observações de ${item.name}`);
      eyeButton.title = "Ver observações";
      eyeButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      eyeButton.addEventListener("click", () => showObservations(item));
      observationsCell.appendChild(eyeButton);
    }

    tr.append(positionCell, nameCell, evaluationsCell, scoreCell, observationsCell);
    rankingBody.appendChild(tr);
  });
}

function showObservations(item) {
  observationTitle.textContent = `Observações — ${item.name}`;
  observationContent.replaceChildren();

  item.observations.forEach(({ evaluator, note }) => {
    const entry = document.createElement("article");
    entry.className = "observation-entry";

    if (evaluator) {
      const author = document.createElement("h3");
      author.textContent = evaluator;
      entry.appendChild(author);
    }

    const text = document.createElement("p");
    text.textContent = note;
    entry.appendChild(text);
    observationContent.appendChild(entry);
  });

  observationDialog.showModal();
}

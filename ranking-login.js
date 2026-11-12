import { grantRankingAccess, isValidRankingLogin } from "./ranking-access.js";

const loginDialog = document.getElementById("loginDialog");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

document.getElementById("openRankingLogin").addEventListener("click", () => {
  loginError.hidden = true;
  loginDialog.showModal();
  document.getElementById("loginUsername").focus();
});

document.getElementById("closeLoginDialog").addEventListener("click", () => {
  loginDialog.close();
  loginForm.reset();
  loginError.hidden = true;
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
    window.location.assign("ranking.html");
  } catch (err) {
    console.error("Não foi possível guardar o acesso ao ranking nesta sessão:", err);
    loginError.textContent = "Não foi possível continuar. Verifique as configurações do navegador.";
    loginError.hidden = false;
  }
});

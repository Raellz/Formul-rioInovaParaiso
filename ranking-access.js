const RANKING_LOGIN = "inova";
const RANKING_PASSWORD = "paraiso2026";
const RANKING_SESSION_KEY = "inovaParaisoRankingAccess";

export function isValidRankingLogin(username, password) {
  return username === RANKING_LOGIN && password === RANKING_PASSWORD;
}

export function hasRankingAccess() {
  return sessionStorage.getItem(RANKING_SESSION_KEY) === "true";
}

export function grantRankingAccess() {
  sessionStorage.setItem(RANKING_SESSION_KEY, "true");
}

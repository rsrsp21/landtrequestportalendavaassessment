function getRequests() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REQUESTS) || "[]");
  } catch (e) {
    return [];
  }
}

function saveRequests(reqs) {
  localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(reqs));
}

function saveCurrentUser(user) {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || "null");
  } catch (e) {
    return null;
  }
}

function clearCurrentUser() {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

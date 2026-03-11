/* Shared app state */
let USERS_DATA = [];
let TRAINERS_DATA = [];
let currentUser = null;
let pendingAction = null;

const PAGE = document.body?.dataset.page || "login";
const STORAGE_KEYS = {
  REQUESTS: "lt_requests",
  CURRENT_USER: "lt_current_user",
};

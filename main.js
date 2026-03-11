function initLoginPage() {
  const passEl = document.getElementById("loginPassword");
  if (passEl) {
    passEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleLogin();
    });
  }

  const existing = getCurrentUser();
  if (existing?.role === "user") {
    globalThis.location.href = "user.html";
    return;
  }
  if (existing?.role === "manager") {
    globalThis.location.href = "admin.html";
    return;
  }

  if (sessionStorage.getItem("lt_signed_out") === "1") {
    sessionStorage.removeItem("lt_signed_out");
    showToast("Signed out successfully", "info");
  }
}

function initUserPage() {
  if (!guardByRole("user", "admin.html")) return;
  openUserPortal();
}

function initAdminPage() {
  if (!guardByRole("manager", "user.html")) return;
  bindModalEvents();
  openManagerPortal();
}

function initApp() {
  Promise.all([loadUsersData(), loadTrainersData()]).then(() => {
    if (PAGE === "login") initLoginPage();
    if (PAGE === "user") initUserPage();
    if (PAGE === "admin") initAdminPage();
  });
}

initApp();

function getEl(id) {
  return document.getElementById(id);
}

function getInitials(name) {
  if (!name) return "";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("");
}

function statCard(icon, count, label, color) {
  const iconHtml = icon.includes(".")
    ? `<img src="${icon}" alt="" class="stat-icon-img" />`
    : `<span>${icon}</span>`;
  return `
    <div class="stat-card">
      <div class="stat-icon" style="background:${color}18;">${iconHtml}</div>
      <div class="stat-data">
        <h3 style="color:${color}">${count}</h3>
        <p>${label}</p>
      </div>
    </div>`;
}

function cap(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

function fmtDate(d) {
  if (!d) return "-";
  const parts = d.split("-");
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function fmtDateTime(iso) {
  if (!iso) return "-";
  const dt = new Date(iso);
  return `${dt.toLocaleDateString("en-GB")} ${dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

function showToast(msg, type = "info") {
  const c = getEl("toastContainer");
  if (!c) return;

  const t = document.createElement("div");
  t.className = `toast ${type}`;
  const icons = {
    success: "assets/icons/success.svg",
    error: "assets/icons/error.svg",
    info: "assets/icons/info.svg",
  };
  t.innerHTML = `<img src="${icons[type] || icons.info}" alt="" class="toast-icon" /> ${msg}`;
  c.appendChild(t);

  setTimeout(() => {
    t.style.opacity = "0";
    t.style.transform = "translateY(6px) scale(.95)";
    t.style.transition = "all .3s ease";
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

const TRAINING_TYPE_KEYWORDS = {
  "Soft Skills & Leadership": ["soft skills", "leadership", "communication", "public speaking"],
  "Agile & Scrum": ["agile", "scrum", "project management"],
  "Cloud & DevOps": ["cloud", "devops", "kubernetes", "architecture"],
  "Data & Analytics": ["data", "analysis", "machine learning", "visualization"],
  "Design & UX": ["design", "ux", "figma", "adobe", "brand"],
  "Compliance & Security": ["security", "compliance"],
};

function getTrainersForSelectedType() {
  const selectedType = getEl("trainingType")?.value || "";
  if (!selectedType) return [];

  const keywords = TRAINING_TYPE_KEYWORDS[selectedType] || [];
  return TRAINERS_DATA.filter((trainer) => {
    const profile = [...trainer.trainerExpertise, trainer.domain].join(" ").toLowerCase();
    return keywords.some((keyword) => profile.includes(keyword));
  });
}

function bindTrainingTypeFilter() {
  const trainingType = getEl("trainingType");
  if (!trainingType) return;
  trainingType.addEventListener("change", () => {
    renderTrainerList();
  });
}

function switchUserTab(tab, btn) {
  const tabs = document.querySelectorAll("#view-user .tab-btn");
  tabs.forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");

  const tabNew = document.getElementById("tab-new");
  const tabHistory = document.getElementById("tab-history");
  if (!tabNew || !tabHistory) return;

  const showHistory = tab === "history";
  tabNew.classList.toggle("tab-panel-hidden", showHistory);
  tabHistory.classList.toggle("tab-panel-hidden", !showHistory);

  if (showHistory) renderUserHistory();
}

function openUserPortal() {
  if (!currentUser) return;

  const avatar = getEl("userAvatar");
  const name = getEl("userDisplayName");
  const initials = getInitials(currentUser.displayName);

  if (avatar) avatar.textContent = initials;
  if (name) name.textContent = currentUser.displayName;

  bindTrainingTypeFilter();
  renderTrainerList();
  const firstTab = document.querySelector("#view-user .tab-btn");
  switchUserTab("new", firstTab);
}

function renderTrainerList() {
  const container = document.getElementById("trainerList");
  if (!container) return;
  if (!TRAINERS_DATA.length) {
    container.innerHTML =
      '<div class="empty-state"><p>Unable to load trainers. Please refresh and try again.</p></div>';
    return;
  }

  const selectedType = getEl("trainingType")?.value || "";
  if (!selectedType) {
    container.innerHTML =
      '<div class="empty-state"><p>Select a training type to view matching trainers.</p></div>';
    return;
  }

  const trainersToShow = getTrainersForSelectedType();
  if (!trainersToShow.length) {
    container.innerHTML =
      '<div class="empty-state"><p>No trainers match this training type.</p></div>';
    return;
  }

  container.innerHTML = "";
  trainersToShow.forEach((t) => {
    const div = document.createElement("div");
    div.className = "trainer-card";
    div.dataset.id = t.trainerId;
    div.innerHTML = `
      <input type="radio" name="trainerPick" value="${t.trainerId}" id="tr_${t.trainerId}" />
      <div class="trainer-info">
        <h4>${t.trainerName}</h4>
        <p>${t.trainerExpertise.join(" | ")} | ${t.domain}</p>
      </div>
      <span class="avail-badge ${t.trainerAvailability ? "avail" : "unavail"}">
        ${t.trainerAvailability ? "Available" : "Unavailable"}
      </span>
    `;

    div.onclick = () => {
      document.querySelectorAll(".trainer-card").forEach((c) => c.classList.remove("selected"));
      div.classList.add("selected");
      div.querySelector("input[type=radio]").checked = true;
    };

    container.appendChild(div);
  });
}

function clearForm() {
  const setVal = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  };

  setVal("trainingType", "");
  setVal("trainingTopic", "");
  setVal("expectedStartDate", "");
  setVal("expectedEndDate", "");
  setVal("trainingNotes", "");

  const medium = document.getElementById("pMedium");
  if (medium) medium.checked = true;

  document.querySelectorAll(".trainer-card").forEach((c) => {
    c.classList.remove("selected");
    c.classList.remove("trainer-card-dim");
  });

  document.querySelectorAll('input[name="trainerPick"]').forEach((r) => (r.checked = false));

  renderTrainerList();
}

function readRequestForm() {
  return {
    type: getEl("trainingType")?.value || "",
    topic: getEl("trainingTopic")?.value.trim() || "",
    startDate: getEl("expectedStartDate")?.value || "",
    endDate: getEl("expectedEndDate")?.value || "",
    priority: document.querySelector('input[name="priority"]:checked')?.value || "medium",
    trainerPick: document.querySelector('input[name="trainerPick"]:checked')?.value || null,
    notes: getEl("trainingNotes")?.value.trim() || "",
  };
}

function validateRequestForm(form) {
  if (!form.type) return "Please select a training type.";
  if (!form.topic) return "Please enter a training topic.";
  if (!form.startDate) return "Please select an expected start date.";
  if (!form.endDate) return "Please select an expected end date.";
  if (!form.trainerPick) return "Please select a trainer.";
  return "";
}

function buildRequest(form, reqs) {
  const trainer = form.trainerPick ? TRAINERS_DATA.find((t) => t.trainerId === form.trainerPick) : null;
  return {
    requestId: "REQ-" + String(reqs.length + 1).padStart(4, "0"),
    userId: currentUser.userId,
    userName: currentUser.displayName,
    managerId: currentUser.managerId,
    domain: currentUser.domain,
    trainingType: form.type,
    trainingTopic: form.topic,
    expectedStartDate: form.startDate,
    expectedEndDate: form.endDate,
    priority: form.priority,
    trainerAvailable: !!trainer,
    trainerId: trainer ? trainer.trainerId : null,
    trainerName: trainer ? trainer.trainerName : null,
    notes: form.notes,
    status: "pending",
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewNote: null,
  };
}

function submitRequest() {
  if (!currentUser) return;

  const form = readRequestForm();
  const error = validateRequestForm(form);
  if (error) return showToast(error, "error");

  const reqs = getRequests();
  const newReq = buildRequest(form, reqs);

  reqs.push(newReq);
  saveRequests(reqs);
  showToast(`Request ${newReq.requestId} submitted successfully!`, "success");
  clearForm();
}

function renderUserHistory() {
  if (!currentUser) return;

  const body = document.getElementById("userRequestsBody");
  const stats = document.getElementById("userStatsRow");
  if (!body || !stats) return;

  const reqs = getRequests().filter((r) => r.userId === currentUser.userId);

  const pending = reqs.filter((r) => r.status === "pending").length;
  const approved = reqs.filter((r) => r.status === "approved").length;
  const rejected = reqs.filter((r) => r.status === "rejected").length;

  stats.innerHTML = `
    ${statCard("assets/icons/list.svg", reqs.length, "Total Requests", "#192B37")}
    ${statCard("assets/icons/time.svg", pending, "Pending", "#EB9410")}
    ${statCard("assets/icons/success.svg", approved, "Approved", "#2D9C5B")}
    ${statCard("assets/icons/error.svg", rejected, "Rejected", "#D4403B")}
  `;

  if (!reqs.length) {
    body.innerHTML =
      '<tr><td colspan="8"><div class="empty-state"><p>No requests yet. Submit your first training request.</p></div></td></tr>';
    return;
  }

  body.innerHTML = reqs
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .map(
      (r) => `
      <tr>
        <td><strong>${r.requestId}</strong></td>
        <td>${r.trainingType}</td>
        <td>${r.trainingTopic}</td>
        <td><span class="priority-tag ${r.priority}">${cap(r.priority)}</span></td>
        <td>${fmtDate(r.expectedStartDate)} -> ${fmtDate(r.expectedEndDate)}</td>
        <td>${r.trainerName || "-"}</td>
        <td><span class="status-badge ${r.status}">${cap(r.status)}</span></td>
        <td>${fmtDateTime(r.submittedAt)}</td>
      </tr>
    `,
    )
    .join("");
}

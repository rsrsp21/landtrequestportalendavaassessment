function openManagerPortal() {
  if (!currentUser) return;

  const avatar = getEl("mgrAvatar");
  const name = getEl("mgrDisplayName");
  const initials = getInitials(currentUser.displayName);

  if (avatar) avatar.textContent = initials;
  if (name) name.textContent = currentUser.displayName;

  renderManagerRequests();
}

const MANAGER_TRAINING_TYPE_KEYWORDS = {
  "Soft Skills & Leadership": ["soft skills", "leadership", "communication", "public speaking"],
  "Agile & Scrum": ["agile", "scrum", "project management"],
  "Cloud & DevOps": ["cloud", "devops", "kubernetes", "architecture"],
  "Data & Analytics": ["data", "analysis", "machine learning", "visualization"],
  "Design & UX": ["design", "ux", "figma", "adobe", "brand"],
  "Compliance & Security": ["security", "compliance"],
};

function matchesTrainingTypeByExpertise(trainer, trainingType) {
  const keywords = MANAGER_TRAINING_TYPE_KEYWORDS[trainingType] || [];
  if (!keywords.length) return false;
  const profile = [...trainer.trainerExpertise, trainer.domain].join(" ").toLowerCase();
  return keywords.some((keyword) => profile.includes(keyword));
}

function getEligibleTrainersForRequest(request) {
  const matched = TRAINERS_DATA.filter((trainer) => matchesTrainingTypeByExpertise(trainer, request.trainingType));
  const currentTrainer = TRAINERS_DATA.find((trainer) => trainer.trainerId === request.trainerId);

  if (currentTrainer && !matched.some((trainer) => trainer.trainerId === currentTrainer.trainerId)) {
    return [currentTrainer, ...matched];
  }

  return matched;
}

function datesOverlap(startA, endA, startB, endB) {
  if (!startA || !endA || !startB || !endB) return false;
  const aStart = new Date(startA).getTime();
  const aEnd = new Date(endA).getTime();
  const bStart = new Date(startB).getTime();
  const bEnd = new Date(endB).getTime();
  return aStart <= bEnd && bStart <= aEnd;
}

function getOverlappingRequests(request, allReqs) {
  if (!request?.trainerId) return [];
  if (request.status === "rejected") return [];
  return allReqs.filter((other) => {
    if (other.requestId === request.requestId) return false;
    if (other.status === "rejected") return false;
    if (other.trainerId !== request.trainerId) return false;
    return datesOverlap(request.expectedStartDate, request.expectedEndDate, other.expectedStartDate, other.expectedEndDate);
  });
}

function trainerOptionsHtml(request) {
  const eligible = getEligibleTrainersForRequest(request);
  if (!eligible.length) return '<option value="">No matching trainer found</option>';

  return eligible.map((t) => {
    const label = matchesTrainingTypeByExpertise(t, request.trainingType)
      ? t.trainerName
      : `${t.trainerName} (current)`;
    const selected = t.trainerId === request.trainerId ? "selected" : "";
    return `<option value="${t.trainerId}" ${selected}>${label}</option>`;
  }).join("");
}

function reassignTrainer(requestId) {
  const reqs = getRequests();
  const idx = reqs.findIndex((r) => r.requestId === requestId);
  if (idx === -1) return;

  const select = document.getElementById(`reassign_${requestId}`);
  if (!select) return;

  const selectedTrainerId = select.value;
  const trainer = TRAINERS_DATA.find((t) => t.trainerId === selectedTrainerId);
  if (!trainer) return;

  if (!matchesTrainingTypeByExpertise(trainer, reqs[idx].trainingType)) {
    showToast("Selected trainer does not match the required expertise.", "error");
    return;
  }

  reqs[idx].trainerId = trainer.trainerId;
  reqs[idx].trainerName = trainer.trainerName;
  reqs[idx].trainerAvailable = !!trainer.trainerAvailability;
  saveRequests(reqs);
  showToast(`Trainer reassigned for ${requestId}.`, "info");
  renderManagerRequests();
}

function renderManagerRequests() {
  if (!currentUser) return;

  const body = document.getElementById("mgrRequestsBody");
  const stats = document.getElementById("mgrStatsRow");
  const statusFilter = document.getElementById("mgrFilterStatus");
  const priorityFilter = document.getElementById("mgrFilterPriority");

  if (!body || !stats || !statusFilter || !priorityFilter) return;

  const allReqs = getRequests().filter((r) => r.managerId === currentUser.userId);
  const filterStatus = statusFilter.value;
  const filterPriority = priorityFilter.value;

  const filtered = allReqs.filter(
    (r) => (!filterStatus || r.status === filterStatus) && (!filterPriority || r.priority === filterPriority),
  );

  const pending = allReqs.filter((r) => r.status === "pending").length;
  const approved = allReqs.filter((r) => r.status === "approved").length;
  const rejected = allReqs.filter((r) => r.status === "rejected").length;

  stats.innerHTML = `
    ${statCard("assets/icons/list.svg", allReqs.length, "Total Requests", "#192B37")}
    ${statCard("assets/icons/time.svg", pending, "Pending", "#EB9410")}
    ${statCard("assets/icons/success.svg", approved, "Approved", "#2D9C5B")}
    ${statCard("assets/icons/error.svg", rejected, "Rejected", "#D4403B")}
  `;

  if (!filtered.length) {
    body.innerHTML = '<tr><td colspan="10"><div class="empty-state"><p>No requests match the selected filters.</p></div></td></tr>';
    return;
  }

  body.innerHTML = filtered
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .map((r) => {
      const overlaps = getOverlappingRequests(r, allReqs);
      const overlapHtml = overlaps.length
        ? `<div class="overlap-warning">Overlap with ${overlaps.length} request(s)</div>`
        : "";

      return `
      <tr class="${overlaps.length ? "overlap-row" : ""}">
        <td><strong>${r.requestId}</strong></td>
        <td>${r.userName}</td>
        <td>${r.trainingType}</td>
        <td>${r.trainingTopic}</td>
        <td><span class="priority-tag ${r.priority}">${cap(r.priority)}</span></td>
        <td>${fmtDate(r.expectedStartDate)} -> ${fmtDate(r.expectedEndDate)}</td>
        <td>
          <div>${r.trainerName || "-"}</div>
          ${overlapHtml}
        </td>
        <td><span class="status-badge ${r.status}">${cap(r.status)}</span></td>
        <td>${fmtDateTime(r.submittedAt)}</td>
        <td>
          ${
            r.status === "pending"
              ? `
            <div class="action-btns">
              <select class="reassign-select" id="reassign_${r.requestId}">
                ${trainerOptionsHtml(r)}
              </select>
              <button class="btn-secondary" onclick="reassignTrainer('${r.requestId}')">Reassign</button>
              <button class="btn-approve" onclick="confirmAction('approve','${r.requestId}')">
                <img src="assets/icons/checkmark.svg" alt="" class="btn-icon" /> Approve
              </button>
              <button class="btn-reject" onclick="confirmAction('reject','${r.requestId}')">
                <img src="assets/icons/close.svg" alt="" class="btn-icon" /> Reject
              </button>
            </div>
          `
              : '<span class="muted-text">-</span>'
          }
        </td>
      </tr>
    `;
    })
    .join("");
}

function confirmAction(action, requestId) {
  pendingAction = { action, requestId };
  const isApprove = action === "approve";

  const title = document.getElementById("modalTitle");
  const body = document.getElementById("modalBody");
  const confirmBtn = document.getElementById("modalConfirmBtn");
  const modal = document.getElementById("confirmModal");
  if (!title || !body || !confirmBtn || !modal) return;

  title.textContent = isApprove ? "Approve Request" : "Reject Request";
  body.textContent = isApprove
    ? `Are you sure you want to approve training request ${requestId}?`
    : `Are you sure you want to reject training request ${requestId}?`;

  confirmBtn.textContent = isApprove ? "Approve" : "Reject";
  confirmBtn.classList.toggle("btn-confirm-approve", isApprove);
  confirmBtn.classList.toggle("btn-confirm-reject", !isApprove);

  modal.classList.add("open");
}

function closeModal() {
  const modal = document.getElementById("confirmModal");
  if (modal) modal.classList.remove("open");
  pendingAction = null;
}

function bindModalEvents() {
  const confirmBtn = document.getElementById("modalConfirmBtn");
  const modal = document.getElementById("confirmModal");
  if (!confirmBtn || !modal) return;

  confirmBtn.onclick = function () {
    if (!pendingAction) return;

    const reqs = getRequests();
    const idx = reqs.findIndex((r) => r.requestId === pendingAction.requestId);

    if (idx !== -1) {
      reqs[idx].status = pendingAction.action === "approve" ? "approved" : "rejected";
      reqs[idx].reviewedAt = new Date().toISOString();
      saveRequests(reqs);
      showToast(
        `Request ${pendingAction.requestId} ${reqs[idx].status} successfully!`,
        pendingAction.action === "approve" ? "success" : "error",
      );
      renderManagerRequests();
    }

    closeModal();
  };

  modal.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
}

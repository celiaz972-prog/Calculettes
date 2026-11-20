// Routage simple par hash + rendu DOM vanilla.

const mainEl = document.getElementById("main");
const headerTitle = document.getElementById("headerTitle");
const backBtn = document.getElementById("backBtn");
const modalBg = document.getElementById("modalBg");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const modalCancel = document.getElementById("modalCancel");
const modalConfirm = document.getElementById("modalConfirm");

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (k === "html") node.innerHTML = v;
    else node.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c == null) return;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return node;
}

function closeModal() {
  modalBg.classList.add("hidden");
  modalBody.innerHTML = "";
}

function openModal(title, bodyNode, onConfirm, confirmLabel = "Créer") {
  modalTitle.textContent = title;
  modalBody.innerHTML = "";
  modalBody.appendChild(bodyNode);
  modalConfirm.textContent = confirmLabel;
  modalBg.classList.remove("hidden");
  modalConfirm.onclick = onConfirm;
  modalCancel.onclick = closeModal;
}

// ---------- Router ----------
function navigate(hash) {
  window.location.hash = hash;
}

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", render);

function parseHash() {
  const h = window.location.hash.slice(1) || "/";
  const parts = h.split("/").filter(Boolean);
  return parts;
}

function render() {
  const parts = parseHash();
  if (parts.length === 0) {
    backBtn.classList.add("hidden");
    renderHome();
  } else if (parts[0] === "chantier" && parts.length === 2) {
    backBtn.classList.remove("hidden");
    backBtn.onclick = () => navigate("");
    renderChantierDetail(parts[1]);
  } else if (parts[0] === "chantier" && parts[1] && parts[2] === "metre-form") {
    backBtn.classList.remove("hidden");
    backBtn.onclick = () => navigate(`chantier/${parts[1]}`);
    renderMetreForm(parts[1]);
  } else if (parts[0] === "chantier" && parts[1] && parts[2] === "metre" && parts[3]) {
    backBtn.classList.remove("hidden");
    backBtn.onclick = () => navigate(`chantier/${parts[1]}`);
    renderMetreResult(parts[1], parts[3]);
  } else {
    navigate("");
  }
}

// ---------- Home ----------
function renderHome() {
  headerTitle.textContent = "Mes chantiers";
  mainEl.innerHTML = "";
  const chantiers = getChantiers();

  mainEl.appendChild(el("div", { class: "backup-row" }, [
    el("button", { class: "backup-btn", onclick: exporterSauvegarde }, "⬇ Exporter"),
    el("button", { class: "backup-btn", onclick: () => document.getElementById("importFile").click() }, "⬆ Importer"),
  ]));
  mainEl.appendChild(el("input", {
    type: "file", id: "importFile", accept: "application/json",
    style: "display:none",
    onchange: (e) => importerFichier(e.target.files[0]),
  }));

  if (chantiers.length === 0) {
    mainEl.appendChild(el("p", { class: "empty" }, "Aucun chantier. Appuie sur + pour commencer."));
  } else {
    chantiers.forEach((c) => {
      const card = el("div", { class: "card" }, [
        el("p", { class: "card-title" }, c.nom),
        c.adresse ? el("p", { class: "card-sub" }, c.adresse) : null,
        el("p", { class: "card-meta" }, `${c.metres.length} métré(s) · ${c.statut}`),
      ]);
      card.onclick = () => navigate(`chantier/${c.id}`);
      card.oncontextmenu = (e) => { e.preventDefault(); confirmSupprimerChantier(c); };
      let pressTimer;
      card.addEventListener("touchstart", () => { pressTimer = setTimeout(() => confirmSupprimerChantier(c), 600); });
      card.addEventListener("touchend", () => clearTimeout(pressTimer));
      mainEl.appendChild(card);
    });
  }

  const fab = el("button", { class: "fab", onclick: () => ouvrirModalNouveauChantier() }, "+");
  mainEl.appendChild(fab);
}

function confirmSupprimerChantier(c) {
  if (confirm(`Supprimer "${c.nom}" ? Ses métrés seront perdus.`)) {
    deleteChantier(c.id);
    render();
  }
}

// ---------- Sauvegarde / restauration ----------

function exporterSauvegarde() {
  const data = exportDataString();
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `chantiers-sauvegarde-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function importerFichier(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const result = importDataString(reader.result);
      alert(`Import terminé : ${result.ajoutes} chantier(s) ajouté(s), ${result.remplaces} remplacé(s). Total : ${result.total}.`);
      render();
    } catch (e) {
      alert("Fichier invalide, import annulé.");
    }
  };
  reader.readAsText(file);
  document.getElementById("importFile").value = "";
}

function ouvrirModalNouveauChantier() {
  const body = el("div", {}, [
    el("div", { class: "field" }, [
      el("label", {}, "Nom du chantier"),
      el("input", { type: "text", id: "newChantierNom" }),
    ]),
    el("div", { class: "field" }, [
      el("label", {}, "Adresse (optionnel)"),
      el("input", { type: "text", id: "newChantierAdresse" }),
    ]),
  ]);
  openModal("Nouveau chantier", body, () => {
    const nom = document.getElementById("newChantierNom").value.trim();
    const adresse = document.getElementById("newChantierAdresse").value.trim();
    if (!nom) { alert("Nom requis"); return; }
    addChantier({ nom, adresse });
    closeModal();
    render();
  });
}

// ---------- Détail chantier ----------
function renderChantierDetail(chantierId) {
  const chantier = getChantier(chantierId);
  if (!chantier) { navigate(""); return; }
  headerTitle.textContent = chantier.nom;
  mainEl.innerHTML = "";

  if (chantier.metres.length === 0) {
    mainEl.appendChild(el("p", { class: "empty" }, "Aucun métré enregistré pour ce chantier."));
  } else {
    chantier.metres.forEach((m) => {
      const card = el("div", { class: "card" }, [
        el("p", { class: "card-title" }, m.input.nom || "Cloison " + m.input.type_cloison),
        el("p", { class: "card-sub" }, `${m.input.longueur_m} m × ${m.input.hauteur_m} m — ${m.input.type_cloison}`),
        el("p", { class: "card-meta" }, new Date(m.date).toLocaleDateString("fr-FR")),
      ]);
      card.onclick = () => navigate(`chantier/${chantierId}/metre/${m.id}`);
      let pressTimer;
      card.addEventListener("touchstart", () => {
        pressTimer = setTimeout(() => {
          if (confirm("Supprimer ce métré ?")) { deleteMetre(chantierId, m.id); render(); }
        }, 600);
      });
      card.addEventListener("touchend", () => clearTimeout(pressTimer));
      mainEl.appendChild(card);
    });
  }

  const fab = el("button", { class: "fab", onclick: () => navigate(`chantier/${chantierId}/metre-form`) }, "+");
  mainEl.appendChild(fab);
}

// ---------- Formulaire métré ----------
function field(labelTxt, value, onInput, opts = {}) {
  const input = el("input", {
    type: opts.type || "text",
    inputmode: opts.inputmode || "decimal",
    value: value,
    placeholder: opts.placeholder || "",
    oninput: (e) => onInput(e.target.value),
  });
  return el("div", { class: "field" }, [el("label", {}, labelTxt), input]);
}

function toggleRow(labelTxt, value, options, onChange, refresh) {
  const row = el("div", { class: "toggle-row" });
  options.forEach((opt) => {
    const btn = el("button", {
      class: "toggle-btn" + (value === opt ? " active" : ""),
      onclick: () => { onChange(opt); refresh(); },
    }, String(opt));
    row.appendChild(btn);
  });
  return el("div", { class: "field" }, [el("label", {}, labelTxt), row]);
}

function renderMetreForm(chantierId) {
  headerTitle.textContent = "Nouveau métré placo";
  const d = defaultMetreInput();
  const state = {
    nom: "", type_cloison: d.type_cloison, longueur_m: "", hauteur_m: "",
    entraxe_m: String(d.entraxe_m), nb_faces: d.nb_faces, nb_couches: d.nb_couches,
    ouvertures: [], taux_chute: String(d.taux_chute * 100), vis_par_m2: String(d.vis_par_m2),
    bandes_par_m2: String(d.bandes_par_m2), enduit_par_m2: String(d.enduit_par_m2),
    plaque_largeur_m: String(d.plaque_largeur_m), plaque_hauteur_m: String(d.plaque_hauteur_m),
    barre_rail_m: String(d.barre_rail_m), barre_montant_m: String(d.barre_montant_m),
  };

  function num(v, fallback = 0) {
    const n = parseFloat(String(v).replace(",", "."));
    return isNaN(n) ? fallback : n;
  }

  function draw() {
    mainEl.innerHTML = "";
    const scrollY = mainEl.scrollTop;

    mainEl.appendChild(el("div", { class: "section-title" }, "Identification"));
    mainEl.appendChild(field("Nom (ex: Cloison salon)", state.nom, (v) => (state.nom = v), { type: "text", inputmode: "text" }));
    mainEl.appendChild(field("Type de cloison (ex: 72/48)", state.type_cloison, (v) => (state.type_cloison = v), { type: "text", inputmode: "text" }));

    mainEl.appendChild(el("div", { class: "section-title" }, "Dimensions"));
    mainEl.appendChild(field("Longueur (m)", state.longueur_m, (v) => (state.longueur_m = v), { placeholder: "5.60" }));
    mainEl.appendChild(field("Hauteur (m)", state.hauteur_m, (v) => (state.hauteur_m = v), { placeholder: "3.11" }));
    mainEl.appendChild(field("Entraxe montants (m)", state.entraxe_m, (v) => (state.entraxe_m = v)));
    mainEl.appendChild(toggleRow("Nombre de faces", state.nb_faces, [1, 2], (v) => (state.nb_faces = v), draw));
    mainEl.appendChild(toggleRow("Panneaux par face", state.nb_couches, [1, 2], (v) => (state.nb_couches = v), draw));

    mainEl.appendChild(el("div", { class: "section-title" }, "Ouvertures"));
    state.ouvertures.forEach((o, idx) => {
      const card = el("div", { class: "ouverture-card" }, [
        el("div", { class: "ouverture-header" }, [
          el("span", { class: "ouverture-type" }, o.type),
          el("button", { class: "ouverture-remove", onclick: () => { state.ouvertures.splice(idx, 1); draw(); } }, "✕"),
        ]),
        el("div", { class: "row-2" }, [
          el("div", {}, field("Largeur (m)", o.largeur_m, (v) => (o.largeur_m = v))),
          el("div", {}, field("Hauteur (m)", o.hauteur_m, (v) => (o.hauteur_m = v))),
        ]),
      ]);
      mainEl.appendChild(card);
    });
    mainEl.appendChild(el("div", { class: "add-row" }, [
      el("button", { class: "add-btn", onclick: () => { state.ouvertures.push({ type: "porte", largeur_m: "", hauteur_m: "" }); draw(); } }, "+ Porte"),
      el("button", { class: "add-btn", onclick: () => { state.ouvertures.push({ type: "fenêtre", largeur_m: "", hauteur_m: "" }); draw(); } }, "+ Fenêtre"),
    ]));

    mainEl.appendChild(el("div", { class: "section-title" }, "Ratios"));
    mainEl.appendChild(field("Taux de chute (%)", state.taux_chute, (v) => (state.taux_chute = v)));
    mainEl.appendChild(field("Vis par m²", state.vis_par_m2, (v) => (state.vis_par_m2 = v)));
    mainEl.appendChild(field("Bandes par m² (ml/m²)", state.bandes_par_m2, (v) => (state.bandes_par_m2 = v)));
    mainEl.appendChild(field("Enduit par m² (kg/m²)", state.enduit_par_m2, (v) => (state.enduit_par_m2 = v)));

    mainEl.appendChild(el("div", { class: "section-title" }, "Plaque"));
    mainEl.appendChild(field("Largeur plaque (m)", state.plaque_largeur_m, (v) => (state.plaque_largeur_m = v)));
    mainEl.appendChild(field("Hauteur plaque (m)", state.plaque_hauteur_m, (v) => (state.plaque_hauteur_m = v)));

    mainEl.appendChild(el("div", { class: "section-title" }, "Longueurs de barre"));
    mainEl.appendChild(field("Longueur barre rail (m)", state.barre_rail_m, (v) => (state.barre_rail_m = v)));
    mainEl.appendChild(field("Longueur barre montant (m)", state.barre_montant_m, (v) => (state.barre_montant_m = v)));

    const calcBtn = el("button", { class: "btn-primary" }, "Calculer le métré");
    calcBtn.onclick = () => {
      if (!num(state.longueur_m) || !num(state.hauteur_m)) { alert("Longueur et hauteur requises"); return; }
      const input = {
        nom: state.nom.trim(),
        type_cloison: state.type_cloison,
        longueur_m: num(state.longueur_m),
        hauteur_m: num(state.hauteur_m),
        entraxe_m: num(state.entraxe_m, 0.6),
        nb_faces: state.nb_faces,
        nb_couches: state.nb_couches,
        ouvertures: state.ouvertures.map((o) => ({ type: o.type, largeur_m: num(o.largeur_m), hauteur_m: num(o.hauteur_m) })),
        taux_chute: num(state.taux_chute, 1) / 100,
        vis_par_m2: num(state.vis_par_m2, 8),
        bandes_par_m2: num(state.bandes_par_m2, 2),
        enduit_par_m2: num(state.enduit_par_m2, 2),
        plaque_largeur_m: num(state.plaque_largeur_m, 1.2),
        plaque_hauteur_m: num(state.plaque_hauteur_m, 2.55),
        barre_rail_m: num(state.barre_rail_m, 3),
        barre_montant_m: num(state.barre_montant_m, 3),
      };
      const resultat = calculerMetre(input);
      const metre = addMetre(chantierId, input, resultat);
      navigate(`chantier/${chantierId}/metre/${metre.id}`);
    };
    mainEl.appendChild(calcBtn);
    mainEl.appendChild(el("div", { style: "height:40px" }));
    mainEl.scrollTop = scrollY;
  }

  draw();
}

// ---------- Résultat métré ----------
function renderMetreResult(chantierId, metreId) {
  const chantier = getChantier(chantierId);
  const metre = chantier?.metres.find((m) => m.id === metreId);
  if (!metre) { navigate(`chantier/${chantierId}`); return; }

  headerTitle.textContent = "Résultat du métré";
  mainEl.innerHTML = "";

  mainEl.appendChild(el("div", { class: "result-header" }, [
    el("div", { class: "title" }, metre.input.nom || "Métré"),
    el("div", { class: "sub" }, `${metre.input.type_cloison} — ${metre.input.longueur_m} m × ${metre.input.hauteur_m} m · ${metre.input.nb_faces} face(s) × ${metre.input.nb_couches} panneau(x)`),
  ]));

  if (metre.resultat.alertes.length > 0) {
    const box = el("div", { class: "alert-box" });
    metre.resultat.alertes.forEach((a) => box.appendChild(el("div", {}, "⚠ " + a)));
    mainEl.appendChild(box);
  }

  metre.resultat.resultats.forEach((r) => {
    mainEl.appendChild(el("div", { class: "result-row" }, [
      el("span", { class: "mat" }, r.materiau),
      el("span", { class: "qte" }, `${r.qte} ${r.unite}`),
    ]));
  });
}

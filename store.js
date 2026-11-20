// Persistance locale via localStorage — survit fermeture app, pas de serveur requis.

const STORE_KEY = "chantiers_v1";

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getChantiers() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveChantiers(list) {
  localStorage.setItem(STORE_KEY, JSON.stringify(list));
}

function addChantier({ nom, adresse }) {
  const list = getChantiers();
  const chantier = {
    id: uid(),
    nom,
    adresse,
    dateCreation: new Date().toISOString(),
    statut: "actif",
    metres: [],
  };
  list.push(chantier);
  saveChantiers(list);
  return chantier;
}

function deleteChantier(chantierId) {
  saveChantiers(getChantiers().filter((c) => c.id !== chantierId));
}

function getChantier(chantierId) {
  return getChantiers().find((c) => c.id === chantierId) || null;
}

function addMetre(chantierId, metreInput, resultat) {
  const list = getChantiers();
  const chantier = list.find((c) => c.id === chantierId);
  if (!chantier) return null;
  const metre = { id: uid(), date: new Date().toISOString(), input: metreInput, resultat };
  chantier.metres.push(metre);
  saveChantiers(list);
  return metre;
}

function deleteMetre(chantierId, metreId) {
  const list = getChantiers();
  const chantier = list.find((c) => c.id === chantierId);
  if (!chantier) return;
  chantier.metres = chantier.metres.filter((m) => m.id !== metreId);
  saveChantiers(list);
}

// ---------- Sauvegarde / restauration ----------

function exportDataString() {
  return JSON.stringify(
    { app: "chantiers_v1", exportedAt: new Date().toISOString(), chantiers: getChantiers() },
    null,
    2
  );
}

// Fusionne par id : un chantier importé avec id déjà présent remplace l'existant,
// sinon il est ajouté. Rien n'est supprimé de ce qui existe déjà.
function importDataString(jsonStr) {
  const parsed = JSON.parse(jsonStr);
  const incoming = Array.isArray(parsed) ? parsed : parsed.chantiers;
  if (!Array.isArray(incoming)) throw new Error("Format de fichier invalide");

  const current = getChantiers();
  const byId = new Map(current.map((c) => [c.id, c]));
  let ajoutes = 0;
  let remplaces = 0;
  incoming.forEach((c) => {
    if (!c || !c.id) return;
    if (byId.has(c.id)) remplaces++;
    else ajoutes++;
    byId.set(c.id, c);
  });
  saveChantiers(Array.from(byId.values()));
  return { ajoutes, remplaces, total: byId.size };
}

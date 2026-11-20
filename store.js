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

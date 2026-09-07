/* ============================================================
   KinéoGest — db.js
   Couche de données de démonstration (localStorage).
   Simule une base de données : CRUD + compteurs, persistance
   locale, données fictives. Prêt à être remplacé par une vraie
   base (Supabase / API) sans toucher aux pages.
   Collections : patients, employes, factures, rendezvous,
   dossiers, documents, paiements.
   ============================================================ */
(function () {
  var KEY = "kineogest_db_v5";

  /* ---------- Données de départ (fictives) ---------- */

  /* Patients : [id, nom complet, initiales] */
  var PATIENTS = [
    ["P001", "Kenza Alaoui", "KA"],
    ["P002", "Omar Haddad", "OH"],
    ["P003", "Yasmine Tazi", "YT"],
    ["P004", "Mehdi Chraibi", "MC"],
    ["P005", "Ilham Ziani", "IZ"],
    ["P006", "Nabil Fassi", "NF"],
    ["P007", "Fatima Zahra", "FZ"],
    ["P008", "Ahmed Bennani", "AB"],
    ["P009", "Leila Idrissi", "LI"],
    ["P010", "Youssra Amrani", "YA"]
  ];

  /* Employés : [id, nom, initiales, rôle, spécialité, planning, salaire, statut] */
  var EMPLOYES = [
    ["E001", "Rachid Bensaid", "RB", "Kinésithérapeute", "Rééducation sportive", "Lun-Ven 09h-18h", 15000, "Actif"],
    ["E002", "Salma Lahlou", "SL", "Kinésithérapeute", "Masso-kinésithérapie", "Lun-Sam 08h-17h", 14500, "Actif"],
    ["E003", "Amine Kadiri", "AK", "Kinésithérapeute", "Kiné respiratoire", "Lun-Ven 10h-19h", 15000, "Actif"],
    ["E004", "Nadia Fikri", "NF", "Secrétaire", "Accueil / planning", "Lun-Ven 09h-17h", 8000, "Actif"],
    ["E005", "Youssef Alaoui", "YA", "Kinésithérapeute", "Rééducation pédiatrique", "Lun-Ven 08h-17h", 14000, "Actif"],
    ["E006", "Amina Tazi", "AT", "Secrétaire", "Comptabilité", "Lun-Ven 09h-17h", 7500, "Actif"],
    ["E007", "Karim Benjelloun", "KB", "Kinésithérapeute", "Neurologie", "Lun-Mer 09h-18h", 16000, "Congé"],
    ["E008", "Bilal Haddadi", "BH", "Kinésithérapeute", "—", "—", null, "Poste vacant"]
  ];

  /* [numero, patientId, montant, date, echeance, statut] */
  /* statut: "Payée" | "En attente" | "En retard" */

  /* --- 10 factures récentes (identiques à l'affichage d'origine) --- */
  var RECENTES = [
    ["FAC-2026-0156", "P001", 450, "05/09/2026", "05/10/2026", "Payée"],
    ["FAC-2026-0155", "P002", 380, "04/09/2026", "04/10/2026", "Payée"],
    ["FAC-2026-0154", "P003", 520, "03/09/2026", "03/10/2026", "En attente"],
    ["FAC-2026-0153", "P004", 600, "02/09/2026", "02/10/2026", "Payée"],
    ["FAC-2026-0152", "P005", 350, "01/09/2026", "01/10/2026", "En attente"],
    ["FAC-2026-0151", "P006", 480, "01/09/2026", "01/10/2026", "En retard"],
    ["FAC-2026-0150", "P007", 290, "30/08/2026", "30/09/2026", "Payée"],
    ["FAC-2026-0149", "P008", 750, "28/08/2026", "28/09/2026", "En retard"],
    ["FAC-2026-0148", "P009", 420, "27/08/2026", "27/09/2026", "Payée"],
    ["FAC-2026-0147", "P010", 380, "25/08/2026", "25/09/2026", "En attente"]
  ];

  /* --- Génération des factures historiques (0146 → 0001) --- */
  function pad4(n) { return String(n).padStart(4, "0"); }
  function pad3(n) { return String(n).padStart(3, "0"); }
  function fmtDate(d) {
    return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear();
  }
  function addMonths(d, m) {
    var x = new Date(d);
    x.setMonth(x.getMonth() + m);
    return x;
  }
  var MONTANTS = [250, 300, 320, 350, 380, 400, 420, 450, 480, 500, 520, 550, 580, 600, 650, 700, 750];
  function genHistorique() {
    var list = [];
    var base = new Date(2026, 0, 15); /* 15 janvier 2026 */
    /* 146 factures : 0001 → 0146. Objectif global 156 / 124 / 28 / 4.
       Les 10 récentes = 5 Payée, 3 Attente, 2 Retard.
       Donc sur les 146 : 119 Payée, 25 Attente, 2 Retard. */
    var att = 0, ret = 0;
    for (var i = 1; i <= 146; i++) {
      var d = new Date(base);
      d.setDate(base.getDate() + i * 2);           /* ~2 jours d'intervalle */
      var pid = "P" + String((i % 10) + 1).padStart(3, "0");
      var mont = MONTANTS[i % MONTANTS.length];
      var statut;
      if (i === 37 || i === 91) { statut = "En retard"; }
      else if (att < 25 && i % 5 === 4) { statut = "En attente"; }
      else { statut = "Payée"; }
      if (statut === "En attente") att++;
      if (statut === "En retard") ret++;
      list.push(["FAC-2026-" + pad4(i), pid, mont, fmtDate(d), fmtDate(addMonths(d, 1)), statut]);
    }
    return list;
  }

  function FACTURES() {
    return genHistorique().concat(RECENTES);
  }

  /* Rendez-vous : [id, date JJ/MM/AAAA, heure, patientId, thérapeuteId, traitement, statut] */
  var RENDEZVOUS = [
    ["RDV-001", "07/09/2026", "08:00", "P001", "E001", "Rééducation du genou", "Confirmé"],
    ["RDV-002", "07/09/2026", "08:30", "P002", "E002", "Kiné du dos", "Confirmé"],
    ["RDV-003", "07/09/2026", "09:00", "P003", "E003", "Masso-thérapie", "En attente"],
    ["RDV-004", "08/09/2026", "10:00", "P004", "E001", "Suivi post-opératoire", "Confirmé"],
    ["RDV-005", "08/09/2026", "10:30", "P005", "E002", "Kiné respiratoire", "Annulé"],
    ["RDV-006", "09/09/2026", "11:00", "P006", "E003", "Rééducation épaule", "Confirmé"],
    ["RDV-007", "09/09/2026", "14:00", "P007", "E001", "Rééducation cheville", "En attente"],
    ["RDV-008", "10/09/2026", "09:30", "P008", "E002", "Kiné pédiatrique", "Confirmé"],
    ["RDV-009", "11/09/2026", "15:00", "P009", "E003", "Drainage lymphatique", "Annulé"],
    ["RDV-010", "12/09/2026", "16:00", "P010", "E001", "Rééducation main", "Confirmé"]
  ];

  /* Dossiers médicaux : [patientId, âge, sexe, dernière visite, traitement, thérapeuteId, notes] */
  var DOSSIERS = [
    ["P001", 32, "F", "05/09/2026", "Rééducation genou", "E002", "Post-op TKA droite — semaine 6. Amplitude 0-110°."],
    ["P002", 45, "M", "02/09/2026", "Kiné dos", "E001", "Lombalgie chronique — séances de renforcement."],
    ["P003", 28, "F", "04/09/2026", "Rééducation sportive", "E001", "Entorse cheville G — reprise sportive prévue oct."],
    ["P004", 38, "M", "03/09/2026", "Kiné dos", "E007", "Hernie discale L4-L5 — drainage + mobilisation."],
    ["P005", 52, "F", "04/09/2026", "Kiné respiratoire", "E003", "BPCO stade 2 — gainage thoracique, ventilation."],
    ["P006", 41, "M", "01/09/2026", "Masso-kinésithérapie", "E002", "Tendinopathie supra-épineux — ondes de choc."],
    ["P007", 29, "F", "06/09/2026", "Rééducation genou", "E002", "Ligament croisé antérieur — renforcement quadriceps."],
    ["P008", 55, "M", "28/08/2026", "Kiné dos", "E001", "Sténose lombaire — programme progressif de marche."],
    ["P009", 34, "F", "30/08/2026", "Rééducation pédiatrique", "E005", "Accompagnement enfant — retard marche 18 mois."],
    ["P010", 26, "F", "06/09/2026", "Rééducation sportive", "E001", "Rupture coiffe rotateurs G — programme excentrique."]
  ];

  /* Documents : [id, nom, type, ownerType ("patient"/"employe"), ownerId, date, taille (Ko)] */
  var DOCUMENTS = [
    ["DOC-001", "Ordonnance — rééducation genou", "Prescription", "patient", "P001", "05/09/2026", 245],
    ["DOC-002", "Radiographie RX genou (D)", "Imagerie", "patient", "P001", "05/09/2026", 1229],
    ["DOC-003", "Contrat de travail — Amine Kadiri", "RH", "employe", "E003", "01/09/2026", 520],
    ["DOC-004", "Compte rendu — bilan S1", "Bilan", "patient", "P002", "02/09/2026", 180],
    ["DOC-005", "Attestation employé — Nadia Fikri", "RH", "employe", "E004", "28/08/2026", 120],
    ["DOC-006", "IRM lombaire", "Imagerie", "patient", "P004", "03/09/2026", 2150],
    ["DOC-007", "Ordonnance — kiné respiratoire", "Prescription", "patient", "P005", "04/09/2026", 195],
    ["DOC-008", "Contrat de travail — Salma Lahlou", "RH", "employe", "E002", "15/06/2025", 510],
    ["DOC-009", "Bilan de suivi — mois d'août", "Bilan", "patient", "P006", "01/09/2026", 320],
    ["DOC-010", "Radio épaule (G)", "Imagerie", "patient", "P006", "03/09/2026", 1843],
    ["DOC-011", "Certificat médical", "Prescription", "patient", "P007", "06/09/2026", 150],
    ["DOC-012", "Fiche de paie — août 2026", "RH", "employe", "E001", "01/09/2026", 280]
  ];

  /* Paiements : [numero, patientId, montant, méthode, date, référence, statut] */
  /* statut: "Reçu" | "En attente" | "Remboursé" */
  var PAIEMENTS = [
    ["PAY-001", "P001", 450, "Espèces", "05/09/2026", "—", "Reçu"],
    ["PAY-002", "P002", 380, "Carte bancaire", "04/09/2026", "CB-7842", "Reçu"],
    ["PAY-003", "P003", 260, "Chèque", "03/09/2026", "CH-1593", "En attente"],
    ["PAY-004", "P004", 600, "Virement", "02/09/2026", "VIR-4821", "Reçu"],
    ["PAY-005", "P005", 350, "Espèces", "01/09/2026", "—", "Reçu"],
    ["PAY-006", "P006", 240, "Carte bancaire", "01/09/2026", "CB-7855", "Remboursé"],
    ["PAY-007", "P007", 290, "Espèces", "30/08/2026", "—", "Reçu"],
    ["PAY-008", "P008", 500, "Virement", "28/08/2026", "VIR-4830", "Reçu"],
    ["PAY-009", "P009", 420, "Carte bancaire", "27/08/2026", "CB-7861", "Reçu"],
    ["PAY-010", "P010", 190, "Espèces", "25/08/2026", "—", "En attente"]
  ];

  /* --- Génération de l'historique de paiements (PAY-011 → PAY-050) --- */
  var METHODS = ["Espèces", "Carte bancaire", "Virement", "Chèque"];
  var REF_CODES = { "Carte bancaire": "CB", "Virement": "VIR", "Chèque": "CH" };
  function genPaiements() {
    var list = [];
    var base = new Date(2026, 0, 25); /* 25 janvier 2026 */
    for (var i = 0; i < 40; i++) {
      var d = new Date(base);
      d.setDate(base.getDate() + i * 6);           /* ~6 jours d'intervalle */
      var pid = "P" + String((i % 10) + 1).padStart(3, "0");
      var mont = MONTANTS[(i * 3 + 1) % MONTANTS.length];
      var meth = METHODS[i % METHODS.length];
      var ref = "—";
      if (meth !== "Espèces") ref = REF_CODES[meth] + "-" + String((i * 7) % 9000 + 1000);
      var statut = "Reçu";
      if (i % 17 === 5) statut = "En attente";
      if (i % 31 === 12) statut = "Remboursé";
      list.push(["PAY-" + pad3(11 + i), pid, mont, meth, fmtDate(d), ref, statut]);
    }
    return list;
  }

  /* ---------- Construction des enregistrements ---------- */
  function patients() {
    return PATIENTS.map(function (p) {
      return { id: p[0], nom: p[1], initiales: p[2] };
    });
  }
  function patientById(id) {
    var found = null;
    patients().forEach(function (p) { if (p.id === id) found = p; });
    return found;
  }

  var EM_STATUTS = { "Actif": "Actif", "Congé": "Congé", "Poste vacant": "Poste vacant" };
  function employes() {
    return EMPLOYES.map(function (e) {
      return {
        id: e[0], nom: e[1], initiales: e[2], role: e[3], specialite: e[4],
        planning: e[5], salaire: e[6], statut: e[7]
      };
    });
  }
  function employeById(id) {
    var found = null;
    employes().forEach(function (e) { if (e.id === id) found = e; });
    return found;
  }
  function employeNom(id) {
    var e = employeById(id);
    return e ? e.nom : "—";
  }

  /* Lookups « db-aware » : cherche d'abord dans le stockage (inclut les
     enregistrements ajoutés à l'exécution), puis retombe sur le seed.
     N'appelle load() que si de la donnée est déjà stockée, pour éviter
     toute récursion pendant le seed initial. */
  function dbPatient(id) {
    var d = load();
    if (d) {
      for (var i = 0; i < d.patients.length; i++) { if (d.patients[i].id === id) return d.patients[i]; }
    }
    return patientById(id);
  }
  function dbEmploye(id) {
    var d = load();
    if (d) {
      for (var i = 0; i < d.employes.length; i++) { if (d.employes[i].id === id) return d.employes[i]; }
    }
    return employeById(id);
  }

  function factures() {
    return FACTURES().map(function (f) {
      return {
        numero: f[0], patientId: f[1], patient: patientById(f[1]),
        montant: f[2], date: f[3], echeance: f[4], statut: f[5]
      };
    });
  }

  function rendezvous() {
    return RENDEZVOUS.map(function (r) {
      return {
        id: r[0], date: r[1], heure: r[2], patientId: r[3], therapeuteId: r[4],
        patient: patientById(r[3]), therapeute: employeById(r[4]),
        traitement: r[5], statut: r[6]
      };
    });
  }

  function dossiers() {
    return DOSSIERS.map(function (d) {
      return {
        patientId: d[0], patient: patientById(d[0]), age: d[1], sexe: d[2],
        derniereVisite: d[3], traitement: d[4], therapeuteId: d[5],
        therapeute: employeById(d[5]), notes: d[6]
      };
    });
  }

  function documents() {
    return DOCUMENTS.map(function (d) {
      var owner = d[3] === "employe" ? employeById(d[4]) : patientById(d[4]);
      return {
        id: d[0], nom: d[1], type: d[2], ownerType: d[3], ownerId: d[4],
        ownerNom: owner ? owner.nom : "—", ownerInitiales: owner ? owner.initiales : "—",
        date: d[5], tailleKo: d[6]
      };
    });
  }

  function paiements() {
    return PAIEMENTS.concat(genPaiements()).map(function (p) {
      return {
        numero: p[0], patientId: p[1], patient: patientById(p[1]),
        montant: p[2], methode: p[3], date: p[4], reference: p[5], statut: p[6]
      };
    });
  }

  /* Générateurs de numéros auto-incrémentés (au-delà du seed).
     Calcul sur les données stockées (qui incluent les ajouts à
     l'exécution) quand elles existent, sinon sur le seed. */
  function nextPay() {
    var src = (load() ? db() : { paiements: paiements() }).paiements;
    var max = 0;
    src.forEach(function (p) {
      var n = parseInt(p.numero.replace("PAY-", ""), 10);
      if (n > max) max = n;
    });
    return "PAY-" + pad3(max + 1);
  }
  function nextDoc() {
    var src = (load() ? db() : { documents: documents() }).documents;
    var max = 0;
    src.forEach(function (d) {
      var n = parseInt(d.id.replace("DOC-", ""), 10);
      if (n > max) max = n;
    });
    return "DOC-" + pad3(max + 1);
  }
  function nextRdv() {
    var src = (load() ? db() : { rendezvous: rendezvous() }).rendezvous;
    var max = 0;
    src.forEach(function (r) {
      var n = parseInt(r.id.replace("RDV-", ""), 10);
      if (n > max) max = n;
    });
    return "RDV-" + pad3(max + 1);
  }
  function nextEmp() {
    var src = (load() ? db() : { employes: employes() }).employes;
    var max = 0;
    src.forEach(function (e) {
      var n = parseInt(e.id.replace("E", ""), 10);
      if (n > max) max = n;
    });
    return "E" + pad3(max + 1);
  }
  function nextPatient() {
    var src = (load() ? db() : { patients: patients() }).patients;
    var max = 0;
    src.forEach(function (p) {
      var n = parseInt(p.id.replace("P", ""), 10);
      if (n > max) max = n;
    });
    return "P" + pad3(max + 1);
  }
  function initials(nom) {
    return String(nom || "").trim().split(/\s+/).slice(0, 2).map(function (w) {
      return w.charAt(0).toUpperCase();
    }).join("") || "—";
  }

  /* ---------- Couche de stockage ---------- */
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function seed() {
    return {
      patients: patients(), employes: employes(), factures: factures(),
      rendezvous: rendezvous(), dossiers: dossiers(), documents: documents(),
      paiements: paiements()
    };
  }

  function db() {
    var d = load();
    if (!d) { d = seed(); save(d); }
    return d;
  }

  function save(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* quota / privé */ }
  }

  /* ---------- Helpers génériques ---------- */
  function docOwner(d) {
    return d.ownerType === "employe" ? dbEmploye(d.ownerId) : dbPatient(d.ownerId);
  }

  /* ---------- API publique ---------- */
  window.KinoeDB = {
    reset: function () {
      var d = seed();
      save(d);
      return d;
    },
    get: function () { return db(); },

    /* --- Patients --- */
    patients: function () { return db().patients; },
    patient: function (id) { return dbPatient(id); },
    addPatient: function (data) {
      var d = db();
      if (!data || !data.nom) return null;
      var rec = {
        id: nextPatient(), nom: data.nom,
        initiales: data.initiales || initials(data.nom)
      };
      d.patients.push(rec);
      save(d);
      return rec;
    },

    /* --- Employés --- */
    employes: function () { return db().employes.slice(); },
    employe: function (id) { return dbEmploye(id); },
    addEmploye: function (data) {
      var d = db();
      var rec = {
        id: nextEmp(), nom: data.nom, initiales: data.initiales, role: data.role,
        specialite: data.specialite, planning: data.planning,
        salaire: data.salaire ? Math.round(Number(data.salaire)) : null,
        statut: data.statut
      };
      d.employes.push(rec);
      save(d);
      return rec;
    },
    updateEmploye: function (id, data) {
      var d = db();
      d.employes.forEach(function (e) {
        if (e.id === id) {
          if (data.nom) e.nom = data.nom;
          if (data.initiales) e.initiales = data.initiales;
          if (data.role) e.role = data.role;
          if (data.specialite != null) e.specialite = data.specialite;
          if (data.planning != null) e.planning = data.planning;
          if ("salaire" in data) e.salaire = data.salaire ? Math.round(Number(data.salaire)) : null;
          if (data.statut) e.statut = data.statut;
        }
      });
      save(d);
    },
    deleteEmploye: function (id) {
      var d = db();
      d.employes = d.employes.filter(function (e) { return e.id !== id; });
      save(d);
    },
    statsEmployes: function () {
      var s = { total: 0, kines: 0, secretaires: 0, vacants: 0 };
      db().employes.forEach(function (e) {
        s.total++;
        if (e.statut === "Poste vacant") s.vacants++;
        else if (e.statut === "Actif") {
          if (e.role === "Kinésithérapeute") s.kines++;
          else if (e.role === "Secrétaire") s.secretaires++;
        }
      });
      return s;
    },

    /* --- Rendez-vous --- */
    rendezvous: function () {
      return db().rendezvous.slice().sort(function (a, b) {
        return (a.date + a.heure).localeCompare(b.date + b.heure);
      });
    },
    rendezVous: function (id) {
      var found = null;
      db().rendezvous.forEach(function (r) { if (r.id === id) found = r; });
      return found;
    },
    addRendezVous: function (data) {
      var d = db();
      var rec = {
        id: nextRdv(), date: data.date, heure: data.heure, patientId: data.patientId,
        therapeuteId: data.therapeuteId, patient: dbPatient(data.patientId),
        therapeute: dbEmploye(data.therapeuteId),
        traitement: data.traitement, statut: data.statut
      };
      d.rendezvous.push(rec);
      save(d);
      return rec;
    },
    updateRendezVous: function (id, data) {
      var d = db();
      d.rendezvous.forEach(function (r) {
        if (r.id === id) {
          if (data.date) r.date = data.date;
          if (data.heure) r.heure = data.heure;
          if (data.patientId) { r.patientId = data.patientId; r.patient = dbPatient(data.patientId); }
          if (data.therapeuteId) { r.therapeuteId = data.therapeuteId; r.therapeute = dbEmploye(data.therapeuteId); }
          if (data.traitement) r.traitement = data.traitement;
          if (data.statut) r.statut = data.statut;
        }
      });
      save(d);
    },
    deleteRendezVous: function (id) {
      var d = db();
      d.rendezvous = d.rendezvous.filter(function (r) { return r.id !== id; });
      save(d);
    },
    statsRendezVous: function () {
      var s = { total: 0, confirmes: 0, attente: 0, annules: 0 };
      db().rendezvous.forEach(function (r) {
        s.total++;
        if (r.statut === "Confirmé") s.confirmes++;
        else if (r.statut === "En attente") s.attente++;
        else if (r.statut === "Annulé") s.annules++;
      });
      return s;
    },

    /* --- Dossiers médicaux --- */
    dossiers: function () { return db().dossiers.slice(); },
    dossier: function (patientId) {
      var found = null;
      db().dossiers.forEach(function (d) { if (d.patientId === patientId) found = d; });
      return found;
    },
    addDossier: function (data) {
      var d = db();
      var rec = {
        patientId: data.patientId, patient: dbPatient(data.patientId),
        age: Number(data.age) || 0, sexe: data.sexe, derniereVisite: data.derniereVisite,
        traitement: data.traitement, therapeuteId: data.therapeuteId,
        therapeute: dbEmploye(data.therapeuteId), notes: data.notes || ""
      };
      d.dossiers.push(rec);
      save(d);
      return rec;
    },
    updateDossier: function (patientId, data) {
      var d = db();
      d.dossiers.forEach(function (dd) {
        if (dd.patientId === patientId) {
          if ("age" in data) dd.age = Number(data.age) || 0;
          if (data.sexe) dd.sexe = data.sexe;
          if (data.derniereVisite) dd.derniereVisite = data.derniereVisite;
          if (data.traitement) dd.traitement = data.traitement;
          if (data.therapeuteId) { dd.therapeuteId = data.therapeuteId; dd.therapeute = dbEmploye(data.therapeuteId); }
          if ("notes" in data) dd.notes = data.notes || "";
        }
      });
      save(d);
    },

    /* --- Documents --- */
    documents: function () {
      return db().documents.slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
    },
    document: function (id) {
      var found = null;
      db().documents.forEach(function (d) { if (d.id === id) found = d; });
      return found;
    },
    addDocument: function (data) {
      var d = db();
      var rec = {
        id: nextDoc(), nom: data.nom, type: data.type, ownerType: data.ownerType,
        ownerId: data.ownerId, ownerNom: (docOwner({ ownerType: data.ownerType, ownerId: data.ownerId }) || {}).nom || "—",
        ownerInitiales: (docOwner({ ownerType: data.ownerType, ownerId: data.ownerId }) || {}).initiales || "—",
        date: data.date, tailleKo: Number(data.tailleKo) || 0
      };
      d.documents.push(rec);
      save(d);
      return rec;
    },
    updateDocument: function (id, data) {
      var d = db();
      d.documents.forEach(function (dd) {
        if (dd.id === id) {
          if (data.nom) dd.nom = data.nom;
          if (data.type) dd.type = data.type;
          if (data.ownerType && data.ownerId) {
            dd.ownerType = data.ownerType; dd.ownerId = data.ownerId;
            var o = docOwner(dd);
            dd.ownerNom = (o || {}).nom || "—";
            dd.ownerInitiales = (o || {}).initiales || "—";
          }
          if (data.date) dd.date = data.date;
          if ("tailleKo" in data) dd.tailleKo = Number(data.tailleKo) || 0;
        }
      });
      save(d);
    },
    deleteDocument: function (id) {
      var d = db();
      d.documents = d.documents.filter(function (dd) { return dd.id !== id; });
      save(d);
    },

    /* --- Paiements --- */
    paiements: function () {
      return db().paiements.slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
    },
    paiement: function (numero) {
      var found = null;
      db().paiements.forEach(function (p) { if (p.numero === numero) found = p; });
      return found;
    },
    addPaiement: function (data) {
      var d = db();
      var rec = {
        numero: nextPay(), patientId: data.patientId, patient: dbPatient(data.patientId),
        montant: Math.round(Number(data.montant) || 0), methode: data.methode,
        date: data.date, reference: data.reference || "—", statut: data.statut
      };
      d.paiements.push(rec);
      save(d);
      return rec;
    },
    updatePaiement: function (numero, data) {
      var d = db();
      d.paiements.forEach(function (p) {
        if (p.numero === numero) {
          if (data.patientId) { p.patientId = data.patientId; p.patient = dbPatient(data.patientId); }
          if (data.montant != null) p.montant = Math.round(Number(data.montant) || 0);
          if (data.methode) p.methode = data.methode;
          if (data.date) p.date = data.date;
          if ("reference" in data) p.reference = data.reference || "—";
          if (data.statut) p.statut = data.statut;
        }
      });
      save(d);
    },
    deletePaiement: function (numero) {
      var d = db();
      d.paiements = d.paiements.filter(function (p) { return p.numero !== numero; });
      save(d);
    },
    statsPaiements: function () {
      var s = { totalRecu: 0, ceMois: 0, enAttente: 0, rembourse: 0, nb: 0 };
      db().paiements.forEach(function (p) {
        if (p.statut === "Reçu" || p.statut === "Remboursé") {
          s.totalRecu += p.montant;
          if (p.date.indexOf("/09/2026") !== -1) s.ceMois += p.montant;
        }
        if (p.statut === "En attente") s.enAttente += p.montant;
        if (p.statut === "Remboursé") s.rembourse += p.montant;
        s.nb++;
      });
      return s;
    },

    /* --- Factures --- */
    factures: function () {
      return db().factures.slice().sort(function (a, b) {
        return b.numero.localeCompare(a.numero);
      });
    },
    facture: function (numero) {
      var found = null;
      db().factures.forEach(function (f) { if (f.numero === numero) found = f; });
      return found;
    },
    addFacture: function (data) {
      var d = db();
      var numero = "FAC-2026-" + String(kineoNextFactureNum(d)).padStart(4, "0");
      var rec = {
        numero: numero,
        patientId: data.patientId,
        patient: dbPatient(data.patientId),
        montant: Math.round(Number(data.montant) || 0),
        date: data.date, echeance: data.echeance, statut: data.statut
      };
      d.factures.push(rec);
      save(d);
      return rec;
    },
    updateFacture: function (numero, data) {
      var d = db();
      d.factures.forEach(function (f) {
        if (f.numero === numero) {
          if (data.patientId) { f.patientId = data.patientId; f.patient = dbPatient(data.patientId); }
          if (data.montant != null) f.montant = Math.round(Number(data.montant) || 0);
          if (data.date) f.date = data.date;
          if (data.echeance) f.echeance = data.echeance;
          if (data.statut) f.statut = data.statut;
        }
      });
      save(d);
    },
    deleteFacture: function (numero) {
      var d = db();
      d.factures = d.factures.filter(function (f) { return f.numero !== numero; });
      save(d);
    },

    /* --- Stats --- */
    statsFactures: function () {
      var s = { total: 0, payees: 0, attente: 0, retard: 0, montantTotal: 0 };
      db().factures.forEach(function (f) {
        s.total++;
        s.montantTotal += f.montant;
        if (f.statut === "Payée") s.payees++;
        else if (f.statut === "En attente") s.attente++;
        else if (f.statut === "En retard") s.retard++;
      });
      return s;
    }
  };

  function kineoNextFactureNum(d) {
    var max = 0;
    d.factures.forEach(function (f) {
      var m = f.numero.match(/(\d+)$/);
      if (m) { var n = parseInt(m[1], 10); if (n > max) max = n; }
    });
    return max + 1;
  }
})();
/* ============================================================
   KinéoGest — db.js
   Couche de données de démonstration (localStorage).
   Simule une base de données : CRUD + compteurs, persistance
   locale, données fictives. Prêt à être remplacé par une vraie
   base (Supabase / API) sans toucher aux pages.
   ============================================================ */
(function () {
  var KEY = "kineogest_db_v4";

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

  function factures() {
    return FACTURES().map(function (f) {
      return {
        numero: f[0], patientId: f[1], patient: patientById(f[1]),
        montant: f[2], date: f[3], echeance: f[4], statut: f[5]
      };
    });
  }

  function nextNumero() {
    var max = 0, cur = load(); /* cur may be null — computed from FACTURES() */
    factures().forEach(function (f) {
      var n = parseInt(f.numero.replace("FAC-2026-", ""), 10);
      if (n > max) max = n;
    });
    if (cur && cur.factures) {
      cur.factures.forEach(function (f) {
        var m = f.numero.match(/(\d+)$/);
        if (m) { var n = parseInt(m[1], 10); if (n > max) max = n; }
      });
    }
    return max + 1;
  }

  /* ---------- Couche de stockage ---------- */
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function seed() {
    return { patients: patients(), factures: factures() };
  }

  function db() {
    var d = load();
    if (!d) { d = seed(); save(d); }
    return d;
  }

  function save(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* quota / privé */ }
  }

  /* ---------- Helpers ---------- */
  function hashCode(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return Math.abs(h);
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
    patient: function (id) { return patientById(id); },

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
      var numero = "FAC-2026-" + String(nextNumero()).padStart(4, "0");
      var rec = {
        numero: numero,
        patientId: data.patientId,
        patient: patientById(data.patientId),
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
          if (data.patientId) { f.patientId = data.patientId; f.patient = patientById(data.patientId); }
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
})();
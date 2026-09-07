/* ============================================================
   KinéoGest — ui.js
   Petits helpers partagés entre les pages interactives :
   toast, formats, CSV export, pastilles de statut et d'icônes.
   ============================================================ */
(function () {
  var UI = {
    /* --- Formatage --- */
    fmtMAD: function (n) {
      return Math.round(Number(n) || 0).toLocaleString("fr-FR") + " MAD";
    },
    fmtTaille: function (ko) {
      ko = Number(ko) || 0;
      if (ko >= 1024) return (ko / 1024).toFixed(1).replace(".", ",") + " Mo";
      return ko + " Ko";
    },
    jourCourt: function (dateStr) { /* "07/09/2026" -> "Lun" */
      var parts = dateStr.split("/");
      var d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      return ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][d.getDay()] || "";
    },

    /* --- Toast --- */
    toast: function (msg) {
      var box = document.getElementById("ktoastBody");
      if (!box) return;
      box.textContent = msg;
      var t = document.getElementById("ktoast");
      if (!t) return;
      var inst = bootstrap.Toast.getOrCreateInstance(t, { delay: 2600 });
      t.classList.remove("bg-danger", "text-white");
      inst.show();
    },

    /* --- CSV export --- */
    csvExport: function (filename, headers, rows) {
      var lines = [headers].concat(rows);
      var csv = lines.map(function (r) {
        return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(';');
      }).join('\n');
      var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      UI.toast('Export CSV téléchargé (' + rows.length + ' lignes).');
    },

    /* --- Pastilles de statut --- */
    badgeFacture: function (s) {
      if (s === "Payée") return '<span class="badge-status badge-ok">Payée</span>';
      if (s === "En attente") return '<span class="badge-status badge-warn">En attente</span>';
      if (s === "En retard") return '<span class="badge-status badge-danger">En retard</span>';
      return '<span class="badge-status badge-gray">' + s + '</span>';
    },
    badgePaiement: function (s) {
      if (s === "Reçu") return '<span class="badge-status badge-ok">Reçu</span>';
      if (s === "En attente") return '<span class="badge-status badge-warn">En attente</span>';
      if (s === "Remboursé") return '<span class="badge-status badge-rh">Remboursé</span>';
      return '<span class="badge-status badge-gray">' + s + '</span>';
    },
    badgeRdv: function (s) {
      if (s === "Confirmé") return '<span class="badge-status badge-ok">Confirmé</span>';
      if (s === "En attente") return '<span class="badge-status badge-warn">En attente</span>';
      if (s === "Annulé") return '<span class="badge-status badge-danger">Annulé</span>';
      return '<span class="badge-status badge-gray">' + s + '</span>';
    },
    badgeEmploye: function (s) {
      if (s === "Actif") return '<span class="badge-status badge-ok">Actif</span>';
      if (s === "Congé") return '<span class="badge-status badge-warn">Congé</span>';
      if (s === "Poste vacant") return '<span class="badge-status badge-danger">Poste vacant</span>';
      return '<span class="badge-status badge-gray">' + s + '</span>';
    },
    badgeSms: function (s) {
      if (s === "Livré") return '<span class="badge-status badge-ok">Livré</span>';
      if (s === "En attente") return '<span class="badge-status badge-warn">En attente</span>';
      if (s === "Échoué") return '<span class="badge-status badge-danger">Échoué</span>';
      return '<span class="badge-status badge-gray">' + s + '</span>';
    },

    /* --- Couleur de fond selon spécialité --- */
    badgeSpecialite: function (s) {
      var map = {
        "Rééducation sportive": "ok",
        "Rééducation pédiatrique": "ok",
        "Masso-kinésithérapie": "sms",
        "Kiné respiratoire": "warn",
        "Accueil / planning": "rh",
        "Comptabilité": "rh",
        "Neurologie": "gray",
        "Kiné dos": "warn",
        "Rééducation genou": "ok",
        "Rééducation cheville": "ok",
        "Rééducation main": "ok",
        "Masso-thérapie": "sms",
        "Suivi post-opératoire": "sms",
        "Kiné pédiatrique": "sms",
        "Drainage lymphatique": "gray",
        "Rééducation épaule": "ok"
      };
      var cls = map[s] || "gray";
      return '<span class="badge-status badge-' + cls + '">' + s + '</span>';
    },

    /* --- Icône de document selon type --- */
    docIcon: function (type) {
      if (type === "Imagerie") return 'bi-file-earmark-image';
      if (type === "RH") return 'bi-file-earmark-person';
      if (type === "Bilan") return 'bi-file-earmark-text';
      return 'bi-file-earmark-text';
    },
    docColor: function (type) {
      if (type === "Prescription") return '#dc2626';
      if (type === "Imagerie") return '#0369a1';
      if (type === "RH") return '#7c3aed';
      if (type === "Bilan") return '#16a34a';
      return '#64748b';
    },
    badgeDocType: function (t) {
      var map = { "Prescription": "sms", "Imagerie": "gray", "RH": "rh", "Bilan": "ok" };
      return '<span class="badge-status badge-' + (map[t] || "gray") + '">' + t + '</span>';
    },

    /* --- Fonctions génériques de modale --- */
    openModal: function (id) {
      var el = document.getElementById(id);
      if (el && window.bootstrap) bootstrap.Modal.getOrCreateInstance(el).show();
    },
    closeModal: function (id) {
      var el = document.getElementById(id);
      if (el && window.bootstrap) bootstrap.Modal.getOrCreateInstance(el).hide();
    },

    resetDemo: function (entity, label) {
      if (!confirm('Réinitialiser toutes les données de démonstration ?')) return;
      KinoeDB.reset();
      if (window.renderUI) renderUI();
      UI.toast('Démo réinitialisée.');
    }
  };

  window.KinoeUI = UI;
})();
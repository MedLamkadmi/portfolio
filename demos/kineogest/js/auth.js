/* ============================================================
   KinéoGest — auth.js
   Authentification et contrôle d'accès (démo, localStorage).
   - Session : kineogest_session_v1 (employé connecté + rôle)
   - Rôles : admin (administration complète) / kine (son
     cabinet : clients, RDV, dossiers) / secretaire (planning,
     patients, facturation).
   - Guard de page : KinoeAuth.protect([roles]) redirige vers
     login.html si non autorisé.
   - Scoping : KinoeAuth.scopeFilter() limite un praticien à ses
     propres rendez-vous / dossiers.
   Un accès réel remplacera cette couche par JWT / API.
   ============================================================ */
(function () {
  var KEY = "kineogest_session_v1";
  var NEXT = "kineogest_next";
  var PWD = "demo2026";

  /* Rôle d'accès par défaut selon l'employé (le rôle métier reste
     celui du dossier). Les employés ajoutés à l'exécution héritent
     d'un rôle calculé d'après leur poste. */
  var ROLE_BY_ID = {
    E001: "admin",      /* Dr Rachid Bensaid — médecin chef */
    E002: "kine", E003: "kine", E005: "kine", E007: "kine",
    E004: "secretaire", E006: "secretaire"
  };
  var ROLE_LABEL = { admin: "Administrateur", kine: "Kinésithérapeute", secretaire: "Secrétaire" };

  function roleOf(emp) {
    if (ROLE_BY_ID[emp.id]) return ROLE_BY_ID[emp.id];
    if (String(emp.role).indexOf("Secrétaire") !== -1) return "secretaire";
    return "kine";
  }

  function loadSession() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || !s.id || !s.role) return null;
      if (!KinoeDB.employe(s.id)) return null;
      return s;
    } catch (e) { return null; }
  }

  var Auth = {
    password: PWD,
    ROLE_LABEL: ROLE_LABEL,
    DEMO_ACCOUNTS: [
      { id: "E001", label: "Administrateur — Dr Rachid Bensaid" },
      { id: "E002", label: "Kinésithérapeute — Salma Lahlou" },
      { id: "E004", label: "Secrétaire — Nadia Fikri" }
    ],
    demoAccounts: function () {
      return this.DEMO_ACCOUNTS.map(function (a) {
        var emp = KinoeDB.employe(a.id);
        return { id: a.id, label: a.label, nom: emp ? emp.nom : a.label, initials: emp ? emp.initiales : "--" };
      });
    },

    /* Retourne {ok, user?, error?} */
    login: function (id, password) {
      var emp = KinoeDB.employe(String(id).trim());
      if (!emp) return { ok: false, error: "Employé introuvable." };
      if (String(password) !== PWD) return { ok: false, error: "Identifiants incorrects." };
      if (emp.statut === "Poste vacant") return { ok: false, error: "Accès refusé — poste vacant." };
      var user = {
        id: emp.id, nom: emp.nom, initiales: emp.initiales, role: roleOf(emp),
        poste: emp.role, specialite: emp.specialite, at: Date.now()
      };
      try { localStorage.setItem(KEY, JSON.stringify(user)); } catch (e) {}
      return { ok: true, user: user };
    },

    logout: function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
    },

    current: function () { return loadSession(); },
    is: function (role) { var c = this.current(); return !!c && c.role === role; },
    can: function (roles) {
      var c = this.current();
      return !!c && ("" + roles).split(",").indexOf(c.role) !== -1;
    },

    /* Redirige vers login.html si le rôle ne permet pas l'accès. */
    protect: function (roles) {
      if (this.can(roles)) return true;
      try { sessionStorage.setItem(NEXT, location.href); } catch (e) {}
      location.replace("login.html");
      return false;
    },

    /* Filtre pratique pour un praticien : ses propres enregistrements
       (rdv / dossiers / rappels). admin & secretaire : aucun filtre. */
    scopeFilter: function () {
      var c = this.current();
      if (!c || c.role !== "kine") return null;
      return function (rec) { return rec.therapeuteId === c.id; };
    },

    /* IDs des clients d'un praticien (dossiers + RDV lui appartenant). */
    clientIds: function () {
      var c = this.current();
      if (!c || c.role !== "kine") return null;
      var ids = {};
      KinoeDB.dossiers().forEach(function (d) { if (d.therapeuteId === c.id) ids[d.patientId] = 1; });
      KinoeDB.rendezvous().forEach(function (r) { if (r.therapeuteId === c.id) ids[r.patientId] = 1; });
      return Object.keys(ids).sort();
    },

    /* Panel d'identité dans la barre latérale + avatar déconnectable. */
    hook: function () {
      var c = this.current();
      if (!c) return;
      var ROUTES = {
        'index.html': ['admin', 'secretaire', 'kine'],
        'mon-espace.html': ['admin', 'secretaire', 'kine'],
        'dossiers-medicaux.html': ['admin', 'secretaire', 'kine'],
        'rendez-vous.html': ['admin', 'secretaire', 'kine'],
        'emploi-du-temps.html': ['admin', 'secretaire', 'kine'],
        'rappels-sms.html': ['admin', 'secretaire', 'kine'],
        'nouveau-patient.html': ['admin', 'secretaire', 'kine'],
        'rechercher.html': ['admin', 'secretaire', 'kine'],
        'documents.html': ['admin', 'secretaire'],
        'stock.html': ['admin', 'secretaire'],
        'factures.html': ['admin', 'secretaire'],
        'paiements.html': ['admin', 'secretaire'],
        'rapports.html': ['admin', 'secretaire'],
        'employes.html': ['admin'],
        'parametres.html': ['admin']
      };
      Object.keys(ROUTES).forEach(function (page) {
        if (ROUTES[page].indexOf(c.role) !== -1) return;
        document.querySelectorAll('.sidebar-menu a[href$="' + page + '"]').forEach(function (a) {
          var li = a.closest('li');
          if (li) li.style.display = 'none';
        });
      });
      var avatar = document.querySelector(".topbar .avatar");
      if (avatar) {
        avatar.textContent = c.initiales;
        avatar.title = "Déconnexion — " + c.nom + " (" + ROLE_LABEL[c.role] + ")";
        avatar.style.cursor = "pointer";
        avatar.onclick = function () {
          if (confirm("Se déconnecter de " + c.nom + " ?")) { Auth.logout(); location.href = "login.html"; }
        };
      }
      var box = document.querySelector(".sidebar-upgrade");
      if (box) {
        box.innerHTML =
          '<b><i class="bi bi-person-badge"></i> ' + c.nom + '</b>' +
          '<span class="badge-status mt-1" style="background:' + (c.role === "admin" ? "#ede9fe;color:#7c3aed" : c.role === "secretaire" ? "#fef3c7;color:#d97706" : "#ccfbf1;color:#0f766e") + '">' +
          (c.role === "admin" ? '<i class="bi bi-shield-lock"></i> ' : c.role === "secretaire" ? '<i class="bi bi-pencil-square"></i> ' : '<i class="bi bi-heart-pulse"></i> ') +
          ROLE_LABEL[c.role] + '</span>' +
          '<div class="mt-2 d-flex flex-column gap-1">' +
          '<a href="mon-espace.html" style="color:var(--accent-light);text-decoration:none;font-size:12px"><i class="bi bi-person-workspace"></i> Mon espace</a>' +
          '<a href="#" onclick="KinoeAuth.logout();location.href=\'login.html\';return false;" style="color:#fca5a5;text-decoration:none;font-size:12px"><i class="bi bi-box-arrow-right"></i> Déconnexion</a>' +
          '</div>';
      }
    }
  };

  window.KinoeAuth = Auth;
})();
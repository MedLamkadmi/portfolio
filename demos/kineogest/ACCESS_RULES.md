# Règles d'accès et de fonctionnement — KinéoGest

Version v2 · 07/09/2026 · Document de référence (démo et production)

## 1. Rôles

| Rôle | Comptes démo | Postes | Principe |
|---|---|---|---|
| **Admin** | E001 — Dr Rachid Bensaid | Administrateur / Kinésithérapeute | Propriétaire du cabinet : tout voir, tout faire |
| **Secrétaire** | E004 — Nadia Fikri (+ E006) | Secrétaire | Accueil, planning, dossiers administratifs, encaissements |
| **Kinésithérapeute** | E002 Salma Lahlou, E003 Amine Kadiri, E005 Youssef Alaoui, E007 Karim Benjelloun | Kinésithérapeute | Soins : accès médical complet et partagé |

- Mot de passe démo unique : `demo2026` (production : comptes Supabase individuels).
- Un employé dont le poste est « Poste vacant » ne peut pas se connecter.

## 2. Principes généraux

1. **Toute page exige une session** : sans connexion, redirection vers `login.html`.
2. **Sidebar filtrée** : chaque rôle ne voit que les pages autorisées (map centrale de routes).
3. **Patients partagés entre kinés** : aucun cloisonnement par patient. Tout kiné consulte et traite les patients de tous les autres kinés, avec tout l'historique.
4. **Traçabilité totale** : chaque acte clinique est attribué à un kiné, horodaté, et alimente l'historique « qui a fait quoi, quand » du patient. Les interventions sont en ajout seul (append-only) : un kiné ne peut pas effacer une intervention ; l'admin peut corriger.
5. **Référent du dossier** : kiné responsable actuel. Le suivi peut passer d'un kiné à l'autre ; la liste des intervenants présents et passés est conservée.
6. **Confidentialité financière** : les kinés ne voient ni factures, ni paiements, ni salaires, ni rapports financiers consolidés.
7. **Gestion du personnel** : réservée à l'admin (rôles, salaires, statuts).
8. Les données sont fictives en démo (localStorage) ; la logique d'accès est identique en production (Supabase).

## 3. Matrice d'accès par page

| Page | Admin | Secrétaire | Kiné | Visibilité des données | Actions notables |
|---|---|---|---|---|---|
| `login.html` | ✓ | ✓ | ✓ | — | authentification ; accueil selon rôle |
| `index.html` | ✓ | ✓ | ✓ | Indicateurs globaux ; carte « Encaissements » cachée aux kinés | nouveau RDV, recherche, rappels |
| `mon-espace.html` | ✓ | ✓ | ✓ | Contenu différent par rôle (voir §4) | voir §4 |
| `dossiers-medicaux.html` | ✓ | ✓ | ✓ | Tous les patients (partagé) + équipe de suivi + historique des interventions | kiné/admin : ajout d'intervention ; secrétaire : lecture + données administratives |
| `rendez-vous.html` | ✓ | ✓ | ✓ | Tous les RDV (partagé) | admin/sec : tout ; kiné : création/modification verrouillée sur lui-même |
| `emploi-du-temps.html` | ✓ | ✓ | ✓ | Grille semaine complète et partagée | admin/sec : ajouter ; kiné : imprimer |
| `nouveau-patient.html` | ✓ | ✓ | ✓ | — | référent = créateur ; kiné verrouillé sur lui-même ; admin peut réaffecter |
| `rechercher.html` | ✓ | ✓ | ✓ | Recherche globale sur tous les patients (partagé) | ouvrir dossier, créer RDV (kiné : soi), facturer (admin/sec) |
| `rappels-sms.html` | ✓ | ✓ | ✓ (lecture) | Rappels de tous les patients | admin/sec : planifier + envoyer ; kiné : consultation |
| `documents.html` | ✓ | ✓ | ✗ | Classeur administratif global | les documents médicaux du patient vivent dans son dossier (kiné/admin/sec) |
| `factures.html` | ✓ | ✓ | ✗ | Liste des factures clients | création / statut / encaissement (sec), règles (admin) |
| `paiements.html` | ✓ | ✓ | ✗ | Journal des paiements | saisie encaissement (sec), validation (admin) |
| `rapports.html` | ✓ | ✓ | ✗ | Indicateurs financiers + activité | export (admin) |
| `employes.html` | ✓ | ✗ | ✗ | Équipe, rôles, salaires, statuts | recrutement, salaires, accès |
| `parametres.html` | ✓ | ✗ | ✗ | Configuration du cabinet | profil, paramètres |

## 4. Mon espace — contenu par rôle

- **Admin** : pilotage — indicateurs clés, équipe, répartition des RDV par kiné, alertes.
- **Secrétaire** : réception — agenda du jour (confirmer/annuler RDV), factures à encaisser, RDV à confirmer, encaissements du mois.
- **Kiné** : cabinet — *mes patients suivis* (référents + patients sur lesquels j'ai déjà intervenu), *mes prochains RDV*, *mes dernières interventions*.

## 5. Historique des interventions (traçabilité)

- Collection `interventions` : `{ date, patientId, therapeuteId, type, duree, note }` — séance, compte-rendu, reprise de patient, etc.
- Affichée en timeline dans le dossier patient : « qui a fait quoi, quand ».
- Quand un kiné reprend un patient d'un autre : intervention « Reprise du suivi » ; le référent bascule, l'ancien kiné reste visible dans l'équipe de suivi.

## 6. Changements à appliquer par rapport à la version précédente

1. Retirer le cloisonnement kiné (dossiers, RDV, recherche, rappels, emploi du temps).
2. Ajouter les interventions (seed + API + timeline + formulaire).
3. Colonne « Équipe de suivi » dans la liste des dossiers.
4. Cacher la carte « Encaissements du mois » pour les kinés sur `index.html`.
5. `rappels-sms.html` : kiné en lecture seule.
6. `emploi-du-temps.html` : grille complète pour tous les rôles.
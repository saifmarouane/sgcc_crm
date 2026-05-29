# Audit V1 - CRM Suzana Global Call Center

Date d'audit: 2026-05-29

## 1. Resume de l'architecture actuelle

Le projet est une application Next.js App Router en TypeScript. Le backend est implemente dans les routes API Next.js sous `app/api`, avec une couche domaine separee sous `domains`. Il n'y a pas de serveur backend Express separe.

Stack identifiee:

- Next.js 15.3, React 19, TypeScript strict.
- MongoDB via le driver officiel `mongodb`.
- Authentification par JWT avec `jsonwebtoken`.
- Hash des mots de passe avec `bcryptjs`.
- Stockage fichiers local dans `public/uploads`.
- Pas de framework de tests applicatifs configure.
- Script de verification Node.js: Node 22, 23 ou 24 obligatoire.

Structure backend:

- `lib/mongodb.ts`: connexion MongoDB mutualisee par cache global.
- `domains/auth`: authentification, utilisateurs, JWT, mapping public.
- `domains/users`: controller CRUD utilisateurs base sur `AuthService`.
- `domains/departments`: gestion des departements/equipes.
- `domains/documents`: stockage des references de documents/factures.
- `domains/nombre-ventes`: compteur de ventes par agent et document.
- `domains/agent`: routes specifiques agent pour inserer et consulter ses ventes.
- `domains/scores`: score numerique par utilisateur.
- `domains/notifications`: notifications simples par utilisateur.
- `domains/agent-statistics`: agregation statistiques agents.
- `domains/shared`: helpers HTTP, AppError, auth middleware.

Structure frontend:

- `app/login/page.tsx`: page de connexion.
- `app/admin/page.tsx`: console admin pour agents, departements et ventes.
- `app/agent/page.tsx`: espace agent pour profil et insertion de ventes/factures.
- `app/statistiques-agents/page.tsx`: tableau de bord statistiques agents.
- `components/AgentStatisticsDashboard.tsx`: composant dashboard statistiques.
- `app/theme.css` et `app/globals.css`: styles globaux.

Base de donnees:

- MongoDB, configuree avec `MONGODB_URI` et `MONGODB_DB`.
- Collections identifiees: `users`, `departments`, `documents`, `nombre_ventes`, `scores`, `notifications`.
- Les index sont crees au runtime par les repositories.

Authentification:

- Login via `POST /api/auth/login`.
- Le token JWT est retourne au frontend et stocke dans `localStorage` sous `sgcc_token`.
- Les routes protegees attendent un header `Authorization: Bearer <token>`.
- Payload JWT: `sub`, `email`, `role`, `department_id`.
- Roles existants: `admin`, `manager`, `agent`.
- Le role `manager` existe dans le type et dans l'interface admin, mais aucune interface ni politique backend specifique superviseur n'est implementee.

## 2. Fonctionnalites existantes

Fonctionnalites backend existantes:

- Inscription/login utilisateur.
- Lecture et mise a jour du profil courant.
- CRUD admin des utilisateurs.
- CRUD admin des departements.
- Liste des departements accessible a tout utilisateur authentifie.
- CRUD partiel des documents.
- Upload de fichiers profile/document vers `public/uploads`.
- Insertion de ventes par agent avec une ou plusieurs factures.
- Ajout de documents a une vente existante par l'agent proprietaire.
- Consultation des ventes d'un agent connecte.
- Consultation admin de toutes les ventes.
- Suppression admin de ventes.
- CRUD scores.
- CRUD notifications.
- Dashboard statistiques agents base sur utilisateurs, departements, documents et ventes.
- Ping MongoDB via `/api/db/ping`.

Fonctionnalites frontend existantes:

- Login avec redirection admin ou agent.
- Espace admin:
  - creation/modification/suppression d'agents;
  - creation/suppression de departements;
  - liste et suppression des ventes;
  - consultation rapide d'un profil agent.
- Espace agent:
  - consultation/mise a jour profil;
  - upload photo profil;
  - insertion vente avec documents;
  - ajout de documents a une vente existante;
  - liste des ventes personnelles.
- Page statistiques agents:
  - total agents, ventes, factures, departements;
  - moyenne ventes par agent;
  - classement agents par ventes.

## 3. Fonctionnalites manquantes

Ecarts principaux par rapport aux besoins V2:

- Aucun module Leads.
- Aucun module Dossiers.
- Aucun workflow de statuts commerciaux.
- Aucun modele Client.
- Aucun modele CommissionRule.
- Aucun modele Commission.
- Aucun calcul automatique de commission.
- Aucune validation acompte/solde.
- Aucun module Appointment/Agenda.
- Aucun ActivityLog ou historique sensible.
- Aucun export Excel/PDF.
- Aucun dashboard V2 base sur leads, dossiers, signatures, poses et commissions.
- Aucun verrouillage des champs apres signature.
- Aucune detection de doublons leads/clients.
- Aucune pagination ou recherche standardisee sur les listes.
- Aucun test applicatif.
- Aucun role metier explicite `responsable_commercial` ou `superviseur`; le mapping actuel est seulement `admin`, `manager`, `agent`.

## 4. Modeles existants

### User

Collection: `users`

Champs actuels:

- `_id`
- `name`
- `email`
- `phone`
- `image`
- `role`: `admin | manager | agent`
- `department_id`
- `passwordHash`
- `createdAt`
- `updatedAt`

Ecarts cible V2:

- La V2 demande `first_name`, `last_name`, `team_id`, `photo`, `monthly_goal`, `is_active`.
- Le modele actuel utilise `name`, `department_id`, `image`.
- Pas de statut actif/inactif.

### Department

Collection: `departments`

Champs:

- `_id`
- `name`
- `createdAt`
- `updatedAt`

Cette entite peut probablement servir de base a `team_id`, mais le sens metier doit etre clarifie.

### Document

Collection: `documents`

Champs:

- `_id`
- `user_id`
- `document_file`
- `createdAt`
- `updatedAt`

### NombreVente

Collection: `nombre_ventes`

Champs:

- `_id`
- `user_id`
- `document_id`
- `document_ids`
- `reference`
- `motif`
- `nombre_vente`
- `saleInsertedAt`
- `createdAt`
- `updatedAt`

Ce modele represente une vente/facture V1, pas un dossier commercial V2.

### Score

Collection: `scores`

Champs:

- `_id`
- `user_id`
- `score`
- `scoreUpdatedAt`
- `createdAt`
- `updatedAt`

### Notification

Collection: `notifications`

Champs:

- `_id`
- `user_id`
- `notification`
- `createdAt`
- `updatedAt`

## 5. Routes/API existantes

Auth:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `PATCH /api/auth/me`

Users:

- `GET /api/users`
- `POST /api/users`
- `GET /api/users/:id`
- `PATCH /api/users/:id`
- `DELETE /api/users/:id`

Departments:

- `GET /api/departments`
- `POST /api/departments`
- `GET /api/departments/:id`
- `PATCH /api/departments/:id`
- `DELETE /api/departments/:id`

Documents:

- `GET /api/documents`
- `POST /api/documents`
- `GET /api/documents/:id`
- `PATCH /api/documents/:id`
- `DELETE /api/documents/:id`

Nombre ventes:

- `GET /api/nombre-ventes`
- `POST /api/nombre-ventes`
- `GET /api/nombre-ventes/:id`
- `PATCH /api/nombre-ventes/:id`
- `DELETE /api/nombre-ventes/:id`

Agent ventes:

- `GET /api/agent/ventes`
- `POST /api/agent/ventes`
- `PATCH /api/agent/ventes`

Scores:

- `GET /api/scores`
- `POST /api/scores`
- `GET /api/scores/:id`
- `PATCH /api/scores/:id`
- `DELETE /api/scores/:id`

Notifications:

- `GET /api/notifications`
- `POST /api/notifications`
- `GET /api/notifications/:id`
- `PATCH /api/notifications/:id`
- `DELETE /api/notifications/:id`

Statistiques et utilitaires:

- `GET /api/statistiques-agents`
- `POST /api/uploads`
- `GET /api/db/ping`

## 6. Problemes detectes

Problemes de securite et permissions:

- `POST /api/auth/register` est public et peut creer des utilisateurs sans protection admin.
- Les controllers `documents`, `scores` et `notifications` n'appliquent pas d'authentification ou role backend.
- `GET /api/statistiques-agents` n'est pas protege, donc les statistiques agents sont publiques.
- Le frontend protege les pages admin/agent par verification client, mais il n'y a pas de middleware Next.js de protection serveur pour les pages.
- Les tokens sont stockes dans `localStorage`, ce qui expose plus facilement le token en cas de XSS.
- Les routes de documents permettent potentiellement de lire/modifier/supprimer des documents hors proprietaire.

Problemes metier:

- `manager` existe mais n'a pas de regles d'acces equipe.
- Les roles V2 ne sont pas normalises: `admin` peut correspondre au responsable commercial, `manager` au superviseur, mais ce n'est pas formalise.
- `department_id` joue probablement le role d'equipe, mais il n'y a pas de relation superviseur/equipe explicite.
- Les ventes V1 ne contiennent pas assez d'informations pour devenir automatiquement des dossiers V2.
- Aucune historisation des actions sensibles.

Problemes techniques:

- Deux definitions de `AppError` existent: `domains/auth/auth.errors.ts` et `domains/shared/app-error.ts`.
- Deux helpers `getBearerToken` existent: `domains/auth/auth.controller.ts` et `domains/shared/auth.ts`.
- Certains repositories creent des index a chaque appel sans cache (`scores`, `notifications`).
- Pas de validation de type centralisee ou schema runtime.
- Pas de pagination sur les listes potentiellement volumineuses.
- Upload local dans `public/uploads`, fragile en production serverless ou multi-instance.
- Les fichiers generes/uploades sont presents dans le repo de travail sous `public/uploads`.
- Beaucoup de changements non commites sont deja presents dans le workspace; toute modification doit eviter les resets ou restaurations globales.
- Pas de structure de tests applicatifs; `npm run lint` pointe vers `next lint`, commande obsolete/incompatible dans certains projets Next.js recents.

Risques avant modification:

- Introduire V2 directement dans les modeles V1 pourrait casser les ecrans admin/agent existants.
- Modifier les roles sans strategie de migration peut bloquer les comptes actuels.
- Ajouter des contraintes MongoDB sur des collections existantes peut echouer si les donnees actuelles sont incoherentes.
- Le calcul de commissions depend d'une grille complete qui n'est pas encore dans le repository.
- La migration `department_id` vers `team_id` doit etre progressive pour garder la compatibilite.

## 7. Plan d'implementation recommande

### Phase 1 - Stabilisation de l'existant

- Conserver la V1 fonctionnelle.
- Formaliser les roles metier avec mapping:
  - `agent` = agent commercial;
  - `manager` = superviseur;
  - `admin` = responsable commercial.
- Ajouter des constantes metier partagees pour roles, statuts leads, statuts dossiers, statuts commissions, produits, couleurs, secteurs, surfaces et types source.
- Centraliser `AppError`, `requireAuth`, `requireRole` et supprimer progressivement les doublons.
- Proteger backend les routes actuellement ouvertes: documents, scores, notifications, statistiques.
- Restreindre ou retirer l'inscription publique selon decision metier.
- Ajouter une base `ActivityLog` avant les actions sensibles V2.

### Phase 2 - Leads

- Creer le domaine `leads` avec types, repository, mapper, service, controller et routes API.
- Champs MVP: nom, prenom, telephone, email, adresse, source, produit souhaite, surface approximative, secteur, statut, agent assigne, notes, date premier contact.
- Appliquer les permissions backend:
  - agent: uniquement ses leads;
  - manager: leads de son equipe;
  - admin: tous les leads.
- Ajouter detection doublon telephone/email.
- Ajouter page ou section frontend pour liste, creation, edition et qualification.

### Phase 3 - Dossiers et workflow

- Creer le domaine `dossiers`.
- Ajouter creation directe et conversion lead vers dossier.
- Implementer workflow de statuts recommande.
- Valider les transitions de statuts cote service.
- Historiser les changements de statut et champs sensibles.
- Ajouter filtres par statut, agent, secteur, produit et dates.

### Phase 4 - Grille de commissions

- Creer `commission-rules` avec unicite logique sur produit, couleur, secteur, surface, type source, version active.
- Ajouter activation/desactivation et dates de validite.
- Ajouter interface admin/responsable commercial pour gerer la grille.
- Importer la grille complete quand elle sera fournie.

### Phase 5 - Calcul et validation commissions

- Creer `commissions` et un service dedie `CommissionCalculationService`.
- Au statut signature, calculer la commission depuis la regle active.
- Stocker les montants calcules et la regle utilisee pour figer l'historique.
- Interdire toute modification manuelle par agent.
- Autoriser validation acompte/solde seulement a `admin`.
- Rendre le solde validable seulement apres statut pose.
- Historiser calculs, validations et paiements.

### Phase 6 - Agenda

- Creer `appointments` rattache aux dossiers.
- Permettre creation/modification/annulation/report.
- Prevoir `reminder_channel` et `reminder_sent` sans integration externe lourde au MVP.
- Appliquer les memes scopes agent/equipe/global.

### Phase 7 - Dashboard et rapports

- Creer endpoints dashboard `me`, `team`, `global`.
- Calculer uniquement les KPI supportes par les donnees disponibles.
- Signaler les KPI non calculables sans telephonie/RH/satisfaction.
- Ajouter exports Excel commissions/performance/dossiers en respectant les permissions.
- Ajouter tests sur les regles critiques.

### Phase 8 - Tests et verification

- Ajouter une stack de tests adaptee au projet, par exemple Vitest pour services et tests d'integration API si faisable.
- Couvrir les cas demandes:
  - creation lead;
  - conversion lead vers dossier;
  - creation dossier;
  - changement statut;
  - calcul commission avec regle;
  - erreur sans regle;
  - validation acompte/solde par admin;
  - refus validation par agent;
  - scopes agent, superviseur, responsable.
- Verifier apres chaque phase:
  - `npm run build`;
  - lancement `npm run dev`;
  - tests automatises une fois ajoutes.


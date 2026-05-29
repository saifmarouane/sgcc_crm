# README — Mission Codex : Évolution CRM Suzana V1 vers V2

## Contexte

Ce projet est un CRM interne pour **Suzana Global Call Center**.

Une **version 1 simple existe déjà**. Elle contient probablement une première base fonctionnelle : gestion basique des utilisateurs, leads, dossiers ou tableaux simples.

L’objectif de cette mission n’est pas de tout réécrire immédiatement, mais de :

1. Lire et comprendre le projet existant.
2. Identifier l’architecture actuelle.
3. Comprendre ce qui est déjà fait.
4. Comparer l’existant avec les besoins métier de la V2.
5. Proposer une évolution propre, progressive et maintenable.
6. Implémenter les fonctionnalités manquantes sans casser la V1.

---

# Objectif général de la V2

Faire évoluer le CRM vers une solution plus complète permettant de gérer :

* Les leads.
* Les dossiers clients.
* Les statuts du cycle commercial.
* Les agents et leurs rôles.
* Le calcul automatique des commissions.
* La validation des commissions.
* Les rendez-vous.
* Les tableaux de bord KPI.
* Les rapports et exports.

Le CRM doit couvrir le cycle complet :

```text
Lead → Qualification → Dossier → RDV → Devis → Signature → Acompte → Dépôt MPR → Pose → Solde → Archivage
```

---

# Règle principale pour Codex

Avant toute modification, Codex doit obligatoirement :

1. Lire la structure complète du projet.
2. Identifier le framework utilisé.
3. Identifier les modèles / tables / entités existants.
4. Identifier les routes / controllers / services existants.
5. Identifier le système d’authentification existant.
6. Identifier les rôles déjà présents.
7. Identifier les composants frontend existants.
8. Vérifier les conventions de nommage.
9. Vérifier les migrations existantes.
10. Comprendre comment lancer le projet.

Codex ne doit pas supprimer ou réécrire une partie existante sans justification.

---

# Étape 1 — Analyse de l’existant

## À faire

Créer un document ou un résumé technique contenant :

* Stack technique utilisée.
* Architecture actuelle.
* Liste des modules existants.
* Liste des modèles existants.
* Liste des routes/API existantes.
* Liste des pages frontend existantes.
* Liste des fonctionnalités déjà opérationnelles.
* Liste des fonctionnalités incomplètes.
* Liste des problèmes techniques détectés.
* Liste des risques avant modification.

## Résultat attendu

Avant de coder, produire un plan clair :

```text
1. Ce qui existe déjà
2. Ce qui manque
3. Ce qui peut être réutilisé
4. Ce qui doit être refactorisé
5. Ce qui doit être ajouté
6. Plan d’implémentation recommandé
```

---

# Modules fonctionnels à construire ou améliorer

## 1. Module Authentification & rôles

### Rôles attendus

* Agent commercial
* Superviseur
* Responsable commercial / Admin

### Règles d’accès

| Module         | Agent                       | Superviseur            | Responsable commercial  |
| -------------- | --------------------------- | ---------------------- | ----------------------- |
| Leads          | Créer et voir les siens     | Voir tous, assigner    | Accès complet           |
| Dossiers       | Créer et modifier les siens | Voir tous, modifier    | Accès complet           |
| Commissions    | Voir les siennes            | Voir toutes en lecture | Valider et marquer payé |
| Agents         | Voir son profil             | Voir l’équipe          | Gérer les profils       |
| Dashboard      | Ses KPI                     | KPI équipe             | KPI global              |
| Agenda         | Ses RDV                     | Planning équipe        | Planning global         |
| Admin / grille | Aucun accès                 | Lecture seule          | Accès complet           |
| Rapports       | Ses rapports                | Rapports équipe        | Tous rapports + exports |

### À vérifier dans la V1

* Est-ce que l’authentification existe déjà ?
* Est-ce qu’il y a déjà des rôles ?
* Est-ce que les permissions sont bien appliquées côté backend ?
* Est-ce que le frontend masque correctement les actions non autorisées ?

---

## 2. Module Leads

### Objectif

Permettre aux agents de créer et qualifier des prospects.

### Champs attendus

* Nom
* Prénom
* Téléphone
* Email
* Adresse
* Source : `CALL` ou `REGIES`
* Produit envisagé
* Surface approximative
* Secteur
* Agent responsable
* Statut
* Notes
* Date de premier contact

### Statuts possibles

* Nouveau lead
* Qualifié
* Non qualifié
* Converti en dossier
* Perdu

### Fonctionnalités

* Créer un lead.
* Modifier un lead.
* Voir ses leads.
* Filtrer les leads.
* Rechercher un lead.
* Détecter les doublons par téléphone ou email.
* Convertir un lead qualifié en dossier.

### Règles métier

* Un agent voit uniquement ses leads.
* Un superviseur voit tous les leads.
* Un responsable commercial voit tout.
* Un lead ne peut être converti que s’il contient les informations nécessaires.
* Un lead converti doit rester lié au dossier créé.

---

## 3. Module Dossiers clients

### Objectif

Suivre le cycle complet d’un dossier client.

### Champs attendus

* Client
* Lead d’origine
* Agent responsable
* Produit
* Couleur
* Secteur
* Surface
* Type : `CALL` ou `REGIES`
* Statut dossier
* Date premier contact
* Date RDV
* Date devis envoyé
* Date signature
* Date dépôt MPR
* Date pose
* Notes
* Historique des actions

### Produits possibles

* PAC/SSC
* PAC/BTD
* PAC DUO
* PAC/BS
* SSC
* PAC/BE

### Couleurs possibles

* BLEU
* JAUNE
* VIOLET

### Secteurs possibles

* H1
* H2
* H3

### Surfaces possibles

* `<70`
* `70-89`
* `90-109`
* `110-130`
* `>130`

### Statuts recommandés

```text
NOUVEAU
QUALIFIE
RDV_PLANIFIE
DEVIS_ENVOYE
SIGNE_ACOMPTE_A_VALIDER
ACOMPTE_VALIDE
DEPOT_MPR
POSE_SOLDE_A_VALIDER
SOLDE_VALIDE
ARCHIVE
ANNULE
PERDU
```

### Règles métier

* Un dossier doit toujours être rattaché à un agent.
* Le produit, la couleur, le secteur, la surface et le type sont obligatoires pour calculer une commission.
* Après signature, les champs impactant la commission doivent être verrouillés ou soumis à validation.
* Toute modification importante doit être historisée.
* Les dossiers sans action depuis plus de 30 jours doivent être signalés.

---

## 4. Module Commissions automatiques

### Objectif

Calculer automatiquement les commissions selon une grille tarifaire.

### Données nécessaires

La commission dépend de :

* Produit
* Couleur
* Secteur
* Surface
* Type : `CALL` ou `REGIES`

### Données calculées

* Commission totale
* Acompte signature
* Solde à la pose

### Exemple métier

Pour :

```text
Produit : PAC/BS
Couleur : BLEU
Secteur : H1
Surface : >130
Type : REGIES
```

Résultat attendu :

```text
Commission totale : 3500 €
Acompte signature : 1250 €
Solde à la pose : 2250 €
```

### Fonctionnalités

* Créer une grille de commissions.
* Modifier une grille.
* Désactiver une règle.
* Calculer automatiquement la commission à la signature.
* Créer une commission liée au dossier.
* Séparer acompte et solde.
* Permettre au responsable commercial de valider l’acompte.
* Permettre au responsable commercial de valider le solde.
* Marquer une commission comme payée.
* Historiser les validations.

### Statuts de commission recommandés

```text
CALCULEE
ACOMPTE_EN_ATTENTE
ACOMPTE_VALIDE
ACOMPTE_PAYE
SOLDE_EN_ATTENTE
SOLDE_VALIDE
SOLDE_PAYE
SOLDEE
ANNULEE
```

### Règles métier

* L’agent ne peut pas modifier manuellement une commission.
* Le superviseur peut consulter mais ne peut pas valider.
* Seul le responsable commercial peut valider.
* Une commission doit conserver la règle tarifaire utilisée au moment du calcul.
* Si aucune règle ne correspond, le système doit afficher une erreur claire.
* Une modification du dossier après calcul doit déclencher une alerte.

---

## 5. Module Agents & équipe

### Objectif

Suivre les profils, objectifs et performances des agents.

### Données attendues

* Nom complet
* Email
* Téléphone
* Photo
* Rôle
* Équipe
* Objectif mensuel
* Dossiers ouverts
* Dossiers signés
* Dossiers posés
* Commissions du mois
* Acomptes reçus
* Soldes en attente
* Taux de conversion
* Classement équipe

### Objectifs métier

* Objectif agent : 3 dossiers signés par mois.
* Objectif équipe : au moins 15 dossiers signés par mois.
* Seuil commissions global : 4 440 €/mois.

---

## 6. Module Agenda & RDV

### Objectif

Planifier les rendez-vous liés aux dossiers.

### Fonctionnalités

* Créer un rendez-vous depuis un dossier.
* Modifier un rendez-vous.
* Annuler ou reporter un rendez-vous.
* Voir son agenda.
* Voir l’agenda équipe pour le superviseur.
* Envoyer un rappel client à J-1.

### Points à prévoir

Le canal de rappel peut être :

* Email
* SMS
* WhatsApp
* Notification interne

Si le projet n’a pas encore d’intégration externe, prévoir une structure extensible mais ne pas implémenter une intégration complexe immédiatement.

---

## 7. Module Dashboard & KPI

### Objectif

Afficher les indicateurs de performance.

### KPI attendus

* Taux de décrochage
* Conversion appel vers RDV
* Taux de signature
* Nombre de dossiers signés
* Total commissions générées
* Dossiers en attente depuis plus de 30 jours
* Satisfaction client
* Taux d’absentéisme

### Important

Certains KPI ne peuvent pas être calculés automatiquement sans données externes.

Par exemple :

* Taux de décrochage : nécessite une intégration téléphonie.
* Taux d’absentéisme : nécessite un module présence ou RH.
* Satisfaction client : nécessite une saisie ou un formulaire.

Pour la V2, si ces données n’existent pas, prévoir les emplacements et les modèles, mais ne pas inventer de calcul faux.

---

## 8. Module Rapports & exports

### Objectif

Permettre l’export des données importantes.

### Exports attendus

* Commissions par agent.
* Commissions par mois.
* Dossiers signés.
* Dossiers posés.
* Performance équipe.
* Dossiers en attente.
* Export Excel.
* Export PDF si possible.

### Règles

* L’agent exporte uniquement ses données.
* Le superviseur exporte les données de l’équipe.
* Le responsable commercial exporte tout.

---

# Modèle de données cible

Codex doit comparer ce modèle cible avec les modèles existants avant modification.

## User

Champs recommandés :

```text
id
first_name
last_name
email
phone
password
role
team_id
photo
monthly_goal
is_active
created_at
updated_at
```

## Lead

```text
id
first_name
last_name
phone
email
address
source
desired_product
approx_surface
sector
status
assigned_agent_id
converted_dossier_id
first_contact_date
notes
created_at
updated_at
```

## Dossier

```text
id
lead_id
client_id
assigned_agent_id
product
color
sector
surface_range
source_type
status
first_contact_date
appointment_date
quote_sent_date
signature_date
mpr_deposit_date
installation_date
notes
created_at
updated_at
```

## CommissionRule

```text
id
product
color
sector
surface_range
source_type
total_amount
deposit_amount
balance_amount
version
is_active
starts_at
ends_at
created_at
updated_at
```

## Commission

```text
id
dossier_id
agent_id
commission_rule_id
total_amount
deposit_amount
balance_amount
deposit_status
balance_status
global_status
calculated_at
deposit_validated_at
balance_validated_at
deposit_paid_at
balance_paid_at
validated_by_id
created_at
updated_at
```

## Appointment

```text
id
dossier_id
agent_id
scheduled_at
location
status
reminder_sent
reminder_channel
created_at
updated_at
```

## ActivityLog

```text
id
user_id
entity_type
entity_id
action
old_value
new_value
created_at
```

---

# API cible indicative

Codex doit adapter ces routes au framework existant.

## Auth

```text
POST /auth/login
POST /auth/logout
GET /auth/me
```

## Leads

```text
GET /leads
POST /leads
GET /leads/:id
PATCH /leads/:id
POST /leads/:id/convert
```

## Dossiers

```text
GET /dossiers
POST /dossiers
GET /dossiers/:id
PATCH /dossiers/:id
POST /dossiers/:id/change-status
GET /dossiers/:id/history
```

## Commissions

```text
GET /commissions
GET /commissions/:id
POST /dossiers/:id/calculate-commission
POST /commissions/:id/validate-deposit
POST /commissions/:id/validate-balance
POST /commissions/:id/mark-paid
```

## Grille tarifaire

```text
GET /commission-rules
POST /commission-rules
PATCH /commission-rules/:id
DELETE /commission-rules/:id
```

## Agenda

```text
GET /appointments
POST /appointments
PATCH /appointments/:id
DELETE /appointments/:id
```

## Dashboard

```text
GET /dashboard/me
GET /dashboard/team
GET /dashboard/global
```

## Rapports

```text
GET /reports/commissions
GET /reports/performance
GET /reports/export/excel
GET /reports/export/pdf
```

---

# Plan d’implémentation recommandé

## Phase 1 — Audit technique

Ne rien coder avant d’avoir identifié :

* Stack utilisée.
* Structure backend.
* Structure frontend.
* Base de données.
* Authentification.
* Modèles existants.
* Routes existantes.
* Bugs visibles.
* Dette technique.

Livrable attendu :

```text
docs/audit-v1.md
```

---

## Phase 2 — Stabilisation de la base

À faire :

* Nettoyer les modèles existants si nécessaire.
* Ajouter les rôles manquants.
* Ajouter les permissions.
* Ajouter les statuts normalisés.
* Vérifier les validations backend.
* Ajouter un ActivityLog si absent.

Objectif : avoir une base propre avant d’ajouter les commissions.

---

## Phase 3 — Leads & dossiers

À faire :

* Compléter le module leads.
* Ajouter la qualification.
* Ajouter la conversion lead vers dossier.
* Compléter le module dossiers.
* Ajouter le workflow de statuts.
* Ajouter les filtres et recherche.
* Ajouter l’historique.

---

## Phase 4 — Grille de commissions

À faire :

* Créer le modèle CommissionRule.
* Ajouter l’interface admin de gestion de la grille.
* Ajouter les validations d’unicité.
* Ajouter la notion de règle active.
* Ajouter la version de grille.

Règle importante :

Une commission déjà calculée ne doit pas changer automatiquement si la grille est modifiée plus tard.

---

## Phase 5 — Calcul et validation des commissions

À faire :

* Déclencher le calcul à la signature.
* Créer la commission automatiquement.
* Séparer acompte et solde.
* Ajouter validation responsable commercial.
* Ajouter notification interne si disponible.
* Ajouter historique des validations.

---

## Phase 6 — Dashboard simple

À faire :

* KPI agent.
* KPI équipe.
* KPI global.
* Dossiers signés par mois.
* Commissions générées.
* Dossiers en attente depuis plus de 30 jours.
* Objectifs agents.

---

## Phase 7 — Exports

À faire :

* Export commissions Excel.
* Export performance Excel.
* Export PDF si simple à intégrer.
* Respecter les permissions selon rôle.

---

# MVP attendu

Le MVP doit contenir :

* Authentification.
* Rôles.
* Leads.
* Dossiers.
* Workflow de statuts.
* Grille de commissions.
* Calcul automatique des commissions.
* Validation acompte.
* Validation solde.
* Vue commissions agent.
* Vue équipe superviseur.
* Dashboard simple.
* Export Excel.
* Historique des actions sensibles.

Ne pas inclure dans le MVP :

* Paiement bancaire automatique.
* Intégration téléphonie complète.
* Application mobile native.
* BI avancée.
* Automatisations complexes.
* Intégrations externes lourdes.

---

# Contraintes techniques

## Sécurité

* Ne jamais faire confiance uniquement au frontend pour les permissions.
* Vérifier les permissions côté backend.
* Un agent ne doit jamais accéder aux dossiers d’un autre agent.
* Les routes admin doivent être protégées.
* Les validations de commission doivent être réservées au responsable commercial.
* Les données sensibles doivent être protégées.

## Maintenabilité

* Respecter l’architecture existante.
* Ne pas dupliquer la logique métier.
* Mettre la logique de commission dans un service dédié.
* Éviter les calculs complexes directement dans les controllers.
* Ajouter des tests sur les règles critiques.

## Performance

* Prévoir pagination sur les listes.
* Prévoir filtres sur dossiers, leads et commissions.
* Éviter les requêtes inutiles sur les dashboards.
* Indexer les champs utilisés pour recherche et filtres.

## Qualité

* Ajouter validations backend.
* Ajouter messages d’erreur clairs.
* Ajouter tests unitaires sur le calcul des commissions.
* Ajouter tests d’accès par rôle.
* Ajouter tests du workflow dossier.

---

# Tests attendus

## Tests minimum

* Création lead.
* Conversion lead vers dossier.
* Création dossier.
* Changement de statut.
* Calcul commission avec règle existante.
* Erreur si aucune règle de commission.
* Validation acompte par responsable commercial.
* Refus validation acompte par agent.
* Validation solde par responsable commercial.
* Accès agent limité à ses propres dossiers.
* Accès superviseur aux dossiers équipe.
* Accès responsable commercial à toutes les données.

---

# Messages utilisateur recommandés

## Succès

```text
Lead créé avec succès.
Dossier créé avec succès.
Dossier mis à jour avec succès.
Commission calculée avec succès.
Acompte validé avec succès.
Solde validé avec succès.
Export généré avec succès.
```

## Erreurs

```text
Ce champ est obligatoire.
Vous n’avez pas les droits nécessaires.
Aucune règle de commission ne correspond à ce dossier.
Ce dossier est déjà commissionné.
Impossible de modifier ces champs après signature.
Un lead existe déjà avec ce numéro de téléphone.
```

---

# Points à clarifier avant implémentation complète

Codex doit signaler ces points si aucune réponse n’existe dans le projet :

1. Liste finale des statuts.
2. Grille complète des commissions.
3. Canal de notification : email, SMS, WhatsApp ou interne.
4. Gestion réelle du paiement : suivi seulement ou paiement intégré.
5. Outil de téléphonie existant.
6. Génération réelle des devis ou simple suivi.
7. Gestion des dossiers annulés.
8. Gestion des modifications après signature.
9. Gestion des doublons clients.
10. Format exact des exports attendus.

---

# Instruction finale pour Codex

Tu dois travailler comme un développeur senior.

Ne commence pas par coder directement.

Commence par lire le projet existant et produire un audit clair.

Ensuite, propose un plan d’implémentation progressif.

Puis implémente par petites étapes, en gardant le projet fonctionnel après chaque étape.

À chaque étape :

1. Expliquer ce qui a été modifié.
2. Lister les fichiers modifiés.
3. Ajouter ou mettre à jour les tests si possible.
4. Vérifier que l’application démarre encore.
5. Éviter les changements destructifs.
6. Ne pas supprimer la V1 sans validation.

Tu es un développeur senior / Tech Lead.

Je travaille sur un CRM Suzana Global Call Center. Une version 1 simple existe déjà dans ce repository.

Ta mission est de lire d’abord le projet existant, comprendre son architecture, puis coder progressivement les évolutions nécessaires vers la V2.

IMPORTANT :
Ne commence pas à coder directement.
Commence par analyser le projet.

Étape 1 — Analyse obligatoire du projet existant

Lis tout le repository et identifie :

- La stack technique utilisée.
- La structure backend.
- La structure frontend.
- La base de données utilisée.
- Le système d’authentification.
- Les modèles / tables existants.
- Les routes / API existantes.
- Les pages ou composants frontend existants.
- Les rôles utilisateurs existants.
- Les fonctionnalités déjà faites dans la V1.
- Les fonctionnalités manquantes.
- Les problèmes techniques ou incohérences.
- Les risques avant modification.

Ensuite, crée ou mets à jour un fichier :

docs/audit-v1.md

Dans ce fichier, écris :

1. Résumé de l’architecture actuelle
2. Fonctionnalités existantes
3. Fonctionnalités manquantes
4. Modèles existants
5. Routes/API existantes
6. Problèmes détectés
7. Plan d’implémentation recommandé

Étape 2 — Lire le fichier de mission

Lis aussi le fichier suivant s’il existe :

README_CODEX_MISSION.md

Ce fichier décrit les besoins V2 du CRM :
- Leads
- Dossiers
- Commissions automatiques
- Rôles
- Agenda
- Dashboard
- Rapports
- Exports
- Historique

Utilise ce fichier comme référence fonctionnelle.

Étape 3 — Proposer un plan avant de coder

Après l’audit, propose un plan de développement par étapes.

Le plan doit être progressif, par exemple :

Phase 1 :
- Nettoyage / stabilisation de l’existant
- Vérification auth
- Vérification rôles
- Ajout des constantes métier

Phase 2 :
- Module leads
- Qualification
- Conversion lead vers dossier

Phase 3 :
- Module dossiers
- Workflow de statuts
- Historique des actions

Phase 4 :
- Grille de commissions
- Calcul automatique
- Validation acompte
- Validation solde

Phase 5 :
- Dashboard simple
- Exports Excel
- Tests

Ne code rien tant que le plan n’est pas clair.

Étape 4 — Implémentation

Après validation du plan, commence à coder par petites étapes.

Priorité MVP :

1. Authentification et rôles
2. Leads
3. Dossiers
4. Workflow de statuts
5. Grille de commissions
6. Calcul automatique des commissions
7. Validation acompte / solde
8. Dashboard simple
9. Export Excel
10. Historique des actions importantes

Règles métier importantes :

- Un agent commercial voit uniquement ses propres leads, dossiers et commissions.
- Un superviseur voit les données de toute l’équipe.
- Un responsable commercial a accès complet.
- Un agent ne peut jamais modifier manuellement une commission.
- Seul le responsable commercial peut valider les commissions.
- La commission dépend de :
  - Produit
  - Couleur
  - Secteur
  - Surface
  - Type CALL ou REGIES
- À la signature, le système calcule :
  - Commission totale
  - Acompte
  - Solde
- À la pose, le solde devient validable.
- Toute action sensible doit être historisée.
- Les permissions doivent être vérifiées côté backend, pas seulement côté frontend.

Entités cibles à prévoir ou compléter :

User :
- id
- first_name
- last_name
- email
- phone
- role
- team_id
- photo
- monthly_goal
- is_active

Lead :
- id
- first_name
- last_name
- phone
- email
- address
- source
- desired_product
- approx_surface
- sector
- status
- assigned_agent_id
- converted_dossier_id
- first_contact_date
- notes

Dossier :
- id
- lead_id
- client_id
- assigned_agent_id
- product
- color
- sector
- surface_range
- source_type
- status
- first_contact_date
- appointment_date
- quote_sent_date
- signature_date
- mpr_deposit_date
- installation_date
- notes

CommissionRule :
- id
- product
- color
- sector
- surface_range
- source_type
- total_amount
- deposit_amount
- balance_amount
- version
- is_active
- starts_at
- ends_at

Commission :
- id
- dossier_id
- agent_id
- commission_rule_id
- total_amount
- deposit_amount
- balance_amount
- deposit_status
- balance_status
- global_status
- calculated_at
- deposit_validated_at
- balance_validated_at
- deposit_paid_at
- balance_paid_at
- validated_by_id

Appointment :
- id
- dossier_id
- agent_id
- scheduled_at
- location
- status
- reminder_sent
- reminder_channel

ActivityLog :
- id
- user_id
- entity_type
- entity_id
- action
- old_value
- new_value
- created_at

Statuts recommandés pour les dossiers :

- NOUVEAU
- QUALIFIE
- RDV_PLANIFIE
- DEVIS_ENVOYE
- SIGNE_ACOMPTE_A_VALIDER
- ACOMPTE_VALIDE
- DEPOT_MPR
- POSE_SOLDE_A_VALIDER
- SOLDE_VALIDE
- ARCHIVE
- ANNULE
- PERDU

Statuts recommandés pour les commissions :

- CALCULEE
- ACOMPTE_EN_ATTENTE
- ACOMPTE_VALIDE
- ACOMPTE_PAYE
- SOLDE_EN_ATTENTE
- SOLDE_VALIDE
- SOLDE_PAYE
- SOLDEE
- ANNULEE

Tests attendus :

- Création lead
- Conversion lead vers dossier
- Création dossier
- Changement de statut
- Calcul commission avec règle existante
- Erreur si aucune règle de commission
- Validation acompte par responsable commercial
- Refus validation acompte par agent
- Validation solde par responsable commercial
- Accès agent limité à ses propres données
- Accès superviseur aux données équipe
- Accès responsable commercial à toutes les données

Contraintes de code :

- Respecte l’architecture existante.
- Ne supprime pas la V1 sans justification.
- Ne casse pas les fonctionnalités existantes.
- Évite les gros changements en une seule fois.
- Mets la logique de commission dans un service dédié.
- Évite la logique métier directement dans les controllers.
- Ajoute des validations backend.
- Ajoute des messages d’erreur clairs.
- Ajoute ou mets à jour les tests si le projet contient déjà une structure de tests.
- Vérifie que l’application démarre après chaque grande étape.

Format de réponse attendu à chaque étape :

1. Ce que tu as analysé
2. Ce que tu proposes
3. Ce que tu vas modifier
4. Fichiers concernés
5. Risques éventuels
6. Commandes à lancer pour tester

Commence maintenant par l’audit du repository.
Ne code pas avant d’avoir produit docs/audit-v1.md et proposé le plan d’implémentation.
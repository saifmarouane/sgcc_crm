# Roles et fonctionnalites - CRM Suzana V2

Ce document decrit les fonctionnalites disponibles par role dans la V2 actuelle du CRM Suzana Global Call Center.

## Mapping des roles techniques

Les roles stockes en base sont:

- `agent`: Agent commercial
- `manager`: Superviseur
- `admin`: Responsable commercial / administrateur

## Agent commercial

Un agent commercial travaille uniquement sur ses propres donnees.

### Acces autorises

- Voir son profil.
- Modifier son profil.
- Voir ses propres leads.
- Creer ses propres leads.
- Convertir ses leads en dossiers.
- Voir ses propres dossiers.
- Faire avancer le statut de ses dossiers selon le workflow autorise.
- Voir ses propres commissions.
- Exporter ses propres dossiers en CSV.
- Exporter ses propres commissions en CSV.
- Voir son dashboard personnel.
- Inserer ses ventes/factures V1.
- Voir ses ventes/factures V1.

### Restrictions

- Ne peut pas voir les leads d'un autre agent.
- Ne peut pas voir les dossiers d'un autre agent.
- Ne peut pas voir les commissions d'un autre agent.
- Ne peut pas modifier une commission manuellement.
- Ne peut pas valider un acompte.
- Ne peut pas valider un solde.
- Ne peut pas marquer une commission comme payee.
- Ne peut pas gerer la grille de commissions.
- Ne peut pas gerer les utilisateurs.
- Ne peut pas gerer les departements.

## Superviseur

Le superviseur correspond au role technique `manager`.

Un superviseur a une vue equipe basee sur `department_id`.

### Acces autorises

- Voir les leads des agents de son equipe.
- Voir les dossiers des agents de son equipe.
- Voir les commissions des agents de son equipe.
- Voir le dashboard de son equipe.
- Consulter la grille de commissions.
- Consulter les statistiques agents.

### Restrictions

- Ne peut pas voir les donnees d'une autre equipe.
- Ne peut pas valider une commission.
- Ne peut pas marquer une commission comme payee.
- Ne peut pas creer ou modifier la grille de commissions.
- Ne peut pas gerer les utilisateurs.
- Ne peut pas gerer les departements.

## Responsable commercial / Admin

Le responsable commercial correspond au role technique `admin`.

Il a l'acces complet au CRM.

### Acces autorises

- Gerer les utilisateurs.
- Creer, modifier et supprimer des agents.
- Gerer les departements/equipes.
- Voir tous les leads.
- Creer des leads et les assigner a un agent.
- Convertir un lead en dossier.
- Voir tous les dossiers.
- Faire avancer les statuts des dossiers.
- Voir toutes les commissions.
- Gerer la grille de commissions.
- Creer une regle de commission.
- Desactiver une regle de commission.
- Valider les acomptes.
- Valider les soldes.
- Marquer un acompte comme paye.
- Marquer un solde comme paye.
- Voir le dashboard global.
- Exporter tous les dossiers en CSV.
- Exporter toutes les commissions en CSV.
- Consulter les statistiques agents.
- Consulter l'historique des actions sensibles.

## Workflow leads

Statuts leads disponibles:

- `NOUVEAU`
- `QUALIFIE`
- `NON_QUALIFIE`
- `CONVERTI`
- `PERDU`

Regles:

- Un agent cree et voit ses propres leads.
- Un superviseur voit les leads de son equipe.
- Un admin voit tous les leads.
- Un lead converti reste lie au dossier via `converted_dossier_id`.
- Le systeme refuse les doublons par telephone ou email.

## Workflow dossiers

Statuts dossiers disponibles:

- `NOUVEAU`
- `QUALIFIE`
- `RDV_PLANIFIE`
- `DEVIS_ENVOYE`
- `SIGNE_ACOMPTE_A_VALIDER`
- `ACOMPTE_VALIDE`
- `DEPOT_MPR`
- `POSE_SOLDE_A_VALIDER`
- `SOLDE_VALIDE`
- `ARCHIVE`
- `ANNULE`
- `PERDU`

Transitions principales:

- `NOUVEAU` vers `QUALIFIE`, `RDV_PLANIFIE`, `PERDU`, `ANNULE`
- `QUALIFIE` vers `RDV_PLANIFIE`, `PERDU`, `ANNULE`
- `RDV_PLANIFIE` vers `DEVIS_ENVOYE`, `PERDU`, `ANNULE`
- `DEVIS_ENVOYE` vers `SIGNE_ACOMPTE_A_VALIDER`, `PERDU`, `ANNULE`
- `SIGNE_ACOMPTE_A_VALIDER` vers `ACOMPTE_VALIDE`, `ANNULE`
- `ACOMPTE_VALIDE` vers `DEPOT_MPR`, `ANNULE`
- `DEPOT_MPR` vers `POSE_SOLDE_A_VALIDER`, `ANNULE`
- `POSE_SOLDE_A_VALIDER` vers `SOLDE_VALIDE`, `ANNULE`
- `SOLDE_VALIDE` vers `ARCHIVE`

## Commissions

### Grille de commissions

Une regle de commission depend de:

- Produit
- Couleur
- Secteur
- Surface
- Type `CALL` ou `REGIES`

Chaque regle contient:

- Commission totale
- Acompte
- Solde
- Version
- Statut actif/inactif
- Date de debut
- Date de fin

### Calcul automatique

Quand un dossier passe au statut `SIGNE_ACOMPTE_A_VALIDER`, le systeme:

- cherche une regle active correspondante;
- refuse le changement de statut si aucune regle ne correspond;
- cree automatiquement une commission;
- fige les montants calcules;
- historise l'action.

### Validation et paiement

Seul le responsable commercial / admin peut:

- valider l'acompte;
- marquer l'acompte comme paye;
- valider le solde;
- marquer le solde comme paye.

Le solde devient validable uniquement apres la pose, lorsque le dossier est au statut `POSE_SOLDE_A_VALIDER`.

## Dashboard

Le dashboard calcule les KPI selon le role:

- Agent: ses propres donnees.
- Superviseur: donnees de son equipe.
- Admin: donnees globales.

KPI disponibles:

- Total leads.
- Leads qualifies.
- Leads convertis.
- Total dossiers.
- Dossiers signes.
- Dossiers poses.
- Dossiers actifs sans mise a jour depuis plus de 30 jours.
- Total commissions calculees.
- Montant total commissions.
- Montant acompte en attente.
- Montant solde en attente.
- Montant paye.

## Exports

Exports CSV disponibles:

- Dossiers.
- Commissions.

Permissions:

- Agent: exporte uniquement ses donnees.
- Superviseur: exporte les donnees de son equipe.
- Admin: exporte toutes les donnees.

## Historique

Les actions sensibles sont historisees dans `activity_logs`.

Actions historisees actuellement:

- Creation lead.
- Mise a jour lead.
- Conversion lead vers dossier.
- Creation dossier.
- Mise a jour dossier.
- Changement statut dossier.
- Creation regle commission.
- Mise a jour regle commission.
- Desactivation regle commission.
- Calcul commission.
- Validation acompte.
- Validation solde.
- Paiement acompte.
- Paiement solde.

## Routes sensibles protegees

Les anciennes routes V1 suivantes sont maintenant protegees:

- Documents: admin uniquement.
- Scores: admin uniquement.
- Notifications: admin uniquement.
- Statistiques agents: admin et superviseur.
- Register public: remplace par creation utilisateur admin.


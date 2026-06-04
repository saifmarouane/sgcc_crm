# README - Cahier de charge technique pour Codex

## Projet : ajout du module MaPrimeRenov / CEE dans le CRM centre d'appel

Ce document explique clairement les nouveaux elements a developper dans un CRM deja existant. Le CRM gere deja un centre d'appel avec plusieurs roles : agents, managers et administrateurs. Le nouveau besoin est d'ajouter un module complet pour qualifier les prospects selon un questionnaire d'eligibilite MaPrimeRenov / CEE, puis stocker le resultat, les produits eligibles, les documents requis et les informations de rendez-vous.

Le document source est un questionnaire d'eligibilite MaPrimeRenov utilise en interne pour verifier l'eligibilite aux aides de renovation energetique pour les produits suivants : PAC, SSC, ballon thermodynamique, ballon solaire et ballon electrique.

---

## 1. Contexte du CRM existant

Le CRM existe deja et il est utilise par un centre d'appel.

Les utilisateurs principaux sont :

- Agent : appelle les prospects, remplit les informations, qualifie le prospect, ajoute des notes et planifie un rendez-vous.
- Manager : suit la performance des agents, verifie les dossiers, filtre les prospects eligibles ou non eligibles.
- Admin : gere les utilisateurs, les permissions, la configuration globale, les listes, les produits et les criteres.

Le nouveau developpement ne doit pas casser les modules existants. Il doit s'ajouter comme un nouveau module dans le CRM.

Nom conseille du module : `Eligibility / MaPrimeRenov` ou `Prospect Eligibility`.

---

## 2. Objectif du nouveau module

L'objectif est de permettre a un agent de centre d'appel de remplir un formulaire structure pour chaque prospect et de savoir rapidement :

- si le prospect est eligible ou non eligible ;
- pourquoi il est eligible ou non eligible ;
- quels produits peuvent etre proposes ;
- quels documents doivent etre demandes ;
- quelle est la date et l'heure du rendez-vous ;
- quel agent a traite le prospect ;
- quelles observations ont ete ajoutees.

Le module doit aider l'agent a travailler plus vite, eviter les erreurs de qualification et donner au manager une vue claire sur les dossiers.

---

## 3. Fonctionnalites principales a developper

### 3.1. Fiche prospect

Ajouter ou reutiliser une fiche prospect avec les champs suivants :

- nom et prenom ;
- telephone ;
- adresse du logement ;
- code postal ;
- ville ;
- email ;
- date du contact ;
- agent responsable ;
- statut du dossier ;
- date de creation ;
- date de mise a jour.

Si le CRM possede deja une table `prospects`, il faut l'etendre proprement. Sinon, creer une table dediee.

Statuts proposes :

- nouveau ;
- en qualification ;
- eligible ;
- non eligible ;
- incomplet ;
- rendez-vous planifie ;
- dossier depose ;
- abandonne.

---

### 3.2. Questionnaire d'eligibilite

Creer une interface de formulaire pour les 8 questions du questionnaire.

#### Question 1 - Statut par rapport au logement

Choix possibles :

- proprietaire occupant : eligible ;
- proprietaire bailleur : eligible ;
- locataire : non eligible au programme.

Regle : si le prospect est locataire, le dossier devient non eligible, sauf si le CRM permet de continuer pour collecter les informations du proprietaire bailleur.

#### Question 2 - Annee de construction du logement

Choix possibles :

- plus de 15 ans / construit avant 2010 : eligible ;
- moins de 15 ans / construit apres 2010 : non eligible.

Regle : le logement doit avoir plus de 15 ans.

#### Question 3 - Superficie de la maison

Choix possibles :

- entre 50 m2 et 350 m2 : eligible ;
- moins de 50 m2 ou plus de 350 m2 : non eligible.

Regle : la surface doit etre comprise entre 50 m2 et 350 m2.

#### Question 4 - Systeme de chauffage actuel

Choix eligibles :

- chaudiere fioul ;
- chaudiere gaz ;
- chaudiere bois ;
- chaudiere granules ;
- PAC installee avant 2023.

Choix non eligible :

- autre systeme, par exemple poele, chauffage electrique ou autre.

Regle : les poeles ne sont pas eligibles. Seules les chaudieres peuvent etre remplacees.

#### Question 5 - Nombre de personnes dans le foyer fiscal

Choix possibles :

- 1 personne ;
- 2 personnes ;
- 3 personnes ;
- 4 personnes ;
- 5 personnes ou plus.

Cette reponse est utilisee pour calculer la tranche de revenu fiscal.

#### Question 6 - Revenu fiscal de reference annuel

Ajouter une selection de tranche selon le nombre de personnes dans le foyer.

Tranches :

| Tranche | 1 personne | 2 personnes | 3 personnes | 4 personnes | 5+ personnes |
|---|---:|---:|---:|---:|---:|
| Bleue - tres modeste | < 17 009 | < 24 875 | < 29 917 | < 34 948 | < 40 002 |
| Jaune - modeste | < 21 805 | < 31 889 | < 38 349 | < 44 844 | < 51 347 |
| Violette - intermediaire | < 30 549 | < 44 907 | < 54 071 | < 63 235 | < 72 400 |
| Au-dessus | non eligible | non eligible | non eligible | non eligible | non eligible |

Regle : si le revenu est au-dessus de la tranche violette, le prospect est non eligible.

Le formulaire doit aussi afficher une note pour l'agent : le RFR se trouve sur l'avis d'imposition, case 9HI.

#### Question 7 - Espaces techniques disponibles

Cases a cocher :

- au moins 1 m2 disponible pour installer un ballon ;
- au moins 2 m2 disponibles en exterieur ou local technique pour la PAC ;
- 8 a 10 m2 de toiture disponible pour un Systeme Solaire Combine.

Ces reponses servent a determiner les produits possibles.

#### Question 8 - Compte MaPrimeRenov

Choix possibles :

- oui, compte MPR actif ;
- non, compte a creer avant le depot du dossier ;
- je ne sais pas.

Le choix ne bloque pas l'eligibilite, mais il doit etre visible dans le dossier.

---

## 4. Calcul automatique de l'eligibilite

Le CRM doit calculer automatiquement un resultat apres la saisie du questionnaire.

### 4.1. Resultat global

Valeurs possibles :

- `eligible` ;
- `non_eligible` ;
- `incomplete`.

### 4.2. Motifs de non-eligibilite

Le systeme doit stocker les raisons exactes.

Exemples :

- Le prospect est locataire.
- Le logement a moins de 15 ans.
- La surface n'est pas comprise entre 50 m2 et 350 m2.
- Le systeme de chauffage actuel n'est pas eligible.
- Le revenu fiscal est au-dessus du plafond.
- Les informations techniques sont insuffisantes.

### 4.3. Resultat visible dans l'interface

Dans la fiche prospect, afficher un bloc clair :

- badge vert : eligible ;
- badge rouge : non eligible ;
- badge orange : dossier incomplet ;
- liste des raisons ;
- produits proposes ;
- documents manquants.

---

## 5. Produits eligibles selon le profil

Ajouter un calcul automatique des produits possibles selon les espaces techniques disponibles.

Produits :

| Produit | Description | Conditions |
|---|---|---|
| PAC + SSC | Pompe a chaleur + Systeme solaire combine | 2 m2 PAC + 8/10 m2 toiture |
| PAC + BS | Pompe a chaleur + Ballon solaire | 2 m2 PAC + 1 m2 ballon |
| PAC + BE | Pompe a chaleur + Ballon electrique | 2 m2 PAC + 1 m2 ballon |
| PAC + BT | Pompe a chaleur + Ballon thermodynamique | 2 m2 PAC + 1 m2 ballon |
| SSC seul | Systeme solaire combine uniquement | 8/10 m2 toiture |
| PAC seule | Pompe a chaleur uniquement | 2 m2 disponibles |

Regles :

- Si `has_pac_space = true`, alors PAC seule est possible.
- Si `has_pac_space = true` et `has_balloon_space = true`, alors PAC + BS, PAC + BE et PAC + BT sont possibles.
- Si `has_pac_space = true` et `has_roof_space = true`, alors PAC + SSC est possible.
- Si `has_roof_space = true`, alors SSC seul est possible.
- Si aucune condition technique n'est remplie, aucun produit n'est propose et le dossier doit etre marque comme incomplet ou non exploitable selon la logique metier.

---

## 6. Documents requis

Ajouter une section checklist pour les documents.

### 6.1. Documents pour proprietaire occupant ou proprietaire bailleur

- avis d'imposition ;
- taxe d'habitation ;
- taxe fonciere ;
- piece d'identite / CNI ;
- photo de la chaudiere actuelle ;
- photo du compteur electrique ;
- photo du toit si SSC prevu.

### 6.2. Documents pour locataire dans le cas proprietaire bailleur

- avis d'imposition ;
- justificatif de domicile de moins de 3 mois ;
- piece d'identite ;
- bail de location.

### 6.3. Fonctionnalites attendues

Pour chaque document :

- afficher une case `recu / non recu` ;
- permettre l'upload du fichier ;
- stocker le type de document ;
- stocker la date d'ajout ;
- stocker l'utilisateur qui a ajoute le fichier ;
- afficher les documents manquants.

Les fichiers doivent etre lies au prospect.

---

## 7. Rendez-vous et notes agent

Ajouter une section `Observations / Notes agent`.

Champs :

- date et heure du rendez-vous ;
- nom de l'agent ;
- observations libres ;
- signature du prospect si le CRM supporte une signature numerique ;
- historique des modifications.

Le manager doit pouvoir filtrer les prospects par date de rendez-vous.

---

## 8. Permissions et roles

Respecter le systeme de roles existant du CRM.

### Agent

- creer un prospect ;
- remplir le questionnaire ;
- modifier ses propres prospects ;
- ajouter des notes ;
- uploader des documents ;
- planifier un rendez-vous.

### Manager

- voir les prospects de son equipe ;
- modifier le statut ;
- valider ou refuser un dossier ;
- voir les statistiques ;
- exporter les donnees.

### Admin

- voir tous les prospects ;
- gerer les utilisateurs ;
- gerer les listes de choix ;
- configurer les produits ;
- configurer les plafonds de revenu ;
- supprimer ou archiver les dossiers si autorise.

---

## 9. Backend - proposition de structure

Adapter selon l'architecture actuelle du CRM. Si le CRM utilise Laravel avec une architecture classique ou DDD, garder la structure existante.

### 9.1. Tables proposees

#### Table `prospects`

A creer ou a etendre si elle existe deja.

Champs proposes :

- id ;
- first_name ;
- last_name ;
- full_name ;
- phone ;
- email ;
- housing_address ;
- postal_code ;
- city ;
- contact_date ;
- assigned_agent_id ;
- status ;
- eligibility_status ;
- created_by ;
- updated_by ;
- created_at ;
- updated_at.

#### Table `prospect_eligibility_answers`

Stocke les reponses du questionnaire.

Champs proposes :

- id ;
- prospect_id ;
- housing_status ;
- construction_age_status ;
- house_surface_status ;
- house_surface_value ;
- heating_system ;
- fiscal_household_size ;
- rfr_amount ;
- rfr_tranche ;
- has_balloon_space ;
- has_pac_space ;
- has_roof_space ;
- mpr_account_status ;
- eligibility_status ;
- non_eligibility_reasons JSON ;
- eligible_products JSON ;
- created_at ;
- updated_at.

#### Table `prospect_documents`

Champs proposes :

- id ;
- prospect_id ;
- document_type ;
- file_path ;
- status ;
- uploaded_by ;
- uploaded_at ;
- created_at ;
- updated_at.

#### Table `prospect_notes`

Champs proposes :

- id ;
- prospect_id ;
- user_id ;
- note ;
- created_at ;
- updated_at.

#### Table `prospect_appointments`

Champs proposes :

- id ;
- prospect_id ;
- appointment_at ;
- agent_id ;
- status ;
- comment ;
- created_at ;
- updated_at.

---

## 10. Backend - endpoints API attendus

Adapter les URLs selon les conventions du CRM.

### Prospects

- `GET /api/prospects`
  - liste avec filtres : statut, agent, ville, date, eligibility_status, produit eligible.

- `POST /api/prospects`
  - creation d'un prospect.

- `GET /api/prospects/{id}`
  - detail complet du prospect.

- `PUT /api/prospects/{id}`
  - mise a jour des informations prospect.

- `DELETE /api/prospects/{id}`
  - supprimer ou archiver selon la logique du CRM.

### Eligibilite

- `POST /api/prospects/{id}/eligibility`
  - enregistrer les reponses du questionnaire.
  - calculer automatiquement l'eligibilite.
  - retourner le resultat global, les raisons et les produits proposes.

- `GET /api/prospects/{id}/eligibility`
  - recuperer les reponses et le resultat.

### Documents

- `POST /api/prospects/{id}/documents`
  - upload d'un document.

- `GET /api/prospects/{id}/documents`
  - liste des documents.

- `DELETE /api/prospects/{id}/documents/{documentId}`
  - suppression d'un document si autorise.

### Notes

- `POST /api/prospects/{id}/notes`
  - ajouter une note.

- `GET /api/prospects/{id}/notes`
  - liste des notes.

### Rendez-vous

- `POST /api/prospects/{id}/appointments`
  - planifier un rendez-vous.

- `GET /api/appointments`
  - liste des rendez-vous avec filtres par agent, date, statut.

---

## 11. Frontend - pages et composants attendus

### 11.1. Page liste prospects

Ajouter une page pour afficher tous les prospects.

Colonnes recommandees :

- nom complet ;
- telephone ;
- ville ;
- agent ;
- statut ;
- eligibilite ;
- produits eligibles ;
- date du contact ;
- date du rendez-vous ;
- actions.

Filtres :

- recherche par nom, telephone, email ;
- statut ;
- eligibilite ;
- agent ;
- ville ;
- produit eligible ;
- date de contact ;
- date de rendez-vous.

### 11.2. Page detail prospect

Sections :

1. informations du prospect ;
2. questionnaire d'eligibilite ;
3. resultat d'eligibilite ;
4. produits eligibles ;
5. documents requis ;
6. notes agent ;
7. rendez-vous ;
8. historique.

### 11.3. Composant questionnaire

Le formulaire doit etre simple pour un agent call center.

Contraintes UX :

- questions affichees dans l'ordre ;
- boutons radio pour les choix uniques ;
- checkboxes pour les espaces techniques ;
- calcul automatique en direct ;
- message rouge si une reponse rend le dossier non eligible ;
- sauvegarde claire ;
- possibilite de reprendre un dossier incomplet.

### 11.4. Dashboard manager

Ajouter une vue statistique simple :

- nombre total de prospects ;
- prospects eligibles ;
- prospects non eligibles ;
- dossiers incomplets ;
- rendez-vous planifies ;
- produits les plus proposes ;
- performance par agent ;
- documents manquants.

---

## 12. Exemple de payload API

### Enregistrer le questionnaire

```json
{
  "housing_status": "owner_occupant",
  "construction_age_status": "more_than_15_years",
  "house_surface_status": "between_50_and_350",
  "house_surface_value": 120,
  "heating_system": "gas_boiler",
  "fiscal_household_size": 3,
  "rfr_amount": 35000,
  "rfr_tranche": "yellow",
  "has_balloon_space": true,
  "has_pac_space": true,
  "has_roof_space": false,
  "mpr_account_status": "not_yet",
  "appointment_at": "2026-06-10 14:30:00",
  "agent_note": "Prospect interesse, demander avis d'imposition et photo chaudiere."
}
```

### Exemple de reponse attendue

```json
{
  "success": true,
  "prospect_id": 15,
  "eligibility_status": "eligible",
  "non_eligibility_reasons": [],
  "eligible_products": [
    "PAC seule",
    "PAC + BS",
    "PAC + BE",
    "PAC + BT"
  ],
  "required_documents": [
    "avis_imposition",
    "taxe_habitation",
    "taxe_fonciere",
    "piece_identite",
    "photo_chaudiere",
    "photo_compteur_electrique"
  ]
}
```

---

## 13. Service metier conseille

Creer un service backend dedie pour ne pas mettre la logique dans le controller.

Nom propose :

- `EligibilityService`
- `MaPrimeRenovEligibilityService`

Responsabilites :

- verifier les reponses ;
- calculer l'eligibilite globale ;
- calculer les raisons de refus ;
- calculer les produits eligibles ;
- calculer les documents requis ;
- retourner un objet standardise au controller.

Pseudo-code :

```php
$result = $eligibilityService->evaluate($answers);

return [
    'status' => $result->status,
    'reasons' => $result->reasons,
    'products' => $result->eligibleProducts,
    'required_documents' => $result->requiredDocuments,
];
```

---

## 14. Points importants pour Codex

Codex doit respecter les points suivants :

1. Ne pas casser le CRM existant.
2. Respecter l'architecture actuelle du projet.
3. Ajouter des migrations propres.
4. Ajouter des models et relations propres.
5. Ajouter des controllers ou actions selon la structure existante.
6. Mettre la logique d'eligibilite dans un service, pas directement dans le controller.
7. Ajouter les validations backend.
8. Ajouter les permissions selon les roles existants.
9. Creer une interface simple et rapide pour les agents.
10. Ajouter les filtres pour les managers.
11. Ajouter l'upload des documents.
12. Ajouter les tests si le projet possede deja une structure de tests.
13. Garder un code lisible, maintenable et commente seulement quand c'est necessaire.

---

## 15. Critères d'acceptation

Le developpement est valide si :

- un agent peut creer un prospect ;
- un agent peut remplir les 8 questions ;
- le CRM calcule automatiquement l'eligibilite ;
- le CRM affiche clairement les raisons de non-eligibilite ;
- le CRM affiche les produits eligibles ;
- le CRM affiche la checklist des documents requis ;
- un agent peut uploader les documents ;
- un agent peut ajouter une note ;
- un agent peut planifier un rendez-vous ;
- un manager peut filtrer les dossiers ;
- un admin peut voir tous les dossiers ;
- les permissions sont respectees ;
- le module ne casse pas les autres parties du CRM.

---

## 16. Prompt direct a donner a Codex

Tu es Codex et tu dois travailler sur un CRM deja existant qui gere un centre d'appel avec agents, managers et admins. Ajoute un nouveau module MaPrimeRenov / CEE pour qualifier les prospects.

Lis ce README completement avant de coder.

Objectif : developper un module permettant a un agent de remplir une fiche prospect, repondre a un questionnaire de 8 questions, calculer automatiquement l'eligibilite MaPrimeRenov, afficher les raisons de non-eligibilite, proposer les produits eligibles, gerer les documents requis, ajouter des notes et planifier un rendez-vous.

Contraintes :

- Respecte l'architecture existante du CRM.
- Ne casse aucune fonctionnalite existante.
- Si une table prospects existe deja, reutilise-la ou etends-la proprement.
- Cree les migrations necessaires.
- Cree les models et relations necessaires.
- Cree un service metier `EligibilityService` ou equivalent pour la logique d'eligibilite.
- Ajoute les endpoints API necessaires.
- Ajoute les validations backend.
- Ajoute l'interface frontend necessaire.
- Respecte les permissions agent, manager et admin.
- Ajoute les filtres manager.
- Ajoute la gestion des documents et des rendez-vous.
- Ajoute des tests si le projet en utilise deja.

Commence par analyser la structure actuelle du projet, puis propose les fichiers a modifier/creer avant de coder. Ensuite implemente le module et verifie que tout fonctionne.

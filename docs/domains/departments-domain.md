# Departments Domain

Ce domaine gere les departements selectionnes par les users.

## Model

```ts
type Department = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};
```

Collection MongoDB: `departments`

Indexes:

- unique `name`

## Endpoints

### Create Department

`POST /api/departments`

Payload:

```json
{
  "name": "Sales"
}
```

### List Departments

`GET /api/departments`

### Get Department

`GET /api/departments/:id`

### Update Department

`PATCH /api/departments/:id`

Payload:

```json
{
  "name": "Support"
}
```

### Delete Department

`DELETE /api/departments/:id`

Response `204`: no body.

## User Relation

Le user garde seulement `department_id`.

Dans l'interface admin, le `department_id` est selectionne depuis la table `departments`.

# Nombre Ventes Domain

Ce domaine gere le nombre de ventes par utilisateur et par document.

## Model

```ts
type NombreVente = {
  id: string;
  user_id: string;
  document_id: string;
  reference: string;
  nombre_vente: number;
  saleInsertedAt: string;
  createdAt: string;
  updatedAt: string;
};
```

Collection MongoDB: `nombre_ventes`

Indexes:

- `user_id`
- `document_id`
- unique compound index: `user_id + document_id`

## Behavior

`POST /api/nombre-ventes` ne cree pas toujours une nouvelle ligne. Si une ligne existe deja pour le meme `user_id` et `document_id`, l'API incremente `nombre_vente`.

Si aucune ligne n'existe, elle cree une ligne avec `nombre_vente = 1`.

Le client ne choisit jamais `1`, `2`, etc. Chaque insertion de vente incremente automatiquement `nombre_vente` de `1`.

## Endpoints

### Increment Nombre Vente

`POST /api/nombre-ventes`

Payload:

```json
{
  "user_id": "665000000000000000000000",
  "document_id": "665222222222222222222222",
  "reference": "FAC-20260524-A1B2C3"
}
```

`reference` est optionnel pour l'API generale. L'endpoint agent la genere automatiquement.

Response `201`:

```json
{
  "nombre_vente": {
    "id": "665444444444444444444444",
    "user_id": "665000000000000000000000",
    "document_id": "665222222222222222222222",
    "reference": "FAC-20260524-A1B2C3",
    "nombre_vente": 1,
    "saleInsertedAt": "2026-05-24T00:00:00.000Z",
    "createdAt": "2026-05-24T00:00:00.000Z",
    "updatedAt": "2026-05-24T00:00:00.000Z"
  }
}
```

### List Nombre Ventes

`GET /api/nombre-ventes`

Response `200`:

```json
{
  "nombre_ventes": []
}
```

### Get Nombre Vente

`GET /api/nombre-ventes/:id`

### Increment Existing Nombre Vente

`PATCH /api/nombre-ventes/:id`

No body required. Chaque appel incremente automatiquement `nombre_vente` de `1`.

### Delete Nombre Vente

`DELETE /api/nombre-ventes/:id`

Response `204`: no body.

## Validation Rules

- `user_id` is required.
- `document_id` is required.
- `reference` is generated automatically by the agent sale endpoint when omitted.

## Agent Sale Endpoint

`POST /api/agent/ventes`

Cet endpoint est utilise par les users avec role `agent`.

Headers:

```http
Authorization: Bearer <jwt>
```

Payload:

```json
{
  "facture": "facture-2026-001.pdf"
}
```

Behavior:

- cree un document dans `documents`
- genere automatiquement une reference
- cree ou incremente une entree dans `nombre_ventes`

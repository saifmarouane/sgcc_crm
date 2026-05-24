# Documents Domain

Ce domaine gere les documents lies aux utilisateurs.

## Model

```ts
type Document = {
  id: string;
  user_id: string;
  document_file: string;
  createdAt: string;
  updatedAt: string;
};
```

Collection MongoDB: `documents`

Indexes:

- `user_id`

Note: `document_file` est actuellement une string. Elle peut contenir un nom de fichier, une URL, un chemin de stockage ou une cle de fichier. L'upload multipart n'est pas encore implemente.

## Endpoints

### Create Document

`POST /api/documents`

Payload:

```json
{
  "user_id": "665000000000000000000000",
  "document_file": "contracts/agent-contract.pdf"
}
```

Response `201`:

```json
{
  "document": {
    "id": "665222222222222222222222",
    "user_id": "665000000000000000000000",
    "document_file": "contracts/agent-contract.pdf",
    "createdAt": "2026-05-24T00:00:00.000Z",
    "updatedAt": "2026-05-24T00:00:00.000Z"
  }
}
```

### List Documents

`GET /api/documents`

Response `200`:

```json
{
  "documents": []
}
```

### Get Document

`GET /api/documents/:id`

### Update Document

`PATCH /api/documents/:id`

Payload:

```json
{
  "document_file": "contracts/agent-contract-v2.pdf"
}
```

### Delete Document

`DELETE /api/documents/:id`

Response `204`: no body.

## Validation Rules

- `user_id` is required.
- `document_file` is required.

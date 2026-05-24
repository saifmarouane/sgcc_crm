# Scores Domain

Ce domaine gere les scores des utilisateurs.

## Model

```ts
type Score = {
  id: string;
  user_id: string;
  score: number;
  scoreUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
};
```

Collection MongoDB: `scores`

Indexes:

- `user_id`

## Endpoints

### Create Score

`POST /api/scores`

Payload:

```json
{
  "user_id": "665000000000000000000000",
  "score": 85
}
```

Response `201`:

```json
{
  "score": {
    "id": "665111111111111111111111",
    "user_id": "665000000000000000000000",
    "score": 85,
    "scoreUpdatedAt": "2026-05-24T00:00:00.000Z",
    "createdAt": "2026-05-24T00:00:00.000Z",
    "updatedAt": "2026-05-24T00:00:00.000Z"
  }
}
```

### List Scores

`GET /api/scores`

Response `200`:

```json
{
  "scores": []
}
```

### Get Score

`GET /api/scores/:id`

Response `200`:

```json
{
  "score": {
    "id": "665111111111111111111111",
    "user_id": "665000000000000000000000",
    "score": 85,
    "scoreUpdatedAt": "2026-05-24T00:00:00.000Z",
    "createdAt": "2026-05-24T00:00:00.000Z",
    "updatedAt": "2026-05-24T00:00:00.000Z"
  }
}
```

### Update Score

`PATCH /api/scores/:id`

Payload:

```json
{
  "score": 92
}
```

Response `200`:

```json
{
  "score": {
    "id": "665111111111111111111111",
    "user_id": "665000000000000000000000",
    "score": 92,
    "scoreUpdatedAt": "2026-05-24T01:00:00.000Z",
    "createdAt": "2026-05-24T00:00:00.000Z",
    "updatedAt": "2026-05-24T01:00:00.000Z"
  }
}
```

### Delete Score

`DELETE /api/scores/:id`

Response `204`: no body.

## Validation Rules

- `user_id` is required.
- `score` must be a number.
- `scoreUpdatedAt` changes every time `score` is modified.

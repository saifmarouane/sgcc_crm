# Notifications Domain

Ce domaine gere les notifications des utilisateurs.

## Model

```ts
type Notification = {
  id: string;
  user_id: string;
  notification: string;
  createdAt: string;
  updatedAt: string;
};
```

Collection MongoDB: `notifications`

Indexes:

- `user_id`

## Endpoints

### Create Notification

`POST /api/notifications`

Payload:

```json
{
  "user_id": "665000000000000000000000",
  "notification": "Votre score a ete mis a jour."
}
```

Response `201`:

```json
{
  "notification": {
    "id": "665333333333333333333333",
    "user_id": "665000000000000000000000",
    "notification": "Votre score a ete mis a jour.",
    "createdAt": "2026-05-24T00:00:00.000Z",
    "updatedAt": "2026-05-24T00:00:00.000Z"
  }
}
```

### List Notifications

`GET /api/notifications`

Response `200`:

```json
{
  "notifications": []
}
```

### Get Notification

`GET /api/notifications/:id`

### Update Notification

`PATCH /api/notifications/:id`

Payload:

```json
{
  "notification": "Nouvelle notification."
}
```

### Delete Notification

`DELETE /api/notifications/:id`

Response `204`: no body.

## Validation Rules

- `user_id` is required.
- `notification` is required.

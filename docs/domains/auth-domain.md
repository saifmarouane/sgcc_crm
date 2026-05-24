# Auth / User Domain

Ce domaine gere l'authentification et les utilisateurs.

## User Model

```ts
type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  image: string;
  role: "admin" | "manager" | "agent";
  department_id: string;
  createdAt: string;
  updatedAt: string;
};
```

Le mot de passe n'est jamais retourne par l'API. Il est stocke en base sous forme de `passwordHash`.

## Environment

```env
MONGODB_URI=mongodb+srv://...
MONGODB_DB=sgcc_agents
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=7d
```

## Endpoints

### Register

`POST /api/auth/register`

Creer un utilisateur et retourne un JWT.

Payload:

```json
{
  "name": "Test Agent",
  "email": "agent@example.com",
  "phone": "+212600000000",
  "image": "https://example.com/avatar.png",
  "role": "agent",
  "department_id": "sales",
  "password": "password123"
}
```

Response `201`:

```json
{
  "user": {
    "id": "665000000000000000000000",
    "name": "Test Agent",
    "email": "agent@example.com",
    "phone": "+212600000000",
    "image": "https://example.com/avatar.png",
    "role": "agent",
    "department_id": "sales",
    "createdAt": "2026-05-24T00:00:00.000Z",
    "updatedAt": "2026-05-24T00:00:00.000Z"
  },
  "token": "<jwt>"
}
```

Possible errors:

```json
{ "error": "Email is already registered." }
```

```json
{ "error": "Password must contain at least 8 characters." }
```

### Login

`POST /api/auth/login`

Authentifie un utilisateur et retourne un JWT.

Payload:

```json
{
  "email": "agent@example.com",
  "password": "password123"
}
```

Response `200`:

```json
{
  "user": {
    "id": "665000000000000000000000",
    "name": "Test Agent",
    "email": "agent@example.com",
    "phone": "+212600000000",
    "image": "https://example.com/avatar.png",
    "role": "agent",
    "department_id": "sales",
    "createdAt": "2026-05-24T00:00:00.000Z",
    "updatedAt": "2026-05-24T00:00:00.000Z"
  },
  "token": "<jwt>"
}
```

Possible error:

```json
{ "error": "Invalid email or password." }
```

### Current User

`GET /api/auth/me`

Retourne l'utilisateur authentifie.

Headers:

```http
Authorization: Bearer <jwt>
```

Response `200`:

```json
{
  "user": {
    "id": "665000000000000000000000",
    "name": "Test Agent",
    "email": "agent@example.com",
    "phone": "+212600000000",
    "image": "https://example.com/avatar.png",
    "role": "agent",
    "department_id": "sales",
    "createdAt": "2026-05-24T00:00:00.000Z",
    "updatedAt": "2026-05-24T00:00:00.000Z"
  }
}
```

### Update Current User

`PATCH /api/auth/me`

Permet a l'utilisateur connecte de modifier son profil.

Headers:

```http
Authorization: Bearer <jwt>
```

Payload:

```json
{
  "name": "Test Agent",
  "email": "agent@example.com",
  "phone": "+212600000000",
  "image": "https://example.com/avatar.png",
  "department_id": "sales"
}
```

Possible errors:

```json
{ "error": "Authorization bearer token is required." }
```

```json
{ "error": "Invalid token." }
```

```json
{ "error": "Token expired." }
```

## Validation Rules

- `name`, `email`, `phone`, `role`, `department_id`, and `password` are required for register.
- `department_id` references a department from the `departments` collection.
- `email` must be a valid email format.
- `role` must be one of: `admin`, `manager`, `agent`.
- `password` must contain at least 8 characters.
- `email` is unique in the `users` MongoDB collection.

## JWT Payload

```json
{
  "sub": "665000000000000000000000",
  "email": "agent@example.com",
  "role": "agent",
  "department_id": "sales"
}
```

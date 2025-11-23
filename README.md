# Trip Together API

NestJS + Mongoose backend for trip planning with JWT auth (cookie + bearer).

## Features

- Auth: signup, login, logout, me (JWT in `token` cookie; bearer also supported)
- Trips CRUD with dates (MongoDB via Mongoose)
- Validation with class-validator/transformer
- CORS enabled, cookie parsing configured

## Requirements

- Node.js 18+
- MongoDB (local or cloud). For tests, an in-memory MongoDB is used automatically.

## Setup

```bash
npm install
```

Create a `.env` in the project root (the app also supports `.env.local`, `.env.development`, etc.).

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/trip-together
JWT_SECRET=changeme
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:3000
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
```

Environment variables are loaded with `@nestjs/config` and support `${VAR}` expansion.

## Run

```bash
# development
npm run start

# watch mode
npm run start:dev

# production build + run
npm run build
npm run start:prod
```

App listens on `http://localhost:${PORT:-4000}` and serves routes under `/api`.

## Quick API

- Base URL: `http://localhost:${PORT:-4000}/api`
- Auth: send cookie `token` (set by signup/login) or header `Authorization: Bearer <token>`

### Auth

- POST `/api/auth/signup`
  - Body: `{ "email": string, "password": string, "name": string }`
  - Sets httpOnly cookie `token`. Returns `{ token, user? }`.
- POST `/api/auth/login`
  - Body: `{ "email": string, "password": string }`
  - Sets httpOnly cookie `token`. Returns `{ token, user? }`.
- POST `/api/auth/logout`
  - Clears cookie. Returns `{ ok: true }`.
- GET `/api/auth/me`
  - Auth required. Returns the authenticated user (shape depends on strategy).

Example (login + me using cookie):

```bash
curl -i -c cookies.txt -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass","name":"User"}' \
  http://localhost:4000/api/auth/signup

curl -i -b cookies.txt http://localhost:4000/api/auth/me
```

You can also use bearer tokens:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:4000/api/auth/me
```

Trips endpoints are under `/api/trips` (see `src/trips`).

### Trips (auth required)

- GET `/api/trips`
  - List all trips (public listing as implemented in service).
- GET `/api/trips/user`
  - List trips for current user.
- POST `/api/trips`
  - Create a trip.
  - Body:
    ```json
    { "title": "Summer in Spain", "description": "Barcelona and Madrid" }
    ```
  - Response (example):
    ```json
    {
      "_id": "tripId",
      "title": "Summer in Spain",
      "description": "Barcelona and Madrid",
      "members": ["<ownerUserId>"],
      "dates": [],
      "accommodations": [],
      "places": [],
      "restaurants": [],
      "owner": "<ownerUserId>",
      "createdAt": "...",
      "updatedAt": "..."
    }
    ```
- GET `/api/trips/:id`
  - Get a trip by id.
- PATCH `/api/trips/:id`
  - Update fields.
  - Body:
    ```json
    { "title": "New title", "description": "Optional" }
    ```
- DELETE `/api/trips/:id`
  - Delete a trip (owner or allowed user as per service rules).
- POST `/api/trips/:id/join`
  - Join a trip as a member.
- POST `/api/trips/:id/dates`
  - Add a date option.
  - Body:
    ```json
    { "start": "2025-07-01", "end": "2025-07-05" }
    ```
- PATCH `/api/trips/:id/dates/vote?index=0&kind=up`
  - Vote on a date option.
  - Query params:
    - `index` — zero-based index of the date option
    - `kind` — `"up"` or `"down"`

### Places (public endpoints)

- GET `/api/places/autocomplete`
  - Get place autocomplete suggestions from Google Places API.
  - Query params:
    - `input` (required) — The text input from the user (minimum 2 characters)
    - `types` (optional) — Filter results by place type (e.g., `lodging` for hotels, `restaurant` for restaurants)
  - Response (example):
    ```json
    {
      "status": "OK",
      "predictions": [
        {
          "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
          "description": "Pittsburgh, PA, USA",
          "structured_formatting": {
            "main_text": "Pittsburgh",
            "secondary_text": "PA, USA"
          }
        }
      ]
    }
    ```
- GET `/api/places/details`
  - Get detailed information about a place by its place_id.
  - Query params:
    - `place_id` (required) — The place_id from the autocomplete prediction
  - Response (example):
    ```json
    {
      "status": "OK",
      "result": {
        "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
        "name": "Pittsburgh",
        "formatted_address": "Pittsburgh, PA, USA",
        "geometry": {
          "location": {
            "lat": 40.4406,
            "lng": -79.9959
          }
        }
      }
    }
    ```

## Testing

```bash
# unit tests
npm run test

# e2e tests (uses mongodb-memory-server)
npm run test:e2e

# coverage
npm run test:cov
```

## Troubleshooting

- Env not loading: ensure your `.env` file is at repo root and named one of `.env`, `.env.local`, `.env.development`, `.env.dev`, `.env.production`, `.env.prod`. Restart the dev server after changes.
- Mongo connection error: verify `MONGODB_URI`. In dev, the app falls back to `mongodb://localhost:27017/trip-together`.
- JWT secret missing: set `JWT_SECRET` (dev fallback `dev-secret` is used if not provided).
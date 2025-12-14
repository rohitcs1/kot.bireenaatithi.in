# Bireena Hotel Backend

Node.js + Express backend scaffold using Supabase as the Postgres datastore.

Quick start:

1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies: `npm install` in `backend/`.
3. Run migrations in Supabase (see `sql/schema.sql`).
4. Start server: `npm run dev` or `npm start`.

API:
- `POST /auth/login` - hotel user login
- `POST /auth/superadmin/login` - superadmin login
- `POST /superadmin/hotels` - create hotel (superadmin)
- `GET /superadmin/hotels` - list hotels (superadmin)

Examples (curl):

Superadmin login (server JWT):
```
curl -X POST http://localhost:4000/api/auth/superadmin/login -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"secret"}'
```

Create user (admin/manager):
```
curl -X POST http://localhost:4000/api/users -H "Authorization: Bearer <SUPABASE_TOKEN>" -H "Content-Type: application/json" -d '{"name":"John","email":"john@example.com","password":"pwd","role":"waiter"}'
```

Create an order:
```
curl -X POST http://localhost:4000/api/orders -H "Authorization: Bearer <SUPABASE_TOKEN>" -H "Content-Type: application/json" -d '{"table_id":1,"items":[{"menu_id":1,"qty":2,"price":100}]}'
```

# University Research Opportunity Portal

A web application where faculty members can post, view, update, close and delete research opportunities in one place.

- **Backend:** Node.js + Express REST API
- **Database:** MySQL
- **Frontend:** HTML, CSS, JavaScript, Bootstrap 5 (served by the backend)

**GitHub Repository:** https://github.com/Hizb-Ullah/research-opportunity-portal

**Author:** Hizb Ullah | Reg. No: P24-0623 | Class: CS 5C | Course: CN

---

## Project Structure

```
research-opportunity-portal/
├── server.js                 # Express app and CRUD routes
├── db.js                     # MySQL connection pool
├── validate.js               # Input validation
├── package.json
├── .env.example              # Copy to .env and fill in your values
├── database/
│   ├── schema.sql            # Database + table definition
│   └── setup.js              # Runs schema.sql using your .env credentials
├── public/                   # Frontend
│   ├── index.html
│   ├── style.css
│   └── app.js
└── postman/
    └── Research-Opportunity-Portal.postman_collection.json
```

## Prerequisites

- Node.js 18 or newer
- MySQL Server 8 (running locally)

## Setup and Run

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create the database user and tables.** On Linux:
   ```bash
   sudo mysql < database/schema.sql
   sudo mysql -e "CREATE USER IF NOT EXISTS 'portal'@'localhost' IDENTIFIED BY 'portal_pass'; GRANT ALL ON research_portal.* TO 'portal'@'localhost'; FLUSH PRIVILEGES;"
   ```
   On Windows/macOS, run `database/schema.sql` in MySQL Workbench (or `mysql -u root -p < database/schema.sql`), or use `npm run db:setup` after step 3 with a user that can create databases.

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Set `DB_USER` and `DB_PASSWORD` in `.env` to match your MySQL user (for example `portal` / `portal_pass`).
   The `.env` file is git-ignored, so credentials are never uploaded.

4. **Start the server**
   ```bash
   npm start
   ```
   You should see `MySQL connected` and `Server running at http://localhost:5000`.

5. **Open the app** at http://localhost:5000

## REST API

Base URL: `http://localhost:5000`

| Method | Endpoint                  | Description                      | Success |
|--------|---------------------------|----------------------------------|---------|
| POST   | `/api/opportunities`      | Create an opportunity            | 201     |
| GET    | `/api/opportunities`      | List all opportunities           | 200     |
| GET    | `/api/opportunities/:id`  | Get one opportunity              | 200     |
| PUT    | `/api/opportunities/:id`  | Update (full or partial fields)  | 200     |
| DELETE | `/api/opportunities/:id`  | Delete an opportunity            | 200     |

Error responses: **400** (validation failed, invalid ID, malformed JSON), **404** (opportunity not found), **500** (server/database error).

### Opportunity fields

| Field             | Type            | Notes                          |
|-------------------|-----------------|--------------------------------|
| `id`              | integer         | Auto-generated (AUTO_INCREMENT) |
| `title`           | string          | Required, max 200 chars        |
| `description`     | string          | Required                       |
| `research_area`   | string          | Required                       |
| `faculty_name`    | string          | Required                       |
| `department`      | string          | Required                       |
| `required_skills` | string          | Required                       |
| `positions`       | integer         | Required, at least 1           |
| `deadline`        | date            | Required, `YYYY-MM-DD`         |
| `status`          | `Open`/`Closed` | Optional on create (default Open) |

### Example request

```bash
curl -X POST http://localhost:5000/api/opportunities \
  -H "Content-Type: application/json" \
  -d '{"title":"Deep Learning for Medical Imaging","description":"Detect anomalies in X-rays.","research_area":"AI","faculty_name":"Dr. Ayesha Khan","department":"Computer Science","required_skills":"Python, PyTorch","positions":2,"deadline":"2026-12-15"}'
```

## Testing with Postman

1. Import `postman/Research-Opportunity-Portal.postman_collection.json` into Postman (Bruno can import it too).
2. Make sure the server is running. The collection's `baseUrl` variable is `http://localhost:5000`.
3. Run the requests in order, or use the Collection Runner. They cover:
   1. Creating three opportunities (IDs are saved automatically)
   2. Retrieving all opportunities
   3. Retrieving one by ID
   4. Updating an opportunity
   5. Changing status from Open to Closed
   6. Deleting an opportunity
   7. Requesting the deleted opportunity (404 Not Found)
   8. Sending invalid data (400 Bad Request)

## Frontend Features

- Table of all opportunities (loaded from the API), with search and status filter
- View full details of an opportunity
- Create form, edit form, one-click Close, and delete with confirmation
- Success and error messages
- Client-side validation of required fields (plus server-side validation)

## Notes

- No credentials are stored in the repository; use `.env` (see `.env.example`).
- All data is read from and written to MySQL; nothing is hard-coded in the frontend.

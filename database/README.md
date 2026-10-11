# Database setup (MongoDB)

The app stores data in MongoDB using Mongoose. There is no SQL schema to run:
the collection is created automatically the first time an opportunity is saved.

- **Database name:** `research-portal` (taken from the end of `MONGO_URI`)
- **Collection:** `opportunities`
- **Schema definition:** [`../models/Opportunity.js`](../models/Opportunity.js)

## Setup with MongoDB Atlas (free)

1. Create a free account at https://www.mongodb.com/cloud/atlas and create a free **M0** cluster.
2. **Database Access** -> add a database user (username + password).
3. **Network Access** -> add your IP address (or `0.0.0.0/0` for development).
4. **Connect** -> **Drivers** -> copy the connection string.
5. Put it in `.env` as `MONGO_URI`, adding the database name before the `?`:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/research-portal?retryWrites=true&w=majority`

## Document shape

```json
{
  "_id": "665f1c2e8b3a4d0012ab34cd",
  "title": "Deep Learning for Medical Image Analysis",
  "description": "Develop CNN models to detect anomalies in chest X-rays.",
  "research_area": "Artificial Intelligence",
  "faculty_name": "Dr. Ayesha Khan",
  "department": "Computer Science",
  "required_skills": "Python, PyTorch, Deep Learning",
  "positions": 2,
  "deadline": "2026-12-15T00:00:00.000Z",
  "status": "Open",
  "createdAt": "...",
  "updatedAt": "..."
}
```

The API returns `_id` as `id` and the deadline as `YYYY-MM-DD`.

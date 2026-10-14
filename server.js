require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');
const { validateOpportunity } = require('./validate');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // serves the frontend

// Columns that can be written through the API
const FIELDS = [
  'title',
  'description',
  'research_area',
  'faculty_name',
  'department',
  'required_skills',
  'positions',
  'deadline',
  'status',
];

const clean = (v) => (typeof v === 'string' ? v.trim() : v);
const validId = (id) => /^\d+$/.test(id);

// ---------- 1. CREATE ----------
app.post('/api/opportunities', async (req, res) => {
  try {
    const errors = validateOpportunity(req.body, false);
    if (errors.length) return res.status(400).json({ message: 'Validation failed', errors });

    const b = req.body;
    const [result] = await pool.execute(
      `INSERT INTO opportunities
       (title, description, research_area, faculty_name, department, required_skills, positions, deadline, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clean(b.title),
        clean(b.description),
        clean(b.research_area),
        clean(b.faculty_name),
        clean(b.department),
        clean(b.required_skills),
        Number(b.positions),
        b.deadline,
        b.status || 'Open',
      ]
    );
    const [rows] = await pool.execute('SELECT * FROM opportunities WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ---------- 2. READ ALL ----------
app.get('/api/opportunities', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM opportunities ORDER BY id DESC');
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ---------- 3. READ ONE ----------
app.get('/api/opportunities/:id', async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'ID must be a positive number' });
    const [rows] = await pool.execute('SELECT * FROM opportunities WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Research opportunity not found' });
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ---------- 4. UPDATE ----------
app.put('/api/opportunities/:id', async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'ID must be a positive number' });

    const errors = validateOpportunity(req.body, true);
    if (errors.length) return res.status(400).json({ message: 'Validation failed', errors });

    const sets = [];
    const values = [];
    for (const f of FIELDS) {
      if (req.body[f] !== undefined) {
        sets.push(`${f} = ?`);
        values.push(f === 'positions' ? Number(req.body[f]) : clean(req.body[f]));
      }
    }
    if (!sets.length) return res.status(400).json({ message: 'No valid fields provided to update' });

    values.push(req.params.id);
    const [result] = await pool.execute(`UPDATE opportunities SET ${sets.join(', ')} WHERE id = ?`, values);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Research opportunity not found' });

    const [rows] = await pool.execute('SELECT * FROM opportunities WHERE id = ?', [req.params.id]);
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ---------- 5. DELETE ----------
app.delete('/api/opportunities/:id', async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'ID must be a positive number' });
    const [result] = await pool.execute('DELETE FROM opportunities WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Research opportunity not found' });
    res.status(200).json({ message: 'Research opportunity deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Unknown API route -> 404 JSON
app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found' }));

// Malformed JSON body -> 400
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON in request body' });
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

if (require.main === module) {
  // Check the database connection before accepting requests
  pool
    .query('SELECT 1')
    .then(() => {
      console.log('MySQL connected');
      app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
    })
    .catch((err) => {
      console.error('Could not connect to MySQL: ' + err.message);
      console.error('Check DB_USER / DB_PASSWORD / DB_NAME in .env and that you ran: npm run db:setup');
      process.exit(1);
    });
}

module.exports = app;

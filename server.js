require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');
const Opportunity = require('./models/Opportunity');
const { validateOpportunity } = require('./validate');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // serves the frontend

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

// MongoDB ObjectIds are 24 hex characters
const validId = (id) => /^[a-f\d]{24}$/i.test(id);

// Only keep known fields from the request body
function pickFields(body) {
  const out = {};
  for (const f of FIELDS) if (body[f] !== undefined) out[f] = body[f];
  return out;
}

function handleError(res, err) {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Validation failed', errors: Object.values(err.errors).map((e) => e.message) });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid value provided' });
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
}

// ---------- 1. CREATE ----------
app.post('/api/opportunities', async (req, res) => {
  try {
    const errors = validateOpportunity(req.body, false);
    if (errors.length) return res.status(400).json({ message: 'Validation failed', errors });

    const created = await Opportunity.create(pickFields(req.body));
    res.status(201).json(created);
  } catch (err) {
    handleError(res, err);
  }
});

// ---------- 2. READ ALL ----------
app.get('/api/opportunities', async (req, res) => {
  try {
    const list = await Opportunity.find().sort({ createdAt: -1 });
    res.status(200).json(list);
  } catch (err) {
    handleError(res, err);
  }
});

// ---------- 3. READ ONE ----------
app.get('/api/opportunities/:id', async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid opportunity ID' });
    const found = await Opportunity.findById(req.params.id);
    if (!found) return res.status(404).json({ message: 'Research opportunity not found' });
    res.status(200).json(found);
  } catch (err) {
    handleError(res, err);
  }
});

// ---------- 4. UPDATE ----------
app.put('/api/opportunities/:id', async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid opportunity ID' });

    const errors = validateOpportunity(req.body, true);
    if (errors.length) return res.status(400).json({ message: 'Validation failed', errors });

    const updates = pickFields(req.body);
    if (!Object.keys(updates).length) return res.status(400).json({ message: 'No valid fields provided to update' });

    const updated = await Opportunity.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Research opportunity not found' });
    res.status(200).json(updated);
  } catch (err) {
    handleError(res, err);
  }
});

// ---------- 5. DELETE ----------
app.delete('/api/opportunities/:id', async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid opportunity ID' });
    const deleted = await Opportunity.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Research opportunity not found' });
    res.status(200).json({ message: 'Research opportunity deleted successfully' });
  } catch (err) {
    handleError(res, err);
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
  connectDB()
    .then(() => app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`)))
    .catch((err) => {
      console.error('Could not start: ' + err.message);
      process.exit(1);
    });
}

module.exports = app;

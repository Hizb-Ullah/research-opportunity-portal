const REQUIRED = [
  'title',
  'description',
  'research_area',
  'faculty_name',
  'department',
  'required_skills',
  'positions',
  'deadline',
];

const isValidDate = (s) =>
  typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));

/**
 * Validates an opportunity payload.
 * partial=false (POST): all fields required.
 * partial=true  (PUT):  only supplied fields are checked.
 * Returns an array of error strings (empty = valid).
 */
function validateOpportunity(body, partial = false) {
  const errors = [];
  if (!body || typeof body !== 'object') return ['Request body must be a JSON object'];

  for (const f of REQUIRED) {
    const present = body[f] !== undefined && body[f] !== null && String(body[f]).trim() !== '';
    if (!present) {
      if (!partial) errors.push(`${f} is required`);
      continue;
    }
    if (f === 'positions') {
      const n = Number(body[f]);
      if (!Number.isInteger(n) || n < 1) errors.push('positions must be a whole number of at least 1');
    } else if (f === 'deadline') {
      if (!isValidDate(body[f])) errors.push('deadline must be a valid date in YYYY-MM-DD format');
    } else if (f === 'title' && String(body[f]).length > 200) {
      errors.push('title must be 200 characters or fewer');
    }
  }

  if (body.status !== undefined && !['Open', 'Closed'].includes(body.status)) {
    errors.push("status must be either 'Open' or 'Closed'");
  }
  return errors;
}

module.exports = { validateOpportunity, REQUIRED };

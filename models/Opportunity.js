const mongoose = require('mongoose');

// Schema for a research opportunity. MongoDB creates the "opportunities" collection automatically.
const opportunitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true },
    research_area: { type: String, required: true, trim: true },
    faculty_name: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    required_skills: { type: String, required: true, trim: true },
    positions: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: 'positions must be a whole number' },
    },
    deadline: { type: Date, required: true },
    status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
  },
  { timestamps: true }
);

// Return a clean JSON shape: "id" instead of "_id", date as YYYY-MM-DD, no __v.
opportunitySchema.set('toJSON', {
  transform: (doc, ret) => ({
    id: ret._id.toString(),
    title: ret.title,
    description: ret.description,
    research_area: ret.research_area,
    faculty_name: ret.faculty_name,
    department: ret.department,
    required_skills: ret.required_skills,
    positions: ret.positions,
    deadline: ret.deadline instanceof Date ? ret.deadline.toISOString().slice(0, 10) : ret.deadline,
    status: ret.status,
    created_at: ret.createdAt,
    updated_at: ret.updatedAt,
  }),
});

module.exports = mongoose.model('Opportunity', opportunitySchema);

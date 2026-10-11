require('dotenv').config();
const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set. Copy .env.example to .env and fill in your MongoDB connection string.');
  }
  if (uri.includes('<username>') || uri.includes('<password>') || uri.includes('xxxxx')) {
    throw new Error('MONGO_URI still contains placeholder values. Put your real Atlas username, password and cluster host in .env.');
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 45000 });
  console.log('MongoDB connected');
}

module.exports = connectDB;

const dotenv = require('dotenv');

dotenv.config();

const connectDatabase = require('../config/db');
const seedDefaultAdmin = require('../services/seedDefaultAdmin');

const run = async () => {
  await connectDatabase();
  await seedDefaultAdmin();
  process.exit(0);
};

run().catch((error) => {
  console.error('Admin seed failed:', error.message);
  process.exit(1);
});

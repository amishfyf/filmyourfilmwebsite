const bcrypt = require('bcryptjs');
const { getAdminConfig } = require('../config/admin');
const Admin = require('../models/Admin');

const seedDefaultAdmin = async () => {
  const existingAdmin = await Admin.findOne().select('_id').lean();

  if (existingAdmin) {
    return existingAdmin;
  }

  const { defaultAdminName, defaultAdminPassword } = getAdminConfig();
  const passwordHash = await bcrypt.hash(defaultAdminPassword, 12);

  const admin = await Admin.create({
    name: defaultAdminName,
    passwordHash,
  });

  console.log(`Seeded default admin account: ${defaultAdminName}`);

  if (!process.env.DEFAULT_ADMIN_PASSWORD) {
    console.log('Using fallback default admin password: change-this-admin-password');
  }

  return admin;
};

module.exports = seedDefaultAdmin;
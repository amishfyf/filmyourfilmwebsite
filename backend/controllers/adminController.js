const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { getAdminConfig } = require('../config/admin');

const signAdminToken = (admin) => {
  const { jwtSecret, jwtExpiresIn } = getAdminConfig();

  return jwt.sign(
    {
      role: 'admin',
      sub: admin._id.toString(),
    },
    jwtSecret,
    {
      expiresIn: jwtExpiresIn,
    }
  );
};

const loginAdmin = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password || !String(password).trim()) {
      return res.status(400).json({
        message: 'Password is required.',
      });
    }

    const admin = await Admin.findOne().sort({ createdAt: 1 });

    if (!admin) {
      return res.status(503).json({
        message: 'No admin account is seeded yet.',
      });
    }

    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid admin password.',
      });
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    return res.status(200).json({
      token: signAdminToken(admin),
      admin: {
        name: admin.name,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  loginAdmin,
};

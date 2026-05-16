const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { getAdminConfig } = require('../config/admin');

const requireAdminAuth = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization || '';

    if (!authorizationHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Admin authentication is required.',
      });
    }

    const token = authorizationHeader.slice('Bearer '.length).trim();
    const { jwtSecret } = getAdminConfig();
    const decoded = jwt.verify(token, jwtSecret);
    const admin = await Admin.findById(decoded.sub).select('_id name').lean();

    if (!admin) {
      return res.status(401).json({
        message: 'Admin session is no longer valid.',
      });
    }

    req.admin = admin;
    return next();
  } catch (error) {
    return res.status(401).json({
      message: 'Admin session is invalid or expired.',
    });
  }
};

module.exports = {
  requireAdminAuth,
};

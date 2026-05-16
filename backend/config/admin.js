const getAdminConfig = () => ({
  defaultAdminName: process.env.DEFAULT_ADMIN_NAME || 'studio-admin',
  defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD || 'change-this-admin-password',
  jwtSecret: process.env.JWT_SECRET || 'change-this-jwt-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
});

module.exports = {
  getAdminConfig,
};

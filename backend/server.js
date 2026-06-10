const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const connectDatabase = require('./config/db');
const adminRoutes = require('./routes/adminRoutes');
const projectRoutes = require('./routes/projectRoutes');
const contactRoutes = require('./routes/contactRoutes');
const settingRoutes = require('./routes/settingRoutes');
const seedDefaultAdmin = require('./services/seedDefaultAdmin');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const resolveCorsOrigin = () => {
  const configuredOrigins = process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
    : [];

  if (!configuredOrigins.length) {
    return true;
  }

  return configuredOrigins;
};

connectDatabase();

app.use(
  cors({
    origin: resolveCorsOrigin(),
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/admin', adminRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/settings', settingRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({
    message: error.message || 'Internal server error.',
  });
});

const startServer = async () => {
  await connectDatabase();
  await seedDefaultAdmin();

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error('Server failed to start:', error.message);
  process.exit(1);
});

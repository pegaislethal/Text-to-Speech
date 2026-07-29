const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

try {
  require('dns').setServers(['1.1.1.1', '8.8.8.8']);
} catch (dnsErr) {
  console.warn('Failed to set fallback DNS servers:', dnsErr.message);
}

const User = require('../models/user');

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('Error: MONGODB_URI environment variable is not set in backend/.env');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@21sttech.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';
    const adminName = process.env.ADMIN_NAME || 'System Administrator';

    let adminUser = await User.findOne({ email: adminEmail });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);
    const permissions = ['MANAGE_USERS', 'MANAGE_PREMIUM', 'VIEW_ANALYTICS', 'MANAGE_ADMINS', 'all'];

    if (adminUser) {
      console.log(`Updating existing user ${adminEmail} to Administrator...`);
      adminUser.name = adminName;
      adminUser.passwordHash = passwordHash;
      adminUser.role = 'admin';
      adminUser.permissions = permissions;
      adminUser.isActive = true;
      adminUser.premiumAccess = true;
      await adminUser.save();
      console.log(`Successfully updated admin user: ${adminEmail}`);
    } else {
      console.log(`Creating initial admin user ${adminEmail}...`);
      adminUser = new User({
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: 'admin',
        permissions,
        isActive: true,
        premiumAccess: true,
        freeCredits: 99999,
        usedCredits: 0
      });
      await adminUser.save();
      console.log(`Successfully created initial admin user: ${adminEmail}`);
    }

    console.log('\n--- ADMIN CREDENTIALS ---');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('-------------------------\n');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('Seed Admin error:', error);
    process.exit(1);
  }
};

seedAdmin();

require('dotenv').config();
const config = require('config');
const connectDB = require('../../config/db'); 
const SuperAdmin = require('../models/SuperAdmin');
const mongoose = require('mongoose');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


async function createSuperAdmin() {
  try {
    // Connect to database using your config
    await connectDB(config);
    console.log('Database connected successfully');

    // Get credentials from terminal
    const username = await new Promise((resolve) => {
      rl.question('Enter username for superadmin: ', resolve);
    });

    const password = await new Promise((resolve) => {
      rl.question('Enter password: ', resolve);
    });

    // Check if user already exists
    const existingUser = await SuperAdmin.findOne({ username });
    if (existingUser) {
      console.error('Superadmin with this username already exists');
      process.exit(1);
    }

    // Create new superadmin
    const superadmin = new SuperAdmin({
      username,
      password,
      role: 'superadmin'
    });

    await superadmin.save();
    console.log('Superadmin created successfully!');
    console.log(`Username: ${username}`);

  } catch (error) {
    console.error('Error creating superadmin:', error);
  } finally {
    rl.close();
    mongoose.disconnect();
  }
}

createSuperAdmin();
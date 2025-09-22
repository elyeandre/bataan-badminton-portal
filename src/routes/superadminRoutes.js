const express = require('express');
const router = express.Router();
const path = require('path');
const config = require('config');
const roleChecker = require('../middleware/roleChecker');
const verifyToken = require('../middleware/authJwt');
const serveFile = require('../utils/fileUtils');
const {
  getSuperadminDashboard,
  handleCourtApproval,
  getAllUsers,
  getCourtOwners,
  getCourtById,
  searchUsers,
  updateUser,
  deleteUser,
  getUserById
} = require('../controllers/superadminController');

let routes = (app) => {
  router.get('/dashboard', verifyToken, roleChecker(['superadmin']), getSuperadminDashboard);

  router.patch('/court/:action/:courtId', verifyToken, roleChecker(['superadmin']), handleCourtApproval);

  router.get('/users', verifyToken, roleChecker(['superadmin']), getAllUsers);
  
  router.get('/users/search', verifyToken, roleChecker(['superadmin']), searchUsers);
  
  router.get('/users/:userId', verifyToken, roleChecker(['superadmin']), getUserById);
  
  router.put('/users/:userId', verifyToken, roleChecker(['superadmin']), updateUser);
  
  router.delete('/users/:userId', verifyToken, roleChecker(['superadmin']), deleteUser);

  router.get('/courts', verifyToken, roleChecker(['superadmin']), getCourtOwners);

  router.get('/court-details/:courtId', verifyToken, roleChecker(['superadmin']), getCourtById);

  app.use('/superadmin', router);
};

module.exports = routes;

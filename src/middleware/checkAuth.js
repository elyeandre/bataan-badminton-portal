const jwt = require('jsonwebtoken');
const config = require('config');
const { isTokenBlacklisted } = require('../utils/blackListUtils');
const createError = require('http-errors');

const checkAuth = async (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return next(); // No token: public access
  }

  try {
    // Check if token is blacklisted
    const blacklistedToken = await isTokenBlacklisted(token, 'access');
    if (blacklistedToken) {
      // Clear stale cookies and allow page to load (avoid endless redirect loop)
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      // If user is already requesting /login or /register just continue
      if (['/login','/register'].includes(req.path)) return next();
      return res.redirect('/login');
    }

    // verify the token
    const decoded = jwt.verify(token, config.get('jwtSecret'));
    req.user = decoded; // Store user information in the request object

    // redirect based on user role
    // Prevent redirect loop: if already at a target destination skip
    const roleRedirectMap = {
      player: '/user/dashboard',
      coach: '/user/dashboard',
      admin: '/user/admin/view-post',
      superadmin: '/superadmin/dashboard'
    };
    const target = roleRedirectMap[decoded.role];
    if (!target) {
      return next(createError(403, 'Role not authorized'));
    }
    if (req.path !== target) {
      return res.redirect(target);
    }
    // already at the target route
    return next();
  } catch (err) {
    // if token is invalid, proceed to next middleware (public route)
    console.error('JWT verification failed:', err);
  }
  // proceed to the next middleware if no redirection occurred
  next();
};

module.exports = checkAuth;

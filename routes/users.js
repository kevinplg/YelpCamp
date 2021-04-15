const express = require('express');
const router = express.Router();
const passport = require('passport');
const catchAsync = require('../utils/catchAsync');
const users = require('../controllers/users'); // require controller

// register route
router.route('/register')
    .get(users.registerGet)
    .post(catchAsync(users.registerPost));

// login route
router.route('/login')
    .get(users.loginGet)
    .post(passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), users.loginPost)
// passport.authenticate() is a middleware which is going to expect us to specify the strategy local. We can have multiple strategies 

// logout route
router.get('/logout', users.logout)

module.exports = router;
const User = require('../models/user');

// register route
module.exports.registerGet = (req, res) => {
    res.render('users/register'); // find ejs file here
}
module.exports.registerPost = async (req, res, next) => {
    try {
        const { email, username, password } = req.body; // get email, username and password from req.body
        const user = new User({ email, username }); // save email and username to user
        const registeredUser = await User.register(user, password); // passport method to register a new user instance with a given password, also check the username is unique. store the hashed and salted password
        req.login(registeredUser, err => { // auto loggin registered user
            if (err) return next(err);
            req.flash('success', 'Welcome to Yelp Camp!'); // flash success message 
            res.redirect('/campgrounds');
        })
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('register');
    }
}

// login route
module.exports.loginGet = (req, res) => {
    res.render('users/login');
}
module.exports.loginPost = (req, res) => {
    req.flash('success', 'welcome back!');
    const redirectUrl = req.session.returnTo || '/campgrounds'; // if user just directly click to login, there will not be returnTo, and it will redirect to /campgrounds
    delete req.session.returnTo;  // empty returnTo
    res.redirect(redirectUrl);
}

// logout route
module.exports.logout = (req, res) => {
    req.logout();
    req.flash('success', "Goodbye!");
    res.redirect('/campgrounds');
}
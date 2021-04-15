if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}
// process.env.NODE_ENV is an environment variable that is just development or production
// we have been running in development this whole time, but eventually when we deploy, we will be running our code in production
// and we are saying if we are runing in development mode, require the dotenv package (which is going to take the cariables we have define in the .env file), and add them into process
// so we can access them in this file or any of my other files
// we dont really do this in production. there is another way of setting environment variable where we dont store them on ta file

const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local'); // we are using local login in this project
const User = require('./models/user');
const mongoSanitize = require('express-mongo-sanitize'); // mongo sanitize - protect mongo injection
const helmet = require('helmet'); // security middleware
const MongoDBStore = require("connect-mongo")(session); // require connect-mongo: store session to mongo

// const dbUrl = process.env.DB_URL; // mongo Altas database
// const dbUrl = 'mongodb://localhost:27017/yelp-camp' // mongoose local database
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';

// require routes
const usersRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews')

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
})

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

app.engine('ejs', ejsMate);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public'))); // tell express to serve  "public folder"
app.use(mongoSanitize()); // To remove data
app.use(helmet()); // use 11 of helmet security middlewares

const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

const store = new MongoDBStore({ // create new mongo store for session
    url: dbUrl, // same as our mongo database url
    secret, // pass secret string if we want
    touchAfter: 24 * 60 * 60 // time period in seconds. This means if there is not any update from last time, don't update it everytime users re-flesh it. update it every 24 hours.
});

store.on("error", function (e) { // if there is any error
    console.log("SESSION STORE ERROR", e)
})

const sessionConfig = { // default store is memory store, and we want it to store to mongo
    store, // use mongo to store data
    name: 'session', // this is the name of the cookie instead of connect.sid(the default name). Somebody could know that is what he want to extract from this user, and steal user's session information. Use name can protect that.
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true, // this is a little extra security thing. if it is true, the cookie cannot be accessed through 3rd party
        // secure: true, // this means that this cookie should only work over https(http secure). localhost is not https, so we are not using this right now.
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // want this expire after a week, initial date.now() is in milliseconds
        maxAge: 1000 * 60 * 60 * 24 * 7 // mean users can not stay forever once they sign in, after a week, it will expire
    }
}

app.use(session(sessionConfig)); // session need to be before the passport.session()
app.use(flash());
app.use(helmet()); // autometic use 11 security middleware

const scriptSrcUrls = [
    "https://cdn.jsdelivr.net",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://cdn.jsdelivr.net",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(  // pass our own options to ontentSecurityPolicy inside helmet
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dkqqjnuym/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! cloud_name in .env file. I am using Colt's cloud_name right now as I am too lazy to upload image to cloudinary "douqbebwk"
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);


app.use(passport.initialize()); // middleware is required to initialize passport
app.use(passport.session()); // if your application uses persistent login session, this middleware must also be used
passport.use(new LocalStrategy(User.authenticate())); // tell passport to use the local strategy, and the authentication method is going to be located on our user model (authenticate method is the static method automatically generate by passport in our model)
// we can add more strategies later like facebook login, google login

passport.serializeUser(User.serializeUser()); // tell passport how to serialize a user. Serialisation refers to how to store a user in the session.
passport.deserializeUser(User.deserializeUser()); // tell passport how to get a user out of the session

// flash middleware
app.use((req, res, next) => {
    console.log(req.session)
    res.locals.currentUser = req.user; // we should access to current user in all templates
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.use('/', usersRoutes);
app.use('/campgrounds', campgroundRoutes); // use the campgrounds routes, prefix them as ‘/shelter’
app.use('/campgrounds/:id/reviews', reviewRoutes);
// to access to :id, we need to set "const router = express.Router({ mergeParams: true });" in reviews.js

app.get('/', (req, res) => {
    res.render('home')
});

// Error handling basic 404 error (url that dont recognize)
// app.all() every single request
app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

// Error handling, err is pass from app.all() because we use next() on app.use(), and the statusCode and message is from ExpressError
// use statusCode = 500 as default value
// will not use message = 'Something Went Wrong'  default values because we will need to pass err to the error.ejs
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err
    if (!err.message) err.message = 'Something Went Wrong'
    res.status(statusCode).render('error', { err })
})

const port = process.env.PORT || 3000; // Heroku has is own port, so we can change the port like this. If we use locally, it will be port 3000. If we use Heroku, it will be an actual port variable that's variable and we will use that post
app.listen(port, () => {
    console.log(`Serving on port ${port}`)
})

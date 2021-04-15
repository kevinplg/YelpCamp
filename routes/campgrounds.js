const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync'); // be careful, we are in the different folder now, need “..”
const { isLoggedIn, isAuthor, validateCampground } = require('../middleware'); // middlewares
const campgrounds = require('../controllers/campgrounds'); // require campgrounds controller 
const multer = require('multer'); // require multer middleware to handle multipart/form-data
const { storage } = require('../cloudinary'); // require storage we config in cloudinary folder. we dont need to specific index.js here as it will auto look for .js file.
const upload = multer({ storage }); // execute multer and set destination for our upload

router.route('/')
    .get(catchAsync(campgrounds.index)) //show all
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.newPost)); // post new campground  

router.get('/new', isLoggedIn, campgrounds.newGet); // add new campground form. /new need to put before /:id otherwise it will treate new as an id

router.route('/:id')
    .get(catchAsync(campgrounds.show)) // show detail on single campground
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(campgrounds.editPost)) // edit campground
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.delete)); // delete campground

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.editGet)); // edit campground form

module.exports = router;

// ***** before group *****

// //show all
// router.get('/', catchAsync(campgrounds.index)); // move logic to controller, and require index function from campgrounds controller

// add new
// router.get('/new', isLoggedIn, campgrounds.newGet);
// router.post('/', validateCampground, isLoggedIn, catchAsync(campgrounds.newPost));

// show detail on one camp
// router.get('/:id', catchAsync(campgrounds.show));

// edit
// router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.editGet));
// router.put('/:id', validateCampground, isLoggedIn, isAuthor, catchAsync(campgrounds.editPost));

// delete
// router.delete('/:id', isLoggedIn, isAuthor, catchAsync(campgrounds.delete));

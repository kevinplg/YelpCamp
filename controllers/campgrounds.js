const Campground = require('../models/campground'); // requrir schema
const { cloudinary } = require("../cloudinary"); // cloudinary tool to store our image
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding"); // mapbox API, require geocoding service
const mapBoxToken = process.env.MAPBOX_TOKEN; // access our token from .env file
const geocoder = mbxGeocoding({ accessToken: mapBoxToken }); // pass token when we instantiate a new mapbox

// index route
module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds })
}

// create new route
module.exports.newGet = (req, res) => {
    res.render('campgrounds/new')
}
module.exports.newPost = async (req, res, next) => {
    //this just basic logicallows us to customoze the message in the status code and message
    // if (!req.body.campground) throw new ExpressError('Invalid Campground Data', 400);
    // we use campground[] in the new.ejs, so we will need req.body.campground
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1 // how manu resulte you want to show
    }).send();
    const campground = new Campground(req.body.campground);
    campground.geometry = geoData.body.features[0].geometry; // long and lat are store in geoData.body.features[0].geometry.coordinates
    campground.images = req.files.map(f => ({ url: f.path, filename: f.filename })); // req.files to request files upload to cloudinary
    campground.author = req.user._id;
    await campground.save();
    req.flash('success', 'Successfully create a new campgroud!'); // flash message after save
    res.redirect(`/campgrounds/${campground._id}`)
}

// show route
module.exports.show = async (req, res) => {
    const { id } = req.params; // also can just use const campground = await (await Campground.findById(req.params.id)
    const campground = await Campground.findById(id).populate({
        path: 'reviews',
        populate: {
            path: 'author',
        } // populate nest array: populate review from campground, and populate author from review.
    }).populate('author'); // this is campground author
    if (!campground) { // if we delete the campground, but some how go to the bookmark webpage
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { campground })
}

// edit route
module.exports.editGet = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) { // edit campgound is not exist
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground })
}
module.exports.editPost = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, req.body.campground, { runValidators: true, new: true });
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename })); // new imgs array
    campground.images.push(...imgs); // we use push here because we are not override images, and we want to add image. '...imgs' spread operator, takes in an array and expands it into individual elements
    await campground.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    req.flash('success', 'Successfully updated campgroud!');
    res.redirect(`/campgrounds/${campground._id}`);
}

// delete route
module.exports.delete = async (req, res) => {
    const { id } = req.params;
    const deletedCamp = await Campground.findByIdAndDelete(id); // delete in database
    req.flash('success', 'Successfully deleted campground!');
    res.redirect('/campgrounds');
}
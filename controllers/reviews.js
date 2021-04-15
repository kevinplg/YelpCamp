// requrir schemas
const Review = require('../models/review');
const Campground = require('../models/campground');

// create new review route
module.exports.new = async (req, res) => {
    const campground = await Campground.findById(req.params.id); // find campground 
    const review = new Review(req.body.review); // create new review
    review.author = req.user._id;
    campground.reviews.push(review); // push to campground schema
    await review.save();
    await campground.save();
    req.flash('success', 'Successfully created a new review!');
    res.redirect(`/campgrounds/${campground._id}`);
}

// delete route
module.exports.delete = async (req, res) => {
    const { id, reviewId } = req.params;
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } }); //pull the reviewId from the reviews array
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted review!');
    res.redirect(`/campgrounds/${id}`);
}
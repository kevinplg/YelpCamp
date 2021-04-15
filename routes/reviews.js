const express = require('express');
const router = express.Router({ mergeParams: true });
const catchAsync = require('../utils/catchAsync'); // be careful, we are in the different folder now, need “..”
const { isLoggedIn, isReviewAuthor, validateReview } = require('../middleware'); // middlewares
const reviews = require('../controllers/reviews'); // require controller

// submit a review to this route
router.post('/', validateReview, isLoggedIn, catchAsync(reviews.new))

// delete a review
router.delete('/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(reviews.delete))

module.exports = router;
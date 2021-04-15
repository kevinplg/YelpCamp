const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    email: { // we dont need to specify password and username because we are use UserSchema.plugin to add on
        type: String,
        required: true,
        unique: true
    }
});

// add on username and password to UserSchema, and make sure username is unique, and other methods
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
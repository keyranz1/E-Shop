const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: String
})

exports.User = mongoose.model('User', userSchema);
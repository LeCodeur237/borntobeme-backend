const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
    _id: {
        type: String, // Mongoose can store UUIDs as strings
        default: uuidv4, // Automatically generate a UUID v4 on creation
    },
    fullname: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    datebirthday: {
        type: Date,
        required: true
    },
    linkphoto: {
        type: String
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: true
    }
}, { timestamps: true }); // Automatically add createdAt and updatedAt

const User = mongoose.model('User', userSchema);

module.exports = User;

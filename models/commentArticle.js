const mongoose = require('mongoose');
const { Schema } = mongoose; // Using Schema alias for conciseness

const commentArticleSchema = new Schema({
    article: { // ID of the article this comment belongs to
        type: String,
        ref: 'Article', // Assuming Article model's _id is a String (e.g., UUID)
        required: true,
        index: true // Index for faster queries on article comments
    },
    user: { // ID of the user who made the comment
        type: String,
        ref: 'User', // User model's _id is a String (UUID)
        required: true,
        index: true // Index for faster queries on user comments
    },
    content: {
        type: String,
        required: true,
        trim: true // Good practice to trim whitespace
    },
    parentComment: { // For replies: ID of the parent comment
        type: Schema.Types.ObjectId, // Refers to another CommentArticle's _id (which is ObjectId by default)
        ref: 'CommentArticle',
        default: null, // Top-level comments will have this as null
        index: true // Index if you query for replies of a specific comment
    },
    // createdAt and updatedAt will be automatically managed by timestamps: true
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Mongoose automatically creates an _id of type ObjectId for this schema
// unless explicitly overridden.

const CommentArticle = mongoose.model('CommentArticle', commentArticleSchema);

module.exports = CommentArticle;

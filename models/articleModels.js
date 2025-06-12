const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    ref: "User",
    required: true,
  },
  status: { // Renamed from statut
    type: String,
    required: true,
    enum: ['draft', 'published', 'archived'], // Example status values
    default: 'draft', // Default status
  },
}, {
  timestamps: true // Automatically adds and manages createdAt and updatedAt
});

const Article = mongoose.model("Article", articleSchema);

module.exports = Article;

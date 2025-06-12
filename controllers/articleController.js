const Article = require('../models/articleModels'); // Adjust path if your model is elsewhere
const User = require('../models/userModels'); // Needed to validate author if not using mongoose population for that

// @desc    Get all articles
// @route   GET /api/borntobeme/articles
// @access  Public
const getAllArticles = async (req, res) => {
    try {
        // Basic pagination (optional, can be enhanced)
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const articles = await Article.find()
            .populate('author', 'fullname email') // Populate author details
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip(skip)
            .limit(limit);

        const totalArticles = await Article.countDocuments();

        res.status(200).json({
            success: true,
            count: articles.length,
            totalPages: Math.ceil(totalArticles / limit),
            currentPage: page,
            data: articles,
        });
    } catch (error) {
        console.error('Error fetching articles:', error);
        res.status(500).json({ success: false, message: 'Server Error: Could not fetch articles' });
    }
};

// @desc    Create a new article
// @route   POST /api/borntobeme/articles
// @access  Private (Admin) - as per route definition
const createArticle = async (req, res) => {
    try {
        const { title, content, category, status } = req.body; // Added category, status; removed tags
        const authorId = req.user._id; // Assuming `protect` middleware adds user to req.user

        // Validate required fields from the model
        if (!title || !content || !category) {
            return res.status(400).json({ success: false, message: 'Please provide title, content, and category' });
        }
        // Optionally, verify author exists if not relying solely on JWT validity
        // const authorExists = await User.findById(authorId);
        // if (!authorExists) {
        //     return res.status(400).json({ success: false, message: 'Author not found' });
        // }

        const article = await Article.create({
            title,
            content,
            author: authorId,
            category,
            status: status || undefined, // Use provided status or let Mongoose default apply
        });

        // To return the created article with populated author details:
        const populatedArticle = await Article.findById(article._id).populate('author', 'fullname email');

        res.status(201).json({ success: true, data: populatedArticle });
    } catch (error) {
        console.error('Error creating article:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Server Error: Could not create article' });
    }
};

// @desc    Get a single article by ID
// @route   GET /api/borntobeme/articles/:id
// @access  Public
const getArticleById = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id).populate('author', 'fullname email');

        if (!article) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }
        res.status(200).json({ success: true, data: article });
    } catch (error) {
        console.error('Error fetching article by ID:', error);
        if (error.kind === 'ObjectId') { // Mongoose specific error for invalid ID format
             return res.status(400).json({ success: false, message: 'Invalid article ID format' });
        }
        res.status(500).json({ success: false, message: 'Server Error: Could not fetch article' });
    }
};

// @desc    Update an article
// @route   PUT /api/borntobeme/articles/:id
// @access  Private (Admin) - as per route definition
const updateArticle = async (req, res) => {
    try {
        let article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }

        // The route already checks for admin role. If you needed to check if req.user is the author:
        // if (article.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        //    return res.status(403).json({ success: false, message: 'User not authorized to update this article' });
        // }

        article = await Article.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // Return the modified document
            runValidators: true, // Run schema validators on update
        }).populate('author', 'fullname email');

        res.status(200).json({ success: true, data: article });
    } catch (error) {
        console.error('Error updating article:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        if (error.kind === 'ObjectId') {
             return res.status(400).json({ success: false, message: 'Invalid article ID format' });
        }
        res.status(500).json({ success: false, message: 'Server Error: Could not update article' });
    }
};

// @desc    Delete an article
// @route   DELETE /api/borntobeme/articles/:id
// @access  Private (Admin) - as per route definition
const deleteArticle = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }

        // Authorization is handled by middleware. If specific author check was needed:
        // if (article.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        //    return res.status(403).json({ success: false, message: 'User not authorized to delete this article' });
        // }

        await article.deleteOne(); // or Article.findByIdAndDelete(req.params.id);

        res.status(200).json({ success: true, message: 'Article deleted successfully' });
    } catch (error) {
        console.error('Error deleting article:', error);
         if (error.kind === 'ObjectId') {
             return res.status(400).json({ success: false, message: 'Invalid article ID format' });
        }
        res.status(500).json({ success: false, message: 'Server Error: Could not delete article' });
    }
};

module.exports = {
    getAllArticles,
    createArticle,
    getArticleById,
    updateArticle,
    deleteArticle,
};
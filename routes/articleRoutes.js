const express = require('express');
const {
  getAllArticles,
  createArticle,
  getArticleById,
  updateArticle,
  deleteArticle,
} = require('../controllers/articleController'); // Assuming controllers are in articleController.js or an index.js in controllers/

const { protect, authorize } = require('../middleware/auth'); // Import middleware

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Article:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the article.
 *           example: "60c72b2f9b1e8c001c8e4d8f"
 *         title:
 *           type: string
 *           description: Title of the article.
 *           example: "Understanding REST APIs"
 *         content:
 *           type: string
 *           description: Main content of the article.
 *           example: "REST stands for Representational State Transfer..."
 *         author:
 *           type: string # Or an object if populated, matching User schema _id
 *           description: ID of the user who authored the article.
 *           example: "507f1f77bcf86cd799439011"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of article creation.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last article update.
 *
 *     ArticleInput:
 *       type: object
 *       required:
 *         - title
 *         - category # Added category as it's required in the model
 *         - content
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the article.
 *           example: "New Article on Node.js"
 *         content:
 *           type: string
 *           description: Main content of the article.
 *           example: "Node.js is a JavaScript runtime built on Chrome's V8 engine..."
 *         category:
 *           type: string
 *           description: Category of the article.
 *           example: "Technology"
 *
 *   securitySchemes:
 *     bearerAuth: # This should be defined globally in your main swagger setup,
 *                 # but included here for completeness if articleRoutes is processed standalone.
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   name: Articles
 *   description: Article management
 */

/**
 * @swagger
 * /api/borntobeme/articles:
 *   get:
 *     summary: Retrieve a list of all articles
 *     tags: [Articles]
 *     responses:
 *       '200':
 *         description: A list of articles.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Article'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse' # Assuming ErrorResponse is defined globally
 *   post:
 *     summary: Create a new article
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ArticleInput'
 *     responses:
 *       '201':
 *         description: Article created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
 *       '400':
 *         description: Invalid input
 *       '401':
 *         description: Unauthorized (token missing or invalid)
 *       '403':
 *         description: Forbidden (user does not have admin role)
 *       '500':
 *         description: Internal server error
 */
router.route('/')
  .get(getAllArticles)
  .post(protect, authorize('admin'), createArticle);

/**
 * @swagger
 * /api/borntobeme/articles/{id}:
 *   get:
 *     summary: Retrieve a single article by ID
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The article ID
 *     responses:
 *       '200':
 *         description: A single article.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
 *       '404':
 *         description: Article not found
 *       '500':
 *         description: Internal server error
 *   put:
 *     summary: Update an existing article
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The article ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ArticleInput'
 *     responses:
 *       '200':
 *         description: Article updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
 *       '400':
 *         description: Invalid input
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: Article not found
 *       '500':
 *         description: Internal server error
 *   delete:
 *     summary: Delete an article
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The article ID
 *     responses:
 *       '200':
 *         description: Article deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Article deleted successfully
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: Article not found
 *       '500':
 *         description: Internal server error
 */
router
  .route('/:id')
  .get(getArticleById)
  .put(protect, authorize('admin'), updateArticle)
  .delete(protect, authorize('admin'), deleteArticle);

module.exports = router;

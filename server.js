require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const authRoutes = require('./routes/authRoutes');
const articleRoutes = require('./routes/articleRoutes');
const mongoose = require('mongoose'); // Import Mongoose

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 8081;
const MONGODB_URI = process.env.MONGODB_URI;

// Connect to MongoDB
if (!MONGODB_URI) {
    console.error('FATAL ERROR: MONGODB_URI is not defined in .env file');
    process.exit(1); // Exit the application if DB URI is not set
}

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true, // These options are generally recommended, though some might be default in newer Mongoose versions
    useUnifiedTopology: true,
    // useCreateIndex: true, // Not needed for Mongoose 6+
    // useFindAndModify: false // Not needed for Mongoose 6+
}).then(() => console.log('Successfully connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));


// Swagger setup
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'ConnectBox API with Authentication',
            version: '1.0.0',
            description: 'API documentation using Swagger',
        },
        servers: [
            { url: 'http://149.102.137.13:8081' } // Remplacez par l'URL de votre backend
        ],
    },
    apis: ['./routes/*.js'], // Location of API routes
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/api/borntobeme/auth', authRoutes);
app.use('/api/borntobeme/articles', articleRoutes);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const fs = require('fs');
fs.writeFileSync('./swagger.json', JSON.stringify(swaggerDocs, null, 2));
require('dotenv').config();
const mysql = require('mysql2/promise');

const { MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_PORT } = process.env;

const dbConfig = {
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    port: MYSQL_PORT || 3306, // Default MySQL port
};

const dbName = MYSQL_DATABASE;

async function initializeDatabase() {
    let connection;
    try {
        // 1. Connect to MySQL server (without specifying a database)
        connection = await mysql.createConnection(dbConfig);
        console.log('Successfully connected to MySQL server.');

        // 2. Create the database if it doesn't exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        console.log(`Database '${dbName}' ensured.`);
        await connection.end(); // Close initial connection

        // 3. Connect to the specific database
        connection = await mysql.createConnection({
            ...dbConfig,
            database: dbName,
        });
        console.log(`Successfully connected to database '${dbName}'.`);

        // 4. Create users table if it doesn't exist
        const createUsersTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) PRIMARY KEY,
                fullname VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                datebirthday DATE,
                linkphoto VARCHAR(2083) NULL,
                role ENUM('user', 'admin') DEFAULT 'user',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `;
        await connection.query(createUsersTableQuery);
        console.log("Table 'users' ensured.");

        // 5. Create articles table if it doesn't exist
        const createArticlesTableQuery = `
            CREATE TABLE IF NOT EXISTS articles (
                id VARCHAR(36) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                category VARCHAR(255) NOT NULL,
                author_id VARCHAR(36) NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `;
        // Note: ON DELETE CASCADE means if a user is deleted, their articles are also deleted.
        // You might prefer ON DELETE SET NULL (if author_id can be NULL) or ON DELETE RESTRICT.
        await connection.query(createArticlesTableQuery);
        console.log("Table 'articles' ensured.");

        console.log('Database initialization completed successfully.');

    } catch (error) {
        console.error('Error during database initialization:', error);
        process.exit(1); // Exit with an error code
    } finally {
        if (connection) {
            await connection.end();
            console.log('MySQL connection closed.');
        }
    }
}

initializeDatabase();
const dbcreds = require('./DbConfig');
const mysql = require('mysql');

// Create connection pool instead of single connection for better performance and reliability
const pool = mysql.createPool({
    host: dbcreds.DB_HOST,
    user: dbcreds.DB_USER,
    password: dbcreds.DB_PWD,
    database: dbcreds.DB_DATABASE,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0
});

// Helper function to get connection from pool
function getConnection() {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                return reject(err);
            }
            resolve(connection);
        });
    });
}

// Fixed SQL injection vulnerability by using parameterized queries
function addTransaction(amount, desc) {
    return new Promise((resolve, reject) => {
        pool.query(
            'INSERT INTO `transactions` (`amount`, `description`) VALUES (?, ?)',
            [amount, desc],
            function(err, result) {
                if (err) {
                    console.error('Error adding transaction:', err);
                    return reject(err);
                }
                console.log("Transaction added successfully");
                resolve(200);
            }
        );
    }).catch(err => {
        console.error('Transaction error:', err);
        throw err;
    });
}

function getAllTransactions(callback) {
    pool.query("SELECT * FROM transactions", function(err, result) {
        if (err) {
            console.error("Error getting transactions:", err);
            throw err;
        }
        console.log("Getting all transactions...");
        return callback(result);
    });
}

function findTransactionById(id, callback) {
    // Use parameterized query to prevent SQL injection
    pool.query("SELECT * FROM transactions WHERE id = ?", [id], function(err, result) {
        if (err) {
            console.error(`Error retrieving transaction with id ${id}:`, err);
            throw err;
        }
        console.log(`Retrieving transaction with id ${id}`);
        return callback(result);
    });
}

function deleteAllTransactions(callback) {
    pool.query("DELETE FROM transactions", function(err, result) {
        if (err) {
            console.error("Error deleting all transactions:", err);
            throw err;
        }
        console.log("Deleting all transactions...");
        return callback(result);
    });
}

function deleteTransactionById(id, callback) {
    // Use parameterized query to prevent SQL injection
    pool.query("DELETE FROM transactions WHERE id = ?", [id], function(err, result) {
        if (err) {
            console.error(`Error deleting transaction with id ${id}:`, err);
            throw err;
        }
        console.log(`Deleting transaction with id ${id}`);
        return callback(result);
    });
}


// Add a health check function to verify database connectivity
function checkDatabaseConnection() {
    return new Promise((resolve, reject) => {
        pool.query('SELECT 1', (err, results) => {
            if (err) {
                console.error('Database connection error:', err);
                return reject(err);
            }
            resolve(true);
        });
    });
}

// Fix duplicate export of deleteAllTransactions
module.exports = {
    addTransaction,
    getAllTransactions,
    deleteAllTransactions,
    findTransactionById,
    deleteTransactionById,
    checkDatabaseConnection
};








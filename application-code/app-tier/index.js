const transactionService = require('./TransactionService');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const os = require('os');

// Use native fetch if available (Node.js 18+), otherwise use node-fetch
let fetch;
if (typeof global.fetch === 'function') {
    fetch = global.fetch;
} else {
    fetch = require('node-fetch');
}

const app = express();
const port = process.env.PORT || 4000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// ROUTES FOR OUR API
// =======================================================

//Health Checking with database connectivity verification
app.get('/health', async (req, res) => {
    try {
        // Check database connectivity
        await transactionService.checkDatabaseConnection();
        res.json({
            status: "healthy",
            message: "Service is running and database connection is established",
            timestamp: new Date().toISOString(),
            hostname: os.hostname()
        });
    } catch (err) {
        res.status(500).json({
            status: "unhealthy",
            message: "Database connection failed",
            error: err.message,
            timestamp: new Date().toISOString(),
            hostname: os.hostname()
        });
    }
});

// ADD TRANSACTION
app.post('/transaction', async (req, res) => {
    try {
        // Input validation
        if (!req.body.amount || isNaN(parseFloat(req.body.amount))) {
            return res.status(400).json({ message: 'Invalid amount value' });
        }
        
        if (!req.body.desc || typeof req.body.desc !== 'string') {
            return res.status(400).json({ message: 'Invalid description value' });
        }
        
        // Log sanitized inputs
        console.log('Adding transaction:', {
            amount: parseFloat(req.body.amount),
            description: req.body.desc
        });
        
        // Fixed comparison operator (was using assignment = instead of comparison ==)
        const success = await transactionService.addTransaction(req.body.amount, req.body.desc);
        if (success == 200) {
            res.status(201).json({ 
                message: 'Transaction added successfully',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({ message: 'Failed to add transaction' });
        }
    } catch (err) {
        console.error('Error in POST /transaction:', err);
        res.status(500).json({ 
            message: 'Something went wrong while processing your request', 
            error: err.message 
        });
    }
});

// GET ALL TRANSACTIONS
app.get('/transaction',(req,res)=>{
    try{
        var transactionList = [];
       transactionService.getAllTransactions(function (results) {
            console.log("we are in the call back:");
            for (const row of results) {
                transactionList.push({ "id": row.id, "amount": row.amount, "description": row.description });
            }
            console.log(transactionList);
            res.statusCode = 200;
            res.json({"result":transactionList});
        });
    }catch (err){
        res.json({message:"could not get all transactions",error: err.message});
    }
});

//DELETE ALL TRANSACTIONS
app.delete('/transaction',(req,res)=>{
    try{
        transactionService.deleteAllTransactions(function(result){
            res.statusCode = 200;
            res.json({message:"delete function execution finished."})
        })
    }catch (err){
        res.json({message: "Deleting all transactions may have failed.", error:err.message});
    }
});

//DELETE ONE TRANSACTION
app.delete('/transaction/id', (req,res)=>{
    try{
        //probably need to do some kind of parameter checking
        transactionService.deleteTransactionById(req.body.id, function(result){
            res.statusCode = 200;
            res.json({message: `transaction with id ${req.body.id} seemingly deleted`});
        })
    } catch (err){
        res.json({message:"error deleting transaction", error: err.message});
    }
});

//GET SINGLE TRANSACTION
app.get('/transaction/id',(req,res)=>{
    //also probably do some kind of parameter checking here
    try{
        transactionService.findTransactionById(req.body.id,function(result){
            res.statusCode = 200;
            var id = result[0].id;
            var amt = result[0].amount;
            var desc= result[0].desc;
            res.json({"id":id,"amount":amt,"desc":desc});
        });

    }catch(err){
        res.json({message:"error retrieving transaction", error: err.message});
    }
});

  app.listen(port, () => {
    console.log(`AB3 backend app listening at http://localhost:${port}`)
  })

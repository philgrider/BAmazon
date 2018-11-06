var mysql = require("mysql");
var inquirer = require("inquirer"); 
var cTable = require('console.table')
var env = require('dotenv');
env.config();

var connection = mysql.createConnection({
  host: "127.0.0.1",

  // Your port; if not 3306
  port: 3306,

  // Your username
  user: "root",

  // Your password
  password: process.env.mysqlPassword,
  database: "bamazonDB"
});
//Establish connection//
connection.connect((err) => {
  if (err) throw err;
  printInventory(startCustomer);
});
//Start Customer purchase//
function startCustomer() {
    inquirer
    .prompt({
        name: "id",
        type: "input",
        message: "What is the ID of the item you would like to purchase? [Quit with Q]: ",
    }).then((answer) => {
        if (answer.id.toLowerCase() === "q" || answer.id.toLowerCase() === 'quit'){
            connection.end();
        }
        else{
            //Check if there is an ID from the user answer//
            connection.query('SELECT item_ID FROM products ', (err, res) => {
            if (err) throw err;
            // Check number if item_ID's to insure the user chose an item from the list//
            if(answer.id < res.length){
                //Go to next question
                howManyQuestion(answer.id);
                return;
            }else{
                //start over and choose again//
                console.log('Please pick an Item number from the list.');
                printInventory(startCustomer);
                return;
            }
            });
        };
    });
};
 //How many question //
function howManyQuestion(id){  
  inquirer
  .prompt({
    name: "quantity",
    type: "input",
    message: "How many would you like to purchase? [Quit with Q]: ",
}).then((answer) => {
    if (answer.quantity.toLowerCase() === "q" || answer.quantity.toLowerCase() === 'quit'){
        connection.end();
    }
    //checks that there is enough of the choosen item
    checkInventory(id, answer.quantity);
});
};
  function checkInventory(id, quantity){
      //query item by ID and verify quantity//
        var queryInventoryItem = 'SELECT stock_quantity FROM products WHERE item_ID = ?';
        connection.query(queryInventoryItem,id, (err, res) =>{
            if (err) throw err;
            if((res[0].stock_quantity - quantity) >= 0){
                console.log('Quantity Purchase: ' + quantity);
                //Update the stock quantity of the purchased item
                updateStock(id, quantity);
            }else{
                //re-ask the question because there is not enough//
                console.log('Insufficient quantity please try again.')
                howManyQuestion(id);
            };
            return;
        });
  };
  function updateStock (id, quantity){
      // Get the current total inventory then Subtract the purchase and update the total.
    var queryInventoryItem = 'SELECT item_ID, price, stock_quantity FROM products WHERE item_ID = ?';
    connection.query(queryInventoryItem,id, function (err, res) {
        if (err) throw err;
        //Print the purchase total//
        console.log('Your purchase total is $' + (parseInt(res[0].price) * quantity));
        makeNewPurchase();
        return;
    });
    // Update the inventory by item.
    var updateInventory = 'UPDATE products SET stock_quantity = stock_quantity - ? WHERE item_ID = ?';
    connection.query(updateInventory,[quantity,id], (err, res) => {
        if (err) throw err;
        return;
    });
    
};
    // start the purchase process again //
  function printInventory(startCustomer) {
      connection.query("SELECT * FROM products", function(err, res) {
        if (err) throw err;
        // Log all results of the SELECT statement
        console.log('\n')
        console.table(res);
        startCustomer();
  });
  };
  //final ask if they want to make another purchase//
function makeNewPurchase() {
    inquirer
    .prompt({
      name: "answer",
      type: "confirm",
      message: "Would you like to make another purchase? ",
      default:'y'
  }).then((answer) => {
      if (answer.answer === true ){
          printInventory(startCustomer);
      }else{
          connection.end();
      }
      
  })
};

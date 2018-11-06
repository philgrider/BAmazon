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

connection.connect((err) => {
  if (err) throw err;
  printInventory(startCustomer);
});
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
            connection.query('SELECT item_ID FROM products ', (err, res) => {
            if (err) throw err;
            // console.log(res);
            if(answer.id < res.length){
                nextQuestion(answer.id);
                return;
            }else{
                console.log('Please pick an Item number from the list.');
                printInventory(startCustomer);
                return;
            }
            });
        };
    });
};
 
function nextQuestion(id){  
  inquirer
  .prompt({
    name: "quantity",
    type: "input",
    message: "How many would you like to purchase? [Quit with Q]: ",
}).then((answer) => {
    if (answer.quantity.toLowerCase() === "q" || answer.quantity.toLowerCase() === 'quit'){
        connection.end();
    }
    checkInventory(id, answer.quantity);
});
};
  function checkInventory(id, quantity){
        var queryInventoryItem = 'SELECT stock_quantity FROM products WHERE item_ID = ?';
        connection.query(queryInventoryItem,id, (err, res) =>{
            if (err) throw err;
            // console.log('Current Inventory: '+ res[0].stock_quantity);
            if((res[0].stock_quantity - quantity) >= 0){
                console.log('Quantity Purchase: ' + quantity);
                updateStock(id, quantity);
            }else{
                console.log('Insufficient quantity please try again.')
                nextQuestion(id);
            };
            return;
        });
  };
  function updateStock (id, quantity){
    var queryInventoryItem = 'SELECT item_ID, price, stock_quantity FROM products WHERE item_ID = ?';
    connection.query(queryInventoryItem,id, function (err, res) {
        if (err) throw err;
        console.log('Your purchase total is $' + (parseInt(res[0].price) * quantity));
        makeNewPurchase();
        return;
    });
    var updateInventory = 'UPDATE products SET stock_quantity = stock_quantity - ? WHERE item_ID = ?';
    connection.query(updateInventory,[quantity,id], (err, res) => {
        if (err) throw err;
        return;
    });
    
};
  function printInventory(startCustomer) {
      connection.query("SELECT * FROM products", function(err, res) {
        if (err) throw err;
        // Log all results of the SELECT statement
        console.log('\n')
        console.table(res);
        startCustomer();
  });
  };
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

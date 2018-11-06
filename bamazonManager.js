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
  startManager();
});
function startManager() {
    inquirer
    .prompt({
        name: "choice",
        type: "list",
        message: "Choose from the list below: ",
        choices: ["View Products for Sale","View Low Inventory",
                 "Add to Inventory","Add New Product","Quit"],
        default: 0
    }).then((answer) => {
        switch (answer.choice){
            case "View Products for Sale":
            printInventory();
            break;
            case "View Low Inventory":
            viewLowInventory();
            break;
            case "Add to Inventory":
            addInventory();
            break;
            case "Add New Product":
            addProduct();
            break;
            case "Quit":
            connection.end();
            break;
        }
    });
};
// Show Inventory //
function printInventory() {
    connection.query("SELECT * FROM products", function(err, res) {
        if (err) throw err;
        // Log all results of the SELECT statement
        console.log('\n')
        console.table(res);
        startManager();
});
};
function viewLowInventory() {
    connection.query("SELECT * FROM products WHERE stock_quantity < 5", function(err, res) {
        if (err) throw err;
        // Log all results of the SELECT statement
        console.log('\n')
        console.table(res);
        startManager();
});
};
function addInventory() {
    connection.query("SELECT * FROM products", (err, res) => {
        if (err) throw err;
        // Log all results of the SELECT statement
        console.log('\n')
        console.table(res);
    inquirer
    .prompt([{
        name: "id",
        type: "input",
        message: "Which Item would you like to add Inventory? ",
        validate: (value) => {
            if (isNaN(value) === false) {
              return true;
            }
            return false;
          }
    },
    {
        name: "quantity",
        type: "input",
        message: "How many would you like to add? ",
        validate: (value) => {
            if (isNaN(value) === false) {
              return true;
            }
            return false;
          }
    }]).then((answer) => {
        //Check if there is an ID from the user answer//
        if(answer.quantity > 0){
        connection.query('SELECT item_ID FROM products ', (err, res) => {
            if (err) throw err;
            // Check number if item_ID's to insure the user chose an item from the list//
            if(answer.id < res.length){
                //Go to next question
                updateStock(answer.id, answer.quantity);
                return;
            }else{
                //start over and choose again//
                console.log('Please pick an Item number from the list.');
                addInventory();
                return;
            };
            });    
        };
    });
});
};
function updateStock (id, quantity){
    // Update the total.//
    var updateInventory = 'UPDATE products SET stock_quantity = stock_quantity + ? WHERE item_ID = ?';
    connection.query(updateInventory,[quantity,id], (err, res) => {
        if (err) throw err;
        startManager();
        return;
    });
};
function addProduct() {
    connection.query("SELECT * FROM products", (err, res)=> {
        if (err) throw err;
    inquirer
    .prompt([{
        name: "product_name",
        type: "input",
        message: "Wwhat is the name of the product? ",
        validate: (name)=>{
            for(var i = 0; i < res.length;i++){
                if (res[i].product_name === name){
                    console.log('\nProduct already exists, Please choose another name.');
                    return false;
                }
            }
            return true;
        }
    },
    {
        name: "department_name",
        type: "input",
        message: "What is the department name? "

    },
    {
        name: "price",
        type: "input",
        message: "What is the price per item? ",
        validate: (value) => {
            if (isNaN(value) === false) {
              return true;
            }
            return false;
          }
    },
    {
        name: "stock_quantity",
        type: "input",
        message: "How many would you like to add? ",
        validate: (value) => {
            if (isNaN(value) === false) {
              return true;
            }
            return false;
          }

    }]).then((answer) => {
        //add Item//
        var addProductQuery = "INSERT INTO products ";
        addProductQuery = addProductQuery + "(product_name, department_name, price, stock_quantity)";
        addProductQuery = addProductQuery + "VALUES (?,?,?,?);"
        productArray = [answer.product_name, answer.department_name, answer.price, answer.stock_quantity];
        console.log(addProductQuery);
        connection.query(addProductQuery, productArray, (err, res) => {
            if (err) throw err;
            startManager();
        });
    });
});
};
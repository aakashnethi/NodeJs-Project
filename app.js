var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('users_database');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.post('/login', function(req, res) {
  res.contentType('json');
  if(req.body.username && req.body.password) {
    db.serialize(function() {
      db.each('SELECT * FROM Users WHERE username = "'+req.body.username+'" AND password = "'+req.body.password+'";', function(err, row) {
        if(err) console.log("Error:" +  err);
        if(typeof row == "undefined") {
          res.send({ error: 'Incorrect Credentials'});
        } else {
          console.log("row is: ", row);
           res.send({ success: 'User Authenticated'});
        }
      }, function(err, rows) {
        if (rows == 0) {
          res.send({ error: 'Incorrect Credentials'});
        }
      });
    });
 
  } else {
    res.send({ error: 'Login Failed'});
  }
});

app.post('/register', function(req, res){
  res.contentType('json');
  if(req.body.username && req.body.password) {
    db.serialize(function() {
      db.each('SELECT * FROM Users WHERE username = "'+req.body.username+'";', function(err, row) {
        if(err) 
          console.log("Error:" +  err);
        else {
          res.send({ error: 'User Already Exists'});
        }
      }, function(err, rows) {
        if (rows == 0) {
          console.log("Creating User");
          db.run("INSERT INTO Users (username, password, firstname, lastname) VALUES (?,?,?,?)", req.body.username, req.body.password, req.body.firstname, req.body.lastname);
          res.send({ success: 'User Created'});
        }
      });
    });
 
  } else {
    res.send({ error: 'Somethign went wrong'});
  }
});

app.post('/addProduct', function(req, res){
  res.contentType('json');
  db.serialize(function() {
    db.run("INSERT INTO Products (productname, price, description) VALUES (?,?,?)", req.body.productname, req.body.productprice, req.body.productdesc);
    res.send({ success: 'Product Added'});
  });
});


app.get('/allProducts', function(req, res) {
  res.contentType('json');
  var products = [];
  db.serialize(function() {
    db.each('SELECT * FROM Products;', function(err, row) {
      if(err) 
        console.log("Error:" +  err);
      else {
        var product = {};
        product.productname = row.productname;
        product.price = row.price;
        product.description = row.description;
        
 
        products.push(product);
      }
    }, function(err, rows) {
      res.send({ allProducts: products});
    });
  });

});

app.get('/allUsers', function(req, res) {
  res.contentType('json');
  var users = [];
  db.serialize(function() {
    db.each('SELECT * FROM Users;', function(err, row) {
      if(err) 
        console.log("Error:" +  err);
      else {
        var user = {};
        user.username = row.username;
        user.password = row.password;
        user.firstname = row.firstname;
        user.lastname = row.lastname;
 
        users.push(user);
      }
    }, function(err, rows) {
      if (rows == 0) {
        console.log("no Users");
        res.send({ error: 'no Users'});
      } else {
        res.send({ allusers: users});
      }
    });
  });
  

});

app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;

//Create SQLite Database Table
db.serialize(function() {
  db.run("CREATE TABLE IF NOT EXISTS Users (uId INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,password TEXT NOT NULL, firstname TEXT NOT NULL, lastname TEXT NOT NULL);");
  db.run("CREATE TABLE IF NOT EXISTS Products (pId INTEGER PRIMARY KEY AUTOINCREMENT, productname TEXT NOT NULL,price TEXT NOT NULL, description TEXT NOT NULL);");
});

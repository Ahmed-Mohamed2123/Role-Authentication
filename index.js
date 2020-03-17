const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const { success, error } = require('consola');
const { connect } = require('mongoose');
const passport = require('passport');

// Bring in the app constants
const { DB, PORT } = require('./config/index');

// Initialize the app 
const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(passport.initialize());

require("./middlewares/passport")(passport);

// User routers middleware
app.use("/api/users", require('./routes/users'));

// Connection with DB
const startApp = async () => {
  try {
    // Connection With DB
    await connect(DB, {
      useFindAndModify: true,
      useUnifiedTopology: true,
      useNewUrlParser: true
    });

    success({
      message: `Successfully connected with the Database \n${DB}`,
      badge: true
    });

    // Start Listenting for the server on PORT
    app.listen(PORT, () =>
      success({ message: `Server started on PORT ${PORT}`, badge: true })
    );
  } catch (err) {
    error({
      message: `Unable to connect with Database \n${err}`,
      badge: true
    });
    startApp();
  }
};

startApp();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const passport = require('passport')
const { SECRET } = require('../config/index');

/**
    @DESC To register the user (ADMIN, SUPER_ADMIN, USER)
**/

const userRegister = async (userDets, role, res) => {
  try {
    // Validate the username
    let usernameNotTaken = await validateUsername(userDets.username);
    if (!usernameNotTaken) {
      return res.status(400).json({
        message: `Username is already taken.`,
        success: false
      });
    }

    // validate the email
    let emailNotRegistered = await validateEmail(userDets.email);
    if (!emailNotRegistered) {
      return res.status(400).json({
        message: `Email is already registered.`,
        success: false
      });
    }

    // Get the hashed password
    const password = await bcrypt.hash(userDets.password, 12);
    // create a new user
    const newUser = new User({
      ...userDets,
      password,
      role
    });

    await newUser.save();
    return res.status(201).json({
      message: "Hurry! now you are successfully registred. Please nor login.",
      success: true
    });
  } catch (err) {
    // Implement logger function (winston)
    console.log(err)
    return res.status(500).json({
      message: "Unable to create your account.",
      success: false
    });
  }
};

/**
  @DESC To Login the user (ADMIN, SUPER_ADMIN, USER)
**/

const userLogin = async (userCreds, role, res) => {
  let { username, password } = userCreds;
  // First Check if the username is in the Database
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(404).json({
      message: "Username is not found. Invalid login creadentials.",
      success: false
    });
  }
  // We will check the role
  if (user.role != role) {
    return res.status(403).json({
      message: "Please make sure you are logging in form the right portal.",
      success: false
    });
  }
  // That means user is existing and trying to signin from the right portal
  // Now check for the password
  let isMatch = await bcrypt.compare(password, user.password);
  if (isMatch) {
    // Sign in the token and issue it to the user
    let token = jwt.sign({
      user_id: user._id,
      role: user.role, 
      username: user.username,
      email: user.email
    }, 
      SECRET, 
      { expiresIn: "7 days" }
    );

    let result = {
      username: user.username,
      role: user.role,
      email: user.email,
      token,
      expiresIn: 168
    };

    return res.status(200).json({
      ...result,
      message: "Hurray! You are now logged in.",
      success: true
    })

  } else {
    return res.status(403).json({
      message: "Incorrect password.",
      success: false
    });
  }
};

const validateUsername = async username => {
  let user = await User.findOne({ username });
  return user ? false : true;
};

/** 
  @DESC passport middlewate
*/
const userAuth = passport.authenticate("jwt", { session: false });

const validateEmail = async email => {
    let user = await User.findOne({ email });
    return user ? false : true;
};

/**
 * @DESC Check Role Middleware 
**/
const checkRole = roles => (req, res, next) =>
  !roles.includes(req.user.role)
    ? res.status(401).json("Unauthorized")
    : next();

const serializeUser = user => {
  return {
    username: user.username,
    email: user.email,
    name: user.name,
    _id: user._id,
    updatedAt: user.updatedAt,
    createdAt: user.createdAt
  }
};

module.exports = {
  checkRole,
  userAuth,
  userRegister,
  userLogin,
  serializeUser
};
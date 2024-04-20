const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
// const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { count } = require("console");
const { trusted } = require("mongoose");

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// Sign Up
exports.addtUser = asyncHandler(async (req, res) => {
  const { name, dob, gender, phone, bio, userType, email, password, photo } =
    req.body;

  if (!name || !email || !password || !phone || !dob || !gender || !userType) {
    res.status(400);
    throw new Error("Please all fields are required.");
  }

  const userExist = await User.findOne({ email: email });

  if (userExist) {
    res.status(400);
    throw new Error("Please email has been used. Choose another.");
  }

  const user = await User.create(req.body);
  //   Generate Token
  const token = generateToken(user._id);

  // Send HTTP-only cookie
  res.cookie("artikonToken", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), // 1 day
    sameSite: "none",
    secure: true,
  });

  if (user) {
    const { name, dob, gender, phone, bio, userType, email, password, photo } =
      user;
    res.status(201).json({
      name,
      dob,
      gender,
      phone,
      bio,
      userType,
      email,
      photo,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// Get user by id
exports.getUser = asyncHandler(async (req, res) => {
  let { id } = req.params;
  const user = await User.findById({ _id: id });
  if (user) {
    const { name, dob, gender, phone, bio, userType, email, password, photo } =
      user;
    res.status(201).json({
      name,
      dob,
      gender,
      phone,
      bio,
      userType,
      email,
      photo,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// Get all users
exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.status(200).json({ count: users.length, users });
});

// Edit user
exports.edittUser = asyncHandler(async (req, res) => {
  let { id } = req.params;
  const { name, dob, gender, phone, bio, userType, email, password, photo } =
    req.body;

  if (!name || !phone || !dob || !gender) {
    res.status(400);
    throw new Error("Please all fields are required.");
  }

  const user = await User.findByIdAndUpdate(
    { _id: id },
    { name, dob, gender, phone, bio, userType, photo },
    { new: trusted }
  );

  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404);
    throw new Error("Invalid user data");
  }
});

// Delete user
exports.deltUser = asyncHandler(async (req, res) => {
  let { id } = req.params;
  const result = await User.findByIdAndDelete(id);
  if (result) {
    res.status(200).json(result);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// Login user
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required.");
  }

  // Email auth
  const user = await User.findOne({ email: email });
  if (!user) {
    res.status(400);
    throw new Error("User not found");
  }

  // Password auth
  const verified = await bcrypt.compare(password, user.password);
  if (!verified) {
    res.status(400);
    throw new Error("Wrong Email or Password.");
  }

  //   Generate Token
  const token = generateToken(user._id);

  if (verified) {
    // Send HTTP-only cookie
    res.cookie("artikonToken", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), // 1 day
      sameSite: "none",
      secure: true,
    });
  }
  if (user && verified) {
    const { _id, name, email, photo, phone, bio, dob, userType, gender } = user;
    res.status(200).json({
      _id,
      name,
      dob,
      gender,
      phone,
      bio,
      userType,
      email,
      photo,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid email or password");
  }
});

// Logout User
exports.logout = asyncHandler(async (req, res) => {
  res.cookie("artikonToken", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    secure: true,
  });
  return res.status(200).json({ message: "Successfully Logged Out" });
});

// Get Login Status
exports.loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.artikonToken;
  if (!token) {
    return res.json(false);
  }
  // Verify Token
  const verified = jwt.verify(token, process.env.JWT_SECRET);
  if (verified) {
    return res.json(true);
  }
  return res.json(false);
});

// Change password
exports.changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { oldPassword, password } = req.body;

  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup");
  }
  //Validate
  if (!oldPassword || !password) {
    res.status(400);
    throw new Error("Please add old and new password");
  }

  // check if old password matches password in DB
  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

  // Save new password
  if (user && passwordIsCorrect) {
    user.password = password;
    await user.save();
    res.status(200).send("Password change successful");
  } else {
    res.status(400);
    throw new Error("Old password is incorrect");
  }
});
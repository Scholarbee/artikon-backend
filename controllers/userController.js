const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
// const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { count } = require("console");

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
  res.cookie("token", token, {
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
      password,
      photo,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

exports.getUser = asyncHandler(async (req, res) => {
  res.send("Get User");
});

exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.status(200).json({ count: users.length, users });
});

exports.edittUser = asyncHandler(async (req, res) => {
  res.send("Edit User");
});

exports.deltUser = asyncHandler(async (req, res) => {
  res.send("Delete User");
});

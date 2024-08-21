const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "title is required"],
    },
    businessType: {
      type: String,
      required: [true, "businessType is required"],
    },
    description: {
      type: String,
      required: [true, "decription is required"],
    },
    price: {
      type: Number,
      required: [true, "price is required"],
    },
    category: {
      type: ObjectId,
      ref: "Category",
      required: [true, "category is required"],
    },
    postedBy: {
      type: ObjectId,
      ref: "User",
    },
    coverPhoto: {
      url: String,
      public_id: String,
    },
    likes: [{ type: ObjectId, ref: "User" }],
    comments: [
      {
        text: { type: String },
        createdAt: { type: Date, default: Date.now },
        postedBy: {
          type: ObjectId,
          ref: "User",
        },
      },
    ],
    appointments: [
      {
        bookedBy: {
          type: ObjectId,
          ref: "User",
        },
        phone: { type: String },
        address: { type: String },
        status: { type: Number, default: 0 },
        createdAt: { type: Date, default: Date.now },
        appointmentDate: { type: Date, default: Date.now },
      },
    ],
    orders: [
      {
        orderedBy: {
          type: ObjectId,
          ref: "User",
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
        },
        phone: { type: String },
        address: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);

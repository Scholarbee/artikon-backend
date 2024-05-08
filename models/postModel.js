const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "title is required"],
    },
    content: {
      type: String,
      required: [true, "content is required"],
    },
    postedBy: {
      type: ObjectId,
      ref: "User",
    },
    image: {
      url: String,
      public_id: String,
    },
    likes: [{ type: ObjectId, ref: "User" }],
    comments: [
      {
        text: String,
        created: { type: Date, default: Date.now },
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
        desc: String,
        created: { type: Date, default: Date.now },
        proposedDate: { type: Date, default: Date.now },
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

        created: { type: Date, default: Date.now },
        proposedDate: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);

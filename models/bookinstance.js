const mongoose = require("mongoose");
let moment = require('moment');

const Schema = mongoose.Schema;

const BookInstanceSchema = new Schema({
  book: { type: Schema.ObjectId, ref: "Book", required: true },
  imprint: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ["貸出可", "準備中", "貸出中", "予約中"],
    default: "準備中",
  },
  due_back: { type: Date, default: Date.now },
});

BookInstanceSchema.virtual("url").get(function () {
  return "/catalog/bookinstance/" + this._id;
});

BookInstanceSchema.virtual("due_back_formatted").get(function () {
  return moment(this.due_back).format("YYYY, MM, DD");
});

module.exports = mongoose.model("BookInstance", BookInstanceSchema);
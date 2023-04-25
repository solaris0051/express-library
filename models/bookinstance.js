const mongoose = require("mongoose");
const { DateTime } = require("luxon");
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

  BookInstanceSchema.virtual("due_back_formatted").get(function () {
    return moment(this.due_back).format("YYYY, MM, DD");
  });

  BookInstanceSchema.virtual("due_back_yyyy_mm_dd").get(function () {
    return DateTime.fromJSDate(this.due_back).toISODate();
  });

  module.exports = mongoose.model("BookInstance", BookInstanceSchema);
var mongoose = require("mongoose");
const { DateTime } = require("luxon"); //for date handling

var Schema = mongoose.Schema;

var BookInstanceSchema = new Schema({
  book: { type: Schema.ObjectId, ref: "Book", required: true }, // Reference to the associated book.
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
  return DateTime.fromJSDate(this.due_back).toLocaleString(DateTime.DATE_MED);
});

BookInstanceSchema.virtual("due_back_yyyy_mm_dd").get(function () {
  return DateTime.fromJSDate(this.due_back).toISODate(); //format 'YYYY-MM-DD'
});

module.exports = mongoose.model("BookInstance", BookInstanceSchema);
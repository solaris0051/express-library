var Author = require("../models/author");
var async = require("async");
var Book = require("../models/book");

const { body, validationResult } = require("express-validator");

exports.author_list = function (req, res, next) {
  Author.find()
    .sort([["family_name", "ascending"]])
    .exec(function (err, list_authors) {
      if (err) {
        return next(err);
      }
      res.render("author_list", {
        title: "著者リスト",
        author_list: list_authors,
      });
    });
};

exports.author_detail = function (req, res, next) {
  async.parallel(
    {
      author: function (callback) {
        Author.findById(req.params.id).exec(callback);
      },
      authors_books: function (callback) {
        Book.find({ author: req.params.id }, "title summary").exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.author == null) {
        var err = new Error("著者がありません。");
        err.status = 404;
        return next(err);
      }
      res.render("author_detail", {
        title: "著者詳細",
        author: results.author,
        author_books: results.authors_books,
      });
    }
  );
};

exports.author_create_get = function (req, res, next) {
  res.render("author_form", { title: "著者登録フォーム" });
};

exports.author_create_post = [
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("名を指定してください。")
    .isAlphanumeric()
    .withMessage("氏は半角アルファベットで指定してください。"),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("氏を指定してください。")
    .isAlphanumeric()
    .withMessage("氏は半角アルファベットで指定してください。"),
  body("date_of_birth", "無効な生年月日です。")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body("date_of_death", "無効な没年月日です。")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  (req, res, next) => {
    const errors = validationResult(req);

    var author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
    });

    if (!errors.isEmpty()) {
      res.render("author_form", {
        title: "著者登録フォーム",
        author: author,
        errors: errors.array(),
      });
      return;
    } else {
      author.save(function (err) {
        if (err) {
          return next(err);
        }
        res.redirect(author.url);
      });
    }
  },
];

exports.author_delete_get = function (req, res, next) {
  async.parallel(
    {
      author: function (callback) {
        Author.findById(req.params.id).exec(callback);
      },
      authors_books: function (callback) {
        Book.find({ author: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.author == null) {
        res.redirect("/catalog/authors");
      }
      res.render("author_delete", {
        title: "著者削除",
        author: results.author,
        author_books: results.authors_books,
      });
    }
  );
};

exports.author_delete_post = function (req, res, next) {
  async.parallel(
    {
      author: function (callback) {
        Author.findById(req.body.authorid).exec(callback);
      },
      authors_books: function (callback) {
        Book.find({ author: req.body.authorid }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.authors_books.length > 0) {
        res.render("author_delete", {
          title: "著者削除",
          author: results.author,
          author_books: results.authors_books,
        });
        return;
      } else {
        Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
          if (err) {
            return next(err);
          }
          res.redirect("/catalog/authors");
        });
      }
    }
  );
};

exports.author_update_get = function (req, res, next) {
  Author.findById(req.params.id, function (err, author) {
    if (err) {
      return next(err);
    }
    if (author == null) {
      var err = new Error("著者がありません。");
      err.status = 404;
      return next(err);
    }
    res.render("author_form", { title: "著者更新", author: author });
  });
};

exports.author_update_post = [
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("名を指定してください。")
    .isAlphanumeric()
    .withMessage("名は半角アルファベットで指定してください。"),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("氏を指定してください。")
    .isAlphanumeric()
    .withMessage("氏は半角アルファベットで指定してください。"),
  body("date_of_birth", "無効な生年月日です。")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body("date_of_death", "無効な没年月日です。")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  (req, res, next) => {
    const errors = validationResult(req);

    var author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      res.render("author_form", {
        title: "著者更新",
        author: author,
        errors: errors.array(),
      });
      return;
    } else {
      Author.findByIdAndUpdate(
        req.params.id,
        author,
        {},
        function (err, theauthor) {
          if (err) {
            return next(err);
          }
          res.redirect(theauthor.url);
        }
      );
    }
  },
];
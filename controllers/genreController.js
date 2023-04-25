const Genre = require("../models/genre");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");

exports.genre_list = asyncHandler(async (req, res, next) => {
  const allGenres = await Genre.find().sort({ name: 1 }).exec();
  res.render("genre_list", {
    title: "ジャンルリスト",
    list_genres: allGenres,
  });
});

exports.genre_detail = asyncHandler(async (req, res, next) => {
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);
  if (genre === null) {
    const err = new Error("ジャンルがありません。");
    err.status = 404;
    return next(err);
  }
  res.render("genre_detail", {
    title: "ジャンル詳細",
    genre: genre,
    genre_books: booksInGenre,
  });
});

exports.genre_create_get = (req, res, next) => {
  res.render("genre_form", { title: "ジャンル登録フォーム" });
};

exports.genre_create_post = [
  body("name", "ジャンルは1文字以上で指定してください。")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const genre = new Genre({ name: req.body.name });
    if (!errors.isEmpty()) {
      res.render("genre_form", {
        title: "ジャンル登録フォーム",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      const genreExists = await Genre.findOne({ name: req.body.name }).exec();
      if (genreExists) {
        res.redirect(genreExists.url);
      } else {
        await genre.save();
        res.redirect(genre.url);
      }
    }
  }),
];

exports.genre_delete_get = asyncHandler(async (req, res, next) => {
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);
  if (genre === null) {
    res.redirect("/catalog/genres");
  }
  res.render("genre_delete", {
    title: "ジャンル削除",
    genre: genre,
    genre_books: booksInGenre,
  });
});

exports.genre_delete_post = asyncHandler(async (req, res, next) => {
  // Get details of genre and all associated books (in parallel)
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);
  if (booksInGenre.length > 0) {
    res.render("genre_delete", {
      title: "ジャンル削除",
      genre: genre,
      genre_books: booksInGenre,
    });
    return;
  } else {
    await Genre.findByIdAndRemove(req.body.id);
    res.redirect("/catalog/genres");
  }
});

exports.genre_update_get = asyncHandler(async (req, res, next) => {
  const genre = await Genre.findById(req.params.id).exec();
  if (genre === null) {
    const err = new Error("ジャンルがありません。");
    err.status = 404;
    return next(err);
  }
  res.render("genre_form", { title: "ジャンル更新フォーム", genre: genre });
});

exports.genre_update_post = [
  body("name", "ジャンルは1文字以上で指定してください。")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id,
    });
    if (!errors.isEmpty()) {
      res.render("genre_form", {
        title: "ジャンル更新フォーム",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      await Genre.findByIdAndUpdate(req.params.id, genre);
      res.redirect(genre.url);
    }
  }),
];
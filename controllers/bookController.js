const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");

const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");

exports.index = asyncHandler(async (req, res, next) => {
  const [
    numBooks,
    numBookInstances,
    numAvailableBookInstances,
    numAuthors,
    numGenres,
  ] = await Promise.all([
    Book.countDocuments({}).exec(),
    BookInstance.countDocuments({}).exec(),
    BookInstance.countDocuments({ status: "貸出可能" }).exec(),
    Author.countDocuments({}).exec(),
    Genre.countDocuments({}).exec(),
  ]);
  res.render("index", {
    title: "書籍管理ホーム",
    book_count: numBooks,
    book_instance_count: numBookInstances,
    book_instance_available_count: numAvailableBookInstances,
    author_count: numAuthors,
    genre_count: numGenres,
  });
});

exports.book_list = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.find({}, "title author")
    .sort({ title: 1 })
    .collation({ locale: 'ja' })
    .populate("author")
    .exec();
  res.render("book_list", { title: "書籍リスト", book_list: allBooks });
});

exports.book_detail = asyncHandler(async (req, res, next) => {
  const [book, bookInstances] = await Promise.all([
    Book.findById(req.params.id).populate("author").populate("genre").exec(),
    BookInstance.find({ book: req.params.id }).exec(),
  ]);
  if (book === null) {
    const err = new Error("書籍がありません。");
    err.status = 404;
    return next(err);
  }
  res.render("book_detail", {
    title: book.title,
    book: book,
    book_instances: bookInstances,
  });
});

exports.book_create_get = asyncHandler(async (req, res, next) => {
  const [allAuthors, allGenres] = await Promise.all([
    Author.find().sort({ family_name: 1 }).exec(),
    Genre.find().sort({ name: 1 }).exec(),
  ]);
  res.render("book_form", {
    title: "書籍登録フォーム",
    authors: allAuthors,
    genres: allGenres,
  });
});

exports.book_create_post = [
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre = typeof req.body.genre === "undefined" ? [] : [req.body.genre];
    }
    next();
  },
  body("title", "書籍名を指定してください。")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "著者を指定してください。")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "要約を指定してください。")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBNを指定してください。")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("genre.*")
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    });
    if (!errors.isEmpty()) {
      const [allAuthors, allGenres] = await Promise.all([
        Author.find().sort({ family_name: 1 }).exec(),
        Genre.find().sort({ name: 1 }).exec(),
      ]);
      for (const genre of allGenres) {
        if (book.genre.indexOf(genre._id) > -1) {
          genre.checked = "true";
        }
      }
      res.render("book_form", {
        title: "書籍登録フォーム",
        authors: allAuthors,
        genres: allGenres,
        book: book,
        errors: errors.array(),
      });
    } else {
      await book.save();
      res.redirect(book.url);
    }
  }),
];

exports.book_delete_get = asyncHandler(async (req, res, next) => {
  const [book, bookInstances] = await Promise.all([
    Book.findById(req.params.id).populate("author").populate("genre").exec(),
    BookInstance.find({ book: req.params.id }).exec(),
  ]);
  if (book === null) {
    res.redirect("/catalog/books");
  }
  res.render("book_delete", {
    title: "書籍削除",
    book: book,
    book_instances: bookInstances,
  });
});

exports.book_delete_post = asyncHandler(async (req, res, next) => {
  const [book, bookInstances] = await Promise.all([
    Book.findById(req.params.id).populate("author").populate("genre").exec(),
    BookInstance.find({ book: req.params.id }).exec(),
  ]);
  if (book === null) {
    res.redirect("/catalog/books");
  }
  if (bookInstances.length > 0) {
    res.render("book_delete", {
      title: "書籍削除",
      book: book,
      book_instances: bookInstances,
    });
    return;
  } else {
    await Book.findByIdAndDelete(req.body.id);
    res.redirect("/catalog/books");
  }
});

exports.book_update_get = asyncHandler(async (req, res, next) => {
  const [book, allAuthors, allGenres] = await Promise.all([
    Book.findById(req.params.id).populate("author").exec(),
    Author.find().sort({ family_name: 1 }).exec(),
    Genre.find().sort({ name: 1 }).exec(),
  ]);
  if (book === null) {
    const err = new Error("書籍がありません。");
    err.status = 404;
    return next(err);
  }
  allGenres.forEach(genre => {
    if (book.genre.includes(genre._id)) genre.checked = "true";
  });
  res.render("book_form", {
    title: "書籍更新",
    authors: allAuthors,
    genres: allGenres,
    book: book,
  });
});

exports.book_update_post = [
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === "undefined") {
        req.body.genre = [];
      } else {
        req.body.genre = new Array(req.body.genre);
      }
    }
    next();
  },
  body("title", "書籍名を指定してください。")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "著者を指定してください")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "要約を指定してください。")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBNを指定してください。")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("genre.*")
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: typeof req.body.genre === "undefined" ? [] : req.body.genre,
      _id: req.params.id,
    });
    if (!errors.isEmpty()) {
      const [allAuthors, allGenres] = await Promise.all([
        Author.find().sort({ family_name: 1 }).exec(),
        Genre.find().sort({ name: 1 }).exec(),
      ]);
      for (const genre of allGenres) {
        if (book.genre.includes(genre._id)) {
          genre.checked = "true";
        }
      }
      res.render("book_form", {
        title: "書籍更新",
        authors: allAuthors,
        genres: allGenres,
        book: book,
        errors: errors.array(),
      });
      return;
    } else {
      const thebook = await Book.findByIdAndUpdate(req.params.id, book, {});
      res.redirect(thebook.url);
    }
  }),
];

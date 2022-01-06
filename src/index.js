require("dotenv").config();
const express = require("express");
const createError = require("http-errors");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const methodOverride = require("method-override");
const config = require("./config");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const crypto = require("crypto");
const Image = require("./models/image");
const cors = require("cors");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const apiRouter = require("./routes/api");

const app = express();

// Extended: https://swagger.io/specification/#infoObject
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      version: "1.0.0",
      title: "Customer API",
      description: "Customer API Information",
      contact: {
        name: "Amazing Developer",
      },
      servers: ["http://localhost:8080"],
    },
  },
  // ['.routes/*.js']
  apis: ["./src/index.js", "./src/routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(
  cors({
    origin: "*",
  })
);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");

//const url = config.mongoURI;
const url = `mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.DAT_HOST}:${process.env.DAT_PORT}/ImageStoring?authSource=admin`;
const connect = mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// connect to the database
connect.then(
  () => {
    console.log("Connected to database: ImageStoring");
  },
  (err) =>
    console.log(
      "Failed connecting to the database. URL was: " + url + ". Details: " + err
    )
);

/* 
    GridFs Configuration
*/

// create storage engine
const storage = new GridFsStorage({
  url: url,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "uploads",
        };
        resolve(fileInfo);
      });
    });
  },
});

function fileFilter(req, file, cb) {
  if (
    ["image/png", "image/jpg", "image/jpeg", "image/bmp", "image/gif"].includes(
      file.mimetype
    ) === false
  ) {
    console.log("File is not an image");
    //return cb(new Error("File type must be an image"), false);
  }
  if (!req.body.guid) {
    console.log(
      "No guid provided or guid after file param. Guid param must come before file param and must not be empty."
    );
    const err = new Error(
      "No guid provided or guid after file param. Guid param must come before file param and must not be empty."
    );
    err.code = 400;
    cb(err);
    return;
  }
  //if it's an Update request, don't check if image already exists.
  if (req.method === "PUT") {
    cb(null, true);
    return;
  }
  Image.findOne({ guid: req.body.guid })
    .then((image) => {
      if (image) {
        console.log("Image already exists. Will not upload.");
        const error = new Error("Image already exists.  Will not upload.");
        error.code = 409;
        cb(error);
        return;
      }
      console.log("Image does not exist. Will upload.");
      cb(null, true);
    })
    .catch((err) => {
      const error = new Error(
        "Could not find image with guid: " + req.body.guid
      );
      error.code = 404;
      cb(error);
    });

  // To accept the file pass `true`, like so:
  //cb(null, true)

  // To reject this file pass `false`, like so:
  //cb(null, false)

  // You can always pass an error if something goes wrong:
  //cb(new Error('I don\'t have a clue!'))
}

const upload = multer({ storage, fileFilter });

app.use("/api", apiRouter(upload));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const port = process.env.APP_PORT || 8080;
const app_host = process.env.APP_HOST || "0.0.0.0";
app.listen(port, app_host, () => {
  console.log(`Example app listening at http://${app_host}:${port}`);
});

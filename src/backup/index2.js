const express = require("express");
const mongoose = require("mongoose");
const { GridFsStorage } = require("multer-gridfs-storage");
const crypto = require("crypto");
const path = require("path");
const multer = require("multer");
const Grid = require("gridfs-stream");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//connection

const mongoURI = "mongodb://localhost:27017/ImageStoring";

const promise = mongoose
  .connect(mongoURI, { useNewUrlParser: true })
  .then(() => console.log("Connected to database. URI: " + mongoURI))
  .catch((err) => console.log("Could not connect to MongoDB. Error: " + err));

let gfs;
mongoose.connection.once("open", () => {
  //Init stream
  gfs = Grid(mongoose.connection.db, mongoose.mongo);
  //name of the bucket where media is going to be retrieved
  gfs.collection("media");
});

//create storage object
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "media",
        };
        resolve(fileInfo);
      });
    });
  },
});
const upload = multer({ storage: storage, preservePath: true });

/*    Route to upload a File   */
app.post("/api/create", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(500).send("Must upload a file !");
  }
  console.log("got here");
  const response = { file: req.file };
  res.json(response);
});

const port = 8080;
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

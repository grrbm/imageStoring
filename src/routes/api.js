const express = require("express");
const imageRouter = express.Router();
const mongoose = require("mongoose");
const Image = require("../models/image");
const config = require("../config");
const mongodb = require("mongodb");
const multer = require("multer");
var Grid = require("gridfs-stream");
const fs = require("fs");

module.exports = (upload) => {
  //const url = config.mongoURI;
  const url = `mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.DAT_HOST}:${process.env.DAT_PORT}/ImageStoring?authSource=admin`;
  const connect = mongoose.createConnection(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  connect.then(
    () => {
      console.log("API: Connected to database: ImageStoring");
    },
    (err) =>
      console.log(
        "API: Failed connecting to the database. URL was: " +
          url +
          ". Details: " +
          err
      )
  );

  let gfs;

  connect.once("open", () => {
    // initialize stream
    gfs = new mongoose.mongo.GridFSBucket(connect.db, {
      bucketName: "uploads",
    });
  });

  function minimumSizeCheck(req, res, next) {
    let minimumSizeBytes = 16777216; //16 megabytes
    let len = req.headers["content-length"]
      ? parseInt(req.headers["content-length"], 10)
      : null;

    if (process.env.SHOULD_FORCE_GRIDFS.toLowerCase() === true) {
      console.log(
        "[size check]: SHOULD_FORCE_GRIDFS is set to true. Forcing the use of GridFS"
      );
      next();
      return;
    }
    if (len && len > minimumSizeBytes) {
      console.log("[size check]: the image is over 16mb. Will use GridFS");
      next();
    } else {
      console.log(
        "[size check]: the image is less than 16mb. Will store the image as a binary document."
      );
      next("route");
    }
  }
  /**
   * @swagger
   * /api/create:
   *    post:
   *      description: Upload a single image/file to Image collection
   *      parameters:
   *      - in: query
   *        name: file
   *        description: the image file as an attachment (form-data).
   *      - in: query
   *        name: caption
   *        description: the GUID of the image you want to read
   *      responses:
   *        '200':
   *           description: Successfully uploaded image
   *        '409':
   *           description: Image with this name already exists
   *        '500':
   *           description: Internal server error
   */
  imageRouter
    .route("/create")
    .post(minimumSizeCheck, upload.single("file"), (req, res, next) => {
      if (!req.file) {
        return res.status(500).json({
          success: false,
          message: "Must upload a file !",
        });
      }
      console.log(req.body);
      // check for existing images
      Image.findOne({ caption: req.body.caption })
        .then((image) => {
          console.log(image);
          if (image) {
            return res.status(409).json({
              success: false,
              message: "Image already exists",
            });
          }

          let newImage = new Image({
            caption: req.body.caption,
            filename: req.file.filename,
            fileId: req.file.id,
          });

          newImage
            .save()
            .then((image) => {
              res.status(200).json({
                success: true,
                image,
              });
            })
            .catch((err) =>
              res.status(500).json({
                success: false,
                message: "Error saving the new image. " + err,
              })
            );
        })
        .catch((err) =>
          res.status(500).json({
            success: false,
            message: "Error finding image. " + err,
          })
        );
    })
    .get((req, res, next) => {
      Image.find({})
        .then((images) => {
          res.status(200).json({
            success: true,
            images,
          });
        })
        .catch((err) =>
          res.status(500).json({
            success: false,
            message: "Error finding all images. " + err,
          })
        );
    });
  imageRouter
    .route("/create")
    .post(multer({}).single("file"), (req, res, next) => {
      if (!req.file) {
        return res.status(500).json({
          success: false,
          message: "Must upload a file !",
        });
      }
      console.log(req.body);
      // check for existing images
      Image.findOne({ caption: req.body.caption })
        .then((image) => {
          console.log(image);
          if (image) {
            return res.status(409).json({
              success: false,
              message: "Image already exists",
            });
          }
          let randomString = (Math.random() + 1).toString(36).substring(2);
          var imageData = req.file.buffer;
          let newImage = new Image({
            caption: req.body.caption,
            filename: req.body.caption,
            fileId: randomString,
            isSmallImage: true,
            smallImageData: imageData,
            smallImageMimetype: req.file.mimetype,
          });

          newImage
            .save()
            .then((image) => {
              res.status(200).json({
                success: true,
                image,
              });
            })
            .catch((err) =>
              res.status(500).json({
                success: false,
                message: "Error saving the new image. " + err,
              })
            );
        })
        .catch((err) =>
          res.status(500).json({
            success: false,
            message: "Error finding image. " + err,
          })
        );
    });
  /**
   * @swagger
   * /api/read:
   *    get:
   *       description: Accepts image GUID and returns image data
   *       parameters:
   *        - in: query
   *          name: caption
   *          description: the GUID of the image you want to read
   *       responses:
   *          '200':
   *             description: Successfully returned requested image
   *          '400':
   *             description: Malformed request. Must send "caption" parameter with GUID of requested image.
   *          '404':
   *             description: Did not find image with provided GUID.
   *          '500':
   *             description: Internal server error.
   */
  imageRouter.route("/read").get(async (req, res, next) => {
    if (!req.body.caption) {
      return res.status(400).json({
        success: false,
        message: 'Must send "caption" parameter with image name !',
      });
    }
    let result;
    try {
      result = await Image.findOne({ caption: req.body.caption });
      if (!result) {
        return res.status(404).json({
          success: false,
          message:
            "Image metadata with caption " +
            req.body.caption +
            " was not found.",
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "there was an error finding the image metadata. " + err,
      });
    }
    const isSmallImage = result._doc.isSmallImage;
    //var data = something;
    if (isSmallImage) {
      res.writeHead(200, {
        "Content-Type": result._doc.smallImageMimetype,
        "Content-disposition": "attachment;filename=" + result._doc.filename,
        "Content-Length": result._doc.smallImageData.length,
      });
      res.end(Buffer.from(result._doc.smallImageData, "binary"));
      return;
    }
    const _filename = result._doc.filename;
    mongodb.MongoClient.connect(url, function (error, client) {
      if (error) {
        return res.status(500).json({
          success: false,
          message: "Error connecting to database. " + error,
        });
      }
      const db = client.db("ImageStoring");
      db.collection("uploads.files")
        .find({})
        .toArray(function (err, results) {
          console.log("got the results;");
        });
      db.collection("uploads.files").findOne(
        { filename: _filename },
        (err, image) => {
          if (!image) {
            res.status(404).send("Image was not found on the database !");
            return;
          }
          // detect the content type and set the appropriate response headers.
          let mimeType = image.contentType;
          if (!mimeType) {
            mimeType = mime.lookup(image.filename);
          }
          res.set({
            "Content-Type": mimeType,
            "Content-Disposition": "attachment; filename=" + image.filename,
          });

          /**Uncomment this to save images to "output" folder **
          gfs
            .openDownloadStreamByName(_filename)
            .pipe(fs.createWriteStream("./output/" + _filename))
            .on("error", function (error) {
              console.log("Error streaming the file. " + error);
            })
            .on("finish", function () {
              console.log("done!");
            });
          */
          gfs
            .openDownloadStreamByName(_filename)
            .pipe(res)
            .on("error", function (error) {
              console.log("Error streaming the file. " + error);
            })
            .on("finish", function () {
              console.log("done!");
            });
        }
      );
    });
  });
  imageRouter.route("/exists").get(async (req, res, next) => {
    if (!req.body.caption) {
      return res.status(400).send();
    }
    try {
      let result = await Image.findOne({ caption: req.body.caption });
      if (!result) {
        return res.status(404).send();
      }
      return res.status(200).send();
    } catch (error) {
      return res.status(500).send();
    }
  });
  /**
   * @swagger
   * /api/update:
   *    put:
   *      description: Accepts image (using multipart/form-data) and return image GUID in JSON
   *      parameters:
   *       - in: query
   *         name: file
   *         description: the image file as an attachment (form-data).
   *       - in: query
   *         name: caption
   *         description: the GUID of the image you want to update
   *      responses:
   *        '200':
   *          description: Successfully updated image
   *        '400':
   *          description: Malformed request. Must send "caption" parameter with GUID of image to update.
   *        '404':
   *          description: Did not find image with provided GUID.
   *        '500':
   *          description: Internal server error.
   */
  imageRouter
    .route("/update")
    .put(minimumSizeCheck, upload.single("file"), (req, res, next) => {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Must upload a file !",
        });
      }

      //Update image metadata
      Image.findOneAndUpdate(
        { caption: req.body.caption },
        {
          $set: {
            // caption: req.body.caption,
            filename: req.file.filename,
            fileId: req.file.id,
          },
        },
        //make image parameter return the old object instead of the new
        { new: false }
      )
        .then((image) => {
          //"image" parameter is the new updated image

          //Done updating metadata, now delete old image files
          gfs.delete(new mongoose.Types.ObjectId(image.fileId), (err, data) => {
            if (err) {
              console.log(
                "Error finding file in uploads.files collection." + err
              );
            }
            console.log(`Old file with ID ${image.fileId} is deleted`);
          });
          //Files deleted and image updated. Return success
          return res.status(200).json({
            success: true,
            message: `Image with caption: ${req.body.caption} updated`,
          });
        })
        .catch((err) => {
          return res.status(500).json({
            success: false,
            message: `Error updating image. ` + err,
          });
        });
    });

  imageRouter
    .route("/update")
    .put(multer({}).single("file"), (req, res, next) => {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Must upload a file !",
        });
      }
      Image.findOne({ caption: req.body.caption })
        .then((image) => {
          if (!image) {
            return res.status(404).json({
              success: false,
              message: `The image to be updated was not found. `,
            });
          }
          console.log("Found image. Updating");
          //Update small image data
          Image.findOneAndUpdate(
            { caption: req.body.caption },
            {
              $set: {
                smallImageData: req.file.buffer,
                smallImageMimetype: req.file.mimetype,
              },
            },
            //make image parameter return the old object instead of the new
            { new: false }
          )
            .then((image) => {
              return res.status(200).json({
                success: true,
                message: `Image with caption: ${req.body.caption} updated`,
              });
            })
            .catch((err) => {
              return res.status(500).json({
                success: false,
                message: `Error updating image. ` + err,
              });
            });
        })
        .catch((err) => {
          return res.status(404).json({
            success: false,
            message: `The image to be updated was not found. ` + err,
          });
        });
    });

  /**
   * @swagger
   * /api/delete:
   *    delete:
   *      description: Delete an image from the collection
   *      parameters:
   *        - in: query
   *          name: file
   *          description: the image file as an attachment (form-data).
   *      responses:
   *          '200':
   *             description: Successfully deleted image
   *          '400':
   *             description: Malformed request. Need to have "caption" with the image GUID in the request body.
   *          '404':
   *             description: Didn't find file with the requested GUID
   *          '500':
   *             description: Internal server error
   */
  imageRouter.route("/delete").delete((req, res, next) => {
    if (!req.body.caption) {
      return res.status(400).json({
        success: false,
        message: `Need to have field "caption" in message body !`,
      });
    }
    Image.findOne({ caption: req.body.caption })
      .then((image) => {
        if (image) {
          console.log("image ID: " + image.fileId);
          if (image.isSmallImage) {
            deleteFromImageCollection(req.body.caption, res);
            return;
          }
          gfs.delete(new mongoose.Types.ObjectId(image.fileId), (err, data) => {
            if (err) {
              return res.status(404).json({
                success: false,
                message:
                  "Error finding file in uploads.files collection." + err,
              });
            }
            console.log(`File with ID ${image.fileId} is deleted`);
            deleteFromImageCollection(req.body.caption, res);
            return;
          });
        } else {
          res.status(404).json({
            success: false,
            message: `File with caption: ${req.body.caption} not found`,
          });
        }
      })
      .catch((err) =>
        res.status(500).json({
          success: false,
          message: "Error finding the image. " + err,
        })
      );
  });
  function deleteFromImageCollection(guid, res) {
    Image.deleteOne({ caption: guid })
      .then(() => {
        return res.status(200).json({
          success: true,
          message: `Image with caption: ${guid} deleted`,
        });
      })
      .catch((err) => {
        return res.status(500).json({
          success: false,
          message: `Error deleting the image. ` + err,
        });
      });
  }

  imageRouter.route("/recent").get((req, res, next) => {
    Image.findOne({}, {}, { sort: { _id: -1 } })
      .then((image) => {
        res.status(200).json({
          success: true,
          image,
        });
      })
      .catch((err) => res.status(500).json(err));
  });

  imageRouter
    .route("/multiple")
    .post(upload.array("file", 3), (req, res, next) => {
      res.status(200).json({
        success: true,
        message: `${req.files.length} files uploaded successfully`,
      });
    });

  imageRouter.route("/files").get((req, res, next) => {
    gfs.find().toArray((err, files) => {
      if (!files || files.length === 0) {
        return res.status(200).json({
          success: false,
          message: "No files available",
        });
      }

      files.map((file) => {
        if (
          file.contentType === "image/jpeg" ||
          file.contentType === "image/png" ||
          file.contentType === "image/svg"
        ) {
          file.isImage = true;
        } else {
          file.isImage = false;
        }
      });

      res.status(200).json({
        success: true,
        files,
      });
    });
  });

  imageRouter.route("/file/:filename").get((req, res, next) => {
    gfs.find({ filename: req.params.filename }).toArray((err, files) => {
      if (!files[0] || files.length === 0) {
        return res.status(200).json({
          success: false,
          message: "No files available",
        });
      }

      res.status(200).json({
        success: true,
        file: files[0],
      });
    });
  });

  imageRouter.route("/:filename").get((req, res, next) => {
    gfs.find({ filename: req.params.filename }).toArray((err, files) => {
      if (!files[0] || files.length === 0) {
        return res.status(200).json({
          success: false,
          message: "No files available",
        });
      }

      if (
        files[0].contentType === "image/jpeg" ||
        files[0].contentType === "image/png" ||
        files[0].contentType === "image/svg+xml"
      ) {
        // render image to browser
        gfs.openDownloadStreamByName(req.params.filename).pipe(res);
      } else {
        res.status(404).json({
          err: "Not an image",
        });
      }
    });
  });

  imageRouter.route("/file/del/:id").post((req, res, next) => {
    console.log(req.params.id);
    gfs.delete(new mongoose.Types.ObjectId(req.params.id), (err, data) => {
      if (err) {
        return res.status(404).json({ err: err });
      }

      res.status(200).json({
        success: true,
        message: `File with ID ${req.params.id} is deleted`,
      });
    });
  });

  return imageRouter;
};

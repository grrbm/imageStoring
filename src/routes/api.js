const express = require("express");
const imageRouter = express.Router();
const mongoose = require("mongoose");
const Image = require("../models/image");
const config = require("../config");

module.exports = (upload) => {
  const url = config.mongoURI;
  const connect = mongoose.createConnection(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  let gfs;

  connect.once("open", () => {
    // initialize stream
    gfs = new mongoose.mongo.GridFSBucket(connect.db, {
      bucketName: "uploads",
    });
  });

  /**
   * @swagger
   * /api/create:
   *    post:
   *      description: Upload a single image/file to Image collection
   *    responses:
   *      '200':
   *        description: Successfully uploaded image
   */
  imageRouter
    .route("/create")
    .post(upload.single("file"), (req, res, next) => {
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
            return res.status(200).json({
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
  /**
   * @swagger
   *    get:
   *      description: Accepts image GUID and returns image data
   *    responses:
   *      '200':
   *        description: Successfully returned image*
   */
  imageRouter.route("/read").get((req, res, next) => {
    if (!req.body.caption) {
      return res.status(400).json({
        success: false,
        message: 'Must have field "caption" with image name !',
      });
    }
    Image.findOne({ caption: req.bodyl.caption }, { sort: { _id: -1 } })
      .then((image) => {
        res.status(200).json({
          success: true,
          image,
        });
      })
      .catch((err) =>
        res.status(500).json({
          success: false,
          message: "there was an error finding the image. " + err,
        })
      );
  });
  /**
   * @swagger
   * /api/delete/:id:
   *    delete:
   *      description: Delete an image from the collection
   *    responses:
   *      '200':
   *        description: Successfully deleted image
   */
  imageRouter.route("/delete").delete((req, res, next) => {
    if (!req.body.caption) {
      return res.status(500).json({
        success: false,
        message: `Need to have field "caption" in message body !`,
      });
    }
    Image.findOne({ caption: req.body.caption })
      .then((image) => {
        if (image) {
          Image.deleteOne({ caption: req.body.caption })
            .then(() => {
              return res.status(200).json({
                success: true,
                message: `File with caption: ${req.body.caption} deleted`,
              });
            })
            .catch((err) => {
              return res.status(500).json({
                success: false,
                message: `Error deleting the image. ` + err,
              });
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

  /**
   * @swagger
   * /api/recent:
   *    get:
   *      description: Fetch most recently added record
   *    responses:
   *      '200':
   *        description: Successfully fetched most recently added record
   */
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

  /**
   * @swagger
   * /api/multiple:
   *    post:
   *      description: Upload multiple files up to 3
   *    responses:
   *      '200':
   *        description: Successfully uploaded multiple up to 3 files
   */
  imageRouter
    .route("/multiple")
    .post(upload.array("file", 3), (req, res, next) => {
      res.status(200).json({
        success: true,
        message: `${req.files.length} files uploaded successfully`,
      });
    });

  /**
   * @swagger
   * /api/files:
   *    get:
   *      description: Fetches all the files in the uploads collection
   *    responses:
   *      '200':
   *        description: Successfully fetched all the files in the uploads collection
   */
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

  /**
   * @swagger
   * /api/:filename:
   *    get:
   *      description: Fetches a particular file by filename
   *    responses:
   *      '200':
   *        description: Successfully fetched a particular file by filename
   */
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

  /**
   * @swagger
   * /api/:filename:
   *    get:
   *      description: Fetches a particular image and render on browser
   *    responses:
   *      '200':
   *        description: Successfully fetched a particular image for rendering.
   */
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

  /**
   * @swagger
   * /api/file/del/:id:
   *    delete:
   *      description: Delete a particular file by an ID
   *    responses:
   *      '200':
   *        description: Successfully deleted a particular file by an ID.
   */
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

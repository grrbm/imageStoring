const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
  guid: {
    required: true,
    type: String,
  },
  filename: {
    required: true,
    type: String,
  },
  fileId: {
    required: true,
    type: String,
  },
  isSmallImage: {
    default: false,
    type: Boolean,
  },
  smallImageData: { type: Buffer },
  smallImageMimetype: { type: String },
  createdAt: {
    default: Date.now(),
    type: Date,
  },
});

const Image = mongoose.model("Image", ImageSchema);

module.exports = Image;

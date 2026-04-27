const multer = require("multer");
const path = require("path");
const rootDir = require("./pathUtil");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(rootDir, "upload"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (["image/png", "image/jpg", "image/jpeg"].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const uploadDisk = multer({ storage, fileFilter });
const uploadMemory = multer({ storage: multer.memoryStorage(), fileFilter });

module.exports = {
  uploadDisk,
  uploadMemory,
};

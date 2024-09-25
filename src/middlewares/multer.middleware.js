import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const fileType = file.mimetype.split("/")[1];    
    cb(null, `${req.user._id}.${fileType}`);
  },
});

export const upload = multer({ storage });

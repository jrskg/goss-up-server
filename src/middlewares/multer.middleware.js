import multer from "multer";
import path from "path";
import { ATTACHMENT_SIZE_LIMIT_MB } from "../configs/env.index.js";

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


//this was used to upload attachments to the server
const attachmentsStorage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, "./public/attachments");
  },
  filename: function(req, file, cb){
    const fileExt = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, fileExt).slice(0, 25);
    const finalName = `${baseName}${Date.now()}${fileExt}`;
    cb(null, finalName);
  }
});
export const attachmentsUploadMulter = multer({
  storage: attachmentsStorage,
  limits:{
    fileSize: 1024 * 1024 * ATTACHMENT_SIZE_LIMIT_MB
  }
})

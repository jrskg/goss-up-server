import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import {
  CLN_API_KEY,
  CLN_API_SECRET,
  CLN_CLOUD_NAME,
} from "../configs/env.index.js";

cloudinary.config({
  cloud_name: CLN_CLOUD_NAME,
  api_key: CLN_API_KEY,
  api_secret: CLN_API_SECRET,
});

const uploadOnCloudinary = async (filePath, cloudinaryFolder) => {
  try {
    if (!filePath) return null;
    const response = await cloudinary.uploader.upload(filePath, {
      folder: cloudinaryFolder,
      resource_type: "auto",
      use_filename: true,
      transformation: [{quality: "auto", fetch_format: "auto"}],
    });
    const avatarUrl = cloudinary.url(response.public_id, {
      quality: "auto:low",
      width: 100,
      height: 100,
      crop: "fit",
    });    
    fs.unlinkSync(filePath);
    return {
      publicId: response.public_id,
      avatar: avatarUrl,
      image: response.secure_url,
    };
  } catch (error) {
    fs.unlinkSync(filePath);
    return null;
  }
};

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return response;
  } catch (error) {
    console.log("Error while deleting from cloudinary");
    console.log(error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };

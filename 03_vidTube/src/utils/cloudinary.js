import { v2 as cloudinary } from "cloudinary";
import { deleteLocalFile } from "./deleteLocalFIle.js";
import { ApiError } from "./ApiError.js";
import dotenv from "dotenv"

dotenv.config()

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinay = async (localFilePath) => {
    try {
        if (!localFilePath) throw new ApiError(400, "No file path provided")
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        console.log("File uploaded on cloudinary. File src: "+ response.url)
        //once the file is uploaded, we would like to remove it from our server
        deleteLocalFile(localFilePath)
        return response
    } catch (error) {
        console.error("Cloudinary upload Error: ", error)
        if (localFilePath && fs.existsSync(localFilePath)) {
            try {
              deleteLocalFile(localFilePath);
            } catch (cleanupError) {
              console.error("Failed to delete local file:", cleanupError);
            }         
        }
        return null
    }
}

const deleteFromCloudinay = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId)
        console.log("Deleted from cloudinary successfully. Public Id: ", publicId);    
    } catch (error) {
        console.log("Error deleting from cloudinay", error);
        return null
        
    }
}

export { uploadOnCloudinay, deleteFromCloudinay };
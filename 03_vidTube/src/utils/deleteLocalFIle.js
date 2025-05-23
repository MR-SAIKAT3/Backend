import fs from "fs/promises";

const deleteLocalFile = async (localFilePath) => {
    try {
        await fs.unlink(localFilePath);
        console.log("Delete local file", localFilePath);
    } catch (error) {
        console.error(`Field to delete local file ${localFilePath}:`, error );
    }
}

export {deleteLocalFile}
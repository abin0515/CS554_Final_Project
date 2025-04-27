import path from 'path';
import fs from 'fs/promises'; // Use promises version of fs
import { fileURLToPath } from 'url'; // Import necessary function

// Derive the directory of the current module (server/service)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Construct an absolute path to the intended upload directory (server/public/uploads/posts)
const SERVER_ROOT = path.resolve(__dirname, '../'); // Go up one level from service to server
const UPLOAD_DIR = path.join(SERVER_ROOT, 'public/uploads/posts');

/**
 * Saves uploaded image files for a specific post.
 * 
 * @param {Array} files - The array of file objects from req.files (Multer).
 * @param {string} postId - The ID of the post to associate images with.
 * @param {number} startIndex - The starting index for naming files (useful for edit).
 * @returns {Promise<string[]>} - A promise that resolves with an array of relative URL paths.
 */
export async function savePostImages(files, postId, startIndex = 0) {
    if (!files || files.length === 0) {
        return []; // No files to save
    }

    const savedUrls = [];
    // Ensure the upload directory exists
    // fs.mkdir with recursive: true won't throw if it already exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = path.extname(file.originalname);
        // Use postId and index (offset by startIndex) for unique naming
        const uniqueFilename = `${postId}-${startIndex + i}${fileExt}`;
        const destinationPath = path.join(UPLOAD_DIR, uniqueFilename);

        try {
            // Multer with memoryStorage gives us a buffer
            await fs.writeFile(destinationPath, file.buffer);
            
            // Construct the relative URL path for saving in DB (relative to server root for serving)
            // IMPORTANT: This URL assumes your static file server is configured to serve from 'server/public'
            // If it serves from project root, this needs adjustment.
            const relativeUrl = path.join('/uploads/posts', uniqueFilename).replace(/\\/g, '/');
            savedUrls.push(relativeUrl);
            console.log(`Saved image: ${destinationPath} as ${relativeUrl}`);

        } catch (error) {
            console.error(`Error saving file ${uniqueFilename}:`, error);
            // Decide how to handle partial failure. Throw an error to stop?
            // Or collect errors and return partial success?
            // For now, let's throw to indicate a problem.
            throw new Error(`Failed to save image ${i}: ${error.message}`);
        }
    }

    return savedUrls;
}

/**
 * Synchronizes the physical image files on the server with the desired list of URLs for a post.
 * Deletes any physical files associated with the postId that are NOT in the finalUrls list.
 * 
 * @param {string} postId - The ID of the post.
 * @param {string[]} finalUrls - The array of relative URL paths that *should* exist for the post.
 * @returns {Promise<void>} 
 */
export async function syncPostImages(postId, finalUrls) {
    // 1. Get the set of desired filenames from the finalUrls
    const desiredFilenames = new Set(
        finalUrls.map(url => path.basename(url)) // Extract filename from URL path
    );

    // 2. Read the upload directory to find current physical files for this post
    let currentPhysicalFiles = [];
    try {
        const allFiles = await fs.readdir(UPLOAD_DIR);
        currentPhysicalFiles = allFiles.filter(file => file.startsWith(`${postId}-`));
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`Upload directory ${UPLOAD_DIR} doesn't exist, no files to sync for post ${postId}.`);
            return; // Nothing to delete or compare
        }
        console.error(`Error reading upload directory for sync (${postId}):`, error);
        throw new Error(`Failed to read upload directory for sync: ${error.message}`);
    }

    // 3. Determine which physical files need to be deleted
    const filesToDelete = currentPhysicalFiles.filter(filename => 
        !desiredFilenames.has(filename)
    );

    // 4. Delete the unwanted files
    if (filesToDelete.length > 0) {
        console.log(`Syncing images for post ${postId}: Deleting ${filesToDelete.length} obsolete files:`, filesToDelete);
        const deletePromises = filesToDelete.map(filename => 
            fs.unlink(path.join(UPLOAD_DIR, filename)).catch(err => {
                // Log deletion error but don't necessarily stop the whole process
                console.error(`Error deleting obsolete file ${filename}:`, err);
            })
        );
        await Promise.all(deletePromises);
        console.log(`Finished deleting obsolete files for post ${postId}.`);
    } else {
        console.log(`Syncing images for post ${postId}: No obsolete files to delete.`);
    }
}

// Optional: Add a function to delete images if post creation/update fails later
// export async function deletePostImages(imageUrls) { ... } 
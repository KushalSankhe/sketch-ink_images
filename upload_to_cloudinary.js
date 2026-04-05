/**
 * upload_to_cloudinary.js
 * Run from inside C:\Isha_images
 *
 * Usage:
 *   node upload_to_cloudinary.js
 *
 * Install deps first:
 *   npm install cloudinary
 */

const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

// ── Your Cloudinary credentials ──────────────────────────────
cloudinary.config({
  cloud_name: "dml0nn5r8",   // replace this
  api_key:    "422951944491488",      // replace this
  api_secret: "WddYJapT7tcJpaag1WVWsJTFFfw",   // replace this
});

const TEST_MODE = false; // set false for full upload
 
const IMAGE_FOLDERS = [
  "letters", "scroll_box_letter", "flap_card", "phone_cover",
  "polaroids", "photo_strips", "frames", "vintage_frame",
  "magazine", "flap_book", "mini_flap_book", "mini_calender",
  "portraits", "devotional_portraits", "fridge_magnets", "hamper",
  "mini_cards", "postcards", "flowers_web", "mini_bouquets",
  "customized_mirrors", "2025_best", "packing", "reviews",
  "review_photos_1", "custom_bulk_orders", "minimal",
  "mini_frames_500", "mini_magzine", "mini_magazine",
  "mini_flap_with_hamper", "logo_info",
];
 
const VIDEO_FOLDERS = ["videos"];
 
// Collect files ? returns { filePath, publicId, assetFolder }
function collectFiles(localFolder) {
  const results = [];
 
  function walk(localDir, cloudDir) {
    if (!fs.existsSync(localDir)) {
      console.warn("[SKIP] Not found:", localDir);
      return;
    }
    for (const entry of fs.readdirSync(localDir, { withFileTypes: true })) {
      if (entry.name === ".git") continue;
      const localPath = path.join(localDir, entry.name);
 
      if (entry.isDirectory()) {
        walk(localPath, cloudDir + "/" + entry.name);
      } else {
        const nameNoExt  = entry.name.replace(/\.[^/.]+$/, "");
        // public_id: just the filename (no slashes) ? unique per asset
        // asset_folder: full folder path ? controls where it shows in Media Library
        const publicId   = "sketch-ink_" + cloudDir.replace(/\//g, "_") + "_" + nameNoExt;
        const assetFolder = "sketch-ink/" + cloudDir;
 
        results.push({ filePath: localPath, publicId, assetFolder });
      }
    }
  }
 
  walk(localFolder, localFolder);
  return results;
}
 
async function uploadFile({ filePath, publicId, assetFolder }, resourceType) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      public_id:       publicId,
      asset_folder:    assetFolder,   // dynamic folder mode ? controls Media Library location
      resource_type:   resourceType,
      use_filename:    false,
      unique_filename: false,
      overwrite:       true,
    });
    console.log(`[OK] ${assetFolder}/${path.basename(filePath)}`);
    return result.secure_url;
  } catch (err) {
    console.error(`[FAIL] ${publicId} ? ${err.message}`);
    return null;
  }
}
 
async function main() {
  const imageFiles = IMAGE_FOLDERS.flatMap(f => collectFiles(f));
  const videoFiles = VIDEO_FOLDERS.flatMap(f => collectFiles(f));
 
  console.log("\nSample entries (first 3):");
  imageFiles.slice(0, 3).forEach(f => {
    console.log(`  file:         ${f.filePath}`);
    console.log(`  public_id:    ${f.publicId}`);
    console.log(`  asset_folder: ${f.assetFolder}`);
    console.log();
  });
 
  if (TEST_MODE) {
    console.log("=== TEST MODE ? uploading 5 files ===\n");
    const testFiles = imageFiles.slice(0, 5);
    const urls = [];
    for (const f of testFiles) {
      const url = await uploadFile(f, "image");
      if (url) urls.push(url);
    }
    console.log("\n=== Done! Check Cloudinary Media Library > Folders ===");
    console.log("You should see: sketch-ink > letters > cover_img_letters etc");
    console.log("\nAlso open these URLs in browser:");
    urls.forEach(u => console.log(" ", u));
    console.log("\nIf folders appear correctly:");
    console.log("  Set TEST_MODE = false and run again for full upload\n");
    return;
  }
 
  // Full upload
  const total = imageFiles.length + videoFiles.length;
  let done = 0;
  console.log(`\n=== FULL UPLOAD ? ${total} files ===\n`);
 
  for (let i = 0; i < imageFiles.length; i += 5) {
    const batch = imageFiles.slice(i, i + 5);
    await Promise.all(batch.map(f => uploadFile(f, "image")));
    done += batch.length;
    process.stdout.write(`\rProgress: ${done}/${total}  `);
  }
 
  for (const f of videoFiles) {
    await uploadFile(f, "video");
    done++;
    process.stdout.write(`\rProgress: ${done}/${total}  `);
  }
 
  console.log("\n\n=== All done! ===");
  console.log('\nCDN_BASE for images.js:');
  console.log('"https://res.cloudinary.com/dml0nn5r8/image/upload/f_auto,q_auto"');
  console.log('\nNote: URLs will use public_id, not folder path.');
  console.log('After upload, run: node generate_image_map.js to get updated images.js\n');
}
 
main().catch(console.error);
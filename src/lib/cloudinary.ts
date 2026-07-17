import "server-only";
import crypto from "node:crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? "";
const API_KEY = process.env.CLOUDINARY_API_KEY ?? "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET ?? "";

export const cloudinaryEnabled = CLOUD_NAME.length > 0 && API_KEY.length > 0 && API_SECRET.length > 0;

export type UploadKind = "avatar" | "testimonial";

// Transformation applied at upload time so the stored/delivered image is
// already resized and compressed — not just optimized on-the-fly later.
// c_limit = never upscale, only shrink if bigger than the box.
const TRANSFORMATIONS: Record<UploadKind, string> = {
  avatar: "c_limit,w_512,h_512,q_auto,f_auto",
  testimonial: "c_limit,w_1280,h_1280,q_auto,f_auto",
};

const FOLDERS: Record<UploadKind, string> = {
  avatar: "savar-blood/avatars",
  testimonial: "savar-blood/testimonials",
};

/**
 * Signs the parameters for a direct browser-to-Cloudinary upload, so the
 * file never has to pass through our server (avoids Vercel's serverless
 * request body limit) while keeping the API secret server-only.
 */
export function signUpload(kind: UploadKind) {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = FOLDERS[kind];
  const transformation = TRANSFORMATIONS[kind];

  // Cloudinary signature = sha1(sorted "key=value&..." params + api_secret).
  // Only params that will actually be sent to the upload API are signed.
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}&transformation=${transformation}`;
  const signature = crypto
    .createHash("sha1")
    .update(paramsToSign + API_SECRET)
    .digest("hex");

  return {
    cloudName: CLOUD_NAME,
    apiKey: API_KEY,
    timestamp,
    signature,
    folder,
    transformation,
  };
}

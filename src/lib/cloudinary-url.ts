const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

/**
 * Builds an on-the-fly optimized delivery URL from a stored Cloudinary
 * secure_url, resizing to the given box (auto quality + format). Safe to
 * call from client or server — no secrets involved, just URL string work.
 */
export function cloudinaryThumb(url: string, size: number): string {
  if (!CLOUD_NAME || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/c_fill,g_face,w_${size},h_${size},q_auto,f_auto/`);
}

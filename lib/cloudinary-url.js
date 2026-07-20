// Small helpers that turn a stored Cloudinary URL into a resized/optimized
// delivery URL, just by inserting a transformation segment after "/upload/".
// No new uploads, no new storage — this only changes what gets DOWNLOADED.

// Grid/thumbnail version: small, cropped square, auto quality + format.
// Use this everywhere you show a photo in a grid (public gallery, admin grid).
export function cldThumb(url, width = 400) {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/c_fill,w_${width},h_${width},q_auto,f_auto/`);
}

// Lightbox/full version: capped max width so you never ship a full 3000x4000
// original just because someone tapped a photo.
export function cldFull(url, width = 1600) {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/c_limit,w_${width},q_auto,f_auto/`);
}

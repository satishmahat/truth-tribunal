// Cloudinary configuration
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Validate environment variables
if (!CLOUD_NAME || !UPLOAD_PRESET) {
  throw new Error(
    'Missing Cloudinary environment variables. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env file. See ENVIRONMENT_SETUP.md for instructions.'
  );
}

export const CLOUDINARY_CONFIG = {
  CLOUD_NAME,
  UPLOAD_PRESET,
  UPLOAD_URL: `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
}; 
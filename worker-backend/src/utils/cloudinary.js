/**
 * Cloudinary upload helper for Cloudflare Workers
 * Replaces cloudinary.uploader.upload
 */

/**
 * Parse CLOUDINARY_URL into components
 * Format: cloudinary://api_key:api_secret@cloud_name
 */
function parseCloudinaryUrl(url) {
  const match = url.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
  if (!match) throw new Error('Invalid CLOUDINARY_URL format');
  return {
    apiKey: match[1],
    apiSecret: match[2],
    cloudName: match[3],
  };
}

/**
 * Generate SHA-1 signature for Cloudinary upload
 */
async function generateSignature(params, apiSecret) {
  const sortedKeys = Object.keys(params).sort();
  const signString = sortedKeys.map(k => `${k}=${params[k]}`).join('&') + apiSecret;

  const encoder = new TextEncoder();
  const data = encoder.encode(signString);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  return [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Upload a file to Cloudinary
 * @param {File|Blob} file - The file to upload
 * @param {string} cloudinaryUrl - CLOUDINARY_URL env var
 * @param {string} folder - Target folder (e.g., "flostfound/posts")
 * @returns {Promise<{secure_url: string, public_id: string}>}
 */
export async function uploadToCloudinary(file, cloudinaryUrl, folder = 'flostfound/posts') {
  const { apiKey, apiSecret, cloudName } = parseCloudinaryUrl(cloudinaryUrl);

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params = { folder, timestamp };
  const signature = await generateSignature(params, apiSecret);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary upload failed: ${errorText}`);
  }

  return response.json();
}

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - The public_id of the image
 * @param {string} cloudinaryUrl - CLOUDINARY_URL env var
 */
export async function deleteFromCloudinary(publicId, cloudinaryUrl) {
  const { apiKey, apiSecret, cloudName } = parseCloudinaryUrl(cloudinaryUrl);

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params = { public_id: publicId, timestamp };
  const signature = await generateSignature(params, apiSecret);

  const formData = new FormData();
  formData.append('public_id', publicId);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    { method: 'POST', body: formData }
  );

  return response.json();
}

/**
 * Extract Cloudinary public_id from a secure_url
 */
export function extractPublicId(imageUrl) {
  try {
    const parts = imageUrl.split('/upload/');
    if (parts.length > 1) {
      const pathAfterUpload = parts[1];
      const withoutVersion = pathAfterUpload.replace(/^v\d+\//, '');
      return withoutVersion.replace(/\.[^.]+$/, ''); // Remove extension
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Images Service
 * Handles image upload to Firebase Storage and management
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import { getUserId } from './auth';

/**
 * Upload an image file to Firebase Storage
 * @param {File} file - Image file to upload
 * @param {Function} onProgress - Optional progress callback (0-100)
 * @returns {Promise<string>} Download URL of uploaded image
 */
export async function uploadImage(file, onProgress = null) {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User must be authenticated to upload images');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('Image must be less than 10MB');
    }

    // Create unique filename with timestamp
    const timestamp = Date.now();
    // Sanitize filename to avoid issues
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${userId}_${timestamp}_${sanitizedName}`;
    const storagePath = `images/${filename}`;
    const storageRef = ref(storage, storagePath);

    // Upload file with metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      }
    };

    console.log('Uploading image:', filename);
    const snapshot = await uploadBytes(storageRef, file, metadata);

    // Get download URL with token
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Image uploaded successfully:', downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    
    // Provide more specific error messages
    if (error.code === 'storage/unauthorized') {
      throw new Error('You do not have permission to upload images. Please check Firebase Storage rules.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload was canceled');
    } else if (error.code === 'storage/unknown') {
      throw new Error('An unknown error occurred. Please check your internet connection and Firebase configuration.');
    }
    
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Delete an image from Firebase Storage
 * @param {string} imageUrl - Download URL of image to delete
 * @returns {Promise<void>}
 */
export async function deleteImage(imageUrl) {
  try {
    if (!imageUrl) return;

    // Extract storage path from URL
    const url = new URL(imageUrl);
    const path = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0]);
    
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    
    console.log('Image deleted from storage:', path);
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw error - gracefully handle deletion failures
  }
}

/**
 * Load an image and get its dimensions
 * @param {string} imageUrl - URL of image to load
 * @returns {Promise<{width: number, height: number, image: HTMLImageElement}>}
 */
export function loadImage(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Don't set crossOrigin for Firebase Storage URLs with tokens
    // The download URL already includes authentication token
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        image: img,
      });
    };
    
    img.onerror = (error) => {
      console.error('Image load error:', error);
      reject(new Error(`Failed to load image from: ${imageUrl}`));
    };
    
    img.src = imageUrl;
  });
}

/**
 * Calculate scaled dimensions to fit within max bounds while maintaining aspect ratio
 * @param {number} width - Original width
 * @param {number} height - Original height
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @returns {{width: number, height: number}}
 */
export function calculateScaledDimensions(width, height, maxWidth, maxHeight) {
  const aspectRatio = width / height;
  
  let scaledWidth = width;
  let scaledHeight = height;
  
  // Scale down if exceeds max width
  if (scaledWidth > maxWidth) {
    scaledWidth = maxWidth;
    scaledHeight = scaledWidth / aspectRatio;
  }
  
  // Scale down if exceeds max height
  if (scaledHeight > maxHeight) {
    scaledHeight = maxHeight;
    scaledWidth = scaledHeight * aspectRatio;
  }
  
  return {
    width: Math.round(scaledWidth),
    height: Math.round(scaledHeight),
  };
}


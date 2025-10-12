// Cloudinary configuration
const CLOUDINARY_CONFIG = {
  cloud_name: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET,
};

// Upload image to Cloudinary using fetch
export const uploadImageToCloudinary = async (imageUri, uploadType = 'post') => {
  try {
    console.log('Starting Cloudinary upload for:', imageUri);
    
    // Create form data
    const formData = new FormData();
    
    // For React Native, we need to handle the URI differently
    if (imageUri.startsWith('file://')) {
      // For local files, append as file with proper type
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'image.jpg'
      });
    } else {
      // For remote URLs, fetch and convert to blob
      const response = await fetch(imageUri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Empty file');
      }
      formData.append('file', blob, 'image.jpg');
    }
    
    // Add upload parameters based on upload type
    if (uploadType === 'profile') {
      formData.append('upload_preset', 'ml_default'); // You can create a separate preset for profiles
      formData.append('folder', 'winnipen/profiles');
    } else {
      formData.append('upload_preset', 'ml_default');
      formData.append('folder', 'winnipen/posts');
    }
    // Don't add API key for unsigned uploads
    
    console.log('Uploading to Cloudinary...');
    
    // Upload to Cloudinary
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/upload`,
      {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let FormData set it automatically
      }
    );
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Cloudinary upload failed:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        error: errorText
      });
      throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
    }
    
    const result = await uploadResponse.json();
    console.log('Cloudinary upload result:', result);
    
    if (result.secure_url) {
      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height
      };
    } else {
      throw new Error(result.error?.message || 'Upload failed');
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete image from Cloudinary
export const deleteImageFromCloudinary = async (publicId) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = await generateSignature(publicId, timestamp);
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/destroy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_id: publicId,
          timestamp: timestamp,
          signature: signature,
          api_key: CLOUDINARY_CONFIG.api_key,
        }),
      }
    );
    
    const result = await response.json();
    return {
      success: result.result === 'ok',
      result
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate signature for authenticated requests
const generateSignature = async (publicId, timestamp) => {
  const message = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_CONFIG.api_secret}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

// Generate optimized image URL
export const getOptimizedImageUrl = (publicId, options = {}) => {
  const defaultOptions = {
    width: 800,
    height: 600,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto'
  };

  const finalOptions = { ...defaultOptions, ...options };
  const params = Object.entries(finalOptions)
    .map(([key, value]) => `${key}_${value}`)
    .join(',');
  
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloud_name}/image/upload/${params}/${publicId}`;
};

// Generate thumbnail URL
export const getThumbnailUrl = (publicId) => {
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloud_name}/image/upload/w_200,h_200,c_fill,q_auto,f_auto/${publicId}`;
};

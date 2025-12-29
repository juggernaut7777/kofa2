import { useState } from 'react'

// Cloudinary configuration
// To set up: 
// 1. Create free account at cloudinary.com
// 2. Go to Settings > Upload > Add upload preset
// 3. Set "Signing Mode" to "Unsigned"
// 4. Add environment variables to Vercel:
//    VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
//    VITE_CLOUDINARY_UPLOAD_PRESET=kofa_unsigned

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo'
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'docs_upload_example_us_preset'

export const useImageUpload = () => {
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState(null)

    const uploadImage = async (file) => {
        if (!file) {
            setError('No file selected')
            return null
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (!validTypes.includes(file.type)) {
            setError('Invalid file type. Please upload JPEG, PNG, WebP, or GIF.')
            return null
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
            setError('File too large. Maximum size is 5MB.')
            return null
        }

        setUploading(true)
        setProgress(0)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
            formData.append('folder', 'kofa_products')

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            )

            if (!response.ok) {
                throw new Error('Upload failed')
            }

            const data = await response.json()
            setProgress(100)

            return {
                url: data.secure_url,
                publicId: data.public_id,
                width: data.width,
                height: data.height
            }
        } catch (err) {
            console.error('Image upload error:', err)
            setError('Failed to upload image. Please try again.')
            return null
        } finally {
            setUploading(false)
        }
    }

    const deleteImage = async (publicId) => {
        // Note: Deletion requires a signed request, which should be done via your backend
        // For now, this is a placeholder
        console.log('Image deletion would require backend API:', publicId)
        return true
    }

    return {
        uploadImage,
        deleteImage,
        uploading,
        progress,
        error,
        clearError: () => setError(null)
    }
}

export default useImageUpload

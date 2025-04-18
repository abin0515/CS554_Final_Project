import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import './CreatePost.css'; // We'll create this CSS file next

const MAX_IMAGES = 6;

function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate(-1); // Go back to the previous page
  };

  const handleImageChange = (event) => {
    const files = event.target.files;
    if (!files) return;

    setError(null); // Clear previous errors
    const currentImageCount = imageFiles.length;
    const filesToAdd = Array.from(files);

    if (currentImageCount + filesToAdd.length > MAX_IMAGES) {
      setError(`You can only upload a maximum of ${MAX_IMAGES} images.`);
      // Optionally only add files up to the limit:
      // filesToAdd = filesToAdd.slice(0, MAX_IMAGES - currentImageCount);
      // If we don't slice, we just reject the whole batch if it exceeds the limit
      event.target.value = ''; // Reset file input
      return; 
    }

    const newFiles = [];
    const newPreviewUrls = [];

    filesToAdd.forEach(file => {
      newFiles.push(file);
      newPreviewUrls.push(URL.createObjectURL(file));
    });

    setImageFiles(prevFiles => [...prevFiles, ...newFiles]);
    setImagePreviewUrls(prevUrls => [...prevUrls, ...newPreviewUrls]);
    
    // Reset file input after processing
    event.target.value = '';
  };

  const handleRemoveImage = useCallback((indexToRemove) => {
    // Revoke the object URL before removing it from state
    const urlToRemove = imagePreviewUrls[indexToRemove];
    URL.revokeObjectURL(urlToRemove);

    setImageFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    setImagePreviewUrls(prevUrls => prevUrls.filter((_, index) => index !== indexToRemove));
  }, [imagePreviewUrls]); // Dependency on imagePreviewUrls is important here

  // Clean up all object URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviewUrls]); // Run cleanup if the array instance changes

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title cannot be empty.');
      return;
    }
    if (!content.trim()) {
      setError('Content cannot be empty.');
      return;
    }

    setLoading(true);

    // Create FormData to send everything in one request
    const formData = new FormData();

    // Append text data
    formData.append('title', title);
    formData.append('content', content);
    formData.append('user_id', '2001'); // TODO: Replace with actual user ID
    formData.append('type', '1'); // TODO: Get actual type if needed

    // Append image files
    imageFiles.forEach((file) => {
        // Use 'postImages' to match the field name expected by multer on backend
        formData.append('postImages', file);
    });

    try {
      // Send combined data to the createPost endpoint
      const response = await fetch(`${API_BASE_URL}/posts/createPost`, {
        method: 'POST',
        body: formData,
        // No 'Content-Type' header for FormData - browser sets it
      });

      const result = await response.json();

      if (!response.ok) {
        // Use error message from backend if available
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      console.log('Post created successfully:', result);
      navigate('/'); // Navigate to home/post list on success

    } catch (e) {
      setError(e.message);
      console.error("Error creating post:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="create-post-container" onSubmit={handleSubmit}>
      <div className="create-post-header">
         {/* Placeholder for potential header elements within the form area */}
         <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="create-post-title-input"
            disabled={loading}
          />
         <div className="create-post-actions-top">
           <button type="button" onClick={handleCancel} className="cancel-button" disabled={loading}>Cancel</button>
           <button type="submit" className="post-button" disabled={loading}>
             {loading ? 'Posting...' : 'Post'}
           </button>
         </div>
      </div>

      <div className="create-post-topic">
        {/* Placeholder for topic selection */}
        <button type="button" className="topic-button">+ Topic</button>
      </div>

      <div className="image-upload-section">
        {imageFiles.length < MAX_IMAGES && (
          <label htmlFor="image-upload" className="image-upload-label">
            Add Image ({imageFiles.length}/{MAX_IMAGES})
          </label>
        )}
        <input 
          id="image-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="image-upload-input"
          disabled={loading || imageFiles.length >= MAX_IMAGES}
        />
        <div className="image-previews-grid"> 
          {imagePreviewUrls.map((url, index) => (
            <div key={index} className="image-preview-container">
              <img src={url} alt={`Preview ${index + 1}`} className="image-preview" />
              <button 
                type="button" 
                onClick={() => handleRemoveImage(index)}
                className="remove-image-button"
                disabled={loading}
                title="Remove Image"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>

      <textarea 
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What are your thoughts?"
        className="create-post-content-input"
        rows={15} // Adjust rows as needed
        disabled={loading}
      />

      {error && <div className="error-message create-post-error">{error}</div>}

      {/* Bottom placeholder, e.g., for drafts */}
      <div className="create-post-footer">
         {/* Restored from draft placeholder? */}
      </div>
    </form>
  );
}

export default CreatePost; 
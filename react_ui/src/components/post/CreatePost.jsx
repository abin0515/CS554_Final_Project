import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { POST_API_BASE_URL } from '../../config';
import { fetchWithAuth } from '../../lib/Auth';
import { useAuth } from '../../context/AuthContext';
import './CreatePost.css';

const MAX_IMAGES = 6;

function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser === null) {
      alert("Please sign in to create a post.");
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleCancel = () => navigate(-1);

  const handleImageChange = (event) => {
    const files = event.target.files;
    if (!files) return;

    setError(null);
    const filesToAdd = Array.from(files);

    if (imageFiles.length + filesToAdd.length > MAX_IMAGES) {
      setError(`You can only upload up to ${MAX_IMAGES} images.`);
      event.target.value = '';
      return;
    }

    const newFiles = [];
    const newPreviews = [];

    filesToAdd.forEach(file => {
      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    setImageFiles(prev => [...prev, ...newFiles]);
    setImagePreviewUrls(prev => [...prev, ...newPreviews]);
    event.target.value = '';
  };

  const handleRemoveImage = useCallback((index) => {
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  }, [imagePreviewUrls]);

    // Handler for drag-over event to allow dropping
    const handleDragOver = useCallback((event) => {
      event.preventDefault();
    }, []);

    // Handler for drop event to process dropped files
    const handleDrop = useCallback((event) => {
      event.preventDefault();
      setError(null);
      const files = event.dataTransfer.files;
      if (!files) return;
      const filesToAdd = Array.from(files);

      if (imageFiles.length + filesToAdd.length > MAX_IMAGES) {
        setError(`You can only upload up to ${MAX_IMAGES} images.`);
        return;
      }

      const newFiles = [];
      const newPreviews = [];
      filesToAdd.forEach(file => {
        // Ensure only image files are dropped
        if (file.type.startsWith('image/')) {
          newFiles.push(file);
          newPreviews.push(URL.createObjectURL(file));
        }
      });

      setImageFiles(prev => [...prev, ...newFiles]);
      setImagePreviewUrls(prev => [...prev, ...newPreviews]);
    }, [imageFiles]);

  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach(URL.revokeObjectURL);
    };
  }, [imagePreviewUrls]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!title.trim()) return setError('Title cannot be empty.');
    if (!content.trim()) return setError('Content cannot be empty.');

    setLoading(true);

    // --- MODERATION CHECK ---
    try {
      console.log("Sending content for moderation:", content);
      // Assuming CHAT_API_BASE_URL is defined in your config.js, e.g., 'http://localhost:3001'
      // If not, replace CHAT_API_BASE_URL with the actual base URL for your 'server' backend
      const moderationResponse = await fetchWithAuth(`${POST_API_BASE_URL}/chat/submitchcek`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: content }]
        }),
      });

      const moderationResult = await moderationResponse.json();
      console.log("Moderation result:", moderationResult);

      if (!moderationResponse.ok) {
        // Handle non-2xx responses from moderation service as a failure to moderate
        throw new Error(moderationResult.error || moderationResult.details || `Moderation check failed with status: ${moderationResponse.status}`);
      }

      if (!moderationResult.isSafe) {
        alert(`Post cannot be created: Please be polite -- MotherDucker.`);
        setLoading(false);
        return; // Stop submission
      }
    } catch (moderationError) {
      console.error("Error during content moderation:", moderationError);
      setError(`Moderation check failed: ${moderationError.message}. Please try again.`);
      setLoading(false);
      return; // Stop submission
    }
    // --- END MODERATION CHECK ---

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('type', '1');
    imageFiles.forEach(file => formData.append('postImages', file));

    try {
      const response = await fetchWithAuth(`${POST_API_BASE_URL}/posts/createPost`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);

      navigate('/');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="create-post-container" onSubmit={handleSubmit}>
      <div className="create-post-header">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title..."
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

      
      <div className="image-upload-wrapper">
      <div
        className="image-upload-section"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{ border: '2px dashed #93c5fd', padding: '1rem', borderRadius: '0.375rem', textAlign: 'center' }}
      >
                  {imageFiles.length < MAX_IMAGES && (
            <>
              <label htmlFor="image-upload" className="image-upload-label">
                Click or Drop to Add Image ({imageFiles.length}/{MAX_IMAGES})
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="image-upload-input"
                disabled={loading}
              />
            </>
          )}
        </div>

        {imagePreviewUrls.length > 0 && (
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
        )}
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your thoughts here..."
        className="create-post-content-input"
        rows={12}
        disabled={loading}
      />

      {error && <div className="create-post-error">{error}</div>}

      <div className="create-post-footer" />
    </form>
  );
}

export default CreatePost;

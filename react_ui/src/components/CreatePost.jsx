import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { POST_API_BASE_URL } from '../config';
import { fetchWithAuth } from '../lib/Auth';
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
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('user_id', '2001');
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

      <div className="create-post-topic">
        <button type="button" className="topic-button">+ Add Topic</button>
      </div>

      <div className="image-upload-wrapper">
        <div className="image-upload-section">
          {imageFiles.length < MAX_IMAGES && (
            <>
              <label htmlFor="image-upload" className="image-upload-label">
                Add Image ({imageFiles.length}/{MAX_IMAGES})
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

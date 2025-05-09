import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { POST_API_BASE_URL } from '../../config';
import { fetchWithAuth } from '../../lib/Auth';
import './CreatePost.css'; // Reuse CreatePost styles for now

const MAX_IMAGES = 6;

function EditPost() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const postId = searchParams.get('postId');

  // State for form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFiles, setImageFiles] = useState([]); // Files newly added by user
  const [existingImageUrls, setExistingImageUrls] = useState([]); // URLs from DB
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]); // Combined previews

  // State for loading/error
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null); // Error fetching initial data
  const [submitError, setSubmitError] = useState(null); // Error during submission
  const [isFetching, setIsFetching] = useState(true); // Loading state for initial fetch

  // Helper to create full URL for display
  const getImageFullUrl = (relativePath) => {
    if (!relativePath) return '';
    return relativePath.startsWith('http') ? relativePath : `${POST_API_BASE_URL.replace(/\/$/, '')}/${relativePath.replace(/^\//, '')}`;
  };

  // --- Fetch existing post data ---
  useEffect(() => {
    if (!postId) {
      setFetchError('No Post ID provided for editing.');
      setIsFetching(false);
      return;
    }
    setIsFetching(true);
    const fetchPostData = async () => {
      try {
        const response = await fetchWithAuth(`${POST_API_BASE_URL}/posts/detail?postId=${postId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setTitle(data.title || '');
        setContent(data.content || '');
        const urls = data.image_urls || [];
        setExistingImageUrls(urls);
        // Initial previews are from existing URLs
        setImagePreviewUrls(urls.map(url => getImageFullUrl(url)));
      } catch (e) {
        setFetchError(`Failed to fetch post data: ${e.message}`);
        console.error("Error fetching post data:", e);
      } finally {
        setIsFetching(false);
      }
    };
    fetchPostData();
  }, [postId]);

  // --- Image Handling ---
  const handleImageChange = (event) => {
     // Similar to CreatePost, but check against total images (existing + new)
     const files = event.target.files;
     if (!files) return;

     setSubmitError(null);
     const currentTotalImages = existingImageUrls.length + imageFiles.length;
     const filesToAdd = Array.from(files);

     if (currentTotalImages + filesToAdd.length > MAX_IMAGES) {
       setSubmitError(`You can only have a maximum of ${MAX_IMAGES} images in total.`);
       event.target.value = '';
       return;
     }

     const newFiles = [];
     const newPreviewUrls = [];

     filesToAdd.forEach(file => {
       newFiles.push(file);
       newPreviewUrls.push(URL.createObjectURL(file)); // Create blob URLs for new files
     });

     setImageFiles(prevFiles => [...prevFiles, ...newFiles]);
     // Add new blob URLs to the existing full URLs for combined preview
     setImagePreviewUrls(prevUrls => [...prevUrls, ...newPreviewUrls]);
     event.target.value = '';
  };

  const handleRemoveImage = useCallback((indexToRemove, isExisting) => {
    const urlToRemove = imagePreviewUrls[indexToRemove];
    URL.revokeObjectURL(urlToRemove); // Revoke potential blob URL

    if (isExisting) {
      // Remove from existing URLs list
      setExistingImageUrls(prev => prev.filter((_, index) => index !== indexToRemove));
    } else {
      // Find the corresponding index in the *new* files array to remove
      // This assumes preview order matches concat order (existing first, then new)
      const newFileIndexToRemove = indexToRemove - existingImageUrls.length;
      setImageFiles(prev => prev.filter((_, index) => index !== newFileIndexToRemove));
    }
    // Always remove from the combined preview list
    setImagePreviewUrls(prev => prev.filter((_, index) => index !== indexToRemove));

  }, [imagePreviewUrls, existingImageUrls.length]);

  // Clean up new blob URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach(url => {
        // Only revoke blob URLs created by createObjectURL
        if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }
      });
    };
  }, [imagePreviewUrls]);

  // --- Form Submission ---
  const handleCancel = () => {
    navigate(-1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);
    // Basic validation for title/content
    if (!title.trim()) {
      setSubmitError('Title cannot be empty.');
      return;
    }
    if (!content.trim()) {
      setSubmitError('Content cannot be empty.');
      return;
    }

    setLoading(true);

    const formData = new FormData();

    // Append text data
    formData.append('title', title);
    formData.append('content', content);

    // Append the list of EXISTING urls that should be kept
    formData.append('existingUrls', JSON.stringify(existingImageUrls));

    // Append NEWLY added files
    imageFiles.forEach((file) => {
        // Use 'postImages' to match multer field name in backend route
        formData.append('postImages', file);
    });

    try {
      // Send combined data to the editPost endpoint
      const response = await fetchWithAuth(`${POST_API_BASE_URL}/posts/editPost?postId=${postId}`, {
        method: 'PUT',
        body: formData,
        // No 'Content-Type' header needed for FormData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      console.log('Post updated successfully:', result);
      // Navigate back to the detail page on success
      navigate(`/posts/detail?postId=${postId}`);

    } catch (e) {
      setSubmitError(e.message);
      console.error("Error updating post:", e);
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---
  if (isFetching) return <div>Loading post data...</div>;
  if (fetchError) return <div className="error-message">{fetchError}</div>;

  return (
    <form className="edit-post-container" onSubmit={handleSubmit}>
      {/* Header (reuse styles or use edit-post-* classes) */}
      <div className="create-post-header">
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
             {loading ? 'Saving...' : 'Save Changes'}
           </button>
         </div>
      </div>

      {/* Topic (reuse) */}
      <div className="create-post-topic">
        <button type="button" className="topic-button">+ Topic</button>
      </div>

      {/* Image Upload (reuse styles or use edit-post-* classes) */}
      <div className="image-upload-section">
        {imagePreviewUrls.length < MAX_IMAGES && (
          <label htmlFor="image-upload" className="image-upload-label">
             Add Image ({imagePreviewUrls.length}/{MAX_IMAGES})
          </label>
        )}
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="image-upload-input"
          disabled={loading || imagePreviewUrls.length >= MAX_IMAGES}
        />
        <div className="image-previews-grid">
          {imagePreviewUrls.map((url, index) => {
            const isExisting = index < existingImageUrls.length;
            return (
              <div key={url || index} className="image-preview-container">
                <img src={url} alt={`Preview ${index + 1}`} className="image-preview" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index, isExisting)}
                  className="remove-image-button"
                  disabled={loading}
                  title="Remove Image"
                >
                  &times;
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Content Textarea (reuse) */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What are your thoughts?"
        className="create-post-content-input"
        rows={15}
        disabled={loading}
      />

      {submitError && <div className="error-message create-post-error">{submitError}</div>}

      {/* Footer (reuse) */}
      <div className="create-post-footer">
         {/* Optionally show saved status or draft info */}
      </div>
    </form>
  );
}

export default EditPost;

// updated with input validation
import { Router } from "express";
import multer from 'multer';
import * as postService from "../service/post_service.js";
import * as uploadService from "../service/upload_service.js";
import { authenticate } from "../middleware/authenticate.js";
import { isValidPostTitle, isValidPostContent, isValidPostType, isValidPostId, isValidUid } from "./validator.js";

const router = Router();
const MAX_IMAGES = 6;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 5 }
});

router.post(
  '/createPost',
  authenticate,
  upload.array('postImages', MAX_IMAGES),
  async (req, res) => {
    try {
      const { title, content, type } = req.body;
      const files = req.files;
      const userId = req.user.uid;

      if (!isValidPostTitle(title) || !isValidPostContent(content) || !isValidPostType(type)) {
        return res.status(400).json({ error: 'Invalid post data' });
      }

      const newPost = await postService.createPost(title, content, userId, type);

      let finalImageUrls = [];
      let postWithImages = newPost;

      if (files && files.length > 0) {
        try {
          finalImageUrls = await uploadService.savePostImages(files, newPost._id);
          postWithImages = await postService.addImagesToPost(newPost._id, userId, finalImageUrls);
        } catch (imageError) {
          console.error('Image error after post creation:', imageError);
          return res.status(500).json({
            error: `Post created but image saving failed: ${imageError.message}`,
            postId: newPost._id
          });
        }
      }

      res.status(200).json(postWithImages);

    } catch (e) {
      console.error("Create post error:", e);
      res.status(400).json({ error: e.message });
    }
  }
);

router.get('/page', async (req, res) => {
  try {
    let page = parseInt(req.query.page || '1');
    if (isNaN(page) || page < 1) page = 1;

    const { posts, totalPosts } = await postService.getPostsByPage(page);
    res.status(200).json({ success: true, currentPage: page, posts, postsPerPage: 10, totalPosts });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/best', async (req, res) => {
  try {
    const {posts} = await postService.getBestPosts();
    res.status(200).json({success:true, posts})
  } catch (e) {
    res.status(500).json({error:e.message});
  }
})

router.get('/loudest', async (req, res) => {
  try {
    const {posts} = await postService.getLoudestPosts();
    res.status(200).json({success:true, posts})
  } catch (e) {
    res.status(500).json({error:e.message});
  }
})

router.get('/trending', async (req, res) => {
  try {
    const {posts} = await postService.getTrendingPosts();
    res.status(200).json({success:true, posts})
  } catch (e) {
    res.status(500).json({error:e.message});
  }
})

router.get('/detail', async (req, res) => {
  try {
    const postId = req.query.postId;
    if (!isValidPostId(postId)) return res.status(400).json({ error: 'Invalid post ID' });

    const post = await postService.getPostById(postId);
    res.status(200).json(post);
  } catch (e) {
    const code = e.message === 'Post not found' ? 404 : 500;
    res.status(code).json({ error: e.message });
  }
});

router.put(
  '/editPost',
  authenticate,
  upload.array('postImages', MAX_IMAGES),
  async (req, res) => {
    const postId = req.query.postId;
    const userId = req.user.uid;

    if (!isValidPostId(postId)) return res.status(400).json({ error: 'Invalid post ID' });

    const { title, content, existingUrls } = req.body;
    if (!isValidPostTitle(title) || !isValidPostContent(content)) {
      return res.status(400).json({ error: 'Invalid title or content' });
    }

    const newFiles = req.files;
    let parsedExistingUrls = [];
    try {
      parsedExistingUrls = existingUrls ? JSON.parse(existingUrls) : [];
      if (!Array.isArray(parsedExistingUrls)) parsedExistingUrls = [];
    } catch {
      return res.status(400).json({ error: 'Invalid format for existingUrls' });
    }

    try {
      const newlySavedUrls = await uploadService.savePostImages(newFiles, postId, parsedExistingUrls.length);
      const finalImageUrls = [...parsedExistingUrls, ...newlySavedUrls];

      await uploadService.syncPostImages(postId, finalImageUrls);

      const updatePayload = { title, content, image_urls: finalImageUrls };
      const updatedPost = await postService.editPost(postId, userId, updatePayload);

      res.status(200).json({ success: true, message: 'Post updated successfully', post: updatedPost });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

router.delete('/removePost', authenticate, async (req, res) => {
  const postId = req.query.postId;
  const userId = req.user.uid;

  if (!isValidPostId(postId)) return res.status(400).json({ error: 'Invalid post ID' });

  try {
    const deleteDbResult = await postService.removePost(userId, postId);
    if (deleteDbResult) {
      try {
        await uploadService.syncPostImages(postId, []);
      } catch (imageError) {
        return res.status(200).json({
          success: true,
          message: 'Post deleted, but image cleanup failed.'
        });
      }
    }
    res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/user/:userId', authenticate, async (req, res) => {
  const { userId } = req.params;
  if (!isValidUid(userId)) return res.status(400).json({ error: 'Invalid user ID' });

  try {
    const posts = await postService.getPostsByUserId(userId);
    res.status(200).json({ success: true, posts });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

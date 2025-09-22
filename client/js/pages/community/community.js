import { io } from 'socket.io-client';
import '../../../css/components/footer.css';
import '../../../css/components/navBarUser.css';
import '../../../css/components/preloader.css';
import '../../../css/pages/community/community.css';
import { startSessionChecks, validateSessionAndNavigate } from '../../../utils/sessionUtils.js';
import '../../components/navBarUser.js';
import { setupLogoutListener } from '../../global/logout.js';

setupLogoutListener();

// start session checks on page load
startSessionChecks();

const doc = document;
const { log, error } = console;

const getById = (id) => doc.getElementById(id);
const getAll = (selector) => doc.querySelectorAll(selector);
const get = (selector) => doc.querySelector(selector);

let currentUserId = null;
let currentPhoto = null;
let selectedImage = null; // Move to global scope

getCurrentUserId().then((userId) => {
  if (userId) {
    currentUserId = userId; // Set the global variable
    // Update profile pictures when page loads
    updateProfilePictures();
    
    const socket = io({ query: { userId } });

    socket.on('newPost', (data) => {
      if (data.status === 'success') {
        fetchPosts(false);
        fetchPopularHashtags(false);
      }
    });

    socket.on('newLike', (data) => {
      if (data.status === 'success') {
        fetchPosts(false);
        fetchPopularHashtags(false);
      }
    });
    socket.on('removeLike', (data) => {
      if (data.status === 'success') {
        fetchPosts(false);
        fetchPopularHashtags(false);
      }
    });
    socket.on('postDeleted', (data) => {
      if (data.status === 'success') {
        // remove post element if present
        const el = doc.querySelector(`.post[data-post-id="${data.postId}"]`);
        if (el) el.remove();
        // if no posts left besides create-post container, show placeholder
        const remaining = doc.querySelectorAll('#post-feed .post').length;
        if (remaining === 0) {
          const feed = getById('post-feed');
          if (!feed.querySelector('.placeholder')) {
            feed.innerHTML += '<div class="placeholder">No posts to display</div>';
          }
        }
      }
    });
    
    socket.on('postEdited', (data) => {
      if (data.status === 'success') {
        // update post content
        const postElement = doc.querySelector(`.post[data-post-id="${data.postId}"]`);
        if (postElement) {
          const contentElement = postElement.querySelector('.post-content');
          if (contentElement) {
            contentElement.textContent = data.content;
          }
          
          // Update date to show edited state
          if (data.edited) {
            const dateElement = postElement.querySelector('.date');
            if (dateElement && !dateElement.textContent.includes('(edited)')) {
              dateElement.textContent += ' (edited)';
            }
          }
        }
      }
    });
  } else {
    error('User ID could not be retrieved.');
  }
});

doc.addEventListener('DOMContentLoaded', async () => {
  await fetchPopularHashtags();
  await fetchPosts();

  // Dynamically add the profile photo inside the 'profile-pic' element
  const userProfilePic = await getCurrentProfilePicture();
  console.log('User profile pic:', userProfilePic);
  const profilePicElement = getById('create-post-container').querySelector('.profile-pic');

  // Check if there's no image already in the profile-pic container
  if (!profilePicElement.querySelector('img')) {
    const imgElement = doc.createElement('img');
    imgElement.src = userProfilePic; // Set the profile image URL
    imgElement.alt = 'Profile Picture'; // Alt text for accessibility
    profilePicElement.appendChild(imgElement);
  }

  // Add listeners for filters
  setupFilters();
  
  // Setup load more button
  setupLoadMoreButton();

  // Post creation handlers
  const postInputEl = getById('post-input');
  const postBtn = getById('post-button');
  const imageUploadBtn = getById('image-upload-btn');
  const imageUploadInput = getById('image-upload');
  const imagePreview = getById('image-preview');
  const previewImg = getById('preview-img');
  const removeImageBtn = getById('remove-image');
  
  if (postInputEl && postBtn) {
    // Enable/disable based on content or image
    const syncButtonState = () => {
      const hasText = postInputEl.value.trim().length > 0;
      const hasImage = selectedImage !== null;
      postBtn.disabled = !(hasText || hasImage);
    };
    
    postInputEl.addEventListener('input', syncButtonState);
    
    // Allow Enter with Shift for new lines, Enter alone to submit
    postInputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!postBtn.disabled) {
          postBtn.click();
        }
      }
    });
    
    // Image upload handlers
    imageUploadBtn.addEventListener('click', () => {
      imageUploadInput.click();
    });
    
    imageUploadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          alert('Image size must be less than 5MB');
          return;
        }
        
        selectedImage = file;
        const reader = new FileReader();
        reader.onload = (e) => {
          previewImg.src = e.target.result;
          imagePreview.style.display = 'block';
          syncButtonState();
        };
        reader.readAsDataURL(file);
      }
    });
    
    removeImageBtn.addEventListener('click', () => {
      selectedImage = null;
      imagePreview.style.display = 'none';
      imageUploadInput.value = '';
      syncButtonState();
    });
    
    postBtn.addEventListener('click', async () => {
      if (postBtn.disabled) return;
      postBtn.disabled = true;
      postBtn.textContent = 'Posting...';
      try {
        await createPost();
      } finally {
        postBtn.textContent = 'Post';
        postInputEl.value = '';
        selectedImage = null;
        const imagePreview = getById('image-preview');
        const imageUploadInput = getById('image-upload');
        if (imagePreview) {
          imagePreview.style.display = 'none';
        }
        if (imageUploadInput) {
          imageUploadInput.value = '';
        }
        syncButtonState();
      }
    });
    
    // Initial state
    syncButtonState();
  }
});

function setupFilters() {
  // date filter listeners
  getAll('input[name="date-filter"]').forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      console.log('Date filter changed', e.target.value);
      handleDateFilterChange(e.target);
      fetchPosts();
    });
  });

  // sort filter listeners
  getAll('input[name="sort-filter"]').forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      console.log('Sort filter changed', e.target.value);
      handleSortFilterChange(e.target);
      fetchPosts();
    });
  });

  // hashtag filter listeners
  getAll('.hashtag-filter').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      console.log('Hashtag filter changed');
      fetchPosts(); // re-fetch posts when hashtags change
    });
  });
}

async function createPost() {
  const postInput = getById('post-input');
  const content = postInput.value.trim();
  
  // Use the global selectedImage variable
  console.log('Creating post with selectedImage:', selectedImage);

  if (!content && !selectedImage) {
    alert('Please add some content or an image to create a post.');
    return;
  }

  try {
    const formData = new FormData();
    
    // Always send content, even if empty (backend validation will handle it)
    formData.append('content', content);
    
    if (selectedImage) {
      formData.append('image', selectedImage);
    }

    const response = await fetch('/user/community/post', {
      method: 'POST',
      body: formData // Don't set Content-Type header, let browser set it with boundary
    });

    const data = await response.json();

    if (data.status === 'success') {
      // update the UI with the new post
      fetchPosts();
      fetchPopularHashtags();
      postInput.value = ''; // clear the input after posting
      
      // Clear image upload
      selectedImage = null;
      const imageUploadInput = getById('image-upload');
      if (imageUploadInput) {
        imageUploadInput.value = '';
      }
      const imagePreview = getById('image-preview');
      if (imagePreview) {
        imagePreview.style.display = 'none';
      }
      
      // Update button state
      const postBtn = getById('post-button');
      if (postBtn) {
        const syncButtonState = () => {
          const hasText = postInput.value.trim().length > 0;
          const hasImage = selectedImage !== null;
          postBtn.disabled = !(hasText || hasImage);
        };
        syncButtonState();
      }
    } else {
      alert(data.message || 'Failed to create the post.');
    }
  } catch (err) {
    error('Error creating post:', err);
    alert('Error creating post. Please try again later.');
  }
}

async function fetchPopularHashtags(withPreloader = true) {
  try {
    const response = await fetch('/user/community/posts/popular', {
      withPreloader
    });
    const data = await response.json();
    log(data);

    if (data.status !== 'success') {
      throw new Error('Failed to fetch popular hashtags');
    }

    const popularHashtags = data.data.hashtags;
    const hashtagsContainer = getById('popular-hashtags');
    hashtagsContainer.innerHTML = ''; // Clear any existing content

    popularHashtags.forEach((hashtag) => {
      const label = doc.createElement('label');
      label.innerHTML = `<input type="checkbox" class="hashtag-filter" value="${hashtag.hashtag}" />
        #${hashtag.hashtag} (${hashtag.count})`;
      hashtagsContainer.appendChild(label);
    });
  } catch (err) {
    error('Error fetching popular hashtags:', err);
  }
}

// Global variables for pagination
let currentPage = 1;
let hasMorePosts = true;
let isLoading = false;
let postsPerPage = 5; // Number of posts per page

async function fetchPosts(withPreloader = true, reset = true) {
  try {
    if (isLoading) return;
    isLoading = true;
    
    // Reset pagination if requested (for new searches/filters)
    if (reset) {
      currentPage = 1;
      hasMorePosts = true;
      // If reset, clear existing posts
      if (currentPage === 1) {
        const postFeed = getById('post-feed');
        const createPostContainer = getById('create-post-container');
        if (postFeed && createPostContainer) {
          postFeed.innerHTML = '';
          postFeed.appendChild(createPostContainer);
        }
      }
    }
    
    // If no more posts to load and not resetting, return early
    if (!hasMorePosts && !reset) {
      isLoading = false;
      return;
    }
    
    const selectedDateFilter = getSelectedDateFilter();
    const selectedSort = getSelectedSort();
    const selectedHashtags = getSelectedHashtags();

    // build the query params dynamically based on selected filters
    const params = new URLSearchParams();
    if (selectedDateFilter) {
      params.append('dateFilter', selectedDateFilter);
    }
    if (selectedSort) {
      params.append('sort', selectedSort);
    }
    if (selectedHashtags.length > 0) {
      params.append('hashtag', selectedHashtags.join(','));
    }
    
    // Add pagination parameters
    params.append('page', currentPage);
    params.append('limit', postsPerPage);

    const response = await fetch(`/user/community/posts?${params.toString()}`, { withPreloader });
    const data = await response.json();
    if (data.status !== 'success') {
      throw new Error('Failed to fetch posts');
    }

    const posts = data.data.posts;
    const pagination = data.data.pagination;
    
    // Update pagination status
    hasMorePosts = currentPage < pagination.totalPages;
    
    // Render posts without clearing if loading more
    await renderPosts(posts, !reset);
    
    // Show/hide load more button based on if there are more posts
    updateLoadMoreButton();
    
    // Increment page number for next load
    currentPage++;
  } catch (err) {
    error('Error fetching posts:', err);
    await renderPosts(null, false);
  } finally {
    isLoading = false;
  }
}

function getSelectedDateFilter() {
  const selectedDateFilter = Array.from(getAll('input[name="date-filter"]:checked')).map((checkbox) => checkbox.value);

  if (selectedDateFilter.length === 1) {
    return selectedDateFilter[0];
  }

  return null;
}

function getSelectedSort() {
  const selectedSort = Array.from(getAll('input[name="sort-filter"]:checked')).map((checkbox) => checkbox.value);

  if (selectedSort.length === 1) {
    return selectedSort[0];
  }

  return null;
}

function getSelectedHashtags() {
  return Array.from(getAll('.hashtag-filter:checked')).map((checkbox) => checkbox.value);
}

function handleDateFilterChange(target) {
  if (target.checked) {
    getAll('input[name="date-filter"]').forEach((checkbox) => {
      if (checkbox !== target) {
        checkbox.checked = false;
      }
    });
    fetchPosts();
  }
}

function handleSortFilterChange(target) {
  if (target.checked) {
    getAll('input[name="sort-filter"]').forEach((checkbox) => {
      if (checkbox !== target) {
        checkbox.checked = false;
      }
    });
    fetchPosts();
  }
}

async function renderPosts(posts, append = false) {
  const postFeed = getById('post-feed');
  const createPostContainer = getById('create-post-container');
  
  // Only clear existing posts if not appending
  if (!append) {
    postFeed.innerHTML = ''; 
    postFeed.appendChild(createPostContainer);
  }

  if (!posts || posts.length === 0) {
    if (!append) {
      postFeed.innerHTML += '<div class="placeholder">No posts to display</div>';
    }
    return;
  }

  // Use the global currentUserId
  console.log('Global currentUserId:', currentUserId);

  for (const post of posts) {
    // Extract userId from the nested structure - the userId._id field might be at userId._id or userId.id
    const postUserId = post.userId?._id || (post.userId?.id ? post.userId.id : null);
    
    // Now do the ownership check with the properly extracted ID
    const isPostOwner = String(postUserId) === String(currentUserId);
    
    // Clean up debug logs
    console.log('Post owner check:', {
      postOwner: post.userId?.username,
      isCurrentUser: isPostOwner
    });
    
    const postElement = doc.createElement('div');
    postElement.classList.add('post');
    postElement.setAttribute('data-post-id', post._id);
    
    // Build post content HTML
    let postContentHTML = '';
    if (post.content) {
      postContentHTML += `<div class="post-text">${post.content}</div>`;
    }
    if (post.image) {
      postContentHTML += `<div class="post-image">
        <img src="${post.image}" alt="Post image" style="max-width: 100%; height: auto; border-radius: 8px; margin-top: 10px;">
      </div>`;
    }
    
    postElement.innerHTML = `<div class="post-header">
        <div class="profile-pic">
          <img src="${post.userId.profile_photo}" alt="Profile Picture">
        </div>
        <div class="name-date">
          <div class="name">${post.userId.username}</div>
          <div class="date">${formatDate(post.createdAt)}</div>
        </div>
      </div>
      <div class="post-content">${postContentHTML}</div>
      <div class="post-footer">
        <span id="like-button-${post._id}" class="action like-action" data-post-id="${post._id}">
          <i class="fas fa-thumbs-up"></i> Like <span id="like-count-${post._id}">(${post.likesCount})</span>
        </span>
        <span class="action comment-action" data-post-id="${post._id}">
          <i class="fas fa-comment"></i> Comment <span id="comment-count-${post._id}">(${post.commentCount})</span>
        </span>
        ${isPostOwner ? `
          <span class="action edit-post-action" data-post-id="${post._id}"><i class="fas fa-edit"></i> Edit</span>
          <span class="action delete-post-action" data-post-id="${post._id}"><i class="fas fa-trash"></i> Delete</span>
        ` : ''}
      </div>
    `;
    postFeed.appendChild(postElement);

    // check if the current user has liked the post, and apply the appropriate color
    const isLiked = post.likedBy.includes(currentUserId);

    const likeButton = getById(`like-button-${post._id}`);
    if (isLiked) {
      likeButton.style.color = '#0093ff';
    }
  }
  setupLikeListeners();
  setupCommentListeners();
}

// Delegated click listeners for post actions (attach once)
const postFeedEl = getById('post-feed');
if (postFeedEl && !postFeedEl.hasAttribute('data-actions-listener')) {
  postFeedEl.addEventListener('click', (e) => {
    const del = e.target.closest('.delete-post-action');
    const edit = e.target.closest('.edit-post-action');
    
    if (del) {
      const postId = del.getAttribute('data-post-id');
      deleteUserPost(postId);
    } else if (edit) {
      const postId = edit.getAttribute('data-post-id');
      editUserPost(postId);
    }
  });
  postFeedEl.setAttribute('data-actions-listener', 'true');
}

async function editUserPost(postId) {
  try {
    const postElement = doc.querySelector(`.post[data-post-id="${postId}"]`);
    if (!postElement) return;
    
    const contentElement = postElement.querySelector('.post-content');
    const postTextElement = contentElement.querySelector('.post-text');
    const originalContent = postTextElement ? postTextElement.textContent : '';
    
    // Check if post has an image
    const postImageElement = contentElement.querySelector('.post-image img');
    const originalImageUrl = postImageElement ? postImageElement.getAttribute('src') : null;
    
    // Create edit form
    const editForm = doc.createElement('div');
    editForm.className = 'post-edit-form';
    editForm.innerHTML = `
      <textarea class="post-edit-textarea" style="width:100%; height:80px; padding:8px; margin-bottom:10px; border:1px solid #ddd; border-radius:5px;">${originalContent}</textarea>
      
      <div class="edit-image-controls" style="margin-bottom:10px;">
        ${originalImageUrl ? `
          <div class="current-image" style="margin-bottom:10px;">
            <img src="${originalImageUrl}" alt="Current image" style="max-width:100%; max-height:150px; border-radius:5px;">
            <div style="margin-top:5px;">
              <label>
                <input type="checkbox" class="remove-image-checkbox"> Remove current image
              </label>
            </div>
          </div>
        ` : ''}
        
        <div style="margin-bottom:10px;">
          <button type="button" class="new-image-btn" style="background:#f8f9fa; border:1px solid #dee2e6; padding:5px 10px; border-radius:4px;">
            <i class="fas fa-image"></i> Change image
          </button>
          <input type="file" class="edit-image-input" accept="image/*" style="display:none;">
        </div>
        
        <div class="edit-image-preview" style="display:none; margin-bottom:10px;">
          <img class="preview-img" style="max-width:100%; max-height:150px; border-radius:5px;">
          <button type="button" class="remove-preview-btn" style="display:block; margin-top:5px; background:#f8f9fa; border:1px solid #dee2e6; padding:2px 8px; border-radius:4px;">
            Remove new image
          </button>
        </div>
      </div>
      
      <div class="edit-actions">
        <button class="save-edit-btn" style="background:#142850; color:#fff; border:none; padding:6px 12px; margin-right:10px; border-radius:4px; cursor:pointer;">Save</button>
        <button class="cancel-edit-btn" style="background:#f0f0f0; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Cancel</button>
      </div>
    `;
    
    // Replace content with edit form
    contentElement.style.display = 'none';
    postElement.insertBefore(editForm, contentElement.nextSibling);
    
    // Focus the textarea
    const textarea = editForm.querySelector('.post-edit-textarea');
    textarea.focus();
    
    // Handle image upload
    let newSelectedImage = null;
    const imageInput = editForm.querySelector('.edit-image-input');
    const newImageBtn = editForm.querySelector('.new-image-btn');
    const imagePreview = editForm.querySelector('.edit-image-preview');
    const previewImg = editForm.querySelector('.preview-img');
    const removePreviewBtn = editForm.querySelector('.remove-preview-btn');
    const removeImageCheckbox = editForm.querySelector('.remove-image-checkbox');
    
    if (newImageBtn) {
      newImageBtn.addEventListener('click', () => {
        imageInput.click();
      });
    }
    
    if (imageInput) {
      imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('Image size must be less than 5MB');
            return;
          }
          
          newSelectedImage = file;
          const reader = new FileReader();
          reader.onload = (e) => {
            previewImg.src = e.target.result;
            imagePreview.style.display = 'block';
            if (removeImageCheckbox) removeImageCheckbox.checked = false;
          };
          reader.readAsDataURL(file);
        }
      });
    }
    
    if (removePreviewBtn) {
      removePreviewBtn.addEventListener('click', () => {
        newSelectedImage = null;
        imagePreview.style.display = 'none';
        imageInput.value = '';
      });
    }
    
    // Handle save button click
    editForm.querySelector('.save-edit-btn').addEventListener('click', async () => {
      const newContent = textarea.value.trim();
      const shouldRemoveOriginalImage = removeImageCheckbox && removeImageCheckbox.checked;
      
      // If no content and no image (original or new), show error
      if (!newContent && !originalImageUrl && !newSelectedImage) {
        alert('Post must have either text or an image');
        return;
      }
      
      // If removing the image and no content or new image, show error
      if (!newContent && originalImageUrl && shouldRemoveOriginalImage && !newSelectedImage) {
        alert('Post must have either text or an image');
        return;
      }
      
      try {
        // Use FormData to handle file uploads
        const formData = new FormData();
        formData.append('content', newContent);
        
        if (shouldRemoveOriginalImage) {
          formData.append('removeImage', 'true');
        }
        
        if (newSelectedImage) {
          formData.append('image', newSelectedImage);
        }
        
        const res = await fetch(`/user/community/posts/${postId}`, {
          method: 'PUT',
          body: formData // Don't set Content-Type, browser will set it with boundary for FormData
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to update post');
        }
        
        const data = await res.json();
        
        // Build updated post content HTML
        let updatedContentHTML = '';
        if (newContent) {
          updatedContentHTML += `<div class="post-text">${newContent}</div>`;
        }
        
        // Handle image in the response
        const hasNewImage = newSelectedImage !== null;
        const isRemovingImage = shouldRemoveOriginalImage && !hasNewImage;
        const imageUrl = data.image || data.imageUrl;
        
        if (!isRemovingImage && (originalImageUrl || imageUrl)) {
          // If keeping original image or have a new image
          updatedContentHTML += `<div class="post-image">
            <img src="${imageUrl || originalImageUrl}" alt="Post image" style="max-width: 100%; height: auto; border-radius: 8px; margin-top: 10px;">
          </div>`;
        }
        
        // Update the post content
        contentElement.innerHTML = updatedContentHTML;
        contentElement.style.display = '';
        editForm.remove();
        
        // Update the post in the UI to show it was edited
        const dateElement = postElement.querySelector('.date');
        if (dateElement && !dateElement.textContent.includes('(edited)')) {
          dateElement.textContent += ' (edited)';
        }
        
        // Show success message
        showToast('Post updated successfully', 'success');
        
      } catch (err) {
        console.error('Error updating post:', err);
        showToast(err.message || 'Failed to update post', 'error');
      }
    });
    
    // Handle cancel button click
    editForm.querySelector('.cancel-edit-btn').addEventListener('click', () => {
      contentElement.style.display = '';
      editForm.remove();
    });
    
  } catch (err) {
    error('Error setting up post edit:', err);
    alert('Error editing post.');
  }
}

async function deleteUserPost(postId) {
  if (!confirm('Delete this post?')) return;
  try {
    const res = await fetch(`/user/community/posts/${postId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.status === 'success') {
      const el = doc.querySelector(`.post[data-post-id="${postId}"]`);
      if (el) el.remove();
      const remaining = doc.querySelectorAll('#post-feed .post').length;
      if (remaining === 0) {
        const feed = getById('post-feed');
        if (!feed.querySelector('.placeholder')) {
          feed.innerHTML += '<div class="placeholder">No posts to display</div>';
        }
      }
    } else {
      alert(data.message || 'Failed to delete post.');
    }
  } catch (err) {
    error('Error deleting post:', err);
    alert('Error deleting post.');
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return date.toLocaleDateString('en-US', options);
}

async function getCurrentProfilePicture() {
  // if the userId is already in memory, return it directly
  if (currentPhoto) {
    return currentPhoto;
  }

  try {
    const response = await fetch('/user/me', {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userData = await response.json();
    currentPhoto = userData.profile_photo; // Store user ID in memory
    return currentPhoto;
  } catch (err) {
    error('Error fetching user ID:', err);
    return null;
  }
}

async function updateProfilePictures() {
  try {
    // Clear cache to get fresh data
    currentPhoto = null;
    const profilePhoto = await getCurrentProfilePicture();
    const defaultPhoto = '/assets/images/blank-profile.png';
    const photoSrc = profilePhoto || defaultPhoto;

    // Update create post profile picture
    const createPostProfilePic = getById('create-post-container')?.querySelector('.profile-pic');
    if (createPostProfilePic) {
      createPostProfilePic.innerHTML = `<img src="${photoSrc}" alt="Profile Picture" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" onerror="this.src='${defaultPhoto}'">`;
    }

    // Update comment input profile picture
    const commentInputProfilePic = getById('comment-modal')?.querySelector('.comment-input .profile-pic');
    if (commentInputProfilePic) {
      commentInputProfilePic.innerHTML = `<img src="${photoSrc}" alt="Profile Picture" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" onerror="this.src='${defaultPhoto}'">`;
    }
  } catch (err) {
    error('Error updating profile pictures:', err);
    // Fallback to default image
    const defaultPhoto = '/assets/images/blank-profile.png';
    const createPostProfilePic = getById('create-post-container')?.querySelector('.profile-pic');
    if (createPostProfilePic) {
      createPostProfilePic.innerHTML = `<img src="${defaultPhoto}" alt="Profile Picture" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    }
    const commentInputProfilePic = getById('comment-modal')?.querySelector('.comment-input .profile-pic');
    if (commentInputProfilePic) {
      commentInputProfilePic.innerHTML = `<img src="${defaultPhoto}" alt="Profile Picture" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    }
  }
}

async function getCurrentUserId() {
  // if the userId is already in memory, return it directly
  if (currentUserId) {
    return currentUserId;
  }

  try {
    const response = await fetch('/user/me', {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userData = await response.json();
    currentUserId = userData.id; // Store user ID in memory
    return currentUserId;
  } catch (err) {
    error('Error fetching user ID:', err);
    return null;
  }
}

function setupLikeListeners() {
  getAll('.like-action').forEach((button) => {
    button.addEventListener('click', (e) => {
      const postId = e.target.dataset.postId;
      toggleLike(postId);
    });
  });
}
function setupCommentListeners() {
  // Add a unique event listener for each comment action, ensuring no duplicates
  getAll('.comment-action').forEach((button) => {
    if (!button.hasAttribute('data-listener')) {
      // Check if the listener is already added
      button.addEventListener('click', commentListener);
      button.setAttribute('data-listener', 'true'); // Mark the listener as added
    }
  });
}

function commentListener(e) {
  const postId = e.target.dataset.postId;
  const username = e.target.closest('.post').querySelector('.name').textContent;
  const postTitle = `${username}'s post`;
  openCommentModal(postId, postTitle);
}

async function toggleLike(postId) {
  try {
    const likeButton = getById(`like-button-${postId}`);
    const likeCount = getById(`like-count-${postId}`);

    // check if the current user has already liked the post
    const isLiked = likeButton.style.color === 'rgb(0, 147, 255)';
    log(isLiked);

    let response;

    if (isLiked) {
      // if liked, send a DELETE request to remove the like
      response = await fetch(`/user/community/posts/${postId}/like`, { method: 'DELETE', withPreloader: false });
    } else {
      // otherwise, send a POST request to like the post
      response = await fetch(`/user/community/posts/${postId}/like`, { method: 'POST', withPreloader: false });
    }

    const data = await response.json();

    if (data.status === 'success') {
      const isLikedNow = data.data.likedBy.includes(currentUserId);
      log(isLikedNow);

      if (isLikedNow) {
        likeButton.style.color = '#0093ff';
      } else {
        likeButton.style.color = '';
      }

      // update the like count
      likeCount.textContent = `(${data.data.likesCount})`;
    } else if (data.status === 'error' && data.message === 'You have already liked this post') {
      // Handle case where the user tries to like a post they've already liked
      alert('You have already liked this post.');
    } else {
      alert('Failed to toggle like');
    }
  } catch (err) {
    error('Error toggling like:', err);
  }
}

// handle opening the comment modal
function openCommentModal(postId, postTitle) {
  const modal = getById('comment-modal');
  const postTitleElement = getById('post-modal-title');

  const commentsList = getById('comment-list');
  const commentTextarea = getById('comment-textarea');

  // clear the previous comments and input field
  commentsList.innerHTML = '';
  commentTextarea.value = '';

  postTitleElement.textContent = postTitle;

  fetchComments(postId);
  
  // Update profile pictures when modal opens
  updateProfilePictures();

  // show the modal
  modal.style.display = 'flex';

  // add the event listener for closing the modal
  const closeButton = getById('comment-modal').querySelector('.close-button');
  closeButton.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  const submitButton = getById('submit-comment');
  submitButton.addEventListener('click', async (e) => {
    e.stopImmediatePropagation();
    const commentContent = getById('comment-textarea').value.trim();

    if (!commentContent) {
      alert('Please write a comment.');
      return;
    }

    try {
      const submitButton = getById('submit-comment');
      submitButton.disabled = true;
      const response = await postComment(postId, commentContent);

      log(response);

      if (response.status === 'success') {
        commentTextarea.value = '';
        const commentCountElement = getById(`comment-count-${postId}`);
        if (commentCountElement) {
          commentCountElement.textContent = `(${response.data.commentCount})`;
        }
        fetchComments(postId);
      } else {
        alert('Failed to post comment. Please try again later.');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Something went wrong. Please try again later.');
    } finally {
      submitButton.disabled = false;
    }
  });
}

async function postComment(postId, content, parentComment = null) {
  const response = await fetch(`/user/community/posts/${postId}/comment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content, parentComment })
  });

  return await response.json();
}

async function fetchComments(postId) {
  try {
    // Ensure currentUserId is set before rendering comments
    await getCurrentUserId();
    
    const response = await fetch(`/user/community/posts/${postId}/comments`);
    const data = await response.json();

    if (data.status !== 'success') {
      throw new Error('Failed to fetch comments');
    }

    const comments = data.data.comments;
    const commentList = getById('comment-list');
    commentList.innerHTML = '';

    // Build comment tree structure
    const commentMap = {};
    const rootComments = [];

    comments.forEach((comment) => {
      commentMap[comment._id] = { ...comment, replies: [] };
    });

    comments.forEach((comment) => {
      if (comment.parentComment && commentMap[comment.parentComment]) {
        commentMap[comment.parentComment].replies.push(commentMap[comment._id]);
      } else {
        rootComments.push(commentMap[comment._id]);
      }
    });

    // Render comments
    rootComments.forEach((comment) => {
      renderComment(comment, commentList, postId, 0);
    });

    // Setup event listeners for comment actions
    setupCommentEventListeners(postId);
  } catch (err) {
    error('Error fetching comments:', err);
  }
}

function renderComment(comment, container, postId, depth = 0) {
  // Handle both populated and non-populated userId - ensure both are strings for comparison
  // Try multiple ways to get the user ID to handle different data structures
  let commentUserId;
  if (comment.userId && typeof comment.userId === 'object') {
    commentUserId = comment.userId._id || comment.userId.id;
  } else {
    commentUserId = comment.userId;
  }
  
  const isOwner = String(commentUserId) === String(currentUserId);
  const isLiked = comment.likedBy && comment.likedBy.includes(currentUserId);
  const maxDepth = 4; // Limit nesting depth

  const commentElement = doc.createElement('div');
  commentElement.classList.add('comment-item');
  commentElement.setAttribute('data-comment-id', comment._id);
  commentElement.style.marginLeft = `${Math.min(depth, maxDepth) * 20}px`;

  commentElement.innerHTML = `
    <div class="comment-header">
      <div class="comment-avatar">
        <img src="${comment.userId.profile_photo || '/default-avatar.png'}" alt="Profile" class="comment-profile-pic">
      </div>
      <div class="comment-meta">
        <span class="comment-author">${comment.userId.username}</span>
        <span class="comment-timestamp">${formatRelativeTime(comment.date)}</span>
        ${comment.edited ? '<span class="comment-edited">(edited)</span>' : ''}
      </div>
    </div>
    <div class="comment-content" data-comment-id="${comment._id}">
      <p class="comment-text">${comment.content}</p>
    </div>
    <div class="comment-actions">
      <button class="comment-action-btn like-comment-btn ${isLiked ? 'liked' : ''}" data-comment-id="${comment._id}">
        <i class="fas fa-thumbs-up"></i>
        <span class="like-count">${comment.likesCount || 0}</span>
      </button>
      ${depth < maxDepth ? `<button class="comment-action-btn reply-btn" data-comment-id="${comment._id}">
        <i class="fas fa-reply"></i> Reply
      </button>` : ''}
      ${isOwner ? `<button class="comment-action-btn edit-btn" data-comment-id="${comment._id}">
        <i class="fas fa-edit"></i> Edit
      </button>` : ''}
      ${isOwner ? `<button class="comment-action-btn delete-btn" data-comment-id="${comment._id}">
        <i class="fas fa-trash"></i> Delete
      </button>` : ''}
    </div>
    <div class="reply-form" id="reply-form-${comment._id}" style="display: none;">
      <textarea class="reply-textarea" placeholder="Write a reply..." maxlength="500"></textarea>
      <div class="reply-form-actions">
        <button class="reply-submit-btn" data-parent-id="${comment._id}">Reply</button>
        <button class="reply-cancel-btn" data-comment-id="${comment._id}">Cancel</button>
      </div>
    </div>
    <div class="comment-replies" id="replies-${comment._id}"></div>
  `;

  container.appendChild(commentElement);

  // Render replies
  if (comment.replies && comment.replies.length > 0) {
    const repliesContainer = commentElement.querySelector(`#replies-${comment._id}`);
    comment.replies.forEach((reply) => {
      renderComment(reply, repliesContainer, postId, depth + 1);
    });
  }
}

function setupCommentEventListeners(postId) {
  const commentList = getById('comment-list');
  
  // Remove existing listeners
  const newCommentList = commentList.cloneNode(true);
  commentList.parentNode.replaceChild(newCommentList, commentList);
  
  // Add new listeners
  newCommentList.addEventListener('click', async (e) => {
    const target = e.target.closest('button');
    if (!target) return;

    const commentId = target.getAttribute('data-comment-id') || target.getAttribute('data-parent-id');
    
    if (target.classList.contains('like-comment-btn')) {
      await handleCommentLike(postId, commentId, target);
    } else if (target.classList.contains('reply-btn')) {
      handleCommentReply(commentId);
    } else if (target.classList.contains('edit-btn')) {
      handleCommentEdit(postId, commentId);
    } else if (target.classList.contains('delete-btn')) {
      await handleCommentDelete(postId, commentId);
    } else if (target.classList.contains('reply-submit-btn')) {
      await handleReplySubmit(postId, commentId, target);
    } else if (target.classList.contains('reply-cancel-btn')) {
      handleReplyCancel(commentId);
    }
  });
}

async function handleCommentLike(postId, commentId, button) {
  try {
    const isLiked = button.classList.contains('liked');
    const method = isLiked ? 'DELETE' : 'POST';
    
    const response = await fetch(`/user/community/posts/${postId}/comment/${commentId}/like`, {
      method: method
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      button.classList.toggle('liked');
      const likeCount = button.querySelector('.like-count');
      likeCount.textContent = data.data.likesCount;
    }
  } catch (err) {
    console.error('Error toggling comment like:', err);
  }
}

function handleCommentReply(commentId) {
  // Hide all other reply forms
  document.querySelectorAll('.reply-form').forEach(form => {
    form.style.display = 'none';
  });
  
  const replyForm = getById(`reply-form-${commentId}`);
  replyForm.style.display = 'block';
  replyForm.querySelector('.reply-textarea').focus();
}

function handleCommentEdit(postId, commentId) {
  const commentContent = document.querySelector(`[data-comment-id="${commentId}"] .comment-text`);
  const originalText = commentContent.textContent;
  
  const textarea = document.createElement('textarea');
  textarea.className = 'edit-comment-textarea';
  textarea.value = originalText;
  textarea.maxLength = 500;
  
  const actions = document.createElement('div');
  actions.className = 'edit-comment-actions';
  actions.innerHTML = `
    <button class="save-edit-btn" data-comment-id="${commentId}">Save</button>
    <button class="cancel-edit-btn" data-comment-id="${commentId}">Cancel</button>
  `;
  
  commentContent.innerHTML = '';
  commentContent.appendChild(textarea);
  commentContent.appendChild(actions);
  textarea.focus();
  
  // Add event listeners for save/cancel
  actions.addEventListener('click', async (e) => {
    if (e.target.classList.contains('save-edit-btn')) {
      const newContent = textarea.value.trim();
      if (!newContent) return;
      
      try {
        const response = await fetch(`/user/community/posts/${postId}/comment/${commentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newContent })
        });
        
        const data = await response.json();
        if (data.status === 'success') {
          commentContent.innerHTML = `<p class="comment-text">${newContent} <span class="comment-edited">(edited)</span></p>`;
        }
      } catch (err) {
        console.error('Error editing comment:', err);
      }
    } else if (e.target.classList.contains('cancel-edit-btn')) {
      commentContent.innerHTML = `<p class="comment-text">${originalText}</p>`;
    }
  });
}

async function handleCommentDelete(postId, commentId) {
  if (!confirm('Delete this comment and all its replies?')) return;
  
  try {
    const response = await fetch(`/user/community/posts/${postId}/${commentId}/comment`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    if (data.status === 'success') {
      // Refresh comments
      fetchComments(postId);
      // Update comment count
      const commentCountElement = getById(`comment-count-${postId}`);
      if (commentCountElement) {
        commentCountElement.textContent = `(${data.data.commentCount})`;
      }
    }
  } catch (err) {
    console.error('Error deleting comment:', err);
  }
}

async function handleReplySubmit(postId, parentId, button) {
  const replyForm = button.closest('.reply-form');
  const textarea = replyForm.querySelector('.reply-textarea');
  const content = textarea.value.trim();
  
  if (!content) return;
  
  try {
    button.disabled = true;
    const response = await postComment(postId, content, parentId);
    
    if (response.status === 'success') {
      textarea.value = '';
      replyForm.style.display = 'none';
      fetchComments(postId);
      
      // Update comment count
      const commentCountElement = getById(`comment-count-${postId}`);
      if (commentCountElement) {
        commentCountElement.textContent = `(${response.data.commentCount})`;
      }
    }
  } catch (err) {
    console.error('Error posting reply:', err);
  } finally {
    button.disabled = false;
  }
}

function handleReplyCancel(commentId) {
  const replyForm = getById(`reply-form-${commentId}`);
  replyForm.style.display = 'none';
  replyForm.querySelector('.reply-textarea').value = '';
}

/**
 * Updates the visibility of the load more button based on if there are more posts to load
 */
function updateLoadMoreButton() {
  const loadMoreContainer = getById('load-more-container');
  const loadMoreButton = getById('load-more-button');
  
  if (!loadMoreContainer || !loadMoreButton) return;
  
  if (hasMorePosts) {
    // There are more posts to load
    loadMoreContainer.style.display = 'block';
    loadMoreButton.disabled = false;
    loadMoreButton.classList.remove('loading');
  } else {
    // No more posts to load
    loadMoreContainer.style.display = 'none';
  }
}

/**
 * Sets up the load more button with event listener
 */
function setupLoadMoreButton() {
  const loadMoreButton = getById('load-more-button');
  if (!loadMoreButton) return;
  
  loadMoreButton.addEventListener('click', async function() {
    // Prevent multiple clicks
    if (isLoading) return;
    
    // Show loading state
    loadMoreButton.disabled = true;
    loadMoreButton.classList.add('loading');
    
    // Load more posts without resetting
    await fetchPosts(true, false);
  });
}

function formatRelativeTime(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

function showToast(message, type = 'info') {
  // Remove any existing toasts
  const existingToasts = document.querySelectorAll('.toast-notification');
  existingToasts.forEach(toast => toast.remove());
  
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
    `;
    document.body.appendChild(toastContainer);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.style.cssText = `
    background-color: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    margin-bottom: 10px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    opacity: 0;
    transition: opacity 0.3s;
  `;
  toast.textContent = message;
  
  // Add to container
  toastContainer.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.opacity = '1';
  }, 10);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

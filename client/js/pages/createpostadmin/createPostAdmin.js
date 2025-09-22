import { fileTypeFromBlob } from 'file-type';
import '../../../css/components/preloader.css';
import '../../../css/components/sideNavAdmin.css';
import '../../../css/pages/viewadminpost/viewAdminPost.css';
import { startSessionChecks } from '../../../utils/sessionUtils.js';
import '../../components/sideNavAdmin.js';

startSessionChecks();

const doc = document;
const { log, error } = console;

const getById = (id) => doc.getElementById(id);
const getAll = (selector) => doc.querySelectorAll(selector);
const get = (selector) => doc.querySelector(selector);

const modal = getById('addModal');
const btn = getById('add-post');
const categorySelect = getById('category');
const eventFields = getById('event-fields');
const tournamentFields = getById('tournament-fields');
const membershipFields = getById('membership-fields');
const previewContainer = getById('imagePreviewContainer');
const cancelButton = getById('cancelModal');

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];

const input = createFileInput();
const uploadButton = getById('uploadButton');

let images = [];

uploadButton.addEventListener('click', () => input.click());
input.addEventListener('change', handleFileInputChange);

cancelButton.onclick = function () {
  closeModal();
};

function clearForm() {
  getById('heading').value = '';
  getById('details').value = '';

  categorySelect.selectedIndex = 0;
  images = [];
  previewContainer.innerHTML = '';
  hideAllFields();
}

function closeModal() {
  modal.style.display = 'none';
  clearForm();
  localStorage.removeItem('selectedCategory');
  
  // Reset modal if it was in edit mode
  if (modal.hasAttribute('data-editing')) {
    resetModalForCreate();
  }
}

btn.onclick = () => {
  modal.style.display = 'flex';
  clearForm();
  hideAllFields();
};

categorySelect.onchange = function () {
  hideAllFields();
  showFields(this.value);
  localStorage.setItem('selectedCategory', this.value);
};

window.onload = function () {
  const savedCategory = localStorage.getItem('selectedCategory');
  if (savedCategory) {
    categorySelect.value = savedCategory;
    showFields(savedCategory);
  }
};

// function to hide all fields
function hideAllFields() {
  eventFields.style.display = 'none';
  tournamentFields.style.display = 'none';
  membershipFields.style.display = 'none';
}

// function to show fields based on category
function showFields(value) {
  if (value === 'event') {
    eventFields.style.display = 'block';
  } else if (value === 'tournament') {
    tournamentFields.style.display = 'block';
  } else if (value === 'membership') {
    membershipFields.style.display = 'block';
  }
}

// function to create and return a file input element
function createFileInput() {
  const fileInput = doc.createElement('input');
  fileInput.type = 'file';
  fileInput.id = 'imageInput';
  fileInput.accept = 'image/*';
  fileInput.multiple = true;
  fileInput.style.display = 'none';
  doc.body.appendChild(fileInput);
  return fileInput;
}

async function handleFileInputChange() {
  const maxImages = 5;
  const previousImageCount = images.length;
  const totalImagesAfterUpload = previousImageCount + this.files.length;
  let hasInvalidFile = false;

  previewContainer.innerHTML = '';

  if (totalImagesAfterUpload > maxImages) {
    alert(`You can upload a maximum of ${maxImages} images. You currently have ${previousImageCount} images uploaded.`);
    return;
  }

  for (const file of Array.from(this.files)) {
    // check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      // 5MB in bytes
      hasInvalidFile = true;
      continue;
    }

    // check file type using fileTypeFromBlob
    const fileType = await fileTypeFromBlob(file);
    if (!fileType || !allowedImageTypes.includes(fileType.mime)) {
      hasInvalidFile = true; // Mark invalid file
      continue;
    }

    // if the file is valid, read it
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const id = Date.now().toString();
      images.push({ id, src: reader.result, file });
      updateImagePreviews(images, previewContainer);
    };
  }

  if (hasInvalidFile) {
    alert('Please upload valid image files (JPEG, PNG, GIF) that are less than 5MB in size.');
  }
}

function updateImagePreviews(images, container) {
  container.innerHTML = '';
  images.forEach((image) => {
    const div = doc.createElement('div');
    div.classList.add('image-preview');
    div.innerHTML = `
      <img src="${image.src}" alt="Image Preview">
      <button type="button" class="btn btn-danger btn-sm" data-id="${image.id}">
        <i class="fas fa-times"></i>
      </button>
    `;
    container.appendChild(div);
  });

  const removeButtons = container.querySelectorAll('.btn-danger');
  removeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-id');
      removeImage(id);
    });
  });
}

function removeImage(id) {
  images = images.filter((image) => image.id !== id);
  updateImagePreviews(images, previewContainer);
}

window.removeImage = function (id) {
  images = images.filter((image) => image.id !== id);
  updateImagePreviews(images, previewContainer);
};

function showPopupMenu(event, postCard, postData) {
  const popupMenu = postCard.querySelector('.popup-menu');
  const threeDotsRect = event.target.closest('.three-dots').getBoundingClientRect();

  const postId = postCard.getAttribute('data-post-id');

  popupMenu.innerHTML = `
    <ul>
      <li id="editPost" data-post-id="${postId}">Edit</li>
      <li id="deletePost" data-post-id="${postId}">Delete</li>
    </ul>
  `;

  popupMenu.style.display = 'block';
  popupMenu.style.position = 'fixed';
  const offset = 10; // Optional offset for better appearance
  popupMenu.style.left = `${threeDotsRect.right + offset}px`; // place to the right of the icon
  popupMenu.style.top = `${threeDotsRect.top}px`; // align with the top of the icon

  // event listener for the edit post action
  popupMenu.querySelector('#editPost').addEventListener('click', () => {
    openEditModal(postData, postId);
    closePopupMenu(popupMenu);
  });

  // event listener for the delete post action
  popupMenu.querySelector('#deletePost').addEventListener('click', () => {
    const postId = popupMenu.querySelector('#deletePost').getAttribute('data-post-id');
    confirmDelete(postId);
    closePopupMenu(popupMenu);
  });

  popupMenu.addEventListener('transitionend', () => {
    doc.body.classList.add('no-scroll');
  });

  // close the menu when clicking outside of it
  doc.addEventListener('click', (e) => {
    if (!postCard.contains(e.target)) {
      closePopupMenu(popupMenu);
    }
  });
}

function closePopupMenu(popupMenu) {
  if (popupMenu) {
    popupMenu.style.display = 'none';
    doc.body.classList.remove('no-scroll');
  }
}

async function submitForm() {
  const formData = new FormData();
  const heading = getById('heading').value.trim();
  const details = getById('details').value.trim();

  // check if heading is at least 5 characters long
  if (!heading || heading.length < 5) {
    alert('Please enter a heading with at least 5 characters.');
    return false; // Return false to indicate validation failed
  }

  // check if details are at least 10 characters long
  if (!details || details.length < 10) {
    alert('Please enter details with at least 10 characters.');
    return false; // Return false to indicate validation failed
  }

  // append heading and details to the formData object
  formData.append('heading', heading);
  formData.append('details', details);

  // append each image file to the FormData object
  images.forEach((image) => {
    formData.append('images', image.file);
  });

  // determine the endpoint based on the selected category
  const selectedCategory = categorySelect.value;
  log(selectedCategory);
  let endpoint = '';

  switch (selectedCategory) {
    case 'announcement':
      endpoint = '/user/admin/announcement';
      break;
    case 'event':
      endpoint = '/user/admin/event';
      formData.append('startDate', getById('start-date').value);
      formData.append('endDate', getById('end-date').value);
      formData.append('eventFee', getById('eventFee').value);
      formData.append('reservationFee', getById('reservationFee').value);
      formData.append('participantLimit', getById('participantLimit').value);
      break;
    case 'membership':
      endpoint = '/user/admin/membership';
      formData.append('reservationFee', getById('reservationFee').value);
      formData.append('membershipFee', getById('membershipFee').value);
      break;
    default:
      alert('Please select a valid category.');
      return false; // Return false to indicate validation failed
  }
  log('Endpoint: ', endpoint);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    if (response.status === 201) {
      const result = await response.json();
      log('Upload successful:', result);
      await fetchPost(currentFilter); // Use current filter when refreshing
      localStorage.removeItem('selectedCategory');
      return true; // Return true to indicate success
    } else {
      const errorResult = await response.json();
      alert(`Upload failed: ${errorResult.message}`);
      error('Upload failed:', errorResult.message);
      return false; // Return false to indicate failure
    }
  } catch (err) {
    alert('Error uploading files: ' + err.message);
    error('Error uploading files:', err);
    return false; // Return false to indicate failure
  }
}

const submitButton = getById('postNow');
// Remove any existing event listeners by cloning the element
const newSubmitButton = submitButton.cloneNode(true);
submitButton.parentNode.replaceChild(newSubmitButton, submitButton);

// Add single event listener that only closes modal on success
newSubmitButton.addEventListener('click', async (e) => {
  e.preventDefault();
  const success = await submitForm();
  if (success) {
    closeModal(); // Only close modal if submission was successful
  }
});

function displayPosts(response) {
  const box = get('.box');
  box.innerHTML = ''; // Clear existing posts

  if (!(response.status === 'success' && Array.isArray(response.data))) {
    const noPostsMessage = document.createElement('div');
    noPostsMessage.classList.add('no-posts-message');
    noPostsMessage.textContent = 'No posts yet';
    noPostsMessage.style.textAlign = 'center';
    box.appendChild(noPostsMessage);
    return;
  }

  const posts = response.data;
  if (posts.length === 0) {
    const noPostsMessage = document.createElement('div');
    noPostsMessage.classList.add('no-posts-message');
    noPostsMessage.textContent = 'No posts yet';
    noPostsMessage.style.textAlign = 'center';
    box.appendChild(noPostsMessage);
    return;
  }

  // Use Set to prevent duplicate posts
  const seenIds = new Set();
  
  posts.forEach((post) => {
    if (!post || !post._id || seenIds.has(post._id)) return;
    seenIds.add(post._id);

    const postCard = document.createElement('div');
    postCard.classList.add('post-card');

    const type = post.__t || 'Announcement';
    const isEvent = type === 'Event';
    const isMembership = type === 'Membership';
    
    postCard.setAttribute('data-post-id', post._id + (isEvent ? '-event' : isMembership ? '-membership' : ''));
    postCard.setAttribute('data-category', isEvent ? 'event' : isMembership ? 'membership' : 'announcement');

    // convert the createdAt date to Philippine time
    const createdAt = new Date(post.createdAt);
    const options = {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    const formattedDate = createdAt.toLocaleString('en-PH', options).replace(',', '');

    // constructing the images HTML
    const imagesHtml = (post.images || []).map((image) => `<img src="${image}" alt="Post Image" />`).join('');

    // Create type badge
    const typeBadge = `<span class="post-type-badge ${isEvent ? 'event' : isMembership ? 'membership' : 'announcement'}">${isEvent ? 'EVENT' : isMembership ? 'MEMBERSHIP' : 'ANNOUNCEMENT'}</span>`;

    postCard.innerHTML = `
      <i class="fas fa-ellipsis-v three-dots" id="three-dots"></i>
      <div class="popup-menu" id="popup-menu" style="display: none"></div>
      <div class="user-info">
        <img src="${
          post.court?.business_logo || '/assets/images/placeholder_50x50.png'
        }" alt="Business Logo" class="profile-pic" />
        <div class="name-and-time">
          <span class="name">${post.court?.business_name}</span>
          <span class="time">${formattedDate}</span>
        </div>
        ${typeBadge}
      </div>
      <h2>${post.heading}</h2>
      <p class="body-text">${post.details}</p>
      <div class="post-images">
        ${imagesHtml}
      </div>
    `;

    box.appendChild(postCard);
    postCard.querySelector('.three-dots').addEventListener('click', (event) => {
      event.stopPropagation();
      closeAllPopupMenus();
      showPopupMenu(event, postCard, post);
    });
  });
}
function closeAllPopupMenus() {
  const allPopupMenus = doc.querySelectorAll('.popup-menu');
  allPopupMenus.forEach((menu) => {
    menu.style.display = 'none';
  });
}

let currentFilter = 'all'; // Track current filter

async function fetchPost(filter = 'all') {
  try {
    currentFilter = filter;
    const query = filter !== 'all' ? `?type=${filter}` : '';
    const response = await fetch(`/user/admin/posts${query}`);
    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }
    const posts = await response.json();
    displayPosts(posts);
  } catch (err) {
    error('Error fetching posts:', err);
    // alert('Failed to load posts. Please try again later.');
  }
}

fetchPost();

async function deletePost(postId) {
  try {
    // check if the postId indicates it's an event by looking for '-event'
    const isEvent = postId.includes('-event');
    // extract the base ID (without the '-event' suffix if it exists)
    const basePostId = isEvent ? postId.replace('-event', '') : postId;

    // set the appropriate endpoint based on whether it's an event or an announcement
    const endpoint = isEvent ? `/user/admin/event/${basePostId}` : `/user/admin/announcement/${basePostId}`;

    const response = await fetch(endpoint, {
      method: 'DELETE'
    });

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success') {
        fetchPost();
      } else {
        error(`Failed to delete post: ${data.message}`);
      }
    } else {
      error('Error occurred while deleting the post.');
    }
  } catch (err) {
    error('Error:', err);
    error('An error occurred while trying to delete the post.');
  }
}

function confirmDelete(postId) {
  if (confirm('Are you sure you want to delete this post?')) {
    deletePost(postId);
  }
}

// Filter button functionality
const filterButtons = doc.querySelectorAll('.filter-buttons .left-buttons button:not(.plus-button)');
filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    // Remove active class from all buttons
    filterButtons.forEach((btn) => btn.classList.remove('active'));
    // Add active class to clicked button
    button.classList.add('active');
    
    // Determine filter type based on button text
    const buttonText = button.textContent.trim().toLowerCase();
    let filterType = 'all';
    
    if (buttonText.includes('announcement')) {
      filterType = 'announcement';
    } else if (buttonText.includes('events')) {
      filterType = 'event';
    }
    
    // Fetch posts with the selected filter
    fetchPost(filterType);
  });
});

// Edit modal functionality
function openEditModal(postData, postId) {
  // Open modal in edit mode
  modal.style.display = 'flex';
  
  // Pre-fill form with existing data
  getById('heading').value = postData.heading || '';
  getById('details').value = postData.details || '';
  
  // Set category based on post type
  if (postData.__t === 'Event') {
    categorySelect.value = 'event';
    showFields('event');
    // Pre-fill event fields if they exist
    if (postData.startDate) getById('start-date').value = postData.startDate.split('T')[0];
    if (postData.endDate) getById('end-date').value = postData.endDate.split('T')[0];
    if (postData.eventFee) getById('eventFee').value = postData.eventFee;
    if (postData.reservationFee) getById('reservationFee').value = postData.reservationFee;
    if (postData.participantLimit) getById('participantLimit').value = postData.participantLimit;
  } else {
    categorySelect.value = 'announcement';
    hideAllFields();
  }
  
  // Clear images array but keep existing images displayed as info
  images = [];
  previewContainer.innerHTML = '<p style="font-size: 12px; color: #666; margin-bottom: 10px;">Upload new images to replace existing ones (optional).</p>';
  
  // Mark modal as in edit mode
  modal.setAttribute('data-editing', 'true');
  modal.setAttribute('data-edit-id', postId);
  
  // Change button text and functionality
  const submitBtn = getById('postNow');
  submitBtn.textContent = 'Update Post';
  
  // Replace the submit button to avoid multiple listeners
  const newSubmitBtn = submitBtn.cloneNode(true);
  submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
  
  newSubmitBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const success = await submitEdit(postData, postId);
    if (success) {
      closeModal();
      // Reset button for next use
      resetModalForCreate();
    }
  });
}

async function submitEdit(originalPost, postId) {
  const formData = new FormData();
  const heading = getById('heading').value.trim();
  const details = getById('details').value.trim();

  // Validation
  if (!heading || heading.length < 5) {
    alert('Please enter a heading with at least 5 characters.');
    return false;
  }

  if (!details || details.length < 10) {
    alert('Please enter details with at least 10 characters.');
    return false;
  }

  formData.append('heading', heading);
  formData.append('details', details);

  // Add images if any were uploaded
  images.forEach((image) => {
    formData.append('images', image.file);
  });

  // Determine if it's an event or announcement
  const isEvent = originalPost.__t === 'Event';
  const baseId = postId.replace('-event', '').replace('-membership', '');
  
  // Add event-specific fields if editing an event
  if (isEvent) {
    formData.append('startDate', getById('start-date').value);
    formData.append('endDate', getById('end-date').value);
    formData.append('eventFee', getById('eventFee').value);
    formData.append('reservationFee', getById('reservationFee').value);
    formData.append('participantLimit', getById('participantLimit').value);
  }

  const endpoint = isEvent ? `/user/admin/event/${baseId}` : `/user/admin/announcement/${baseId}`;

  try {
    const response = await fetch(endpoint, {
      method: 'PUT',
      body: formData
    });

    if (response.ok) {
      await fetchPost(currentFilter);
      return true;
    } else {
      const errorResult = await response.json();
      alert(`Update failed: ${errorResult.message || 'Unknown error'}`);
      return false;
    }
  } catch (err) {
    alert('Error updating post: ' + err.message);
    error('Error updating post:', err);
    return false;
  }
}

function resetModalForCreate() {
  // Reset modal back to create mode
  modal.removeAttribute('data-editing');
  modal.removeAttribute('data-edit-id');
  
  // Reset button
  const submitBtn = getById('postNow');
  if (submitBtn) {
    submitBtn.textContent = 'Post Now';
    
    // Replace button to reset listeners
    const newSubmitBtn = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
    
    newSubmitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const success = await submitForm();
      if (success) {
        closeModal();
      }
    });
  }
}
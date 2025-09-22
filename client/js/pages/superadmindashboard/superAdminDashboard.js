import '../../../css/components/preloader.css';
import '../../../css/pages/superadmindashboard/superAdminDashboard.css';
import { startSessionChecks, validateSessionAndNavigate } from '../../../utils/sessionUtils.js';
import { openModal } from '../../components/modal.js';
import { setupLogoutListener } from '../../global/logout.js';

startSessionChecks();
setupLogoutListener();

const doc = document;
const { log, error } = console;

const getById = (id) => doc.getElementById(id);
const getAll = (selector) => doc.querySelectorAll(selector);
const get = (selector) => doc.querySelector(selector);

doc.addEventListener('DOMContentLoaded', () => {
  const tabs = getAll('.nav-link');
  const tabContents = getAll('.tab-content');

  const courtOwnersTableBody = get('#approvalTableBody');
  const approvedTableBody = get('#approvedTableBody');
  const deniedTableBody = get('#deniedTableBody');
  const userListTableBody = get('#userListTableBody');

  const setupMunicipalityFilters = () => {
    const filters = getAll('.filter-dropdown'); // Select all dropdowns with class 'filter-dropdown'
    filters.forEach((filter) => {
      filter.addEventListener('change', (e) => {
        const selectedMunicipality = e.target.value;
        const activeTab = Array.from(tabs).find((tab) => tab.classList.contains('active')).dataset.tab;

        if (selectedMunicipality === '') {
          // If "All Municipalities" is selected
          fetchFilteredCourtData(null, activeTab);
        } else {
          // Filter by selected municipality
          fetchFilteredCourtData(selectedMunicipality, activeTab);
        }
      });
    });
  };

  setupMunicipalityFilters();

  const fetchFilteredCourtData = async (municipality, tabId) => {
    // define the base URL and the municipality filter
    let municipalityFilter = municipality ? `&municipality=${municipality}` : '';

    switch (tabId) {
      case 'approval-page':
        fetchCourtData(`/superadmin/courts?status=pending${municipalityFilter}`, courtOwnersTableBody);
        break;
      case 'court-list':
        fetchApprovedAndDenied(`/superadmin/courts?status=approved${municipalityFilter}`, approvedTableBody, 'approve');
        fetchApprovedAndDenied(`/superadmin/courts?status=rejected${municipalityFilter}`, deniedTableBody, 'deny');
        break;
      case 'user-list':
        fetchUserData(`/superadmin/users${municipalityFilter}`, userListTableBody);
        break;
      default:
        break;
    }
  };

  const fetchDataForTab = (tabId) => {
    switch (tabId) {
      case 'approval-page':
        initializePendingTab();
        break;
      case 'court-list':
        initializeCourtListTab();
        break;
      case 'user-list':
        initializeUserListTab();
        break;
      default:
        break;
    }
  };

  // Handle tab switching
  tabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      tabs.forEach((t) => t.classList.remove('active'));
      tabContents.forEach((content) => content.classList.remove('active'));
      tab.classList.add('active');
      const target = getById(tab.dataset.tab);
      target.classList.add('active');
      fetchDataForTab(tab.dataset.tab);
    });
  });

  // handle actions (View Details, Approve, Reject)
  doc.body.addEventListener('click', (e) => {
    const activeTab = Array.from(tabs).find((tab) => tab.classList.contains('active')).dataset.tab;

    if (e.target.classList.contains('btn-view')) {
      const courtId = e.target.dataset.id;
      showViewDetailsModal(courtId);
    } else if (e.target.classList.contains('btn-approve')) {
      const courtId = e.target.dataset.id;
      openModal(
        'confirm',
        'Approve Court Owner',
        'Are you sure you want to approve?',
        () => onConfirmApprove(courtId, activeTab), // Pass courtId here
        onCancelApprove,
        'Approve',
        'Cancel'
      );
    } else if (e.target.classList.contains('btn-reject')) {
      const courtId = e.target.dataset.id;
      openModal(
        'confirm',
        'Reject Court Owner',
        'Are you sure you want to reject?',
        () => onConfirmReject(courtId, activeTab), // Pass courtId here
        onCancelReject,
        'Reject',
        'Cancel'
      );
    }
  });

  function onCancelReject() {
    log('Superadmin canceled reject.');
  }

  async function onConfirmReject(courtId, activeTab) {
    log('Superadmin confirmed reject.');
    log(`Superadmin confirmed reject in tab: ${activeTab}.`);
    await handleAction(courtId, 'reject');

    // Refresh data based on active tab using new search functions
    if (activeTab === 'court-list') {
      loadApprovedCourts();
      loadDeniedCourts();
    } else {
      loadPendingCourts();
    }
  }

  function onCancelApprove() {
    log('Superadmin canceled approve.');
  }

  async function onConfirmApprove(courtId, activeTab) {
    log('Superadmin confirmed approve.');
    log(`Superadmin confirmed approve in tab: ${activeTab}.`);
    await handleAction(courtId, 'approve');

    // Refresh data based on active tab using new search functions
    if (activeTab === 'court-list') {
      loadApprovedCourts();
      loadDeniedCourts();
    } else {
      loadPendingCourts();
    }
  }

  const showViewDetailsModal = async (courtId) => {
    // Fetch court details by courtId
    const response = await fetch(`/superadmin/court-details/${courtId}`);
    const result = await response.json();

    if (result.success) {
      const court = result.data;

      // Format address for the modal
      const formattedAddress = court.address;

      // Generate the modal content
      const modalContent = `
    <span class="close">&times;</span>
    <h2>Details</h2>

    <!-- Logo -->
    <div class="modal-logo-container">
      <img id="logoImage" src="${court.business_logo}" alt="Logo" />
    </div>

    <!-- Modal Body -->
    <div class="modal-body">
      <div class="column">
        <label>Business Name:</label>
        <input type="text" id="businessName" value="${court.business_name}" readonly />

        <label>Operating Hours:</label>
        <input type="text" id="operatingHours" value="From: ${court.operating_hours.from} To: ${
        court.operating_hours.to
      }" readonly />

        <label>Rate:</label>
        <input type="text" id="rate" value="₱${court.hourly_rate}" readonly />
      </div>

      <div class="column">
        <label>Location:</label>
        <input type="text" id="location" value="${formattedAddress}" readonly />

        <label>Total Courts:</label>
        <input type="text" id="availableCourts" value="${court.totalCourts}" readonly />
      </div>
    </div>

      <!-- Uploaded Files -->
      <div class="file-uploads">
        <label>Uploaded Files:</label>
        <div class="file-areas">
          <!-- Dynamically loop through documents -->
          ${Object.keys(court.documents)
            .map((docKey) => {
              const fileUrl = court.documents[docKey][0];
              const fileName = docKey.replace(/_/g, ' ').toUpperCase();
              const fileExtension = fileUrl.split('.').pop().toLowerCase();
              
              // Check if file is viewable in browser (PDF or image)
              const isViewable = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension);
              
              if (isViewable) {
                return `<div class="file-area clickable-file" data-url="${fileUrl}" id="${docKey}">
                  <span class="file-link">${fileName}</span>
                  <small class="file-hint">(Click to view)</small>
                </div>`;
              } else {
                return `<div class="file-area" id="${docKey}">
                  <a href="${fileUrl}" target="_blank" download>${fileName}</a>
                  <small class="file-hint">(Download only)</small>
                </div>`;
              }
            })
            .join('')}
        </div>
      </div>
    `;

      // Insert modal content into the modal container
      const modalContentContainer = get('.modal-content');
      modalContentContainer.innerHTML = modalContent;

      // Show the modal
      const viewDetailsModal = getById('viewDetailsModal');
      viewDetailsModal.style.display = 'block';

      // Add click handlers for viewable files
      const clickableFiles = modalContentContainer.querySelectorAll('.clickable-file');
      clickableFiles.forEach(fileElement => {
        fileElement.addEventListener('click', () => {
          const fileUrl = fileElement.dataset.url;
          window.open(fileUrl, '_blank');
        });
      });

      // Close the modal when the close button is clicked
      const closeModalBtn = modalContentContainer.querySelector('.close');
      closeModalBtn.addEventListener('click', () => {
        viewDetailsModal.style.display = 'none';
      });
    } else {
      console.error('Error fetching court details:', result.message);
    }
  };
  fetchDataForTab('approval-page');
});

const handleAction = async (courtId, action) => {
  try {
    const res = await fetch(`/superadmin/court/${action}/${courtId}`, { method: 'PATCH' });
    const result = await res.json();

    if (result.success === true) {
      log(`${action} action successful`);
    } else {
      error(`${action} action failed:`, result.message);
    }
  } catch (err) {
    error('Error processing action:', err);
  }
};

function fetchApprovedAndDenied(apiUrl, tableBody, type) {
  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Clear the existing table content before adding new rows
        tableBody.innerHTML = '';

        // check if data is empty
        if (data.data.length === 0) {
          // Add a row indicating no data available
          const noDataRow = document.createElement('tr');
          const noDataMessage =
            type === 'approve' ? 'No approvals found' : type === 'deny' ? 'No denials found' : 'No data available';
          noDataRow.innerHTML = `
            <td colspan="7" style="text-align: center;">${noDataMessage}</td>
          `;
          tableBody.appendChild(noDataRow);
          return;
        }

        // Populate the table with court data
        data.data.forEach(async (court, index) => {
          const row = document.createElement('tr');

          // Log the court object for debugging
          console.log(court);

          // Access the necessary data from the court object
          const courtOwnerName = `${court.user.first_name} ${court.user.middle_name} ${court.user.last_name}`;
          const formattedAddress = court.address;
          const courtEmail = court.user.email;
          const courtContact = court.user.contact_number;
          const dtiNumber = court.dti_number;
          const registrationDate = new Date(court.user.createdAt).toLocaleDateString();

          // determine action buttons based on the type
          const actionButton =
            type === 'approve'
              ? `<button class="btn btn-reject" data-id="${court._id}">Reject</button>`
              : `<button class="btn btn-approve" data-id="${court._id}">Approve</button>`;

          // Create the row HTML
          row.innerHTML = `
            <td>${index + 1}</td>
            <td>${courtOwnerName}</td>
            <td>${formattedAddress}</td>
            <td>${courtEmail}</td>
            <td>${courtContact}</td>
            <td>${dtiNumber}</td>
            <td>${registrationDate}</td>
            <td>
              <button class="btn btn-view" data-id="${court._id}">View Details</button>
              ${actionButton}
            </td>
          `;

          // append the row to the table body
          tableBody.appendChild(row);
        });
      } else {
        console.error('Failed to load court data');
      }
    })
    .catch((error) => console.error('Error fetching court data:', error));
}

function fetchCourtData(apiUrl, tableBody) {
  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Clear the existing table content before adding new rows
        tableBody.innerHTML = '';

        // Check if data is empty
        if (data.data.length === 0) {
          // Add a row indicating no data available
          const noDataRow = document.createElement('tr');
          noDataRow.innerHTML = `
            <td colspan="7" style="text-align: center;">No pending approval</td>
          `;
          tableBody.appendChild(noDataRow);
          return;
        }

        // Populate the table with court data
        data.data.forEach(async (court, index) => {
          const row = document.createElement('tr');

          // Log the court object for debugging
          console.log(court);

          // Access the necessary data from the court object
          const courtOwnerName = `${court.user.first_name} ${court.user.middle_name} ${court.user.last_name}`;
          const businessName = court.business_name;
          const formattedAddress = court.address;
          const courtEmail = court.user.email;
          const courtContact = court.user.contact_number;
          const dtiNumber = court.dti_number;
          const registrationDate = new Date(court.user.createdAt).toLocaleDateString();

          // Create the row HTML
          row.innerHTML = `
            <td>${index + 1}</td>
            <td>${courtOwnerName}</td>
            <td>${businessName}</td>
            <td>${formattedAddress}</td>
            <td>${courtEmail}</td>
            <td>${courtContact}</td>
            <td>${dtiNumber}</td>
            <td>${registrationDate}</td>
            <td>
              <button class="btn btn-view" data-id="${court._id}">View Details</button>
              <button class="btn btn-approve" data-id="${court._id}">Approve</button>
              <button class="btn btn-reject" data-id="${court._id}">Reject</button>
            </td>
          `;

          // append the row to the table body
          tableBody.appendChild(row);
        });
      } else {
        console.error('Failed to load court data');
      }
    })
    .catch((error) => console.error('Error fetching court data:', error));
}

function fetchUserData(apiUrl, tableBody) {
  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        tableBody.innerHTML = '';

        if (data.data.length === 0) {
          const noDataRow = document.createElement('tr');
          noDataRow.innerHTML = `<td colspan="9" style="text-align: center;">No data available</td>`;
          tableBody.appendChild(noDataRow);
          return;
        }

        data.data.forEach((user, index) => {
          const row = document.createElement('tr');
          // Fix user type display - show "Court Owner" instead of "admin"
          const displayRole = user.role === 'admin' ? 'Court Owner' : 
                            user.role.charAt(0).toUpperCase() + user.role.slice(1);
          
          row.innerHTML = `
              <td>${index + 1}</td>
              <td>${user.first_name} ${user.middle_name} ${user.last_name}</td>
              <td>${user.municipality}</td>
              <td>${user.contact_number}</td>
              <td>${user.email}</td>
              <td>${user.gender}</td>
              <td>${displayRole}</td>
              <td>${new Date(user.createdAt).toLocaleDateString()}</td>
              <td>
                <button class="btn btn-edit" onclick="openEditUserModal('${user.id}')">Edit</button>
                <button class="btn btn-delete" onclick="openDeleteUserModal('${user.id}', '${user.first_name} ${user.last_name}', '${user.role}')">Delete</button>
              </td>
            `;
          tableBody.appendChild(row);
        });
      } else {
        console.error('Failed to load user data');
      }
    })
    .catch((error) => console.error('Error fetching user data:', error));
}

// Enhanced user management functionality
let currentUserSearchParams = {
  search: '',
  role: '',
  gender: '',
  page: 1,
  limit: 25,
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

// Initialize enhanced user search functionality
function initializeUserSearch() {
  const searchInput = get('#userSearchInput');
  const clearSearchBtn = get('#clearSearchBtn');
  const userTypeFilter = get('#userTypeFilter');
  const userGenderFilter = get('#userGenderFilter');
  const pageSizeSelect = get('#pageSizeSelect');
  const prevPageBtn = get('#prevPageBtn');
  const nextPageBtn = get('#nextPageBtn');

  // Search input with debounce
  let searchTimeout;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentUserSearchParams.search = e.target.value;
      currentUserSearchParams.page = 1;
      loadUsers();
    }, 300);
  });

  // Clear search
  clearSearchBtn?.addEventListener('click', () => {
    searchInput.value = '';
    currentUserSearchParams.search = '';
    currentUserSearchParams.page = 1;
    loadUsers();
  });

  // Filter by user type
  userTypeFilter?.addEventListener('change', (e) => {
    currentUserSearchParams.role = e.target.value;
    currentUserSearchParams.page = 1;
    loadUsers();
  });

  // Filter by gender
  userGenderFilter?.addEventListener('change', (e) => {
    currentUserSearchParams.gender = e.target.value;
    currentUserSearchParams.page = 1;
    loadUsers();
  });

  // Page size change
  pageSizeSelect?.addEventListener('change', (e) => {
    currentUserSearchParams.limit = parseInt(e.target.value);
    currentUserSearchParams.page = 1;
    loadUsers();
  });

  // Pagination buttons
  prevPageBtn?.addEventListener('click', () => {
    if (currentUserSearchParams.page > 1) {
      currentUserSearchParams.page--;
      loadUsers();
    }
  });

  nextPageBtn?.addEventListener('click', () => {
    currentUserSearchParams.page++;
    loadUsers();
  });
}

// Load users with current search parameters
function loadUsers() {
  const params = new URLSearchParams();
  Object.keys(currentUserSearchParams).forEach(key => {
    if (currentUserSearchParams[key]) {
      params.append(key, currentUserSearchParams[key]);
    }
  });

  const apiUrl = `/superadmin/users/search?${params.toString()}`;
  
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const userListTableBody = get('#userListTableBody');
        const userCountInfo = get('#userCountInfo');
        const pageInfo = get('#pageInfo');
        const prevPageBtn = get('#prevPageBtn');
        const nextPageBtn = get('#nextPageBtn');

        // Clear table
        userListTableBody.innerHTML = '';

        if (data.data.users.length === 0) {
          const noDataRow = document.createElement('tr');
          noDataRow.innerHTML = `<td colspan="9" style="text-align: center;">No users found</td>`;
          userListTableBody.appendChild(noDataRow);
        } else {
          // Calculate starting number for pagination
          const startNumber = (data.data.pagination.currentPage - 1) * data.data.pagination.limit;
          
          data.data.users.forEach((user, index) => {
            const row = document.createElement('tr');
            const displayRole = user.role === 'admin' ? 'Court Owner' : 
                              user.role.charAt(0).toUpperCase() + user.role.slice(1);
            
            row.innerHTML = `
              <td>${startNumber + index + 1}</td>
              <td>${user.first_name} ${user.middle_name ? user.middle_name + ' ' : ''}${user.last_name}</td>
              <td>${user.municipality}</td>
              <td>${user.contact_number}</td>
              <td>${user.email}</td>
              <td>${user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}</td>
              <td>${displayRole}</td>
              <td>${new Date(user.createdAt).toLocaleDateString()}</td>
              <td>
                <button class="btn btn-edit" onclick="openEditUserModal('${user.id}')">Edit</button>
                <button class="btn btn-delete" onclick="openDeleteUserModal('${user.id}', '${user.first_name} ${user.last_name}', '${user.role}')">Delete</button>
              </td>
            `;
            userListTableBody.appendChild(row);
          });
        }

        // Update pagination info
        const { pagination } = data.data;
        userCountInfo.textContent = `Showing ${data.data.users.length} of ${pagination.totalCount} users`;
        pageInfo.textContent = `Page ${pagination.currentPage} of ${pagination.totalPages}`;
        
        // Update pagination buttons
        prevPageBtn.disabled = !pagination.hasPrevPage;
        nextPageBtn.disabled = !pagination.hasNextPage;

      } else {
        console.error('Failed to load users:', data.message);
      }
    })
    .catch(error => {
      console.error('Error loading users:', error);
    });
}

// User edit functionality - Make globally accessible
window.openEditUserModal = function(userId) {
  // Fetch user data by ID
  fetch(`/superadmin/users/${userId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const user = data.data;
        
        // Populate edit form
        get('#editUserId').value = user.id;
        get('#editFirstName').value = user.first_name;
        get('#editMiddleName').value = user.middle_name || '';
        get('#editLastName').value = user.last_name;
        get('#editEmail').value = user.email;
        get('#editUsername').value = user.username;
        get('#editContactNumber').value = user.contact_number;
        get('#editMunicipality').value = user.municipality;
        get('#editGender').value = user.gender;
        get('#editRole').value = user.role;
        get('#editDateOfBirth').value = new Date(user.date_of_birth).toISOString().split('T')[0];
        
        // Show modal
        get('#editUserModal').style.display = 'block';
      } else {
        alert('User not found');
      }
    })
    .catch(error => {
      console.error('Error fetching user data:', error);
      alert('Error loading user data');
    });
}

window.closeEditUserModal = function() {
  get('#editUserModal').style.display = 'none';
}

// User delete functionality - Make globally accessible
window.openDeleteUserModal = function(userId, userName, userRole) {
  get('#deleteConfirmMessage').textContent = `Are you sure you want to delete ${userName}?`;
  
  // Prepare warning list
  const warningList = get('#deleteWarningList');
  warningList.innerHTML = '';
  
  const warnings = [
    'User profile and account information',
    'All uploaded files associated with this user'
  ];
  
  if (userRole === 'admin') {
    warnings.push('Court registration and business information');
    warnings.push('Court images and documents');
  }
  
  warnings.push('All posts and content created by this user');
  warnings.push('All reservations made by this user');
  warnings.push('All orders and purchase history');
  
  warnings.forEach(warning => {
    const li = document.createElement('li');
    li.textContent = warning;
    warningList.appendChild(li);
  });
  
  // Store userId for deletion
  get('#confirmDeleteBtn').setAttribute('data-user-id', userId);
  get('#deleteConfirmModal').style.display = 'block';
}

window.closeDeleteConfirmModal = function() {
  get('#deleteConfirmModal').style.display = 'none';
}

// Handle edit user form submission
doc.addEventListener('DOMContentLoaded', () => {
  const editUserForm = get('#editUserForm');
  if (editUserForm) {
    editUserForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const userId = get('#editUserId').value;
      const formData = {
        first_name: get('#editFirstName').value,
        middle_name: get('#editMiddleName').value,
        last_name: get('#editLastName').value,
        email: get('#editEmail').value,
        username: get('#editUsername').value,
        contact_number: get('#editContactNumber').value,
        municipality: get('#editMunicipality').value,
        gender: get('#editGender').value,
        role: get('#editRole').value,
        date_of_birth: get('#editDateOfBirth').value
      };

      fetch(`/superadmin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('User updated successfully!');
          closeEditUserModal();
          loadUsers(); // Refresh the user list
        } else {
          alert('Error updating user: ' + (data.message || 'Unknown error'));
        }
      })
      .catch(error => {
        console.error('Error updating user:', error);
        alert('Error updating user. Please try again.');
      });
    });
  }

  // Handle delete confirmation
  const confirmDeleteBtn = get('#confirmDeleteBtn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
      const userId = confirmDeleteBtn.getAttribute('data-user-id');
      
      fetch(`/superadmin/users/${userId}`, {
        method: 'DELETE'
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert(`User deleted successfully!\n\nDeleted data:\n- Posts: ${data.deletedData.posts}\n- Reservations: ${data.deletedData.reservations}\n- Orders: ${data.deletedData.orders}\n- Court: ${data.deletedData.court ? 'Yes' : 'No'}`);
          closeDeleteConfirmModal();
          loadUsers(); // Refresh the user list
        } else {
          alert('Error deleting user: ' + (data.message || 'Unknown error'));
        }
      })
      .catch(error => {
        console.error('Error deleting user:', error);
        alert('Error deleting user. Please try again.');
      });
    });
  }

  // Modal close functionality
  getAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) {
        modal.style.display = 'none';
      }
    });
  });

  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });
});

// Initialize user search when the user-list tab is active
function initializeUserListTab() {
  initializeUserSearch();
  loadUsers();
}

// Court search and pagination functionality
let currentPendingSearchParams = {
  search: '',
  municipality: '',
  page: 1,
  limit: 25,
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

let currentApprovedSearchParams = {
  search: '',
  municipality: '',
  page: 1,
  limit: 25,
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

let currentDeniedSearchParams = {
  search: '',
  municipality: '',
  page: 1,
  limit: 25,
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

// Initialize court search functionality for pending courts
function initializePendingCourtSearch() {
  const searchInput = get('#pendingSearchInput');
  const clearSearchBtn = get('#clearPendingSearchBtn');
  const municipalityFilter = get('#pendingMunicipalityFilter');
  const pageSizeSelect = get('#pendingPageSizeSelect');
  const prevPageBtn = get('#pendingPrevPageBtn');
  const nextPageBtn = get('#pendingNextPageBtn');

  // Search input with debounce
  let searchTimeout;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentPendingSearchParams.search = e.target.value;
      currentPendingSearchParams.page = 1;
      loadPendingCourts();
    }, 300);
  });

  // Clear search
  clearSearchBtn?.addEventListener('click', () => {
    searchInput.value = '';
    currentPendingSearchParams.search = '';
    currentPendingSearchParams.page = 1;
    loadPendingCourts();
  });

  // Filter by municipality
  municipalityFilter?.addEventListener('change', (e) => {
    currentPendingSearchParams.municipality = e.target.value;
    currentPendingSearchParams.page = 1;
    loadPendingCourts();
  });

  // Page size change
  pageSizeSelect?.addEventListener('change', (e) => {
    currentPendingSearchParams.limit = parseInt(e.target.value);
    currentPendingSearchParams.page = 1;
    loadPendingCourts();
  });

  // Pagination buttons
  prevPageBtn?.addEventListener('click', () => {
    if (currentPendingSearchParams.page > 1) {
      currentPendingSearchParams.page--;
      loadPendingCourts();
    }
  });

  nextPageBtn?.addEventListener('click', () => {
    currentPendingSearchParams.page++;
    loadPendingCourts();
  });
}

// Initialize court search functionality for approved courts
function initializeApprovedCourtSearch() {
  const searchInput = get('#approvedSearchInput');
  const clearSearchBtn = get('#clearApprovedSearchBtn');
  const municipalityFilter = get('#approvedMunicipalityFilter');
  const pageSizeSelect = get('#approvedPageSizeSelect');
  const prevPageBtn = get('#approvedPrevPageBtn');
  const nextPageBtn = get('#approvedNextPageBtn');

  // Search input with debounce
  let searchTimeout;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentApprovedSearchParams.search = e.target.value;
      currentApprovedSearchParams.page = 1;
      loadApprovedCourts();
    }, 300);
  });

  // Clear search
  clearSearchBtn?.addEventListener('click', () => {
    searchInput.value = '';
    currentApprovedSearchParams.search = '';
    currentApprovedSearchParams.page = 1;
    loadApprovedCourts();
  });

  // Filter by municipality
  municipalityFilter?.addEventListener('change', (e) => {
    currentApprovedSearchParams.municipality = e.target.value;
    currentApprovedSearchParams.page = 1;
    loadApprovedCourts();
  });

  // Page size change
  pageSizeSelect?.addEventListener('change', (e) => {
    currentApprovedSearchParams.limit = parseInt(e.target.value);
    currentApprovedSearchParams.page = 1;
    loadApprovedCourts();
  });

  // Pagination buttons
  prevPageBtn?.addEventListener('click', () => {
    if (currentApprovedSearchParams.page > 1) {
      currentApprovedSearchParams.page--;
      loadApprovedCourts();
    }
  });

  nextPageBtn?.addEventListener('click', () => {
    currentApprovedSearchParams.page++;
    loadApprovedCourts();
  });
}

// Initialize court search functionality for denied courts
function initializeDeniedCourtSearch() {
  const searchInput = get('#deniedSearchInput');
  const clearSearchBtn = get('#clearDeniedSearchBtn');
  const municipalityFilter = get('#deniedMunicipalityFilter');
  const pageSizeSelect = get('#deniedPageSizeSelect');
  const prevPageBtn = get('#deniedPrevPageBtn');
  const nextPageBtn = get('#deniedNextPageBtn');

  // Search input with debounce
  let searchTimeout;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentDeniedSearchParams.search = e.target.value;
      currentDeniedSearchParams.page = 1;
      loadDeniedCourts();
    }, 300);
  });

  // Clear search
  clearSearchBtn?.addEventListener('click', () => {
    searchInput.value = '';
    currentDeniedSearchParams.search = '';
    currentDeniedSearchParams.page = 1;
    loadDeniedCourts();
  });

  // Filter by municipality
  municipalityFilter?.addEventListener('change', (e) => {
    currentDeniedSearchParams.municipality = e.target.value;
    currentDeniedSearchParams.page = 1;
    loadDeniedCourts();
  });

  // Page size change
  pageSizeSelect?.addEventListener('change', (e) => {
    currentDeniedSearchParams.limit = parseInt(e.target.value);
    currentDeniedSearchParams.page = 1;
    loadDeniedCourts();
  });

  // Pagination buttons
  prevPageBtn?.addEventListener('click', () => {
    if (currentDeniedSearchParams.page > 1) {
      currentDeniedSearchParams.page--;
      loadDeniedCourts();
    }
  });

  nextPageBtn?.addEventListener('click', () => {
    currentDeniedSearchParams.page++;
    loadDeniedCourts();
  });
}

// Load pending courts with current search parameters
function loadPendingCourts() {
  const params = new URLSearchParams();
  params.append('status', 'pending');
  Object.keys(currentPendingSearchParams).forEach(key => {
    if (currentPendingSearchParams[key]) {
      params.append(key, currentPendingSearchParams[key]);
    }
  });

  const apiUrl = `/superadmin/courts?${params.toString()}`;
  
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const tableBody = get('#approvalTableBody');
        const countInfo = get('#pendingCountInfo');
        const pageInfo = get('#pendingPageInfo');
        const prevPageBtn = get('#pendingPrevPageBtn');
        const nextPageBtn = get('#pendingNextPageBtn');

        // Clear table
        tableBody.innerHTML = '';

        if (data.data.courts.length === 0) {
          const noDataRow = document.createElement('tr');
          noDataRow.innerHTML = `<td colspan="9" style="text-align: center;">No pending courts found</td>`;
          tableBody.appendChild(noDataRow);
        } else {
          // Calculate starting number for pagination
          const startNumber = (data.data.pagination.currentPage - 1) * data.data.pagination.limit;
          
          data.data.courts.forEach((court, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${startNumber + index + 1}</td>
              <td>${court.user ? court.user.first_name + ' ' + court.user.last_name : 'N/A'}</td>
              <td>${court.business_name || 'N/A'}</td>
              <td>${court.address || 'N/A'}</td>
              <td>${court.business_email || 'N/A'}</td>
              <td>${court.contact_number || 'N/A'}</td>
              <td>${court.dti_number || 'N/A'}</td>
              <td>${new Date(court.createdAt).toLocaleDateString()}</td>
              <td>
                <button class="btn btn-view" data-id="${court._id}">View Details</button>
                <button class="btn btn-approve" data-id="${court._id}">Approve</button>
                <button class="btn btn-reject" data-id="${court._id}">Reject</button>
              </td>
            `;
            tableBody.appendChild(row);
          });
        }

        // Update pagination info
        const { pagination } = data.data;
        countInfo.textContent = `Showing ${data.data.courts.length} of ${pagination.totalCount} pending courts`;
        pageInfo.textContent = `Page ${pagination.currentPage} of ${pagination.totalPages}`;
        
        // Update pagination buttons
        prevPageBtn.disabled = !pagination.hasPrevPage;
        nextPageBtn.disabled = !pagination.hasNextPage;

      } else {
        console.error('Failed to load pending courts:', data.message);
      }
    })
    .catch(error => {
      console.error('Error loading pending courts:', error);
    });
}

// Load approved courts with current search parameters
function loadApprovedCourts() {
  const params = new URLSearchParams();
  params.append('status', 'approved');
  Object.keys(currentApprovedSearchParams).forEach(key => {
    if (currentApprovedSearchParams[key]) {
      params.append(key, currentApprovedSearchParams[key]);
    }
  });

  const apiUrl = `/superadmin/courts?${params.toString()}`;
  
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const tableBody = get('#approvedTableBody');
        const countInfo = get('#approvedCountInfo');
        const pageInfo = get('#approvedPageInfo');
        const prevPageBtn = get('#approvedPrevPageBtn');
        const nextPageBtn = get('#approvedNextPageBtn');

        // Clear table
        tableBody.innerHTML = '';

        if (data.data.courts.length === 0) {
          const noDataRow = document.createElement('tr');
          noDataRow.innerHTML = `<td colspan="8" style="text-align: center;">No approved courts found</td>`;
          tableBody.appendChild(noDataRow);
        } else {
          // Calculate starting number for pagination
          const startNumber = (data.data.pagination.currentPage - 1) * data.data.pagination.limit;
          
          data.data.courts.forEach((court, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${startNumber + index + 1}</td>
              <td>${court.user ? court.user.first_name + ' ' + court.user.last_name : 'N/A'}</td>
              <td>${court.address || 'N/A'}</td>
              <td>${court.business_email || 'N/A'}</td>
              <td>${court.contact_number || 'N/A'}</td>
              <td>${court.dti_number || 'N/A'}</td>
              <td>${new Date(court.createdAt).toLocaleDateString()}</td>
              <td>
                <button class="btn btn-view" data-id="${court._id}">View Details</button>
              </td>
            `;
            tableBody.appendChild(row);
          });
        }

        // Update pagination info
        const { pagination } = data.data;
        countInfo.textContent = `Showing ${data.data.courts.length} of ${pagination.totalCount} approved courts`;
        pageInfo.textContent = `Page ${pagination.currentPage} of ${pagination.totalPages}`;
        
        // Update pagination buttons
        prevPageBtn.disabled = !pagination.hasPrevPage;
        nextPageBtn.disabled = !pagination.hasNextPage;

      } else {
        console.error('Failed to load approved courts:', data.message);
      }
    })
    .catch(error => {
      console.error('Error loading approved courts:', error);
    });
}

// Load denied courts with current search parameters
function loadDeniedCourts() {
  const params = new URLSearchParams();
  params.append('status', 'rejected');
  Object.keys(currentDeniedSearchParams).forEach(key => {
    if (currentDeniedSearchParams[key]) {
      params.append(key, currentDeniedSearchParams[key]);
    }
  });

  const apiUrl = `/superadmin/courts?${params.toString()}`;
  
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const tableBody = get('#deniedTableBody');
        const countInfo = get('#deniedCountInfo');
        const pageInfo = get('#deniedPageInfo');
        const prevPageBtn = get('#deniedPrevPageBtn');
        const nextPageBtn = get('#deniedNextPageBtn');

        // Clear table
        tableBody.innerHTML = '';

        if (data.data.courts.length === 0) {
          const noDataRow = document.createElement('tr');
          noDataRow.innerHTML = `<td colspan="8" style="text-align: center;">No denied courts found</td>`;
          tableBody.appendChild(noDataRow);
        } else {
          // Calculate starting number for pagination
          const startNumber = (data.data.pagination.currentPage - 1) * data.data.pagination.limit;
          
          data.data.courts.forEach((court, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${startNumber + index + 1}</td>
              <td>${court.user ? court.user.first_name + ' ' + court.user.last_name : 'N/A'}</td>
              <td>${court.address || 'N/A'}</td>
              <td>${court.business_email || 'N/A'}</td>
              <td>${court.contact_number || 'N/A'}</td>
              <td>${court.dti_number || 'N/A'}</td>
              <td>${new Date(court.createdAt).toLocaleDateString()}</td>
              <td>
                <button class="btn btn-view" data-id="${court._id}">View Details</button>
              </td>
            `;
            tableBody.appendChild(row);
          });
        }

        // Update pagination info
        const { pagination } = data.data;
        countInfo.textContent = `Showing ${data.data.courts.length} of ${pagination.totalCount} denied courts`;
        pageInfo.textContent = `Page ${pagination.currentPage} of ${pagination.totalPages}`;
        
        // Update pagination buttons
        prevPageBtn.disabled = !pagination.hasPrevPage;
        nextPageBtn.disabled = !pagination.hasNextPage;

      } else {
        console.error('Failed to load denied courts:', data.message);
      }
    })
    .catch(error => {
      console.error('Error loading denied courts:', error);
    });
}

// Initialize court list tabs
function initializePendingTab() {
  initializePendingCourtSearch();
  loadPendingCourts();
}

function initializeCourtListTab() {
  initializeApprovedCourtSearch();
  initializeDeniedCourtSearch();
  loadApprovedCourts();
  loadDeniedCourts();
}

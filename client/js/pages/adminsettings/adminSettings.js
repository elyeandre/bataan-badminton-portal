import { fileTypeFromBlob } from 'file-type';
import '../../../css/components/preloader.css';
import '../../../css/components/sideNavAdmin.css';
import '../../../css/pages/adminsettings/adminSettings.css';
import { startSessionChecks } from '../../../utils/sessionUtils.js';
import '../../components/sideNavAdmin.js';

startSessionChecks();

const doc = document;
const { log, error } = console;

const getById = (id) => doc.getElementById(id);
const getAll = (selector) => doc.querySelectorAll(selector);

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
const allowedDocumentTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

let courtCounter = 1;
let facilityCounter = 1;

// Function to handle file input change for images
async function handleImageSelect(event, imageHolder) {
  const file = event.target.files[0];
  if (file) {
    const fileType = await fileTypeFromBlob(file);
    if (fileType && allowedImageTypes.includes(fileType.mime)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imageHolder.src = e.target.result;
        imageHolder.classList.remove('default');
        imageHolder.classList.add('user-uploaded');
        imageHolder.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select a valid image file (JPEG, PNG, GIF).');
      event.target.value = '';
    }
  }
}

// Function to handle business logo upload
function setupBusinessLogoUpload() {
  const logoInput = getById('businessLogo');
  const logoPreview = getById('logoPreview');

  if (logoInput && logoPreview) {
    logoInput.addEventListener('change', (event) => {
      handleImageSelect(event, logoPreview);
    });
  }
}

// Function to add more court images
function addMoreCourtImages() {
  courtCounter++;
  const courtsGrid = getById('courtsGrid');
  
  const courtWrapper = doc.createElement('div');
  courtWrapper.className = 'court-wrapper';
  courtWrapper.id = `courtWrapper${courtCounter}`;
  
  courtWrapper.innerHTML = `
    <div class="court" id="court${courtCounter}">
      <button type="button" class="remove-court-btn">×</button>
      <img src="https://cdn-icons-png.flaticon.com/512/724/724933.png" 
           alt="Upload Court" 
           id="courtImage${courtCounter}" 
           class="image-holder default" />
      <input type="file" 
             id="courtUpload${courtCounter}" 
             name="court_image[]" 
             class="court-file-input" 
             accept="image/*" />
    </div>
  `;
  
  courtsGrid.appendChild(courtWrapper);
  
  // Add event listener for the new file input
  const newFileInput = courtWrapper.querySelector('.court-file-input');
  const newImageHolder = courtWrapper.querySelector('.image-holder');
  newFileInput.addEventListener('change', (event) => {
    handleImageSelect(event, newImageHolder);
  });
}

// Function to add more facilities
function addMoreFacilities() {
  facilityCounter++;
  const facilitiesGrid = getById('facilitiesGrid');
  
  const facilityWrapper = doc.createElement('div');
  facilityWrapper.className = 'facility-wrapper';
  facilityWrapper.id = `facilityWrapper${facilityCounter}`;
  
  facilityWrapper.innerHTML = `
    <div class="facility" id="facility${facilityCounter}">
      <button type="button" class="remove-facility-btn">×</button>
      <img src="https://cdn-icons-png.flaticon.com/512/724/724933.png" 
           alt="Upload Facility" 
           id="facilityImage${facilityCounter}" 
           class="image-holder default" />
      <input type="file" 
             id="facilityUpload${facilityCounter}" 
             name="facility_image[]" 
             class="facility-file-input" 
             accept="image/*" />
    </div>
    <input type="text" name="facility_name[]" placeholder="Enter facility name" />
  `;
  
  facilitiesGrid.appendChild(facilityWrapper);
  
  // Add event listener for the new file input
  const newFileInput = facilityWrapper.querySelector('.facility-file-input');
  const newImageHolder = facilityWrapper.querySelector('.image-holder');
  newFileInput.addEventListener('change', (event) => {
    handleImageSelect(event, newImageHolder);
  });
}

// Function to handle document file input changes
async function handleDocumentSelect(event) {
  const files = event.target.files;
  
  if (files.length > 0) {
    let isValid = true;
    
    for (const file of files) {
      const fileType = await fileTypeFromBlob(file);
      
      if (!fileType || !allowedDocumentTypes.includes(fileType.mime)) {
        isValid = false;
        alert('Please upload a valid document file (PDF, DOC, DOCX).');
        break;
      }
    }
    
    if (isValid) {
      event.target.nextElementSibling.textContent = `${files.length} file(s) selected.`;
    } else {
      event.target.value = '';
      event.target.nextElementSibling.textContent = 'No file chosen';
    }
  }
}

// Function to load current court information
async function loadCurrentCourtInfo() {
  try {
    const response = await fetch('/user/me');
    const userData = await response.json();
    
    if (userData.status === 'success' && userData.user.court) {
      const courtResponse = await fetch(`/user/court/${userData.user.court}`);
      const courtData = await courtResponse.json();
      
      if (courtData.status === 'success') {
        const court = courtData.court;
        
        // Populate form fields
        if (court.business_name) getById('businessName').value = court.business_name;
        if (court.contact_number) getById('contactNumber').value = court.contact_number;
        if (court.business_email) getById('businessEmail').value = court.business_email;
        if (court.paypal_email) getById('paypalEmail').value = court.paypal_email;
        if (court.operating_hours?.from) getById('operatingHoursFrom').value = court.operating_hours.from;
        if (court.operating_hours?.to) getById('operatingHoursTo').value = court.operating_hours.to;
        if (court.hourly_rate) getById('hourlyRate').value = court.hourly_rate;
        if (court.dti_number) getById('dtiNumber').value = court.dti_number;
        if (court.description) getById('description').value = court.description;
        
        // Show business logo if available
        if (court.business_logo) {
          const logoPreview = getById('logoPreview');
          logoPreview.src = court.business_logo;
          logoPreview.classList.remove('default');
          logoPreview.classList.add('user-uploaded');
        }
      }
    }
  } catch (err) {
    error('Error loading court information:', err);
  }
}

// Function to handle form submission
async function handleFormSubmission(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  
  // Handle operating hours
  const operatingHoursFrom = getById('operatingHoursFrom').value;
  const operatingHoursTo = getById('operatingHoursTo').value;
  
  if (operatingHoursFrom && operatingHoursTo) {
    formData.append('operating_hours', JSON.stringify({
      from: operatingHoursFrom,
      to: operatingHoursTo
    }));
  }
  
  try {
    const response = await fetch('/user/admin/settings/update-court-info', {
      method: 'PUT',
      body: formData
    });
    
    const result = await response.json();
    
    if (response.ok) {
      alert('Court information updated successfully!');
      // Optionally reload the form with updated data
      loadCurrentCourtInfo();
    } else {
      if (result.errors) {
        const errorMessages = result.errors.map(error => error.message).join(', ');
        alert(`Validation errors: ${errorMessages}`);
      } else {
        alert(result.message || 'Failed to update court information. Please try again.');
      }
    }
  } catch (err) {
    error('Error updating court information:', err);
    alert('An error occurred while updating court information. Please try again later.');
  }
}

// function to handle account deletion confirmation and API request
const handleAccountDeletion = () => {
  const confirmation = window.confirm('Are you sure you want to delete your account? This action is irreversible.');
  if (confirmation) {
    fetch('/auth/delete', {
      method: 'DELETE'
    })
      .then((response) => {
        if (response.ok) {
          alert('Your account has been deleted successfully.');
          window.location.href = '/login';
        } else {
          return response.json().then((data) => {
            error(data);
            alert(`Failed to delete account: ${data.message}`);
          });
        }
      })
      .catch((err) => {
        error('Error during account deletion:', err);
        alert('An error occurred while trying to delete your account. Please try again later.');
      });
  } else {
    log('User canceled account deletion.');
  }
};

// Event delegation for dynamic elements
doc.addEventListener('click', (event) => {
  if (event.target.classList.contains('add-court-btn')) {
    addMoreCourtImages();
  }
  
  if (event.target.classList.contains('add-facility-btn')) {
    addMoreFacilities();
  }
  
  if (event.target.classList.contains('remove-court-btn')) {
    const courtWrapper = event.target.closest('.court-wrapper');
    if (getAll('.court-wrapper').length > 1) {
      courtWrapper.remove();
    }
  }
  
  if (event.target.classList.contains('remove-facility-btn')) {
    const facilityWrapper = event.target.closest('.facility-wrapper');
    facilityWrapper.remove();
  }
});

doc.addEventListener('DOMContentLoaded', () => {
  // Setup business logo upload
  setupBusinessLogoUpload();
  
  // Setup initial court image upload
  const initialCourtInput = getById('courtUpload1');
  const initialCourtImage = getById('courtImage1');
  if (initialCourtInput && initialCourtImage) {
    initialCourtInput.addEventListener('change', (event) => {
      handleImageSelect(event, initialCourtImage);
    });
  }
  
  // Setup initial facility image upload
  const initialFacilityInput = getById('facilityUpload1');
  const initialFacilityImage = getById('facilityImage1');
  if (initialFacilityInput && initialFacilityImage) {
    initialFacilityInput.addEventListener('change', (event) => {
      handleImageSelect(event, initialFacilityImage);
    });
  }
  
  // Setup document file inputs
  const documentInputs = getAll('.documents-section input[type="file"]');
  documentInputs.forEach((input) => {
    input.addEventListener('change', handleDocumentSelect);
  });
  
  // Setup form submission
  const courtOwnerForm = getById('courtOwnerForm');
  if (courtOwnerForm) {
    courtOwnerForm.addEventListener('submit', handleFormSubmission);
  }
  
  // Setup delete button
  const deleteButton = getById('deleteButton');
  if (deleteButton) {
    deleteButton.addEventListener('click', handleAccountDeletion);
  }
  
  // Load current court information
  loadCurrentCourtInfo();
});

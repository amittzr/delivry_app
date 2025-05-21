// Global variables to store current package data for update/delete
let currentCompanyId;
let currentPackageId;
let currentPackageData;
let allPackageData = {};

$(document).ready(function() {
    currentCompanyId = window.location.pathname.split('/').pop();
    document.getElementById('company-id').textContent = currentCompanyId;
    
    loadPackages();
});

function loadPackages() {
    $.ajax({
        url: `/company/${currentCompanyId}/packages`,
        method: 'GET',
        success: function(result) {
            if (result.packages && result.packages.length > 0) {
                let packagesHtml = '';
                
                // Store all package data for later use
                allPackageData = {};
                
                result.packages.forEach(packageObj => {
                    const packageId = Object.keys(packageObj)[0];
                    const packageData = packageObj[packageId];
                    
                    // Store package data
                    allPackageData[packageId] = packageData;
                    
                    // Format dates for display
                    const startDate = new Date(packageData.start_date * 1000);
                    const formattedStartDate = startDate.toLocaleString('en-IL', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    const etaDate = new Date(packageData.eta * 1000);
                    const formattedEta = etaDate.toLocaleString('en-IL', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    // Create status class for styling
                    const statusClass = `status-${packageData.status.toLowerCase().replace(' ', '-')}`;
                    
                    // Check if the package has path data
                    const hasPathData = packageData.path && packageData.path.length > 0;
                    const pathCount = hasPathData ? packageData.path.length : 0;
                    
                    packagesHtml += `
                        <div class="package" data-package-id="${packageId}">
                            <div class="package-header">
                                <span class="package-id clickable" onclick="showPackageMap('${packageId}')">Package: ${packageData.id}</span>
                                <span class="prod-id">Product ID: ${packageData.prod_id}</span>
                            </div>
                            <div>
                                <span>Customer: </span>
                                <span class="customer-id" onclick="toggleCustomerInfo('${packageId}')">${packageData.customer.id}</span>
                            </div>
                            <div class="customer-info" id="customer-${packageId}" style="display: none;">
                                <p><strong>Name:</strong> ${packageData.customer.name}</p>
                                <p><strong>Email:</strong> ${packageData.customer.email}</p>
                                <p><strong>Address:</strong> ${packageData.customer.address.street} ${packageData.customer.address.number}, ${packageData.customer.address.city}</p>
                            </div>
                            <div class="date-info">
                                <p><strong>Start Date:</strong> ${formattedStartDate}</p>
                                <p><strong>ETA:</strong> ${formattedEta}</p>
                            </div>
                            <p><strong>Status:</strong> <span class="status ${statusClass}">${packageData.status}</span></p>
                            ${hasPathData ? `<p class="path-info">Path points: ${pathCount} (Click package ID to view on map)</p>` : '<p class="path-info">No path points yet</p>'}
                            <div class="action-buttons">
                                <button class="add-location-button" onclick="openLocationModal('${packageId}')">Add Location</button>
                                <button class="update-button" onclick="openUpdateModal('${packageId}')">Update</button>
                                <button class="delete-button" onclick="openDeleteConfirmation('${packageId}')">Delete</button>
                            </div>
                        </div>
                    `;
                });
                
                $('#packages-container').html(packagesHtml);
            } else {
                $('#packages-container').html(`<div class="no-packages">No packages found for Company ${currentCompanyId}.</div>`);
            }
        },
        error: function(err) {
            console.log("Error:", err);
            $('#packages-container').html('<div class="no-packages">Error loading packages. Please try again later.</div>');
        }
    });
}

// Function to display package path on map
function showPackageMap(packageId) {
    const packageData = allPackageData[packageId];
    
    // Check if package has path data or at least a customer address with coordinates
    if (!packageData || 
        (!packageData.path && 
         (!packageData.customer || 
          !packageData.customer.address || 
          !packageData.customer.address.lat || 
          !packageData.customer.address.lon))) {
        alert('No location data available for this package');
        return;
    }
    
    // Encode package data to pass via URL
    const encodedData = encodeURIComponent(JSON.stringify(packageData));
    
    // Calculate position for centered popup
    const width = 400;  // Smaller width
    const height = 350; // Smaller height
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    
    // Open popup window with map (smaller size and centered)
    const mapWindow = window.open('/map-popup.html?data=' + encodedData, 'PackageMap', 
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`);
    
    // Focus on the new window
    if (mapWindow) {
        mapWindow.focus();
    }
}

// Add Location Modal Functions
function openLocationModal(packageId) {
    currentPackageId = packageId;
    currentPackageData = allPackageData[packageId];
    
    // Set the package ID in the hidden field
    document.getElementById('locationPackageId').value = packageId;
    
    // Clear the form
    document.getElementById('locationCity').value = '';
    document.getElementById('locationStreet').value = '';
    document.getElementById('locationStreetNumber').value = '';
    document.getElementById('locationFormMessage').innerHTML = '';
    
    // Show the modal
    document.getElementById('addLocationModal').style.display = 'block';
}

function closeLocationModal() {
    document.getElementById('addLocationModal').style.display = 'none';
}

function addLocationToPath() {
    // Get form values
    const packageId = document.getElementById('locationPackageId').value;
    const city = document.getElementById('locationCity').value.trim();
    const street = document.getElementById('locationStreet').value.trim();
    const streetNumber = document.getElementById('locationStreetNumber').value.trim();
    
    // Validate inputs
    if (!city || !street || !streetNumber) {
        document.getElementById('locationFormMessage').innerHTML = '<div class="error-message">All fields are required</div>';
        return;
    }
    
    // Show loading message
    document.getElementById('locationFormMessage').innerHTML = '<div class="info-message">Processing location...</div>';
    
    // Call the geocoding API
    $.ajax({
        url: `/geocode`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            city: city,
            street: street,
            streetNumber: streetNumber
        }),
        success: function(result) {
            if (result.error) {
                document.getElementById('locationFormMessage').innerHTML = `<div class="error-message">${result.error}</div>`;
                return;
            }
            
            // Create a new location point
            const newLocation = {
                lat: result.lat,
                lon: result.lon
            };
            
            // Get current package data
            const packageData = allPackageData[packageId];
            
            // Initialize path if it doesn't exist
            if (!packageData.path) {
                packageData.path = [];
            }
            
            // Check if this location already exists in the path
            const locationExists = packageData.path.some(point => 
                point.lat === newLocation.lat && point.lon === newLocation.lon
            );
            
            if (locationExists) {
                document.getElementById('locationFormMessage').innerHTML = '<div class="warning-message">This location already exists in the path</div>';
                return;
            }
            
            // Add the new location to the path
            packageData.path.push(newLocation);
            
            // Update the package
            $.ajax({
                url: `/company/${currentCompanyId}/package/${packageId}`,
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(packageData),
                success: function(updateResult) {
                    console.log("Package updated with new location");
                    document.getElementById('locationFormMessage').innerHTML = '<div class="success-message">Location added successfully!</div>';
                    
                    // Close the modal after a short delay
                    setTimeout(() => {
                        closeLocationModal();
                        loadPackages(); // Reload packages to show updated data
                    }, 1500);
                },
                error: function(err) {
                    console.log("Error updating package:", err);
                    document.getElementById('locationFormMessage').innerHTML = '<div class="error-message">Failed to update package with new location</div>';
                }
            });
        },
        error: function(err) {
            console.log("Geocoding error:", err);
            document.getElementById('locationFormMessage').innerHTML = '<div class="error-message">Failed to geocode address</div>';
        }
    });
}

// Toggle customer info visibility
function toggleCustomerInfo(packageId) {
    const customerInfo = document.getElementById(`customer-${packageId}`);
    if (customerInfo.style.display === 'block') {
        customerInfo.style.display = 'none';
    } else {
        customerInfo.style.display = 'block';
    }
}

// Helper function to format date for HTML inputs
function formatDateForInput(timestamp) {
    const date = new Date(timestamp * 1000);
    
    // Format date as YYYY-MM-DD for date input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    // Format time as HH:MM for time input
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    return { dateString, timeString };
}

// Helper function to convert date and time inputs to timestamp
function convertToTimestamp(dateString, timeString) {
    const combinedString = `${dateString}T${timeString}:00`;
    const date = new Date(combinedString);
    return Math.floor(date.getTime() / 1000);
}

// Update Modal Functions
function openUpdateModal(packageId) {
    currentPackageId = packageId;
    currentPackageData = allPackageData[packageId];
    
    // Store original ETA
    document.getElementById('packageId').value = packageId;
    document.getElementById('originalEta').value = currentPackageData.eta;
    
    // Format date and time for the inputs
    const { dateString, timeString } = formatDateForInput(currentPackageData.eta);
    document.getElementById('etaDate').value = dateString;
    document.getElementById('etaTime').value = timeString;
    
    // Set status
    document.getElementById('status').value = currentPackageData.status.trim().toLowerCase();
    
    // Show the modal
    document.getElementById('updateModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('updateModal').style.display = 'none';
}

function savePackageUpdate() {
    // Get form values
    const dateString = document.getElementById('etaDate').value;
    const timeString = document.getElementById('etaTime').value;
    const status = document.getElementById('status').value;
    
    // Convert date and time to timestamp
    const eta = convertToTimestamp(dateString, timeString);
    
    // Create updated package data (keep everything the same except eta and status)
    const updatedPackageData = { ...currentPackageData };
    updatedPackageData.eta = eta;
    updatedPackageData.status = status;
    
    // Send update request
    $.ajax({
        url: `/company/${currentCompanyId}/package/${currentPackageId}`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(updatedPackageData),
        success: function(result) {
            console.log("Package updated successfully");
            closeModal();
            loadPackages(); // Reload packages to show updated data
        },
        error: function(err) {
            console.log("Error updating package:", err);
            alert("Failed to update package. Please try again.");
        }
    });
}

// Delete Functions
function openDeleteConfirmation(packageId) {
    currentPackageId = packageId;
    document.getElementById('deleteConfirmation').style.display = 'block';
}

function closeDeleteConfirmation() {
    document.getElementById('deleteConfirmation').style.display = 'none';
}

function confirmDelete() {
    $.ajax({
        url: `/company/${currentCompanyId}/package/${currentPackageId}`,
        method: 'DELETE',
        success: function(result) {
            console.log("Package deleted successfully");
            closeDeleteConfirmation();
            loadPackages(); // Reload packages to show updated list
        },
        error: function(err) {
            console.log("Error deleting package:", err);
            alert("Failed to delete package. Please try again.");
            closeDeleteConfirmation();
        }
    });
}

// Close modals when clicking outside of them
window.onclick = function(event) {
    const modal = document.getElementById('updateModal');
    const locationModal = document.getElementById('addLocationModal');
    const deleteDialog = document.getElementById('deleteConfirmation');
    
    if (event.target === modal) {
        closeModal();
    }
    if (event.target === locationModal) {
        closeLocationModal();
    }
    if (event.target === deleteDialog) {
        closeDeleteConfirmation();
    }
}

// Expose functions to the global scope for the onclick attributes
window.toggleCustomerInfo = toggleCustomerInfo;
window.openUpdateModal = openUpdateModal;
window.openDeleteConfirmation = openDeleteConfirmation;
window.showPackageMap = showPackageMap;
window.openLocationModal = openLocationModal;
window.closeLocationModal = closeLocationModal;
window.addLocationToPath = addLocationToPath;
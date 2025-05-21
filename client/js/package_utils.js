// Add custom validation method for text-only fields (no numbers)
$.validator.addMethod("textOnly", function(value, element) {
    return this.optional(element) || /^[a-zA-Z\s.-]+$/.test(value);
}, "This field can only contain letters and spaces");

$(document).ready(function () {
    // Set company ID in the title
    const companyId = getCurrentCompanyId();
    document.getElementById('company-id').textContent = companyId;
    
    // Set default dates (today and today + 3 days)
    setDefaultDates();
    
    // Form validation
    setupFormValidation();
    
    // Form submission
    setupFormSubmission();
});

// Helper function to get company ID from URL
function getCurrentCompanyId() {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1];
}

// Helper function to set default dates
function setDefaultDates() {
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];
    
    const etaDate = new Date();
    etaDate.setDate(today.getDate() + 3);
    const etaFormatted = etaDate.toISOString().split('T')[0];
    
    // Set current time
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    const timeFormatted = `${hours}:${minutes}`;
    
    // Set default values
    document.getElementById('start_date').value = todayFormatted;
    document.getElementById('start_time').value = timeFormatted;
    document.getElementById('eta_date').value = etaFormatted;
    document.getElementById('eta_time').value = timeFormatted;
}

// Helper function to convert date and time inputs to timestamp
function convertToTimestamp(dateString, timeString) {
    const combinedString = `${dateString}T${timeString}:00`;
    const date = new Date(combinedString);
    return Math.floor(date.getTime() / 1000);
}

// Setup form validation
function setupFormValidation() {
    $("form[name='package_form']").validate({
        // Validation rules
        rules: {
            package_id: {
                required: true,
                minlength: 4
            },
            prod_id: {
                required: true,
                minlength: 4
            },
            customer_id: {
                required: true
            },
            customer_name: {
                required: true,
                minlength: 3
            },
            customer_email: {
                required: true,
                email: true
            },
            street: {
                required: true,
                textOnly: true
            },
            street_number: {
                required: true,
                digits: true
            },
            city: {
                required: true,
                textOnly: true
            }
        },
        // Error messages
        messages: {
            package_id: {
                required: "Package ID is required",
                minlength: "Package ID must be at least 4 characters long"
            },
            prod_id: {
                required: "Product ID is required",
                minlength: "Product ID must be at least 4 characters long"
            },
            customer_name: {
                required: "Customer name is required",
                minlength: "Customer name must be at least 3 characters long"
            },
            customer_email: {
                required: "Customer email is required",
                email: "Please enter a valid email address"
            },
            street: {
                required: "Street name is required",
                textOnly: "Street name cannot contain numbers"
            },
            street_number: {
                digits: "Please enter only digits"
            },
            city: {
                required: "City is required",
                textOnly: "City name cannot contain numbers"
            }
        },
        // Error placement
        errorElement: "div",
        errorClass: "help-block text-danger",
        highlight: function(element) {
            $(element).closest('.form-group').addClass('has-error');
        },
        unhighlight: function(element) {
            $(element).closest('.form-group').removeClass('has-error');
        },
        errorPlacement: function(error, element) {
            error.insertAfter(element);
        }
    });
}

// Setup form submission
function setupFormSubmission() {
    $('#package_form').submit(function (event) {
        // Prevent default form submission
        event.preventDefault();
        
        // Validate form
        if (!$("#package_form").valid()) return;
        
        // Get company ID
        const companyId = getCurrentCompanyId();
        
        // Get form values
        const packageId = $('#package_id').val();
        const prodId = $('#prod_id').val();
        const customerId = $('#customer_id').val();
        const customerName = $('#customer_name').val();
        const customerEmail = $('#customer_email').val();
        const street = $('#street').val();
        const streetNumber = parseInt($('#street_number').val());
        const city = $('#city').val();
        
        // Get timestamps
        const startTimestamp = convertToTimestamp(
            $('#start_date').val(),
            $('#start_time').val()
        );
        
        const etaTimestamp = convertToTimestamp(
            $('#eta_date').val(),
            $('#eta_time').val()
        );
        
        const status = $('#status').val();
        
        // Create package data object to send to server
        const packageData = {
            packageId: packageId,
            prodId: prodId,
            customerId: customerId,
            customerName: customerName,
            customerEmail: customerEmail,
            street: street,
            streetNumber: streetNumber,
            city: city,
            startDate: startTimestamp,
            eta: etaTimestamp,
            status: status
        };
        
        // Show loading state
        $('button[type="submit"]').prop('disabled', true).text('Creating...');
        
        // Send create request
        $.ajax({
            type: 'POST',
            url: `/geocode-and-create/${companyId}`,
            contentType: 'application/json',
            data: JSON.stringify(packageData),
            processData: false,
            encode: true,
            success: function(data, textStatus, jQxhr) {
                console.log("Package created successfully:", data);
                // Redirect to company packages page
                window.location.href = `/list/${companyId}`;
            },
            error: function(jqXhr, textStatus, errorThrown) {
                console.log("Error creating package:", errorThrown);
                alert("Failed to create package. Please verify the address is valid and try again.");
                $('button[type="submit"]').prop('disabled', false).text('Create Package');
            }
        });
    });
}
$(document).ready(function () {
    const id = window.location.pathname.split('/').pop();

    // הצגת שם ותיאור החברה (אם יש)
    $.getJSON(`/api/company/${id}`)
        .done(function () {
            $('#company-name').text(`Company ${id}`);
            $('#description').text('Shipments Overview');
        })
        .fail(function () {
            $('#company-name').text('Company not found');
        });

    // טעינת המשלוחים
    function loadShipments() {
        $.getJSON(`/api/companies/${id}/shipments`)
            .done(function (shipments) {
                const $container = $('#shipments-list');
                $container.empty();

                if (!shipments || shipments.length === 0) {
                    $container.html('<p>No shipments for this company.</p>');
                    return;
                }

                shipments.forEach(function (shipment) {
                    const startDate = new Date(shipment.start_date).toLocaleString();
                    const etaDate = new Date(shipment.eta).toLocaleDateString();

                    const $shipmentDiv = $(`
            <div class="shipment" style="border:1px solid #ccc; padding:10px; margin:10px 0;">
              <p><strong>Shipment ID:</strong> ${shipment.id}</p>
              <p><strong>Product ID:</strong> ${shipment.prod_id}</p>
              <p><strong>Package Name:</strong> ${shipment.description || '-'}</p>
              <p><strong>Customer ID:</strong> ${shipment.customer?.id || '-'}</p>
              <p><strong>Start Date:</strong> ${startDate}</p>
              <p><strong>Estimated Arrival:</strong> ${etaDate}</p>
              <p><strong>Status:</strong> ${shipment.status}</p>
              <button class="edit-btn" data-id="${shipment.id}">Edit</button>
            </div>
          `);
                    $container.append($shipmentDiv);
                });
            })
            .fail(function () {
                $('#shipments-list').html('<p>Error loading shipments.</p>');
            });
    }

    loadShipments();

    // -------- Modal for Editing Shipments --------
    const $modal = $('#editShipmentModal');
    const $form = $('#editShipmentForm');

    function closeModal() {
        $modal.hide();
        $form[0].reset();
    }

    $('#shipments-list').on('click', '.edit-btn', function () {
        const shipmentId = $(this).data('id');

        $.getJSON(`/api/companies/${id}/shipments`)
            .done(function (shipments) {
                const shipment = shipments.find(s => s.id === shipmentId);
                if (!shipment) {
                    alert('Shipment not found');
                    return;
                }

                $('#edit-shipment-id').val(shipment.id);
                $('#edit-status').val(shipment.status);
                $('#edit-eta').val(new Date(shipment.eta).toISOString().split('T')[0]);

                $modal.show();
            })
            .fail(() => alert("Failed to load shipment details."));
    });

    $modal.find('.close').click(closeModal);

    $(window).click(function (event) {
        if ($(event.target).is($modal)) closeModal();
    });

    $form.submit(function (e) {
        e.preventDefault();

        const shipmentId = $('#edit-shipment-id').val();
        const status = $('#edit-status').val();
        const eta = $('#edit-eta').val();

        console.log("Submitting form with values:");
        console.log("Shipment ID:", shipmentId);
        console.log("Status:", status);
        console.log("ETA:", eta);

        // const shipmentId = $('#edit-shipment-id').val();
        const data = {
            status: $('#edit-status').val(),
            eta: $('#edit-eta').val()
        };

        $.ajax({
            url: `/api/companies/${id}/shipments/${shipmentId}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function () {
                alert('Shipment updated successfully!');
                closeModal();
                loadShipments();
            },
            error: function () {
                alert('Failed to update shipment.');
            }
        });
    });

    // -------- Modal for Creating New Shipment --------

    const shipmentModal = document.getElementById("shipmentModal");
    const openModalBtn = document.getElementById("openModalBtn");
    const shipmentForm = document.getElementById("shipmentForm");

    shipmentModal.querySelectorAll('.close').forEach(span => {
        span.onclick = () => shipmentModal.style.display = "none";
    });

    openModalBtn.onclick = () => shipmentModal.style.display = "block";

    window.onclick = (event) => {
        if (event.target == shipmentModal) shipmentModal.style.display = "none";
    };

    shipmentForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(shipmentForm);
        const values = Object.fromEntries(formData.entries());

        // מבנה כתובת מלאה
        const fullAddress = `${values.street} ${values.number}, apt ${values.apt}, ${values.city}`;

        try {
            // קבלת מיקום לפי כתובת
            const locationRes = await fetch(`https://us1.locationiq.com/v1/search?key=pk.06b4c150d482c0261881ac8e96cc37dd&q=${encodeURIComponent(fullAddress)}&format=json`);
            const locationData = await locationRes.json();

            if (!Array.isArray(locationData) || locationData.length === 0) throw new Error("Address not found");

            const { lat, lon } = locationData[0];

            // בניית route לדוגמה (אפשר להרחיב אותו)
            const route = [
                { lat: "32.0853", lon: "34.7818" }, // נקודת התחלה לדוגמה (ת"א)
                { lat, lon } // כתובת הלקוח
            ];

            // בניית אובייקט הנתונים למשלוח
            const shipment = {
                id: values.id,
                prod_id: values.prod_id,
                customer_id: values.customer_id,
                customer_name: values.customer_name,
                customer_email: values.customer_email,
                address: {
                    street: values.street,
                    number: values.number,
                    apt: values.apt,
                    city: values.city,
                    lon: lon,
                    lat: lat
                },
                start_date: values.start_date,
                eta: values.eta,
                status: values.status,
                route
            };

            // שליחה לשרת
            const res = await fetch(`/api/companies/${values.company_id}/shipments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(shipment)
            });

            if (res.ok) {
                alert("The shipment was created successfully.");
                shipmentModal.style.display = "none";
                shipmentForm.reset();
                location.reload();
            } else {
                const error = await res.json();
                alert("Error: " + error.error);
            }

        } catch (err) {
            alert("Failed to create shipment: " + err.message);
        }
    });


});
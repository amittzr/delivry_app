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
        $('#edit-description').val(shipment.description);
        $('#edit-destination').val(shipment.customer?.address?.city || '');
        $('#edit-date').val(new Date(shipment.start_date).toISOString().split('T')[0]);

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
    const data = {
      description: $('#edit-description').val(),
      destination: $('#edit-destination').val(),
      date: $('#edit-date').val()
    };

    $.ajax({
      url: `/api/companies/${id}/shipments/${shipmentId}`,
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(data),
      success: function () {
        alert('Shipment updated successfully!');
        closeModal();
        location.reload();
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
    const data = Object.fromEntries(formData.entries());

    const res = await fetch(`/api/companies/${id}/shipments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
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
  });
});

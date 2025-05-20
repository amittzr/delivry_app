$(document).ready(function () {
    const id = window.location.pathname.split('/').pop();

    $.getJSON(`/api/company/${id}`)
        .done(function (data) {
            const packagesArray = data[id];
            if (!packagesArray || !Array.isArray(packagesArray)) {
                $('#company-name').text('Company not found or has no deliveries');
                $('#description').text('');
                return;
            }

            $('#company-name').text(`Company ID ${id}`);
            $('#description').text(`Total deliveries: ${packagesArray.length}`);
            $('#shipments-list').empty();

            packagesArray.forEach(pkgWrapper => {
                const packId = Object.keys(pkgWrapper)[0];
                const pack = pkgWrapper[packId];
                const customer = pack.customer;
                const address = customer.address;

                const shipmentHTML = `
        <div class="shipment" style="border:1px solid #ccc; padding:10px; margin-bottom:10px;">
          <strong>Package ID:</strong> ${pack.id}<br>
          <strong>Product ID:</strong> ${pack.prod_id}<br>
          <strong>Status:</strong> ${pack.status.trim()}<br>
          <strong>Start:</strong> ${new Date(pack.start_date * 1000).toLocaleString()}<br>
          <strong>ETA:</strong> ${new Date(pack.eta * 1000).toLocaleString()}<br>
          <strong>Customer:</strong> ${customer.name} (${customer.email})<br>
          <strong>Address:</strong> ${address.street} ${address.number}, ${address.city}<br>
          <button class="edit-btn" data-id="${pack.id}" data-desc="edit this" data-dest="${address.city}" data-date="${new Date(pack.eta * 1000).toISOString().split('T')[0]}">Edit</button>
        </div>
      `;

                $('#shipments-list').append(shipmentHTML);
            });
        })
        .fail(function () {
            $('#company-name').text('Error: company not found');
            $('#description').text('');
            $('#shipments-list').empty();
        });




});
const express = require('express');
const companyRoutes = require('./companyService');
var router = express.Router();


router.get('/companies', companyRoutes.read_companies);
router.get('/company/:id', companyRoutes.get_company_by_id);

router.post('/companies/:id/shipments', companyRoutes.create_shipment);
router.get('/companies/:id/shipments', companyRoutes.get_shipment_by_company);
router.put('/companies/:id/shipments/:shipmentId', companyRoutes.update_shipment);


// router.post('/companies', companyRoutes.create_company);
// router.put('/companies/:id', companyRoutes.update_company);
// router.delete('/companies/:id', companyRoutes.delete_company);

module.exports = router;
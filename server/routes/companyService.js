const fs = require('fs');

// הנתיב לקובץ החברות
const dataPath = './server/data/companies.json';

// פונקציית עזר לקריאה
const readFile = (callback, returnJson = false, filePath = dataPath, encoding = 'utf8') => {
    fs.readFile(filePath, encoding, (err, data) => {
        if (err) {
            console.log(err);
        }
        if (!data) data = '{}';
        callback(returnJson ? JSON.parse(data) : data);
    });
};

// פונקציית עזר לכתיבה
const writeFile = (fileData, callback, filePath = dataPath, encoding = 'utf8') => {
    fs.writeFile(filePath, fileData, encoding, (err) => {
        if (err) {
            console.log(err);
        }
        callback();
    });
};

module.exports = {
    // קריאה של כל החברות
    read_companies: function (req, res) {
        fs.readFile(dataPath, 'utf8', (err, data) => {
            if (err) {
                console.log(err);
                res.sendStatus(500);
            } else {
                res.send(!data ? {} : JSON.parse(data));
            }
        });
    },

    // קריאה של חברה לפי מזהה
    get_company_by_id: function (req, res) {
        const id = req.params.id;

        readFile(data => {
            const company = data[id];
            if (company) {
                res.send(company);
            } else {
                res.status(404).send({ error: 'Company not found' });
            }
        }, true);
    },

    // יצירת חברה חדשה
    create_company: function (req, res) {
        readFile(data => {
            if (!req.body.id) return res.sendStatus(400);
            data[req.body.id] = req.body;

            writeFile(JSON.stringify(data, null, 2), () => {
                res.status(200).send('new company added');
            });
        }, true);
    },

    // עדכון חברה
    update_company: function (req, res) {
        readFile(data => {
            const companyId = req.params["id"];
            if (data[companyId]) {
                data[companyId] = req.body;

                writeFile(JSON.stringify(data, null, 2), () => {
                    res.status(200).send(`company id:${companyId} updated`);
                });
            } else {
                res.status(404).send({ error: "Company not found" });
            }
        }, true);
    },

    // מחיקת חברה
    delete_company: function (req, res) {
        readFile(data => {
            const companyId = req.params["id"];
            if (data[companyId]) {
                delete data[companyId];

                writeFile(JSON.stringify(data, null, 2), () => {
                    res.status(200).send(`company id:${companyId} removed`);
                });
            } else {
                res.status(404).send({ error: "Company not found" });
            }
        }, true);
    },

    create_shipment: function (req, res) {
        const companyId = req.params.id;
        const shipmentData = req.body;

        readFile(data => {
            if (!data[companyId]) {
                return res.status(404).send({ error: 'Company not found' });
            }

            const newId = "PACK_" + Date.now();
            const newShipment = {
                [newId]: {
                    id: newId,
                    prod_id: shipmentData.prod_id || "UNKNOWN",
                    customer: {
                        id: "default",
                        name: "unknown",
                        email: "",
                        address: {
                            street: "",
                            number: 0,
                            city: "",
                            lon: 0,
                            lat: 0
                        }
                    },
                    start_date: Date.now(),
                    eta: Date.now() + 86400000, // ברירת מחדל: יום קדימה
                    status: "packed",
                    path: [],
                    ...shipmentData
                }
            };

            data[companyId].push(newShipment);

            writeFile(JSON.stringify(data, null, 2), () => {
                res.status(201).send({ id: newId, ...newShipment[newId] });
            });
        }, true);
    },

    get_shipment_by_company: function (req, res) {
        const id = req.params.id;

        readFile(data => {
            const shipmentsRaw = data[id];
            if (!shipmentsRaw) {
                return res.status(404).send({ error: 'Company not found' });
            }

            const shipments = [];

            shipmentsRaw.forEach(packObj => {
                const [packId, shipment] = Object.entries(packObj)[0];
                shipments.push({ ...shipment, id: packId });
            });

            res.send(shipments);
        }, true);
    },


    update_shipment: function (req, res) {
        const companyId = req.params.id;
        const shipmentId = req.params.shipmentId;
        const { description, destination, date } = req.body;

        readFile(data => {
            const shipmentsArr = data[companyId];
            if (!shipmentsArr) return res.status(404).send({ error: 'Company not found' });

            const index = shipmentsArr.findIndex(obj => obj[shipmentId]);
            if (index === -1) return res.status(404).send({ error: 'Shipment not found' });

            shipmentsArr[index][shipmentId] = {
                ...shipmentsArr[index][shipmentId],
                description,
                destination,
                date
            };

            writeFile(JSON.stringify(data, null, 2), () => {
                res.status(200).send({ message: 'Shipment updated', shipment: shipmentsArr[index][shipmentId] });
            });
        }, true);
    }



};

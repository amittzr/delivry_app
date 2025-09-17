
# Real-Time Delivery Tracking System

## Submitted by:
- Amit Tzruya - 207836404

## Project Summary
This project implements a real-time delivery tracking system using a distributed client-server architecture with RESTful API principles. The server is built with Node.js and Express, and uses MongoDB for data storage via Mongoose. The client-side is implemented with HTML, CSS, and JavaScript (jQuery + AJAX).

The system supports the following functionalities:

- **Companies** can be created and viewed (linked to Package).
- **Customers** can be created and linked to Package.
- **Packages** can be created, viewed, and updated with delivery paths.
- Delivery **locations** can be added to each package.
- Delivery **routes** are displayed on a map using Leaflet and OpenStreetMap.

## API Routes Implemented
- `POST /company` – Create a new company
- `POST /customer` – Create a new customer
- `POST /company/:id/package` – Create a new package
- `PUT /package/:id/path` – Add a location to a package
- `GET /company/:id/packages` – Get all packages of a company
- `GET /companies` – Get all companies
- `GET /customers` – Get all customers

## Technologies Used
- Node.js + Express
- MongoDB + Mongoose
- jQuery + AJAX
- Leaflet + OpenStreetMap
- LocationIQ for address geocoding
- Postman for API testing

## Running the Project
1. Make sure MongoDB is running locally.
2. Run `npm install` to install dependencies.
3. Create a `.env` file with your `GEOCODING_API_KEY`:
    ```
    GEOCODING_API_KEY=your_locationiq_api_key_here
    ```
4. Run the server:
    ```
    npm start
    ```
5. Open `http://localhost:3001/list` in your browser.


# Student Performance Dashboard

A responsive single-page application that displays student performance data from the StudentPerf API.

## Features

- **Search Functionality**: Search across student names, courses, and subjects (activates after 3+ characters)
- **Filtering**: Filter by course and subject using dropdown menus
- **Sortable Table**: Click on column headers to sort data
- **Pagination**: Navigate through pages of results with customizable page size
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

## Setup Instructions

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari)
- The StudentPerf.api backend running on https://localhost:7000

### Running the Application

There are several ways to run the application:

#### Option 1: Using a Local Web Server (Recommended)

1. Install Node.js if you don't have it already
2. Install a simple HTTP server:
   ```
   npm install -g http-server
   ```
3. Navigate to the StudentPerf.frontend directory
4. Run the server:
   ```
   http-server -p 5500
   ```
5. Open your browser and go to http://localhost:5500

#### Option 2: Using Visual Studio Code Live Server

1. Install the "Live Server" extension in Visual Studio Code
2. Open the StudentPerf.frontend folder in VS Code
3. Right-click on index.html and select "Open with Live Server"
4. The application will open in your default browser

#### Option 3: Open the HTML File Directly

You can simply open the `index.html` file in your browser, but this may have limitations with CORS when connecting to the API.

## Connecting to the API

The application is configured to connect to the StudentPerf API at https://localhost:7000. If your API is running on a different URL or port, you need to update the API_BASE_URL in js/app.js.

## Application Structure

- `index.html` - Main HTML file with the page structure
- `css/styles.css` - Custom styling and responsive design rules
- `js/app.js` - JavaScript code handling all functionality:
  - API communication
  - UI rendering
  - Event handling
  - State management

## Responsive Design

The application is designed to work on various screen sizes:

- On desktop: Full table with all columns visible
- On tablet: Limited columns visible, optimized layout
- On mobile: Minimized table with only essential columns, simplified pagination

# Pi Share (FTS)

A lightweight, web-based file sharing system optimized for Raspberry Pi Zero 2 W. Transfer files easily between devices on your local network without installing any apps.

## Features

- **Web Interface**: Clean, responsive UI accessible from any browser.
- **Drag & Drop Uploads**: Easy file uploading with progress tracking.
- **Real-time Updates**: Live progress bars, speed, and ETA calculation.
- **QR Code Access**: Connect mobile devices instantly by scanning the on-screen QR code.
- **Local Network**: Works entirely over LAN, no internet required.

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd pi-share
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

## Usage

1.  Start the server:
    ```bash
    npm start
    ```
    Or for development with auto-restart (requires nodemon):
    ```bash
    npm run dev
    ```

2.  Open your browser and navigate to:
    `http://localhost:3000`
    
    On other devices, use the IP address displayed in the terminal or scan the QR code shown on the host screen (if connected to a display).

## Project Structure

- `server.js`: Main Express server handling uploads, downloads, and Socket.io events.
- `public/`: Static frontend files (HTML, CSS, JS).
- `uploads/`: Directory where uploaded files are stored.

## License

MIT

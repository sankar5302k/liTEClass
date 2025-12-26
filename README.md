# LiteClassRoom - Low Bandwidth Audio Classroom

LiteClassRoom is a production-grade, audio-only online classroom platform designed for low-bandwidth environments. It enables peer-to-peer audio communication using WebRTC and temporary material sharing using MongoDB.


## Features

-   **Audio-Only WebRTC**: Mesh topology for direct peer-to-peer audio (low latency, high privacy).
-   **Low Bandwidth**: Optimized for unstable connections; no video tracks.
-   **Temporary Material Sharing**: Host can upload files (PDFs, Images) that are instantly shared with students and auto-deleted after the meeting.
-   **Ephemeral Rooms**: All room data and files are automatically cleaned up when the host ends the meeting or after 24 hours.
-   **Mobile Support**: Fully responsive design with HTTPS support for mobile microphone access.

## Tech Stack

-   **Framework**: Next.js 15+ (App Router)
-   **Language**: TypeScript
-   **Signaling**: Custom Socket.io Server
-   **Database**: MongoDB (Mongoose)
-   **Realtime Media**: WebRTC (Native API)
-   **Styling**: TailwindCSS

## Prerequisites

Before running the project, ensure you have:

1.  **Node.js**: v18 or higher.
2.  **MongoDB**: A running MongoDB instance (Local or Atlas).
    -   Default URI: `mongodb://127.0.0.1:27017/lite-classroom`

## Installation

1.  Clone the repository (or download source).
2.  Install dependencies:
    ```bash
    npm install
    ```

## Configuration & HTTPS Setup (Crucial for Mobile)

WebRTC requires a **Secure Context** (HTTPS) to access the microphone on devices other than `localhost`.

1.  **Generate Self-Signed Certificates**:
    Run the following command in the project root to generate `cert.pem` and `key.pem`:
    ```bash
    openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=0.0.0.0"
    ```
    *   *Note: If you don't have `openssl`, git-bash or standard Linux distros usually include it.*

2.  **Environment Variables** (Optional):
    Create a `.env` file if you need to customize ports or DB:
    ```env
    PORT=3000
    MONGODB_URI=mongodb://127.0.0.1:27017/lite-classroom
    ```

## Running the Application

1.  Start the development server:
    ```bash
    npm run dev
    ```
    *   The server will detect your `.pem` files and start in **HTTPS** mode automatically.
    *   Console output will confirm: `> Ready on https://0.0.0.0:3000`

2.  **Accessing from LAN (Mobile/Laptop)**:
    -   Find your computer's LAN IP (e.g., Run `ip addr` or `ipconfig`). Let's say it is `192.168.1.5`.
    -   Open Chrome/Safari on your mobile.
    -   Navigate to: `https://192.168.1.5:3000`
    -   **Important**: You will see a "Not Secure" warning (because the cert is self-signed).
        -   Click **Advanced** -> **Proceed to website (unsafe)**.
    -   Allow Microphone permissions when prompted.

## Architecture Highlights

-   **Custom Server (`server.ts`)**: We use a custom Node.js server to run both Next.js and Socket.io on the same port (`3000`). This simplifies deployment and strict CORS handling on local networks.
-   **Race Condition Handling**: The WebRTC hook includes a mutex/queue system (`processingQueue`) to handle signaling events sequentially, preventing `InvalidStateError` common in StrictMode or poor network conditions.
-   **Cleanup**: When the host sends `end-meeting`, the backend immediately deletes the Room and Material documents from MongoDB and forces all clients to disconnect.

## Troubleshooting

-   **"Connection Reset"**: You are probably trying to access `http://` when the server is running `https://`. Switch to `https://`.
-   **"I can't hear anything"**:
    -   Check the "Hear Myself" box in the room to test your local mic.
    -   Ensure the volume is up.
    -   Verify you are on HTTPS if using mobile.
-   **"Microphone Blocked"**: Ensure you are using HTTPS. Browsers block mic on HTTP for non-localhost addresses.

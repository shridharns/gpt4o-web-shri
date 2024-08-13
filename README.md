# GPT-4o Web Implementation

## Overview

This project is an implementation of the GPT-4o model, designed to provide a web interface for interacting with GPT-4o based multi-modal interaction. This project uses AWS Poly for its voice parts. The project leverages modern web development tools and practices, with a focus on scalability, maintainability, and user experience.

## Features

- **AI Chatbot Integration:** Allows users to interact with an AI chatbot powered by GPT-4o. They can share their screen, and bring up their video and microphone simultaneously, to interact with the AI to get the answers and feedback.
- **Responsive Design:** The web interface is optimized for both desktop and mobile devices.
- **Extensible Backend:** Built using Node.js, the backend is designed to support various extensions and integrations.

## Technology Stack

- **Frontend:** ReactJS with Material-UI for building a responsive, dynamic user interface.
- **Backend:** Node.js server handling chatbot requests and managing user sessions.
- **Deployment:** The project is designed to be easily deployed on platforms like AWS or Heroku.

## Getting Started

### Prerequisites

- Node.js installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shridharns/gpt4o-web-shri.git
   ```
2. Navigate to the project directory:
   ```bash
   cd gpt4o-web-shri
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```

### Running the Application

To start the development server, run:
```bash
npm start
```
This will launch the app on `http://localhost:3000`.

### Building for Production

To create an optimized production build, run:
```bash
npm run build
```
This will output the files to the `build` directory.

### Customization

- **React Components:** Modify components in the `src/` directory to customize the UI.
- **Backend Logic:** Modify the Node.js server logic in the `chatbot-server-node/` directory.


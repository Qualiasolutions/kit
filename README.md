# OmuMediaKit - SMMA Software

OmuMediaKit is a comprehensive Social Media Management Agency (SMMA) software that automates branding, post creation, and scheduling for businesses.

## Features

- User registration and authentication
- Business profile setup with industry and niche selection
- Automated brand color extraction from logo
- Business voice and style customization
- Target audience definition
- Location and social platform management

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB
- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **Authentication**: JWT (JSON Web Tokens)
- **Image Processing**: ColorThief for color extraction

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/omumediakit.git
   cd omumediakit
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/omumediakit
   JWT_SECRET=your_secret_key_here
   JWT_EXPIRE=30d
   ```

4. Seed the database with industry and niche data:
   ```
   npm run seed
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. Access the application at `http://localhost:5000`

## Usage

1. Register a new account
2. Complete the business profile setup
3. Use the dashboard to manage your social media content

## License

ISC 
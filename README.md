# OmuMediaKit - AI-Powered Social Media Content Creation

OmuMediaKit is a powerful tool for businesses to create, manage, and schedule social media content with AI assistance. It streamlines the content creation process and helps businesses maintain a consistent brand presence across social platforms.

## Features

- **AI-Powered Content Generation**: Automatically generate social media posts based on your business profile
- **Brand Profile Management**: Create and manage multiple business profiles
- **Template Selection**: Choose from various templates for different social media platforms
- **OpenAI Integration**: Use OpenAI API to generate professional content and images
- **Image Upload**: Upload and manage images for your posts
- **Post Scheduling**: Schedule posts for future publishing
- **Secure Authentication**: User authentication and authorization system

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Image Storage**: Cloudinary
- **AI Integration**: OpenAI API
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js (v18.x recommended)
- MongoDB database (local or Atlas)
- Cloudinary account (for image uploads)
- OpenAI API key (for AI content generation)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/Qualiasolutions/kit.git
   cd kit
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=30d
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   SEED_KEY=your_seed_key_for_database_seeding
   ```

4. Start the development server:
   ```
   npm run dev
   ```

### Deployment

The application is set up for deployment on Vercel. Connect your GitHub repository to Vercel for automatic deployments.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user

### Profiles
- `GET /api/profile` - Get all profiles for current user
- `POST /api/profile` - Create a new profile
- `GET /api/profile/:id` - Get profile by ID
- `PUT /api/profile/:id` - Update profile
- `DELETE /api/profile/:id` - Delete profile

### Branding
- `GET /api/branding/:profileId` - Get branding for a profile
- `POST /api/branding` - Create branding
- `PUT /api/branding/:id` - Update branding
- `DELETE /api/branding/:id` - Delete branding

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create a new post
- `GET /api/posts/scheduled` - Get scheduled posts
- `GET /api/posts/:id` - Get post by ID
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `PUT /api/posts/:id/status` - Update post status

### Media
- `POST /api/media/upload` - Upload an image
- `DELETE /api/media/:publicId` - Delete an image

### AI
- `POST /api/ai/generate` - Generate content using OpenAI

## Project Structure

```
/
├── public/              # Static files
│   ├── css/             # CSS files
│   ├── js/              # Frontend JavaScript
│   ├── img/             # Images
│   └── *.html           # HTML pages
├── src/                 # Backend source code
│   ├── config/          # Configuration files
│   ├── controllers/     # API controllers
│   ├── middleware/      # Middleware functions
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Service modules
│   ├── utils/           # Utility functions
│   └── server.js        # Express server setup
├── .env                 # Environment variables
├── package.json         # Project dependencies
└── vercel.json          # Vercel deployment configuration
```

## License

This project is licensed under the MIT License.

## Credits

Developed by Qualia Solutions.

## Support

For support or inquiries, contact us at info@qualiasolutions.com. 
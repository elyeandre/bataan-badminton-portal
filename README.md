# 🏸 Bataan Badminton Management Portal

[![Made With Javascript][made-with-javascript]][forthebadge-url]
[![Built With Love][built-with-love]][forthebadge-url]

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]

A comprehensive **full-stack web application** that serves as a unified platform for the badminton community in Bataan, Philippines. This capstone project seamlessly integrates court reservations, membership management, community engagement, e-commerce, and real-time communications into one powerful portal.

## 📋 Table of Contents
- [🎯 Project Overview](#-project-overview)
- [✨ Key Features](#-key-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🏗️ Architecture](#️-architecture)
- [📁 Project Structure](#-project-structure)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Configuration](#️-configuration)
- [📱 Usage Guide](#-usage-guide)
- [🔒 Security Features](#-security-features)
- [🌐 API Documentation](#-api-documentation)
- [🚀 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## 🎯 Project Overview

The **Bataan Badminton Management Portal** is a sophisticated web application designed to revolutionize how the badminton community in Bataan, Philippines, interacts with court facilities and each other. Built as a capstone project, it demonstrates enterprise-level development practices while solving real-world problems in sports facility management.

### 🎪 Live Demo
**Admin Dashboard (Portfolio Demo)**
- **URL**: http://212.69.85.122:5000/
- **Username**: `superadmin`
- **Password**: `superadmin`
- ⚠️ **Note**: Demo credentials for portfolio purposes only. Remove or change in production.

### 🎯 Target Users
- **🏃‍♂️ Players**: Book courts, join events, connect with community
- **👨‍🏫 Coaches**: Manage training sessions, organize events
- **🏢 Court Owners**: Manage facilities, track reservations, handle payments
- **👑 Administrators**: Oversee platform operations and user management

### 🌟 Problem Statement
The badminton community in Bataan lacked a centralized platform for:
- Finding and booking available courts
- Managing reservations efficiently
- Connecting players and organizing events
- Purchasing badminton equipment
- Real-time communication and updates

## ✨ Key Features

### 🏟️ **Court Management System**
- **Court Registration**: Owners can register and manage their facilities
- **Real-time Availability**: Live court slot updates via WebSocket
- **Interactive Mapping**: 2D map integration for easy court location
- **Operating Hours**: Flexible scheduling with custom time slots
- **Multi-court Support**: Handle multiple courts per facility

### 📅 **Advanced Reservation System**
- **Smart Booking**: Intelligent conflict prevention and validation
- **Real-time Updates**: Instant availability changes across all users
- **Payment Integration**: Seamless PayPal payment processing
- **Automated Cleanup**: Cron jobs for expired and cancelled reservations
- **Reservation History**: Complete booking timeline and status tracking

### 👥 **User Management & Authentication**
- **Multi-role System**: Player, Coach, Court Owner, Superadmin roles
- **JWT Security**: Secure token-based authentication
- **OTP Verification**: Email-based two-factor authentication
- **Profile Management**: Comprehensive user profiles with file uploads
- **Password Security**: Advanced password policies and reset flows

### 🏆 **Community Features**
- **Social Feed**: Community posts with hashtag support
- **Interactive Engagement**: Comments, likes, and real-time interactions
- **Events & Tournaments**: Organize and participate in badminton events
- **Announcements**: Broadcast important updates to community
- **Member Directory**: Connect with other badminton enthusiasts

### 🛒 **E-commerce Integration**
- **Product Catalog**: Badminton equipment and accessories
- **Shopping Cart**: Full-featured cart with session persistence
- **Order Management**: Complete order lifecycle tracking
- **PayPal Integration**: Secure payment processing with webhooks
- **Inventory Tracking**: Real-time stock management

### 📧 **Communication System**
- **Email Notifications**: Automated emails for all major events
- **Real-time Alerts**: Instant in-app notifications via Socket.IO
- **OTP Management**: Secure one-time password system
- **Transactional Emails**: Order confirmations, reservation updates
- **Broadcast Messaging**: System-wide announcements

### 🗺️ **Location Services**
- **Court Locator**: Interactive map with facility markers
- **Address Geocoding**: Automatic coordinate generation
- **Directions Integration**: Easy navigation to court locations

## 🏗️ Architecture

### **System Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Side   │    │   Server Side   │    │   External      │
│                 │    │                 │    │   Services      │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │    EJS      │ │    │ │  Express.js │ │    │ │   MongoDB   │ │
│ │  Templates  │ │    │ │   Server    │ │    │ │   Database  │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │  JavaScript │◄├────┤►│  Socket.IO  │ │    │ │ Cloudflare  │ │
│ │   Modules   │ │    │ │  WebSocket  │ │    │ │     R2      │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   Webpack   │ │    │ │   REST API  │ │    │ │   PayPal    │ │
│ │   Bundler   │ │    │ │  Endpoints  │ │    │ │   Gateway   │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Real-Time Communication (Socket.IO)**
| Event Type          | Direction    | Purpose                           |
|-------------------- |------------- |---------------------------------- |
| `reservation:update`| Server→Client| Court availability changes       |
| `post:new`          | Server→Client| New community posts              |
| `comment:new`       | Server→Client| New comments on posts            |
| `payment:status`    | Server→Client| PayPal transaction updates       |
| `notification:new`  | Server→Client| System notifications             |
| `user:connect`      | Client→Server| User authentication for socket   |
| `user:disconnect`   | Client→Server| Clean up user socket connections |

### **Database Schema Overview**
```
Users ←→ Courts (1:Many - Court Ownership)
Users ←→ Reservations (1:Many - User Bookings)
Courts ←→ Reservations (1:Many - Court Bookings)
Users ←→ Posts (1:Many - User Posts)
Posts ←→ Comments (1:Many - Post Comments)
Users ←→ Orders (1:Many - User Purchases)
Products ←→ Orders (Many:Many - Order Items)
Users ←→ Notifications (1:Many - User Alerts)
```

## 🛠️ Tech Stack

### **Backend Technologies**
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.21.0
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + OTP via email
- **Real-time**: Socket.IO for WebSocket connections
- **File Storage**: Cloudflare R2 (S3-compatible)
- **Payments**: PayPal REST SDK with webhooks
- **Email**: Nodemailer (Gmail App Password integration)
- **Security**: Helmet.js, CORS, Rate Limiting

### **Frontend Technologies**
- **Template Engine**: EJS (Embedded JavaScript)
- **Build Tool**: Webpack 5 with custom configuration
- **Styling**: Modern CSS with responsive design
- **JavaScript**: ES6+ with modular architecture
- **Maps**: Leaflet.js for interactive mapping
- **Icons**: Font Awesome for UI elements

### **Development Tools**
- **Process Manager**: Nodemon for development
- **Code Quality**: ESLint and Prettier (configured)
- **Build Optimization**: Terser, CSS Minimizer
- **File Management**: Webpack plugins for asset handling
- **Environment**: dotenv for configuration management

### **Infrastructure & DevOps**
- **Hosting**: Evennode (Node.js hosting platform)
- **Database**: MongoDB Atlas (cloud database)
- **CDN**: Cloudflare R2 for static assets
- **Email Service**: Gmail (App Password based)
- **Monitoring**: Morgan for HTTP request logging
- **Process Management**: PM2-ready with graceful shutdown

## 📁 Project Structure

```
bataan-badminton-portal/
├── 📁 build/                          # Webpack build output
│   ├── *.html                         # Generated HTML pages
│   ├── *.js                          # Bundled JavaScript files
│   └── *.css                         # Compiled CSS files
├── 📁 certs/                          # SSL certificates
├── 📁 client/                         # Frontend source code
│   ├── 📁 css/                        # Stylesheets
│   │   ├── components/                # Component-specific styles
│   │   └── pages/                     # Page-specific styles
│   ├── 📁 html/                       # Static HTML files
│   ├── 📁 js/                         # Frontend JavaScript
│   │   ├── components/                # Reusable UI components
│   │   ├── pages/                     # Page-specific scripts
│   │   └── utils/                     # Frontend utilities
│   ├── 📁 utils/                      # Client-side utilities
│   └── 📁 views/                      # EJS templates
│       ├── template.ejs               # Base template
│       ├── error.ejs                  # Error page template
│       └── 📁 partials/               # Reusable template parts
├── 📁 config/                         # Configuration files
│   ├── checkEnvVars.js               # Environment validation
│   ├── commonConfig.js               # Shared configuration
│   ├── db.js                         # Database connection
│   ├── development.js                # Development settings
│   └── production.js                 # Production settings
├── 📁 public/                         # Static assets
├── 📁 scripts/                        # Build and utility scripts
├── 📁 src/                            # Backend source code
│   ├── 📁 controllers/                # Request handlers
│   │   ├── authController.js          # Authentication logic
│   │   └── userController.js          # User management
│   ├── 📁 middleware/                 # Express middleware
│   │   ├── authJwt.js                # JWT validation
│   │   ├── rateLimiter.js            # Rate limiting
│   │   └── roleChecker.js            # Role-based access
│   ├── 📁 models/                     # Mongoose schemas
│   │   ├── User.js                   # User model
│   │   ├── Court.js                  # Court model
│   │   ├── Reservation.js            # Reservation model
│   │   ├── Post.js                   # Community post model
│   │   ├── Product.js                # E-commerce product model
│   │   └── ...                       # Other models
│   ├── 📁 routes/                     # API route definitions
│   │   ├── authRoutes.js             # Authentication endpoints
│   │   ├── userRoutes.js             # User-related endpoints
│   │   ├── indexRoutes.js            # Public endpoints
│   │   └── superadminRoutes.js       # Admin endpoints
│   ├── 📁 services/                   # Business logic services
│   │   ├── emailService.js           # Email notifications
│   │   ├── paypalService.js          # Payment processing
│   │   └── r2Service.js              # File storage
│   ├── 📁 utils/                      # Utility functions
│   │   ├── generateToken.js          # JWT token generation
│   │   ├── fileUpload.js             # File handling
│   │   ├── courtAvailability.js      # Booking logic
│   │   ├── reservationCleanup.js     # Cron job handlers
│   │   └── ...                       # Other utilities
│   └── 📁 validation/                 # Input validation schemas
├── 📄 server.js                       # Application entry point
├── 📄 package.json                    # Project dependencies
├── 📄 webpack.config.js               # Webpack configuration
├── 📄 nodemon.json                    # Nodemon settings
├── 📄 vercel.json                     # Vercel deployment config
└── 📄 README.md                       # Project documentation
```

### **Key Directories Explained**

- **`/src`**: Backend application code following MVC pattern
- **`/client`**: Frontend assets and templates (EJS-based)
- **`/config`**: Environment-specific configuration files
- **`/build`**: Webpack-generated production assets
- **`/public`**: Static files served directly by Express

## ⚙️ Configuration

### **Environment Variables (.env)**

The backend validates required variables at startup via `config/checkEnvVars.js`. All of the following are **required** for the app to boot (use placeholder values for features you are not yet using):

#### **Required Core / Infrastructure**
```env
# Server
PORT=3000
HOST_DEV=127.0.0.1
HOST_PROD=0.0.0.0
NODE_ENV=development            # development | production
DISABLE_SECURITY=false          # set to true ONLY for local relaxed security

# Frontend origin (used in email links, redirects)
FRONTEND_URL=http://localhost:3000

# JWT / Auth
JWT_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret

# File limits
MAX_FILE_SIZE=10485760          # 10MB (used in config for express-fileupload)
```

#### **Database (MongoDB)**
```env
DB_URI=mongodb://localhost:27017/bataan-badminton-portal
DB_USERNAME=                      # (optional if not required locally)
DB_PASSWORD=                      # (optional if not required locally)
```

For Atlas example:
```env
DB_URI=mongodb+srv://cluster-host/dbname?retryWrites=true&w=majority
DB_USERNAME=atlasUser
DB_PASSWORD=strongPasswordHere
```

#### **Gmail (App Password Based)**
This project uses Nodemailer with Gmail's built-in service shortcut. Only two env vars are required:

```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_16_char_app_password   # Generated from Google App Passwords
```

App Password creation: enable 2FA → App Passwords → Select "Mail" + device → copy 16‑char password.
No host/port variables are needed (do not add SMTP_* variables).

#### **PayPal Integration**
```env
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_SECRET_KEY=your_paypal_client_secret
PAYPAL_WEBHOOK_ID=your_webhook_id_for_signature_verification
```

#### **Cloudflare R2 (Custom Worker Gateway)**
```env
R2_AUTH_KEY=your_custom_auth_key
R2_UPLOAD_URL=https://r2-api.example.workers.dev
```

#### **Optional (Tokens Expiry Override)**
These are not validated by `checkEnvVars.js` but you can document them if you implement dynamic expiry config.
```env
# Not currently enforced by startup script, but used in logic if referenced
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

#### **PayPal Integration**
```env
# PayPal API Credentials
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_WEBHOOK_ID=your_webhook_id_for_signature_verification

# PayPal Environment (sandbox/live)
PAYPAL_MODE=sandbox
```

#### **Cloudflare R2 Storage**
```env
# R2 Storage Configuration
R2_AUTH_KEY=ely
R2_UPLOAD_URL=https://r2-api.mayor.workers.dev
```

#### **File Upload Settings**
```env
# File Upload Limits (in bytes)
MAX_FILE_SIZE=10485760  # 10MB
```


### **Configuration Files**

The application uses a hierarchical configuration system:

- **`config/commonConfig.js`**: Shared settings across environments
- **`config/development.js`**: Development-specific overrides
- **`config/production.js`**: Production-specific settings
- **`config/checkEnvVars.js`**: Validates required environment variables

### **Development vs Production**

#### **Development Settings**
- Detailed error messages
- No SSL certificate validation
- PayPal sandbox mode
- Reduced security measures for easier debugging

#### **Production Settings**
- Error messages hidden from users
- SSL certificate validation enforced
- PayPal live mode
- Enhanced security features enabled
- Compression and caching optimized

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ and npm
- MongoDB (local or MongoDB Atlas)
- Git for version control

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/elyeandre/bataan-badminton-portal.git
   cd bataan-badminton-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your configurations
   # See Configuration section below for details
   ```

4. **Build the application**
   ```bash
   npm run build
   ```

5. **Start the development server**
   ```bash
   npm run devStart
   ```

6. **Create superadmin account (optional)**
   ```bash
   npm run create-superadmin
   ```

### **Available Scripts**

| Script | Description |
|--------|-------------|
| `npm start` | Build and start production server |
| `npm run dev` | Start webpack dev server |
| `npm run devStart` | Start server with nodemon (development) |
| `npm run build` | Build production assets |
| `npm run watch` | Watch for changes and rebuild |
| `npm run clean-build` | Clean build directory before building |
| `npm run deploy` | Deploy to Evennode hosting |
| `npm run create-superadmin` | Create superadmin account |

### **Development Workflow**

1. **Start development environment**
   ```bash
   npm run devStart
   ```

2. **Access the application**
   - Frontend: `http://localhost:3000`
   - Auth endpoints: `http://localhost:3000/auth/*`
   - User endpoints: `http://localhost:3000/user/*`
   - Superadmin endpoints: `http://localhost:3000/superadmin/*`

## 📱 Usage Guide

### **User Registration & Authentication**

1. **Account Creation**
   - Navigate to `/signup`
   - Fill in personal information (name, email, username)
   - Choose role: Player, Coach, or Court Owner
   - Submit registration form
   - Check email for OTP verification code
   - Enter OTP to activate account

2. **Login Process**
   - Visit `/signin`
   - Enter username/email and password
   - Select appropriate role
   - System generates JWT token for session management

3. **Password Reset**
   - Click "Forgot Password" on login page
   - Enter email address
   - Check email for reset link with OTP
   - Follow link and enter new password

### **Court Management (Court Owners)**

1. **Register Your Court**
   - Complete court owner verification
   - Fill in business details (name, contact, hours)
   - Upload court images and documents
   - Set pricing and availability

2. **Manage Reservations**
   - View incoming booking requests
   - Approve or decline reservations
   - Set special rates for events
   - Track payment status

3. **Post Announcements**
   - Create court-specific announcements
   - Schedule maintenance windows
   - Promote special events

### **Making Reservations (Players/Coaches)**

1. **Find Courts**
   - Browse available courts on map
   - Filter by location, price, amenities
   - View court details and images
   - Check real-time availability

2. **Book a Court**
   - Select desired date and time slot
   - Choose number of courts needed
   - Review booking details and pricing
   - Proceed to PayPal payment
   - Receive confirmation email

3. **Manage Bookings**
   - View upcoming reservations
   - Cancel bookings (subject to policy)
   - Track payment status
   - Download booking receipts

### **Community Features**

1. **Social Feed**
   - Create posts with text and images
   - Use hashtags to categorize content
   - Like and comment on posts
   - Follow trending hashtags

2. **Events & Tournaments**
   - Browse upcoming events
   - Register for tournaments
   - Pay entry fees via PayPal
   - Receive event updates

### **E-commerce (Shopping)**

1. **Browse Products**
   - View badminton equipment catalog
   - Filter by category, price, brand
   - Read product descriptions and reviews

2. **Purchase Items**
   - Add items to shopping cart
   - Review cart and apply discounts
   - Proceed to PayPal checkout
   - Track order status

### **Notifications & Communication**

- **Real-time Notifications**: Instant alerts for reservations, comments, payments
- **Email Updates**: Comprehensive email notifications for all major actions
- **In-app Messaging**: Direct communication between users
- **System Announcements**: Important platform updates and news

## 🔒 Security Features

### **Authentication & Authorization**
- **JWT Tokens**: Secure, stateless authentication with configurable expiration
- **Token Blacklisting**: Immediate token invalidation on logout
- **Role-Based Access Control**: Granular permissions for different user types
- **OTP Verification**: Two-factor authentication via email for critical actions
- **Password Security**: Bcrypt hashing with salt rounds, minimum complexity requirements

### **Data Protection**
- **Input Validation**: Comprehensive validation using Joi schemas
- **SQL Injection Prevention**: MongoDB native protection + input sanitization
- **XSS Protection**: HTML sanitization for user-generated content
- **CSRF Protection**: Token-based protection for state-changing operations
- **File Upload Security**: Type validation, size limits

### **Network Security**
- **HTTPS Enforcement**: SSL/TLS encryption for all communications
- **CORS Configuration**: Controlled cross-origin resource sharing
- **Rate Limiting**: Prevent brute force attacks and API abuse
- **Helmet.js**: Security headers for common vulnerabilities
- **Content Security Policy**: XSS protection through CSP headers

### **Infrastructure Security**
- **Environment Variables**: Sensitive data stored securely
- **Database Security**: MongoDB connection with authentication
- **File Storage**: Secure Cloudflare R2 integration with access controls
- **Error Handling**: No sensitive information in error responses
- **Logging**: Comprehensive audit trails without sensitive data


## 🌐 API Documentation

> Base URL examples:
> Development: `http://localhost:3000`
> Production: `https://your-domain.com`

All JSON responses follow the structure:
```
{
   success: boolean,
   message?: string,
   data?: any,
   code?: number,
   errors?: object
}
```

Authentication uses Bearer JWT in the `Authorization` header unless marked Public. Some routes also set HTTP-only cookies for refresh tokens.

### Legend
| Symbol | Meaning |
|--------|---------|
| 🔓 | Public (no auth) |
| 🔐 | Requires JWT |
| 👤 | Player or Coach role |
| 🛠️ | Admin role |
| 👑 | Superadmin role |
| 🏛️ | Any authenticated role |

### Rate Limiting
| Scope | Limit | Window |
|-------|-------|--------|
| Auth sensitive (login / forgot / reset) | 15 req | 15 min |
| General (most data/file endpoints) | 100 req | 15 min |

Exceeding limits returns HTTP 429 with a JSON error.

---
### 1. Authentication (`/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Register user (player/coach/owner) |
| POST | /auth/register/courts | Court registration submission |
| POST | /auth/login | Login (returns access + refresh) |
| POST | /auth/logout | Logout / blacklist token |
| POST | /auth/refresh | Refresh access token |
| POST | /auth/verify | Verify email / OTP |
| DELETE | /auth/delete | Delete own account |
| POST | /auth/forgot-password | Request password reset (rate-limited) |
| POST | /auth/reset-password | Complete password reset |

---
### 2. Public & Utility
| Method | Path | Description |
|--------|------|-------------|
| GET | /ping | Authenticated health check |
| GET | /data/:filename | Secure file access (permissions) |
| GET | /user/data/:filename | Same as above (legacy alias) |
| POST | /paypal-webhook | PayPal webhook (signature verified) |
| GET | /register | Registration HTML |
| GET | /register/courts | Court registration HTML |
| GET | /reset-password | Reset-password HTML (token) |
| GET | /verification | Email verification HTML (token) |
| GET | /login | Login HTML |

---
### 3. Superadmin (`/superadmin`)
| Method | Path | Description |
|--------|------|-------------|
| GET | /superadmin/dashboard | Platform overview |
| PATCH | /superadmin/court/:action/:courtId | Approve / reject court |
| GET | /superadmin/users | List users |
| GET | /superadmin/users/search | Search users |
| GET | /superadmin/users/:userId | Get user info |
| PUT | /superadmin/users/:userId | Update user |
| DELETE | /superadmin/users/:userId | Delete user |
| GET | /superadmin/courts | List court owners |
| GET | /superadmin/court-details/:courtId | Court detail |

---
### 4. User Core (`/user`)
| Method | Path | Description |
|--------|------|-------------|
| GET | /user/me | Current user profile |
| GET | /user/get-user/:id | Get user by ID |
| PUT | /user/update | Update player/coach profile |
| GET | /user/courts | List courts |
| GET | /user/court/:id | Court details |
| PUT | /user/admin/settings/update-court-info | Update court owner info |

---
### 5. Reservations & Availability
| Method | Path | Description |
|--------|------|-------------|
| GET | /user/availability | Availability (query params) |
| POST | /user/reserve | Create reservation |
| GET | /user/reservations | User reservations |
| POST | /user/reservations/cancel | Cancel reservation |
| GET | /user/admin/reservations | Owner reservations |
| PATCH | /user/admin/reservations/:id/bill-status | Update billing status |
| GET | /user/court-reservation | Reservation HTML UI |

---
### 6. Announcements / Events / Tournaments
| Method | Path | Description |
|--------|------|-------------|
| POST | /user/admin/announcement | Create announcement |
| PUT | /user/admin/announcement/:announcementId | Update announcement |
| DELETE | /user/admin/announcement/:announcementId | Delete announcement |
| POST | /user/admin/event | Create event |
| PUT | /user/admin/event/:eventId | Update event |
| DELETE | /user/admin/event/:eventId | Delete event |
| POST | /user/admin/tournament | Create tournament |
| GET | /user/admin/events/participants | Event participants |
| GET | /user/admin/get-event/:id | Get event |
| POST | /user/admin/membership | Create membership plan |

Player / Coach Event Interaction:
| Method | Path | Description |
|--------|------|-------------|
| GET | /user/event/check-joined/:eventId | Check join status |
| POST | /user/event/join | Join event |
| GET | /user/events/ongoing | Ongoing events |
| GET | /user/confirm-event-payment | Event payment confirmation |

---
### 7. Community / Social
| Method | Path | Description |
|--------|------|-------------|
| GET | /user/posts | User feed |
| GET | /user/admin/posts | Admin posts view |
| POST | /user/community/post | Create post |
| GET | /user/community/posts | List posts |
| DELETE | /user/community/posts/:postId | Delete post |
| PUT | /user/community/posts/:postId | Edit post |
| POST | /user/community/posts/:postId/like | Like post |
| DELETE | /user/community.posts/:postId/like | Remove like |
| POST | /user/community/posts/:postId/comment | Add comment |
| PUT | /user/community/posts/:postId/comment/:commentId | Edit comment |
| POST | /user/community/posts/:postId/comment/:commentId/like | Like comment |
| DELETE | /user/community/posts/:postId/comment/:commentId/like | Unlike comment |
| DELETE | /user/community/posts/:postId/:commentId/comment | Delete comment |
| GET | /user/community/posts/:postId/comments | Post comments |
| GET | /user/community/posts/popular | Popular hashtags |
| GET | /user/community/posts/:hashtag | Posts by hashtag |
| GET | /user/announcements | Announcements HTML |

---
### 8. Products & Orders
| Method | Path | Description |
|--------|------|-------------|
| POST | /user/products | Create product |
| PUT | /user/products/:id | Update product |
| DELETE | /user/products/:id | Delete product |
| GET | /user/get-products | List products |
| GET | /user/get-products/:id | Product detail |
| GET | /user/cart | User cart |
| POST | /user/cart/add | Add to cart |
| PATCH | /user/cart/update-quantity | Update quantity |
| DELETE | /user/cart/remove/:productId | Remove from cart |
| DELETE | /user/cart/clear | Clear cart |
| GET | /user/products/checkout | Checkout HTML |
| POST | /user/products/orders/create | Create order |
| GET | /user/products/orders/confirm | Confirm order |
| GET | /user/products/orders/status | Order status |
| GET | /user/products/orders/paid | Paid orders |
| GET | /user/products/order-list | Orders HTML |
| GET | /user/admin/products/get-orders | Owner order list |

---
### 9. Memberships & Subscriptions
| Method | Path | Description |
|--------|------|-------------|
| POST | /user/admin/membership/create | Create membership |
| GET | /user/admin/membership/get-memberships | Owner memberships |
| DELETE | /user/admin/membership/:membershipId | Delete membership |
| PUT | /user/admin/membership/:membershipId | Update membership |
| GET | /user/admin/membership/:subscriptionId/subscribers | Membership subscribers |
| DELETE | /user/admin/membership/:subscriptionId/remove/:userId | Remove subscriber |
| GET | /user/membership/get-memberships | All membership cards |
| POST | /user/membership/subscribe/:membershipId | Subscribe |
| POST | /user/membership/cancel/:membershipId | Cancel subscription |
| GET | /user/membership/get-subscriptions | Active subscriptions |
| GET | /user/membership/confirm | Confirm payment |
| POST | /user/feedback/submit | Submit feedback |

---
### 10. Notifications
| Method | Path | Description |
|--------|------|-------------|
| GET | /user/notifications | List notifications |
| PATCH | /user/notification/mark-read/:notificationId | Mark one read |
| PATCH | /user/notifications/mark-read | Mark all read |
| DELETE | /user/notifications/clear | Clear notifications |
| POST | /user/notifications/test | Test notification |

---
### 11. Billing & Payments
| Method | Path | Description |
|--------|------|-------------|
| GET | /user/check-payment-status | Generic payment status |
| GET | /user/membership/confirm | Membership payment confirmation |
| GET | /user/confirm-event-payment | Event payment confirmation |

---
### 12. WebSocket Events
Client connects with:
```javascript
const socket = io(BASE_URL, { query: { userId: currentUserId } });

socket.on('welcome', (msg) => console.log(msg));
socket.on('notification', (notif) => {/* display */});
// Additional custom events are emitted server-side when announcements, reservations, posts, etc. change.
```

Common emitted events (inferred):
- `notification` – new notification object
- Court / reservation update events (emitted through reservation logic) – implement client listeners as needed.

---
### Error Handling
Errors return JSON:
```
{
   success: false,
   code: 400,
   message: "Validation failed",
   errors: { field: "reason" }
}
```

### Pagination & Filtering (Recommended)
Some list endpoints (posts, products, reservations) support / should support query params:
`?page=1&limit=20&sort=createdAt:desc&search=term`
If not yet implemented, consider adding consistent middleware for pagination.

### Authentication Notes
Include header:
`Authorization: Bearer <access_token>`

Access token rotation strategy: use `/auth/refresh` with refresh cookie before expiry; logout invalidates tokens via blacklist.

---
Future Improvement Ideas:
1. Generate OpenAPI (Swagger) specification automatically.
2. Add pagination parameters documentation per endpoint.
3. Provide example request/response bodies per main resource.
4. Introduce versioning (`/v1`) for future breaking changes.
5. Add HATEOAS-style links for navigable APIs.


## 🚀 Deployment

### **Deployment Platforms**

#### **Evennode (Current)**
```bash
# Deploy to Evennode
npm run deploy

# Or manually:
git push evennode main
```

#### **Self-Hosted VPS (PM2)**
Use this approach when deploying on your own Linux VPS (Ubuntu/Debian/CentOS, etc.).

```bash
# 1. SSH into your server
ssh user@your_server_ip

# 2. (Recommended) Install Node.js via nvm (if Node 18+ not installed)
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 18

# 3. Clone the repository
git clone https://github.com/elyeandre/bataan-badminton-portal.git
cd bataan-badminton-portal

# 4. Set environment variables
cp .env.example .env
nano .env   # (or vim) then configure production values

# 5. Install dependencies
npm install

# 6. Build production assets
npm run build

# 7. Install pm2 globally (if not yet)
npm install -g pm2

# 8. Start the app with PM2 (uses your package.json start script)
pm2 start npm --name "bataan-badminton-demo" -- run start

# 9. (Optional) Auto-start on reboot
pm2 startup systemd
pm2 save

# 10. View logs
pm2 logs bataan-badminton-demo

# 11. Updating a new release later
git pull
npm install
npm run build
pm2 restart bataan-badminton-demo
```

Key PM2 commands:
| Command | Purpose |
|---------|---------|
| `pm2 list` | List processes |
| `pm2 restart <name>` | Restart app |
| `pm2 stop <name>` | Stop app |
| `pm2 delete <name>` | Remove process |
| `pm2 logs <name>` | Stream logs |
| `pm2 save` | Save current process list |

### **Environment-Specific Configurations**

#### **Production Environment Variables**
```env
NODE_ENV=production
PORT=443
MONGO_URI=mongodb+srv://prod-user:password@cluster.mongodb.net/badminton-prod
JWT_SECRET=ultra_secure_production_secret_key
PAYPAL_MODE=live
DISABLE_SECURITY=false
```

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help improve the Bataan Badminton Management Portal:

### **Getting Started**

1. **Fork the Repository**
   ```bash
   # Click the "Fork" button on GitHub
   # Then clone your fork
   git clone https://github.com/elyeandre/bataan-badminton-portal.git
   cd bataan-badminton-portal
   ```

2. **Set Up Development Environment**
   ```bash
   npm install
   cp .env.example .env
   # Configure your .env file
   npm run devStart
   ```

3. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b bugfix/issue-description
   ```

### **Development Guidelines**

#### **Code Style**
- Follow existing code formatting and naming conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused on single responsibility

#### **Commit Messages**
Use conventional commit format:
```
type(scope): description

feat(auth): add email verification for new users
fix(reservation): resolve double booking issue
docs(readme): update installation instructions
style(css): improve mobile responsiveness
refactor(api): optimize database queries
test(auth): add unit tests for login validation
```

#### **Pull Request Process**

1. **Before Submitting**
   - [ ] Test your changes thoroughly
   - [ ] Run linting and formatting tools
   - [ ] Update documentation if needed
   - [ ] Add/update tests for new features
   - [ ] Ensure all tests pass

2. **PR Description Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Integration tests pass
   - [ ] Manual testing completed

   ## Screenshots (if applicable)
   Add screenshots for UI changes
   ```

3. **Review Process**
   - PRs require at least one review
   - Address reviewer feedback promptly
   - Keep PRs focused and reasonably sized
   - Squash commits before merging

### **Types of Contributions**

#### **🐛 Bug Reports**
- Use GitHub Issues with bug report template
- Include steps to reproduce
- Provide system information
- Add screenshots/logs if helpful

#### **💡 Feature Requests**
- Open GitHub Issue with feature request template
- Describe the problem and proposed solution
- Consider impact on existing functionality
- Discuss with maintainers before implementing large features

#### **📖 Documentation**
- Improve README, API docs, or code comments
- Fix typos and grammatical errors
- Add examples and usage guides
- Translate documentation to other languages

<!-- Testing section intentionally removed per project scope -->

### **Community Guidelines**

- Be respectful and inclusive
- Follow the code of conduct
- Help newcomers get started
- Share knowledge and best practices
- Participate in discussions constructively

### **Recognition**

Contributors will be recognized in:
- GitHub contributors list
- Changelog for releases
- Special mentions in documentation
- Community spotlight features

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### **MIT License Summary**
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ❌ No liability
- ❌ No warranty
- ❗ License and copyright notice required

```
Copyright (c) 2025 Bataan Badminton Management Portal Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

<!-- Acknowledgements section removed per request -->

---

**🏸 Built with ❤️ for the Bataan Badminton Community**

*"Connecting players, courts, and communities through technology"*

---


*Last updated: September 23, 2025 (env vars & email config updated)*

[made-with-javascript]: http://forthebadge.com/images/badges/made-with-javascript.svg
[built-with-love]: https://forthebadge.com/images/badges/built-with-love.svg
[forthebadge-url]: http://forthebadge.com
[contributors-shield]: https://img.shields.io/github/contributors/elyeandre/bataan-badminton-portal.svg?style=for-the-badge
[contributors-url]: https://github.com/elyeandre/bataan-badminton-portal/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/elyeandre/bataan-badminton-portal.svg?style=for-the-badge
[forks-url]: https://github.com/elyeandre/bataan-badminton-portal/network/members
[stars-shield]: https://img.shields.io/github/stars/elyeandre/bataan-badminton-portal.svg?style=for-the-badge
[stars-url]: https://github.com/elyeandre/bataan-badminton-portal/stargazers
[issues-shield]: https://img.shields.io/github/issues/elyeandre/bataan-badminton-portal.svg?style=for-the-badge
[issues-url]: https://github.com/elyeandre/bataan-badminton-portal
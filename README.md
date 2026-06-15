# CarelonRx Product Roadmap

A comprehensive web-based product roadmap management system for CarelonRx initiatives. This application allows team members to submit, track, and visualize product initiatives with detailed planning information.

## Features

### 1. **Authentication System**
- Secure login for team members
- Role-based access control (Admin and User roles)
- Session management with token-based authentication

### 2. **Initiative Intake Form**
Submit new product initiatives with comprehensive details:
- **Initiative Name & Description**
- **Year** - Target year for the initiative
- **Quarter** - Expected quarter for release (Q1-Q4)
- **Delivery Date** - Specific delivery date if known
- **Budget Status** - Approved or Pending approval
- **Priority Alignment** - Critical, High, Medium, or Low
- **Initiative Owner** - Person responsible for the initiative
- **Dependent Systems** - Multiple system dependencies with integration details
- **Business Value** - Expected business impact
- **Risks & Dependencies** - Risk assessment and dependency tracking

### 3. **Visual Roadmap Timeline**
- Interactive timeline view showing initiatives across months
- Color-coded by priority level
- Year-based filtering
- Click on initiatives to view detailed information
- Quarter markers for easy planning
- Responsive grid layout

### 4. **Dashboard**
- Overview statistics (Total initiatives, Budget status, Quarterly breakdown)
- Searchable and filterable initiative list
- Quick access to create new initiatives
- Edit and delete capabilities

## Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **TailwindCSS** - Modern utility-first CSS framework
- **Lucide Icons** - Beautiful icon library
- **Vanilla JavaScript** - No framework dependencies

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **CORS** - Cross-origin resource sharing
- **UUID** - Unique identifier generation

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Setup Instructions

1. **Navigate to the project directory:**
   ```bash
   cd C:\Users\AL51598\CascadeProjects\carelonrx-roadmap
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Start the backend server:**
   ```bash
   npm start
   ```
   The API server will start on `http://localhost:5000`

4. **Open the frontend:**
   - Open `frontend/login.html` in your web browser
   - Or use a local web server (recommended):
     ```bash
     cd frontend
     npx http-server -p 8080
     ```
   - Then navigate to `http://localhost:8080/login.html`

## Quick Start

### Using the Startup Script (Windows)

Simply double-click `start.bat` in the project root directory. This will:
1. Install backend dependencies (if needed)
2. Start the backend API server
3. Open the application in your default browser

### Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend (optional):**
```bash
cd frontend
npx http-server -p 8080
```

Then open `http://localhost:8080/login.html` in your browser.

## Demo Credentials

The application comes with pre-configured demo users:

| Username | Password  | Role          | Name          |
|----------|-----------|---------------|---------------|
| admin    | admin123  | Administrator | Administrator |
| user1    | user123   | User          | John Doe      |
| user2    | user123   | User          | Jane Smith    |

## API Endpoints

### Authentication
- `POST /api/login` - User login

### Initiatives
- `GET /api/initiatives` - Get all initiatives
- `POST /api/initiatives` - Create new initiative
- `GET /api/initiatives/:id` - Get specific initiative
- `PUT /api/initiatives/:id` - Update initiative
- `DELETE /api/initiatives/:id` - Delete initiative

### Statistics
- `GET /api/stats` - Get dashboard statistics
- `GET /api/health` - Health check endpoint

## Project Structure

```
carelonrx-roadmap/
├── frontend/
│   ├── login.html          # Login page
│   ├── dashboard.html      # Main dashboard
│   ├── intake.html         # Initiative intake form
│   └── roadmap.html        # Visual roadmap timeline
├── backend/
│   ├── server.js           # Express API server
│   └── package.json        # Node dependencies
├── start.bat               # Windows startup script
└── README.md               # This file
```

## Usage Guide

### Creating a New Initiative

1. Log in with your credentials
2. Click "New Initiative" button
3. Fill in all required fields:
   - Initiative name
   - Year and quarter
   - Budget approval status
   - Priority level
4. Optionally add:
   - Delivery date
   - Dependent systems
   - Business value description
   - Risk assessment
5. Click "Save Initiative"

### Viewing the Roadmap

1. From the dashboard, click "View Roadmap"
2. Select the year you want to view
3. See all initiatives displayed on a timeline
4. Click any initiative bar to view details
5. Use the export button to generate reports

### Managing Initiatives

- **Edit**: Click the eye icon in the dashboard table or edit button in roadmap details
- **Delete**: Click the trash icon (requires permission)
- **Filter**: Use year and search filters to find specific initiatives
- **Sort**: Initiatives are automatically sorted by priority

## Sample Data

The application comes pre-loaded with sample initiatives:

1. **Member Portal Enhancement** (Q2 2026, High Priority)
   - Upgrade member portal with new features
   - Budget: Approved
   - Dependencies: Member Portal, Claims Processing System

2. **Pharmacy Benefits Integration** (Q3 2026, Critical Priority)
   - Integrate with new PBM system
   - Budget: Approved
   - Dependencies: PBM, Integration Hub

3. **Mobile App Redesign** (Q4 2026, Medium Priority)
   - Complete mobile app redesign
   - Budget: Pending
   - Dependencies: Mobile App, Analytics Platform

## Dependent Systems

The application includes pre-configured dependent systems:
- Claims Processing System
- Member Portal
- Provider Network System
- Pharmacy Benefits Manager (PBM)
- Electronic Health Records (EHR)
- Billing System
- Customer Service Platform
- Data Analytics Platform
- Mobile Application
- Third-Party Integration Hub

## Security Notes

- This is a demo application with basic authentication
- Passwords are stored in plain text (not suitable for production)
- For production use, implement:
  - Password hashing (bcrypt)
  - JWT tokens with expiration
  - HTTPS/SSL
  - Database storage (MongoDB, PostgreSQL)
  - Environment variables for configuration

## Future Enhancements

- Database integration (MongoDB/PostgreSQL)
- Email notifications for initiative updates
- File attachments for initiatives
- Comments and collaboration features
- Export to PDF/Excel
- Advanced analytics and reporting
- Integration with JIRA/Azure DevOps
- Calendar view
- Gantt chart visualization
- Resource allocation tracking

## Troubleshooting

### Backend won't start
- Ensure Node.js is installed: `node --version`
- Check if port 5000 is available
- Run `npm install` in the backend directory

### Frontend can't connect to backend
- Verify backend is running on `http://localhost:5000`
- Check browser console for CORS errors
- Ensure no firewall is blocking the connection

### Login not working
- Clear browser localStorage
- Check network tab in browser dev tools
- Verify backend is responding: `http://localhost:5000/api/health`

## Support

For issues or questions, please contact the development team.

## License

Internal use only - CarelonRx Product Management Team

---

**Built with ❤️ for CarelonRx Product Management**

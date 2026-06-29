# CarelonRx Roadmap - User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [User Roles](#user-roles)
4. [Login & Signup](#login--signup)
5. [Dashboard](#dashboard)
6. [User Profile](#user-profile)
7. [Creating Initiatives](#creating-initiatives)
8. [Managing Initiatives](#managing-initiatives)
9. [Roadmap View](#roadmap-view)
10. [Analytics Dashboard](#analytics-dashboard)
11. [Admin Panel](#admin-panel)
12. [Session Management](#session-management)
13. [Data Persistence](#data-persistence)
14. [Troubleshooting](#troubleshooting)

---

## Introduction

**CarelonRx Roadmap** is a Product Initiative Management system designed to help teams plan, track, and visualize product initiatives across quarters and years.

### Key Features
- ✅ Initiative intake and tracking
- ✅ WSJF (Weighted Shortest Job First) prioritization
- ✅ Visual roadmap timeline with system filtering
- ✅ Role-based access control
- ✅ User profile management with image upload
- ✅ User management (Admin)
- ✅ Budget approval tracking
- ✅ Dependent systems management with mandatory PM/SPOC
- ✅ Hold reason tracking for paused initiatives
- ✅ Analytics dashboard with charts and statistics
- ✅ 30-minute session timeout for security
- ✅ Persistent data storage with MongoDB
- ✅ Complete change history and audit trails
- ✅ PDF and Excel export capabilities
- ✅ Multi-select system filtering on roadmap
- ✅ Auto-populated current year for new initiatives

---

## Getting Started

### System Requirements
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Internet connection
- Valid CarelonRx or Elevance Health email address

### Accessing the Application
1. Navigate to: `https://carelonrx-roadmap1.onrender.com`
2. You'll see the login page with the CarelonRx logo

---

## User Roles

The system supports multiple roles with different permissions:

| Role | Permissions |
|------|-------------|
| **Admin** | Full access - manage users, all initiatives |
| **Product Owner** | Create and edit own initiatives |
| **Product Manager** | Create and edit own initiatives |
| **Business Owner** | Create and edit own initiatives |
| **Stakeholder** | Create and edit own initiatives |
| **RTE (Release Train Engineer)** | Create and edit own initiatives |
| **Scrum Master** | Create and edit own initiatives |

---

## Login & Signup

### Creating a New Account

1. Click **"Create Account"** on the login page
2. Fill in the required information:
   - **Full Name**: Your complete name
   - **Username**: Unique username (no spaces)
   - **Email**: Must be @elevancehealth.com or @carelon.com
   - **Role**: Select your role from the dropdown
   - **Password**: Minimum 6 characters
   - **Confirm Password**: Re-enter your password
3. Click **"Create Account"**
4. You'll be redirected to the login page

### Logging In

1. Enter your **Username**
2. Enter your **Password**
3. Click **"Sign In"**
4. You'll be redirected to the Dashboard

---

## Dashboard

The Dashboard is your main hub for viewing and managing initiatives.

### Dashboard Features

**Top Navigation:**
- **Dashboard**: Return to main dashboard (indigo button)
- **User Guide**: Access this help documentation (gray button)
- **View Roadmap**: See visual timeline (green button)
- **New Initiative**: Create a new initiative (blue button)
- **Analytics**: View system statistics and charts (orange button)
- **Admin** (Admin only): Access user management (purple button)
- **Profile Dropdown**: 
  - Shows your profile image or initials
  - Click to access "My Profile" or "Logout"

**Initiative Table:**
- **Search**: Filter initiatives by name
- **Columns**:
  - Initiative Name
  - Program
  - Year/Quarter
  - Priority (Critical, High, Medium, Low, On Hold)
  - WSJF Score (sorted highest first by default)
  - Budget Status
  - Owner
  - Actions (View, Edit, Delete)

**Statistics Cards:**
- Total Initiatives
- Budget Approved
- Budget Pending
- Average WSJF

### Filtering and Sorting
- Use the search box to find specific initiatives
- Click column headers to sort
- View initiatives you have permission to edit

---

## User Profile

The User Profile feature allows you to manage your personal information and upload a profile picture.

### Accessing Your Profile

1. Click on your **profile image/name** in the top-right corner of any page
2. A dropdown menu will appear
3. Click **"My Profile"**
4. You'll be taken to your profile page

### Profile Dropdown Menu

Located in the top-right corner of the navigation bar:
- **Profile Image**: Shows your uploaded photo or colored initials
- **Your Name**: Displays your full name
- **Dropdown Options**:
  - **My Profile**: Navigate to profile page
  - **Logout**: Sign out of the application

### Profile Page Features

**Profile Header**:
- Large profile image (circular display)
- Camera icon to upload/change image
- Your name, role, and email displayed

**Editable Information**:
- ✅ **Full Name**: Update your display name
- ✅ **Email**: Change your email address (must be @elevancehealth.com or @carelon.com)
- ✅ **Password**: Change your password (optional)

**Read-Only Information**:
- ❌ **Username**: Cannot be changed
- ❌ **Role**: Contact admin to change your role

### Uploading a Profile Image

1. Go to your **Profile page**
2. Click the **camera icon** on your profile image
3. Select an image file from your computer
   - Supported formats: JPG, PNG, GIF, etc.
   - Maximum size: 2MB
4. Image will preview immediately
5. Click **"Save Changes"** to save
6. Your image will appear in:
   - Navigation bar (all pages)
   - Profile page
   - User listings (if admin)

### Updating Your Profile

1. Navigate to **My Profile**
2. Update any of the following:
   - **Full Name**: Enter your new name
   - **Email**: Enter new email (domain validation applies)
   - **New Password**: Enter new password (minimum 6 characters)
   - **Confirm Password**: Re-enter new password
3. Click **"Save Changes"**
4. Success message will appear
5. Changes take effect immediately

### Profile Image Display

**With Image**:
- Your uploaded photo appears in a circle
- Shown in navigation and profile page

**Without Image**:
- Colored circle with your initials
- First letter of each name (max 2 letters)
- Example: "John Doe" → "JD"
- Gradient background (blue to purple)

### Password Change

To change your password:
1. Go to **My Profile**
2. Scroll to **"Change Password"** section
3. Enter **New Password** (minimum 6 characters)
4. Enter **Confirm New Password**
5. Click **"Save Changes"**
6. Leave blank to keep current password

### Profile Validation Rules

**Email**:
- ✅ Must be @elevancehealth.com or @carelon.com
- ✅ Must be unique (not already registered)
- ❌ Cannot use personal email domains

**Password**:
- ✅ Minimum 6 characters
- ✅ Must match confirmation
- ✅ Optional when updating profile

**Image**:
- ✅ Maximum file size: 2MB
- ✅ Common formats supported (JPG, PNG, GIF)
- ✅ Automatically resized for display

### Tips

- **Update your name** to help colleagues identify you
- **Upload a professional photo** for better recognition
- **Keep your email current** for notifications
- **Change password regularly** for security
- **Your image appears everywhere** you're mentioned in the app

---

## Creating Initiatives

### Step-by-Step Guide

1. Click **"New Initiative"** button
2. Fill in the **Basic Information**:
   - **Initiative Name** (required)
   - **Description** (required)
   - **Program** (required)
   - **Year** (required): Auto-populated with current year (2026), can be changed
   - **Quarter** (required): Q1-Q4
   - **Start Date** (if known)
   - **Delivery Date** (if known)

3. Set **Priority** (required):
   - Critical
   - High
   - Medium
   - Low
   - On Hold (for paused/deferred initiatives)
   
4. If **Priority is "On Hold"**, provide **Hold Reason** (required):
   - Explain why the initiative is on hold
   - Maximum 500 characters
   - Examples: "Waiting for budget approval", "Resource constraints", "Dependency blocked"

4. Enter **WSJF Components** (Fibonacci numbers: 1, 2, 3, 5, 8, 13, 21):
   - **User-Business Value**: Business impact
   - **Time Criticality**: Urgency
   - **RR/OE**: Risk Reduction/Opportunity Enablement
   - **Job Size**: Effort required
   - **WSJF Score**: Automatically calculated

5. Add **Business Owner** (required)

6. Enter **Business Value** and **Risks**

7. Add **Dependent Systems** (optional):
   - System Name (Available systems: Bioplus Intel Engine, Bioplus V, Intel Engine, CPDL, CPFR, CFX, Digital Integrated, Digital Standalone Mobile, Digital Standalone Portal, IDL, PPI, PST, SOA, CCT, Enterprise Rx, Payment Hub, Self Service Portal)
   - **PM SPOC (Point of Contact)** - **REQUIRED** when adding a system
     - Autocomplete available with existing names
     - Type to see suggestions from previous entries
   - JIRA URL (optional)

8. Set **Budget Approval** status

9. Click **"Submit Initiative"**

### WSJF Calculation

**Formula**: `WSJF = (User-Business Value + Time Criticality + RR/OE) / Job Size`

**Example**:
- User-Business Value: 13
- Time Criticality: 8
- RR/OE: 5
- Job Size: 3
- **WSJF = (13 + 8 + 5) / 3 = 8.67**

---

## Managing Initiatives

### Viewing Initiatives

1. Click the **eye icon** to view details
2. See all initiative information in read-only mode
3. View change log and history

### Editing Initiatives

**Permissions**: You can edit initiatives if:
- You are the creator, OR
- You are an Admin

**Steps**:
1. Click the **edit icon** on the dashboard
2. Modify any fields
3. Click **"Update Initiative"**
4. Changes are logged with your username and timestamp

### Deleting Initiatives

**Permissions**: Same as editing

**Steps**:
1. Click the **trash icon**
2. Confirm deletion
3. Initiative is permanently removed

---

## Roadmap View

The Roadmap provides a visual timeline of all initiatives.

### Features

- **12-Month View**: See initiatives across the year (Jan-Dec)
- **Priority-Based Colors**: 
  - Critical: Red gradient
  - High: Orange gradient
  - Medium: Blue gradient
  - Low: Gray gradient
  - On Hold: **Purple gradient** with dashed border (unique color for easy identification)
- **Timeline Bars**: Show start and end dates
- **Quarter Markers**: Visual indicators for Q1, Q2, Q3, Q4
- **Hover Details**: See initiative info and dependent systems on hover
- **Year Filter**: Select year to view (2024-2027)
- **System Filter**: Multi-select filter to view initiatives by dependent systems
  - Select one or multiple systems
  - Shows only initiatives with selected systems
  - "Select All" option available
  - "Clear All" to reset filter
- **Export Options**:
  - Download as PDF (includes all 12 months)
  - Export to Excel (detailed data export)
- **Default Sorting**: Initiatives sorted by WSJF (highest first)

### Using the Roadmap

1. Click **"View Roadmap"** from dashboard
2. Select year from dropdown (default: current year)
3. **Optional**: Filter by systems
   - Click "Filter by System (All)" button
   - Check one or more systems
   - Roadmap updates instantly
   - Shows only initiatives with selected systems
4. Initiatives are displayed as horizontal bars
4. Bars span from start date to delivery date
5. **On Hold initiatives** appear with:
   - Yellow striped pattern with dashed border
   - "(On Hold)" text after initiative name
   - Slightly transparent appearance
6. Hover over bars to see:
   - Initiative details
   - Dependent systems
   - PM SPOC information
   - JIRA links (clickable)
7. Click on any bar to view full initiative details
8. Use export buttons to save roadmap

### PDF Export

**Features**:
- High-resolution export (A3 landscape format)
- All 12 months visible (Jan through Dec)
- Priority legend included
- Year indicator shown
- Multi-page support for long roadmaps
- Professional quality for presentations

**How to Export**:
1. Select the year you want to export
2. Click **"Export PDF"** button
3. Wait for processing (export buttons hidden during capture)
4. PDF downloads automatically
5. File name format: `CarelonRx_Roadmap_YYYY.pdf`

### Excel Export

**Features**:
- Complete initiative data
- All fields included
- Formatted for analysis
- Dependent systems listed

**How to Export**:
1. Select the year you want to export
2. Click **"Export Excel"** button
3. Excel file downloads automatically
4. File name format: `CarelonRx_Roadmap_YYYY.xlsx`

---

## Analytics Dashboard

The Analytics Dashboard provides comprehensive insights into system usage, initiative distribution, and user activity.

### Accessing Analytics

1. Click **"Analytics"** button from dashboard (orange button)
2. View real-time statistics and charts

### Summary Cards

**Four Key Metrics Displayed:**
1. **Total Users**: Count of all registered users
2. **Total Initiatives**: Count of all initiatives
3. **Active Initiatives**: Initiatives not on hold
4. **This Year**: Initiatives for current year (2026)

### Visual Charts

**1. Priority Distribution (Doughnut Chart)**
- Shows breakdown of initiatives by priority
- Color-coded: Critical (Red), High (Orange), Medium (Blue), Low (Gray), On Hold (Purple)
- Interactive hover for percentages

**2. Initiatives by Year (Bar Chart)**
- Distribution across years (2024-2027)
- Vertical bars for easy comparison
- Shows planning trends

**3. Program Distribution (Pie Chart)**
- AHD vs Bioplus split
- Percentage breakdown
- Interactive hover

**4. Quarter Distribution (Bar Chart)**
- Current year (2026) only
- Q1, Q2, Q3, Q4 breakdown
- Helps with capacity planning

### System Usage Statistics Table

**Columns:**
- **System Name**: Dependent system name
- **Initiatives**: Count of initiatives using this system
- **Percentage**: Percentage of total system references
- **Usage Bar**: Visual progress bar

**Features:**
- Sorted by usage (highest first)
- Identifies most-used systems
- Helps with resource planning
- Tracks dependencies

**Insights:**
- Which systems are most critical
- Underutilized systems
- Capacity planning data
- Dependency patterns

### User Activity Table

**Columns:**
- **User**: Name or username
- **Email**: User email address
- **Role**: Admin or User badge (color-coded)
- **Initiatives Created**: Count of initiatives
- **Last Active**: Last login date

**Features:**
- Sorted by initiatives created (highest first)
- Identifies top contributors
- Tracks user engagement
- Monitors activity levels

**Use Cases:**
- Recognize active contributors
- Identify inactive users
- Track team productivity
- Plan user training

### Benefits

**Data-Driven Decisions:**
- Visual insights at a glance
- Identify trends and patterns
- Track system dependencies
- Monitor user engagement

**Resource Planning:**
- See system workload
- Identify bottlenecks
- Plan capacity
- Allocate resources

**Performance Tracking:**
- Track initiative distribution
- Monitor priority balance
- Measure user activity
- Assess program health

---

## Session Management

The application includes automatic session timeout for security.

### Session Timeout

**Duration**: 30 minutes of inactivity

**How It Works:**
1. Session timer starts when you login
2. Timer resets with any user activity:
   - Mouse movements
   - Keyboard input
   - Clicks
   - Scrolling
3. After 25 minutes of inactivity, a warning appears
4. After 30 minutes, automatic logout

### Session Warning

**5-Minute Warning:**
- Appears at 25 minutes of inactivity
- Modal dialog with two options:
  1. **"Stay Logged In"**: Extends session for another 30 minutes
  2. **"Logout Now"**: Immediately logs you out

**Warning Message:**
```
⚠️ Session Expiring Soon
Your session will expire in 5 minutes

You will be automatically logged out due to inactivity.
Click "Stay Logged In" to continue your session.

[Stay Logged In]  [Logout Now]
```

### Automatic Logout

**After 30 Minutes:**
- Session expires automatically
- User data cleared from browser
- Redirected to login page
- Message displayed: "Your session has expired due to inactivity. Please login again."

### Activity Tracking

**Actions That Reset Timer:**
- ✅ Mouse movements
- ✅ Mouse clicks
- ✅ Keyboard input
- ✅ Scrolling
- ✅ Touch events (mobile)
- ✅ Any interaction with the page

**Actions That Don't Reset Timer:**
- ❌ Just having the page open
- ❌ Background tabs
- ❌ Minimized windows

### Security Benefits

**Why Session Timeout:**
- 🔒 Prevents unauthorized access to unattended sessions
- 🛡️ Protects sensitive initiative data
- ✅ Meets security best practices
- 📋 Compliance with security policies

**Best Practices:**
- Don't leave your computer unattended while logged in
- Lock your computer when stepping away
- Click "Stay Logged In" if you're still working
- Logout manually when done for the day

### Tips

- **Working on long tasks?** The timer resets with any activity
- **Got the warning?** Click "Stay Logged In" to continue
- **Stepped away?** You'll need to login again after 30 minutes
- **Multiple tabs?** Activity in any tab resets the timer

---

## Admin Panel

**Access**: Admin role only

### User Management

**View Users**:
- See all registered users
- View username, name, email, role, status

**Add New User**:
1. Click **"Add New User"**
2. Fill in:
   - Full Name
   - Username
   - Email (@elevancehealth.com or @carelon.com)
   - Password
   - Role
3. Click **"Save User"**

**Edit User**:
1. Click the **edit icon** next to a user
2. Modify fields (leave password blank to keep current)
3. Click **"Save User"**

**Delete User**:
1. Click the **trash icon**
2. Confirm deletion
3. User is removed (cannot delete yourself)

---

## Data Persistence

### Database Storage

The CarelonRx Roadmap application uses **MongoDB Atlas** for persistent data storage, ensuring all your data is safely stored and never lost.

**Key Benefits**:
- ✅ **Permanent Storage**: All initiatives, users, and changes are saved permanently
- ✅ **Survives Restarts**: Data persists even when the server restarts
- ✅ **Automatic Backups**: MongoDB Atlas provides automatic backups
- ✅ **Scalable**: Can handle growing data needs
- ✅ **Secure**: Industry-standard database security

**What Gets Stored**:
- User accounts and profiles
- All initiatives and their details
- Dependent systems information
- Change logs and audit trails
- Profile images
- WSJF scores and calculations

**Data Safety**:
- All data is encrypted in transit and at rest
- Regular automated backups
- 99.9% uptime guarantee from MongoDB Atlas
- Redundant storage across multiple servers

### Change Tracking

Every initiative update is tracked with:
- **Who**: Username of person making changes
- **When**: Exact timestamp of changes
- **What**: Detailed field-level changes
- **History**: Complete audit trail

**Viewing Change History**:
1. Open any initiative
2. Scroll to "Change Log" section
3. See all updates with timestamps
4. Review who made each change

---

## Troubleshooting

### Common Issues

**Cannot Login**
- ✅ Check username and password
- ✅ Ensure account was created successfully
- ✅ Contact admin if account is locked

**Email Validation Error**
- ✅ Use only @elevancehealth.com or @carelon.com emails
- ✅ Check for typos in email address

**Cannot Edit Initiative**
- ✅ You can only edit initiatives you created
- ✅ Admins can edit all initiatives
- ✅ Check if you're logged in with correct account

**WSJF Not Calculating**
- ✅ Ensure all four fields are filled
- ✅ Use only Fibonacci numbers (1, 2, 3, 5, 8, 13, 21)
- ✅ Job Size cannot be 0

**Initiative Not Showing**
- ✅ Refresh the page
- ✅ Check search filters
- ✅ Ensure you're logged in

**Duplicate WSJF Error**
- ✅ Each initiative must have a unique WSJF score
- ✅ Adjust WSJF component values slightly
- ✅ The system prevents duplicate WSJF values

**Error During Login**
- ✅ Check if backend service is running
- ✅ Verify database connection is established
- ✅ Clear browser cache and cookies
- ✅ Try a different browser
- ✅ Contact admin if issue persists

**Data Not Saving**
- ✅ Check internet connection
- ✅ Ensure you're logged in
- ✅ Verify all required fields are filled
- ✅ Check for error messages
- ✅ Try refreshing the page

**Profile Image Not Uploading**
- ✅ Check file size (max 2MB)
- ✅ Use supported formats (JPG, PNG, GIF)
- ✅ Ensure stable internet connection
- ✅ Try a smaller image file

### Browser Support

**Recommended Browsers**:
- ✅ Google Chrome (latest)
- ✅ Microsoft Edge (latest)
- ✅ Mozilla Firefox (latest)
- ✅ Safari (latest)

### Getting Help

**Contact Support**:
- Internal Teams: CarelonRx Roadmap Support

---

## Best Practices

### Initiative Planning
1. **Be Specific**: Use clear, descriptive names
2. **Accurate Dates**: Set realistic start and delivery dates
3. **WSJF Scoring**: Involve team in scoring discussions
4. **Dependencies**: Document all dependent systems
5. **Regular Updates**: Keep initiative status current

### WSJF Prioritization
- **User-Business Value**: Focus on customer impact
- **Time Criticality**: Consider deadlines and market timing
- **RR/OE**: Evaluate risk mitigation and opportunities
- **Job Size**: Be realistic about effort

### Data Quality
- ✅ Complete all required fields
- ✅ Use consistent naming conventions
- ✅ Update initiatives when plans change
- ✅ Archive completed initiatives

---

## Quick Reference

### Keyboard Shortcuts
- **Ctrl/Cmd + F**: Search on page
- **Esc**: Close modals
- **Tab**: Navigate form fields

### Status Indicators

**Budget Status**:
- 🟢 **Budget Approved**: Green badge
- � **Budget Pending**: Yellow badge

**Priority Colors**:
- � **Critical**: Red badge/gradient - Highest importance
- � **High**: Orange badge/gradient - Important
- � **Medium**: Blue badge/gradient - Standard
- ⚫ **Low**: Gray badge/gradient - Lower importance
- 🟡 **On Hold**: Yellow badge/gradient with dashed border - Paused/Deferred

### Field Requirements
- ⭐ **Red asterisk (*)**: Required field
- 📧 **Email**: Must be corporate domain
- 🔢 **WSJF**: Fibonacci numbers only
- 📅 **Dates**: Valid date format

---

## Version Information

**Version**: 1.0  
**Last Updated**: June 2026  
**Application URL**: https://carelonrx-roadmap1.onrender.com  
**API URL**: https://carelonrx-roadmap.onrender.com  

---

## Appendix

### Fibonacci Numbers for WSJF
Use these values for WSJF scoring:
- **1**: Minimal
- **2**: Very Low
- **3**: Low
- **5**: Medium
- **8**: High
- **13**: Very High
- **21**: Extremely High

### Glossary
- **WSJF**: Weighted Shortest Job First - Prioritization method
- **RR/OE**: Risk Reduction / Opportunity Enablement
- **PM SPOC**: Project Manager Single Point of Contact
- **RTE**: Release Train Engineer
- **Initiative**: A planned product feature or project

---

**© 2026 CarelonRx. All rights reserved.**

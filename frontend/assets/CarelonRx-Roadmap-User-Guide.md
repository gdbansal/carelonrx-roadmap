# Product 360 - User Guide

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
11. [Story Estimations](#story-estimations)
12. [Capacity Planning](#capacity-planning)
13. [Admin Panel](#admin-panel)
14. [Session Management](#session-management)
15. [Data Persistence](#data-persistence)
16. [Troubleshooting](#troubleshooting)

---

## Introduction

**Product 360** is a comprehensive product initiative management system designed to help teams plan, track, and visualize product initiatives across quarters and years.

### Key Features
- ✅ **Modern Brand Identity** - Official purple theme (#5009B5) throughout
- ✅ **Initiative intake and tracking** - Comprehensive form with validation
- ✅ **WSJF (Weighted Shortest Job First) prioritization** - Auto-calculated scoring
- ✅ **Visual roadmap timeline** - Interactive timeline with color-coded priorities
- ✅ **Story Estimations** - Planning Poker with real-time collaboration (Available Now)
- ✅ **Hold reason display** - Prominent yellow box for On Hold initiatives
- ✅ **Role-based access control** - Admin, creator, and viewer permissions
- ✅ **User profile management** - Profile image upload and customization
- ✅ **User management (Admin)** - Admin panel for user administration
- ✅ **Budget approval tracking** - Toggle and track budget status
- ✅ **Dependent systems management** - Multiple systems with PM/SPOC tracking
- ✅ **Analytics dashboard** - Charts, statistics, and insights
- ✅ **Streamlined navigation** - Analytics and Admin in profile dropdown
- ✅ **30-minute session timeout** - Automatic security logout
- ✅ **Persistent data storage** - MongoDB with complete audit trails
- ✅ **PDF and Excel export** - Export roadmap for presentations
- ✅ **Multi-select system filtering** - Filter roadmap by multiple systems
- ✅ **Unsaved changes warning** - Prevents accidental data loss
- ✅ **Audit logging** - Comprehensive tracking for estimation sessions

---

## Getting Started

### System Requirements
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Internet connection
- Valid corporate email address

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

**Top Navigation (CarelonRx Purple Theme):**
- **User Guide**: Access this help documentation (gray button)
- **New Initiative**: Create a new initiative (purple button)
- **View Roadmap**: See visual timeline (purple button)
- **Profile Dropdown**: 
  - Shows your profile image with purple gradient or initials
  - Click to access:
    - 👤 **My Profile**: Manage your account settings
    - 📊 **Analytics**: View system statistics and charts
    - 🛡️ **Admin Panel**: User management (admin only)
    - 🚪 **Logout**: Sign out of the application

**Initiative Table:**
- **Search**: Filter initiatives by name or description
- **Year Filter**: Filter by specific year or view all
- **Sortable Columns** (click header to sort):
  - Initiative Name & Description
  - Year
  - Quarter (Q1, Q2, Q3, Q4)
  - Budget Status (Approved/Pending)
  - Priority (Critical, High, Medium, Low, On Hold)
  - WSJF Score (sorted highest first by default)
- **Actions Column**:
  - 👁️ **View**: View detailed initiative information (all users)
  - ✏️ **Edit**: Edit initiative (admin or creator only)
  - 🗑️ **Delete**: Delete initiative (admin or creator only)

**Statistics Cards:**
- Total Initiatives
- Budget Approved
- Budget Pending
- This Quarter (current quarter initiatives)

### Initiative Actions

#### View Initiative (All Users)
1. Click the 👁️ **View** (eye) icon in the Actions column
2. A detailed modal will open showing:
   - Initiative name, priority, budget status, and WSJF score
   - Program, owner, year/quarter, and timeline
   - Full description
   - Hold reason (if applicable)
   - WSJF components (User Value, Time Criticality, RR/OE, Job Size)
   - Business value and risks
   - Dependent systems with PM/SPOC and JIRA links
3. Click **Close** to exit the modal

#### Edit Initiative (Admin or Creator Only)
1. Click the ✏️ **Edit** (pencil) icon in the Actions column
2. You'll be redirected to the Initiative Edit page
3. Make your changes
4. Click **Submit Initiative** to save
5. **Note**: A warning will appear if you try to leave without saving

#### Delete Initiative (Admin or Creator Only)
1. Click the 🗑️ **Delete** (trash) icon in the Actions column
2. Confirm the deletion in the popup dialog
3. The initiative will be permanently removed

**Permission Rules:**
- **All Users**: Can view any initiative
- **Admin**: Can edit and delete ALL initiatives
- **Creator**: Can edit and delete THEIR OWN initiatives
- **Other Users**: Can only view (no edit/delete buttons shown)

### Filtering and Sorting
- Use the **search box** to find initiatives by name or description
- Use the **year dropdown** to filter by specific year
- Click any **column header** to sort (click again to reverse order)
- Default sort: WSJF score (highest to lowest)

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
   - **Line of Business** (required): Enter or select from existing values
   - **Program** (required)
   - **Year** (required): Auto-populated with current year (2026), can be changed
   - **Quarter** (required): Q1-Q4
   - **Start Date** (optional)
   - **Delivery Date** (optional)

### Unsaved Changes Warning

**Important**: The initiative form now tracks unsaved changes to prevent accidental data loss.

**How it works:**
- When you make any changes to the form, the system tracks them
- If you try to leave the page (click Dashboard, close tab, etc.), a warning appears
- You'll see: "You have unsaved changes. Do you want to leave without saving?"
- Click **Cancel** to stay and save your work
- Click **OK** to leave without saving (changes will be lost)
- After successfully saving, you can navigate away without warnings

**Tips:**
- Save your work frequently
- The warning protects you from accidentally losing work
- No warning appears if you haven't made any changes
- After clicking "Submit Initiative", the warning is cleared

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
5. Bars span from start date to delivery date
6. **On Hold initiatives** appear with:
   - Yellow striped pattern with dashed border
   - "(On Hold)" text after initiative name
   - Slightly transparent appearance
7. Hover over bars to see:
   - Initiative details
   - Dependent systems
   - PM SPOC information
   - JIRA links (clickable)
8. **Click on any bar** to view full initiative details in a modal popup
9. **Hold Reason Display**: For "On Hold" initiatives, the modal shows:
   - ⚠️ Yellow highlighted box with alert icon
   - "Hold Reason" label in bold
   - Complete reason text explaining why the initiative is paused
   - Positioned prominently at the top for immediate visibility
10. Use export buttons to save roadmap

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

**From Any Page:**
1. Click on your **Profile Dropdown** (top right)
2. Select **"Analytics"** from the menu
3. View real-time statistics and charts

**Navigation on Analytics Page:**
- User Guide | Dashboard | New Initiative | View Roadmap | Profile ▼

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

## Story Estimations

The Story Estimations module is a collaborative tool for agile teams to estimate story points using Planning Poker methodology.

### Overview

**Purpose**: Enable distributed teams to estimate user stories collaboratively in real-time using Fibonacci sequence (Planning Poker).

**Key Features**:
- ✅ **Real-time collaboration** - Multiple users can estimate simultaneously
- ✅ **Planning Poker** - Fibonacci sequence (0, 0.5, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89)
- ✅ **Role-based access** - Dev, QA, PO, SM, Admin roles
- ✅ **Persistent estimations** - All estimations saved to MongoDB
- ✅ **Session management** - Create and join estimation sessions
- ✅ **Story tracking** - Add multiple stories per session
- ✅ **Reveal/Hide** - PO/Admin can reveal all estimations
- ✅ **Complete stories** - Mark stories as estimated
- ✅ **Custom reasons** - Add estimation reasoning for Dev/QA

### Accessing Story Estimations

1. Navigate to: `https://carelonrx-roadmap1.onrender.com/story-estimations.html`
2. Login with your name and role
3. Create a new session or join an existing one

### User Roles

| Role | Permissions |
|------|-------------|
| **Dev** | Estimate stories, view own estimations, add stories |
| **QA** | Estimate stories, view own estimations, add stories |
| **PO (Product Owner)** | All Dev/QA permissions + Reveal estimations, Complete stories, End session |
| **SM (Scrum Master)** | Same as PO |
| **Admin** | Same as PO + Full access to all features |
| **Session Creator** | Only the session creator can edit/delete stories (regardless of role) |

### Creating an Estimation Session

**Step 1: Login**
1. Enter your **Name** (e.g., "John Doe")
2. Select your **Role** (Dev, QA, PO, SM, Admin)
3. Click **"Continue"**

**Step 2: Create Session**
1. Click **"Create New Session"**
2. Fill in session details:
   - **Team Name**: Your team or project name
   - **Sprint Value**: Sprint number or identifier (e.g., "Sprint 24")
3. Click **"Create Session"**
4. **Share the session URL** with your team members

**Session URL Format**:
```
https://carelonrx-roadmap1.onrender.com/story-estimations.html?session=session_XXXXX
```

### Joining an Estimation Session

**Method 1: Via URL**
1. Click the session URL shared by session creator
2. Login with your name and role
3. You'll automatically join the session

**Method 2: Manual Join**
1. Login to Story Estimations
2. Click **"Join Existing Session"**
3. Enter the **Session ID** (e.g., `session_1782993492476_97cf8smq7`)
4. Click **"Join Session"**

### Adding Stories to Estimate

**Who Can Add**: All users (Dev, QA, PO, SM, Admin)  
**Who Can Edit/Delete**: Only the session creator

**Steps**:
1. In an active session, find **"Add New Story"** section
2. Enter **Story Number/ID** (e.g., "JIRA-123" or JIRA URL)
3. Enter **Story Title/Description**
4. **(Optional)** Toggle restrictions:
   - **Dev Only**: Only Dev role can estimate this story
   - **QA Only**: Only QA role can estimate this story
5. Click **"Add"** button
6. Story appears in the estimation list

**Editing Stories**:
- Only the **session creator** sees edit/delete buttons
- Click **edit icon** to modify story details
- Click **delete icon** to remove story
- Other users (including PO/SM/Admin) cannot edit/delete stories they didn't create

### Estimating Stories

**Step 1: Select Your Estimation**
1. Find the story in the list
2. Click on a **Fibonacci number** button (0, 0.5, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89)
3. Button turns **blue** when selected
4. Your estimation is **saved automatically**

**Step 2: Add Reasoning (Optional)**
- Dev and QA can add reasons for their estimates
- Select from predefined reasons or add custom ones
- Helps team understand estimation rationale

**Visual Feedback**:
- ✅ **Blue button**: Your selected estimation
- ✅ **Gray buttons**: Available options
- ✅ **Saved indicator**: Confirmation message

**Estimation Persistence**:
- Estimations are saved to MongoDB in real-time
- Persist across page refreshes
- Visible to PO/Admin when revealed
- Cannot be seen by other team members until revealed

### Revealing Estimations (PO/SM/Admin Only)

**Purpose**: Show all team members' estimations for discussion

**Important**: 
- ❌ **PO/SM/Admin CANNOT see estimations until revealed**
- ✅ **Each user can only see their own estimation**
- ✅ **PO/SM/Admin see a status summary** (e.g., "✅ 3 estimated ⏳ 2 waiting 🔒 Hidden")
- ✅ **This ensures unbiased estimation** (Planning Poker methodology)

**Steps**:
1. Wait for all team members to estimate
2. PO/SM/Admin sees status: "✅ X estimated ⏳ Y waiting"
3. Click **"Reveal Estimates"** button
4. All estimations become visible to everyone
5. Team can discuss differences and reach consensus

**What Gets Revealed**:
- Each team member's name and role
- Their selected estimation number (previously shown as ***)
- Any reasoning they provided (Dev/QA reasons)
- All participants can now see all estimations

**After Reveal**:
- Button changes to **"Estimates Revealed"** badge
- Status badge changes from 🔒 Hidden to 👁️ Revealed
- Cannot hide again (permanent reveal for transparency)

### Completing Stories (PO/Admin Only)

**When to Complete**:
- After team reaches consensus
- Final estimation is agreed upon
- Story is ready for sprint planning

**Steps**:
1. Click **"Complete"** button next to the story
2. Story is marked as completed
3. Story moves to completed section (if implemented)
4. Cannot be re-estimated unless reopened

**To Reopen**:
- Click **"Reopen"** button
- Story becomes active again
- Team can re-estimate if needed

### Custom Estimation Reasons

**For Dev Role**:
- Add custom reasons for development estimates
- Examples: "Complex integration", "New technology", "Technical debt"

**For QA Role**:
- Add custom reasons for QA estimates
- Examples: "Extensive test scenarios", "Automation required", "Regression impact"

**How to Add**:
1. PO/Admin can add custom reasons
2. Go to session settings or reasons section
3. Enter new reason text
4. Reason becomes available for all team members

### Session Management

**Session Information**:
- Team Name
- Sprint Value
- Created By
- Created Date
- Number of Participants
- Number of Stories
- Session ID (for sharing)

**Session Actions**:

**For All Users**:
- **Leave Session**: Remove yourself from the session
  - Click **"Leave Session"** button
  - Confirm you want to leave
  - You're removed from participants list
  - Other users see the update in real-time (within 3 seconds)
  - Can rejoin later if needed

**For PO/SM/Admin**:
- **End Session**: Close session for all participants
  - Click **"End Session"** button
  - Confirm action
  - Session marked as closed
  - All participants notified
  - Stories and estimations remain saved

**For Session Creator Only**:
- **Edit Stories**: Modify story details
- **Delete Stories**: Remove stories from session
- Other PO/SM/Admin cannot edit/delete stories they didn't create

**Participant List**:
- See all active participants in real-time
- View their roles (Dev, QA, PO, SM, Admin)
- See who has estimated each story
- Updates automatically when users join/leave
- Session creator indicated

### Real-Time Updates

**Automatic Polling**:
- System checks for updates every 3 seconds
- New estimations appear automatically
- Participant list updates in real-time
- No manual refresh needed

**What Updates Automatically**:
- ✅ New participants joining
- ✅ Participants leaving (real-time removal)
- ✅ New stories added
- ✅ Stories edited/deleted (by creator)
- ✅ Estimations submitted
- ✅ Stories revealed
- ✅ Stories completed/reopened
- ✅ Estimation reasons added

### Best Practices

**Before the Session**:
1. ✅ Prepare story list in advance
2. ✅ Share session URL with all participants
3. ✅ Ensure everyone understands Fibonacci scale
4. ✅ Agree on estimation criteria (complexity, effort, risk)

**During Estimation**:
1. ✅ Read story description carefully
2. ✅ Ask clarifying questions before estimating
3. ✅ Estimate independently (don't see others' estimates)
4. ✅ Add reasoning for unusual estimates
5. ✅ Discuss differences after reveal

**After Reveal**:
1. ✅ Discuss outlier estimates
2. ✅ Listen to different perspectives
3. ✅ Re-estimate if needed
4. ✅ Reach team consensus
5. ✅ Complete story when agreed

### Fibonacci Scale Guide

| Points | Complexity | Typical Duration |
|--------|-----------|------------------|
| **0** | Trivial | Minutes |
| **0.5** | Minimal | < 1 hour |
| **1** | Very Simple | 1-2 hours |
| **2** | Simple | Half day |
| **3** | Moderate | 1 day |
| **5** | Medium | 2-3 days |
| **8** | Complex | 1 week |
| **13** | Very Complex | 1-2 weeks |
| **21** | Highly Complex | 2-3 weeks |
| **34** | Extremely Complex | 3-4 weeks |
| **55** | Epic-level | 1-2 months |
| **89** | Too Large | Break down into smaller stories |

### Troubleshooting

**Estimation Not Saving**:
- ✅ Check internet connection
- ✅ Ensure you're logged into the session
- ✅ Verify button turned blue after clicking
- ✅ Check browser console for errors
- ✅ Refresh page and try again

**Cannot See Others' Estimations**:
- ✅ Estimations are hidden until PO/Admin reveals them
- ✅ This is by design (Planning Poker methodology)
- ✅ Wait for reveal before discussing

**Session Not Found**:
- ✅ Verify session ID is correct
- ✅ Check if session URL is complete
- ✅ Session may have been deleted
- ✅ Create a new session if needed

**Estimation Disappeared After Refresh**:
- ✅ This issue has been fixed in the latest version
- ✅ Estimations now persist to MongoDB
- ✅ Should remain after page refresh
- ✅ If still occurring, report to admin

**Cannot Add Story**:
- ✅ Ensure both Story Number and Title are filled
- ✅ Check if you're in an active session
- ✅ Verify internet connection
- ✅ Try refreshing the page

### Audit Log (PO/SM/Admin Only)

**Purpose**: Track all estimation session activities for compliance and analytics

**Accessing Audit Log**:
1. Click on your **Profile Dropdown** (top right)
2. Select **"View Audit Log"** (only visible to PO/SM/Admin)
3. View comprehensive event tracking

**What Gets Logged**:
- ✅ **Session Events**: Created, Joined, Left, Ended
- ✅ **Estimation Events**: Provided, Updated
- ✅ **Story Events**: Created, Updated, Deleted, Completed, Reopened
- ✅ **User Events**: Login, Logout
- ✅ **Reveal Events**: Estimates revealed
- ✅ **Reason Events**: Added, Removed

**Audit Log Features**:
- **Filters**: Date range, session ID, user ID, event type
- **Statistics**: Total logs, unique sessions, unique users
- **Event Distribution**: Visual charts showing activity patterns
- **Export**: Download audit logs as CSV
- **Deviation Analysis**: Export estimation variance data
- **IP Tracking**: See where actions originated
- **User Agent**: Track device/browser information

**Use Cases**:
- Track team participation and engagement
- Identify estimation patterns
- Compliance and audit requirements
- Session analytics and insights
- Troubleshooting session issues

### Technical Details

**Data Persistence**:
- All estimations stored in MongoDB Atlas
- Real-time synchronization every 3 seconds
- Automatic conflict resolution
- 1-second delay before polling resumes after save
- Complete audit trail for all actions

**Security**:
- Session-based access control
- Role-based permissions
- IP address tracking (behind proxy support)
- User agent logging
- Sessions persist in database
- Token-based authentication (backend)

**Browser Requirements**:
- Modern browser (Chrome, Firefox, Edge, Safari)
- JavaScript enabled
- Cookies enabled for localStorage
- Stable internet connection

---

## Capacity Planning

**Access**: All authenticated users

The Capacity Planning module helps teams plan and track resource capacity across multiple sprints. It provides a matrix-based interface for entering team member availability and automatically calculates averages and totals.

### Accessing Capacity Planning

1. Click **"Capacity Planning"** in the left sidebar (below Story Estimations)
2. You'll see the capacity planning interface with filters and matrix

### Planning Capacity

**Step 1: Select Context**

Fill in the required filters:
- **Line of Business**: Select from configured LOBs
- **Program**: Choose program (e.g., AHD, Bioplus)
- **Project**: Enter project name
- **Team**: Select from available teams
- **Sprint**: Enter sprint identifier (e.g., "Sprint 24")

**Step 2: Load Team Members**

1. Click **"Load Team Members"** button
2. System fetches all active team members for the selected team
3. Capacity matrix appears with team member rows

**Step 3: Enter Sprint Dates (Optional)**

- Enter start and end dates for each sprint (1-4)
- Dates help track sprint timelines
- Can be left blank if not needed

**Step 4: Enter Capacity**

For each team member and sprint:
- Enter **working days** available (0-10)
- Use decimal values for partial days (e.g., 5.5)
- System auto-calculates totals as you type

**Step 5: Save Capacity Plan**

1. Review all entries
2. Click **"Save Capacity Plan"**
3. Data is saved to database
4. Success message confirms save

### Capacity Matrix Structure

**Columns**:
- **Resource Name**: Team member name
- **Role**: Member's role (Dev Lead, Developer, QA, etc.)
- **Team**: Team name
- **Sprint 1-4**: Capacity input fields with date headers

**Rows**:
- One row per team member
- Input fields for each sprint
- Easy keyboard navigation (Tab key)

**Footer Calculations**:
- **Average Working Days/Sprint**: Average capacity per member
- **Resources Available/Sprint**: Total capacity for the sprint

### Auto-Calculations

The system automatically calculates:
- **Total capacity per sprint**: Sum of all member capacities
- **Average capacity per sprint**: Average across all members
- **Real-time updates**: Calculations update as you type

### Use Cases

**Sprint Planning**:
- Determine total team capacity
- Plan story point allocation
- Identify resource constraints

**Resource Management**:
- Track member availability
- Plan for vacations/time off
- Balance workload across team

**Multi-Sprint Planning**:
- Plan capacity for 4 sprints ahead
- Identify trends and patterns
- Adjust resource allocation

### Best Practices

**Accurate Capacity Entry**:
- ✅ Account for holidays and time off
- ✅ Consider meetings and ceremonies
- ✅ Use realistic working days (typically 6-8 per sprint)
- ✅ Update regularly as plans change

**Team Member Management**:
- 📋 Keep team member list current in Admin Panel
- 🔄 Mark inactive members appropriately
- 📝 Use consistent team names across projects

**Planning Horizon**:
- 🎯 Plan 4 sprints ahead for better visibility
- 🔍 Review and update each sprint
- 📊 Use historical data to improve estimates

### Tips

- **Keyboard Navigation**: Use Tab key to move between fields quickly
- **Decimal Values**: Enter 0.5 for half days, 7.5 for 7.5 days, etc.
- **Save Frequently**: Click Save after completing each section
- **Review Totals**: Check footer calculations to verify capacity
- **Team Coordination**: Share capacity plans with team for alignment

### Integration with Admin Panel

Capacity Planning integrates with Admin Panel's Team Members module:
- Team members must be added in Admin Panel first
- Active members appear in capacity planning
- Inactive members are hidden
- Team names must match exactly

### Troubleshooting

**No Team Members Showing**:
- ✅ Verify team members exist in Admin Panel → Team Members
- ✅ Check team name spelling matches exactly
- ✅ Ensure members are marked as Active
- ✅ Refresh page and try again

**Can't Save Capacity Plan**:
- ✅ Fill in all required filters (LOB, Program, Project, Team, Sprint)
- ✅ Enter at least one capacity value
- ✅ Check internet connection
- ✅ Verify you're logged in

**Calculations Not Updating**:
- ✅ Ensure you're entering numeric values
- ✅ Use decimal point (.) not comma (,)
- ✅ Refresh page if calculations freeze

---

## Admin Panel

**Access**: Admin role only

The Admin Panel provides three main modules for system administration:
1. **User Management** - Manage user accounts and roles
2. **Line of Business Management** - Manage LOB values that appear in initiative dropdowns
3. **Team Members Management** - Manage team members for capacity planning

### Accessing Admin Panel

1. Click on your **Profile Dropdown** (top right)
2. Select **"Admin Panel"** (only visible to admins)
3. You'll see a tabbed interface with three sections

### User Management Tab

**View Users**:
- See all registered users
- View username, name, email, role, status
- Table shows: Name, Username, Role, Status, Actions

**Add New User**:
1. Click **"Add User"** button
2. Fill in required information:
   - **Full Name** (required)
   - **Username** (required, unique)
   - **Email** (required, must be @elevancehealth.com or @carelon.com)
   - **Password** (required, minimum 8 characters with complexity requirements)
   - **Role** (required): Admin, Product Owner, Product Manager, Business Owner, Stakeholder, RTE, Scrum Master
3. Click **"Save User"**
4. Success message appears
5. User can now login with their credentials

**Password Requirements**:
- ✅ Minimum 8 characters
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)
- ✅ At least one special character (!@#$%^&*)

**Edit User**:
1. Click the **edit icon** (pencil) next to a user
2. Modify any fields:
   - Update name, email, or role
   - Change password (leave blank to keep current)
3. Click **"Save User"**
4. Changes take effect immediately

**Delete User**:
1. Click the **trash icon** next to a user
2. Confirm deletion in popup dialog
3. User account is permanently removed
4. **Note**: Cannot delete yourself while logged in

### Line of Business Management Tab

**Purpose**: Manage the Line of Business values that appear in the initiative form dropdown. This ensures consistency across all initiatives and provides centralized control over LOB options.

**View Lines of Business**:
- See all configured LOBs
- Table shows: Name, Description, Status (Active/Inactive), Created By, Actions
- Active LOBs appear in initiative dropdowns
- Inactive LOBs are hidden from dropdowns but preserved in database

**Add New Line of Business**:
1. Click **"Add Line of Business"** button
2. Fill in the form:
   - **Name** (required): The LOB name that will appear in dropdowns
     - Example: "Medicare", "Medicaid", "Commercial"
     - Maximum 200 characters
     - Must be unique
   - **Description** (optional): Additional details about this LOB
     - Maximum 500 characters
     - Helps users understand the LOB purpose
3. Click **"Save"**
4. Success message appears
5. New LOB immediately appears in initiative form dropdowns

**Edit Line of Business**:
1. Click the **edit icon** (pencil) next to an LOB
2. Modify fields:
   - **Name**: Update the LOB name
   - **Description**: Update description
   - **Active Status**: Toggle active/inactive
     - ✅ **Active**: Appears in initiative dropdowns
     - ❌ **Inactive**: Hidden from dropdowns (but existing initiatives keep the value)
3. Click **"Save"**
4. Changes take effect immediately across all forms

**Delete Line of Business**:
1. Click the **trash icon** next to an LOB
2. System checks if LOB is in use by any initiatives
3. **If in use**: 
   - ❌ Deletion blocked
   - Error message shows: "Cannot delete Line of Business. It is currently used by X initiative(s). Please reassign those initiatives first."
   - You must first edit initiatives to use a different LOB
4. **If not in use**:
   - ✅ Confirm deletion in popup dialog
   - LOB is permanently removed from database
5. Deleted LOBs no longer appear in dropdowns

**Smart Delete Protection**:
- System prevents accidental deletion of LOBs in use
- Protects data integrity
- Shows count of affected initiatives
- Guides admin to reassign initiatives first

**Active/Inactive Status**:
- **Active LOBs**: 
  - ✅ Appear in initiative form dropdowns
  - ✅ Can be selected for new initiatives
  - ✅ Shown with green "Active" badge
- **Inactive LOBs**:
  - ❌ Hidden from initiative form dropdowns
  - ✅ Existing initiatives retain the value
  - ✅ Can be reactivated anytime
  - ✅ Shown with gray "Inactive" badge
  - 💡 Use this to phase out old LOBs without losing data

**How LOBs Drive Initiative Form**:
1. Admin adds/updates LOBs in Admin Panel
2. Changes sync to database (MongoDB)
3. Initiative form fetches active LOBs via API
4. Dropdown auto-populates with current active LOBs
5. Users see only active, admin-approved LOB values
6. Ensures data consistency across all initiatives

**Benefits**:
- ✅ **Centralized Control**: Manage all LOB values in one place
- ✅ **Data Consistency**: Everyone uses the same LOB values
- ✅ **No Typos**: Users select from predefined list
- ✅ **Easy Updates**: Change LOB names globally
- ✅ **Audit Trail**: Track who created/updated each LOB
- ✅ **Flexible**: Add new LOBs as business needs evolve
- ✅ **Safe Deletion**: Prevents deletion of LOBs in use

**Best Practices**:
- 📋 **Plan LOB structure** before adding many initiatives
- 🔄 **Use Inactive** instead of Delete when phasing out LOBs
- 📝 **Add descriptions** to help users understand each LOB
- ✅ **Review regularly** to ensure LOB list stays current
- 🔍 **Check usage** before deleting (system will warn you)

### Admin Panel Navigation

**Switching Between Tabs**:
- Click **"User Management"** tab to manage users
- Click **"Line of Business"** tab to manage LOBs
- Tab content loads automatically
- Current tab highlighted in blue

**Visual Design**:
- Clean tabbed interface
- Color-coded status badges
- Icon-based actions (edit, delete)
- Confirmation dialogs for destructive actions
- Success/error messages for all operations

### Team Members Management Tab

**Purpose**: Manage team members for capacity planning. Team members added here will appear in the Capacity Planning module.

**View Team Members**:
- See all configured team members
- Table shows: Name, Role, Team, Email, Status (Active/Inactive), Actions
- Active members appear in capacity planning
- Inactive members are hidden but preserved in database

**Add New Team Member**:
1. Click **"Add Team Member"** button
2. Fill in the form:
   - **Name** (required): Full name of team member
     - Example: "John Smith", "Jane Doe"
   - **Role** (required): Select from dropdown
     - Options: Dev Lead, Developer, QA, Scrum Master, Product Owner, Architect, Designer, DevOps
   - **Team** (required): Team name
     - Example: "Enhance Warriors", "Innovation Team"
     - Must match exactly in Capacity Planning
   - **Email** (optional): Team member's email address
3. Click **"Save"**
4. Success message appears
5. New member immediately available in Capacity Planning

**Edit Team Member**:
1. Click the **edit icon** (pencil) next to a team member
2. Modify fields:
   - **Name**: Update member name
   - **Role**: Change role
   - **Team**: Update team assignment
   - **Email**: Update email
   - **Active Status**: Toggle active/inactive
     - ✅ **Active**: Appears in Capacity Planning
     - ❌ **Inactive**: Hidden from Capacity Planning (but existing plans keep the data)
3. Click **"Save"**
4. Changes take effect immediately

**Delete Team Member**:
1. Click the **trash icon** next to a team member
2. System checks if member has capacity plans
3. **If has capacity plans**: 
   - ❌ Deletion blocked
   - Error message shows: "Cannot delete team member. They have X capacity plan(s). Please remove those first."
   - You must first delete capacity plans or reassign
4. **If no capacity plans**:
   - ✅ Confirm deletion in popup dialog
   - Member is permanently removed from database
5. Deleted members no longer appear in Capacity Planning

**Smart Delete Protection**:
- System prevents accidental deletion of members with capacity plans
- Protects data integrity
- Shows count of affected plans
- Guides admin to clean up plans first

**Active/Inactive Status**:
- **Active Members**: 
  - ✅ Appear in Capacity Planning team selection
  - ✅ Can be assigned to capacity plans
  - ✅ Shown with green "Active" badge
- **Inactive Members**:
  - ❌ Hidden from Capacity Planning
  - ✅ Existing capacity plans retain the data
  - ✅ Can be reactivated anytime
  - ✅ Shown with gray "Inactive" badge
  - 💡 Use this for members who left the team

**How Team Members Drive Capacity Planning**:
1. Admin adds team members in Admin Panel
2. Members sync to database (MongoDB)
3. Capacity Planning fetches active members by team
4. Users select team and see all active members
5. Ensures consistent team member data

**Benefits**:
- ✅ **Centralized Management**: Manage all team members in one place
- ✅ **Data Consistency**: Everyone uses the same member list
- ✅ **Role Tracking**: Track member roles and responsibilities
- ✅ **Team Organization**: Group members by team
- ✅ **Audit Trail**: Track who created/updated each member
- ✅ **Safe Deletion**: Prevents deletion of members in use

**Best Practices**:
- 📋 **Add all team members** before using Capacity Planning
- 🔄 **Use Inactive** instead of Delete when members leave
- 📝 **Keep team names consistent** across all modules
- ✅ **Update regularly** to reflect team changes
- 🔍 **Check capacity plans** before deleting members

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

## Security & Data Protection

### Password Security

**Encryption**:
- All passwords are encrypted using **bcrypt** hashing
- Passwords are never stored in plain text
- One-way encryption means passwords cannot be decrypted
- Each password has a unique salt for additional security

**Email Protection**:
- Email addresses are encrypted using **AES-256-CBC** encryption
- Encrypted before storing in database
- Automatically decrypted when displayed
- Military-grade encryption standard

**Best Practices**:
- ✅ Use strong passwords (minimum 6 characters)
- ✅ Change password regularly
- ✅ Never share your password
- ✅ Logout when done using the application
- ✅ Report suspicious activity immediately

### Session Management

**Session Timeout**:
- **30-minute** inactivity timeout
- **5-minute warning** before timeout
- Automatic logout after timeout
- Activity tracking resets timer

**How it works:**
1. Your session starts when you login
2. Every action (click, type, etc.) resets the timer
3. After 25 minutes of inactivity, a warning appears
4. You have 5 minutes to continue or you'll be logged out
5. Click "Continue Session" to stay logged in
6. Click "Logout" or wait to be logged out

**Benefits:**
- Prevents unauthorized access if you forget to logout
- Protects sensitive data
- Meets security compliance requirements
- Automatic cleanup of inactive sessions

**Tips:**
- Save your work before stepping away
- The warning gives you time to finish
- Any activity resets the timer
- You can manually logout anytime

### Data Privacy

**What We Protect**:
- ✅ User passwords (bcrypt hashed)
- ✅ Email addresses (AES-256 encrypted)
- ✅ User profiles
- ✅ Initiative data
- ✅ Session tokens

**Access Control**:
- Role-based permissions (Admin, Product Owner, etc.)
- Initiative creators can edit their own initiatives
- Admins can manage all data
- JWT token authentication for all API requests

**Compliance**:
- GDPR-compliant data protection
- SOC 2 security controls
- Industry-standard encryption
- Regular security audits

---

## Version Information

**Version**: 2.1  
**Last Updated**: July 3, 2026  
**Application URL**: https://carelonrx-roadmap1.onrender.com  
**API URL**: https://carelonrx-roadmap.onrender.com  

**Recent Updates (v2.1 - July 2026)**:
- ✅ **Initiative Enhancements**:
  - **Line of Business Field** - New required field with autocomplete functionality
  - **Business Commitment Date** - Optional date field prioritized over Delivery Date
  - **Branding Update** - Removed CarelonRx name and logo, kept Product 360
- ✅ **Story Estimations Enhancements**:
  - **Reveal Logic Fixed** - PO/SM/Admin cannot see estimations until revealed
  - **Session Creator Privileges** - Only creator can edit/delete stories
  - **Leave Session** - Real-time participant removal when leaving
  - **Audit Logging** - Comprehensive event tracking for all actions
  - **IP Address Tracking** - Correct client IP capture behind proxies
  - **Header Styling** - White background matching Roadmap consistency
  - **PO Status Summary** - Shows estimation counts without revealing values
  - **User Authentication Backend** - JWT-based token authentication (prepared)
  - **Estimation Reasons** - Dev/QA can add custom reasons for estimates
  - **Real-time Updates** - Participant list updates when users join/leave

**Previous Updates (v2.0 - June 2026)**:
- ✅ **Rebranded to "Product 360"** - New application name
- ✅ **Brand Theme** - Official purple color (#5009B5) throughout
- ✅ **Hold Reason Display** - Prominent yellow box in roadmap modal
- ✅ **Navigation Reorganization** - Analytics and Admin moved to profile dropdown
- ✅ **Enhanced Button Styling** - Modern shadows and hover effects
- ✅ **Complete Analytics Navigation** - New Initiative and View Roadmap buttons added
- ✅ **View, Edit, Delete Actions** - Permission-based initiative management
- ✅ **Detailed Initiative Modal** - Comprehensive information display
- ✅ **Unsaved Changes Warning** - Prevents accidental data loss
- ✅ **Password Encryption** - bcrypt hashing for security
- ✅ **Email Encryption** - AES-256-CBC for data protection
- ✅ **Session Timeout** - 30-minute automatic logout
- ✅ **System Filtering** - Multi-select filter on roadmap
- ✅ **Hold Reason Tracking** - Required for On Hold initiatives
- ✅ **PM/SPOC Required** - Mandatory for dependent systems

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

**© 2026 Product 360. All rights reserved.**

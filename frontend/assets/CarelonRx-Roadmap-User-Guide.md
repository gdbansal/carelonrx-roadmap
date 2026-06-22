# CarelonRx Roadmap - User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [User Roles](#user-roles)
4. [Login & Signup](#login--signup)
5. [Dashboard](#dashboard)
6. [Creating Initiatives](#creating-initiatives)
7. [Managing Initiatives](#managing-initiatives)
8. [Roadmap View](#roadmap-view)
9. [Admin Panel](#admin-panel)
10. [Troubleshooting](#troubleshooting)

---

## Introduction

**CarelonRx Roadmap** is a Product Initiative Management system designed to help teams plan, track, and visualize product initiatives across quarters and years.

### Key Features
- ✅ Initiative intake and tracking
- ✅ WSJF (Weighted Shortest Job First) prioritization
- ✅ Visual roadmap timeline
- ✅ Role-based access control
- ✅ User management (Admin)
- ✅ Budget approval tracking
- ✅ Dependent systems management

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
- **New Initiative**: Create a new initiative
- **View Roadmap**: See visual timeline
- **Admin** (Admin only): Access user management
- **User Menu**: View your name and logout

**Initiative Table:**
- **Search**: Filter initiatives by name
- **Columns**:
  - Initiative Name
  - Program
  - Year/Quarter
  - Priority (Critical, High, Medium, Low)
  - WSJF Score
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

## Creating Initiatives

### Step-by-Step Guide

1. Click **"New Initiative"** button
2. Fill in the **Basic Information**:
   - **Initiative Name** (required)
   - **Description** (required)
   - **Program** (required)
   - **Year** (required): 2025-2030
   - **Quarter** (required): Q1-Q4
   - **Start Date** (required)
   - **Delivery Date** (required)

3. Set **Priority**:
   - Critical
   - High
   - Medium
   - Low

4. Enter **WSJF Components** (Fibonacci numbers: 1, 2, 3, 5, 8, 13, 21):
   - **User-Business Value**: Business impact
   - **Time Criticality**: Urgency
   - **RR/OE**: Risk Reduction/Opportunity Enablement
   - **Job Size**: Effort required
   - **WSJF Score**: Automatically calculated

5. Add **Business Owner** (required)

6. Enter **Business Value** and **Risks**

7. Add **Dependent Systems** (optional):
   - System Name
   - PM SPOC (Point of Contact)
   - JIRA URL

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

- **12-Month View**: See initiatives across the year
- **Color-Coded Bars**: Each initiative has a unique color
- **Timeline Bars**: Show start and end dates
- **Hover Details**: See initiative info on hover
- **Export Options**:
  - Download as PDF
  - Export to Excel

### Using the Roadmap

1. Click **"View Roadmap"** from dashboard
2. Initiatives are displayed as horizontal bars
3. Bars span from start date to delivery date
4. Scroll to see all initiatives
5. Use export buttons to save

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

### Browser Support

**Recommended Browsers**:
- ✅ Google Chrome (latest)
- ✅ Microsoft Edge (latest)
- ✅ Mozilla Firefox (latest)
- ✅ Safari (latest)

### Getting Help

**Contact Support**:
- Email: support@carelonrx.com
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
- 🟢 **Budget Approved**: Green badge
- 🔴 **Budget Pending**: Red badge
- 🔵 **Critical Priority**: Highest importance
- 🟡 **High Priority**: Important
- 🟠 **Medium Priority**: Standard
- ⚪ **Low Priority**: Lower importance

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

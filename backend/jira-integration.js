// JIRA Integration Module
// Handles communication with JIRA REST API

const axios = require('axios');
const https = require('https');

// Create axios instance that accepts self-signed certificates
const axiosInstance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    })
});

/**
 * Fetch all projects from JIRA instance
 * @param {string} baseUrl - JIRA base URL (e.g., https://jira.company.com)
 * @param {string} token - Personal Access Token or API Token
 * @returns {Promise<Array>} List of JIRA projects
 */
async function fetchJiraProjects(baseUrl, token) {
    try {
        const response = await axiosInstance.get(`${baseUrl}/rest/api/2/project`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
        });

        return response.data.map(project => ({
            id: project.id,
            key: project.key,
            name: project.name,
            description: project.description || '',
            lead: project.lead?.displayName || '',
            projectTypeKey: project.projectTypeKey,
            url: `${baseUrl}/browse/${project.key}`
        }));
    } catch (error) {
        console.error('JIRA API Error (fetchProjects):', error.message);
        throw new Error(`Failed to fetch JIRA projects: ${error.message}`);
    }
}

/**
 * Fetch issues/tickets from a specific JIRA project
 * @param {string} baseUrl - JIRA base URL
 * @param {string} token - Personal Access Token
 * @param {string} projectKey - Project key (e.g., 'AHD')
 * @param {number} maxResults - Maximum number of results (default 50)
 * @returns {Promise<Array>} List of JIRA issues
 */
async function fetchJiraIssues(baseUrl, token, projectKey, maxResults = 50) {
    try {
        const jql = `project=${projectKey} ORDER BY created DESC`;
        const response = await axiosInstance.get(`${baseUrl}/rest/api/2/search`, {
            params: {
                jql: jql,
                maxResults: maxResults,
                fields: 'summary,status,assignee,priority,created,updated'
            },
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        return response.data.issues.map(issue => ({
            id: issue.id,
            key: issue.key,
            summary: issue.fields.summary,
            status: issue.fields.status?.name || 'Unknown',
            assignee: issue.fields.assignee?.displayName || 'Unassigned',
            priority: issue.fields.priority?.name || 'None',
            created: issue.fields.created,
            updated: issue.fields.updated,
            url: `${baseUrl}/browse/${issue.key}`
        }));
    } catch (error) {
        console.error('JIRA API Error (fetchIssues):', error.message);
        throw new Error(`Failed to fetch JIRA issues: ${error.message}`);
    }
}

/**
 * Search JIRA issues by text query
 * @param {string} baseUrl - JIRA base URL
 * @param {string} token - Personal Access Token
 * @param {string} searchText - Search query
 * @param {number} maxResults - Maximum results
 * @returns {Promise<Array>} List of matching issues
 */
async function searchJiraIssues(baseUrl, token, searchText, maxResults = 20) {
    try {
        const jql = `text ~ "${searchText}" ORDER BY created DESC`;
        const response = await axiosInstance.get(`${baseUrl}/rest/api/2/search`, {
            params: {
                jql: jql,
                maxResults: maxResults,
                fields: 'summary,status,project'
            },
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        return response.data.issues.map(issue => ({
            id: issue.id,
            key: issue.key,
            summary: issue.fields.summary,
            status: issue.fields.status?.name || 'Unknown',
            project: issue.fields.project?.name || '',
            projectKey: issue.fields.project?.key || '',
            url: `${baseUrl}/browse/${issue.key}`
        }));
    } catch (error) {
        console.error('JIRA API Error (searchIssues):', error.message);
        throw new Error(`Failed to search JIRA issues: ${error.message}`);
    }
}

/**
 * Fetch single JIRA issue by key
 * @param {string} baseUrl - JIRA base URL
 * @param {string} token - Personal Access Token
 * @param {string} issueKey - Issue key (e.g., 'CPDL-11186')
 * @returns {Promise<Object>} Issue details
 */
async function fetchJiraIssue(baseUrl, token, issueKey) {
    try {
        const response = await axiosInstance.get(`${baseUrl}/rest/api/2/issue/${issueKey}`, {
            params: {
                fields: 'summary,status,assignee,priority,created,updated,description,reporter,issuetype'
            },
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        const issue = response.data;
        return {
            id: issue.id,
            key: issue.key,
            summary: issue.fields.summary,
            description: issue.fields.description || '',
            status: issue.fields.status?.name || 'Unknown',
            assignee: issue.fields.assignee?.displayName || 'Unassigned',
            reporter: issue.fields.reporter?.displayName || 'Unknown',
            priority: issue.fields.priority?.name || 'None',
            issueType: issue.fields.issuetype?.name || 'Unknown',
            created: issue.fields.created,
            updated: issue.fields.updated,
            url: `${baseUrl}/browse/${issue.key}`
        };
    } catch (error) {
        console.error('JIRA API Error (fetchIssue):', error.message);
        throw new Error(`Failed to fetch JIRA issue: ${error.message}`);
    }
}

/**
 * Test JIRA connection
 * @param {string} baseUrl - JIRA base URL
 * @param {string} token - Personal Access Token
 * @returns {Promise<Object>} Connection status and user info
 */
async function testJiraConnection(baseUrl, token) {
    try {
        const response = await axiosInstance.get(`${baseUrl}/rest/api/2/myself`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 5000
        });

        return {
            success: true,
            user: {
                name: response.data.displayName,
                email: response.data.emailAddress,
                username: response.data.name
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    fetchJiraProjects,
    fetchJiraIssues,
    searchJiraIssues,
    fetchJiraIssue,
    testJiraConnection
};

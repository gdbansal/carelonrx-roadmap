/**
 * Unit Tests: /api/jira/sprint-issues
 * Tests the logic that filters sprint tickets to the correct team board only.
 *
 * Run: npm test
 */

// ─── Mock jiraRequest ───────────────────────────────────────────────────────
// We extract the core filtering logic into a testable helper so we don't
// need to spin up the Express server or hit real Jira.

/**
 * Replicates the sprint-issues filtering logic from server.js.
 * Returns { boardName, sprintName, projectKeys, jql, issues }
 */
async function sprintIssuesLogic(teamName, sprintName, jiraRequest) {
    const jiraBase = 'https://jira.carelonrx.com';

    // Step 1: Find board matching teamName
    let matchedBoard = null;
    let boardStart = 0;
    let boardTotal = 1;
    while (boardStart < boardTotal && !matchedBoard) {
        const { status, body } = await jiraRequest(
            `${jiraBase}/rest/agile/1.0/board?maxResults=50&startAt=${boardStart}`
        );
        if (status !== 200 || !body.values) break;
        matchedBoard = body.values.find(b => b.name.toLowerCase() === teamName.toLowerCase());
        boardTotal = body.total || 0;
        boardStart += 50;
        if (body.values.length === 0) break;
    }
    if (!matchedBoard) return { error: `No board found for team: ${teamName}` };

    // Step 2: Find sprint on that board
    let matchedSprint = null;
    let sprintStart = 0;
    let sprintTotal = 1;
    while (sprintStart < sprintTotal && !matchedSprint) {
        const { status, body } = await jiraRequest(
            `${jiraBase}/rest/agile/1.0/board/${matchedBoard.id}/sprint?maxResults=50&startAt=${sprintStart}`
        );
        if (status !== 200 || !body.values) break;
        matchedSprint = body.values.find(s => s.name.toLowerCase() === sprintName.toLowerCase());
        sprintTotal = body.total || 0;
        sprintStart += 50;
        if (body.values.length === 0) break;
    }
    if (!matchedSprint) return { error: `No sprint found: ${sprintName}` };

    // Step 3: Get board project keys from board configuration
    let boardProjectKeys = [];
    const { status: confStatus, body: confBody } = await jiraRequest(
        `${jiraBase}/rest/agile/1.0/board/${matchedBoard.id}/configuration`
    );
    if (confStatus === 200 && confBody.filter && confBody.filter.query) {
        const jqlFilter = confBody.filter.query;
        const projectMatches = jqlFilter.match(/project\s+(?:in\s*\(([^)]+)\)|=\s*([A-Z0-9_]+))/i);
        if (projectMatches) {
            const raw = projectMatches[1] || projectMatches[2] || '';
            boardProjectKeys = raw.split(',').map(k => k.trim().replace(/['"]/g, '').toUpperCase()).filter(Boolean);
        }
    }

    // Step 4: Build JQL scoped to board project keys
    const projectFilter = boardProjectKeys.length > 0
        ? ` AND project in (${boardProjectKeys.map(k => `"${k}"`).join(',')})`
        : '';
    const jql = `sprint = ${matchedSprint.id}${projectFilter} ORDER BY created DESC`;

    // Step 5: Fetch issues
    let allIssues = [];
    let issueStart = 0;
    let issueTotal = 1;
    while (issueStart < issueTotal) {
        const { status, body } = await jiraRequest(
            `${jiraBase}/rest/api/2/search?jql=${encodeURIComponent(jql)}&maxResults=50&startAt=${issueStart}&fields=summary,status,issuetype,assignee`
        );
        if (status !== 200 || !body.issues) break;
        allIssues = allIssues.concat(body.issues);
        issueTotal = body.total || 0;
        issueStart += 50;
        if (body.issues.length === 0) break;
    }

    const issues = allIssues.map(issue => ({
        id: issue.id,
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status ? issue.fields.status.name : 'Unknown',
        issueType: issue.fields.issuetype ? issue.fields.issuetype.name : 'Story',
        assignee: issue.fields.assignee ? issue.fields.assignee.displayName : 'Unassigned',
        url: `${jiraBase}/browse/${issue.key}`
    }));

    return { boardName: matchedBoard.name, sprintName: matchedSprint.name, boardProjectKeys, jql, issues };
}

// ─── Mock data ───────────────────────────────────────────────────────────────

const MOCK_BOARDS = [
    { id: 101, name: 'Aero Avengers' },
    { id: 102, name: 'SOT Team' },
    { id: 103, name: 'Platform Tigers' }
];

const MOCK_SPRINTS = {
    101: [{ id: 201, name: '26.3.3 (7/22 - 8/4)', state: 'active' }],
    102: [{ id: 201, name: '26.3.3 (7/22 - 8/4)', state: 'active' }], // same sprint id shared
    103: [{ id: 301, name: 'Sprint 10', state: 'future' }]
};

const MOCK_BOARD_CONFIG = {
    101: { filter: { query: 'project in (AER, AER2)' } },
    102: { filter: { query: 'project in (SOT)' } },
    103: { filter: { query: 'project = PLT' } }
};

// Mixed issues from sprint 201 (shared sprint - has both AER and SOT tickets)
const ALL_SPRINT_201_ISSUES = [
    { id: '1', key: 'AER-100', fields: { summary: 'Aero feature A', status: { name: 'In Progress' }, issuetype: { name: 'Story' }, assignee: { displayName: 'Alice' } } },
    { id: '2', key: 'AER-101', fields: { summary: 'Aero bug fix', status: { name: 'To Do' }, issuetype: { name: 'Bug' }, assignee: null } },
    { id: '3', key: 'SOT-7431', fields: { summary: 'SOT task', status: { name: 'Ready' }, issuetype: { name: 'Task' }, assignee: { displayName: 'Bob' } } },
    { id: '4', key: 'SOT-7399', fields: { summary: 'SOT bug', status: { name: 'Done' }, issuetype: { name: 'Bug' }, assignee: { displayName: 'Carol' } } }
];

// Filtered issues per project
const FILTERED_ISSUES = {
    'AER': ALL_SPRINT_201_ISSUES.filter(i => i.key.startsWith('AER')),
    'SOT': ALL_SPRINT_201_ISSUES.filter(i => i.key.startsWith('SOT'))
};

/**
 * Mock jiraRequest that simulates Jira API responses
 */
function makeMockJiraRequest(projectKeysFilter = null) {
    return async (url) => {
        // Boards list
        if (url.includes('/rest/agile/1.0/board?')) {
            return { status: 200, body: { values: MOCK_BOARDS, total: MOCK_BOARDS.length } };
        }
        // Sprints for a board
        const sprintMatch = url.match(/\/board\/(\d+)\/sprint/);
        if (sprintMatch) {
            const boardId = parseInt(sprintMatch[1]);
            return { status: 200, body: { values: MOCK_SPRINTS[boardId] || [], total: (MOCK_SPRINTS[boardId] || []).length } };
        }
        // Board configuration
        const configMatch = url.match(/\/board\/(\d+)\/configuration/);
        if (configMatch) {
            const boardId = parseInt(configMatch[1]);
            return { status: 200, body: MOCK_BOARD_CONFIG[boardId] || {} };
        }
        // Issue search - simulate filtering by project
        if (url.includes('/rest/api/2/search')) {
            const decodedUrl = decodeURIComponent(url);
            let issues = ALL_SPRINT_201_ISSUES;
            // Apply project filter if present in JQL
            if (decodedUrl.includes('project in')) {
                const keys = Object.keys(FILTERED_ISSUES);
                for (const key of keys) {
                    if (decodedUrl.includes(`"${key}"`)) {
                        issues = FILTERED_ISSUES[key];
                        break;
                    }
                }
            }
            return { status: 200, body: { issues, total: issues.length } };
        }
        return { status: 404, body: {} };
    };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('/api/jira/sprint-issues - Team Isolation', () => {

    test('TC01: Returns only Aero Avengers tickets, not SOT tickets', async () => {
        const result = await sprintIssuesLogic('Aero Avengers', '26.3.3 (7/22 - 8/4)', makeMockJiraRequest());

        expect(result.error).toBeUndefined();
        expect(result.boardName).toBe('Aero Avengers');
        expect(result.issues.length).toBeGreaterThan(0);

        // Must NOT contain SOT tickets
        const sotTickets = result.issues.filter(i => i.key.startsWith('SOT'));
        expect(sotTickets.length).toBe(0);

        // Must contain only AER tickets
        result.issues.forEach(issue => {
            expect(issue.key).toMatch(/^AER/);
        });
    });

    test('TC02: Board project keys extracted correctly from board config', async () => {
        const result = await sprintIssuesLogic('Aero Avengers', '26.3.3 (7/22 - 8/4)', makeMockJiraRequest());

        expect(result.boardProjectKeys).toContain('AER');
        expect(result.boardProjectKeys).toContain('AER2');
        expect(result.boardProjectKeys).not.toContain('SOT');
    });

    test('TC03: JQL contains project filter scoped to board', async () => {
        const result = await sprintIssuesLogic('Aero Avengers', '26.3.3 (7/22 - 8/4)', makeMockJiraRequest());

        expect(result.jql).toContain('sprint = 201');
        expect(result.jql).toContain('project in');
        expect(result.jql).toContain('"AER"');
        expect(result.jql).not.toContain('"SOT"');
    });

    test('TC04: SOT Team gets only SOT tickets from same shared sprint', async () => {
        const result = await sprintIssuesLogic('SOT Team', '26.3.3 (7/22 - 8/4)', makeMockJiraRequest());

        expect(result.error).toBeUndefined();
        expect(result.boardProjectKeys).toContain('SOT');

        const aerTickets = result.issues.filter(i => i.key.startsWith('AER'));
        expect(aerTickets.length).toBe(0);

        result.issues.forEach(issue => {
            expect(issue.key).toMatch(/^SOT/);
        });
    });

    test('TC05: Returns error when team name not found', async () => {
        const result = await sprintIssuesLogic('Unknown Team', '26.3.3 (7/22 - 8/4)', makeMockJiraRequest());

        expect(result.error).toBeDefined();
        expect(result.error).toContain('No board found for team: Unknown Team');
    });

    test('TC06: Returns error when sprint not found for team', async () => {
        const result = await sprintIssuesLogic('Platform Tigers', 'Non Existent Sprint', makeMockJiraRequest());

        expect(result.error).toBeDefined();
        expect(result.error).toContain('No sprint found');
    });

    test('TC07: Case-insensitive team name matching', async () => {
        const result = await sprintIssuesLogic('aero avengers', '26.3.3 (7/22 - 8/4)', makeMockJiraRequest());

        expect(result.error).toBeUndefined();
        expect(result.boardName).toBe('Aero Avengers');
    });

    test('TC08: Case-insensitive sprint name matching', async () => {
        const result = await sprintIssuesLogic('Aero Avengers', '26.3.3 (7/22 - 8/4)'.toUpperCase(), makeMockJiraRequest());

        expect(result.error).toBeUndefined();
        expect(result.sprintName).toBe('26.3.3 (7/22 - 8/4)');
    });

    test('TC09: Issue fields mapped correctly', async () => {
        const result = await sprintIssuesLogic('Aero Avengers', '26.3.3 (7/22 - 8/4)', makeMockJiraRequest());

        const issue = result.issues[0];
        expect(issue).toHaveProperty('id');
        expect(issue).toHaveProperty('key');
        expect(issue).toHaveProperty('summary');
        expect(issue).toHaveProperty('status');
        expect(issue).toHaveProperty('issueType');
        expect(issue).toHaveProperty('assignee');
        expect(issue).toHaveProperty('url');
        expect(issue.url).toContain(issue.key);
    });

    test('TC10: Unassigned tickets show Unassigned instead of null', async () => {
        const result = await sprintIssuesLogic('Aero Avengers', '26.3.3 (7/22 - 8/4)', makeMockJiraRequest());

        const unassigned = result.issues.find(i => i.key === 'AER-101');
        expect(unassigned).toBeDefined();
        expect(unassigned.assignee).toBe('Unassigned');
    });
});

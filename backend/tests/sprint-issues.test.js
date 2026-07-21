/**
 * Unit Tests: /api/jira/sprint-issues
 * Tests the logic that filters sprint tickets using "Team Name" custom field in JQL.
 * This ensures only tickets belonging to the specified team are returned,
 * even when multiple teams share the same sprint.
 *
 * Run: npm test
 */

// ─── Core logic (mirrors server.js sprint-issues handler) ────────────────────

async function sprintIssuesLogic(teamName, sprintName, jiraRequest) {
    const jiraBase = 'https://jira.carelonrx.com';

    // Step 1: Find board matching teamName (exact, case-insensitive)
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

    // Step 2: Find sprint on that board (exact, case-insensitive)
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

    // Step 3: Fetch issues scoped by sprint + "Team Name" custom field
    const jql = `sprint = ${matchedSprint.id} AND "Team Name" = "${teamName}" ORDER BY created DESC`;
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

    return { boardName: matchedBoard.name, sprintName: matchedSprint.name, jql, issues };
}

// ─── Mock data ───────────────────────────────────────────────────────────────

const MOCK_BOARDS = [
    { id: 101, name: 'Aero Avengers' },
    { id: 102, name: 'SOT Team' },
    { id: 103, name: 'Platform Tigers' }
];

const MOCK_SPRINTS = {
    101: [{ id: 201, name: '26.3.3 (7/22 - 8/4)', state: 'active' }],
    102: [{ id: 201, name: '26.3.3 (7/22 - 8/4)', state: 'active' }], // same sprint shared across teams
    103: [{ id: 301, name: 'Sprint 10', state: 'future' }]
};

// All issues in sprint 201 before Team Name filtering (mixed teams)
const ALL_SPRINT_201_ISSUES = [
    { id: '1', key: 'AER-100', teamName: 'Aero Avengers', fields: { summary: 'Aero feature A', status: { name: 'In Progress' }, issuetype: { name: 'Story' }, assignee: { displayName: 'Alice' } } },
    { id: '2', key: 'AER-101', teamName: 'Aero Avengers', fields: { summary: 'Aero bug fix', status: { name: 'To Do' }, issuetype: { name: 'Bug' }, assignee: null } },
    { id: '3', key: 'SOT-7431', teamName: 'SOT Team', fields: { summary: 'SOT task', status: { name: 'Ready' }, issuetype: { name: 'Task' }, assignee: { displayName: 'Bob' } } },
    { id: '4', key: 'SOT-7399', teamName: 'SOT Team', fields: { summary: 'SOT bug', status: { name: 'Done' }, issuetype: { name: 'Bug' }, assignee: { displayName: 'Carol' } } }
];

/**
 * Mock jiraRequest — simulates Jira filtering by "Team Name" in JQL
 */
function makeMockJiraRequest() {
    return async (url) => {
        const decoded = decodeURIComponent(url);

        if (url.includes('/rest/agile/1.0/board?')) {
            return { status: 200, body: { values: MOCK_BOARDS, total: MOCK_BOARDS.length } };
        }

        const sprintMatch = url.match(/\/board\/(\d+)\/sprint/);
        if (sprintMatch) {
            const boardId = parseInt(sprintMatch[1]);
            const sprints = MOCK_SPRINTS[boardId] || [];
            return { status: 200, body: { values: sprints, total: sprints.length } };
        }

        if (url.includes('/rest/api/2/search')) {
            // Simulate "Team Name" = "X" filtering in JQL
            const teamMatch = decoded.match(/"Team Name"\s*=\s*"([^"]+)"/i);
            let issues = ALL_SPRINT_201_ISSUES;
            if (teamMatch) {
                const filterTeam = teamMatch[1].toLowerCase();
                issues = ALL_SPRINT_201_ISSUES.filter(i => i.teamName.toLowerCase() === filterTeam);
            }
            return { status: 200, body: { issues, total: issues.length } };
        }

        return { status: 404, body: {} };
    };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('/api/jira/sprint-issues - Team Isolation via "Team Name" JQL', () => {

    test('TC01: Returns only Aero Avengers tickets, not SOT tickets', async () => {
        const result = await sprintIssuesLogic('Aero Avengers', '26.3.3 (7/22 - 8/4)', makeMockJiraRequest());

        expect(result.error).toBeUndefined();
        expect(result.boardName).toBe('Aero Avengers');
        expect(result.issues.length).toBeGreaterThan(0);

        const sotTickets = result.issues.filter(i => i.key.startsWith('SOT'));
        expect(sotTickets.length).toBe(0);

        result.issues.forEach(issue => expect(issue.key).toMatch(/^AER/));
    });

    test('TC02: JQL uses "Team Name" custom field, not project key', async () => {
        const result = await sprintIssuesLogic('Aero Avengers', '26.3.3 (7/22 - 8/4)', makeMockJiraRequest());

        expect(result.jql).toContain('sprint = 201');
        expect(result.jql).toContain('"Team Name" = "Aero Avengers"');
        expect(result.jql).not.toContain('project in');
    });

    test('TC03: SOT Team gets only SOT tickets from the same shared sprint', async () => {
        const result = await sprintIssuesLogic('SOT Team', '26.3.3 (7/22 - 8/4)', makeMockJiraRequest());

        expect(result.error).toBeUndefined();

        const aerTickets = result.issues.filter(i => i.key.startsWith('AER'));
        expect(aerTickets.length).toBe(0);

        result.issues.forEach(issue => expect(issue.key).toMatch(/^SOT/));
    });

    test('TC04: Returns error when team name not found in boards', async () => {
        const result = await sprintIssuesLogic('Unknown Team', '26.3.3 (7/22 - 8/4)', makeMockJiraRequest());

        expect(result.error).toBeDefined();
        expect(result.error).toContain('No board found for team: Unknown Team');
    });

    test('TC05: Returns error when sprint not found for the team board', async () => {
        const result = await sprintIssuesLogic('Platform Tigers', 'Non Existent Sprint', makeMockJiraRequest());

        expect(result.error).toBeDefined();
        expect(result.error).toContain('No sprint found');
    });

    test('TC06: Team name matching is case-insensitive', async () => {
        const result = await sprintIssuesLogic('aero avengers', '26.3.3 (7/22 - 8/4)', makeMockJiraRequest());

        expect(result.error).toBeUndefined();
        expect(result.boardName).toBe('Aero Avengers');
    });

    test('TC07: Sprint name matching is case-insensitive', async () => {
        const result = await sprintIssuesLogic('Aero Avengers', '26.3.3 (7/22 - 8/4)'.toUpperCase(), makeMockJiraRequest());

        expect(result.error).toBeUndefined();
        expect(result.sprintName).toBe('26.3.3 (7/22 - 8/4)');
    });

    test('TC08: All required issue fields are present in response', async () => {
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

    test('TC09: Unassigned tickets show "Unassigned" instead of null', async () => {
        const result = await sprintIssuesLogic('Aero Avengers', '26.3.3 (7/22 - 8/4)', makeMockJiraRequest());

        const unassigned = result.issues.find(i => i.key === 'AER-101');
        expect(unassigned).toBeDefined();
        expect(unassigned.assignee).toBe('Unassigned');
    });

    test('TC10: "Team Name" value in JQL matches exact teamName passed in request', async () => {
        const teamName = 'Aero Avengers';
        const result = await sprintIssuesLogic(teamName, '26.3.3 (7/22 - 8/4)', makeMockJiraRequest());

        expect(result.jql).toContain(`"Team Name" = "${teamName}"`);
    });
});

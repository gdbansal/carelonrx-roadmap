process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const https = require('https');

const API_BASE = 'https://carelonrx-roadmap.onrender.com';

const members = [
    { name: 'Rajesh Kumar Singh',         role: 'Dev Lead',  team: 'Aero Avengers', project: 'VPIE' },
    { name: 'Suvra Chakraborty',          role: 'Dev Lead',  team: 'Aero Avengers', project: 'VPIE' },
    { name: 'Dasari Haritha',             role: 'Developer', team: 'Aero Avengers', project: 'VPIE' },
    { name: 'Dhangar, Satyam',           role: 'Developer', team: 'Aero Avengers', project: 'VPIE' },
    { name: 'Pavuluru, Midhun',          role: 'Developer', team: 'Aero Avengers', project: 'VPIE' },
    { name: 'Das, Abhisek',              role: 'Developer', team: 'Aero Avengers', project: 'VPIE' },
    { name: 'Pandey, Nisha',             role: 'Developer', team: 'Aero Avengers', project: 'VPIE' },
    { name: 'Narne, Venkata Phaninder',  role: 'QA',        team: 'Aero Avengers', project: 'VPIE' },
    { name: 'Anand Rampure',             role: 'QA',        team: 'Aero Avengers', project: 'VPIE' },
    { name: 'Reddy Volgonda, Kamlakar',  role: 'QA',        team: 'Aero Avengers', project: 'VPIE' },
    { name: "D'souza Arien",             role: 'QA',        team: 'Aero Avengers', project: 'VPIE' },
];

function request(options, body) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

async function run() {
    // Step 1: login
    const loginRes = await request({
        hostname: 'carelonrx-roadmap.onrender.com',
        path: '/api/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({ username: 'admin', password: 'admin123' }));

    if (!loginRes.body.token) {
        console.error('Login failed:', loginRes.body);
        process.exit(1);
    }
    const token = loginRes.body.token;
    console.log('Logged in successfully\n');

    // Step 2: add each member
    let added = 0, failed = 0;
    for (const member of members) {
        const res = await request({
            hostname: 'carelonrx-roadmap.onrender.com',
            path: '/api/team-members',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        }, JSON.stringify(member));

        if (res.body.success) {
            console.log(`✅ Added: ${member.name}`);
            added++;
        } else {
            console.log(`❌ Failed: ${member.name} — ${res.body.message}`);
            failed++;
        }
    }

    console.log(`\nDone: ${added} added, ${failed} failed`);
}

run().catch(err => { console.error('Error:', err.message); process.exit(1); });

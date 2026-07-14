// Script to add Lines of Business to the database
// Run this with: node add-lobs.js

const API_BASE = 'https://carelonrx-roadmap.onrender.com';

// List of LOBs to add
const lobs = [
    'Elevance Health Digital Experience Product Engineering (EDEPT)',
    'Digital Tech Platform and Experience',
    'Whole Health Advocacy and Provider Experience Platform',
    'Platform Modernization and Cloud Enablement',
    'CarelonRx',
    'Digital IT',
    'Corporate IT Solutions COE',
    'Artificial Intelligence',
    'FEP - Fusion',
    'Enterprise Architecture',
    'Mgmt/Bench - AI and Digital Platform',
    'Clinical and Member Analytics',
    'Enterprise Data Analytics',
    'Provider Analytics - 1',
    'Clinical and Member Analytic Solutions',
    'Carelon Rx - Tech',
    'Shared Service and Delivery Transformation',
    'Enterprise Provider Solutions',
    'Payment Integrity & Advanced Analytics',
    'Data and Analytic Operations',
    'Provider Analytics-2',
    'Enterprise Data Analytics_1',
    'Carelon Tech - APC.PC',
    'Carelon Tech - MBM',
    'Carelon Tech - CPAS',
    'GBD IT',
    'EDA Dev Ops',
    'Reporting and Data Analysis',
    'FHPS',
    'Carelon Tech - CBH',
    'Customer and Membership Management',
    'NDA_IT Claims',
    'IT Claims',
    'NDA_Speciality IT',
    'ORMB LO',
    'Carelon MBM',
    'Health Solutions- PDS IT'
];

async function addLOBs() {
    console.log('Starting to add LOBs...');
    console.log('Total LOBs to add:', lobs.length);
    console.log('');

    // You need to replace this with your actual admin token
    const token = 'YOUR_ADMIN_TOKEN_HERE';
    
    if (token === 'YOUR_ADMIN_TOKEN_HERE') {
        console.error('ERROR: Please update the token in this script with your actual admin token');
        console.error('To get your token:');
        console.error('1. Login to the application as admin');
        console.error('2. Open browser console (F12)');
        console.error('3. Type: localStorage.getItem("token")');
        console.error('4. Copy the token and paste it in this script');
        return;
    }

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < lobs.length; i++) {
        const lobName = lobs[i];
        console.log(`[${i + 1}/${lobs.length}] Adding: ${lobName}`);

        try {
            const response = await fetch(`${API_BASE}/api/line-of-business`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: lobName,
                    description: `${lobName} line of business`
                })
            });

            const data = await response.json();

            if (data.success) {
                console.log(`✅ SUCCESS: ${lobName}`);
                successCount++;
            } else {
                if (data.message && data.message.includes('already exists')) {
                    console.log(`⏭️  SKIPPED: ${lobName} (already exists)`);
                    skippedCount++;
                } else {
                    console.log(`❌ FAILED: ${lobName} - ${data.message}`);
                    failCount++;
                }
            }
        } catch (error) {
            console.log(`❌ ERROR: ${lobName} - ${error.message}`);
            failCount++;
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('');
    console.log('=== SUMMARY ===');
    console.log(`Total LOBs: ${lobs.length}`);
    console.log(`✅ Successfully added: ${successCount}`);
    console.log(`⏭️  Skipped (already exist): ${skippedCount}`);
    console.log(`❌ Failed: ${failCount}`);
}

// Run the script
addLOBs().catch(console.error);

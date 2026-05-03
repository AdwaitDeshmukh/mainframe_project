const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Account data - change these values each time
const accountData = {
    ACCT_NUM: 'ACC0000001',
    FNAME: 'ADWAIT',
    LNAME: 'DESHMUKH',
    EMAIL: 'adwait@gmail.com',
    PIN: '1234'
};

// Paths
const templatePath = 'E:/mainframe_proj_2/addaccount_template.jcl';
const outputPath = 'E:/mainframe_proj_2/addaccount.jcl';

// Step 1: Read template
console.log('📖 Reading template...');
let jclContent = fs.readFileSync(templatePath, 'utf8');

// Step 2: Replace placeholders
console.log('✏️  Replacing placeholders...');
jclContent = jclContent.replace('{{ACCT_NUM}}', accountData.ACCT_NUM);
jclContent = jclContent.replace('{{FNAME}}', accountData.FNAME);
jclContent = jclContent.replace('{{LNAME}}', accountData.LNAME);
jclContent = jclContent.replace('{{EMAIL}}', accountData.EMAIL);
jclContent = jclContent.replace('{{PIN}}', accountData.PIN);

// Step 3: Write to output file
console.log('💾 Writing to output file...');
fs.writeFileSync(outputPath, jclContent);
console.log(`✅ JCL file created: ${outputPath}`);

// Step 4: Submit JCL
console.log('🚀 Submitting JCL to mainframe...');
try {
    const result = execSync(`zowe jobs submit local-file "${outputPath}"`, {
        encoding: 'utf8'
    });
    console.log('✅ JCL Submitted!');
    console.log(result);
    
    // Extract JOBID from output
    const jobIdMatch = result.match(/jobid: (\w+)/i);
    if (jobIdMatch) {
        const jobId = jobIdMatch[1];
        console.log(`\n📋 Job ID: ${jobId}`);
        console.log(`\nCheck status with:\nzowe jobs view job-status-by-jobid ${jobId}`);
    }
} catch (error) {
    console.error('❌ Error submitting JCL:', error.message);
}

const fs = require('fs');
const { execSync } = require('child_process');

// ─────────────────────────────────────────────
//  CHANGE THIS VALUE EACH TIME
// ─────────────────────────────────────────────
const accountData = {
    ACCT_NUM: 'ACC0000002'    // Account to check balance for
};

// Paths
const templatePath = 'E:/mainframe_proj_2/checkbal_template.jcl';
const outputPath   = 'E:/mainframe_proj_2/checkbal.jcl';

// Step 1: Read template
console.log('📖 Reading template...');
let jclContent = fs.readFileSync(templatePath, 'utf8');

// Step 2: Replace placeholder
console.log('✏️  Replacing placeholders...');
jclContent = jclContent.replace('{{ACCT_NUM}}', accountData.ACCT_NUM);

// Step 3: Write output file
console.log('💾 Writing to output file...');
fs.writeFileSync(outputPath, jclContent);
console.log(`✅ JCL file created: ${outputPath}`);

// Step 4: Submit JCL
console.log('\n🚀 Submitting JCL to mainframe...');
console.log(`   ACCOUNT : ${accountData.ACCT_NUM}`);

try {
    const result = execSync(`zowe jobs submit local-file "${outputPath}"`, {
        encoding: 'utf8'
    });
    console.log('\n✅ JCL Submitted!');
    console.log(result);

    // Extract JOBID
    const jobIdMatch = result.match(/jobid:\s+(\w+)/i);
    if (jobIdMatch) {
        const jobId = jobIdMatch[1];
        console.log(`📋 Job ID: ${jobId}`);
        console.log(`\nCheck status : zowe jobs view job-status-by-jobid ${jobId}`);
        console.log(`Check output : zowe jobs view all-spool-content ${jobId}`);
    }
} catch (error) {
    console.error('❌ Error submitting JCL:', error.message);
}

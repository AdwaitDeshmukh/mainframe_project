const fs = require('fs');
const { execSync } = require('child_process');

// ─────────────────────────────────────────────
//  CHANGE THESE VALUES EACH TIME
// ─────────────────────────────────────────────
const transferData = {
    FROM_ACCT: 'ACC0000001',   // Sender   (will be debited)
    TO_ACCT:   'ACC0000003',   // Receiver (will be credited)
    AMOUNT:    '500.00',       // Amount to transfer
};

// ─────────────────────────────────────────────
//  AUTO-GENERATE TIMESTAMP  (DB2 format)
//  e.g.  2026-05-03 03:00:00.000000
// ─────────────────────────────────────────────
function getDB2Timestamp() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm   = String(now.getMonth() + 1).padStart(2, '0');
    const dd   = String(now.getDate()).padStart(2, '0');
    const hh   = String(now.getHours()).padStart(2, '0');
    const min  = String(now.getMinutes()).padStart(2, '0');
    const ss   = String(now.getSeconds()).padStart(2, '0');
    const us   = String(now.getMilliseconds()).padStart(3, '0') + '000';
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}.${us}`;
}

// Paths
const templatePath = 'E:/mainframe_proj_2/transfer_template.jcl';
const outputPath   = 'E:/mainframe_proj_2/transfer.jcl';

// Generate timestamp
const txnDate = getDB2Timestamp();

// Step 1: Read template
console.log('📖 Reading template...');
let jclContent = fs.readFileSync(templatePath, 'utf8');

// Step 2: Replace all placeholders
console.log('✏️  Replacing placeholders...');
jclContent = jclContent.replace('{{FROM_ACCT}}', transferData.FROM_ACCT);
jclContent = jclContent.replace('{{TO_ACCT}}',   transferData.TO_ACCT);
jclContent = jclContent.replace('{{AMOUNT}}',    transferData.AMOUNT);
jclContent = jclContent.replace('{{TXN_DATE}}',  txnDate);

// Step 3: Write output file
console.log('💾 Writing to output file...');
fs.writeFileSync(outputPath, jclContent);
console.log(`✅ JCL file created: ${outputPath}`);

// Step 4: Submit JCL
console.log('\n🚀 Submitting JCL to mainframe...');
console.log(`   FROM    : ${transferData.FROM_ACCT}`);
console.log(`   TO      : ${transferData.TO_ACCT}`);
console.log(`   AMOUNT  : ${transferData.AMOUNT}`);
console.log(`   TXN DATE: ${txnDate}`);

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
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Student data - change these values each time
const studentData = {
    STUDENTID: 'S0000099',
    FIRSTNAME: 'ADWAIT',
    LASTNAME: 'DESHMUKH',
    AGE: 21
};

// Paths
const templatePath = 'E:/mainframe_proj_2/add_student_template.jcl';
const outputPath = 'E:/mainframe_proj_2/add_student.jcl';

// Step 1: Read template
console.log('📖 Reading template...');
let jclContent = fs.readFileSync(templatePath, 'utf8');

// Step 2: Replace placeholders
console.log('✏️  Replacing placeholders...');
jclContent = jclContent.replace('{{STUDENTID}}', studentData.STUDENTID);
jclContent = jclContent.replace('{{FIRSTNAME}}', studentData.FIRSTNAME);
jclContent = jclContent.replace('{{LASTNAME}}', studentData.LASTNAME);
jclContent = jclContent.replace('{{AGE}}', studentData.AGE);

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

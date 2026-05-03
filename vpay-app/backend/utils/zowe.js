const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Submit JCL file and return job ID
async function submitJCL(jclPath) {
    try {
        console.log(`📤 Submitting JCL: ${jclPath}`);
        const result = execSync(`zowe jobs submit local-file "${jclPath}"`, {
            encoding: 'utf8'
        });
        
        // Remove all ANSI codes first
        const cleanOutput = result.replace(/\u001b\[[0-9;]*m/g, '');
        console.log('DEBUG - Cleaned output:', JSON.stringify(cleanOutput));
        
        const jobIdMatch = cleanOutput.match(/jobid:\s+(\S+)/);
        if (!jobIdMatch) {
            console.log('Raw output:', result);
            throw new Error('Could not extract job ID from submission. Output: ' + result);
        }
        
        const jobId = jobIdMatch[1].trim();
        
        if (!jobId) {
            throw new Error('Job ID is empty after parsing');
        }
        
        console.log(`✅ Job submitted: ${jobId}`);
        return jobId;
    } catch (error) {
        console.error('❌ JCL submission failed:', error.message);
        throw new Error(`Failed to submit JCL: ${error.message}`);
    }
}

// Poll job status until completion
async function waitForJobCompletion(jobId, maxWaitMs = 60000) {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds
    let pollCount = 0;

    while (Date.now() - startTime < maxWaitMs) {
        try {
            pollCount++;
            console.log(`\n[Poll ${pollCount}] Checking status of ${jobId}...`);
            
            const result = execSync(`zowe jobs view job-status-by-jobid ${jobId}`, {
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'pipe']
            });

            console.log(`DEBUG - Raw status output:`, JSON.stringify(result.substring(0, 200)));
            
            // Remove ANSI codes from result
            const cleanResult = result.replace(/\u001b\[[0-9;]*m/g, '');
            console.log('DEBUG - Cleaned status:', JSON.stringify(cleanResult.substring(0, 200)));
            
            // Parse status from output
            const statusMatch = cleanResult.match(/status:\s+(\S+)/);
            const status = statusMatch ? statusMatch[1].trim().toUpperCase() : 'UNKNOWN';
            console.log(`DEBUG - Parsed status: ${status}`);

            if (status === 'OUTPUT' || status === 'ABENDED' || status === 'DONE') {
                console.log(`✅ Job ${jobId} finished with status: ${status}`);
                return { jobId, status };
            }

            console.log(`⏳ Job ${jobId} still running... status: ${status}`);
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        } catch (error) {
            console.error(`⚠️  Error checking status: ${error.message}`);
            console.log('Retrying in 2 seconds...');
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
    }

    throw new Error(`Job ${jobId} did not complete within ${maxWaitMs}ms`);
}

// Get job output/spool
async function getJobOutput(jobId) {
    try {
        const result = execSync(`zowe jobs view all-spool-content ${jobId}`, {
            encoding: 'utf8'
        });
        return result;
    } catch (error) {
        console.error('Error fetching job output:', error.message);
        return '';
    }
}

// Verify PIN for a given account number
// Submits verifypin_template.jcl, parses PIN from spool, compares with input
async function verifyPin(acctNum, inputPin) {
    try {
        console.log(`\n🔐 Verifying PIN for: ${acctNum}`);

        const templatePath = path.join(
            process.env.JCL_TEMPLATES_PATH || './jcl-templates',
            'verifypin_template.jcl'
        );

        if (!fs.existsSync(templatePath)) {
            throw new Error('verifypin_template.jcl not found');
        }

        const jclContent = generateJCL(templatePath, { ACCT_NUM: acctNum });

        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const jclPath = path.join(tempDir, `verifypin_${Date.now()}.jcl`);
        writeJCL(jclContent, jclPath);

        const jobId = await submitJCL(jclPath);
        await waitForJobCompletion(jobId);
        const output = await getJobOutput(jobId);

        // ✅ ONLY look at the SYSOUT section (RUN step output)
        // Split on "Spool file: SYSOUT" to get only program output
        const spoolParts = output.split('Spool file:');
        const sysoutSection = spoolParts.find(part => part.includes('SYSOUT') && part.includes('Step: RUN'));
        const programOutput = sysoutSection || output;

        console.log('DEBUG PROGRAM OUTPUT:', programOutput.substring(0, 300));

        // Check account not found only in program output
        if (programOutput.includes('ACCOUNT NOT FOUND')) {
            return { valid: false, reason: 'Account not found' };
        }

        // Parse PIN only from program output
        const pinMatch = programOutput.match(/PIN\s*:\s*(\S+)/);
        console.log('DEBUG PIN MATCH:', pinMatch);

        if (!pinMatch) {
            return { valid: false, reason: 'Could not read PIN from output' };
        }

        const storedPin = pinMatch[1].replace(/\s+/g, '').trim();
        const isValid = storedPin === inputPin.replace(/\s+/g, '').trim();

        console.log(`🔐 Stored PIN: "${storedPin}" | Input PIN: "${inputPin.trim()}"`);
        console.log(`🔐 PIN check: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
        return { valid: isValid, reason: isValid ? 'PIN matched' : 'Incorrect PIN' };

    } catch (error) {
        console.error('verifyPin error:', error.message);
        throw new Error(`PIN verification failed: ${error.message}`);
    }
}

// Generate JCL from template with replacements
function generateJCL(templatePath, replacements) {
    try {
        let jclContent = fs.readFileSync(templatePath, 'utf8');

        for (const [key, value] of Object.entries(replacements)) {
            const placeholder = `{{${key}}}`;
            jclContent = jclContent.replace(new RegExp(placeholder, 'g'), value);
        }

        return jclContent;
    } catch (error) {
        throw new Error(`Failed to read template: ${error.message}`);
    }
}

// Write JCL to file
function writeJCL(jclContent, outputPath) {
    try {
        fs.writeFileSync(outputPath, jclContent, 'utf8');
        console.log(`💾 JCL written to: ${outputPath}`);
        return outputPath;
    } catch (error) {
        throw new Error(`Failed to write JCL: ${error.message}`);
    }
}

module.exports = {
    submitJCL,
    waitForJobCompletion,
    getJobOutput,
    verifyPin,
    generateJCL,
    writeJCL
};
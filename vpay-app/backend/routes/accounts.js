const express = require('express');
const path = require('path');
const fs = require('fs');
const { generateJCL, writeJCL, submitJCL, waitForJobCompletion, getJobOutput, verifyPin } = require('../utils/zowe');
const { sendWelcomeMail } = require('../utils/mailer');

const router = express.Router();

function getNextAcctNum() {
    const dataDir     = path.join(__dirname, '../data');
    const counterFile = path.join(dataDir, 'counter.json');

    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    let counter = 1;
    if (fs.existsSync(counterFile)) {
        counter = JSON.parse(fs.readFileSync(counterFile, 'utf8')).count;
    }

    fs.writeFileSync(counterFile, JSON.stringify({ count: counter + 1 }), 'utf8');

    return 'ACC' + String(counter).padStart(7, '0');
}

router.post('/create', async (req, res) => {
    try {
        const { fname, lname, email, pin } = req.body;

        if (!fname || !lname || !email || !pin) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (pin.length !== 4) {
            return res.status(400).json({ error: 'PIN must be 4 digits' });
        }

        const acctNum = getNextAcctNum();
        console.log(`\n📝 Creating account: ${acctNum}`);

        const templatePath = path.join(process.env.JCL_TEMPLATES_PATH || './jcl-templates', 'addaccount_template.jcl');

        if (!fs.existsSync(templatePath)) {
            return res.status(500).json({ error: 'JCL template not found' });
        }

        const jclContent = generateJCL(templatePath, {
            ACCT_NUM: acctNum,
            FNAME: fname.toUpperCase().padEnd(15),
            LNAME: lname.toUpperCase().padEnd(20),
            EMAIL: email.toLowerCase(),
            PIN: pin
        });

        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const jclPath = path.join(tempDir, `addacct_${Date.now()}.jcl`);
        writeJCL(jclContent, jclPath);

        const jobId = await submitJCL(jclPath);
        const jobStatus = await waitForJobCompletion(jobId);
        const output = await getJobOutput(jobId);

        try {
            await sendWelcomeMail({
                email,
                fname: fname.toUpperCase(),
                lname: lname.toUpperCase(),
                acctNum,
                pin
            });
        } catch (mailErr) {
            console.error('⚠️  Welcome email failed:', mailErr.message);
        }

        res.json({
            success: true,
            acctNum,
            jobId,
            status: jobStatus.status,
            message: 'Account created successfully'
        });

    } catch (error) {
        console.error('Create account error:', error);
        res.status(500).json({ error: 'Failed to create account', details: error.message });
    }
});

router.get('/:acctNum/balance', async (req, res) => {
    try {
        const { acctNum } = req.params;
        const { pin } = req.query;

        if (!pin) {
            return res.status(400).json({ error: 'PIN is required' });
        }

        const pinCheck = await verifyPin(acctNum, pin);
        console.log('PIN CHECK RESULT:', JSON.stringify(pinCheck));
        console.log('INPUT PIN:', JSON.stringify(pin));

        if (!pinCheck.valid) {
            return res.status(401).json({ error: 'Invalid PIN', reason: pinCheck.reason });
        }

        const result = await fetchBalance(acctNum);
        res.json(result);

    } catch (error) {
        console.error('Check balance error:', error);
        res.status(500).json({ error: 'Failed to check balance', details: error.message });
    }
});

async function fetchBalance(acctNum) {
    console.log(`\n💰 Checking balance for: ${acctNum}`);

    const templatePath = path.join(process.env.JCL_TEMPLATES_PATH || './jcl-templates', 'checkbal_template.jcl');

    if (!fs.existsSync(templatePath)) {
        throw new Error('JCL template not found');
    }

    const jclContent = generateJCL(templatePath, { ACCT_NUM: acctNum });

    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const jclPath = path.join(tempDir, `chkbal_${Date.now()}.jcl`);
    writeJCL(jclContent, jclPath);

    const jobId = await submitJCL(jclPath);
    const jobStatus = await waitForJobCompletion(jobId);
    const output = await getJobOutput(jobId);

    const balanceMatch = output.match(/BALANCE\s+:\s+([\d., ]+)/);
    const balance = balanceMatch ? balanceMatch[1].trim() : null;

    const nameMatch = output.match(/NAME\s+:\s+([A-Z\s]+)/);
    const name = nameMatch ? nameMatch[1].trim() : 'Unknown';

    return { success: true, acctNum, name, balance, jobId, status: jobStatus.status };
}

router.fetchBalance = fetchBalance;

module.exports = router;
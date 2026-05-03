const express = require('express');
const path = require('path');
const fs = require('fs');
const { generateJCL, writeJCL, submitJCL, waitForJobCompletion, getJobOutput, verifyPin } = require('../utils/zowe');
const { sendDebitMail, sendCreditMail } = require('../utils/mailer');

const router = express.Router();

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

// Helper: fetch user email + name from verifypin spool
async function getUserDetails(acctNum) {
    try {
        const templatePath = path.join(
            process.env.JCL_TEMPLATES_PATH || './jcl-templates',
            'verifypin_template.jcl'
        );
        const jclContent = generateJCL(templatePath, { ACCT_NUM: acctNum });
        const tempDir = path.join(__dirname, '../temp');
        const jclPath = path.join(tempDir, `verifpin_${Date.now()}.jcl`);
        fs.writeFileSync(jclPath, jclContent);

        const jobId = await submitJCL(jclPath);
        await waitForJobCompletion(jobId);
        const output = await getJobOutput(jobId);

        const spoolParts = output.split('Spool file:');
        const sysoutSection = spoolParts.find(p => p.includes('SYSOUT') && p.includes('Step: RUN')) || output;

        const fnameMatch = sysoutSection.match(/FNAME\s*:\s*(\S+)/);
        const lnameMatch = sysoutSection.match(/LNAME\s*:\s*(\S+)/);
        const emailMatch = sysoutSection.match(/EMAIL\s*:\s*(\S+)/);

        return {
            fname: fnameMatch ? fnameMatch[1].trim() : '',
            lname: lnameMatch ? lnameMatch[1].trim() : '',
            email: emailMatch ? emailMatch[1].trim() : null
        };
    } catch (e) {
        console.error(`⚠️  Could not fetch user details for ${acctNum}:`, e.message);
        return { fname: '', lname: '', email: null };
    }
}

// POST /api/transactions/transfer
router.post('/transfer', async (req, res) => {
    try {
        const { fromAcct, toAcct, amount, pin } = req.body;

        if (!fromAcct || !toAcct || !amount || !pin) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (parseFloat(amount) <= 0) {
            return res.status(400).json({ error: 'Amount must be greater than 0' });
        }

        if (fromAcct === toAcct) {
            return res.status(400).json({ error: 'Cannot transfer to same account' });
        }

        console.log(`\n💸 Transfer: ${fromAcct} -> ${toAcct}, Amount: ${amount}`);

        // STEP 1: Verify sender PIN
        const pinCheck = await verifyPin(fromAcct, pin);
        if (!pinCheck.valid) {
            return res.status(401).json({ success: false, error: 'Invalid PIN' });
        }

        // STEP 2: Check sender balance
        const { fetchBalance } = require('./accounts');
        const balanceResult = await fetchBalance(fromAcct);

        if (!balanceResult.balance) {
            return res.status(400).json({ success: false, error: 'Could not fetch sender balance.' });
        }

        const currentBalance = parseFloat(balanceResult.balance.replace(/,/g, ''));
        const transferAmount = parseFloat(amount);

        if (transferAmount > currentBalance) {
            return res.status(400).json({
                success: false,
                error: `Insufficient balance. Available: ₹${currentBalance.toFixed(2)}, Requested: ₹${transferAmount.toFixed(2)}`
            });
        }

        // STEP 3: Submit transfer JCL
        const templatePath = path.join(process.env.JCL_TEMPLATES_PATH || './jcl-templates', 'transfer_template.jcl');

        if (!fs.existsSync(templatePath)) {
            return res.status(500).json({ error: 'JCL template not found' });
        }

        const txnDate = getDB2Timestamp();
        const jclContent = generateJCL(templatePath, {
            FROM_ACCT: fromAcct,
            TO_ACCT:   toAcct,
            AMOUNT:    parseFloat(amount).toFixed(2),
            TXN_DATE:  txnDate
        });

        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const jclPath = path.join(tempDir, `transfer_${Date.now()}.jcl`);
        fs.writeFileSync(jclPath, jclContent);

        const jobId = await submitJCL(jclPath);
        const jobStatus = await waitForJobCompletion(jobId);

        console.log(`✅ Transfer job ${jobId} completed: ${jobStatus.status}`);

        // STEP 4: Send emails (non-blocking)
        Promise.all([
            getUserDetails(fromAcct),
            getUserDetails(toAcct)
        ]).then(async ([sender, receiver]) => {
            try {
                // Debit email to sender
                if (sender.email) {
                    await sendDebitMail({
                        email:    sender.email,
                        fname:    sender.fname,
                        fromAcct, toAcct, amount, txnDate
                    });
                }

                // Credit email to receiver
                if (receiver.email) {
                    await sendCreditMail({
                        email:    receiver.email,
                        fname:    receiver.fname,
                        fromAcct, toAcct, amount, txnDate
                    });
                }
            } catch (mailErr) {
                console.error('⚠️  Transfer email failed:', mailErr.message);
            }
        });

        return res.json({
            success: true,
            fromAcct, toAcct, amount, txnDate,
            jobId,
            status: jobStatus.status,
            message: 'Transfer completed successfully'
        });

    } catch (error) {
        console.error('Transfer error:', error);
        res.status(500).json({ error: 'Transfer failed', details: error.message });
    }
});

module.exports = router;
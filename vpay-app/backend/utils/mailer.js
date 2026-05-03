const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

function vpayHeader() {
    return `
    <div style="background:#4f46e5;padding:32px;text-align:center;">
        <h1 style="color:white;margin:0;font-size:28px;letter-spacing:2px;">VPay</h1>
        <p style="color:#c7d2fe;margin:6px 0 0;font-size:13px;">Powered by IBM Mainframe</p>
    </div>`;
}

function vpayFooter() {
    return `
    <div style="background:#f3f4f6;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">
            &copy; 2026 VPay. All rights reserved.<br/>
            This is an automated message. Please do not reply.
        </p>
    </div>`;
}

function infoRow(label, value, valueColor) {
    return `
    <tr>
        <td style="padding:10px 0;color:#6b7280;font-size:14px;border-bottom:1px solid #f3f4f6;">${label}</td>
        <td style="padding:10px 0;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #f3f4f6;color:${valueColor || '#111827'};">${value}</td>
    </tr>`;
}

// ── WELCOME EMAIL ─────────────────────────────────────────
async function sendWelcomeMail({ email, fname, lname, acctNum, pin }) {
    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        ${vpayHeader()}
        <div style="padding:32px;">
            <p style="font-size:16px;color:#111827;">Hi <strong>${fname} ${lname}</strong>,</p>
            <p style="color:#6b7280;font-size:14px;line-height:1.6;">
                Welcome to VPay! Your account has been created successfully. 
                Here are your account details — keep them safe.
            </p>

            <div style="background:#f9fafb;border-radius:10px;padding:24px;margin:24px 0;border:1px solid #e5e7eb;">
                <h3 style="margin:0 0 16px;color:#4f46e5;font-size:15px;">Account Details</h3>
                <table style="width:100%;border-collapse:collapse;">
                    ${infoRow('Account Number', acctNum, '#4f46e5')}
                    ${infoRow('Full Name', `${fname} ${lname}`)}
                    ${infoRow('Email', email)}
                    ${infoRow('PIN', pin, '#dc2626')}
                    ${infoRow('Opening Balance', '₹ 0.00', '#059669')}
                </table>
            </div>

            <div style="background:#fef3c7;border-radius:8px;padding:16px;border-left:4px solid #f59e0b;margin-bottom:24px;">
                <p style="margin:0;font-size:13px;color:#92400e;">
                    <strong>Security Notice:</strong> Never share your PIN with anyone. 
                    VPay will never ask for your PIN over phone or email.
                </p>
            </div>

            <p style="color:#6b7280;font-size:14px;">
                You can now send money, check your balance, and view transactions using VPay.
            </p>
        </div>
        ${vpayFooter()}
    </div>`;

    await transporter.sendMail({
        from: `"VPay" <${process.env.MAIL_USER}>`,
        to: email,
        subject: '🎉 Welcome to VPay – Your Account is Ready!',
        html
    });

    console.log(`📧 Welcome email sent to ${email}`);
}

// ── DEBIT NOTIFICATION ────────────────────────────────────
async function sendDebitMail({ email, fname, fromAcct, toAcct, amount, txnDate, balanceAfter }) {
    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        ${vpayHeader()}
        <div style="padding:32px;">
            <div style="background:#fef2f2;border-radius:10px;padding:20px;text-align:center;margin-bottom:24px;border:1px solid #fecaca;">
                <p style="margin:0;font-size:13px;color:#991b1b;">Amount Debited</p>
                <p style="margin:8px 0 0;font-size:36px;font-weight:700;color:#dc2626;">- ₹${parseFloat(amount).toFixed(2)}</p>
            </div>

            <p style="font-size:16px;color:#111827;">Hi <strong>${fname}</strong>,</p>
            <p style="color:#6b7280;font-size:14px;">
                A transfer has been made from your VPay account.
            </p>

            <div style="background:#f9fafb;border-radius:10px;padding:24px;margin:24px 0;border:1px solid #e5e7eb;">
                <h3 style="margin:0 0 16px;color:#111827;font-size:15px;">Transaction Details</h3>
                <table style="width:100%;border-collapse:collapse;">
                    ${infoRow('From Account', fromAcct)}
                    ${infoRow('To Account', toAcct)}
                    ${infoRow('Amount', `- ₹${parseFloat(amount).toFixed(2)}`, '#dc2626')}
                    ${infoRow('Date & Time', txnDate)}
                    ${balanceAfter ? infoRow('Balance After', `₹${balanceAfter}`, '#059669') : ''}
                </table>
            </div>

            <div style="background:#fef3c7;border-radius:8px;padding:16px;border-left:4px solid #f59e0b;">
                <p style="margin:0;font-size:13px;color:#92400e;">
                    If you did not initiate this transfer, please contact VPay support immediately.
                </p>
            </div>
        </div>
        ${vpayFooter()}
    </div>`;

    await transporter.sendMail({
        from: `"VPay" <${process.env.MAIL_USER}>`,
        to: email,
        subject: `💸 VPay – ₹${parseFloat(amount).toFixed(2)} Debited from your account`,
        html
    });

    console.log(`📧 Debit email sent to ${email}`);
}

// ── CREDIT NOTIFICATION ───────────────────────────────────
async function sendCreditMail({ email, fname, fromAcct, toAcct, amount, txnDate, balanceAfter }) {
    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        ${vpayHeader()}
        <div style="padding:32px;">
            <div style="background:#f0fdf4;border-radius:10px;padding:20px;text-align:center;margin-bottom:24px;border:1px solid #bbf7d0;">
                <p style="margin:0;font-size:13px;color:#166534;">Amount Credited</p>
                <p style="margin:8px 0 0;font-size:36px;font-weight:700;color:#16a34a;">+ ₹${parseFloat(amount).toFixed(2)}</p>
            </div>

            <p style="font-size:16px;color:#111827;">Hi <strong>${fname}</strong>,</p>
            <p style="color:#6b7280;font-size:14px;">
                You have received money in your VPay account.
            </p>

            <div style="background:#f9fafb;border-radius:10px;padding:24px;margin:24px 0;border:1px solid #e5e7eb;">
                <h3 style="margin:0 0 16px;color:#111827;font-size:15px;">Transaction Details</h3>
                <table style="width:100%;border-collapse:collapse;">
                    ${infoRow('From Account', fromAcct)}
                    ${infoRow('To Account', toAcct)}
                    ${infoRow('Amount', `+ ₹${parseFloat(amount).toFixed(2)}`, '#16a34a')}
                    ${infoRow('Date & Time', txnDate)}
                    ${balanceAfter ? infoRow('Balance After', `₹${balanceAfter}`, '#059669') : ''}
                </table>
            </div>
        </div>
        ${vpayFooter()}
    </div>`;

    await transporter.sendMail({
        from: `"VPay" <${process.env.MAIL_USER}>`,
        to: email,
        subject: `✅ VPay – ₹${parseFloat(amount).toFixed(2)} Credited to your account`,
        html
    });

    console.log(`📧 Credit email sent to ${email}`);
}

module.exports = { sendWelcomeMail, sendDebitMail, sendCreditMail };
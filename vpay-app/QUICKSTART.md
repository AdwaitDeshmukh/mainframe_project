# VPay Quick Start

## ⚡ 30-Second Setup

### 1. Copy JCL Templates
```bash
mkdir -p backend/jcl-templates
# Copy your 3 JCL files into this folder:
# - addaccount_template.jcl
# - transfer_template.jcl
# - checkbal_template.jcl
```

### 2. Setup Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your Zowe credentials
npm install
npm start
# Runs on http://localhost:5000
```

### 3. Setup Frontend (new terminal)
```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
```

### 4. Use the App
- Go to http://localhost:3000
- Fill form → Click button → Watch magic happen ✨

---

## 🎯 What Each Tab Does

### Create Account
- Enter name, email, PIN
- Backend generates account number
- Submits ADDACCT JCL to mainframe
- Creates row in USERS table + initial wallet

### Check Balance
- Enter account number
- Backend runs CHKBAL JCL
- Shows user name + current balance

### Transfer
- Enter sender, receiver, amount
- Backend submits TRANSFER JCL
- Debits sender, credits receiver, logs both transactions

---

## ❌ Troubleshooting

**"JCL template not found"**
→ Copy `addaccount_template.jcl` to `backend/jcl-templates/`

**"Cannot find module 'zowe'"**
→ You need `zowe` CLI installed separately: `npm install -g @zowe/cli`

**"Connection refused on port 5000"**
→ Backend not running. Do `npm start` in `backend/` folder

**"Cannot GET /api/accounts/create"**
→ Backend not started, or route is broken. Check console logs

---

## 📂 Files to Keep Synced

Your local JCL templates must match placeholders in code:

| File | Placeholders | Backend Route |
|------|-------------|---------------|
| addaccount_template.jcl | {{ACCT_NUM}}, {{FNAME}}, {{LNAME}}, {{EMAIL}}, {{PIN}} | POST /api/accounts/create |
| checkbal_template.jcl | {{ACCT_NUM}} | GET /api/accounts/:acctNum/balance |
| transfer_template.jcl | {{FROM_ACCT}}, {{TO_ACCT}}, {{AMOUNT}}, {{TXN_DATE}} | POST /api/transactions/transfer |

---

## 🎨 Customizing UI

Colors defined in `frontend/src/App.css`:
- Primary: `#667eea` (purple)
- Secondary: `#764ba2` (darker purple)
- Success: `#28a745` (green)

Edit any hex color to rebrand VPay!

---

Good to go? Open http://localhost:3000 and start testing! 🚀

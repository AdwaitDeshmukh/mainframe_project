# VPay - Digital Wallet Web App

Complete web-based wallet system connecting React frontend → Node.js backend → Mainframe DB2 via Zowe.

## 📁 Project Structure

```
vpay-app/
├── backend/              # Node.js Express API
│   ├── server.js        # Main server file
│   ├── package.json
│   ├── .env.example
│   ├── utils/
│   │   └── zowe.js      # Zowe JCL submission utilities
│   ├── routes/
│   │   ├── accounts.js  # Account creation & balance check
│   │   └── transactions.js  # Transfer operations
│   ├── temp/            # Temporary JCL files (auto-created)
│   └── jcl-templates/   # JCL template files (you need to copy these)
│
└── frontend/            # React UI
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── App.js
        ├── App.css
        └── components/
            ├── CreateAccount.js
            ├── CheckBalance.js
            └── Transfer.js
```

## 🚀 Setup Instructions

### Step 1: Copy JCL Template Files

Copy your existing JCL templates from your local project:

```bash
mkdir -p backend/jcl-templates

# Copy these files to backend/jcl-templates/
- addaccount_template.jcl
- transfer_template.jcl
- checkbal_template.jcl
```

### Step 2: Configure Backend Environment

```bash
cd backend

# Copy and edit .env file
cp .env.example .env

# Edit .env with your Zowe credentials:
ZOWE_HOST=your_mainframe_host
ZOWE_PORT=your_port
ZOWE_USER=your_username
ZOWE_PASSWORD=your_password
JCL_TEMPLATES_PATH=./jcl-templates
PORT=5000
NODE_ENV=development
```

### Step 3: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in new terminal)
cd frontend
npm install
```

### Step 4: Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# Server will run on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
# React app will run on http://localhost:3000
```

## 📡 API Endpoints

### Create Account
```
POST /api/accounts/create
Body: {
    "fname": "Adwait",
    "lname": "Deshmukh",
    "email": "adwait@gmail.com",
    "pin": "1234"
}
Response: {
    "success": true,
    "acctNum": "ACC0123456789",
    "jobId": "JOB12345",
    "status": "OUTPUT"
}
```

### Check Balance
```
GET /api/accounts/{acctNum}/balance
Response: {
    "success": true,
    "acctNum": "ACC0000001",
    "name": "ADWAIT DESHMUKH",
    "balance": "500.00",
    "jobId": "JOB12345"
}
```

### Transfer Money
```
POST /api/transactions/transfer
Body: {
    "fromAcct": "ACC0000001",
    "toAcct": "ACC0000002",
    "amount": "500.00"
}
Response: {
    "success": true,
    "fromAcct": "ACC0000001",
    "toAcct": "ACC0000002",
    "amount": "500.00",
    "txnDate": "2026-05-03 13:36:54.234000",
    "jobId": "JOB12345"
}
```

## 🔧 How It Works

1. **User fills form in React UI** → Click "Create Account", "Check Balance", or "Transfer"

2. **Frontend sends HTTP request** → To Node.js backend API

3. **Backend processes request**:
   - Reads JCL template file
   - Replaces placeholders with user input
   - Writes filled JCL to temp file
   - Submits JCL to mainframe via `zowe jobs submit`

4. **Mainframe executes COBOL**:
   - ADDACCT: Inserts user + wallet into DB2
   - TRANSFER: Debits sender, credits receiver, logs transactions
   - CHKBAL: Fetches user + balance data

5. **Backend waits for job completion**:
   - Polls job status every 2 seconds (max 30 seconds)
   - Fetches output/spool content via `zowe jobs view`
   - Parses results and returns to frontend

6. **Frontend displays results** → User sees account number, balance, or transfer confirmation

## ⚙️ Important Notes

### JCL Templates Required

You MUST have these three files in `backend/jcl-templates/`:
- `addaccount_template.jcl` (from your ADDACCT JCL with `{{ACCT_NUM}}`, `{{FNAME}}`, etc. placeholders)
- `transfer_template.jcl` (from your TRANSFER JCL with `{{FROM_ACCT}}`, `{{TO_ACCT}}`, `{{AMOUNT}}` placeholders)
- `checkbal_template.jcl` (from your CHKBAL JCL with `{{ACCT_NUM}}` placeholder)

### Zowe CLI Required

Backend needs `zowe` CLI installed and configured:
```bash
npm install -g @zowe/cli
zowe config init
```

### Database Connection

The backend does NOT connect to DB2 directly. It submits COBOL JCL programs that do. Your mainframe job does the DB2 work.

## 🐛 Debugging

### Check Backend Logs
```bash
# Look for JCL submission and job polling logs
npm run dev  # Uses nodemon for auto-reload
```

### Check Frontend Console
```bash
# Open browser DevTools (F12)
# Check Network tab for API responses
# Check Console for errors
```

### Check Zowe CLI
```bash
# Verify Zowe is configured
zowe config list

# Test job submission manually
zowe jobs submit local-file "/path/to/jcl/file.jcl"
```

## 📝 Customization

### Add More Operations
To add new operations (e.g., Withdraw, Deposit, Transaction History):
1. Create new COBOL program + JCL template
2. Add new route in `backend/routes/`
3. Add new tab/component in `frontend/src/components/`

### Change Frontend Design
Edit `frontend/src/App.css` for colors, fonts, layout.

### Change API Behavior
Edit `backend/routes/accounts.js` and `backend/routes/transactions.js`

## 🔐 Security Notes (For Production)

- ❌ **Don't** commit `.env` file (add to `.gitignore`)
- ❌ **Don't** store passwords in code (use environment variables)
- ❌ **Don't** expose job IDs to users in production
- ✅ **Do** add JWT authentication
- ✅ **Do** validate all inputs server-side
- ✅ **Do** use HTTPS in production

## 📞 Support

If you hit issues:
1. Check that JCL templates exist in `backend/jcl-templates/`
2. Check `.env` credentials are correct
3. Check `zowe` CLI is installed and configured
4. Check mainframe connectivity (ping, Zowe test)
5. Check backend is running on port 5000
6. Check React dev server is running on port 3000

Good luck! 🚀

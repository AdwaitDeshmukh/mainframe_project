import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import CreateAccount from './components/CreateAccount';
import CheckBalance from './components/CheckBalance';
import Transfer from './components/Transfer';

function App() {
    const [activeTab, setActiveTab] = useState('create');
    const [latestAcct, setLatestAcct] = useState(null);

    return (
        <div className="app-container">
            <div className="app-card">
                <div className="app-header">
                    <h1>💳 VPay</h1>
                    <p>Digital Wallet System</p>
                </div>

                <div className="tabs">
                    <button 
                        className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
                        onClick={() => setActiveTab('create')}
                    >
                        Create Account
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'balance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('balance')}
                    >
                        Check Balance
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'transfer' ? 'active' : ''}`}
                        onClick={() => setActiveTab('transfer')}
                    >
                        Transfer
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'create' && (
                        <CreateAccount onSuccess={(acctNum) => {
                            setLatestAcct(acctNum);
                        }} />
                    )}
                    {activeTab === 'balance' && (
                        <CheckBalance latestAcct={latestAcct} />
                    )}
                    {activeTab === 'transfer' && (
                        <Transfer />
                    )}
                </div>

                {latestAcct && (
                    <div className="info-box">
                        📌 Latest Account: <strong>{latestAcct}</strong>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;

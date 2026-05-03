import React, { useState } from 'react';
import axios from 'axios';

function CheckBalance({ latestAcct }) {
    const [acctNum, setAcctNum] = useState(latestAcct || '');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [result, setResult] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setResult(null);

        try {
            if (!acctNum.trim()) {
                setMessage({ type: 'error', text: 'Account number is required' });
                setLoading(false);
                return;
            }

            if (!pin || pin.length !== 4) {
                setMessage({ type: 'error', text: 'PIN must be 4 digits' });
                setLoading(false);
                return;
            }

            setMessage({ type: 'info', text: '⏳ Fetching balance...' });

            const response = await axios.get(`/api/accounts/${acctNum}/balance?pin=${pin}`);

            if (response.data.success) {
                setResult(response.data);
                setMessage({ type: 'success', text: '✅ Balance fetched' });
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.response?.data?.details || error.message;
            setMessage({ type: 'error', text: `❌ ${errorMsg}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 style={{ marginBottom: '20px', color: '#333' }}>Check Balance</h2>

            {message && (
                <div className={`${message.type}-message`}>
                    {message.type === 'info' ? (
                        <span className="loading">
                            <span className="spinner"></span>
                            {message.text}
                        </span>
                    ) : (
                        message.text
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Account Number</label>
                    <input 
                        type="text" 
                        value={acctNum}
                        onChange={(e) => setAcctNum(e.target.value)}
                        placeholder="e.g., ACC0000001"
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label>PIN</label>
                    <input 
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="****"
                        maxLength="4"
                        disabled={loading}
                    />
                </div>

                <button 
                    type="submit" 
                    className="button-primary"
                    disabled={loading}
                >
                    {loading ? 'Fetching...' : 'Check Balance'}
                </button>
            </form>

            {result && (
                <div className="result-card">
                    <h3>💰 Account Information</h3>
                    <div className="result-item">
                        <span className="result-label">Account Number:</span>
                        <span className="result-value">{result.acctNum}</span>
                    </div>
                    <div className="result-item">
                        <span className="result-label">Name:</span>
                        <span className="result-value">{result.name}</span>
                    </div>
                    <div className="result-item">
                        <span className="result-label">Balance:</span>
                        <span className="result-value" style={{ color: '#28a745', fontSize: '1.2em' }}>
                            ₹ {result.balance}
                        </span>
                    </div>
                    <div className="result-item">
                        <span className="result-label">Job ID:</span>
                        <span className="result-value">{result.jobId}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CheckBalance;
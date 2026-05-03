import React, { useState } from 'react';
import axios from 'axios';

function Transfer() {
    const [formData, setFormData] = useState({
        fromAcct: '',
        toAcct: '',
        amount: '',
        pin: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [result, setResult] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setResult(null);

        try {
            // Validate
            if (!formData.fromAcct.trim() || !formData.toAcct.trim() || !formData.amount.trim()) {
                setMessage({ type: 'error', text: 'All fields are required' });
                setLoading(false);
                return;
            }

            if (!formData.pin || formData.pin.length !== 4) {
                setMessage({ type: 'error', text: 'PIN must be 4 digits' });
                setLoading(false);
                return;
            }

            if (parseFloat(formData.amount) <= 0) {
                setMessage({ type: 'error', text: 'Amount must be greater than 0' });
                setLoading(false);
                return;
            }

            if (formData.fromAcct === formData.toAcct) {
                setMessage({ type: 'error', text: 'Cannot transfer to the same account' });
                setLoading(false);
                return;
            }

            setMessage({ type: 'info', text: '⏳ Processing transfer... This may take a few seconds' });

            const response = await axios.post('/api/transactions/transfer', {
                fromAcct: formData.fromAcct,
                toAcct: formData.toAcct,
                amount: parseFloat(formData.amount),
                pin: formData.pin
            });

            if (response.data.success) {
                setResult(response.data);
                setMessage({ type: 'success', text: '✅ Transfer completed successfully' });
                
                // Reset form
                setFormData({
                    fromAcct: '',
                    toAcct: '',
                    amount: '',
                    pin: ''
                });
            } else {
                setMessage({ type: 'error', text: '❌ ' + (response.data.error || 'Transfer failed') });
            }
        } catch (error) {
            console.log('Error response:', error.response);
            
            if (error.response && error.response.data) {
                const errorData = error.response.data;
                const errorMsg = errorData.error || errorData.message || 'Transfer failed';
                setMessage({ type: 'error', text: `❌ ${errorMsg}` });
            } else {
                setMessage({ type: 'error', text: `❌ ${error.message}` });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 style={{ marginBottom: '20px', color: '#333' }}>Transfer Money</h2>

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
                    <label>From Account (Sender)</label>
                    <input 
                        type="text" 
                        name="fromAcct"
                        value={formData.fromAcct}
                        onChange={handleChange}
                        placeholder="e.g., ACC0000001"
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label>Sender PIN</label>
                    <input 
                        type="password"
                        name="pin"
                        value={formData.pin}
                        onChange={handleChange}
                        placeholder="****"
                        maxLength="4"
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label>To Account (Receiver)</label>
                    <input 
                        type="text" 
                        name="toAcct"
                        value={formData.toAcct}
                        onChange={handleChange}
                        placeholder="e.g., ACC0000002"
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label>Amount (₹)</label>
                    <input 
                        type="number" 
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        placeholder="e.g., 500.00"
                        step="0.01"
                        min="0"
                        disabled={loading}
                    />
                </div>

                <button 
                    type="submit" 
                    className="button-primary"
                    disabled={loading}
                >
                    {loading ? 'Processing...' : 'Transfer'}
                </button>
            </form>

            {result && (
                <div className="result-card">
                    <h3>✅ Transfer Successful</h3>
                    <div className="result-item">
                        <span className="result-label">From:</span>
                        <span className="result-value">{result.fromAcct}</span>
                    </div>
                    <div className="result-item">
                        <span className="result-label">To:</span>
                        <span className="result-value">{result.toAcct}</span>
                    </div>
                    <div className="result-item">
                        <span className="result-label">Amount:</span>
                        <span className="result-value">₹ {parseFloat(result.amount).toFixed(2)}</span>
                    </div>
                    <div className="result-item">
                        <span className="result-label">Date & Time:</span>
                        <span className="result-value" style={{ fontSize: '0.9em' }}>{result.txnDate}</span>
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

export default Transfer;
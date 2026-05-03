import React, { useState } from 'react';
import axios from 'axios';

function CreateAccount({ onSuccess }) {
    const [formData, setFormData] = useState({
        fname: '',
        lname: '',
        email: '',
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
            if (!formData.fname.trim() || !formData.lname.trim() || !formData.email.trim() || !formData.pin.trim()) {
                setMessage({ type: 'error', text: 'All fields are required' });
                setLoading(false);
                return;
            }

            if (formData.pin.length !== 4) {
                setMessage({ type: 'error', text: 'PIN must be exactly 4 digits' });
                setLoading(false);
                return;
            }

            if (!formData.email.includes('@')) {
                setMessage({ type: 'error', text: 'Invalid email address' });
                setLoading(false);
                return;
            }

            setMessage({ type: 'info', text: '⏳ Creating account... This may take a few seconds' });

            const response = await axios.post('/api/accounts/create', formData);

            if (response.data.success) {
                setResult(response.data);
                setMessage({ type: 'success', text: `✅ Account created: ${response.data.acctNum}` });
                onSuccess(response.data.acctNum);
                
                // Reset form
                setFormData({
                    fname: '',
                    lname: '',
                    email: '',
                    pin: ''
                });
            }
        } catch (error) {
            const errorMsg = error.response?.data?.details || error.message;
            setMessage({ type: 'error', text: `❌ Error: ${errorMsg}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 style={{ marginBottom: '20px', color: '#333' }}>Create New Account</h2>

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
                    <label>First Name</label>
                    <input 
                        type="text" 
                        name="fname"
                        value={formData.fname}
                        onChange={handleChange}
                        placeholder="e.g., Adwait"
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label>Last Name</label>
                    <input 
                        type="text" 
                        name="lname"
                        value={formData.lname}
                        onChange={handleChange}
                        placeholder="e.g., Deshmukh"
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label>Email</label>
                    <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="e.g., adwait@gmail.com"
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label>PIN (4 digits)</label>
                    <input 
                        type="password" 
                        name="pin"
                        maxLength="4"
                        value={formData.pin}
                        onChange={handleChange}
                        placeholder="****"
                        disabled={loading}
                    />
                </div>

                <button 
                    type="submit" 
                    className="button-primary"
                    disabled={loading}
                >
                    {loading ? 'Creating...' : 'Create Account'}
                </button>
            </form>

            {result && (
                <div className="result-card">
                    <h3>✅ Account Created Successfully</h3>
                    <div className="result-item">
                        <span className="result-label">Account Number:</span>
                        <span className="result-value">{result.acctNum}</span>
                    </div>
                    <div className="result-item">
                        <span className="result-label">Job ID:</span>
                        <span className="result-value">{result.jobId}</span>
                    </div>
                    <div className="result-item">
                        <span className="result-label">Status:</span>
                        <span className="result-value">{result.status}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CreateAccount;

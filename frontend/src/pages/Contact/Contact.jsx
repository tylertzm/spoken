import React, { useState } from 'react';
import './contact.css';

const Contact = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        company: '',
        role: '',
        message: '',
        agreeToTerms: false
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
        // Add your form submission logic here
    };

    return (
        <div className="contact-page">
            {/* Arc Background */}
            <div className="arc-container">
                <div className="arc-gradient"></div>
            </div>

            <div className="contact-content">
                {/* Header Section */}
                <div className="contact-header">
                    <h1>Get in Touch</h1>
                    <p>Let's create something amazing together</p>
                </div>

                {/* Main Grid */}
                <div className="contact-grid">
                    {/* Info Card */}
                    <div className="info-card">
                        <div className="info-section">
                            <h3>Contact Information</h3>
                            <p>Fill out the form and we'll get back to you shortly.</p>
                        </div>

                        <div className="contact-details">
                            <div className="contact-item">
                                <span className="icon">📞</span>
                                <div>
                                    <h4>Phone</h4>
                                    <p>+1-415-555-0199</p>
                                </div>
                            </div>
                            <div className="contact-item">
                                <span className="icon">📧</span>
                                <div>
                                    <h4>Email</h4>
                                    <p>contact@speaknow.ai</p>
                                </div>
                            </div>
                            <div className="contact-item">
                                <span className="icon">📍</span>
                                <div>
                                    <h4>Office</h4>
                                    <p>San Francisco, CA</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="form-card">
                        <form onSubmit={handleSubmit} className="contact-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        placeholder="First Name"
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="Last Name"
                                        className="form-input"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Email Address"
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <input
                                    type="text"
                                    name="company"
                                    value={formData.company}
                                    onChange={handleChange}
                                    placeholder="Company Name"
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="form-select"
                                    required
                                >
                                    <option value="">Select Your Role</option>
                                    <option value="developer">Developer</option>
                                    <option value="designer">Designer</option>
                                    <option value="business">Business</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="Your Message"
                                    className="form-textarea"
                                    required
                                    rows="4"
                                />
                            </div>

                            <div className="form-footer">
                                <div className="terms-checkbox">
                                    <input
                                        type="checkbox"
                                        name="agreeToTerms"
                                        id="agreeToTerms"
                                        checked={formData.agreeToTerms}
                                        onChange={handleChange}
                                        required
                                    />
                                    <label htmlFor="agreeToTerms">
                                        I agree to the <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>
                                    </label>
                                </div>

                                <button type="submit" className="submit-button">
                                    Send Message
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;

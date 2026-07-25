import React, { useState, FormEvent } from 'react';
import { captureApi } from '../api/client';
import { Footer } from '../components/Footer';

export function CaptureFormPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      await captureApi.submit({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        company: form.company || undefined,
        source: form.source || undefined,
        message: form.message || undefined,
      });
      setStatus('success');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setErrorMsg(axiosErr.response?.data?.error || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="capture-page">
      <div className="capture-hero">
        <h1>Get in Touch</h1>
        <p>Tell us about your business and we'll reach out to show you how LeadPro can help your sales team.</p>
      </div>

      <div className="capture-form-container">
        {status === 'success' ? (
          <div className="card card-glass" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🎉</div>
            <h2 style={{ marginBottom: 'var(--space-3)' }}>Thank you!</h2>
            <p style={{ marginBottom: 'var(--space-6)' }}>
              We've received your information and will be in touch soon.
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setStatus('idle');
                setForm({ name: '', email: '', phone: '', company: '', source: '', message: '' });
              }}
              id="btn-submit-another"
            >
              Submit another enquiry
            </button>
          </div>
        ) : (
          <div className="card card-glass">
            <h2 style={{ marginBottom: 'var(--space-2)' }}>Contact Us</h2>
            <p style={{ marginBottom: 'var(--space-6)', fontSize: '0.9rem' }}>
              Fill out the form below and a member of our team will reach out within 24 hours.
            </p>

            {status === 'error' && (
              <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>
                {errorMsg}
              </div>
            )}

            <form className="capture-form" onSubmit={handleSubmit} id="capture-form">
              <div className="capture-form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="name">Full Name *</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="form-input"
                    placeholder="John Smith"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email Address *</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="form-input"
                    placeholder="john@company.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="capture-form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="form-input"
                    placeholder="+1 (555) 000-0000"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="company">Company</label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    className="form-input"
                    placeholder="Acme Corp"
                    value={form.company}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="source">How did you hear about us?</label>
                <select
                  id="source"
                  name="source"
                  className="form-select"
                  value={form.source}
                  onChange={handleChange}
                >
                  <option value="">Select source...</option>
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="google">Google Search</option>
                  <option value="twitter">Twitter/X</option>
                  <option value="cold outreach">Cold Outreach</option>
                  <option value="conference">Conference / Event</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  className="form-textarea"
                  placeholder="Tell us about your needs, team size, or any questions you have..."
                  value={form.message}
                  onChange={handleChange}
                  rows={4}
                />
              </div>

              <button
                id="btn-capture-submit"
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={status === 'loading'}
              >
                {status === 'loading' ? (
                  <>
                    <div className="spinner" style={{ width: 16, height: 16 }} />
                    Submitting...
                  </>
                ) : (
                  'Send Message →'
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

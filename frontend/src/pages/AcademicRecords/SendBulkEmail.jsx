import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SendBulkEmail.css';

const SendBulkEmail = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    class: '',
    term: '',
    recipients: 'all',
    selectedRecipients: [],
    subject: 'Report Card - Term 1 2024-2025',
    message: `Dear Parent/Guardian,

Please find attached the report card for your ward for Term 1 of the academic year 2024-2025.

If you have any questions or concerns regarding your child's academic performance, please feel free to contact the class teacher or school administration.

Best regards,
Springfield International School`,
    attachReportCard: true,
    sendCopy: false
  });

  const [recipients] = useState([
    { id: 1, studentName: 'Emma Wilson', parentName: 'Robert Wilson', email: 'robert.wilson@email.com', hasReportCard: true },
    { id: 2, studentName: 'James Miller', parentName: 'Mary Miller', email: 'mary.miller@email.com', hasReportCard: true },
    { id: 3, studentName: 'Sarah Davis', parentName: 'John Davis', email: 'john.davis@email.com', hasReportCard: true },
    { id: 4, studentName: 'Michael Brown', parentName: 'Lisa Brown', email: 'lisa.brown@email.com', hasReportCard: false },
    { id: 5, studentName: 'Emily Johnson', parentName: 'David Johnson', email: 'david.johnson@email.com', hasReportCard: true },
  ]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRecipientToggle = (recipientId) => {
    setFormData(prev => ({
      ...prev,
      selectedRecipients: prev.selectedRecipients.includes(recipientId)
        ? prev.selectedRecipients.filter(id => id !== recipientId)
        : [...prev.selectedRecipients, recipientId]
    }));
  };

  const handleSelectAll = () => {
    const eligibleRecipients = recipients.filter(r => r.hasReportCard).map(r => r.id);
    setFormData(prev => ({
      ...prev,
      selectedRecipients: prev.selectedRecipients.length === eligibleRecipients.length
        ? []
        : eligibleRecipients
    }));
  };

  const getRecipientCount = () => {
    if (formData.recipients === 'all') {
      return recipients.filter(r => r.hasReportCard).length;
    }
    return formData.selectedRecipients.length;
  };

  const handleSend = () => {
    setIsSending(true);
    setSendProgress(0);
    
    const interval = setInterval(() => {
      setSendProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="bulk-email">
      <div className="bulk-email__header">
        <button className="bulk-email__back-btn" onClick={() => navigate('/academic/report-cards')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <h1 className="bulk-email__title">Send Bulk Email</h1>
          <p className="bulk-email__subtitle">Send report cards to parents via email</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bulk-email__steps">
        <div className={`bulk-email__step ${step >= 1 ? 'bulk-email__step--active' : ''} ${step > 1 ? 'bulk-email__step--completed' : ''}`}>
          <div className="bulk-email__step-number">{step > 1 ? '✓' : '1'}</div>
          <span className="bulk-email__step-label">Select Recipients</span>
        </div>
        <div className="bulk-email__step-line"></div>
        <div className={`bulk-email__step ${step >= 2 ? 'bulk-email__step--active' : ''} ${step > 2 ? 'bulk-email__step--completed' : ''}`}>
          <div className="bulk-email__step-number">{step > 2 ? '✓' : '2'}</div>
          <span className="bulk-email__step-label">Compose Email</span>
        </div>
        <div className="bulk-email__step-line"></div>
        <div className={`bulk-email__step ${step >= 3 ? 'bulk-email__step--active' : ''}`}>
          <div className="bulk-email__step-number">3</div>
          <span className="bulk-email__step-label">Review & Send</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="bulk-email__content">
        {step === 1 && (
          <div className="bulk-email__card">
            <h3 className="bulk-email__card-title">Select Recipients</h3>
            
            <div className="bulk-email__filters">
              <div className="bulk-email__field">
                <label className="bulk-email__label">Class</label>
                <select
                  name="class"
                  className="bulk-email__select"
                  value={formData.class}
                  onChange={handleInputChange}
                >
                  <option value="">All Classes</option>
                  <option value="grade10a">Grade 10-A</option>
                  <option value="grade10b">Grade 10-B</option>
                  <option value="grade9a">Grade 9-A</option>
                </select>
              </div>
              <div className="bulk-email__field">
                <label className="bulk-email__label">Term</label>
                <select
                  name="term"
                  className="bulk-email__select"
                  value={formData.term}
                  onChange={handleInputChange}
                >
                  <option value="">All Terms</option>
                  <option value="term1">Term 1</option>
                  <option value="term2">Term 2</option>
                  <option value="term3">Term 3</option>
                </select>
              </div>
            </div>

            <div className="bulk-email__recipient-options">
              <label className="bulk-email__radio-option">
                <input
                  type="radio"
                  name="recipients"
                  value="all"
                  checked={formData.recipients === 'all'}
                  onChange={handleInputChange}
                />
                <span className="bulk-email__radio-label">
                  All Parents with Generated Report Cards ({recipients.filter(r => r.hasReportCard).length})
                </span>
              </label>
              <label className="bulk-email__radio-option">
                <input
                  type="radio"
                  name="recipients"
                  value="selected"
                  checked={formData.recipients === 'selected'}
                  onChange={handleInputChange}
                />
                <span className="bulk-email__radio-label">Select Specific Recipients</span>
              </label>
            </div>

            {formData.recipients === 'selected' && (
              <div className="bulk-email__recipients-list">
                <div className="bulk-email__list-header">
                  <button className="bulk-email__select-all" onClick={handleSelectAll}>
                    {formData.selectedRecipients.length === recipients.filter(r => r.hasReportCard).length
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                  <span className="bulk-email__selected-count">
                    {formData.selectedRecipients.length} selected
                  </span>
                </div>
                {recipients.map(recipient => (
                  <div 
                    key={recipient.id} 
                    className={`bulk-email__recipient-item ${!recipient.hasReportCard ? 'bulk-email__recipient-item--disabled' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedRecipients.includes(recipient.id)}
                      onChange={() => handleRecipientToggle(recipient.id)}
                      disabled={!recipient.hasReportCard}
                    />
                    <div className="bulk-email__recipient-info">
                      <div className="bulk-email__recipient-main">
                        <span className="bulk-email__recipient-name">{recipient.parentName}</span>
                        <span className="bulk-email__recipient-student">Parent of {recipient.studentName}</span>
                      </div>
                      <span className="bulk-email__recipient-email">{recipient.email}</span>
                    </div>
                    {!recipient.hasReportCard && (
                      <span className="bulk-email__no-report">No Report Card</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="bulk-email__card">
            <h3 className="bulk-email__card-title">Compose Email</h3>
            
            <div className="bulk-email__compose">
              <div className="bulk-email__field">
                <label className="bulk-email__label">Subject</label>
                <input
                  type="text"
                  name="subject"
                  className="bulk-email__input"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Email subject..."
                />
              </div>
              
              <div className="bulk-email__field">
                <label className="bulk-email__label">Message</label>
                <textarea
                  name="message"
                  className="bulk-email__textarea"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={10}
                  placeholder="Write your message..."
                ></textarea>
              </div>

              <div className="bulk-email__options">
                <label className="bulk-email__checkbox-option">
                  <input
                    type="checkbox"
                    name="attachReportCard"
                    checked={formData.attachReportCard}
                    onChange={handleInputChange}
                  />
                  <div className="bulk-email__option-content">
                    <span className="bulk-email__option-icon">📎</span>
                    <div>
                      <span className="bulk-email__option-title">Attach Report Card (PDF)</span>
                      <span className="bulk-email__option-desc">Include report card as PDF attachment</span>
                    </div>
                  </div>
                </label>
                <label className="bulk-email__checkbox-option">
                  <input
                    type="checkbox"
                    name="sendCopy"
                    checked={formData.sendCopy}
                    onChange={handleInputChange}
                  />
                  <div className="bulk-email__option-content">
                    <span className="bulk-email__option-icon">📋</span>
                    <div>
                      <span className="bulk-email__option-title">Send Copy to Admin</span>
                      <span className="bulk-email__option-desc">BCC admin@school.edu on all emails</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {step === 3 && !isSending && (
          <div className="bulk-email__card">
            <h3 className="bulk-email__card-title">Review & Confirm</h3>
            
            <div className="bulk-email__review">
              <div className="bulk-email__review-item">
                <span className="bulk-email__review-label">Recipients</span>
                <span className="bulk-email__review-value">
                  {getRecipientCount()} parents
                </span>
              </div>
              <div className="bulk-email__review-item">
                <span className="bulk-email__review-label">Subject</span>
                <span className="bulk-email__review-value">{formData.subject}</span>
              </div>
              <div className="bulk-email__review-item">
                <span className="bulk-email__review-label">Attachments</span>
                <span className="bulk-email__review-value">
                  {formData.attachReportCard ? 'Report Card (PDF)' : 'None'}
                </span>
              </div>
              <div className="bulk-email__review-item">
                <span className="bulk-email__review-label">CC Admin</span>
                <span className="bulk-email__review-value">
                  {formData.sendCopy ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            <div className="bulk-email__preview">
              <h4 className="bulk-email__preview-title">Email Preview</h4>
              <div className="bulk-email__preview-content">
                <div className="bulk-email__preview-header">
                  <strong>Subject:</strong> {formData.subject}
                </div>
                <div className="bulk-email__preview-body">
                  {formData.message}
                </div>
                {formData.attachReportCard && (
                  <div className="bulk-email__preview-attachment">
                    <span className="bulk-email__attachment-icon">📄</span>
                    ReportCard_[StudentName].pdf
                  </div>
                )}
              </div>
            </div>

            <div className="bulk-email__warning">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 18.3333C14.6024 18.3333 18.3333 14.6024 18.3333 10C18.3333 5.39763 14.6024 1.66667 10 1.66667C5.39763 1.66667 1.66667 5.39763 1.66667 10C1.66667 14.6024 5.39763 18.3333 10 18.3333Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 6.66667V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="10" cy="13.3333" r="0.833333" fill="currentColor"/>
              </svg>
              <p>This action will send {getRecipientCount()} emails immediately. This cannot be undone.</p>
            </div>
          </div>
        )}

        {step === 3 && isSending && (
          <div className="bulk-email__card bulk-email__card--sending">
            <div className="bulk-email__sending-icon">
              {sendProgress < 100 ? '📨' : '✅'}
            </div>
            <h3 className="bulk-email__sending-title">
              {sendProgress < 100 ? 'Sending Emails...' : 'Emails Sent Successfully!'}
            </h3>
            <p className="bulk-email__sending-desc">
              {sendProgress < 100
                ? `Sending to ${getRecipientCount()} recipients...`
                : `All ${getRecipientCount()} emails have been sent successfully.`}
            </p>
            <div className="bulk-email__progress-bar">
              <div 
                className="bulk-email__progress-fill"
                style={{ width: `${sendProgress}%` }}
              ></div>
            </div>
            <span className="bulk-email__progress-text">{sendProgress}% Complete</span>
            
            {sendProgress === 100 && (
              <button 
                className="bulk-email__done-btn"
                onClick={() => navigate('/academic/report-cards')}
              >
                Back to Report Cards
              </button>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {!isSending && (
        <div className="bulk-email__actions">
          {step > 1 && (
            <button className="bulk-email__btn bulk-email__btn--secondary" onClick={prevStep}>
              Previous
            </button>
          )}
          {step < 3 ? (
            <button 
              className="bulk-email__btn bulk-email__btn--primary" 
              onClick={nextStep}
              disabled={step === 1 && getRecipientCount() === 0}
            >
              Continue
            </button>
          ) : (
            <button 
              className="bulk-email__btn bulk-email__btn--send" 
              onClick={handleSend}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M18.3333 1.66667L9.16667 10.8333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.3333 1.66667L12.5 18.3333L9.16667 10.8333L1.66667 7.5L18.3333 1.66667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Send {getRecipientCount()} Emails
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SendBulkEmail;

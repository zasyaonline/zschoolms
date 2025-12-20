import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MarksReview.css';

const MarksReview = () => {
  const navigate = useNavigate();

  // Mock student data - in real app, this would come from API based on id
  const [studentData] = useState({
    fullName: 'John Doe',
    schoolName: 'Vision Academy School',
    dateOfBirth: '25 June 2005',
    studentId: '12345',
    gradeClass: '9A'
  });

  const [subjects] = useState([
    { id: 1, name: 'Subject 1', marks: 83 },
    { id: 2, name: 'Subject 2', marks: 84 },
    { id: 3, name: 'Subject 3', marks: 85 },
    { id: 4, name: 'Subject 4', marks: 86 },
    { id: 5, name: 'Subject 5', marks: 87 },
    { id: 6, name: 'Subject 6', marks: 88 },
    { id: 7, name: 'Subject 7', marks: 89 }
  ]);

  const [selectedSubjects, setSelectedSubjects] = useState([3]); // Subject 3 is pre-selected
  const [comment] = useState('Lorem ipsum dolor sit amet consectetur. Eu vehicula cursus curabitur platea semper lectus egestas. Mi malesuada massa iaculis semper condimentum velit non.');
  const [commentAuthor] = useState('John Doe');

  // Available students for dropdown
  const [students] = useState([
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Michael Liu' },
    { id: 4, name: 'Sarah Johnson' }
  ]);

  const [selectedStudent, setSelectedStudent] = useState(students[0]);

  const toggleSubjectSelection = (subjectId) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      } else {
        return [...prev, subjectId];
      }
    });
  };

  const handleApprove = () => {
    // TODO: Handle approve logic
    // await api.marks.approve(selectedStudent.id, selectedSubjects);
    navigate('/marks-approval');
  };

  const handleRequestCorrection = () => {
    if (selectedSubjects.length === 0) {
      alert('Please select at least one subject to request correction');
      return;
    }
    // TODO: Handle request correction logic
    // await api.marks.requestCorrection(selectedStudent.id, selectedSubjects, comment);
    navigate('/marks-approval');
  };

  const handleAddComment = () => {
    // TODO: Handle add comment logic
    // await api.marks.addComment(selectedStudent.id, comment);
  };

  return (
    <div className="marks-review">
      <div className="marks-review__header">
        <h1 className="marks-review__title">Marks Review</h1>
        <div className="marks-review__student-select">
          <label className="marks-review__student-select-label">Select Student</label>
          <div className="marks-review__student-select-wrapper">
            <select
              value={selectedStudent.id}
              onChange={(e) => {
                const student = students.find(s => s.id === parseInt(e.target.value));
                setSelectedStudent(student);
              }}
              className="marks-review__student-select-input"
            >
              {students.map(student => (
                <option key={student.id} value={student.id}>{student.name}</option>
              ))}
            </select>
            <svg className="marks-review__student-select-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19.92 8.95L13.4 15.47C12.63 16.24 11.37 16.24 10.6 15.47L4.07999 8.95" stroke="#1F55A6" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Student Information */}
      <div className="marks-review__card">
        <h2 className="marks-review__card-title">Student Information</h2>
        <div className="marks-review__divider"></div>
        <div className="marks-review__student-info">
          <div className="marks-review__info-row">
            <div className="marks-review__info-field">
              <span className="marks-review__info-label">Full Name</span>
              <span className="marks-review__info-value">{studentData.fullName}</span>
            </div>
            <div className="marks-review__info-field">
              <span className="marks-review__info-label">School Name</span>
              <span className="marks-review__info-value">{studentData.schoolName}</span>
            </div>
          </div>
          <div className="marks-review__info-row">
            <div className="marks-review__info-field">
              <span className="marks-review__info-label">Date of Birth</span>
              <span className="marks-review__info-value">{studentData.dateOfBirth}</span>
            </div>
            <div className="marks-review__info-field">
              <span className="marks-review__info-label">Student ID</span>
              <span className="marks-review__info-value">{studentData.studentId}</span>
            </div>
            <div className="marks-review__info-field">
              <span className="marks-review__info-label">Grade/Class</span>
              <span className="marks-review__info-value">{studentData.gradeClass}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Marks */}
      <div className="marks-review__card">
        <div className="marks-review__card-header">
          <h2 className="marks-review__card-title">Subject Marks</h2>
          <p className="marks-review__card-subtitle">
            If you want to correction in specific subject marks so please select mark and request for correction
          </p>
        </div>
        <div className="marks-review__divider"></div>

        <div className="marks-review__subjects">
          <div className="marks-review__subjects-header">
            {subjects.map(subject => (
              <div key={subject.id} className="marks-review__subject-header-cell">
                {subject.name}
              </div>
            ))}
          </div>

          <div className="marks-review__subjects-body">
            <div className="marks-review__subjects-row">
              {subjects.map(subject => (
                <div key={subject.id} className="marks-review__subject-cell">
                  <span className="marks-review__subject-marks">{subject.marks}</span>
                  <label className="marks-review__checkbox">
                    <input
                      type="checkbox"
                      checked={selectedSubjects.includes(subject.id)}
                      onChange={() => toggleSubjectSelection(subject.id)}
                    />
                    <span className="marks-review__checkbox-custom">
                      {selectedSubjects.includes(subject.id) && (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M11.6667 3.5L5.25 9.91667L2.33334 7" stroke="#1F55A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <h2 className="marks-review__card-title">Comments</h2>

        <div className="marks-review__comments">
          <div className="marks-review__comment">
            <span className="marks-review__comment-author">{commentAuthor}</span>
            <p className="marks-review__comment-text">{comment}</p>
            <button className="marks-review__add-comment-btn" onClick={handleAddComment}>
              Add Comment
            </button>
          </div>
        </div>

        <div className="marks-review__actions">
          <button className="marks-review__action-btn marks-review__action-btn--approve" onClick={handleApprove}>
            Approve
          </button>
          <button className="marks-review__action-btn marks-review__action-btn--request" onClick={handleRequestCorrection}>
            Request For Correction
          </button>
        </div>
      </div>

      <div className="marks-review__footer">
        <a href="#" className="marks-review__footer-link">Need Help?</a>
        <a href="#" className="marks-review__footer-link">Contact Support</a>
      </div>
    </div>
  );
};

export default MarksReview;

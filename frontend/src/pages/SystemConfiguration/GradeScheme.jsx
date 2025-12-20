import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './GradeScheme.css';

const GradeScheme = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = id === 'add';
  
  const [formData, setFormData] = useState(() => {
    // Initialize with mock data if not new
    if (!isNew) {
      return {
        name: 'Standard Grading',
        description: 'A-F grading system used for academic evaluation',
        status: 'active',
        grades: [
          { grade: 'A', minScore: 90, maxScore: 100, gpa: 4.0, description: 'Excellent' },
          { grade: 'B', minScore: 80, maxScore: 89, gpa: 3.0, description: 'Good' },
          { grade: 'C', minScore: 70, maxScore: 79, gpa: 2.0, description: 'Satisfactory' },
          { grade: 'D', minScore: 60, maxScore: 69, gpa: 1.0, description: 'Pass' },
          { grade: 'F', minScore: 0, maxScore: 59, gpa: 0.0, description: 'Fail' }
        ]
      };
    }
    return {
      name: '',
      description: '',
      status: 'active',
      grades: [
        { grade: 'A', minScore: 90, maxScore: 100, gpa: 4.0, description: 'Excellent' },
        { grade: 'B', minScore: 80, maxScore: 89, gpa: 3.0, description: 'Good' },
        { grade: 'C', minScore: 70, maxScore: 79, gpa: 2.0, description: 'Satisfactory' },
        { grade: 'D', minScore: 60, maxScore: 69, gpa: 1.0, description: 'Pass' },
        { grade: 'F', minScore: 0, maxScore: 59, gpa: 0.0, description: 'Fail' }
      ]
    };
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGradeChange = (index, field, value) => {
    const updatedGrades = [...formData.grades];
    updatedGrades[index] = {
      ...updatedGrades[index],
      [field]: field === 'grade' || field === 'description' ? value : parseFloat(value) || 0
    };
    setFormData(prev => ({
      ...prev,
      grades: updatedGrades
    }));
  };

  const handleAddGrade = () => {
    setFormData(prev => ({
      ...prev,
      grades: [...prev.grades, { grade: '', minScore: 0, maxScore: 0, gpa: 0, description: '' }]
    }));
  };

  const handleRemoveGrade = (index) => {
    setFormData(prev => ({
      ...prev,
      grades: prev.grades.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add API call to save/update grade scheme
    // await api.gradeSchemes[isNew ? 'create' : 'update'](formData);
    navigate('/configuration/grading-scheme');
  };

  return (
    <div className="grade-scheme">
      <div className="grade-scheme__header">
        <h2 className="grade-scheme__title">{isNew ? 'Add Grading Scheme' : 'Edit Grading Scheme'}</h2>
        <p className="grade-scheme__subtitle">
          {isNew ? 'Create a new grading scheme for academic evaluation' : 'Modify grading scheme details'}
        </p>
      </div>

      <form className="grade-scheme__form" onSubmit={handleSubmit}>
        <div className="grade-scheme__section">
          <h3 className="grade-scheme__section-title">Basic Information</h3>
          
          <div className="grade-scheme__row">
            <div className="grade-scheme__field">
              <label className="grade-scheme__label" htmlFor="name">
                Scheme Name <span className="grade-scheme__required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="grade-scheme__input"
                placeholder="Enter scheme name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="grade-scheme__field">
              <label className="grade-scheme__label" htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                className="grade-scheme__select"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          <div className="grade-scheme__field">
            <label className="grade-scheme__label" htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              className="grade-scheme__textarea"
              placeholder="Enter scheme description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
            />
          </div>
        </div>

        <div className="grade-scheme__section">
          <div className="grade-scheme__section-header">
            <h3 className="grade-scheme__section-title">Grade Levels</h3>
            <button type="button" className="btn btn--outline btn--sm" onClick={handleAddGrade}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Grade
            </button>
          </div>
          
          <div className="grade-scheme__grades">
            <div className="grade-scheme__grades-header">
              <div className="grade-scheme__grades-th">Grade</div>
              <div className="grade-scheme__grades-th">Min Score</div>
              <div className="grade-scheme__grades-th">Max Score</div>
              <div className="grade-scheme__grades-th">GPA</div>
              <div className="grade-scheme__grades-th">Description</div>
              <div className="grade-scheme__grades-th grade-scheme__grades-th--action"></div>
            </div>
            
            {formData.grades.map((grade, index) => (
              <div key={index} className="grade-scheme__grades-row">
                <input
                  type="text"
                  className="grade-scheme__grades-input"
                  placeholder="A"
                  value={grade.grade}
                  onChange={(e) => handleGradeChange(index, 'grade', e.target.value)}
                />
                <input
                  type="number"
                  className="grade-scheme__grades-input"
                  placeholder="90"
                  value={grade.minScore}
                  onChange={(e) => handleGradeChange(index, 'minScore', e.target.value)}
                />
                <input
                  type="number"
                  className="grade-scheme__grades-input"
                  placeholder="100"
                  value={grade.maxScore}
                  onChange={(e) => handleGradeChange(index, 'maxScore', e.target.value)}
                />
                <input
                  type="number"
                  step="0.1"
                  className="grade-scheme__grades-input"
                  placeholder="4.0"
                  value={grade.gpa}
                  onChange={(e) => handleGradeChange(index, 'gpa', e.target.value)}
                />
                <input
                  type="text"
                  className="grade-scheme__grades-input grade-scheme__grades-input--wide"
                  placeholder="Description"
                  value={grade.description}
                  onChange={(e) => handleGradeChange(index, 'description', e.target.value)}
                />
                <button
                  type="button"
                  className="grade-scheme__grades-remove"
                  onClick={() => handleRemoveGrade(index)}
                  disabled={formData.grades.length <= 1}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grade-scheme__actions">
          <button type="button" className="btn btn--secondary" onClick={() => navigate('/configuration/grading-scheme')}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            {isNew ? 'Create Scheme' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GradeScheme;

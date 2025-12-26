import { useState, useEffect, useCallback } from 'react';
import './GradingSchemeSetup.css';
import { gradingService } from '../../services';

const GradingSchemeSetup = () => {
  const [formData, setFormData] = useState({
    selectedGrade: '',
    minValue: '',
    maxValue: '',
    passingMarks: ''
  });

  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGradeId, setEditingGradeId] = useState(null);

  const fetchGradingSchemes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await gradingService.getGradingSchemes();

      if (response.success && response.data) {
        const schemes = (response.data.schemes || response.data || []).map(scheme => ({
          id: scheme.id,
          grade: scheme.grade || scheme.name,
          minValue: scheme.minValue || scheme.minPercentage || 0,
          maxValue: scheme.maxValue || scheme.maxPercentage || 100,
          passingMarks: scheme.passingMarks || scheme.passingScore || 32
        }));
        setGrades(schemes);
      }
    } catch (err) {
      console.error('Error fetching grading schemes:', err);
      // Fallback to default schemes if API not available
      setGrades([
        { id: 1, grade: 'Grade A+', minValue: 90, maxValue: 100, passingMarks: 32 },
        { id: 2, grade: 'Grade A', minValue: 80, maxValue: 89, passingMarks: 32 },
        { id: 3, grade: 'Grade B+', minValue: 75, maxValue: 79, passingMarks: 32 },
        { id: 4, grade: 'Grade B', minValue: 70, maxValue: 74, passingMarks: 32 },
        { id: 5, grade: 'Grade C+', minValue: 65, maxValue: 69, passingMarks: 32 },
        { id: 6, grade: 'Grade C', minValue: 60, maxValue: 64, passingMarks: 32 },
        { id: 7, grade: 'Grade D+', minValue: 55, maxValue: 59, passingMarks: 32 },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGradingSchemes();
  }, [fetchGradingSchemes]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveScheme = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const schemeData = {
        grade: formData.selectedGrade,
        name: formData.selectedGrade,
        minValue: parseInt(formData.minValue),
        maxValue: parseInt(formData.maxValue),
        passingMarks: parseInt(formData.passingMarks)
      };

      const response = await gradingService.createGradingScheme(schemeData);

      if (response.success) {
        await fetchGradingSchemes();
        setFormData({
          selectedGrade: '',
          minValue: '',
          maxValue: '',
          passingMarks: ''
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to save grading scheme');
      console.error('Error saving grading scheme:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditGrade = (id) => {
    const grade = grades.find(g => g.id === id);
    if (grade) {
      setFormData({
        selectedGrade: grade.grade,
        minValue: grade.minValue.toString(),
        maxValue: grade.maxValue.toString(),
        passingMarks: grade.passingMarks.toString()
      });
      setEditingGradeId(id);
      setShowEditModal(true);
    }
  };

  const handleModalSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingGradeId) {
        const schemeData = {
          grade: formData.selectedGrade,
          name: formData.selectedGrade,
          minValue: parseInt(formData.minValue),
          maxValue: parseInt(formData.maxValue),
          passingMarks: parseInt(formData.passingMarks)
        };

        await gradingService.updateGradingScheme(editingGradeId, schemeData);
        await fetchGradingSchemes();
      }
      setShowEditModal(false);
      setEditingGradeId(null);
      setFormData({
        selectedGrade: '',
        minValue: '',
        maxValue: '',
        passingMarks: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to update grading scheme');
      console.error('Error updating grading scheme:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleModalDelete = async () => {
    try {
      if (editingGradeId) {
        await gradingService.deleteGradingScheme(editingGradeId);
        await fetchGradingSchemes();
      }
      setShowEditModal(false);
      setEditingGradeId(null);
      setFormData({
        selectedGrade: '',
        minValue: '',
        maxValue: '',
        passingMarks: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to delete grading scheme');
      console.error('Error deleting grading scheme:', err);
    }
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setEditingGradeId(null);
    setFormData({
      selectedGrade: '',
      minValue: '',
      maxValue: '',
      passingMarks: ''
    });
  };

  if (loading) {
    return (
      <div className="grading-scheme-setup">
        <h2 className="grading-scheme-setup__title">Grading Scheme Setup</h2>
        <div className="grading-scheme-setup__loading">
          <p>Loading grading schemes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grading-scheme-setup">
      <h2 className="grading-scheme-setup__title">Grading Scheme Setup</h2>
      
      <div className="grading-scheme-setup__content">
        {/* Left Card - Form */}
        <div className="grading-scheme-setup__form-card">
          <form onSubmit={handleSaveScheme} className="grading-scheme-setup__form">
            <div className="grading-scheme-setup__fields">
              <div className="grading-scheme-setup__field-group">
                <label className="grading-scheme-setup__floating-label">Select Grade</label>
                <select
                  name="selectedGrade"
                  className="grading-scheme-setup__input grading-scheme-setup__input--select"
                  value={formData.selectedGrade}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select Grade</option>
                  <option value="Grade A+">Grade A+</option>
                  <option value="Grade A">Grade A</option>
                  <option value="Grade B+">Grade B+</option>
                  <option value="Grade B">Grade B</option>
                  <option value="Grade C+">Grade C+</option>
                  <option value="Grade C">Grade C</option>
                  <option value="Grade D+">Grade D+</option>
                  <option value="Grade D">Grade D</option>
                  <option value="Grade F">Grade F</option>
                </select>
              </div>

              <div className="grading-scheme-setup__field-group">
                <label className="grading-scheme-setup__floating-label">Min Values</label>
                <input
                  type="number"
                  name="minValue"
                  className="grading-scheme-setup__input"
                  value={formData.minValue}
                  onChange={handleFormChange}
                  placeholder="90"
                  required
                />
              </div>

              <div className="grading-scheme-setup__field-group">
                <label className="grading-scheme-setup__floating-label">Max Values</label>
                <input
                  type="number"
                  name="maxValue"
                  className="grading-scheme-setup__input"
                  value={formData.maxValue}
                  onChange={handleFormChange}
                  placeholder="100"
                  required
                />
              </div>

              <div className="grading-scheme-setup__divider" />

              <div className="grading-scheme-setup__field-group">
                <label className="grading-scheme-setup__floating-label">Passing Marks</label>
                <input
                  type="number"
                  name="passingMarks"
                  className="grading-scheme-setup__input"
                  value={formData.passingMarks}
                  onChange={handleFormChange}
                  placeholder="32"
                  required
                />
              </div>
            </div>

            <button type="submit" className="grading-scheme-setup__btn">
              Save Scheme
            </button>
          </form>
        </div>

        {/* Right Card - Grade Table */}
        <div className="grading-scheme-setup__table-card">
          <h3 className="grading-scheme-setup__table-title">Grade Scheme</h3>
          
          <div className="grading-scheme-setup__table">
            <div className="grading-scheme-setup__table-header">
              <div className="grading-scheme-setup__th grading-scheme-setup__th--grade">Grade</div>
              <div className="grading-scheme-setup__th">Min Value</div>
              <div className="grading-scheme-setup__th">Max Value</div>
              <div className="grading-scheme-setup__th grading-scheme-setup__th--action">Action</div>
            </div>

            <div className="grading-scheme-setup__table-body">
              {grades.map((grade, index) => (
                <div key={grade.id}>
                  <div className="grading-scheme-setup__row">
                    <div className="grading-scheme-setup__td grading-scheme-setup__td--grade">{grade.grade}</div>
                    <div className="grading-scheme-setup__td">{grade.minValue}</div>
                    <div className="grading-scheme-setup__td">{grade.maxValue}</div>
                    <div className="grading-scheme-setup__td grading-scheme-setup__td--action">
                      <button 
                        className="grading-scheme-setup__edit-btn"
                        onClick={() => handleEditGrade(grade.id)}
                        title="Edit"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#1F55A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#1F55A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  {index < grades.length - 1 && <div className="grading-scheme-setup__divider" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grading-scheme-setup__footer">
        <a href="#" className="grading-scheme-setup__link">Need Help?</a>
        <a href="#" className="grading-scheme-setup__link">Contact Support</a>
      </div>

      {/* Edit Grade Modal */}
      {showEditModal && (
        <>
          <div className="grading-scheme-setup__modal-backdrop" onClick={handleModalClose} />
          <div className="grading-scheme-setup__modal">
            <div className="grading-scheme-setup__modal-content">
              <div className="grading-scheme-setup__modal-header">
                <h3 className="grading-scheme-setup__modal-title">Grade Scheme</h3>
              </div>

              <div className="grading-scheme-setup__modal-divider" />

              <form onSubmit={handleModalSave} className="grading-scheme-setup__modal-form">
                <div className="grading-scheme-setup__modal-fields">
                  <div className="grading-scheme-setup__field-group">
                    <label className="grading-scheme-setup__floating-label">Select Grade</label>
                    <select
                      name="selectedGrade"
                      className="grading-scheme-setup__input grading-scheme-setup__input--select"
                      value={formData.selectedGrade}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select Grade</option>
                      <option value="Grade A+">Grade A+</option>
                      <option value="Grade A">Grade A</option>
                      <option value="Grade B+">Grade B+</option>
                      <option value="Grade B">Grade B</option>
                      <option value="Grade C+">Grade C+</option>
                      <option value="Grade C">Grade C</option>
                      <option value="Grade D+">Grade D+</option>
                      <option value="Grade D">Grade D</option>
                      <option value="Grade F">Grade F</option>
                    </select>
                  </div>

                  <div className="grading-scheme-setup__field-group">
                    <label className="grading-scheme-setup__floating-label">Min Values</label>
                    <input
                      type="number"
                      name="minValue"
                      className="grading-scheme-setup__input"
                      value={formData.minValue}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="grading-scheme-setup__field-group">
                    <label className="grading-scheme-setup__floating-label">Max Values</label>
                    <input
                      type="number"
                      name="maxValue"
                      className="grading-scheme-setup__input"
                      value={formData.maxValue}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="grading-scheme-setup__modal-divider" />

                  <div className="grading-scheme-setup__field-group">
                    <label className="grading-scheme-setup__floating-label">Passing Marks</label>
                    <input
                      type="number"
                      name="passingMarks"
                      className="grading-scheme-setup__input"
                      value={formData.passingMarks}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                </div>

                <div className="grading-scheme-setup__modal-actions">
                  <button type="submit" className="grading-scheme-setup__modal-btn grading-scheme-setup__modal-btn--save">
                    Save
                  </button>
                  <button 
                    type="button" 
                    className="grading-scheme-setup__modal-btn grading-scheme-setup__modal-btn--delete"
                    onClick={handleModalDelete}
                  >
                    Delete
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M21 5.98c-3.33-.33-6.68-.5-10.02-.5-1.98 0-3.96.1-5.94.3L3 5.98" stroke="#E00000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8.5 4.97l.22-1.31C8.88 2.71 9 2 10.69 2h2.62c1.69 0 1.82.75 1.97 1.67l.22 1.3" stroke="#E00000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.85 9.14l-.65 10.07C18.09 20.78 18 22 15.21 22H8.79C6 22 5.91 20.78 5.8 19.21L5.15 9.14" stroke="#E00000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10.33 16.5h3.33M9.5 12.5h5" stroke="#E00000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GradingSchemeSetup;

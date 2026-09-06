import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

export const getStudents = () => api.get('/students').then(r => r.data)
export const getAssignments = () => api.get('/assignments').then(r => r.data)
export const getRubric = (id) => api.get(`/rubrics/${id}`).then(r => r.data)

export const createSubmission = (payload) => api.post('/submissions', payload).then(r => r.data)
export const getStudentSubmissions = (studentId) => api.get(`/submissions/${studentId}`).then(r => r.data)

export const generateFeedback = (submissionId) => api.post('/feedback', { submission_id: submissionId }).then(r => r.data)
export const getFeedback = (submissionId) => api.get(`/feedback/${submissionId}`).then(r => r.data)

export const submitRevision = (payload) => api.post('/revisions', payload).then(r => r.data)
export const getRevisions = (submissionId) => api.get(`/revisions/${submissionId}`).then(r => r.data)

export const getReviews = (status) => api.get('/reviews', { params: status ? { status } : {} }).then(r => r.data)
export const actionReview = (reviewId, payload) => api.post(`/reviews/${reviewId}`, payload).then(r => r.data)

export const getMetrics = () => api.get('/metrics').then(r => r.data)

// Experiments & Comparison
export const getExperimentComparison = () => api.get('/experiments/comparison').then(r => r.data)
export const getExperimentObservations = (group) => api.get('/experiments/observations', { params: group ? { group } : {} }).then(r => r.data)
export const getInstructorFeedback = () => api.get('/experiments/instructor-feedback').then(r => r.data)

// Error Analysis
export const getErrorAnalysis = () => api.get('/experiments/error-analysis').then(r => r.data)
export const addErrorAnalysisRecord = (payload) => api.post('/experiments/error-analysis', payload).then(r => r.data)

// User, Accessibility, Language, and Explainability Validation
export const getUserValidationSummary = () => api.get('/experiments/validation/user').then(r => r.data)
export const submitUserValidation = (payload) => api.post('/experiments/validation/user', payload).then(r => r.data)

export const getAccessibilityChecks = () => api.get('/experiments/validation/accessibility').then(r => r.data)
export const updateAccessibilityCheck = (checkId, payload) => api.post(`/experiments/validation/accessibility/${checkId}`, payload).then(r => r.data)

export const getLanguageValidation = () => api.get('/experiments/validation/language').then(r => r.data)

export const getExplainabilityChecks = () => api.get('/experiments/validation/explainability').then(r => r.data)
export const updateExplainabilityCheck = (checkId, payload) => api.post(`/experiments/validation/explainability/${checkId}`, payload).then(r => r.data)

export default api

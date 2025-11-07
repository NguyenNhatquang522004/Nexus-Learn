import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiBook, FiTarget, FiSettings, FiLogOut } from 'react-icons/fi';
import { Card, Button, Input, Select } from '../components/shared';
import { saveProfile } from '../store/slices/profileSlice';
import { logout } from '../store/slices/authSlice';
import { GRADE_LEVELS, SUBJECTS, LEARNING_GOALS } from '../utils/constants';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { profile, loading } = useSelector((state) => state.profile);
  const { learningStyle } = useSelector((state) => state.learningStyle);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || user?.name || '',
    email: user?.email || '',
    grade: profile?.grade || '',
    school: profile?.school || '',
    interests: profile?.interests || [],
    goals: profile?.goals || []
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInterestToggle = (subject) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(subject)
        ? prev.interests.filter((s) => s !== subject)
        : [...prev.interests, subject]
    }));
  };

  const handleGoalToggle = (goal) => {
    setFormData((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const handleSave = async () => {
    try {
      await dispatch(saveProfile(formData)).unwrap();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container-custom max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">Profile Settings</h1>
          <p className="text-lg text-neutral-600">Manage your account and learning preferences</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <div className="text-center p-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-white flex items-center justify-center text-4xl font-bold mx-auto mb-4">
                  {(formData.name || 'U')[0].toUpperCase()}
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-1">
                  {formData.name || 'User'}
                </h3>
                <p className="text-neutral-600 mb-4">{formData.email}</p>

                {learningStyle?.primaryStyle && (
                  <div className="bg-primary-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-neutral-600 mb-1">Learning Style</p>
                    <p className="font-semibold text-primary-600 capitalize">
                      {learningStyle.primaryStyle}
                    </p>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="md"
                  icon={<FiLogOut />}
                  onClick={handleLogout}
                  className="w-full"
                >
                  Logout
                </Button>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <div className="card-header flex items-center justify-between">
                <h2 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
                  <FiUser /> Basic Information
                </h2>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: profile?.name || user?.name || '',
                          email: user?.email || '',
                          grade: profile?.grade || '',
                          school: profile?.school || '',
                          interests: profile?.interests || [],
                          goals: profile?.goals || []
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSave}
                      loading={loading}
                    >
                      Save
                    </Button>
                  </div>
                )}
              </div>
              <div className="card-body space-y-4">
                <Input
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  helperText="Contact support to change your email"
                />
                <Select
                  label="Grade Level"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  disabled={!isEditing}
                >
                  <option value="">Select your grade</option>
                  {GRADE_LEVELS.map((grade) => (
                    <option key={grade.value} value={grade.value}>
                      {grade.label}
                    </option>
                  ))}
                </Select>
                <Input
                  label="School"
                  name="school"
                  value={formData.school}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Enter your school name"
                />
              </div>
            </Card>

            {/* Learning Interests */}
            <Card>
              <div className="card-header">
                <h2 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
                  <FiBook /> Learning Interests
                </h2>
              </div>
              <div className="card-body">
                <p className="text-neutral-600 mb-4">
                  Select subjects you're interested in learning
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {SUBJECTS.map((subject) => (
                    <motion.button
                      key={subject.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => isEditing && handleInterestToggle(subject.value)}
                      disabled={!isEditing}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.interests.includes(subject.value)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 bg-white'
                      } ${isEditing ? 'cursor-pointer hover:border-primary-300' : 'cursor-default'}`}
                    >
                      <div className="text-3xl mb-2">{subject.icon}</div>
                      <div className="text-sm font-medium text-neutral-900">
                        {subject.label}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Learning Goals */}
            <Card>
              <div className="card-header">
                <h2 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
                  <FiTarget /> Learning Goals
                </h2>
              </div>
              <div className="card-body">
                <p className="text-neutral-600 mb-4">
                  What do you want to achieve with Learn Your Way?
                </p>
                <div className="space-y-3">
                  {LEARNING_GOALS.map((goal) => (
                    <motion.button
                      key={goal.value}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => isEditing && handleGoalToggle(goal.value)}
                      disabled={!isEditing}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        formData.goals.includes(goal.value)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 bg-white'
                      } ${isEditing ? 'cursor-pointer hover:border-primary-300' : 'cursor-default'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            formData.goals.includes(goal.value)
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-neutral-300'
                          }`}
                        >
                          {formData.goals.includes(goal.value) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                              <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-neutral-900">{goal.label}</p>
                          <p className="text-sm text-neutral-600">{goal.description}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Account Settings */}
            <Card>
              <div className="card-header">
                <h2 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
                  <FiSettings /> Account Settings
                </h2>
              </div>
              <div className="card-body space-y-4">
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-neutral-900">Email Notifications</h4>
                    <p className="text-sm text-neutral-600">Receive updates about your learning progress</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-neutral-900">Weekly Summary</h4>
                    <p className="text-sm text-neutral-600">Get a weekly report of your achievements</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>

                <Button variant="outline" className="w-full">
                  Change Password
                </Button>

                <Button variant="danger" className="w-full">
                  Delete Account
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

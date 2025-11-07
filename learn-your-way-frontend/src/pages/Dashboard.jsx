import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiBook, FiTarget, FiTrendingUp, FiClock, FiAward, FiUpload,
  FiUsers, FiZap, FiCheckCircle, FiCalendar, FiActivity,
  FiBell, FiSettings, FiMenu, FiX
} from 'react-icons/fi';
import { Card, Button, ProgressBar, LoadingSpinner } from '../components/shared';
import { ROUTES } from '../utils/constants';
import {
  fetchDashboardMetrics,
  fetchEngagementData,
  fetchMastery,
  fetchNextTopic,
  fetchStudyPlan,
  fetchActivityFeed,
  fetchUpcomingReviews,
} from '../store/slices/dashboardSlice';
import { useDashboardWebSocket } from '../hooks/useDashboardWebSocket';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { profile } = useSelector((state) => state.profile);
  const { learningStyle } = useSelector((state) => state.learningStyle);
  const {
    metrics,
    progress,
    recommendations,
    nextTopic,
    studyPlan,
    activityFeed,
    upcomingReviews,
    notifications,
    unreadCount,
    engagement,
    mastery,
    loading,
  } = useSelector((state) => state.dashboard);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const userId = user?.id || user?.email;

  // Connect to WebSocket for real-time updates
  const { wsConnected } = useDashboardWebSocket(userId);

  // Fetch dashboard data on mount
  useEffect(() => {
    if (userId) {
      dispatch(fetchDashboardMetrics(userId));
      dispatch(fetchEngagementData(userId));
      dispatch(fetchMastery(userId));
      dispatch(fetchNextTopic(userId));
      dispatch(fetchStudyPlan(userId));
      dispatch(fetchActivityFeed(userId));
      dispatch(fetchUpcomingReviews(userId));
    }
  }, [userId, dispatch]);

  // Quick action cards configuration
  const quickActions = [
    {
      id: 'continue',
      title: 'Continue Learning',
      description: nextTopic?.title || 'Resume your last topic',
      icon: <FiBook />,
      gradient: 'from-primary-500 to-primary-600',
      action: () => navigate(nextTopic?.path || ROUTES.LEARN),
    },
    {
      id: 'quiz',
      title: 'Take a Quiz',
      description: 'Test your knowledge',
      icon: <FiTarget />,
      gradient: 'from-secondary-500 to-secondary-600',
      action: () => navigate(ROUTES.QUIZ),
    },
    {
      id: 'upload',
      title: 'Upload Content',
      description: 'Add new learning materials',
      icon: <FiUpload />,
      gradient: 'from-success-500 to-success-600',
      action: () => navigate(ROUTES.UPLOAD),
    },
    {
      id: 'study-room',
      title: 'Join Study Room',
      description: 'Collaborate with peers',
      icon: <FiUsers />,
      gradient: 'from-warning-500 to-warning-600',
      action: () => navigate(ROUTES.STUDY_ROOM),
    },
    {
      id: 'flashcards',
      title: 'Review Flashcards',
      description: 'Spaced repetition practice',
      icon: <FiZap />,
      gradient: 'from-purple-500 to-purple-600',
      action: () => navigate('/flashcards'),
    },
  ];

  // Stats cards
  const stats = [
    { 
      icon: <FiBook />, 
      label: 'Courses', 
      value: metrics.totalCourses || 0,
      subValue: `${metrics.completedCourses || 0} completed`,
      color: 'bg-primary-100 text-primary-500' 
    },
    { 
      icon: <FiClock />, 
      label: 'Study Hours', 
      value: Math.round(metrics.studyHours || 0),
      subValue: 'This month',
      color: 'bg-success-100 text-success-500' 
    },
    { 
      icon: <FiTarget />, 
      label: 'Mastery Score', 
      value: `${Math.round(mastery.overall || 0)}%`,
      subValue: 'Overall progress',
      color: 'bg-secondary-100 text-secondary-500' 
    },
    { 
      icon: <FiAward />, 
      label: 'Achievements', 
      value: metrics.achievements || 0,
      subValue: 'Unlocked',
      color: 'bg-warning-100 text-warning-500' 
    },
  ];

  if (loading.metrics && !metrics.totalCourses) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <LoadingSpinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-custom py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-neutral-900 mb-2">
                Welcome back, {profile?.name || user?.name || 'Learner'}! 👋
              </h1>
              <div className="flex items-center gap-4 text-neutral-600">
                {learningStyle?.primaryStyle && (
                  <span className="flex items-center gap-2">
                    <FiZap className="text-primary-500" />
                    Learning Style: <span className="font-semibold capitalize">{learningStyle.primaryStyle}</span>
                  </span>
                )}
                {wsConnected && (
                  <span className="flex items-center gap-2 text-success-600">
                    <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
                    Live Updates Active
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                onClick={() => navigate('/notifications')}
              >
                <FiBell className="w-6 h-6 text-neutral-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-error-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <button
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                onClick={() => navigate(ROUTES.PROFILE)}
              >
                <FiSettings className="w-6 h-6 text-neutral-600" />
              </button>
            </div>
          </div>

          {/* Daily Progress Bar */}
          {engagement.dailyGoal > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700">
                  Daily Goal Progress
                </span>
                <span className="text-sm font-semibold text-primary-600">
                  {engagement.dailyProgress}/{engagement.dailyGoal} min
                </span>
              </div>
              <ProgressBar 
                progress={(engagement.dailyProgress / engagement.dailyGoal) * 100} 
                size="md" 
                color="primary" 
              />
            </motion.div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={action.action}
                className="cursor-pointer"
              >
                <Card className="text-center h-full">
                  <div className="p-6">
                    <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white text-3xl shadow-lg`}>
                      {action.icon}
                    </div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {action.title}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      {action.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <Card>
                <div className="flex items-center gap-4 p-6">
                  <div className={`w-14 h-14 rounded-xl ${stat.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                    {stat.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-3xl font-bold text-neutral-900">{stat.value}</p>
                    <p className="text-sm text-neutral-600 truncate">{stat.label}</p>
                    <p className="text-xs text-neutral-500">{stat.subValue}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Learning Progress */}
            <LearningProgress progress={progress} mastery={mastery} loading={loading.progress} />

            {/* Study Plan / Recommendations */}
            <StudyPlanSection 
              studyPlan={studyPlan} 
              recommendations={recommendations}
              nextTopic={nextTopic}
              loading={loading.recommendations} 
            />

            {/* Activity Feed */}
            <ActivityFeed activityFeed={activityFeed} loading={loading.activityFeed} />
          </div>

          {/* Right Sidebar (1/3) */}
          <div className="space-y-6">
            {/* Streak Counter */}
            <StreakCounter streak={metrics.streak} />

            {/* Upcoming Reviews */}
            <UpcomingReviews reviews={upcomingReviews} loading={loading.activityFeed} />

            {/* Recent Achievements */}
            <RecentAchievements 
              achievements={activityFeed.filter(item => item.type === 'achievement').slice(0, 5)} 
            />

            {/* Time Spent Chart */}
            <TimeSpentChart timeData={progress.timeSpent} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Learning Progress Component
const LearningProgress = ({ progress, mastery, loading }) => {
  if (loading) {
    return (
      <Card>
        <div className="card-header">
          <h2 className="text-xl font-semibold text-neutral-900">Learning Progress</h2>
        </div>
        <div className="card-body flex items-center justify-center py-12">
          <LoadingSpinner size="md" />
        </div>
      </Card>
    );
  }

  const subjects = progress.subjects || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card>
        <div className="card-header">
          <h2 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
            <FiTrendingUp /> Learning Progress
          </h2>
        </div>
        <div className="card-body space-y-6">
          {subjects.length > 0 ? (
            subjects.map((subject, index) => (
              <motion.div
                key={subject.name || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{subject.icon || '📚'}</span>
                    <div>
                      <h3 className="font-semibold text-neutral-900">{subject.name}</h3>
                      <p className="text-sm text-neutral-600">
                        {subject.completedTopics || 0}/{subject.totalTopics || 0} topics completed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">
                      {subject.progress || 0}%
                    </p>
                    <p className="text-xs text-neutral-500">
                      Mastery: {mastery.bySubject?.[subject.name] || 0}%
                    </p>
                  </div>
                </div>
                <ProgressBar progress={subject.progress || 0} size="md" color="primary" />
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-neutral-600">
              <FiBook className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
              <p>Start learning to see your progress here</p>
            </div>
          )}

          {/* Mastery Heatmap Preview */}
          {progress.masteryHeatmap && progress.masteryHeatmap.length > 0 && (
            <div className="pt-4 border-t border-neutral-200">
              <h3 className="text-sm font-semibold text-neutral-700 mb-3">Activity Heatmap</h3>
              <div className="grid grid-cols-7 gap-2">
                {progress.masteryHeatmap.slice(0, 35).map((day, index) => (
                  <div
                    key={index}
                    className={`aspect-square rounded ${
                      day.value === 0
                        ? 'bg-neutral-100'
                        : day.value < 30
                        ? 'bg-primary-200'
                        : day.value < 60
                        ? 'bg-primary-400'
                        : 'bg-primary-600'
                    }`}
                    title={`${day.date}: ${day.value} min`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

// Study Plan Section Component
const StudyPlanSection = ({ studyPlan, recommendations, nextTopic, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card>
        <div className="card-body flex items-center justify-center py-12">
          <LoadingSpinner size="md" />
        </div>
      </Card>
    );
  }

  const topics = recommendations || studyPlan?.topics || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card>
        <div className="card-header">
          <h2 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
            <FiTarget /> Recommended for You
          </h2>
        </div>
        <div className="card-body">
          {topics.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-4">
              {topics.slice(0, 3).map((topic, index) => (
                <motion.div
                  key={topic.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="p-4 border-2 border-neutral-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate(topic.path || ROUTES.LEARN)}
                >
                  <div className="text-3xl mb-3">{topic.icon || '📖'}</div>
                  <h3 className="font-semibold text-neutral-900 mb-2">{topic.title}</h3>
                  <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                    {topic.description || 'Continue your learning journey'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>{topic.difficulty || 'Intermediate'}</span>
                    <span>{topic.duration || '30 min'}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-600">
              <FiTarget className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
              <p>We're preparing personalized recommendations for you</p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

// Activity Feed Component
const ActivityFeed = ({ activityFeed, loading }) => {
  if (loading) {
    return (
      <Card>
        <div className="card-body flex items-center justify-center py-12">
          <LoadingSpinner size="md" />
        </div>
      </Card>
    );
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'achievement':
        return <FiAward className="text-warning-500" />;
      case 'progress':
        return <FiTrendingUp className="text-primary-500" />;
      case 'completion':
        return <FiCheckCircle className="text-success-500" />;
      case 'peer_online':
        return <FiUsers className="text-info-500" />;
      default:
        return <FiActivity className="text-neutral-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card>
        <div className="card-header">
          <h2 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
            <FiActivity /> Activity Feed
          </h2>
        </div>
        <div className="card-body space-y-3 max-h-96 overflow-y-auto">
          {activityFeed.length > 0 ? (
            activityFeed.map((activity, index) => (
              <motion.div
                key={activity.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.03 }}
                className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-900 font-medium">
                    {activity.data?.message || activity.data?.title || 'Activity update'}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-neutral-600">
              <FiActivity className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

// Streak Counter Component
const StreakCounter = ({ streak }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6 }}
    >
      <Card className="bg-gradient-to-br from-warning-500 to-warning-600 text-white">
        <div className="card-body text-center">
          <div className="text-6xl mb-3">🔥</div>
          <h3 className="text-5xl font-bold mb-2">{streak || 0}</h3>
          <p className="text-white/90 text-lg">Day Streak</p>
          <p className="text-white/80 text-sm mt-2">
            Keep learning daily to maintain your streak!
          </p>
        </div>
      </Card>
    </motion.div>
  );
};

// Upcoming Reviews Component
const UpcomingReviews = ({ reviews, loading }) => {
  if (loading) {
    return (
      <Card>
        <div className="card-body flex items-center justify-center py-8">
          <LoadingSpinner size="sm" />
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.7 }}
    >
      <Card>
        <div className="card-header">
          <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <FiCalendar /> Upcoming Reviews
          </h3>
        </div>
        <div className="card-body space-y-3">
          {reviews && reviews.length > 0 ? (
            reviews.slice(0, 5).map((review, index) => (
              <div
                key={review.id || index}
                className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-neutral-900 text-sm">
                    {review.topic || 'Review topic'}
                  </p>
                  <p className="text-xs text-neutral-600">
                    {review.subject || 'Subject'}
                  </p>
                </div>
                <span className="text-xs font-semibold text-warning-600">
                  {review.dueIn || 'Today'}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-neutral-600">
              <FiCalendar className="w-10 h-10 mx-auto mb-2 text-neutral-400" />
              <p className="text-sm">No reviews scheduled</p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

// Recent Achievements Component
const RecentAchievements = ({ achievements }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8 }}
    >
      <Card>
        <div className="card-header">
          <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <FiAward /> Recent Achievements
          </h3>
        </div>
        <div className="card-body space-y-3">
          {achievements.length > 0 ? (
            achievements.map((achievement, index) => (
              <div
                key={achievement.id || index}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-warning-50 to-warning-100 rounded-lg"
              >
                <div className="text-3xl">{achievement.data?.icon || '🏆'}</div>
                <div>
                  <p className="font-medium text-neutral-900 text-sm">
                    {achievement.data?.name || 'Achievement'}
                  </p>
                  <p className="text-xs text-neutral-600">
                    {achievement.data?.description || 'You earned this!'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-neutral-600">
              <FiAward className="w-10 h-10 mx-auto mb-2 text-neutral-400" />
              <p className="text-sm">Start learning to earn achievements</p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

// Time Spent Chart Component
const TimeSpentChart = ({ timeData }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data = timeData || days.map((day, index) => ({ day, minutes: Math.random() * 120 }));
  const maxMinutes = Math.max(...data.map(d => d.minutes || 0), 1);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.9 }}
    >
      <Card>
        <div className="card-header">
          <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <FiClock /> Time Spent (Last 7 Days)
          </h3>
        </div>
        <div className="card-body">
          <div className="flex items-end justify-between gap-2 h-32">
            {data.map((item, index) => {
              const height = (item.minutes / maxMinutes) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.9 + index * 0.05, duration: 0.5 }}
                    className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg min-h-[4px]"
                    title={`${Math.round(item.minutes)} minutes`}
                  />
                  <span className="text-xs text-neutral-600 font-medium">
                    {item.day || days[index]}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-neutral-600">
              Total: <span className="font-semibold text-neutral-900">
                {Math.round(data.reduce((sum, d) => sum + (d.minutes || 0), 0))} minutes
              </span>
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default Dashboard;

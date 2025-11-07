import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiBook, FiGrid, FiList, FiFilter, FiSearch } from 'react-icons/fi';
import { Card, Button, Input, Select } from '../components/shared';
import { SUBJECTS, GRADE_LEVELS } from '../utils/constants';

const Learn = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock content data
  const contents = [
    {
      id: 1,
      title: 'Introduction to Cell Biology',
      subject: 'Biology',
      grade: 'High School',
      description: 'Learn about cell structure, organelles, and cellular processes',
      thumbnail: '🧬',
      progress: 65,
      duration: '45 min',
      lessons: 12
    },
    {
      id: 2,
      title: 'Chemical Reactions Fundamentals',
      subject: 'Chemistry',
      grade: 'High School',
      description: 'Understand chemical reactions, equations, and stoichiometry',
      thumbnail: '⚗️',
      progress: 30,
      duration: '60 min',
      lessons: 15
    },
    {
      id: 3,
      title: 'World War II History',
      subject: 'History',
      grade: 'High School',
      description: 'Explore the causes, events, and consequences of WWII',
      thumbnail: '🌍',
      progress: 0,
      duration: '90 min',
      lessons: 20
    },
    {
      id: 4,
      title: 'Algebra I: Linear Equations',
      subject: 'Mathematics',
      grade: 'Middle School',
      description: 'Master solving and graphing linear equations',
      thumbnail: '📐',
      progress: 85,
      duration: '50 min',
      lessons: 18
    },
    {
      id: 5,
      title: 'Forces and Motion',
      subject: 'Physics',
      grade: 'High School',
      description: "Study Newton's laws and principles of motion",
      thumbnail: '🚀',
      progress: 45,
      duration: '55 min',
      lessons: 14
    },
    {
      id: 6,
      title: 'Spanish Vocabulary Builder',
      subject: 'Language',
      grade: 'Middle School',
      description: 'Expand your Spanish vocabulary with interactive exercises',
      thumbnail: '🗣️',
      progress: 20,
      duration: '40 min',
      lessons: 10
    }
  ];

  const filteredContents = contents.filter((content) => {
    const matchesSubject = selectedSubject === 'all' || content.subject === selectedSubject;
    const matchesGrade = selectedGrade === 'all' || content.grade === selectedGrade;
    const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         content.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesGrade && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">My Learning</h1>
          <p className="text-lg text-neutral-600">Continue your personalized learning journey</p>
        </motion.div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full lg:w-auto">
              <div className="flex-1 min-w-[200px]">
                <Input
                  type="search"
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<FiSearch />}
                />
              </div>
              <Select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                icon={<FiFilter />}
              >
                <option value="all">All Subjects</option>
                {SUBJECTS.map((subject) => (
                  <option key={subject.value} value={subject.label}>
                    {subject.label}
                  </option>
                ))}
              </Select>
              <Select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
              >
                <option value="all">All Grades</option>
                {GRADE_LEVELS.map((grade) => (
                  <option key={grade.value} value={grade.label}>
                    {grade.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'outline'}
                size="sm"
                icon={<FiGrid />}
                onClick={() => setViewMode('grid')}
              />
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                size="sm"
                icon={<FiList />}
                onClick={() => setViewMode('list')}
              />
            </div>
          </div>
        </Card>

        {/* Content Grid/List */}
        <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredContents.map((content, index) => (
            <motion.div
              key={content.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card hover className="h-full cursor-pointer">
                {viewMode === 'grid' ? (
                  <div>
                    <div className="text-6xl text-center py-8 bg-gradient-to-br from-primary-50 to-secondary-50">
                      {content.thumbnail}
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-neutral-900 mb-1">
                            {content.title}
                          </h3>
                          <p className="text-sm text-neutral-600">
                            {content.subject} • {content.grade}
                          </p>
                        </div>
                      </div>
                      <p className="text-neutral-600 mb-4 line-clamp-2">
                        {content.description}
                      </p>
                      <div className="flex items-center justify-between text-sm text-neutral-600 mb-4">
                        <span><FiBook className="inline mr-1" /> {content.lessons} lessons</span>
                        <span>{content.duration}</span>
                      </div>
                      {content.progress > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-neutral-600">Progress</span>
                            <span className="font-semibold text-neutral-900">{content.progress}%</span>
                          </div>
                          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${content.progress}%` }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                              className="h-full bg-gradient-to-r from-primary-500 to-primary-600"
                            />
                          </div>
                        </div>
                      )}
                      <Button variant="primary" size="md" className="w-full">
                        {content.progress > 0 ? 'Continue' : 'Start Learning'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-6 p-6">
                    <div className="text-5xl">{content.thumbnail}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-neutral-900 mb-1">
                        {content.title}
                      </h3>
                      <p className="text-sm text-neutral-600 mb-2">
                        {content.subject} • {content.grade}
                      </p>
                      <p className="text-neutral-600 mb-3">{content.description}</p>
                      <div className="flex items-center gap-4 text-sm text-neutral-600">
                        <span><FiBook className="inline mr-1" /> {content.lessons} lessons</span>
                        <span>{content.duration}</span>
                        {content.progress > 0 && (
                          <span className="font-semibold text-primary-600">
                            {content.progress}% complete
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="primary" size="md">
                      {content.progress > 0 ? 'Continue' : 'Start Learning'}
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredContents.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-semibold text-neutral-900 mb-2">
              No content found
            </h3>
            <p className="text-neutral-600">
              Try adjusting your filters or search query
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Learn;

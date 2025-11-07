import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiUpload, FiBook, FiTrendingUp, FiUsers } from 'react-icons/fi';
import { Button, Card } from '../components/shared';
import { ROUTES, SUBJECTS } from '../utils/constants';

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero text-white py-20">
        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up">
              Re-imagining textbooks<br />for every learner
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 animate-fade-in-up">
              Learn Your Way transforms content into a dynamic and engaging learning experience tailored for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up">
              <Link to={ROUTES.SIGNUP}>
                <Button variant="secondary" size="xl" icon={<FiArrowRight />} iconPosition="right">
                  Get Started Free
                </Button>
              </Link>
              <Link to={ROUTES.UPLOAD}>
                <Button variant="outline" size="xl" icon={<FiUpload />}>
                  Upload Your PDF
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-neutral-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">
              Cutting-edge AI × Pedagogy
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              Learn Your Way demonstrates what's possible when we combine Google's cutting-edge AI research with effective learning science.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <FiBook className="w-8 h-8" />,
                title: 'Personalized Content',
                description: 'AI-powered content adaptation based on your learning style and preferences'
              },
              {
                icon: <FiTrendingUp className="w-8 h-8" />,
                title: 'Progress Tracking',
                description: 'Comprehensive analytics to monitor your learning journey and achievements'
              },
              {
                icon: <FiUsers className="w-8 h-8" />,
                title: 'Collaborative Learning',
                description: 'Study rooms for real-time collaboration with peers and mentors'
              },
              {
                icon: <FiUpload className="w-8 h-8" />,
                title: 'Easy Content Upload',
                description: 'Upload PDFs, documents, and transform them into interactive lessons'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="text-center h-full" hover>
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-500 mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-neutral-600">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">
              Explore Subjects
            </h2>
            <p className="text-xl text-neutral-600">
              Learn across multiple disciplines with personalized content
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {SUBJECTS.map((subject, index) => (
              <motion.div
                key={subject.value}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="text-center cursor-pointer" hover>
                  <div className="py-6">
                    <div className="text-4xl mb-3">{subject.icon}</div>
                    <h3 className="font-semibold text-neutral-900">
                      {subject.label}
                    </h3>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero text-white">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">
              Ready to transform your learning?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Join thousands of learners already using Learn Your Way
            </p>
            <Link to={ROUTES.SIGNUP}>
              <Button variant="secondary" size="xl" icon={<FiArrowRight />} iconPosition="right">
                Start Learning Today
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="container-custom">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Learn Your Way</h3>
              <p className="text-neutral-400">
                Personalized learning powered by AI and learning science
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-neutral-400">
                <li><Link to="/features" className="hover:text-white">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link to="/demo" className="hover:text-white">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-neutral-400">
                <li><Link to="/about" className="hover:text-white">About</Link></li>
                <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link to="/careers" className="hover:text-white">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-neutral-400">
                <li><a href="/privacy" className="hover:text-white">Privacy</a></li>
                <li><a href="/terms" className="hover:text-white">Terms</a></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-800 pt-8 text-center text-neutral-400">
            <p>&copy; 2025 Learn Your Way. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

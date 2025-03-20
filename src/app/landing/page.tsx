'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, 
  CheckCircle, 
  BookOpen, 
  Zap, 
  Layout, 
  Shield, 
  Users
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import SmoothScroll from '@/components/SmoothScroll';

const GlideLandingPage = () => {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/auth/register');
  };

  const handleSignIn = () => {
    router.push('/login');
  };

  return (
    <SmoothScroll>
      <div className="min-h-screen flex flex-col bg-[var(--background)]">
        {/* Navigation */}
        <nav className="bg-[var(--nav-bg)] border-b border-[var(--nav-border)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-[var(--blue-accent)]">Glide</div>
              </div>
              <div className="hidden md:flex items-center space-x-8">
                {/* <a href="#features" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Features</a> */}
                {/* <a href="#why-glide" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Why Glide</a> */}
                {/* <a href="#pricing" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Pricing</a> */}
                <ThemeToggle />
                <button 
                  onClick={handleSignIn}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  aria-label="Sign In"
                >
                  Sign In
                </button>
                <button 
                  onClick={handleGetStarted}
                  className="bg-[var(--blue-accent)] hover:bg-[var(--blue-accent-hover)] text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  aria-label="Sign Up Free"
                >
                  Sign Up Free
                </button>
              </div>
              <div className="md:hidden flex items-center space-x-4">
                <ThemeToggle />
                <button 
                  className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  aria-label="Open menu"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="bg-gradient-to-r from-[var(--background)] to-[var(--background)] py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6">
                  A <span className="text-[var(--blue-accent)]">simpler</span> way to manage your college courses
                </h1>
                <p className="text-xl text-[var(--text-secondary)] mb-8">
                  Forget the clunky Canvas interface. Glide gives you a streamlined, beautiful course dashboard that puts everything you need front and center.
                </p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <button 
                    onClick={handleGetStarted}
                    className="bg-[var(--blue-accent)] hover:bg-[var(--blue-accent-hover)] text-white px-6 py-3 rounded-lg font-medium text-lg transition-colors flex items-center justify-center"
                    aria-label="Get Started"
                    
                  >
                    Get Started <ArrowRight className="ml-2 w-5 h-5" />
                  </button>

                </div>
              </div>
              <div className="bg-[var(--nav-bg)] p-4 rounded-xl shadow-lg border border-[var(--nav-border)]">
                <div className="bg-[var(--background)] rounded-lg p-2">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['CS101', 'MATH202', 'ENG104', 'PHYS101', 'BIO220', 'PSYCH101'].map((course, index) => {
                      const colors = [
                        'bg-[var(--course-blue)]',
                        'bg-[var(--course-purple)]',
                        'bg-[var(--course-green)]',
                        'bg-[var(--course-amber)]',
                        'bg-[var(--course-pink)]',
                        'bg-[var(--course-indigo)]'
                      ];
                      
                      return (
                        <div
                          key={course}
                          className={`${colors[index]} rounded-lg p-4 flex flex-col items-center justify-center h-28 cursor-pointer transition-colors duration-200`}
                        >
                          <p className="text-xs font-semibold text-[var(--card-text-secondary)] mb-1">{course}</p>
                          <h4 className="font-bold text-[var(--card-text)] text-center">
                            {index === 0 ? 'Intro to CS' : 
                             index === 1 ? 'Calculus II' : 
                             index === 2 ? 'Writing' : 
                             index === 3 ? 'Physics I' : 
                             index === 4 ? 'Biology' : 'Psychology'}
                          </h4>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Glide Section */}
        <section id="why-glide" className="py-20 bg-[var(--nav-bg)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Why Switch from Canvas to Glide?</h2>
              <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto">
                Canvas was designed for administrators. Glide was built for students, from the ground up.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="bg-[var(--background)] rounded-xl p-8 border border-[var(--nav-border)] shadow-md">
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Canvas Experience</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg className="h-5 w-5 text-[var(--red-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="ml-3 text-[var(--text-secondary)]">Complex, cluttered interface with too many options</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg className="h-5 w-5 text-[var(--red-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="ml-3 text-[var(--text-secondary)]">Slow loading times and multiple clicks to reach important information</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg className="h-5 w-5 text-[var(--red-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="ml-3 text-[var(--text-secondary)]">Inconsistent design across different sections and features</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg className="h-5 w-5 text-[var(--red-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="ml-3 text-[var(--text-secondary)]">Important deadlines and assignments can get buried</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg className="h-5 w-5 text-[var(--red-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="ml-3 text-[var(--text-secondary)]">Limited customization options for students</p>
                  </li>
                </ul>
              </div>
              
              <div className="bg-[var(--why-glide-bg)] rounded-xl p-8 shadow-md">
                <h3 className="text-2xl font-bold text-[var(--text-light)] mb-6">Glide Experience</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle className="h-5 w-5 text-[var(--green-accent)]" />
                    </div>
                    <p className="ml-3 text-[var(--text-light)]">Clean, intuitive interface focused on what students need</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle className="h-5 w-5 text-[var(--green-accent)]" />
                    </div>
                    <p className="ml-3 text-[var(--text-light)]">One-click access to your courses, assignments, and grades</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle className="h-5 w-5 text-[var(--green-accent)]" />
                    </div>
                    <p className="ml-3 text-[var(--text-light)]">Consistent, modern design throughout the entire platform</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle className="h-5 w-5 text-[var(--green-accent)]" />
                    </div>
                    <p className="ml-3 text-[var(--text-light)]">Priority display of upcoming deadlines and important announcements</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle className="h-5 w-5 text-[var(--green-accent)]" />
                    </div>
                    <p className="ml-3 text-[var(--text-light)]">Personalize your dashboard with custom colors and layouts</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-[var(--background)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Features Students Love</h2>
              <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto">
                Designed with real student feedback to create the ideal learning management experience.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-[var(--nav-bg)] p-8 rounded-xl shadow-md border border-[var(--nav-border)]">
                <div className="w-12 h-12 bg-[var(--foreground)] rounded-lg flex items-center justify-center mb-6">
                  <Zap className="h-6 w-6 text-[var(--background)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Lightning Fast</h3>
                <p className="text-[var(--text-secondary)]">
                  Optimized for speed with instant loading and snappy interactions. No more waiting for pages to load.
                </p>
              </div>
              
              <div className="bg-[var(--nav-bg)] p-8 rounded-xl shadow-md border border-[var(--nav-border)]">
                <div className="w-12 h-12 bg-[var(--foreground)] rounded-lg flex items-center justify-center mb-6">
                  <Layout className="h-6 w-6 text-[var(--background)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Customizable</h3>
                <p className="text-[var(--text-secondary)]">
                  Make Glide yours with custom colors, layouts, and prioritization of the features you use most.
                </p>
              </div>
              
              <div className="bg-[var(--nav-bg)] p-8 rounded-xl shadow-md border border-[var(--nav-border)]">
                <div className="w-12 h-12 bg-[var(--foreground)] rounded-lg flex items-center justify-center mb-6">
                  <BookOpen className="h-6 w-6 text-[var(--background)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Course-Centric</h3>
                <p className="text-[var(--text-secondary)]">
                  Your courses are front and center, with visual organization that makes it easy to focus on what matters.
                </p>
              </div>
              
              <div className="bg-[var(--nav-bg)] p-8 rounded-xl shadow-md border border-[var(--nav-border)]">
                <div className="w-12 h-12 bg-[var(--foreground)] rounded-lg flex items-center justify-center mb-6">
                  <Shield className="h-6 w-6 text-[var(--background)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Secure</h3>
                <p className="text-[var(--text-secondary)]">
                  End-to-end encryption and modern security practices keep your academic information safe.
                </p>
              </div>
              
              <div className="bg-[var(--nav-bg)] p-8 rounded-xl shadow-md border border-[var(--nav-border)]">
                <div className="w-12 h-12 bg-[var(--foreground)] rounded-lg flex items-center justify-center mb-6">
                  <Users className="h-6 w-6 text-[var(--background)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Collaborative</h3>
                <p className="text-[var(--text-secondary)]">
                  Built-in tools for group projects, discussion, and peer feedback make teamwork seamless.
                </p>
              </div>
              
              <div className="bg-[var(--nav-bg)] p-8 rounded-xl shadow-md border border-[var(--nav-border)]">
                <div className="w-12 h-12 bg-[var(--foreground)] rounded-lg flex items-center justify-center mb-6">
                  <svg className="h-6 w-6 text-[var(--background)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Mobile-First</h3>
                <p className="text-[var(--text-secondary)]">
                  A fully responsive design means Glide works beautifully on all your devices, from phone to desktop.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-[var(--blue-accent)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-[var(--text-light)] mb-6">Ready to transform your academic experience?</h2>
            <p className="text-xl text-[var(--text-light)] mb-8 max-w-3xl mx-auto">
              Join thousands of students who&apos;ve made the switch to Glide. Your courses, your way.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button 
                onClick={handleGetStarted}
                className="bg-[var(--background)] text-[var(--text-primary)] hover:bg-[var(--nav-bg)] px-8 py-3 rounded-lg font-medium text-lg transition-colors"
                aria-label="Sign Up Free"
              >
                Sign Up Free
              </button>

            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[var(--background)] border-t border-[var(--nav-border)] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="text-2xl font-bold text-[var(--blue-accent)] mb-4">Glide</div>
                <p className="text-[var(--text-secondary)] mb-4">A better way to manage your college courses.</p>
                <div className="flex space-x-4">
                  {/* <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                    <span className="sr-only">Twitter</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                    <span className="sr-only">Facebook</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                    <span className="sr-only">Instagram</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.398.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 01-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a> */}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Features</a></li>
                <li><a href="#pricing" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Pricing</a></li>
                <li><a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">API</a></li>
                <li><a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">About</a></li>
                <li><a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Blog</a></li>
                <li><a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Careers</a></li>
                <li><a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Privacy</a></li>
                <li><a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Terms</a></li>
                <li><a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-[var(--nav-border)]">
            <p className="text-[var(--text-secondary)] text-sm text-center">
              &copy; {new Date().getFullYear()} Glide, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  </SmoothScroll>
  );
};

export default GlideLandingPage;

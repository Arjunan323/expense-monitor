import React, { useState } from 'react';
import {
  ArrowRight,
  Smartphone,
  Monitor,
  Star,
  CheckCircle,
  BarChart3,
  PieChart,
  RefreshCcw,
  Shield,
  Zap,
  TrendingUp,
  Users,
  Mail,
  Download,
  Play,
  Menu,
  X,
  Upload
} from 'lucide-react';
import { AboutUsSection } from './AboutUs';
import { FAQSection } from './FAQ';
import { SupportSection } from './Support';
import { ContactSection } from './ContactUs';
import { PrivacyPolicySection } from './PrivacyPolicy';
import { TermsSection } from './TermsOfService';
import { Modal } from './ui/Modal';

export const LandingPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSent, setContactSent] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle email subscription
    console.log('Email submitted:', email);
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">EM</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Expense Monitor</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#features" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Features</a>
                <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">How It Works</a>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Pricing</a>
                <a href="#about" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">About</a>
                <a href="#faq" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">FAQ</a>
                <a href="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Sign In</a>
                <a href="/login" className="btn-primary">Get Started</a>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-gray-900 p-2"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-100">
              <a href="#features" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900">Features</a>
              <a href="#how-it-works" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900">How It Works</a>
              <a href="#pricing" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="#about" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900">About</a>
              <a href="#faq" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900">FAQ</a>
              <a href="/login" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900">Sign In</a>
              <a href="/login" className="block px-3 py-2 text-base font-medium bg-primary-600 text-white rounded-lg">Get Started</a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-blue-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Take control of your
                <span className="text-primary-600 block">finances</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                AI-powered expense tracking that automatically categorizes your transactions,
                provides insights, and helps you make smarter financial decisions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a href="/login" className="btn-primary text-lg px-8 py-4 flex items-center justify-center space-x-2">
                  <span>Sign Up Free</span>
                  <ArrowRight className="w-5 h-5" />
                </a>
                <button className="btn-secondary text-lg px-8 py-4 flex items-center justify-center space-x-2">
                  <Download className="w-5 h-5" />
                  <span>Download App</span>
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                No credit card required • Free forever plan available
              </p>
            </div>

            <div className="relative">
              <div className="relative z-10">
                <img
                  src="https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Expense Monitor Dashboard"
                  className="rounded-2xl shadow-2xl"
                />
              </div>
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-primary-200 rounded-full opacity-20"></div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-blue-200 rounded-full opacity-20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to manage your money
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed to give you complete control over your financial life
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card text-center group hover:shadow-lg transition-shadow duration-300">
              <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-200 transition-colors">
                <Zap className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart AI Categorization</h3>
              <p className="text-gray-600">
                Upload bank statements and let AI automatically categorize your transactions with 95% accuracy.
              </p>
            </div>

            <div className="card text-center group hover:shadow-lg transition-shadow duration-300">
              <div className="w-16 h-16 bg-success-100 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:bg-success-200 transition-colors">
                <PieChart className="w-8 h-8 text-success-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Visual Analytics</h3>
              <p className="text-gray-600">
                Beautiful charts and insights help you understand your spending patterns and identify savings opportunities.
              </p>
            </div>

            <div className="card text-center group hover:shadow-lg transition-shadow duration-300">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                <RefreshCcw className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Cross-Platform Sync</h3>
              <p className="text-gray-600">
                Access your financial data anywhere with seamless sync between web and mobile applications.
              </p>
            </div>

            <div className="card text-center group hover:shadow-lg transition-shadow duration-300">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-200 transition-colors">
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Advanced Reports</h3>
              <p className="text-gray-600">
                Generate detailed monthly and weekly reports to track your financial progress and goals.
              </p>
            </div>

            <div className="card text-center group hover:shadow-lg transition-shadow duration-300">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-200 transition-colors">
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Bank-Level Security</h3>
              <p className="text-gray-600">
                Your financial data is protected with enterprise-grade security and encryption.
              </p>
            </div>

            <div className="card text-center group hover:shadow-lg transition-shadow duration-300">
              <div className="w-16 h-16 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:bg-teal-200 transition-colors">
                <TrendingUp className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Budget Planning</h3>
              <p className="text-gray-600">
                Set budgets by category and get alerts when you're approaching your limits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Experience Preview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Get started in minutes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our intuitive interface makes expense tracking effortless. See how easy it is to take control of your finances.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src="https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Dashboard Interface"
                className="rounded-2xl shadow-xl"
              />
            </div>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Your Statements</h3>
                  <p className="text-gray-600">Simply drag and drop your PDF bank statements. Our AI will do the rest.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Automatic Categorization</h3>
                  <p className="text-gray-600">Watch as transactions are automatically sorted into categories like Food, Travel, and Utilities.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Gain Insights</h3>
                  <p className="text-gray-600">Discover spending patterns, track budgets, and make informed financial decisions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Trusted by thousands of users
            </h2>
            <p className="text-xl text-gray-600">
              See how Expense Monitor is helping people take control of their finances
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-6 italic">
                "Expense Monitor helped me identify where I was overspending. I saved ₹15,000 in just 3 months!"
              </p>
              <div className="flex items-center justify-center space-x-3">
                <img
                  src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100"
                  alt="Priya Sharma"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Priya Sharma</div>
                  <div className="text-sm text-gray-500">Mumbai, India</div>
                </div>
              </div>
            </div>

            <div className="card text-center">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-6 italic">
                "The AI categorization is incredibly accurate. It saves me hours of manual work every month."
              </p>
              <div className="flex items-center justify-center space-x-3">
                <img
                  src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100"
                  alt="Rajesh Kumar"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Rajesh Kumar</div>
                  <div className="text-sm text-gray-500">Bangalore, India</div>
                </div>
              </div>
            </div>

            <div className="card text-center">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-6 italic">
                "Perfect for my small business. The multi-bank support helps me track all my accounts in one place."
              </p>
              <div className="flex items-center justify-center space-x-3">
                <img
                  src="https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=100"
                  alt="Anita Desai"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Anita Desai</div>
                  <div className="text-sm text-gray-500">Delhi, India</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to financial clarity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Create Your Account</h3>
              <p className="text-gray-600">
                Sign up for free in seconds. No credit card required to get started.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="w-10 h-10 text-success-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Upload Bank Statements</h3>
              <p className="text-gray-600">
                Upload PDF statements from any Indian bank. Our AI extracts and categorizes everything automatically.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Track & Analyze</h3>
              <p className="text-gray-600">
                Get instant insights, track spending patterns, and make smarter financial decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your needs. Upgrade or downgrade anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="card border-2 border-gray-200">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Free Plan</h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-gray-900">₹0</span>
                  <span className="text-gray-500">/forever</span>
                </div>
                <p className="text-sm text-gray-600">Perfect for getting started</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                  <span className="text-sm text-gray-700">3 statements per month</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                  <span className="text-sm text-gray-700">Up to 10 pages per statement</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                  <span className="text-sm text-gray-700">AI parsing & categorization</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                  <span className="text-sm text-gray-700">Basic dashboard & analytics</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                  <span className="text-sm text-gray-700">Email support</span>
                </div>
              </div>

              <a href="/login" className="btn-secondary w-full text-center">
                Get Started Free
              </a>
            </div>

            {/* Pro Plan */}
            <div className="card border-2 border-primary-500 bg-primary-50 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-600 text-white">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </span>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Pro Plan</h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-gray-900">₹129</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-600">For power users and small businesses</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                  <span className="text-sm text-gray-700">5 statements per month</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                  <span className="text-sm text-gray-700">Up to 50 pages per statement</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                  <span className="text-sm text-gray-700">Advanced analytics & trends</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                  <span className="text-sm text-gray-700">Category breakdown</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                  <span className="text-sm text-gray-700">Priority support</span>
                </div>
              </div>

              <a href="/login" className="btn-primary w-full text-center">
                Start Pro Trial
              </a>
            </div>

            {/* Premium Plan */}
            <div className="card border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Premium Plan</h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-gray-900">₹299</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-600">For businesses and heavy users</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                  <span className="text-sm text-gray-700">Unlimited statements</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                  <span className="text-sm text-gray-700">Up to 100 pages per statement</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                  <span className="text-sm text-gray-700">Full analytics suite</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                  <span className="text-sm text-gray-700">Priority processing</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                  <span className="text-sm text-gray-700">Early access to features</span>
                </div>
              </div>

              <a href="/login" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 w-full text-center block">
                Start Premium Trial
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Email Subscription */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Stay updated with financial tips
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Get weekly insights, budgeting tips, and product updates delivered to your inbox
          </p>

          <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-white text-primary-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Mail className="w-4 h-4" />
                <span>Subscribe</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Reused Sections (excluding contact/privacy/terms now in modals) */}
      <div className="bg-white"><AboutUsSection /></div>
      <div className="bg-gray-50"><FAQSection /></div>
      <div className="bg-white"><SupportSection /></div>
      {/* ContactSection removed from main flow */}
      {/* PrivacyPolicySection and TermsSection removed from main flow */}

      {/* Modals */}
      <Modal open={showPrivacy} onClose={() => setShowPrivacy(false)} title="Privacy Policy">
        <PrivacyPolicySection />
      </Modal>
      <Modal open={showTerms} onClose={() => setShowTerms(false)} title="Terms of Service">
        <TermsSection />
      </Modal>
      <Modal open={showContact} onClose={() => { setShowContact(false); setTimeout(() => setContactSent(false), 300); }} title="Contact Us">
        {contactSent ? (
          <div className="text-center py-6">
            <div className="text-2xl mb-4">🎉</div>
            <p className="text-gray-700 font-medium mb-2">Message sent!</p>
            <p className="text-sm text-gray-500">We'll get back to you within 24 hours.</p>
            <button onClick={() => setShowContact(false)} className="btn-primary mt-6">Close</button>
          </div>
        ) : (
          <form onSubmit={async (e) => { e.preventDefault(); setContactSubmitting(true); await new Promise(r => setTimeout(r, 800)); setContactSubmitting(false); setContactSent(true); }} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input required value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} className="input-field" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea required value={contactForm.message} onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))} className="input-field min-h-[120px] resize-y" placeholder="How can we help?" />
            </div>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setShowContact(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={contactSubmitting} className="btn-primary flex items-center space-x-2">
                {contactSubmitting && <span className="animate-pulse">Sending...</span>}
                {!contactSubmitting && <span>Send Message</span>}
              </button>
            </div>
            <p className="text-xs text-gray-400">By submitting, you agree to our <button type="button" onClick={() => { setShowContact(false); setShowPrivacy(true); }} className="underline hover:text-gray-600">Privacy Policy</button>.</p>
          </form>
        )}
      </Modal>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">EM</span>
                </div>
                <span className="text-xl font-bold">Expense Monitor</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                AI-powered expense tracking that helps you take control of your finances and make smarter money decisions.
              </p>
              <div className="flex space-x-4">
                <button className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                  <Download className="w-4 h-4" />
                  <span className="text-sm">App Store</span>
                </button>
                <button className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                  <Download className="w-4 h-4" />
                  <span className="text-sm">Google Play</span>
                </button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#support" className="hover:text-white transition-colors">Support</a></li>
                <li><button onClick={() => setShowContact(true)} className="hover:text-white transition-colors text-left">Contact</button></li>
                <li><button onClick={() => setShowPrivacy(true)} className="hover:text-white transition-colors text-left">Privacy Policy</button></li>
                <li><button onClick={() => setShowTerms(true)} className="hover:text-white transition-colors text-left">Terms of Service</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Expense Monitor. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
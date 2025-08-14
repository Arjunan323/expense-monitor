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
  Upload,
  Scissors,
  Target,
  Sparkles,
  Heart,
  DollarSign,
  TrendingDown
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
    console.log('Email submitted:', email);
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-lg border-b border-brand-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18">
            <div className="logo-container">
              <div className="logo-icon">
                <img 
                  src="/logo.png" 
                  alt="CutTheSpend" 
                  className="w-8 h-8"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <Scissors className="w-6 h-6 text-white hidden" />
              </div>
              <div>
                <span className="logo-text">CutTheSpend</span>
                <p className="text-xs text-brand-gray-500 font-medium">See it. Cut it. Save more.</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-2">
                <a href="#features" className="nav-link">Features</a>
                <a href="#how-it-works" className="nav-link">How It Works</a>
                <a href="#pricing" className="nav-link">Pricing</a>
                <a href="#about" className="nav-link">About</a>
                <a href="#faq" className="nav-link">FAQ</a>
                <a href="/login" className="nav-link">Sign In</a>
                <a href="/login" className="btn-primary">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get Started Free
                </a>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-brand-gray-600 hover:text-brand-green-600 p-2 rounded-xl transition-colors duration-300"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-lg border-t border-brand-gray-100">
            <div className="px-4 pt-4 pb-6 space-y-2">
              <a href="#features" className="block nav-link">Features</a>
              <a href="#how-it-works" className="block nav-link">How It Works</a>
              <a href="#pricing" className="block nav-link">Pricing</a>
              <a href="#about" className="block nav-link">About</a>
              <a href="#faq" className="block nav-link">FAQ</a>
              <a href="/login" className="block nav-link">Sign In</a>
              <a href="/login" className="block btn-primary text-center mt-4">
                <Sparkles className="w-4 h-4 mr-2" />
                Get Started Free
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-green-50 via-white to-secondary-50 overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-20 left-10 w-40 h-40 bg-brand-green-200 rounded-full opacity-20 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent-200 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-secondary-200 rounded-full opacity-20 animate-bounce-gentle" style={{ animationDelay: '2s' }}></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center bg-gradient-funky text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 animate-bounce-gentle">
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Powered Expense Tracking
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-heading font-bold leading-tight mb-6">
                Take control of your
                <span className="gradient-text block animate-fade-in">finances</span>
              </h1>
              <p className="text-xl text-brand-gray-600 mb-8 leading-relaxed">
                Smart expense tracking that automatically categorizes your spending,
                identifies savings opportunities, and helps you cut unnecessary expenses.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <a href="/login" className="btn-primary text-lg px-8 py-4 flex items-center justify-center space-x-2 group">
                  <Sparkles className="w-5 h-5 group-hover:animate-wiggle" />
                  <span>Sign Up Free</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </a>
                <button className="btn-secondary text-lg px-8 py-4 flex items-center justify-center space-x-2 group">
                  <Download className="w-5 h-5 group-hover:animate-bounce-gentle" />
                  <span>Download App</span>
                </button>
              </div>
              <div className="flex items-center justify-center lg:justify-start space-x-6 text-sm text-brand-gray-500">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-brand-green-500 rounded-full animate-pulse"></div>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-secondary-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  <span>Free forever plan</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-accent-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                  <span>Bank-level security</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10 animate-fade-in">
                <img
                  src="https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="CutTheSpend Dashboard"
                  className="rounded-3xl shadow-funky-lg transform hover:scale-105 transition-transform duration-500"
                />
                {/* Floating Elements */}
                <div className="absolute -top-6 -right-6 bg-gradient-green text-white p-4 rounded-2xl shadow-glow-green animate-float">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-gradient-yellow text-brand-gray-900 p-4 rounded-2xl shadow-glow-yellow animate-float" style={{ animationDelay: '1s' }}>
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
              <div className="absolute -top-8 -right-8 w-40 h-40 bg-brand-green-200 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-accent-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-white to-brand-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-gradient-funky text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 animate-bounce-gentle">
              <Target className="w-4 h-4 mr-2" />
              Powerful Features
            </div>
            <h2 className="section-title">
              Everything you need to cut spending
            </h2>
            <p className="section-subtitle">
              Powerful features designed to help you save more money and make smarter financial decisions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="feature-card group">
              <div className="feature-icon bg-gradient-green group-hover:shadow-glow-green">
                <Scissors className="w-8 h-8 text-white group-hover:animate-wiggle" />
              </div>
              <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-3">Smart Expense Cutting</h3>
              <p className="text-brand-gray-600">
                AI identifies unnecessary expenses and suggests where you can cut spending to save more money.
              </p>
            </div>

            <div className="feature-card group">
              <div className="feature-icon bg-gradient-blue group-hover:shadow-glow-blue">
                <Zap className="w-8 h-8 text-white group-hover:animate-bounce-gentle" />
              </div>
              <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-3">Auto Categorization</h3>
              <p className="text-brand-gray-600">
                Upload bank statements and watch AI automatically categorize your transactions with 95% accuracy.
              </p>
            </div>

            <div className="feature-card group">
              <div className="feature-icon bg-gradient-yellow group-hover:shadow-glow-yellow">
                <PieChart className="w-8 h-8 text-brand-gray-900 group-hover:animate-wiggle" />
              </div>
              <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-3">Visual Insights</h3>
              <p className="text-brand-gray-600">
                Beautiful charts and insights help you understand spending patterns and find savings opportunities.
              </p>
            </div>

            <div className="feature-card group">
              <div className="feature-icon bg-gradient-to-br from-brand-green-400 to-secondary-500 group-hover:shadow-glow-green">
                <RefreshCcw className="w-8 h-8 text-white group-hover:animate-wiggle" />
              </div>
              <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-3">Cross-Platform Sync</h3>
              <p className="text-brand-gray-600">
                Access your financial data anywhere with seamless sync between web and mobile applications.
              </p>
            </div>

            <div className="feature-card group">
              <div className="feature-icon bg-gradient-to-br from-secondary-400 to-brand-green-500 group-hover:shadow-glow-blue">
                <BarChart3 className="w-8 h-8 text-white group-hover:animate-bounce-gentle" />
              </div>
              <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-3">Smart Reports</h3>
              <p className="text-brand-gray-600">
                Generate detailed monthly and weekly reports to track your progress and celebrate savings wins.
              </p>
            </div>

            <div className="feature-card group">
              <div className="feature-icon bg-gradient-to-br from-accent-400 to-brand-green-500 group-hover:shadow-glow-yellow">
                <Shield className="w-8 h-8 text-white group-hover:animate-wiggle" />
              </div>
              <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-3">Bank-Level Security</h3>
              <p className="text-brand-gray-600">
                Your financial data is protected with enterprise-grade security and encryption.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Experience Preview */}
      <section className="py-20 bg-gradient-to-br from-brand-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-gradient-funky text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 animate-bounce-gentle">
              <Heart className="w-4 h-4 mr-2" />
              Easy to Use
            </div>
            <h2 className="section-title">
              Get started in minutes
            </h2>
            <p className="section-subtitle">
              Our intuitive interface makes expense tracking fun and effortless. See how easy it is to start saving.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Dashboard Interface"
                className="rounded-3xl shadow-funky-lg transform hover:scale-105 transition-transform duration-500"
              />
              {/* Floating UI Elements */}
              <div className="absolute -top-4 -right-4 bg-gradient-green text-white p-3 rounded-2xl shadow-glow-green animate-float">
                <span className="font-mono font-bold">₹2,450</span>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-gradient-yellow text-brand-gray-900 p-3 rounded-2xl shadow-glow-yellow animate-float" style={{ animationDelay: '1s' }}>
                <span className="font-mono font-bold">Saved!</span>
              </div>
            </div>
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-green rounded-2xl flex items-center justify-center flex-shrink-0 shadow-glow-green">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
                <div>
                  <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-2">Upload Your Statements</h3>
                  <p className="text-brand-gray-600">Simply drag and drop your PDF bank statements. Our AI will extract and categorize everything automatically.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-blue rounded-2xl flex items-center justify-center flex-shrink-0 shadow-glow-blue">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <div>
                  <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-2">Discover Spending Patterns</h3>
                  <p className="text-brand-gray-600">Watch as transactions are automatically sorted and analyzed to reveal where your money really goes.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-yellow rounded-2xl flex items-center justify-center flex-shrink-0 shadow-glow-yellow">
                  <span className="text-brand-gray-900 font-bold text-lg">3</span>
                </div>
                <div>
                  <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-2">Start Saving More</h3>
                  <p className="text-brand-gray-600">Get personalized recommendations and track your progress as you cut unnecessary expenses.</p>
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
            <div className="inline-flex items-center bg-gradient-funky text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 animate-bounce-gentle">
              <Users className="w-4 h-4 mr-2" />
              Happy Customers
            </div>
            <h2 className="section-title">
              Trusted by thousands of savers
            </h2>
            <p className="section-subtitle">
              See how CutTheSpend is helping people save money and take control of their finances
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card-funky text-center group hover:scale-105 transition-transform duration-300">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-accent-500 fill-current" />
                ))}
              </div>
              <p className="text-brand-gray-600 mb-6 italic font-medium">
                "CutTheSpend helped me identify ₹15,000 in unnecessary expenses. I'm saving so much more now! 🎉"
              </p>
              <div className="flex items-center justify-center space-x-3">
                <img
                  src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100"
                  alt="Priya Sharma"
                  className="w-12 h-12 rounded-2xl object-cover"
                />
                <div className="text-left">
                  <div className="font-heading font-bold text-brand-gray-900">Priya Sharma</div>
                  <div className="text-sm text-brand-gray-500">Mumbai, India</div>
                </div>
              </div>
            </div>

            <div className="card-funky text-center group hover:scale-105 transition-transform duration-300">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-accent-500 fill-current" />
                ))}
              </div>
              <p className="text-brand-gray-600 mb-6 italic font-medium">
                "The AI categorization is incredibly accurate. It saves me hours every month and shows exactly where to cut! ✂️"
              </p>
              <div className="flex items-center justify-center space-x-3">
                <img
                  src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100"
                  alt="Rajesh Kumar"
                  className="w-12 h-12 rounded-2xl object-cover"
                />
                <div className="text-left">
                  <div className="font-heading font-bold text-brand-gray-900">Rajesh Kumar</div>
                  <div className="text-sm text-brand-gray-500">Bangalore, India</div>
                </div>
              </div>
            </div>

            <div className="card-funky text-center group hover:scale-105 transition-transform duration-300">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-accent-500 fill-current" />
                ))}
              </div>
              <p className="text-brand-gray-600 mb-6 italic font-medium">
                "Perfect for my business! Multi-bank support helps me track everything in one place and cut costs. 💼"
              </p>
              <div className="flex items-center justify-center space-x-3">
                <img
                  src="https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=100"
                  alt="Anita Desai"
                  className="w-12 h-12 rounded-2xl object-cover"
                />
                <div className="text-left">
                  <div className="font-heading font-bold text-brand-gray-900">Anita Desai</div>
                  <div className="text-sm text-brand-gray-500">Delhi, India</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-brand-green-50 to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-gradient-funky text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 animate-bounce-gentle">
              <Play className="w-4 h-4 mr-2" />
              How It Works
            </div>
            <h2 className="section-title">
              Three simple steps to financial freedom
            </h2>
            <p className="section-subtitle">
              Start cutting expenses and saving money in just minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-green rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow-green group-hover:animate-bounce-gentle">
                <Users className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-3">1. Create Your Account</h3>
              <p className="text-brand-gray-600">
                Sign up for free in seconds. No credit card required to start your savings journey.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-blue rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow-blue group-hover:animate-bounce-gentle">
                <Upload className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-3">2. Upload Bank Statements</h3>
              <p className="text-brand-gray-600">
                Upload PDF statements from any Indian bank. Our AI extracts and categorizes everything automatically.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-yellow rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow-yellow group-hover:animate-bounce-gentle">
                <Scissors className="w-12 h-12 text-brand-gray-900" />
              </div>
              <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-3">3. Cut & Save</h3>
              <p className="text-brand-gray-600">
                Get insights, cut unnecessary expenses, and watch your savings grow month after month.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-gradient-funky text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 animate-bounce-gentle">
              <DollarSign className="w-4 h-4 mr-2" />
              Simple Pricing
            </div>
            <h2 className="section-title">
              Choose your savings plan
            </h2>
            <p className="section-subtitle">
              Start free and upgrade as you save more. All plans include our core expense cutting features.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="card border-2 border-brand-gray-200 hover:border-brand-green-300 transition-all duration-300">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-brand-gray-100 to-brand-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-brand-gray-600" />
                </div>
                <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-2">Free Plan</h3>
                <div className="mb-2">
                  <span className="text-4xl font-heading font-bold text-brand-gray-900">₹0</span>
                  <span className="text-brand-gray-500">/forever</span>
                </div>
                <p className="text-sm text-brand-gray-600">Perfect for getting started</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-brand-green-500" />
                  <span className="text-sm text-brand-gray-700">3 statements per month</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-brand-green-500" />
                  <span className="text-sm text-brand-gray-700">Up to 10 pages per statement</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-brand-green-500" />
                  <span className="text-sm text-brand-gray-700">AI parsing & categorization</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-brand-green-500" />
                  <span className="text-sm text-brand-gray-700">Basic dashboard & analytics</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-brand-green-500" />
                  <span className="text-sm text-brand-gray-700">Email support</span>
                </div>
              </div>

              <a href="/login" className="btn-secondary w-full text-center">
                Get Started Free
              </a>
            </div>

            {/* Pro Plan */}
            <div className="card border-2 border-brand-green-400 bg-gradient-to-br from-brand-green-50 to-white relative transform scale-105 shadow-funky-lg">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-green text-white shadow-glow-green animate-pulse-slow">
                  <Star className="w-4 h-4 mr-1" />
                  Most Popular
                </span>
              </div>

              <div className="text-center mb-6 pt-4">
                <div className="w-16 h-16 bg-gradient-green rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-glow-green">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-2">Pro Plan</h3>
                <div className="mb-2">
                  <span className="text-4xl font-heading font-bold gradient-text">₹129</span>
                  <span className="text-brand-gray-500">/month</span>
                </div>
                <p className="text-sm text-brand-gray-600">For power users and small businesses</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-brand-green-500" />
                  <span className="text-sm text-brand-gray-700">5 statements per month</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-brand-green-500" />
                  <span className="text-sm text-brand-gray-700">Up to 50 pages per statement</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-brand-green-500" />
                  <span className="text-sm text-brand-gray-700">Advanced analytics & trends</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-brand-green-500" />
                  <span className="text-sm text-brand-gray-700">Category breakdown</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-brand-green-500" />
                  <span className="text-sm text-brand-gray-700">Priority support</span>
                </div>
              </div>

              <a href="/login" className="btn-primary w-full text-center">
                Start Pro Trial
              </a>
            </div>

            {/* Premium Plan */}
            <div className="card border-2 border-accent-400 bg-gradient-to-br from-accent-50 to-white relative">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-funky rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-glow-yellow">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-2">Premium Plan</h3>
                <div className="mb-2">
                  <span className="text-4xl font-heading font-bold gradient-text">₹299</span>
                  <span className="text-brand-gray-500">/month</span>
                </div>
                <p className="text-sm text-brand-gray-600">For businesses and heavy users</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-brand-green-500" />
                  <span className="text-sm text-brand-gray-700">Unlimited statements</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-brand-green-500" />
                  <span className="text-sm text-brand-gray-700">Up to 100 pages per statement</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-brand-green-500" />
                  <span className="text-sm text-brand-gray-700">Full analytics suite</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-brand-green-500" />
                  <span className="text-sm text-brand-gray-700">Priority processing</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-brand-green-500" />
                  <span className="text-sm text-brand-gray-700">Early access to features</span>
                </div>
              </div>

              <button className="btn-accent w-full">
                Start Premium Trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Email Subscription */}
      <section className="py-20 bg-gradient-funky relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full animate-float"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-white/10 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-heading font-bold text-white mb-4">
            Get weekly money-saving tips 💡
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join our newsletter for exclusive budgeting tips, expense cutting strategies, and product updates
          </p>

          <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-6 py-4 rounded-2xl border-0 focus:ring-4 focus:ring-white/30 text-brand-gray-900 font-medium"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-white text-brand-green-600 font-bold py-4 px-8 rounded-2xl hover:bg-brand-gray-50 transition-all duration-300 flex items-center justify-center space-x-2 hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-5 h-5" />
                <span>Subscribe</span>
              </button>
            </div>
          </form>
          <p className="text-white/70 text-sm mt-4">
            Join 10,000+ users saving money with our tips • Unsubscribe anytime
          </p>
        </div>
      </section>

      {/* Reused Sections */}
      <div className="bg-white"><AboutUsSection /></div>
      <div className="bg-gradient-to-br from-brand-gray-50 to-white"><FAQSection /></div>
      <div className="bg-white"><SupportSection /></div>

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
            <div className="text-4xl mb-4">🎉</div>
            <p className="text-brand-gray-700 font-semibold mb-2">Message sent!</p>
            <p className="text-sm text-brand-gray-500">We'll get back to you within 24 hours.</p>
            <button onClick={() => setShowContact(false)} className="btn-primary mt-6">Close</button>
          </div>
        ) : (
          <form onSubmit={async (e) => { e.preventDefault(); setContactSubmitting(true); await new Promise(r => setTimeout(r, 800)); setContactSubmitting(false); setContactSent(true); }} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Name</label>
              <input required value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Email</label>
              <input type="email" required value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} className="input-field" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-gray-700 mb-2">Message</label>
              <textarea required value={contactForm.message} onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))} className="input-field min-h-[120px] resize-y" placeholder="How can we help?" />
            </div>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setShowContact(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={contactSubmitting} className="btn-primary flex items-center space-x-2">
                {contactSubmitting && <span className="animate-pulse">Sending...</span>}
                {!contactSubmitting && <span>Send Message</span>}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Footer */}
      <footer className="bg-brand-gray-900 text-white py-16 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 bg-brand-green-500 rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-accent-500 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-secondary-500 rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="logo-container mb-6">
                <div className="logo-icon">
                  <img 
                    src="/logo.png" 
                    alt="CutTheSpend" 
                    className="w-8 h-8"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <Scissors className="w-6 h-6 text-white hidden" />
                </div>
                <div>
                  <span className="text-2xl font-heading font-bold text-white">CutTheSpend</span>
                  <p className="text-sm text-brand-gray-300 font-medium">See it. Cut it. Save more.</p>
                </div>
              </div>
              <p className="text-brand-gray-300 mb-6 max-w-md leading-relaxed">
                AI-powered expense tracking that helps you cut unnecessary spending and save more money every month.
              </p>
              <div className="flex space-x-4">
                <button className="bg-brand-gray-800 hover:bg-brand-gray-700 px-6 py-3 rounded-2xl flex items-center space-x-2 transition-all duration-300 hover:scale-105">
                  <Download className="w-5 h-5" />
                  <span className="font-semibold">App Store</span>
                </button>
                <button className="bg-brand-gray-800 hover:bg-brand-gray-700 px-6 py-3 rounded-2xl flex items-center space-x-2 transition-all duration-300 hover:scale-105">
                  <Download className="w-5 h-5" />
                  <span className="font-semibold">Google Play</span>
                </button>
              </div>
            </div>

            <div>
              <h4 className="font-heading font-bold mb-6 text-lg">Product</h4>
              <ul className="space-y-3 text-brand-gray-300">
                <li><a href="#features" className="hover:text-brand-green-400 transition-colors duration-200">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-brand-green-400 transition-colors duration-200">How It Works</a></li>
                <li><a href="#pricing" className="hover:text-brand-green-400 transition-colors duration-200">Pricing</a></li>
                <li><a href="#faq" className="hover:text-brand-green-400 transition-colors duration-200">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-heading font-bold mb-6 text-lg">Company</h4>
              <ul className="space-y-3 text-brand-gray-300">
                <li><a href="#about" className="hover:text-brand-green-400 transition-colors duration-200">About Us</a></li>
                <li><a href="#support" className="hover:text-brand-green-400 transition-colors duration-200">Support</a></li>
                <li><button onClick={() => setShowContact(true)} className="hover:text-brand-green-400 transition-colors duration-200 text-left">Contact</button></li>
                <li><button onClick={() => setShowPrivacy(true)} className="hover:text-brand-green-400 transition-colors duration-200 text-left">Privacy Policy</button></li>
                <li><button onClick={() => setShowTerms(true)} className="hover:text-brand-green-400 transition-colors duration-200 text-left">Terms of Service</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-brand-gray-800 mt-12 pt-8 text-center text-brand-gray-400">
            <p>&copy; 2025 CutTheSpend. All rights reserved. Made with ❤️ for savers everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
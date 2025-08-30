import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TrendingDown,
  Crown,
  Check
} from 'lucide-react';
import { AboutUsSection } from './AboutUs';
import { FAQSection } from './FAQ';
import { SupportSection } from './Support';
import { ContactSection } from './ContactUs';
import { PrivacyPolicySection } from './PrivacyPolicy';
import { TermsSection } from './TermsOfService';
import { Modal } from './ui/Modal';
import BrandLogo from './ui/BrandLogo';

interface Plan {
  id: string;
  planType: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  statementsLimit: string;
  pagesPerStatement: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
  buttonVariant: 'secondary' | 'primary' | 'premium';
  combinedBank?: number;
}

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);
  
  // Enhanced subscription toggle
  const [billingPeriod, setBillingPeriod] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPlanComparison, setShowPlanComparison] = useState(false);
  // Region simplified: only IN or US (default IN). Any non-IN treated as US.
  const [manualRegion, setManualRegion] = useState<string>(localStorage.getItem('selectedRegion') || 'IN');
  const effectiveRegion = manualRegion === 'IN' ? 'IN' : 'US';

  // (Auto-detect removed per requirement.)

  // Persist region
  useEffect(() => { localStorage.setItem('selectedRegion', manualRegion); }, [manualRegion]);

  const [emailStatus, setEmailStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!email) return;
    try {
      setEmailStatus('loading');
      setEmailError(null);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/public/newsletter-subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'landing_page' })
      });
      if(!res.ok) throw new Error('Subscription failed');
      setEmailStatus('success');
      setEmail('');
      setTimeout(()=> setEmailStatus('idle'), 4000);
    } catch(err:any){
      setEmailStatus('error');
      setEmailError(err.message || 'Failed');
      setTimeout(()=> setEmailStatus('idle'), 5000);
    }
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setPlansLoading(true);
        setPlansError(null);
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        const res = await fetch(`${apiBase}/public/plans?region=${effectiveRegion}&billingPeriod=${billingPeriod}`);
        if (!res.ok) throw new Error('Failed to load plans');
        const data = await res.json();
        
        const planLabels: Record<string, Partial<Plan>> = {
          FREE: {
            name: 'Free Plan',
            description: 'Perfect for getting started',
            buttonText: 'Get Started Free',
            buttonVariant: 'secondary',
          },
          PRO: {
            name: 'Pro Plan',
            description: 'For power users and small businesses',
            buttonText: 'Start Pro Trial',
            buttonVariant: 'primary',
            popular: true,
          },
          PREMIUM: {
            name: 'Premium Plan',
            description: 'For heavy users and enterprises',
            buttonText: 'Go Premium',
            buttonVariant: 'premium',
          },
        };

        const mapped: Plan[] = data.map((variant: any) => {
          const label = planLabels[variant.planType] || {};
          return {
            id: variant.planType,
            planType: variant.planType,
            ...label,
            price: variant.amount / 100,
            currency: variant.currency === 'INR' ? 'INR' : variant.currency === 'USD' ? 'USD' : variant.currency,
            period: billingPeriod === 'YEARLY' ? 'year' : 'month',
            statementsLimit: variant.statementsPerMonth === -1 ? 'Unlimited' : String(variant.statementsPerMonth),
            pagesPerStatement: variant.pagesPerStatement === -1 ? 'Unlimited' : String(variant.pagesPerStatement),
            features: (variant.features || '').split(',').map((f: string) => f.trim()).filter(Boolean),
            combinedBank: variant.combinedBank || (variant.planType === 'FREE' ? 2 : variant.planType === 'PRO' ? 3 : 5)
          } as Plan;
        });

        const rank: Record<string, number> = { FREE: 0, PRO: 1, PREMIUM: 2 };
        mapped.sort((a, b) => (rank[a.planType] ?? 99) - (rank[b.planType] ?? 99));
        setPlans(mapped);
      } catch (e: any) {
        setPlansError(e.message || 'Unable to load plans');
        // Fallback plans
        setPlans([
          {
            id: 'FREE',
            planType: 'FREE',
            name: 'Free Plan',
            price: 0,
            currency: 'INR',
            period: 'forever',
            description: 'Perfect for getting started',
            statementsLimit: '3',
            pagesPerStatement: '10',
            features: ['AI Parsing', 'Basic Dashboard', 'Email Support'],
            buttonText: 'Get Started Free',
            buttonVariant: 'secondary',
            combinedBank: 2
          },
          {
            id: 'PRO',
            planType: 'PRO',
            name: 'Pro Plan',
            price: 199,
            currency: 'INR',
            period: billingPeriod === 'YEARLY' ? 'year' : 'month',
            description: 'For power users and small businesses',
            statementsLimit: '5',
            pagesPerStatement: '50',
            features: ['AI Parsing', 'Advanced Analytics', 'Budget Tracking', 'Priority Support'],
            popular: true,
            buttonText: 'Start Pro Trial',
            buttonVariant: 'primary',
            combinedBank: 3
          },
          {
            id: 'PREMIUM',
            planType: 'PREMIUM',
            name: 'Premium Plan',
            price: 499,
            currency: 'INR',
            period: billingPeriod === 'YEARLY' ? 'year' : 'month',
            description: 'For heavy users and enterprises',
            statementsLimit: 'Unlimited',
            pagesPerStatement: '100',
            features: ['Everything in Pro', 'Forecasting', 'Goals', 'Tax Categorization', 'Early Access'],
            buttonText: 'Go Premium',
            buttonVariant: 'premium',
            combinedBank: 5
          }
        ]);
      } finally {
        setPlansLoading(false);
      }
    };
    fetchPlans();
  }, [billingPeriod, effectiveRegion]);

  const currencySymbol = (code: string) => {
    switch (code) {
      case 'INR': return '₹';
      case 'USD': return '$';
      case 'EUR': return '€';
      default: return code;
    }
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    // Persist selection with region context
    localStorage.setItem('selectedPlan', JSON.stringify({ planId, billingPeriod, region: effectiveRegion }));
    if (planId === 'FREE') {
      navigate('/login');
    } else {
      navigate('/login'); // or '/checkout' if implemented later
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-lg border-b border-brand-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18">
            <div className="logo-container pt-4">
              <div className="logo-icon">
                <BrandLogo className="w-8 h-8" size={32} />
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
                <a href="/login" className="btn-primary flex items-center">
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
                Upload PDF statements from any bank. Our AI extracts and categorizes everything automatically.
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

      {/* Enhanced Pricing Plans */}
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

          {/* Enhanced Billing Period Toggle + Region Selector */}
          <div className="flex flex-col items-center gap-6 mb-10">
            <div className="relative inline-flex rounded-3xl border-2 border-brand-gray-200 overflow-hidden shadow-funky bg-white p-2">
              <div className="absolute inset-0 bg-gradient-funky opacity-10 rounded-3xl"></div>
              {(['MONTHLY','YEARLY'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setBillingPeriod(p)}
                  className={`relative z-10 px-8 py-4 text-sm font-bold rounded-2xl transition-all duration-300 ${
                    p === billingPeriod 
                      ? 'bg-gradient-green text-white shadow-glow-green transform scale-105' 
                      : 'text-brand-gray-600 hover:text-brand-green-600 hover:bg-brand-green-50 hover:scale-102'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{p === 'MONTHLY' ? '📅' : '🎯'}</span>
                    <span>{p === 'MONTHLY' ? 'Monthly' : 'Yearly'}</span>
                  </div>
                  {p === 'YEARLY' && (
                    <div className="absolute -top-2 -right-2 bg-accent-500 text-brand-gray-900 text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                      Save 17% 🎉
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="font-bold text-brand-gray-700" htmlFor="region-select">Region:</label>
              <select
                id="region-select"
                value={manualRegion}
                onChange={(e) => setManualRegion(e.target.value === 'IN' ? 'IN' : 'US')}
                className="rounded-2xl border-2 border-brand-gray-200 px-4 py-2 font-semibold text-brand-gray-700 bg-white shadow-funky"
              >
                <option value="IN">India (IN)</option>
                <option value="US">United States (US)</option>
              </select>
            </div>
            <p className="text-xs text-brand-gray-500">Showing prices for region: <span className="font-semibold">{effectiveRegion}</span></p>
          </div>

          {/* Savings Highlight for Yearly */}
          {billingPeriod === 'YEARLY' && (
            <div className="text-center mb-8 animate-fade-in">
              <div className="inline-flex items-center bg-gradient-to-r from-accent-100 to-brand-green-100 border border-accent-300 text-accent-800 px-6 py-3 rounded-full text-sm font-bold shadow-glow-yellow">
                <Sparkles className="w-4 h-4 mr-2 animate-wiggle" />
                <span>🎉 Yearly plans include 2 months FREE! That's like getting 17% off! 💰</span>
              </div>
            </div>
          )}

          {/* Feature Comparison Toggle */}
          <div className="text-center mb-8">
            <button
              onClick={() => setShowPlanComparison(!showPlanComparison)}
              className="btn-secondary flex items-center space-x-2 mx-auto"
            >
              <BarChart3 className="w-4 h-4" />
              <span>{showPlanComparison ? 'Hide' : 'Show'} Feature Comparison</span>
            </button>
          </div>

          {/* Feature Comparison Table */}
          {showPlanComparison && (
            <div className="mb-12 animate-slide-up">
              <div className="card-funky overflow-hidden">
                <div className="bg-gradient-funky text-white p-6 text-center">
                  <h3 className="text-2xl font-heading font-bold mb-2">📊 Feature Comparison</h3>
                  <p className="text-white/90">See what's included in each plan</p>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-brand-gray-200">
                          <th className="text-left py-4 px-4 font-semibold text-brand-gray-900">Features</th>
                          <th className="text-center py-4 px-4 font-semibold text-brand-gray-900">Free</th>
                          <th className="text-center py-4 px-4 font-semibold text-brand-green-600">Pro</th>
                          <th className="text-center py-4 px-4 font-semibold text-purple-600">Premium</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { feature: '🤖 AI Parsing & Categorization', free: true, pro: true, premium: true },
                        { feature: '📊 Basic Dashboard (3mo)', free: true, pro: true, premium: false },
                        { feature: '📈 Advanced Analytics (12mo)', free: false, pro: true, premium: true },
                        { feature: '🎯 Budget Tracking & Alerts', free: false, pro: true, premium: true },
                        { feature: '📉 Spending Trends', free: true, pro: true, premium: true },
                        { feature: '🔮 Cash Flow Forecasting', free: false, pro: false, premium: true },
                        { feature: '🏆 Goal Tracking', free: false, pro: false, premium: true },
                        { feature: '📋 Tax Categorization', free: false, pro: false, premium: true },
                        { feature: '⚡ Priority Support', free: false, pro: true, premium: true },
                        { feature: '🚀 Early Access Features', free: false, pro: false, premium: true },
                        ].map((row, index) => (
                          <tr key={index} className="border-b border-brand-gray-100 hover:bg-brand-gray-50 transition-colors duration-200">
                            <td className="py-4 px-4 font-medium text-brand-gray-900">{row.feature}</td>
                            <td className="text-center py-4 px-4">
                              {row.free ? (
                                <CheckCircle className="w-5 h-5 text-brand-green-500 mx-auto" />
                              ) : (
                                <X className="w-5 h-5 text-brand-gray-300 mx-auto" />
                              )}
                            </td>
                            <td className="text-center py-4 px-4">
                              {row.pro ? (
                                <CheckCircle className="w-5 h-5 text-brand-green-500 mx-auto" />
                              ) : (
                                <X className="w-5 h-5 text-brand-gray-300 mx-auto" />
                              )}
                            </td>
                            <td className="text-center py-4 px-4">
                              {row.premium ? (
                                <CheckCircle className="w-5 h-5 text-purple-500 mx-auto" />
                              ) : (
                                <X className="w-5 h-5 text-brand-gray-300 mx-auto" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Plans Grid */}

          {billingPeriod === 'YEARLY' && (
            <div className="text-center mb-8">
              <div className="inline-flex items-center bg-accent-100 text-accent-800 px-4 py-2 rounded-full text-sm font-semibold">
                <Sparkles className="w-4 h-4 mr-2" />
                Yearly plans include 2 months free (10× monthly price)
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {plansLoading && (
              <div className="col-span-3 text-center py-12">
                <div className="w-12 h-12 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="animate-spin w-6 h-6 border-2 border-brand-green-500 border-t-transparent rounded-full"></div>
                </div>
                <p className="text-brand-gray-500">Loading plans...</p>
              </div>
            )}
            
            {plansError && (
              <div className="col-span-3 text-center py-12">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-red-600 text-sm">{plansError}</p>
              </div>
            )}
            
            {!plansLoading && !plansError && plans.map(plan => (
              <div
                key={plan.id}
                className={`relative card-funky p-8 flex flex-col transition-all duration-300 hover:scale-105 ${
                  plan.popular 
                    ? 'border-brand-green-400 ring-4 ring-brand-green-200 shadow-glow-green' 
                    : selectedPlan === plan.id
                    ? 'border-accent-400 ring-4 ring-accent-200 shadow-glow-yellow'
                    : 'border-brand-gray-200 hover:border-brand-green-300 hover:shadow-funky-lg'
                }`}
              >
                {/* Savings Badge for Yearly */}
                {billingPeriod === 'YEARLY' && plan.planType !== 'FREE' && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-accent-400 to-accent-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-glow-yellow animate-pulse">
                    2 Months FREE! 🎁
                  </div>
                )}

                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-green text-white text-sm font-bold px-4 py-2 rounded-full shadow-glow-green animate-bounce-gentle">
                    <Star className="w-4 h-4 mr-1 inline" />
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-funky rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-glow-green">
                    {plan.planType === 'FREE' && <Zap className="w-8 h-8 text-white" />}
                    {plan.planType === 'PRO' && <Target className="w-8 h-8 text-white" />}
                    {plan.planType === 'PREMIUM' && <Crown className="w-8 h-8 text-white" />}
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-brand-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-brand-gray-600">{plan.description}</p>
                </div>

                <div className="text-center mb-6">
                  <div className="flex items-end justify-center mb-2">
                    <span className="text-2xl font-bold text-brand-gray-600">{currencySymbol(plan.currency)}</span>
                    <span className="text-5xl font-heading font-bold text-brand-gray-900 ml-1">{plan.price}</span>
                    <span className="text-brand-gray-500 ml-2 mb-2">/{plan.period}</span>
                  </div>
                  <div className="space-y-2">
                    {billingPeriod === 'YEARLY' && plan.planType !== 'FREE' && (
                      <div className="inline-flex items-center bg-gradient-to-r from-accent-100 to-brand-green-100 text-accent-800 px-4 py-2 rounded-full text-sm font-bold border border-accent-200">
                        <Sparkles className="w-4 h-4 mr-2 animate-wiggle" />
                        <span>2 months FREE included! 🎉</span>
                      </div>
                    )}
                    {plan.planType === 'FREE' && (
                      <div className="inline-flex items-center bg-brand-green-100 text-brand-green-800 px-4 py-2 rounded-full text-sm font-bold">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span>Forever Free 💚</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Plan Limits */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-3 bg-brand-gray-50 rounded-2xl">
                    <div className="flex items-center space-x-2">
                      <Upload className="w-4 h-4 text-brand-gray-500" />
                      <span className="text-sm font-medium text-brand-gray-700">Statements/month</span>
                    </div>
                    <span className="text-sm font-bold text-brand-gray-900">{plan.statementsLimit}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-brand-gray-50 rounded-2xl">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-brand-gray-500" />
                      <span className="text-sm font-medium text-brand-gray-700">Pages per statement</span>
                    </div>
                    <span className="text-sm font-bold text-brand-gray-900">up to {plan.pagesPerStatement}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-brand-gray-50 rounded-2xl">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-brand-gray-500" />
                      <span className="text-sm font-medium text-brand-gray-700">Bank accounts</span>
                    </div>
                    <span className="text-sm font-bold text-brand-gray-900">up to {plan.combinedBank}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="mb-8 flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-5 h-5 bg-gradient-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm text-brand-gray-700 leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handlePlanSelect(plan.id)}
                  className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
                    plan.buttonVariant === 'primary'
                      ? 'bg-gradient-green text-white shadow-glow-green hover:scale-105 active:scale-95'
                      : plan.buttonVariant === 'premium'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-glow-blue hover:scale-105 active:scale-95'
                      : 'bg-brand-gray-100 text-brand-gray-700 hover:bg-brand-gray-200'
                  }`}
                >
                  {plan.planType === 'PREMIUM' && <Crown className="w-5 h-5" />}
                  {plan.planType === 'PRO' && <Target className="w-5 h-5" />}
                  {plan.planType === 'FREE' && <Sparkles className="w-5 h-5" />}
                  <span>{plan.buttonText}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Plan Comparison Table */}
          <div className="mt-16">
            <div className="card-funky overflow-hidden">
              <div className="bg-gradient-funky text-white p-6 text-center">
                <h3 className="text-2xl font-heading font-bold mb-2">📊 Feature Comparison</h3>
                <p className="text-white/90">See what's included in each plan</p>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-brand-gray-200">
                        <th className="text-left py-4 px-4 font-semibold text-brand-gray-900">Features</th>
                        <th className="text-center py-4 px-4 font-semibold text-brand-gray-900">Free</th>
                        <th className="text-center py-4 px-4 font-semibold text-brand-green-600">Pro</th>
                        <th className="text-center py-4 px-4 font-semibold text-purple-600">Premium</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { feature: '🤖 AI Parsing & Categorization', free: true, pro: true, premium: true },
                        { feature: '📊 Basic Dashboard (3mo)', free: true, pro: false, premium: false },
                        { feature: '📈 Advanced Analytics (12mo)', free: false, pro: true, premium: true },
                        { feature: '🎯 Budget Tracking & Alerts', free: false, pro: true, premium: true },
                        { feature: '📉 Spending Trends', free: true, pro: true, premium: true },
                        { feature: '🔮 Cash Flow Forecasting', free: false, pro: false, premium: true },
                        { feature: '🏆 Goal Tracking', free: false, pro: false, premium: true },
                        { feature: '📋 Tax Categorization', free: false, pro: false, premium: true },
                        { feature: '⚡ Priority Support', free: false, pro: true, premium: true },
                        { feature: '🚀 Early Access Features', free: false, pro: false, premium: true },
                      ].map((row, index) => (
                        <tr key={index} className="border-b border-brand-gray-100 hover:bg-brand-gray-50">
                          <td className="py-4 px-4 font-medium text-brand-gray-900">{row.feature}</td>
                          <td className="text-center py-4 px-4">
                            {row.free ? (
                              <CheckCircle className="w-5 h-5 text-brand-green-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-brand-gray-300 mx-auto" />
                            )}
                          </td>
                          <td className="text-center py-4 px-4">
                            {row.pro ? (
                              <CheckCircle className="w-5 h-5 text-brand-green-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-brand-gray-300 mx-auto" />
                            )}
                          </td>
                          <td className="text-center py-4 px-4">
                            {row.premium ? (
                              <CheckCircle className="w-5 h-5 text-purple-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-brand-gray-300 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-br from-brand-gray-50 to-white">
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
                disabled={emailStatus==='loading'}
                className={`bg-white text-brand-green-600 font-bold py-4 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-2 hover:scale-105 active:scale-95 ${emailStatus==='loading' ? 'opacity-70 cursor-not-allowed' : 'hover:bg-brand-gray-50'}`}
              >
                <Sparkles className={`w-5 h-5 ${emailStatus==='loading' ? 'animate-spin' : ''}`} />
                <span>{emailStatus==='loading' ? 'Subscribing...' : emailStatus==='success' ? 'Subscribed!' : 'Subscribe'}</span>
              </button>
            </div>
          </form>
          {emailStatus==='error' && <p className="text-red-200 text-sm mt-2">{emailError}</p>}
          {emailStatus==='success' && <p className="text-emerald-200 text-sm mt-2">You are subscribed.</p>}
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
                  <BrandLogo className="w-8 h-8" size={32} />
                </div>
                <div>
                  <span className="text-2xl font-heading font-bold text-white">CutTheSpend</span>
                  <p className="text-sm text-brand-gray-300 font-medium">See it. Cut it. Save more.</p>
                </div>
              </div>
              <p className="text-brand-gray-300 mb-6 max-w-md leading-relaxed">
                AI-powered expense tracking that helps you cut unnecessary spending and save more money every month.
              </p>
              {/* <div className="flex space-x-4">
                <button className="bg-brand-gray-800 hover:bg-brand-gray-700 px-6 py-3 rounded-2xl flex items-center space-x-2 transition-all duration-300 hover:scale-105">
                  <Download className="w-5 h-5" />
                  <span className="font-semibold">App Store</span>
                </button>
                <button className="bg-brand-gray-800 hover:bg-brand-gray-700 px-6 py-3 rounded-2xl flex items-center space-x-2 transition-all duration-300 hover:scale-105">
                  <Download className="w-5 h-5" />
                  <span className="font-semibold">Google Play</span>
                </button>
              </div> */}
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
                <li><button onClick={() => setShowContact(true)} className="hover:text-brand-green-400 transition-colors duration-200 text-left">Contact Us</button></li>
                <li><button onClick={() => setShowPrivacy(true)} className="hover:text-brand-green-400 transition-colors duration-200 text-left">Privacy Policy</button></li>
                <li><button onClick={() => setShowTerms(true)} className="hover:text-brand-green-400 transition-colors duration-200 text-left">Terms and Conditions</button></li>
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
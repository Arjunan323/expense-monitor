import React from 'react';
import { Layout } from './layout/Layout';
import { Helmet } from 'react-helmet';

export function PrivacyPolicySection() {
  return (
    <section id="privacy" className="py-20 px-4 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Privacy Policy</h2>
      <div className="space-y-6 text-sm leading-relaxed text-gray-700">
        <div>
          <h3 className="text-lg font-semibold mb-1">1. Data Collection</h3>
          <p>We collect minimal personal information (email, usage analytics, statement data) only to operate and improve the service.</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-1">2. Data Usage</h3>
          <p>Data is used for categorization, analytics, and product enhancement. We do not sell or rent your data.</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-1">3. Cookies</h3>
          <p>Cookies remember preferences and support secure sessions. You may disable them in your browser settings.</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-1">4. Third-Party Services</h3>
          <p>We integrate only essential, vetted services (e.g., payments, analytics) which maintain their own policies.</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-1">5. User Rights</h3>
          <p>Request export, correction, or deletion of your data anytime via support channels.</p>
        </div>
      </div>
    </section>
  );
}

export default function PrivacyPolicy() {
  return (
    <Layout>
      <Helmet>
        <title>Privacy Policy | CutTheSpend</title>
        <meta name="description" content="Read the privacy policy for CutTheSpend, including data collection, usage, cookies, and user rights." />
      </Helmet>
      <PrivacyPolicySection />
    </Layout>
  );
}

import React from 'react';
import { Layout } from './layout/Layout';
import { Helmet } from 'react-helmet';

export function TermsSection() {
  return (
    <section id="terms" className="py-20 px-4 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Terms of Service</h2>
      <div className="space-y-6 text-sm leading-relaxed text-gray-700">
        <div>
          <h3 className="text-lg font-semibold mb-1">1. Account Registration</h3>
          <p>Provide accurate information and keep credentials secure. You're responsible for all account activity.</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-1">2. Prohibited Use</h3>
            <p>No unlawful, abusive, or exploitative activity. Automated scraping & reverse engineering are forbidden.</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-1">3. Limitation of Liability</h3>
          <p>The service is provided "as is" without warranties; liability is limited to the maximum extent permitted by law.</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-1">4. Disclaimers</h3>
          <p>No guarantee of uninterrupted service or absolute analytics accuracy.</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-1">5. Governing Law</h3>
          <p>Terms governed by applicable local laws; disputes resolved under relevant jurisdiction.</p>
        </div>
      </div>
    </section>
  );
}

export default function TermsOfService() {
  return (
    <Layout>
      <Helmet>
        <title>Terms of Service | CutTheSpend</title>
        <meta name="description" content="Read the terms of service for using CutTheSpend, your expense management platform." />
      </Helmet>
      <TermsSection />
    </Layout>
  );
}

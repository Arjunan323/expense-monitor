import React from 'react';
import { Layout } from './layout/Layout';
import { Helmet } from 'react-helmet';

export function SupportSection() {
  return (
    <section id="support" className="py-20 px-4 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">Support</h2>
      <p className="mb-6 text-gray-600">Need help? Our support team is here for you.</p>
      <ul className="space-y-3 text-sm text-gray-700">
        <li><span className="font-medium">Email:</span> <a href="mailto:support@cutthespend.com" className="text-primary-600 hover:underline">support@cutthespend.com</a></li>
        <li><span className="font-medium">Live Chat:</span> In-app during business hours</li>
        <li><span className="font-medium">Helpdesk:</span> <a href="https://help.cutthespend.com" className="text-primary-600 hover:underline">help.cutthespend.com</a></li>
        <li><span className="font-medium">Response Time:</span> Under 24 hours (avg)</li>
      </ul>
    </section>
  );
}

export default function Support() {
  return (
    <Layout>
      <Helmet>
        <title>Support | CutTheSpend</title>
        <meta name="description" content="How to reach CutTheSpend customer support." />
      </Helmet>
      <SupportSection />
    </Layout>
  );
}

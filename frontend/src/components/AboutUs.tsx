import React from 'react';
import { Layout } from './layout/Layout';
import { Helmet } from 'react-helmet';

// Section-only component for embedding (e.g., on landing page)
export function AboutUsSection() {
  return (
    <section id="about" className="max-w-2xl mx-auto py-20 px-4">
      <h2 className="text-3xl font-bold mb-4">About Us</h2>
      <p className="mb-6 text-gray-700">CutTheSpend (Expense Monitor) is on a mission to help people take control of their finances and reduce unnecessary expenses. Founded by a team passionate about financial wellness, our platform combines smart analytics, AI-powered insights, and easy-to-use tools to empower users to track, analyze, and cut spending. Whether you're a student, professional, or business owner, we're your partner in achieving financial freedom.</p>
      <p className="text-gray-700">Join thousands of users who have already started saving more and spending smarter today!</p>
    </section>
  );
}

// Full page wrapper (retained original default export)
export default function AboutUs() {
  return (
    <Layout>
      <Helmet>
        <title>About Us | CutTheSpend</title>
        <meta name="description" content="Learn about CutTheSpend, the platform helping users manage and reduce expenses effectively." />
      </Helmet>
      <AboutUsSection />
    </Layout>
  );
}

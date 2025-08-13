import React from 'react';
import { Layout } from './layout/Layout';
import { Helmet } from 'react-helmet';

export function ContactSection() {
  return (
    <section id="contact" className="py-20 px-4 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
      <ul className="space-y-3 text-sm text-gray-700 mb-6">
        <li><span className="font-medium">Address:</span> 123 Main Street, Mumbai, India</li>
        <li><span className="font-medium">Phone:</span> +91 98765 43210</li>
        <li><span className="font-medium">Email:</span> <a href="mailto:hello@cutthespend.com" className="text-primary-600 hover:underline">hello@cutthespend.com</a></li>
      </ul>
      <p className="text-gray-600">We look forward to hearing from you!</p>
    </section>
  );
}

export default function ContactUs() {
  return (
    <Layout>
      <Helmet>
        <title>Contact Us | CutTheSpend</title>
        <meta name="description" content="Contact CutTheSpend for questions, feedback, or partnership opportunities." />
      </Helmet>
      <ContactSection />
    </Layout>
  );
}

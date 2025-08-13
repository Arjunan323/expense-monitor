import React from 'react';
import { Layout } from './layout/Layout';
import { Helmet } from 'react-helmet';

const faqs = [
	{
		q: 'How do I upload my bank statement?',
		a: 'Go to the Upload page, select your PDF statement, and follow the instructions. Our AI will parse and categorize your transactions.',
	},
	{
		q: 'Is my financial data secure?',
		a: 'Yes, we use industry-standard encryption and never share your data with third parties.',
	},
	{
		q: 'Can I track spending across multiple accounts?',
		a: 'Absolutely! CutTheSpend supports multiple bank accounts and provides consolidated analytics.',
	},
	{
		q: 'How do I change my subscription plan?',
		a: 'Visit the Billing page to view available plans and upgrade or downgrade as needed.',
	},
	{
		q: 'What if I need help or have a question?',
		a: 'You can reach our support team via email, chat, or helpdesk. See the Support page for details.',
	},
];

export function FAQSection() {
	return (
		<section id="faq" className="max-w-4xl mx-auto py-20 px-4">
			<h2 className="text-3xl font-bold mb-10 text-center">Frequently Asked Questions</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				{faqs.map((faq, idx) => (
					<div key={idx} className="card">
						<h3 className="text-lg font-semibold mb-2">{faq.q}</h3>
						<p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
					</div>
				))}
			</div>
		</section>
	);
}

export default function FAQ() {
	return (
		<Layout>
			<Helmet>
				<title>FAQ | CutTheSpend</title>
				<meta name="description" content="Frequently asked questions about using CutTheSpend." />
			</Helmet>
			<FAQSection />
		</Layout>
	);
}

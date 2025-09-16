// pages/faq.js
import Head from "next/head";
import Header from "../components/Header";
import MobileHeader from "../components/MobileHeader";
import Footer from "../components/Footer";
import { useState } from "react";
import { motion } from "framer-motion";

const faqs = [
  {
    question: "What is Gigzz?",
    answer:
      "Gigzz is a remote job platform that connects talented creatives with clients looking to hire for freelance, hybrid, remote, and onsite roles.",
  },
  {
    question: "Who can use Gigzz?",
    answer:
      "Both clients looking to hire and applicants/creatives seeking jobs can use Gigzz. Clients post job listings, while creatives apply using tokens.",
  },
  {
    question: "What are tokens and how do they work?",
    answer: (
      <>
        Tokens are used to apply for jobs, promote portfolios, and promote jobs. Each application or promotion costs a certain number of tokens.{" "}
        <a href="/pricing" className="text-orange-500 underline hover:text-orange-600">
          See details
        </a>
      </>
    ),
  },
  {
    question: "How long do tokens last?",
    answer:
      "Tokens expire after 3 months from the date of purchase. Make sure to use them before they expire.",
  },
  {
    question: "How can I contact support?",
    answer:
      "You can reach out through our Contact page or email us directly at support@gigzz.com.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <Head>
        <title>FAQs - Gigzz</title>
        <meta name="description" content="Frequently asked questions about how Gigzz works." />
      </Head>

      <div className="min-h-screen flex flex-col bg-white text-black">
        {/* Desktop Header */}
        <div className="hidden md:block">
          <Header />
        </div>

        {/* Mobile Header */}
        <div className="block md:hidden">
          <MobileHeader />
        </div>

        <main className="flex-grow px-6 py-12 max-w-4xl mx-auto pt-0 md:pt-20">
          <h1 className="text-2xl md:text-3xl font-bold mb-8">
            Frequently Asked Questions
          </h1>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.03 }}
                className="border border-gray-300 rounded-md p-4 shadow-sm hover:shadow-md transition duration-300 cursor-pointer"
              >
                <button
                  onClick={() => toggle(index)}
                  className="w-full text-left font-semibold text-lg focus:outline-none flex justify-between items-center"
                >
                  <span>{faq.question}</span>
                  <span className="text-orange-600">{openIndex === index ? "-" : "+"}</span>
                </button>
                {openIndex === index && (
                  <p className="mt-3 text-gray-700 text-sm">{faq.answer}</p>
                )}
              </motion.div>
            ))}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

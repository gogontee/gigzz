// components/JobApplicationTerms.jsx
'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  AlertTriangle, 
  Shield, 
  DollarSign, 
  UserCheck, 
  FileText, 
  AlertCircle,
  TrendingUp,
  X
} from 'lucide-react';

const JobApplicationTerms = ({ onAccept, isAccepted, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const sections = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: "About MyGigzz",
      content: "MyGigzz is an African-leading talent and creative platform built to connect Clients (employers) with Creatives (freelancers, job seekers, and professionals). MyGigzz does NOT directly employ applicants at this time. We only serve as a trusted connecting link between job providers and job seekers."
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      title: "Application Using Tokens",
      content: "To apply for jobs on MyGigzz, applicants are required to use tokens. The number of tokens deducted per application depends on the type of job:",
      list: [
        "Hybrid roles usually require more tokens",
        "Onsite roles may require a moderate number of tokens",
        "Remote roles may require fewer tokens"
      ],
      warning: "Once tokens are used for an application, they are NOT refundable — even if the employer does not select you. For this reason, we strongly advise applicants to apply wisely and ensure their profile is fully optimized."
    },
    {
      icon: <UserCheck className="w-5 h-5" />,
      title: "Profile & Portfolio Completeness",
      content: "Your profile and portfolio play a major role in attracting employers. Incomplete or poorly written profiles reduce your chances of being hired. Every Creative is strongly encouraged to:",
      list: [
        "Add a professional profile photo",
        "Complete their bio and specialties",
        "Upload quality portfolio work",
        "Include accurate contact details and work history"
      ],
      note: "The more complete and detailed your profile is, the higher your chances of landing a job on MyGigzz."
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: "Payments & Negotiation",
      content: "Gigzz does NOT pay applicants on behalf of employers at the moment. All payment agreements are strictly between the Client and the Creative. We strongly encourage that:",
      list: [
        "Clear terms are discussed before accepting any job",
        "A written agreement is reached where possible",
        "You establish trust with the employer before starting work"
      ],
      warning: "Always use caution and professional judgment when negotiating with employers."
    },
    {
      icon: <AlertTriangle className="w-5 h-5" />,
      title: "Employer Verification Status",
      content: "MyGigzz only has concrete, confirmed information for employers whose accounts are VERIFIED. To check an employer's verification status:",
      subSections: [
        {
          title: "How to Check:",
          items: [
            "Click on the job post",
            "Go to the Job Details page",
            "Check the Employer Card beside the employer's profile picture"
          ]
        },
        {
          title: "Verification Indicators:",
          items: [
            "Green bar labeled 'VERIFIED' – Employer is officially verified by MyGigzz",
            "Orange dot – Employer is pending verification",
            "Black dot – Employer has not applied for verification"
          ]
        }
      ],
      note: "We encourage creativity and caution when dealing with unverified or pending accounts."
    },
    {
      icon: <AlertCircle className="w-5 h-5" />,
      title: "Reporting Fraud or Misconduct (Important)",
      content: "MyGigzz has a STRICT policy against employers who request payment from applicants before offering a job.",
      warningTitle: "If ANY employer:",
      warningList: [
        "Requests money from you",
        "Asks for a 'registration fee'",
        "Demands payment for training, onboarding, or equipment"
      ],
      action: "REPORT THEM IMMEDIATELY.",
      steps: {
        title: "How to report:",
        items: [
          "Take screenshots of the chat or message",
          "Copy the job link or employer profile link",
          "Go to the 'Report' button on the job page OR",
          "Send a detailed report including evidence via the MyGigzz contact channel"
        ]
      },
      note: "Such employers will be investigated and permanently banned if found guilty."
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Consistency is Key",
      content: "Do not give up because 1 or 2 job applications did not get a response. Consistency increases your chances. The more relevant jobs you apply for, the higher your likelihood of landing a gig on Gigzz.",
      quote: "Stay active. Stay visible. Stay consistent."
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Legal Disclaimer",
      content: "MyGigzz is a job listing and connection platform only. We do not guarantee employment, contracts, payments, or project completion between any Client and Creative. Any agreements, negotiations, outcomes, or disputes that may arise from a connection made through MyGigzz are strictly between the involved parties.",
      agreement: "By using MyGigzz, you agree that:",
      points: [
        "MyGigzz is not responsible for losses, damages, miscommunication, breach of agreement, or fraud resulting from interactions on or off the platform.",
        "Users are fully responsible for their own decisions, actions, and agreements.",
        "MyGigzz reserves the right to suspend or ban any user found to be in violation of our policies."
      ],
      final: "By applying for jobs on MyGigzz, you agree to these terms and conditions."
    }
  ];

  const SectionItem = ({ section, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="mb-8 last:mb-0"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white">
          {section.icon}
        </div>
        <h3 className="text-lg font-bold text-gray-900 mt-1">{section.title}</h3>
      </div>
      
      <div className="ml-14">
        <p className="text-gray-700 mb-4 leading-relaxed">{section.content}</p>
        
        {section.list && (
          <ul className="mb-4 space-y-2">
            {section.list.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        )}

        {section.subSections && section.subSections.map((sub, subIndex) => (
          <div key={subIndex} className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">{sub.title}</h4>
            <ul className="space-y-1">
              {sub.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {section.warningTitle && (
          <div className="mb-4">
            <h4 className="font-semibold text-red-700 mb-2">{section.warningTitle}</h4>
            <ul className="mb-4 space-y-1">
              {section.warningList.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <span className="text-red-700 font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {section.action && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-800 font-bold text-lg">{section.action}</p>
          </div>
        )}

        {section.steps && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">{section.steps.title}</h4>
            <ul className="space-y-2">
              {section.steps.items.map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <span className="text-gray-700">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {section.warning && (
          <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <p className="text-orange-800 font-medium">{section.warning}</p>
            </div>
          </div>
        )}

        {section.note && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-blue-800">{section.note}</p>
          </div>
        )}

        {section.quote && (
          <div className="mb-4 p-4 bg-gradient-to-r from-black to-gray-800 rounded-xl text-white">
            <p className="text-xl font-bold text-center">{section.quote}</p>
          </div>
        )}

        {section.agreement && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">{section.agreement}</h4>
            <ul className="space-y-3">
              {section.points.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-sm flex-shrink-0">
                    {i + 1}
                  </div>
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {section.final && (
          <div className="mt-6 p-4 bg-gradient-to-r from-black to-orange-600 rounded-xl">
            <p className="text-white font-bold text-center text-lg">{section.final}</p>
          </div>
        )}
      </div>
      
      {index < sections.length - 1 && (
        <div className="ml-14 mt-6">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-black to-orange-600 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                MYGIGZZ JOB APPLICATION TERMS & CONDITIONS
              </h1>
              <p className="text-white/90 text-sm mt-1">
                Please read these terms carefully before applying for jobs
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content Container */}
      <div className="p-4 md:p-6 max-h-[60vh] md:max-h-[70vh] overflow-y-auto">
        {/* Collapsed View */}
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
              <FileText className="w-10 h-10 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Important Terms & Conditions
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Before applying for jobs on MyGigzz, please review our terms covering token usage, employer verification, fraud reporting, and legal responsibilities.
            </p>
            <motion.button
              onClick={() => setIsExpanded(true)}
              className="px-8 py-3 bg-gradient-to-r from-black to-gray-800 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-500 transition-all duration-300 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Read Full Terms
            </motion.button>
          </motion.div>
        )}

        {/* Expanded View */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-2"
            >
              {sections.map((section, index) => (
                <SectionItem key={index} section={section} index={index} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Acceptance Footer */}
      <div className="border-t border-gray-200 p-6 bg-gray-50">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${
              isAccepted 
                ? 'bg-orange-600 border-orange-600' 
                : 'bg-white border-gray-300'
            }`}
            onClick={onAccept}>
              {isAccepted && <Check className="w-4 h-4 text-white" />}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                I have read and accept the MyGigzz Terms & Conditions
              </p>
              <p className="text-sm text-gray-600">
                You must accept these terms to apply for jobs
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            {isExpanded && (
              <motion.button
                onClick={() => setIsExpanded(false)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                Back to Summary
              </motion.button>
            )}
            
            <motion.button
              onClick={onAccept}
              disabled={isAccepted}
              className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                isAccepted
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white cursor-default'
                  : 'bg-gradient-to-r from-black to-gray-800 text-white hover:from-orange-600 hover:to-orange-500'
              }`}
              whileHover={!isAccepted ? { scale: 1.05 } : {}}
              whileTap={!isAccepted ? { scale: 0.98 } : {}}
            >
              {isAccepted ? (
                <span className="flex items-center gap-2">
                  <Check className="w-5 h-5" /> Accepted
                </span>
              ) : (
                'Accept Terms'
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApplicationTerms;
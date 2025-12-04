// pages/comingsoon.js
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function ComingSoon() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Head>
        <title>Coming Soon | Check Back Later</title>
        <meta name="description" content="This feature is coming soon. Kindly check back later." />
      </Head>

      <div className="min-h-screen pt-20 md:pt-24 bg-gradient-to-br from-gray-50 to-white flex flex-col items-center justify-center p-4 md:p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 md:p-8 text-center border border-gray-100">
          {/* Logo/Header */}
          <div className="mb-8">
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="w-16 h-16 mb-4 relative">
                <Image
                  src="https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/avatars/gigzzblack.png"
                  alt="gigzz Logo"
                  fill
                  className="object-contain"
                  unoptimized // For external images
                />
              </div>
              <div className="w-20 h-1 bg-orange-400 mx-auto rounded-full"></div>
            </div>
          </div>

          {/* Main Content */}
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-5 flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 animate-ping bg-orange-200 rounded-full"></div>
                <div className="relative bg-black rounded-full w-16 h-16 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-3">Feature Launching Soon!</h2>
            <p className="text-gray-700 text-base mb-4">
              This feature is coming soon. Kindly check back later.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              We're working hard to bring you an amazing experience. This feature will be available shortly.
            </p>

            {/* Current Time Display */}
            <div className="bg-gray-50 rounded-lg p-3 mb-6 border border-gray-100">
              <p className="text-gray-500 text-xs mb-1">Current Time</p>
              <p className="text-lg font-mono text-gray-800">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>75%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-orange-400 h-1.5 rounded-full w-3/4"></div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link 
              href="/" 
              className="px-5 py-2.5 bg-black hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition duration-300 flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Return to Home
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-800 text-sm font-medium rounded-lg transition duration-300 border border-gray-200 flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Refresh
            </button>
          </div>

          {/* Footer Note - Simplified */}
          <div className="mt-8 pt-5 border-t border-gray-100">
            <p className="text-gray-500 text-xs">
              gigzz © {new Date().getFullYear()}
            </p>
          </div>
        </div>

        {/* Background decorative elements - subtle version */}
        <div className="absolute top-20 left-5 w-40 h-40 bg-gray-200 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute bottom-10 right-5 w-40 h-40 bg-orange-100 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-gray-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>

        {/* Add styles for animation */}
        <style jsx>{`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(20px, -30px) scale(1.05); }
            66% { transform: translate(-15px, 15px) scale(0.95); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob {
            animation: blob 10s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}</style>
      </div>
    </>
  );
}
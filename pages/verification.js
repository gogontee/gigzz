// pages/verification.js
import Head from "next/head";
import Verify from "../components/Verify";

export default function VerificationPage() {
  return (
    <>
      <Head>
        <title>User Verification | Gigzz</title>
      </Head>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-white shadow-xl rounded-2xl p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Verify Your Identity
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Upload your valid ID and take a selfie to get verified on Gigzz.
          </p>
          <Verify />
        </div>
      </div>
    </>
  );
}

import React from "react";
import { FaTwitter, FaFacebook, FaLinkedin, FaInstagram, FaTiktok } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="hidden md:block bg-black text-white px-12 py-10">
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-5 gap-8 text-sm">
        {/* For Clients */}
        <div>
          <h3 className="text-base font-semibold mb-4">For Clients</h3>
          <ul className="space-y-2">
            <li>How to hire</li>
            <li>Talent Marketplace</li>
            <li>Project Catalog</li>
            <li>Hire an agency</li>
            <li>Enterprise</li>
            <li>Business Plus</li>
            <li>Any Hire</li>
            <li>Contract-to-hire</li>
            <li>Direct Contracts</li>
            <li>Hire worldwide</li>
            <li>Hire in Africa</li>
          </ul>
        </div>

        {/* For Talent */}
        <div>
          <h3 className="text-base font-semibold mb-4">For Creatives</h3>
          <ul className="space-y-2">
            <li>How to find work</li>
            <li>Direct Contracts</li>
            <li>Find freelance jobs worldwide</li>
            <li>Find freelance jobs in Africa</li>
            <li>Win work with ads</li>
            <li>Exclusive resources with Premium</li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h3 className="text-base font-semibold mb-4">Resources</h3>
          <ul className="space-y-2">
            <li>Help & support</li>
            <li>Success stories</li>
            <li>Gigzz reviews</li>
            <li>Blog</li>
            <li>Affiliate program</li>
            <li>Free Business Tools</li>
            <li>Release notes</li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h3 className="text-base font-semibold mb-4">Company</h3>
          <ul className="space-y-2">
            <li>About us</li>
            <li>Leadership</li>
            <li>Investor relations</li>
            <li>Careers</li>
            <li>Our impact</li>
            <li>Press</li>
            <li>Contact us</li>
            <li>Partners</li>
            <li>Trust & safety</li>
            <li>Modern slavery statement</li>
          </ul>
        </div>

        {/* Socials */}
        <div>
          <h3 className="text-base font-semibold mb-4">Follow us</h3>
          <div className="flex items-center gap-4 mb-6">
            <FaLinkedin className="text-white hover:text-orange-600 cursor-pointer" size={20} />
            <FaFacebook className="text-white hover:text-orange-600 cursor-pointer" size={20} />
            <FaTwitter className="text-white hover:text-orange-600 cursor-pointer" size={20} />
            <FaInstagram className="text-white hover:text-orange-600 cursor-pointer" size={20} />
            <FaTiktok className="text-white hover:text-orange-600 cursor-pointer" size={20} />
          </div>
          <button className="bg-white text-black text-sm font-semibold px-4 py-2 rounded hover:bg-orange-600 hover:text-white transition">
            Download Mobile App
          </button>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mt-12 border-t border-gray-800 pt-6 flex justify-between text-xs text-gray-400 flex-wrap gap-4">
        <div>© 2015 - {new Date().getFullYear()} Gigzz® Global Inc.</div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-orange-500">Terms of Service</a>
          <a href="#" className="hover:text-orange-500">Privacy Policy</a>
          <a href="#" className="hover:text-orange-500">CA Notice</a>
          <a href="#" className="hover:text-orange-500">Cookie Settings</a>
          <a href="#" className="hover:text-orange-500">Accessibility</a>
        </div>
      </div>
    </footer>
  );
}

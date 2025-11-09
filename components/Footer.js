import React from "react";
import { FaYoutube, FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";

export default function Footer() {
  const handleDownloadClick = () => {
    alert("Our mobile app is coming soon...");
  };

  return (
    <footer className="hidden md:block bg-black text-white px-12 py-10">
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-5 gap-8 text-sm">
        {/* For Clients */}
        <div>
          <h3 className="text-base font-semibold mb-4">For Clients</h3>
          <ul className="space-y-2">
            <li><a href="/job/post" className="hover:text-orange-400">List your job</a></li>
            <li><a href="/gigzzstar" className="hover:text-orange-400">Talent Marketplace</a></li>
            <li><a href="/portfolio" className="hover:text-orange-400">Portfolio Catalog</a></li>
            <li><a href="#" className="hover:text-orange-400">Hire an agency</a></li>
          </ul>
        </div>

        {/* For Creatives */}
        <div>
          <h3 className="text-base font-semibold mb-4">For Creatives</h3>
          <ul className="space-y-2">
            <li><a href="/learnmore#how-to-land-juicy-gigs" className="hover:text-orange-400">How to land juicy gigs</a></li>
            <li><a href="#" className="hover:text-orange-400">Find freelance jobs</a></li>
            <li><a href="/learnmore#how-to-win-jobs-with-ads" className="hover:text-orange-400">Win work with ads</a></li>
            <li><a href="#" className="hover:text-orange-400">Exclusive resources with Premium</a></li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h3 className="text-base font-semibold mb-4">Resources</h3>
          <ul className="space-y-2">
            <li><a href="/learnmore" className="hover:text-orange-400">Help & support</a></li>
            <li><a href="#" className="hover:text-orange-400">Gigzz reviews</a></li>
            <li><a href="/news" className="hover:text-orange-400">Blog</a></li>
            <li><a href="/gigzz/releasenote" className="hover:text-orange-400">Release notes</a></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h3 className="text-base font-semibold mb-4">Company</h3>
          <ul className="space-y-2">
            <li><a href="/about" className="hover:text-orange-400">About us</a></li>
            <li><a href="#" className="hover:text-orange-400">Careers</a></li>
            <li><a href="/contact" className="hover:text-orange-400">Contact us</a></li>
            <li><a href="/gigzz/trust-safety" className="hover:text-orange-400">Trust & safety</a></li>
            <li><a href="/gigzz/modern-slavery" className="hover:text-orange-400">Modern slavery statement</a></li>
          </ul>
        </div>

        {/* Socials */}
        <div>
          <h3 className="text-base font-semibold mb-4">Follow us</h3>
          <div className="flex items-center gap-4 mb-6">
            <a 
              href="https://www.facebook.com/mygigzz" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white hover:text-orange-400"
            >
              <FaFacebook size={20} />
            </a>
            <a 
              href="https://www.youtube.com/@Gigzzafrica" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white hover:text-orange-400"
            >
              <FaYoutube size={20} />
            </a>
            <a 
              href="https://www.instagram.com/mygigzz" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white hover:text-orange-400"
            >
              <FaInstagram size={20} />
            </a>
            <a 
              href="https://www.tiktok.com/@mygigzz.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white hover:text-orange-400"
            >
              <FaTiktok size={20} />
            </a>
          </div>
          <button
            onClick={handleDownloadClick}
            className="bg-white text-black text-sm font-semibold px-4 py-2 rounded hover:bg-orange-400 hover:text-white transition"
          >
            Download Mobile App
          </button>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mt-12 border-t border-gray-800 pt-6 flex justify-between text-xs text-gray-400 flex-wrap gap-4">
        <div>© 2015 - {new Date().getFullYear()} Gigzz® Global Inc.</div>
        <div className="flex gap-6">
          <a href="/terms" className="hover:text-orange-400">Terms of Service</a>
          <a href="/policy" className="hover:text-orange-400">Privacy Policy</a>
          <a href="/cookie" className="hover:text-orange-400">Cookie Settings</a>
        </div>
      </div>
    </footer>
  );
}
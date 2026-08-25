'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center">
        <div className="w-24 h-24 rounded-full bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.2)] flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-bold text-[#c9a84c]">404</span>
        </div>

        <h1 className="text-2xl font-bold text-[#f0f0f0] mb-2">Page Not Found</h1>
        <p className="text-[#94a3b8] mb-6 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="btn-primary px-6 py-2.5 rounded-lg text-sm flex items-center gap-2"
          >
            <Home size={16} />
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="btn-outline px-6 py-2.5 rounded-lg text-sm flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

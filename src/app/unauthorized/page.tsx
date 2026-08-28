import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#fdecea' }}>
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-8">
          Your account doesn&apos;t have permission to view this page. If you believe this is a mistake, contact an administrator.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-lg font-medium text-white"
          style={{ backgroundColor: '#003b70' }}
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

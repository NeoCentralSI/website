import { Link } from 'react-router-dom';

const LandingNavbar = () => {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link to="/" className="text-xl font-bold text-gray-900">SIP Akademik</Link>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/login" className="text-sm text-gray-700 hover:text-gray-900">Login</Link>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;



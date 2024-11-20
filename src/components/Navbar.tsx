import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Construction } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Construction className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold">RentalFinder</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/business" className="text-gray-700 hover:text-gray-900">
                  Business Portal
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-700 hover:text-gray-900"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/business" className="btn-primary">
                Business Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
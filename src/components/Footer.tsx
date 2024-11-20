import { Construction } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center mb-8">
          <Construction className="h-8 w-8 text-blue-500" />
          <span className="ml-2 text-xl font-bold text-white">RentalFinder</span>
        </div>
        <div className="text-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} RentalFinder. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
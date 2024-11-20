import { Routes, Route } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from './lib/stripe';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import BusinessPortal from './pages/BusinessPortal';
import PaymentConfirmation from './pages/PaymentConfirmation';
import { AuthProvider } from './context/AuthContext';
import { LeadProvider } from './context/LeadContext';

function App() {
  return (
    <AuthProvider>
      <LeadProvider>
        <Elements stripe={stripePromise}>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/business" element={<BusinessPortal />} />
                <Route path="/payment-confirmation" element={<PaymentConfirmation />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Elements>
      </LeadProvider>
    </AuthProvider>
  );
}

export default App;
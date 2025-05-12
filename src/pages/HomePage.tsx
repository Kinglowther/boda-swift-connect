
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Bike, Package, Shield, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: <Bike className="h-8 w-8 text-boda-600" />,
      title: "Quick Deliveries",
      description: "Get your items delivered quickly and efficiently across the city."
    },
    {
      icon: <Package className="h-8 w-8 text-boda-600" />,
      title: "Shop Pickups",
      description: "Request riders to pick up items from your favorite shops."
    },
    {
      icon: <MapPin className="h-8 w-8 text-boda-600" />,
      title: "Real-time Tracking",
      description: "Track your delivery in real-time to know exactly when it will arrive."
    },
    {
      icon: <Shield className="h-8 w-8 text-boda-600" />,
      title: "Verified Riders",
      description: "All our riders are verified with proper documentation for your safety."
    }
  ];

  return (
    <Layout>
      <section className="py-12 md:py-20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Quick Deliveries & Errands at Your Fingertips
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                Connect with verified boda riders for fast deliveries, shop pickups, and errands around the city.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              {user ? (
                <Button 
                  className="boda-btn text-lg px-8" 
                  onClick={() => navigate(`/${user.role}-dashboard`)}
                >
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button 
                    className="boda-btn text-lg px-8" 
                    onClick={() => navigate('/register')}
                  >
                    Get Started
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-lg border-boda-600 text-boda-600 hover:bg-boda-50" 
                    onClick={() => navigate('/rider-registration')}
                  >
                    Become a Rider
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-boda-50 rounded-3xl my-8">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center animate-fade-in">
              <div className="w-12 h-12 bg-boda-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-boda-800 text-xl font-bold">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Request a Ride</h3>
              <p className="text-gray-600">Submit your pickup and drop-off locations along with item details</p>
            </div>
            <div className="flex flex-col items-center text-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="w-12 h-12 bg-boda-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-boda-800 text-xl font-bold">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Get Matched with a Rider</h3>
              <p className="text-gray-600">Our system finds the nearest available boda rider for your delivery</p>
            </div>
            <div className="flex flex-col items-center text-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="w-12 h-12 bg-boda-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-boda-800 text-xl font-bold">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Track in Real-time</h3>
              <p className="text-gray-600">Follow your delivery progress until it safely reaches its destination</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold text-center mb-8">Our Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="boda-card hover:scale-105 transition-transform"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;

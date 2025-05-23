
import React from 'react';

const Footer: React.FC = () => {
  const founders = [
    { name: 'Ibrah', phone: '0740500484' },
    { name: 'David', phone: '0743049871' },
    { name: 'Tonie', phone: '0799004276' }
  ];

  return (
    <footer className="bg-boda-900 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center">
          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2 text-center">Boda</h3>
            <p className="text-boda-200 text-sm text-center">
              Connecting customers to boda riders for quick deliveries and errands
            </p>
          </div>
          
          <div className="mb-4">
            <h4 className="text-lg font-medium mb-2 text-center">Our Founders</h4>
            <div className="flex flex-wrap justify-center gap-4">
              {founders.map((founder) => (
                <a 
                  key={founder.name} 
                  href={`tel:${founder.phone}`} 
                  className="flex items-center px-3 py-2 bg-boda-800 rounded-lg hover:bg-boda-700 transition-colors"
                >
                  <span className="mr-2">{founder.name}</span>
                  <span className="text-boda-300">({founder.phone})</span>
                </a>
              ))}
            </div>
          </div>
          
          <div className="text-sm text-boda-300">
            &copy; {new Date().getFullYear()} Boda. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

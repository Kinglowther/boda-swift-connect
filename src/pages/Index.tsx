
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HomePage from './HomePage';

// Automatically redirect to the home page
const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/');
  }, [navigate]);
  
  return <HomePage />;
};

export default Index;

import React from 'react';
import logo from '@/assets/logo.png'; // ou '@/assets/logo.svg'

const Logo = () => {
  return (
    <img
      src={logo}
      alt="EvalExpress"
      className="h-8 w-auto sm:h-10"
    />
  );
};

export default Logo;

import React from 'react';
export const Button: React.FC<any> = ({ children, variant = 'primary', ...props }) => {
  const cls = variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white';
  return <button className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all ${cls}`} {...props}>{children}</button>;
};
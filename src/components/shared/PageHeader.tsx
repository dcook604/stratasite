
import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description }) => {
  return (
    <div className="bg-primary/5 py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="mt-2 text-lg text-gray-600 max-w-3xl">{description}</p>
        )}
      </div>
    </div>
  );
};

export default PageHeader;

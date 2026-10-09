import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, icon }) => {
  return (
    <div className="bg-surface-subtle py-12 md:py-16">
      <div className="max-w-container-max mx-auto px-gutter">
        <div className="flex items-center gap-3">
          {icon}
          <h1 className="text-headline-lg text-on-surface">{title}</h1>
        </div>
        {description && (
          <p className="mt-3 text-body-lg text-on-surface-variant max-w-3xl">{description}</p>
        )}
      </div>
    </div>
  );
};

export default PageHeader;

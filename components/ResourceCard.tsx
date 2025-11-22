import React from 'react';
import { ResourceItem } from '../types';

interface Props {
  resource: ResourceItem;
}

export const ResourceCard: React.FC<Props> = ({ resource }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-100 hover:shadow-md transition-shadow duration-200">
      <div className="text-3xl mb-3">{resource.icon}</div>
      <h3 className="text-lg font-semibold text-brand-900 mb-2">{resource.title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed mb-4">{resource.description}</p>
      {resource.link && (
        <a 
          href={resource.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-brand-600 font-medium text-sm hover:text-brand-800 flex items-center gap-1"
        >
          Learn more <span>&rarr;</span>
        </a>
      )}
    </div>
  );
};

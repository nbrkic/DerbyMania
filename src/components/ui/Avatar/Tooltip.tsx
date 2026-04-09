import React from 'react';
interface TooltipProps {
  content: string;
  children: React.ReactNode;
}
export const Tooltip = ({ content, children }: TooltipProps) => {
  return (
    <div className="relative group">
      {children}
      <div
        className="
          absolute
          left-1/2
          -translate-x-1/2
          bottom-full
          mb-2
          px-2
          py-1
          bg-gray-800
          text-white
          text-sm
          rounded
          opacity-0
          group-hover:opacity-100
          transition-opacity
          whitespace-nowrap
        "
















        role="tooltip">
        
        {content}
      </div>
    </div>);

};
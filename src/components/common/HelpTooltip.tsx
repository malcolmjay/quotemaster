import React, { useState } from 'react';
import { useHelp } from '../../context/HelpContext';

interface HelpTooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * HelpTooltip Component
 *
 * Displays a helpful tooltip when Help Mode is enabled and the user hovers over the wrapped element.
 *
 * Usage:
 * <HelpTooltip content="Description of what this button does">
 *   <button>Click Me</button>
 * </HelpTooltip>
 *
 * The tooltip only appears when Help Mode is active (toggled via the help icon in the header).
 */

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ content, children, className = '' }) => {
  const { helpMode } = useHelp();
  const [isHovered, setIsHovered] = useState(false);

  if (!helpMode) {
    return <>{children}</>;
  }

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {isHovered && (
        <div className="absolute z-50 w-64 p-3 mt-2 text-sm text-white bg-blue-600 rounded-lg shadow-xl left-0 top-full animate-in fade-in duration-200">
          <div className="absolute -top-1 left-4 w-2 h-2 bg-blue-600 transform rotate-45"></div>
          {content}
        </div>
      )}
    </div>
  );
};

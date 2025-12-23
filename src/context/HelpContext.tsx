import React, { createContext, useContext, useState } from 'react';

interface HelpContextType {
  helpMode: boolean;
  toggleHelpMode: () => void;
}

const HelpContext = createContext<HelpContextType | undefined>(undefined);

export const HelpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [helpMode, setHelpMode] = useState(false);

  const toggleHelpMode = () => {
    setHelpMode(prev => !prev);
  };

  return (
    <HelpContext.Provider value={{ helpMode, toggleHelpMode }}>
      {children}
    </HelpContext.Provider>
  );
};

export const useHelp = () => {
  const context = useContext(HelpContext);
  if (context === undefined) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return context;
};

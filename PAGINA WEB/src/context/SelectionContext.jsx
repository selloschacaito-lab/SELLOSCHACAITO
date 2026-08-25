import React, { createContext, useState, useContext, useEffect } from 'react';

const SelectionContext = createContext();

export const useSelection = () => useContext(SelectionContext);

export const SelectionProvider = ({ children }) => {
  const [selectedItems, setSelectedItems] = useState(() => {
    const saved = localStorage.getItem('sellos_selection');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sellos_selection', JSON.stringify(selectedItems));
  }, [selectedItems]);

  const toggleItem = (item, variantName = '', inkColor = '') => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      }
      return [...prev, { ...item, selectedVariant: variantName, selectedInk: inkColor }];
    });
  };

  const removeItem = (id) => {
    setSelectedItems(prev => prev.filter(i => i.id !== id));
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  return (
    <SelectionContext.Provider value={{ 
      selectedItems, 
      toggleItem, 
      removeItem, 
      clearSelection,
      isSidebarOpen,
      toggleSidebar,
      setIsSidebarOpen
    }}>
      {children}
    </SelectionContext.Provider>
  );
};

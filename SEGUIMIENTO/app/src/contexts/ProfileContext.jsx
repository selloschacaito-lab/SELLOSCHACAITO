import React, { createContext, useContext, useState, useEffect } from 'react';

const ProfileContext = createContext();

export function useProfile() {
  return useContext(ProfileContext);
}

export function ProfileProvider({ children }) {
  const [activeProfile, setActiveProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage on mount
    const stored = localStorage.getItem('activeProfile');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const today = new Date().toISOString().split('T')[0];
        
        // If the login date is today, restore session. Otherwise, expire it.
        if (parsed.loginDate === today) {
          setActiveProfile(parsed);
        } else {
          localStorage.removeItem('activeProfile');
        }
      } catch (err) {
        console.error('Error parsing stored profile', err);
        localStorage.removeItem('activeProfile');
      }
    }
    setLoading(false);
  }, []);

  const setProfile = (profile) => {
    const today = new Date().toISOString().split('T')[0];
    const profileData = { ...profile, loginDate: today };
    localStorage.setItem('activeProfile', JSON.stringify(profileData));
    setActiveProfile(profileData);
  };

  const logoutProfile = () => {
    localStorage.removeItem('activeProfile');
    setActiveProfile(null);
  };

  const value = {
    activeProfile,
    setProfile,
    logoutProfile
  };

  return (
    <ProfileContext.Provider value={value}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#64748b' }}>
          Cargando perfiles...
        </div>
      ) : children}
    </ProfileContext.Provider>
  );
}

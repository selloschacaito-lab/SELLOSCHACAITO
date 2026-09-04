import React from 'react';
import { useProfile } from '../contexts/ProfileContext';
import ProfileSelector from '../pages/ProfileSelector';

function ProfileRoute({ children }) {
  const { activeProfile } = useProfile();

  if (!activeProfile) {
    return <ProfileSelector />;
  }

  return children;
}

export default ProfileRoute;

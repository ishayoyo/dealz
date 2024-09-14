import React from 'react';
import UserProfile from '../components/user/UserProfile';
import UserSettings from '../components/user/UserSettings';

const ProfilePage = () => {
  return (
    <div className="profile-page">
      <h1>Profile</h1>
      <UserProfile />
      <UserSettings />
    </div>
  );
};

export default ProfilePage;
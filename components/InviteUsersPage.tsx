import React from "react";

const InviteUsersPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-900">Invites disabled</h1>
      <p className="mt-2 text-sm text-slate-600">
        Netlify functions have been removed in this build. To add teammates, use the Settings page to create local
        users or share demo credentials.
      </p>
    </div>
  );
};

export default InviteUsersPage;

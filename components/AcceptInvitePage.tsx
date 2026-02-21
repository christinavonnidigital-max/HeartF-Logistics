import React from "react";

const AcceptInvitePage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Invites disabled</h1>
      <p className="mt-2 text-sm text-slate-600">
        This build runs without Netlify functions, so invite links are not supported. Ask an admin to create a
        local account for you or sign up directly on the login page.
      </p>
    </div>
  );
};

export default AcceptInvitePage;

import React from "react";
import { ShellCard, StatusPill } from "./UiKit";

const WaitingRoom: React.FC<{ email?: string | null }> = ({ email }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <ShellCard className="max-w-md w-full p-6 text-center space-y-4">
        <div className="text-xs font-semibold tracking-[0.25em] text-muted-foreground">ACCESS PENDING</div>
        <h1 className="text-2xl font-bold text-slate-900">Waiting for admin approval</h1>
        <p className="text-sm text-slate-600">
          Your account has been created but needs an admin to assign a role. You'll get access as soon as they approve you.
        </p>
        <div className="space-y-2">
          <StatusPill tone="info" label="What to do next" />
          <p className="text-sm text-slate-600">
            Let your dispatcher or admin know the email you used{email ? ` (${email})` : ""}. They can approve you in Settings -&gt; User directory.
          </p>
        </div>
        <div className="text-xs text-slate-500">
          If you believe this is an error, sign out and try again or contact support.
        </div>
      </ShellCard>
    </div>
  );
};

export default WaitingRoom;
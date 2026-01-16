import React, { useEffect, useMemo, useState } from "react";
import Layout from "./Layout";
import { useAuth } from "../auth/AuthContext";
import { Button, Input, Select, ShellCard, StatusPill, SubtleCard } from "./UiKit";

type InviteRow = {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
};

type Msg = { tone: "success" | "warn" | "info"; text: string } | null;

function fmt(ts: string) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function msUntil(ts: string) {
  const t = new Date(ts).getTime();
  if (!Number.isFinite(t)) return 0;
  return t - Date.now();
}

function formatCountdown(ms: number) {
  const abs = Math.abs(ms);
  const mins = Math.floor(abs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${mins % 60}m`;
  return `${mins}m`;
}

function inviteStatus(inv: InviteRow) {
  if (inv.used_at) return { tone: "success" as const, label: "Used" };
  if (inv.revoked_at) return { tone: "info" as const, label: "Revoked" };

  const left = msUntil(inv.expires_at);
  if (left <= 0) return { tone: "warn" as const, label: "Expired" };

  const soonMs = 48 * 60 * 60 * 1000;
  if (left <= soonMs) return { tone: "warn" as const, label: `Expiring in ${formatCountdown(left)}` };

  return { tone: "info" as const, label: `Active (${formatCountdown(left)})` };
}

async function copyToClipboard(text: string) {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

const InviteUsersPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  const [filter, setFilter] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  const loadInvites = async () => {
    setLoadingInvites(true);
    setMsg(null);
    try {
      const res = await fetch("/.netlify/functions/auth-invite-list", {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load invites");
      setInvites(data.invites || []);
    } catch (e: any) {
      setMsg({ tone: "warn", text: String(e?.message || e) });
    } finally {
      setLoadingInvites(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadInvites();
  }, [isAdmin]);

  const normFilter = filter.trim().toLowerCase();

  const filteredInvites = useMemo(() => {
    if (!normFilter) return invites;
    return invites.filter((i) => (i.email || "").toLowerCase().includes(normFilter));
  }, [invites, normFilter]);

  const pendingInvites = useMemo(() => {
    return filteredInvites.filter((i) => {
      if (i.used_at || i.revoked_at) return false;
      return msUntil(i.expires_at) > 0;
    });
  }, [filteredInvites]);

  const historyInvites = useMemo(() => {
    return filteredInvites.filter((i) => {
      if (i.used_at || i.revoked_at) return true;
      return msUntil(i.expires_at) <= 0;
    });
  }, [filteredInvites]);

  const inviteCreate = async (emailToSend: string, roleToSend: string, sendEmail: boolean) => {
    const res = await fetch("/.netlify/functions/auth-invite-create", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailToSend, role: roleToSend, sendEmail }),
    });
    const data = await res.json();
    if (!res.ok || !data?.ok) throw new Error(data?.error || "Invite request failed");
    return String(data.inviteLink || "");
  };

  const sendInvite = async () => {
    const eNorm = email.trim();
    if (!eNorm) {
      setMsg({ tone: "warn", text: "Please enter an email address." });
      return;
    }

    setBusy(true);
    setMsg(null);
    setLastInviteLink(null);
    try {
      const link = await inviteCreate(eNorm, role, true);
      setLastInviteLink(link);
      setMsg({ tone: "success", text: "Invite sent. You can also copy the invite link." });
      setEmail("");
      await loadInvites();
    } catch (e: any) {
      setMsg({ tone: "warn", text: String(e?.message || e) });
    } finally {
      setBusy(false);
    }
  };

  const resendInvite = async (row: InviteRow) => {
    setBusy(true);
    setMsg(null);
    setLastInviteLink(null);
    try {
      const link = await inviteCreate(row.email, row.role, true);
      setLastInviteLink(link);
      setMsg({ tone: "success", text: "Invite resent. A new link was generated." });
      await loadInvites();
    } catch (e: any) {
      setMsg({ tone: "warn", text: String(e?.message || e) });
    } finally {
      setBusy(false);
    }
  };

  const copyInviteLink = async (row: InviteRow) => {
    setBusy(true);
    setMsg(null);
    setLastInviteLink(null);
    try {
      const link = await inviteCreate(row.email, row.role, false);
      await copyToClipboard(link);
      setLastInviteLink(link);
      setMsg({ tone: "info", text: "Invite link copied (new link generated)." });
      await loadInvites();
    } catch (e: any) {
      setMsg({ tone: "warn", text: String(e?.message || e) });
    } finally {
      setBusy(false);
    }
  };

  const copyLastLink = async () => {
    if (!lastInviteLink) return;
    setMsg(null);
    try {
      await copyToClipboard(lastInviteLink);
      setMsg({ tone: "info", text: "Copied to clipboard." });
    } catch {
      setMsg({ tone: "warn", text: "Copy failed. Please select and copy manually." });
    }
  };

  const revokeInvite = async (inviteId: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/.netlify/functions/auth-invite-revoke", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to revoke invite");

      setMsg({ tone: "info", text: "Invite revoked." });
      await loadInvites();
    } catch (e: any) {
      setMsg({ tone: "warn", text: String(e?.message || e) });
    } finally {
      setBusy(false);
    }
  };

  if (!isAdmin) {
    return (
      <Layout>
        <ShellCard className="p-6">
          <StatusPill tone="warn" label="Admins only" />
          <div className="mt-3 text-sm text-muted-foreground">You don’t have permission to invite users.</div>
        </ShellCard>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
        <ShellCard className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold text-foreground">Invite users</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Send an invite email. If email delivery is blocked, use “Copy invite link”.
              </div>
            </div>
            <Button variant="secondary" onClick={loadInvites} disabled={busy || loadingInvites}>
              {loadingInvites ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="text-xs text-muted-foreground mb-1">Email</div>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Role</div>
              <Select value={role} onChange={(e: any) => setRole(String(e?.target?.value || "user"))}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="primary" onClick={sendInvite} disabled={busy}>
                {busy ? "Sending..." : "Send invite"}
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">{msg ? <StatusPill tone={msg.tone as any} label={msg.text} /> : null}</div>

            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground">Filter</div>
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search by email..."
                className="w-[260px] max-w-full"
              />
            </div>
          </div>

          {lastInviteLink ? (
            <SubtleCard className="mt-4 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="text-xs text-muted-foreground break-all">{lastInviteLink}</div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={copyLastLink}>
                    Copy link
                  </Button>
                </div>
              </div>
            </SubtleCard>
          ) : null}
        </ShellCard>

        <ShellCard className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-md font-semibold text-foreground">Pending invites</div>
              <div className="mt-1 text-sm text-muted-foreground">Active invites that haven’t been used, revoked, or expired.</div>
            </div>
            <StatusPill tone="info" label={`${pendingInvites.length} pending`} />
          </div>

          <div className="mt-4 overflow-auto rounded-2xl border border-border bg-card">
            <table className="min-w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Role</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Created</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Expires</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[340px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingInvites.map((i) => {
                  const st = inviteStatus(i);
                  return (
                    <tr key={i.id} className="border-t border-border">
                      <td className="px-3 py-3">
                        <div className="font-medium text-foreground">{i.email}</div>
                      </td>
                      <td className="px-3 py-3">{i.role}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{fmt(i.created_at)}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{fmt(i.expires_at)}</td>
                      <td className="px-3 py-3">
                        <StatusPill tone={st.tone as any} label={st.label} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button variant="secondary" size="sm" onClick={() => resendInvite(i)} disabled={busy}>
                            Resend email
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => copyInviteLink(i)} disabled={busy}>
                            Copy invite link
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => revokeInvite(i.id)} disabled={busy}>
                            Revoke
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {pendingInvites.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-sm text-muted-foreground" colSpan={6}>
                      No pending invites.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <SubtleCard className="mt-4 p-4">
            <div className="text-xs text-muted-foreground">
              For best deliverability, use a custom sender domain with SPF/DKIM/DMARC. Neon recommends replacing the shared sender
              with your own email provider for production.
            </div>
          </SubtleCard>
        </ShellCard>

        <ShellCard className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-md font-semibold text-foreground">Invite history</div>
              <div className="mt-1 text-sm text-muted-foreground">Used, revoked, and expired invites.</div>
            </div>

            <div className="flex items-center gap-2">
              <StatusPill tone="info" label={`${historyInvites.length} in history`} />
              <Button variant="secondary" onClick={() => setShowHistory((v) => !v)} disabled={busy}>
                {showHistory ? "Hide history" : "Show history"}
              </Button>
            </div>
          </div>

          {showHistory ? (
            <div className="mt-4 overflow-auto rounded-2xl border border-border bg-card">
              <table className="min-w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Role</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Created</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Expires</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyInvites.map((i) => {
                    const st = inviteStatus(i);
                    return (
                      <tr key={i.id} className="border-t border-border">
                        <td className="px-3 py-3">
                          <div className="font-medium text-foreground">{i.email}</div>
                        </td>
                        <td className="px-3 py-3">{i.role}</td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">{fmt(i.created_at)}</td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">{fmt(i.expires_at)}</td>
                        <td className="px-3 py-3">
                          <StatusPill tone={st.tone as any} label={st.label} />
                        </td>
                      </tr>
                    );
                  })}
                  {historyInvites.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-sm text-muted-foreground" colSpan={5}>
                        No history items.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          ) : null}
        </ShellCard>
      </div>
    </Layout>
  );
};

export default InviteUsersPage;

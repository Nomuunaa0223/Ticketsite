import { OrganizerApplicationStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { OrganizerApplicationActions } from "@/components/admin/organizer-application-actions";

export default async function AdminOrganizerApplicationsPage() {
  const user = await requireRole("ADMIN");
  const applications = await prisma.organizerApplication.findMany({
    orderBy: { createdAt: "desc" },
    include: { reviewedByAdmin: { select: { fullName: true } } },
  });

  const groups = [
    { status: OrganizerApplicationStatus.PENDING, title: "Pending" },
    { status: OrganizerApplicationStatus.APPROVED, title: "Approved" },
    { status: OrganizerApplicationStatus.REJECTED, title: "Rejected" },
  ];

  return (
    <AdminShell user={user}>
      <div className="space-y-8">
        <div>
          <p className="font-goldman text-xs font-bold uppercase tracking-[0.28em] text-[#ff7224]">Organizer review</p>
          <h1 className="mt-1 font-goldman text-2xl font-bold text-white">Organizer Applications</h1>
          <p className="mt-2 text-sm text-white/42">Approve applications to create organizer accounts and password setup links.</p>
        </div>

        {groups.map((group) => {
          const items = applications.filter((item) => item.status === group.status);
          return (
            <section key={group.status} className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-white">{group.title}</h2>
                <span className={`rounded-full px-2.5 py-1 text-[0.64rem] font-bold ${getStatusClasses(group.status)}`}>
                  {items.length}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-white/38">
                  No {group.title.toLowerCase()} applications.
                </div>
              ) : (
                <div className="grid gap-3">
                  {items.map((application) => (
                    <article key={application.id} className="rounded-2xl bg-[#0f1629] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-bold text-white">{application.companyName}</h3>
                            <span className={`rounded-full px-2.5 py-1 text-[0.64rem] font-bold ${getStatusClasses(application.status)}`}>
                              {application.status}
                            </span>
                          </div>
                          <div className="grid gap-2 text-sm text-white/58 sm:grid-cols-2">
                            <p><span className="text-white/32">Contact:</span> {application.contactName}</p>
                            <p><span className="text-white/32">Email:</span> {application.email}</p>
                            <p><span className="text-white/32">Phone:</span> {application.phone}</p>
                            <p><span className="text-white/32">Submitted:</span> {formatDate(application.createdAt)}</p>
                            {application.websiteUrl ? <p><span className="text-white/32">Website:</span> {application.websiteUrl}</p> : null}
                            {application.socialUrl ? <p><span className="text-white/32">Social:</span> {application.socialUrl}</p> : null}
                            {application.reviewedAt ? <p><span className="text-white/32">Reviewed:</span> {formatDate(application.reviewedAt)}</p> : null}
                            {application.reviewedByAdmin ? <p><span className="text-white/32">Admin:</span> {application.reviewedByAdmin.fullName}</p> : null}
                          </div>
                          <p className="max-w-4xl whitespace-pre-wrap text-sm leading-6 text-white/72">{application.description}</p>
                        </div>

                        {application.status === OrganizerApplicationStatus.PENDING ? (
                          <OrganizerApplicationActions applicationId={application.id} />
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </AdminShell>
  );
}

function getStatusClasses(status: OrganizerApplicationStatus) {
  if (status === OrganizerApplicationStatus.APPROVED) return "bg-emerald-400/16 text-emerald-300";
  if (status === OrganizerApplicationStatus.REJECTED) return "bg-red-400/16 text-red-300";
  return "bg-amber-400/16 text-amber-300";
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

import { SetupPasswordForm } from "@/components/forms/setup-password-form";

type Props = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function SetupPasswordPage({ searchParams }: Props) {
  const tokenParam = (await searchParams).token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

  return (
    <section className="mx-auto grid min-h-[calc(100vh-12rem)] max-w-xl place-items-center px-6 py-16 text-white">
      <div className="w-full space-y-5">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ff7224]">Organizer access</p>
          <h1 className="mt-2 font-goldman text-3xl font-bold">Set your password</h1>
          <p className="mt-2 text-sm leading-6 text-white/52">
            Create a password to activate your organizer account.
          </p>
        </div>

        {token ? (
          <SetupPasswordForm token={token} />
        ) : (
          <div className="rounded-2xl bg-red-400/12 p-5 text-sm font-semibold text-red-200">
            Missing setup token. Please use the link from your email.
          </div>
        )}
      </div>
    </section>
  );
}

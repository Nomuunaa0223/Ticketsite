type PasswordSetupEmailInput = {
  to: string;
  contactName: string;
  companyName: string;
  setupUrl: string;
};

export async function sendPasswordSetupEmail(input: PasswordSetupEmailInput) {
  console.log("[mail:password-setup]", {
    to: input.to,
    contactName: input.contactName,
    companyName: input.companyName,
    setupUrl: input.setupUrl,
  });
}

export const ADMIN_EMAILS = [
  "diogo.luciano@programaleiloes.com",
  "fabio.oliveira@programaleiloes.com",
  "priscila.tirola@programaleiloes.com",
];

export const isUserAdmin = (email?: string | null) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
};

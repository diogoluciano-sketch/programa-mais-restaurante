export const ADMIN_EMAILS = [
  "diogo.luciano@programaleiloes.com",
  "fabio.oliveira@programaleiloes.com",
  "priscila.tirola@programaleiloes.com",
];

export const ALLOWED_DOMAINS = [
  "programaleiloes.com",
  "giftapp.app",
  "remateweb.com",
  "remateagroshop.com",
  "agroimmobiliare.com",
];

export const isUserAdmin = (email?: string | null) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
};

export const isEmailAllowed = (email?: string | null) => {
  if (!email) return false;
  const domain = email.split("@")[1];
  return ALLOWED_DOMAINS.includes(domain);
};

export const RSVP_START_HOUR = 7;
export const RSVP_END_HOUR = 10;

export const isRSVPOpen = () => {
  const now = new Date();
  const hour = now.getHours();
  // Allow from RSVP_START_HOUR:00 to RSVP_END_HOUR:00
  return hour >= RSVP_START_HOUR && hour < RSVP_END_HOUR;
};

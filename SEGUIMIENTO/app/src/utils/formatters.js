export const normalizeWhatsApp = (phone) => {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) clean = '58' + clean.substring(1);
  else if (!clean.startsWith('58') && clean.length === 10) clean = '58' + clean;
  return clean;
};

export const formatDisplayPhone = (phone) => {
  if (!phone) return '';
  let clean = String(phone).replace(/\D/g, '');
  if (clean.startsWith('58') && clean.length >= 12) {
    clean = '0' + clean.slice(2);
  } else if (!clean.startsWith('0') && clean.length === 10) {
    clean = '0' + clean;
  }
  return clean;
};

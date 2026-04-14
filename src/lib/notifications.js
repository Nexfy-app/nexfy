import { base44 } from '@/api/base44Client';

export async function createNotification({ user_email, title, body, type, link }) {
  return base44.entities.Notification.create({ user_email, title, body, type, link, is_read: false });
}

export async function sendEmailIfEnabled(user_email, type, { to, subject, emailBody }) {
  const settings = await base44.entities.NotificationSettings.filter({ user_email });
  const prefs = settings?.[0];

  const keyMap = {
    new_request: 'email_new_request',
    request_accepted: 'email_request_accepted',
    request_in_progress: 'email_request_in_progress',
    request_completed: 'email_request_completed',
    new_message: 'email_new_message',
  };

  const prefKey = keyMap[type];
  // Default to true if no settings saved yet
  const enabled = prefs ? prefs[prefKey] !== false : true;

  if (enabled) {
    base44.integrations.Core.SendEmail({ to, subject, body: emailBody }).catch(() => {});
  }
}
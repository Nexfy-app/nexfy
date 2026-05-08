import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Auto-offline desativado: profissionais ficam online até se desativarem manualmente.
Deno.serve(async (req) => {
  return Response.json({ cleaned: 0, message: 'Auto-offline disabled. Professionals stay online until manually toggled.' });
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data } = body;

    if (event?.type !== 'create') {
      return Response.json({ skipped: true, reason: 'not a create event' });
    }

    const request = data;

    if (!request?.professional_user_email) {
      return Response.json({ skipped: true, reason: 'no professional_user_email on request' });
    }

    const clientName = request.client_name || request.client_email?.split('@')[0] || 'Um cliente';
    const category = request.category?.startsWith('outros:')
      ? request.category.replace('outros:', '')
      : request.category?.replace(/_/g, ' ') || 'serviço';
    const urgent = request.is_urgent ? ' ⚡ URGENTE' : '';

    // In-app notification
    await base44.asServiceRole.entities.Notification.create({
      user_email: request.professional_user_email,
      title: `🔔 Novo pedido de ${clientName}${urgent}`,
      body: `${category}: ${request.description?.slice(0, 100) || 'Sem descrição'}`,
      type: 'new_request',
      link: '/requests',
      is_read: false,
    });

    // Email notification (best-effort)
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: request.professional_user_email,
        subject: `🔔 Novo pedido — ${clientName}${urgent}`,
        body: `Olá!\n\nVocê recebeu um novo pedido de serviço no SERV.\n\nCliente: ${clientName}\nServiço: ${category}${request.description ? `\nDescrição: ${request.description}` : ''}${request.address ? `\nEndereço: ${request.address}` : ''}${request.is_urgent ? '\n\n⚡ Este pedido é URGENTE!' : ''}\n\nAbra o SERV agora para aceitar ou recusar o pedido.\n\nhttps://serv.base44.app/requests`,
      });
    } catch (_) { /* email may fail for external addresses */ }

    return Response.json({ success: true, notified: request.professional_user_email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
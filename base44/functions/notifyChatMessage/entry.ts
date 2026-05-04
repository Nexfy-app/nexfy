import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { data, event } = body;

    // Só processa criação de mensagens
    if (event?.type !== 'create') {
      return Response.json({ skipped: true });
    }

    const msg = data;
    if (!msg?.receiver_email || !msg?.sender_email) {
      return Response.json({ skipped: 'missing fields' });
    }

    // Busca o nome do remetente via User entity
    let senderName = msg.sender_email;
    const users = await base44.asServiceRole.entities.User.filter({ email: msg.sender_email });
    if (users?.length > 0) {
      senderName = users[0].full_name || msg.sender_email;
    }

    let messagePreview = '';
    if (msg.message_type === 'image') {
      messagePreview = '📷 Enviou uma imagem';
    } else if (msg.message_type === 'file') {
      messagePreview = `📎 Enviou um arquivo: ${msg.file_name || 'arquivo'}`;
    } else {
      messagePreview = msg.message || '';
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: msg.receiver_email,
      from_name: 'Nexfy',
      subject: `💬 Nova mensagem de ${senderName}`,
      body: `Você recebeu uma nova mensagem no Nexfy:\n\n"${messagePreview}"\n\nAbra o Nexfy para responder: https://nexfy.base44.app\n\n---\nEquipe Nexfy`,
    });

    return Response.json({ sent: true, to: msg.receiver_email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
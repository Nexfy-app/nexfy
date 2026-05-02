import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { data } = body;

    if (!data) {
      return Response.json({ error: 'No data provided' }, { status: 400 });
    }

    // Get all admin users
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter(u => u.role === 'admin');

    if (admins.length === 0) {
      return Response.json({ message: 'No admins found' });
    }

    const professionalEmail = data.professional_email || 'desconhecido';
    const documentName = data.document_name || 'Documento';
    const documentType = data.document_type || '';

    const typeLabels = {
      identity: 'Identidade',
      certificate: 'Certificado',
      license: 'Licença',
    };
    const typeLabel = typeLabels[documentType] || documentType;

    // Notify each admin
    await Promise.all(admins.map(admin =>
      base44.asServiceRole.entities.Notification.create({
        user_email: admin.email,
        title: `📄 Novo documento para verificar`,
        body: `${professionalEmail} enviou "${documentName}" (${typeLabel}) para validação.`,
        type: 'new_request',
        link: '/admin',
        is_read: false,
      })
    ));

    // Send email to each admin
    await Promise.all(admins.map(admin =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `📄 Novo documento para verificar — ${professionalEmail}`,
        body: `Olá,\n\nO profissional ${professionalEmail} enviou um novo documento para verificação:\n\nNome: ${documentName}\nTipo: ${typeLabel}\n\nAcesse o painel de administração para revisar e aprovar ou rejeitar o documento.\n\nATT,\nEquipe Serfy`,
      }).catch(() => {})
    ));

    return Response.json({ success: true, notified: admins.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
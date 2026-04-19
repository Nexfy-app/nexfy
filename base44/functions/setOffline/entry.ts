import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { professional_id } = body;

    if (!professional_id) {
      return Response.json({ error: 'professional_id required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    await base44.asServiceRole.entities.Professional.update(professional_id, {
      is_available: false,
      latitude: null,
      longitude: null,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Marca como offline profissionais que estão "online" mas não atualizam localização há mais de 2h
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const professionals = await base44.asServiceRole.entities.Professional.filter({ is_available: true });

    const TWO_HOURS_AGO = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const stale = professionals.filter(p => {
      if (!p.updated_date) return true;
      return p.updated_date < TWO_HOURS_AGO;
    });

    await Promise.all(
      stale.map(p =>
        base44.asServiceRole.entities.Professional.update(p.id, {
          is_available: false,
          latitude: null,
          longitude: null,
        })
      )
    );

    return Response.json({ cleaned: stale.length, ids: stale.map(p => p.id) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
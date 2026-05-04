import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { professional_id, metric } = await req.json();

    if (!professional_id || !['profile_view', 'search_impression'].includes(metric)) {
      return Response.json({ error: 'Invalid params' }, { status: 400 });
    }

    // Busca a assinatura ativa do profissional
    const subs = await base44.asServiceRole.entities.TurboSubscription.filter({
      professional_id,
    }, '-created_date', 1);

    if (!subs.length) return Response.json({ skipped: 'no subscription' });

    const sub = subs[0];
    if (sub.status !== 'active' && sub.status !== 'trial') {
      return Response.json({ skipped: 'inactive' });
    }

    const field = metric === 'profile_view' ? 'profile_views' : 'search_impressions';
    const current = sub[field] || 0;

    await base44.asServiceRole.entities.TurboSubscription.update(sub.id, {
      [field]: current + 1,
    });

    return Response.json({ ok: true, [field]: current + 1 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
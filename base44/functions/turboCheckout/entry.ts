import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const PRICE_ID = Deno.env.get('STRIPE_PRICE_ID');

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, subscription_id, professional_id } = await req.json();

  // ── CREATE CHECKOUT SESSION ──
  if (action === 'create_checkout') {
    if (!PRICE_ID) return Response.json({ error: 'STRIPE_PRICE_ID secret não configurado' }, { status: 500 });

    // Security: validate that the professional_id belongs to the authenticated user
    if (professional_id) {
      const pros = await base44.entities.Professional.filter({ user_email: user.email });
      const belongs = pros.some(p => p.id === professional_id);
      if (!belongs) return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const origin = req.headers.get('origin') || 'https://app.base44.com';

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: PRICE_ID, quantity: 1 }],
        subscription_data: {
          metadata: {
            professional_id,
            professional_email: user.email,
            plan: 'monthly',
          },
        },
        metadata: {
          professional_id,
          professional_email: user.email,
          plan: 'monthly',
        },
        success_url: `${origin}/professional/dashboard?turbo=success`,
        cancel_url: `${origin}/profile?turbo=cancel`,
        customer_email: user.email,
      });
    } catch (err) {
      console.error('[turboCheckout] Stripe error:', err.message);
      return Response.json({ error: err.message }, { status: 500 });
    }

    return Response.json({ url: session.url });
  }

  // ── CANCEL SUBSCRIPTION ──
  if (action === 'cancel') {
    if (!subscription_id) return Response.json({ error: 'ID inválido' }, { status: 400 });

    // Security: validate that the subscription belongs to the authenticated user
    const ownedSubs = await base44.entities.TurboSubscription.filter({ professional_email: user.email });
    const owned = ownedSubs.find(s => s.stripe_subscription_id === subscription_id);
    if (!owned) return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Cancela imediatamente na Stripe
    try {
      await stripe.subscriptions.cancel(subscription_id);
    } catch (err) {
      console.error('[turboCheckout] Cancel error:', err.message);
      return Response.json({ error: err.message }, { status: 500 });
    }

    // Atualiza DB: status cancelled + remove is_premium do profissional
    const subs = await base44.asServiceRole.entities.TurboSubscription.filter({
      stripe_subscription_id: subscription_id,
    });
    if (subs.length > 0) {
      const sub = subs[0];
      await base44.asServiceRole.entities.TurboSubscription.update(sub.id, {
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      });
      if (sub.professional_id) {
        await base44.asServiceRole.entities.Professional.update(sub.professional_id, {
          is_premium: false,
        }).catch(() => {});
      }
    }

    return Response.json({ success: true, cancelled: true });
  }

  // ── GET STATUS ──
  if (action === 'get_status') {
    // Busca por email primeiro, depois por professional_id
    let subs = await base44.entities.TurboSubscription.filter({
      professional_email: user.email,
    }, '-created_date', 1);

    if (subs.length === 0 && professional_id) {
      subs = await base44.entities.TurboSubscription.filter({
        professional_id: professional_id,
      }, '-created_date', 1);
    }

    // Se não há registro local, busca diretamente no Stripe
    if (subs.length === 0) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        const stripeSubs = await stripe.subscriptions.list({
          customer: customers.data[0].id,
          limit: 5,
          status: 'all',
        });
        const validSub = stripeSubs.data.find(s =>
          s.status === 'active' || s.status === 'trialing' || s.status === 'past_due'
        );
        if (validSub) {
          const meta = validSub.metadata || {};
          const proId = professional_id || meta.professional_id || '';
          const newSub = await base44.asServiceRole.entities.TurboSubscription.create({
            professional_id: proId,
            professional_email: user.email,
            plan: meta.plan || 'monthly',
            status: 'active',
            stripe_subscription_id: validSub.id,
            stripe_customer_id: customers.data[0].id,
            current_period_end: new Date(validSub.current_period_end * 1000).toISOString().split('T')[0],
          });
          if (proId) {
            await base44.asServiceRole.entities.Professional.update(proId, { is_premium: true }).catch(() => {});
          }
          return Response.json({ active: true, subscription: newSub });
        }
      }
      return Response.json({ active: false });
    }

    const sub = subs[0];

    // Se há registro mas sem ID do Stripe, sincroniza com Stripe
    if (!sub.stripe_subscription_id) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        const stripeSubs = await stripe.subscriptions.list({
          customer: customers.data[0].id,
          limit: 5,
          status: 'all',
        });
        const validSub = stripeSubs.data.find(s =>
          s.status === 'active' || s.status === 'trialing'
        );
        if (validSub) {
          await base44.asServiceRole.entities.TurboSubscription.update(sub.id, {
            stripe_subscription_id: validSub.id,
            stripe_customer_id: customers.data[0].id,
            status: 'active',
            current_period_end: new Date(validSub.current_period_end * 1000).toISOString().split('T')[0],
          });
          sub.stripe_subscription_id = validSub.id;
          sub.status = 'active';
        }
      }
    }

    const isActive = sub.status === 'active' || sub.status === 'trial' || sub.status === 'cancelled';
    const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
    const expired = periodEnd && periodEnd < new Date();

    return Response.json({
      active: isActive && !expired,
      subscription: sub,
    });
  }

  return Response.json({ error: 'Ação inválida' }, { status: 400 });
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

// Prices (create these in your Stripe dashboard and update the IDs)
const PLANS = {
  weekly: {
    label: 'Turbo Semanal',
    price_cents: 1990,
    interval: 'week',
    trial_days: 3,
  },
  monthly: {
    label: 'Turbo Mensal',
    price_cents: 5990,
    interval: 'month',
    trial_days: 7,
  },
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, plan, subscription_id, professional_id } = await req.json();

  // ── CREATE CHECKOUT SESSION ──
  if (action === 'create_checkout') {
    const planData = PLANS[plan];
    if (!planData) return Response.json({ error: 'Plano inválido' }, { status: 400 });

    // Create price on the fly (or use pre-created price IDs from Stripe dashboard)
    const price = await stripe.prices.create({
      unit_amount: planData.price_cents,
      currency: 'brl',
      recurring: { interval: planData.interval },
      product_data: { name: `Turbo Serfy — ${planData.label}` },
    });

    const origin = req.headers.get('origin') || 'https://app.base44.com';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: price.id, quantity: 1 }],
      subscription_data: {
        trial_period_days: planData.trial_days,
        metadata: {
          professional_id,
          professional_email: user.email,
          plan,
        },
      },
      metadata: {
        professional_id,
        professional_email: user.email,
        plan,
      },
      success_url: `${origin}/professional/dashboard?turbo=success`,
      cancel_url: `${origin}/professional/dashboard?turbo=cancel`,
      customer_email: user.email,
    });

    return Response.json({ url: session.url });
  }

  // ── CANCEL SUBSCRIPTION ──
  if (action === 'cancel') {
    if (!subscription_id) return Response.json({ error: 'ID inválido' }, { status: 400 });

    await stripe.subscriptions.update(subscription_id, {
      cancel_at_period_end: true,
    });

    // Update DB
    const subs = await base44.asServiceRole.entities.TurboSubscription.filter({
      stripe_subscription_id: subscription_id,
    });
    if (subs.length > 0) {
      await base44.asServiceRole.entities.TurboSubscription.update(subs[0].id, {
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      });
    }

    return Response.json({ success: true });
  }

  // ── GET STATUS ──
  if (action === 'get_status') {
    const subs = await base44.entities.TurboSubscription.filter({
      professional_email: user.email,
    }, '-created_date', 1);

    if (subs.length === 0) return Response.json({ active: false });

    const sub = subs[0];
    const isActive = sub.status === 'active' || sub.status === 'trial';
    const now = new Date();
    const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
    const expired = periodEnd && periodEnd < now;

    return Response.json({
      active: isActive && !expired,
      subscription: sub,
    });
  }

  return Response.json({ error: 'Ação inválida' }, { status: 400 });
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  const getMetadata = (obj) => obj?.metadata || obj?.subscription?.metadata || {};

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const meta = session.metadata || {};
    const stripeSubId = session.subscription;

    if (!meta.professional_id || !stripeSubId) return Response.json({ received: true });

    // Fetch subscription details from Stripe
    const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
    const periodEnd = new Date(stripeSub.current_period_end * 1000).toISOString().split('T')[0];
    const isTrial = stripeSub.status === 'trialing';
    const trialEnd = stripeSub.trial_end
      ? new Date(stripeSub.trial_end * 1000).toISOString().split('T')[0]
      : null;

    // Cancel any existing active subs for this professional
    const existing = await base44.asServiceRole.entities.TurboSubscription.filter({
      professional_email: meta.professional_email,
      status: 'active',
    });
    for (const s of existing) {
      await base44.asServiceRole.entities.TurboSubscription.update(s.id, { status: 'expired' });
    }

    // Create new subscription record
    await base44.asServiceRole.entities.TurboSubscription.create({
      professional_id: meta.professional_id,
      professional_email: meta.professional_email,
      plan: meta.plan,
      status: isTrial ? 'trial' : 'active',
      stripe_subscription_id: stripeSubId,
      stripe_customer_id: stripeSub.customer,
      current_period_end: periodEnd,
      is_trial: isTrial,
      trial_end: trialEnd,
    });

    // Mark professional as premium
    await base44.asServiceRole.entities.Professional.update(meta.professional_id, {
      is_premium: true,
    });
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object;
    const meta = sub.metadata || {};
    const periodEnd = new Date(sub.current_period_end * 1000).toISOString().split('T')[0];
    const isActive = sub.status === 'active' || sub.status === 'trialing';

    const existing = await base44.asServiceRole.entities.TurboSubscription.filter({
      stripe_subscription_id: sub.id,
    });

    for (const s of existing) {
      await base44.asServiceRole.entities.TurboSubscription.update(s.id, {
        status: sub.status === 'trialing' ? 'trial' : sub.status === 'active' ? 'active' : 'cancelled',
        current_period_end: periodEnd,
      });
    }

    if (meta.professional_id) {
      await base44.asServiceRole.entities.Professional.update(meta.professional_id, {
        is_premium: isActive,
      });
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const meta = sub.metadata || {};

    const existing = await base44.asServiceRole.entities.TurboSubscription.filter({
      stripe_subscription_id: sub.id,
    });
    for (const s of existing) {
      await base44.asServiceRole.entities.TurboSubscription.update(s.id, {
        status: 'expired',
        cancelled_at: new Date().toISOString(),
      });
    }

    if (meta.professional_id) {
      await base44.asServiceRole.entities.Professional.update(meta.professional_id, {
        is_premium: false,
      });
    }
  }

  return Response.json({ received: true });
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const pros = await base44.entities.Professional.filter({ user_email: user.email });
    const pro = pros[0];
    if (!pro) return Response.json({ connected: false });

    if (!pro.stripe_account_id) return Response.json({ connected: false });

    const account = await stripe.accounts.retrieve(pro.stripe_account_id);
    return Response.json({
      connected: account.charges_enabled,
      details_submitted: account.details_submitted,
      account_id: pro.stripe_account_id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
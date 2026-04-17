import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { return_url } = await req.json();

    // Busca o profissional
    const pros = await base44.entities.Professional.filter({ user_email: user.email });
    const pro = pros[0];
    if (!pro) return Response.json({ error: 'Profissional não encontrado' }, { status: 404 });

    let accountId = pro.stripe_account_id;

    // Cria conta Connect se não existir
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'BR',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        settings: {
          payouts: { schedule: { interval: 'manual' } },
        },
      });
      accountId = account.id;
      await base44.entities.Professional.update(pro.id, { stripe_account_id: accountId });
    }

    // Verifica se já está onboardado
    const account = await stripe.accounts.retrieve(accountId);
    if (account.charges_enabled) {
      return Response.json({ already_onboarded: true });
    }

    // Cria link de onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: return_url,
      return_url: return_url,
      type: 'account_onboarding',
    });

    return Response.json({ url: accountLink.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
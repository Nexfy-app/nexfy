import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { professional_id, amount, description, service_request_id } = await req.json();

    if (!professional_id || !amount || amount <= 0) {
      return Response.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Busca o profissional
    const pros = await base44.asServiceRole.entities.Professional.filter({ id: professional_id });
    const pro = pros[0];
    if (!pro) return Response.json({ error: 'Profissional não encontrado' }, { status: 404 });
    if (!pro.stripe_account_id) {
      return Response.json({ error: 'Profissional não configurou pagamento Stripe ainda' }, { status: 400 });
    }

    // Verifica se conta está ativa
    const account = await stripe.accounts.retrieve(pro.stripe_account_id);
    if (!account.charges_enabled) {
      return Response.json({ error: 'Conta Stripe do profissional não está ativa' }, { status: 400 });
    }

    // Cria Payment Link via Stripe Checkout
    const amountCents = Math.round(amount * 100);
    const platformFeePercent = 0.05; // 5% de taxa da plataforma
    const platformFee = Math.round(amountCents * platformFeePercent);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: description || `Serviço com ${pro.name}`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: pro.stripe_account_id,
        },
      },
      metadata: {
        service_request_id: service_request_id || '',
        professional_id: professional_id,
        professional_name: pro.name,
      },
      success_url: `${req.headers.get('origin') || 'https://app.base44.com'}/requests?payment=success`,
      cancel_url: `${req.headers.get('origin') || 'https://app.base44.com'}/requests?payment=cancelled`,
    }, {
      stripeAccount: pro.stripe_account_id,
    });

    return Response.json({ payment_url: session.url, session_id: session.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
create extension if not exists pgcrypto;

create table if not exists public.b2b_wompi_payment_intents (
  id uuid primary key default gen_random_uuid(),

  reference text not null,
  cart_id text not null,

  amount_in_cents bigint not null,
  currency text not null default 'COP',

  status text not null default 'pending',
  commercial_payment_status text not null default 'pending',

  wompi_transaction_id text,
  wompi_status text,
  wompi_status_message text,
  payment_method_type text,
  customer_email text,

  order_id text,
  order_display_id text,

  processing_started_at timestamptz,
  confirmed_at timestamptz,
  processed_at timestamptz,

  last_error text,

  raw_json jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint b2b_wompi_payment_intents_reference_unique
    unique (reference),

  constraint b2b_wompi_payment_intents_amount_positive
    check (amount_in_cents > 0),

  constraint b2b_wompi_payment_intents_currency_not_empty
    check (length(trim(currency)) > 0),

  constraint b2b_wompi_payment_intents_status_valid
    check (
      status in (
        'pending',
        'processing',
        'approved',
        'declined',
        'voided',
        'error',
        'processed'
      )
    ),

  constraint b2b_wompi_payment_intents_commercial_status_valid
    check (
      commercial_payment_status in (
        'pending',
        'under_review',
        'paid',
        'rejected',
        'expired'
      )
    )
);

create unique index if not exists
  b2b_wompi_payment_intents_transaction_unique
on public.b2b_wompi_payment_intents (wompi_transaction_id)
where wompi_transaction_id is not null;

create unique index if not exists
  b2b_wompi_payment_intents_order_unique
on public.b2b_wompi_payment_intents (order_id)
where order_id is not null;

create index if not exists
  b2b_wompi_payment_intents_cart_id_idx
on public.b2b_wompi_payment_intents (cart_id);

create index if not exists
  b2b_wompi_payment_intents_status_idx
on public.b2b_wompi_payment_intents (status);

create index if not exists
  b2b_wompi_payment_intents_created_at_idx
on public.b2b_wompi_payment_intents (created_at desc);

create or replace function public.set_b2b_wompi_payment_intents_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists
  set_b2b_wompi_payment_intents_updated_at
on public.b2b_wompi_payment_intents;

create trigger set_b2b_wompi_payment_intents_updated_at
before update on public.b2b_wompi_payment_intents
for each row
execute function public.set_b2b_wompi_payment_intents_updated_at();

alter table public.b2b_wompi_payment_intents enable row level security;

comment on table public.b2b_wompi_payment_intents is
  'Registra intentos de pago Wompi y relaciona cada referencia con el carrito y la orden final de Medusa.';

comment on column public.b2b_wompi_payment_intents.reference is
  'Referencia única enviada a Wompi.';

comment on column public.b2b_wompi_payment_intents.cart_id is
  'Identificador del carrito de Medusa asociado al pago.';

comment on column public.b2b_wompi_payment_intents.amount_in_cents is
  'Valor exacto enviado a Wompi expresado en centavos.';

comment on column public.b2b_wompi_payment_intents.order_id is
  'Identificador de la orden creada en Medusa después de aprobar el pago.';

comment on column public.b2b_wompi_payment_intents.raw_json is
  'Información adicional del intento, la transacción de Wompi y el procesamiento.';
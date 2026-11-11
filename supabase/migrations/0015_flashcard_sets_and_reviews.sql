begin;

-- 1. Flashcard sets table
create table public.flashcard_sets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  source_kind text not null check (source_kind in ('module', 'topic')),
  material_id uuid,
  subject_id uuid not null,
  topic_id uuid not null,
  card_count integer not null default 0 check (card_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint flashcard_sets_id_owner_key unique (id, owner_id),
  constraint flashcard_sets_source_valid check ((source_kind = 'module') = (material_id is not null)),
  constraint flashcard_sets_material_owner_fkey foreign key (material_id, owner_id)
    references public.materials (id, owner_id) on delete cascade,
  constraint flashcard_sets_topic_owner_fkey foreign key (topic_id, subject_id, owner_id)
    references public.topics (id, subject_id, owner_id)
);

create index flashcard_sets_owner_created_idx on public.flashcard_sets (owner_id, created_at desc);
create index flashcard_sets_material_idx on public.flashcard_sets (material_id, owner_id);

-- 2. Individual flashcards table
create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null,
  owner_id uuid not null,
  card_order integer not null check (card_order > 0),
  term text not null check (length(btrim(term)) > 0),
  definition text not null check (length(btrim(definition)) > 0),
  source_excerpt text,
  created_at timestamptz not null default now(),
  constraint flashcards_set_owner_fkey foreign key (set_id, owner_id)
    references public.flashcard_sets (id, owner_id) on delete cascade,
  constraint flashcards_id_set_owner_key unique (id, set_id, owner_id),
  constraint flashcards_set_order_key unique (set_id, card_order)
);

create index flashcards_set_order_idx on public.flashcards (set_id, card_order);

-- 3. Flashcard reviews tracking table
create table public.flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null,
  owner_id uuid not null,
  completed_cards_count integer not null check (completed_cards_count > 0),
  total_cards_count integer not null check (total_cards_count > 0),
  completed_at timestamptz not null default now(),
  constraint flashcard_reviews_set_owner_fkey foreign key (set_id, owner_id)
    references public.flashcard_sets (id, owner_id) on delete cascade,
  constraint flashcard_reviews_full_check check (completed_cards_count = total_cards_count)
);

create index flashcard_reviews_owner_completed_idx on public.flashcard_reviews (owner_id, completed_at desc);

-- 4. Atomic publication function
create function public.publish_flashcard_set(
  p_owner_id uuid,
  p_title text,
  p_source_kind text,
  p_material_id uuid,
  p_subject_id uuid,
  p_topic_id uuid,
  p_cards jsonb
) returns uuid
language plpgsql set search_path = '' as $$
declare
  source_mat public.materials%rowtype;
  new_set_id uuid;
  card jsonb;
  position integer := 0;
  total_cards integer;
begin
  if p_source_kind not in ('module', 'topic') then
    raise exception 'INVALID_SOURCE_KIND';
  end if;
  if jsonb_typeof(p_cards) is distinct from 'array' then
    raise exception 'INVALID_CARDS_PAYLOAD';
  end if;
  total_cards := jsonb_array_length(p_cards);
  if total_cards < 1 or total_cards > 50 then
    raise exception 'INVALID_CARD_COUNT';
  end if;

  if p_source_kind = 'module' then
    if p_material_id is null then raise exception 'MATERIAL_REQUIRED'; end if;
    select * into source_mat from public.materials
      where id = p_material_id and owner_id = p_owner_id for share;
    if not found or source_mat.status <> 'ready' or source_mat.cleanup_pending then
      raise exception 'MODULE_NOT_READY';
    end if;
  end if;

  insert into public.flashcard_sets (
    owner_id, title, source_kind, material_id, subject_id, topic_id, card_count
  ) values (
    p_owner_id, btrim(p_title), p_source_kind, p_material_id, p_subject_id, p_topic_id, total_cards
  ) returning id into new_set_id;

  for card in select value from jsonb_array_elements(p_cards) loop
    position := position + 1;
    insert into public.flashcards (
      set_id, owner_id, card_order, term, definition, source_excerpt
    ) values (
      new_set_id,
      p_owner_id,
      position,
      btrim(card->>'term'),
      btrim(card->>'definition'),
      card->>'source_excerpt'
    );
  end loop;

  return new_set_id;
end;
$$;

-- 5. Atomic review recording function
create function public.record_flashcard_review(
  p_owner_id uuid,
  p_set_id uuid,
  p_viewed_card_count integer
) returns uuid
language plpgsql set search_path = '' as $$
declare
  target_set public.flashcard_sets%rowtype;
  review_id uuid;
begin
  select * into target_set from public.flashcard_sets
    where id = p_set_id and owner_id = p_owner_id for share;
  if not found then
    raise exception 'SET_NOT_FOUND';
  end if;

  if target_set.card_count <= 0 or p_viewed_card_count < target_set.card_count then
    raise exception 'INCOMPLETE_REVIEW';
  end if;

  insert into public.flashcard_reviews (
    set_id, owner_id, completed_cards_count, total_cards_count, completed_at
  ) values (
    p_set_id, p_owner_id, target_set.card_count, target_set.card_count, now()
  ) returning id into review_id;

  return review_id;
end;
$$;

-- 6. Row Level Security & Grants
alter table public.flashcard_sets enable row level security;
alter table public.flashcards enable row level security;
alter table public.flashcard_reviews enable row level security;

revoke all on table public.flashcard_sets, public.flashcards, public.flashcard_reviews from public, anon, authenticated;
grant select, insert, update, delete on table public.flashcard_sets, public.flashcards, public.flashcard_reviews to service_role;

revoke all on function public.publish_flashcard_set(uuid, text, text, uuid, uuid, uuid, jsonb),
  public.record_flashcard_review(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.publish_flashcard_set(uuid, text, text, uuid, uuid, uuid, jsonb),
  public.record_flashcard_review(uuid, uuid, integer) to service_role;

commit;

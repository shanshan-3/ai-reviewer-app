begin;

alter table public.materials
  add column if not exists cleanup_pending boolean not null default false;

create index if not exists materials_cleanup_pending_idx
  on public.materials (id) where cleanup_pending;

-- Reconcile imports from the former local-journal implementation during cutover.
update public.materials set cleanup_pending = true
  where status in ('processing', 'failed');

comment on column public.materials.cleanup_pending is
  'Server-owned import recovery marker; cleared after preview commit or remote cleanup.';

commit;

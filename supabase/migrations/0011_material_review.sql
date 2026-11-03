begin;

create function public.approve_material(
  p_owner_id uuid, p_material_id uuid, p_subject_id uuid, p_topic_id uuid, p_section_ids uuid[]
) returns void
language plpgsql
set search_path = ''
as $$
declare
  material public.materials%rowtype;
  selected_count integer;
  selected_text text;
begin
  select * into material from public.materials
    where id = p_material_id and owner_id = p_owner_id for update;
  if not found then raise exception 'MATERIAL_NOT_FOUND'; end if;
  if material.status not in ('needs_review', 'ready') or material.cleanup_pending then
    raise exception 'MATERIAL_NOT_REVIEWABLE';
  end if;

  if not exists (select 1 from public.subjects where id = p_subject_id and owner_id = p_owner_id)
    or not exists (select 1 from public.topics where id = p_topic_id
      and subject_id = p_subject_id and owner_id = p_owner_id) then
    raise exception 'INVALID_LABELS';
  end if;

  select count(*), string_agg(text, '') into selected_count, selected_text
    from public.material_sections where material_id = p_material_id and owner_id = p_owner_id
      and id = any(p_section_ids) and text ~ '[[:alnum:]]';
  if coalesce(cardinality(p_section_ids), 0) = 0
    or selected_count <> cardinality(p_section_ids)
    or char_length(regexp_replace(selected_text, '[^[:alnum:]]', '', 'g')) < 20 then
    raise exception 'INVALID_SECTIONS';
  end if;

  -- A retry after a lost response must not overwrite an already approved review.
  if material.status = 'ready' then
    if material.subject_id is distinct from p_subject_id or material.topic_id is distinct from p_topic_id
      or exists (select 1 from public.material_sections where material_id = p_material_id
        and owner_id = p_owner_id and eligible_for_generation is distinct from (id = any(p_section_ids))) then
      raise exception 'REVIEW_CONFLICT';
    end if;
    return;
  end if;

  update public.material_sections set eligible_for_generation = (id = any(p_section_ids))
    where material_id = p_material_id and owner_id = p_owner_id;
  update public.materials set subject_id = p_subject_id, topic_id = p_topic_id, status = 'ready'
    where id = p_material_id and owner_id = p_owner_id;
end;
$$;

revoke all on function public.approve_material(uuid, uuid, uuid, uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.approve_material(uuid, uuid, uuid, uuid, uuid[]) to service_role;

commit;

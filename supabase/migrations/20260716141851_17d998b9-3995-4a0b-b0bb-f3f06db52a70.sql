
ALTER TABLE public.case_tasks
  ADD COLUMN IF NOT EXISTS document_category text,
  ADD COLUMN IF NOT EXISTS linked_vault_document_id uuid REFERENCES public.vault_documents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS case_tasks_doc_category_idx
  ON public.case_tasks (document_category)
  WHERE document_category IS NOT NULL AND done = false;

CREATE OR REPLACE FUNCTION public.vault_autolink_case_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated int;
BEGIN
  UPDATE public.case_tasks t
     SET linked_vault_document_id = NEW.id,
         done = true,
         done_at = now(),
         status = 'done',
         progress_pct = 100,
         updated_at = now()
    FROM public.cases c
   WHERE t.case_id = c.id
     AND c.client_user_id = NEW.owner_user_id
     AND t.document_category = NEW.category
     AND t.done = false
     AND t.linked_vault_document_id IS NULL;

  GET DIAGNOSTICS updated = ROW_COUNT;

  IF updated > 0 THEN
    INSERT INTO public.notifications (user_id, kind, title, body, entity_type, entity_id, metadata)
    SELECT c.case_manager_user_id,
           'task_auto_completed',
           'Document received: ' || NEW.category,
           'A client upload closed ' || updated || ' pending document task(s).',
           'vault_document',
           NEW.id::text,
           jsonb_build_object('category', NEW.category, 'tasks_closed', updated)
      FROM public.cases c
     WHERE c.client_user_id = NEW.owner_user_id
       AND c.case_manager_user_id IS NOT NULL
     GROUP BY c.case_manager_user_id
     LIMIT 5;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vault_autolink_case_tasks_trg ON public.vault_documents;
CREATE TRIGGER vault_autolink_case_tasks_trg
  AFTER INSERT ON public.vault_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.vault_autolink_case_tasks();

CREATE OR REPLACE FUNCTION public.is_internal(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN (
        'admin','staff','case_manager',
        'insurance_admin','tax_admin','benefits_admin',
        'medical_admin','new_arrival_admin'
      )
  )
$function$;
-- Allow users to select their role at signup via raw_user_meta_data->>'role'
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  requested_role text;
  assigned_role public.app_role;
BEGIN
  INSERT INTO public.profiles(id, full_name, email, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email, NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.tourist_profiles(user_id, nationality)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'nationality')
  ON CONFLICT (user_id) DO NOTHING;

  requested_role := lower(COALESCE(NEW.raw_user_meta_data->>'role', ''));
  IF requested_role IN ('tourist', 'responder', 'admin') THEN
    assigned_role := requested_role::public.app_role;
  ELSIF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role='admin') THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'tourist';
  END IF;

  INSERT INTO public.user_roles(user_id, role)
  VALUES (NEW.id, assigned_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END $$;

-- Allow any authenticated user to switch their active portal role (Tourist / Responder / Admin)
CREATE OR REPLACE FUNCTION public.switch_my_role(_role public.app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = auth.uid();
  INSERT INTO public.user_roles(user_id, role) VALUES (auth.uid(), _role);
  PERFORM public.log_audit('role_switched', 'user', auth.uid()::text, jsonb_build_object('role', _role));
END $$;

GRANT EXECUTE ON FUNCTION public.switch_my_role(public.app_role) TO authenticated, service_role;

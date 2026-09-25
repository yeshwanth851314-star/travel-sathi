-- ============================================================================
-- Travel Sathi — 05_seed_data.sql
-- Initial Seed Data (Clearly Labelled Demo Content)
-- ============================================================================

INSERT INTO public.safety_information(title,category,content,source,is_verified,verified_at,review_date,is_published,is_demo) VALUES
('[DEMO] What to do if you lose your passport','Lost passport','1. Report the loss to local police and ask for a written report.\n2. Contact your embassy or consulate to request an emergency travel document.\n3. Keep digital copies of your passport photo page stored securely.','Demo content — replace with an official source',true,now(),current_date + 180,true,true),
('[DEMO] General travel safety basics','General travel safety','Keep valuables out of sight, share your itinerary with a trusted contact, and note the local emergency number before you travel.','Demo content — replace with an official source',true,now(),current_date + 180,true,true),
('[DEMO] Heat illness warning signs','Medical emergency','Dizziness, headache, nausea and confusion can indicate heat exhaustion. Move to shade, drink water and seek medical help if symptoms worsen.','Demo content — not yet verified',false,NULL,NULL,true,true);

INSERT INTO public.emergency_resources(name,type,phone,address,operating_hours,latitude,longitude,is_verified,is_demo) VALUES
('[DEMO] Central Police Station','Police','Demo — not a real number','Demo address, City Centre','24 hours',12.9763,77.5929,false,true),
('[DEMO] City General Hospital','Hospital','Demo — not a real number','Demo address, Hospital Road','24 hours',12.9592,77.5968,false,true),
('[DEMO] Fire Station No. 1','Fire','Demo — not a real number','Demo address, Station Road','24 hours',12.9850,77.6050,false,true),
('[DEMO] Tourist Help Centre','Tourist assistance center','Demo — not a real number','Demo address, Main Square','09:00–18:00',12.9716,77.5946,false,true);

INSERT INTO public.safety_alerts(title,message,severity,area,is_active,is_demo) VALUES
('[DEMO] Heavy rain expected','Demo alert: heavy rain is forecast this evening. Avoid low-lying areas.','medium','City Centre (demo)',true,true);

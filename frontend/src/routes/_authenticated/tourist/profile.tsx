import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Save, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useTouristProfile } from "@/lib/queries";
import { errMsg } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState, Loading, PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/_authenticated/tourist/profile")({
  component: TouristProfilePage,
});

function TouristProfilePage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: profile, isLoading: pLoading, error: pError } = useProfile(user.id);
  const { data: tProfile, isLoading: tLoading, error: tError } = useTouristProfile(user.id);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [homeCountry, setHomeCountry] = useState("");
  const [languages, setLanguages] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [travelNotes, setTravelNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  useEffect(() => {
    if (tProfile) {
      setNationality(tProfile.nationality ?? "");
      setHomeCountry(tProfile.home_country ?? "");
      setLanguages(tProfile.languages ?? "");
      setMedicalNotes(tProfile.medical_notes ?? "");
      setTravelNotes(tProfile.travel_notes ?? "");
    }
  }, [tProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error: uProfErr } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
        })
        .eq("id", user.id);
      if (uProfErr) throw uProfErr;

      const { error: uTourErr } = await supabase.from("tourist_profiles").upsert(
        {
          user_id: user.id,
          nationality: nationality.trim() || null,
          home_country: homeCountry.trim() || null,
          languages: languages.trim() || null,
          medical_notes: medicalNotes.trim() || null,
          travel_notes: travelNotes.trim() || null,
        },
        { onConflict: "user_id" },
      );
      if (uTourErr) throw uTourErr;

      await Promise.all([
        qc.invalidateQueries({ queryKey: ["profile", user.id] }),
        qc.invalidateQueries({ queryKey: ["tourist_profile", user.id] }),
      ]);
      toast.success("Profile and emergency details saved.");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  if (pLoading || tLoading) return <Loading />;
  if (pError || tError) return <ErrorState error={pError ?? tError} />;

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="My Tourist Profile"
        desc="Keep your contact, language, and medical information up to date so emergency responders can assist you faster."
      />

      <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 flex items-start gap-3 text-sm">
        <ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-foreground">Privacy & Emergency Access</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            Your medical notes, spoken languages, and travel details are securely stored and only
            shared with verified emergency responders when you trigger an SOS or submit an incident.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="rounded-xl border bg-card p-6 space-y-6 shadow-2xs">
        <div className="space-y-4">
          <h2 className="font-semibold text-base border-b pb-2">Personal & Contact Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-email">Account Email</Label>
              <Input id="p-email" value={user.email ?? ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Full Name</Label>
              <Input
                id="p-name"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-phone">Phone Number (with country code)</Label>
              <Input
                id="p-phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-lang">Preferred / Spoken Languages</Label>
              <Input
                id="p-lang"
                placeholder="e.g. English, Hindi, French"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-nat">Nationality</Label>
              <Input
                id="p-nat"
                placeholder="e.g. Indian, British, Japanese"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-home">Home Country</Label>
              <Input
                id="p-home"
                placeholder="e.g. India, United Kingdom, Japan"
                value={homeCountry}
                onChange={(e) => setHomeCountry(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold text-base border-b pb-2">
            Emergency Medical & Travel Information
          </h2>
          <div className="space-y-1.5">
            <Label htmlFor="p-med">
              Medical Notes (Allergies, Blood Type, Conditions, Medications)
            </Label>
            <Textarea
              id="p-med"
              rows={3}
              placeholder="e.g. Blood Group O+, Penicillin allergy, Type 1 Diabetes (carries insulin)"
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-travel">Current Hotel / Accommodation / Itinerary Notes</Label>
            <Textarea
              id="p-travel"
              rows={3}
              placeholder="e.g. Staying at Hotel Pearl Palace, Jaipur (Room 204) until Oct 12"
              value={travelNotes}
              onChange={(e) => setTravelNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-1.5" />
            {saving ? "Saving…" : "Save Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}

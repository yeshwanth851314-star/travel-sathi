import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Siren,
  MapPin,
  ShieldAlert,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getLocation } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { errMsg } from "@/lib/constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tourist/sos")({
  head: () => ({
    meta: [{ title: "Emergency SOS — Travel Sathi" }],
  }),
  component: TouristSosPage,
});

function TouristSosPage() {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);

  async function handleTriggerSos() {
    setBusy(true);
    setShowConfirm(false);
    setGeoStatus("Acquiring GPS coordinates…");

    try {
      const geo = await getLocation(8000);
      let lat: number | null = null;
      let lng: number | null = null;
      let accuracy: number | null = null;

      if (geo.ok) {
        lat = geo.latitude;
        lng = geo.longitude;
        accuracy = geo.accuracy;
        setGeoStatus("Coordinates acquired. Transmitting emergency alert…");
      } else {
        setGeoStatus("Proceeding without GPS…");
        toast.warning(geo.reason);
      }

      const { data, error } = await supabase.rpc("trigger_sos", {
        _lat: lat,
        _lng: lng,
        _accuracy: accuracy,
        _location_text: locationText.trim() || null,
        _description: description.trim() || null,
      });

      if (error) throw error;

      const res = data as { id?: string; existing?: boolean } | null;
      if (res?.existing) {
        toast.info("You already have an active SOS incident in progress.");
      } else {
        toast.error("EMERGENCY SOS BROADCASTED. Responders alerted!");
      }

      navigate({ to: "/tourist/emergency" });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
      setGeoStatus(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <Link
          to="/tourist"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-destructive/10 p-2.5 text-destructive">
            <Siren className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
              Emergency SOS Trigger
            </h1>
            <p className="text-sm text-muted-foreground">
              Use for life-threatening emergencies, serious injuries, or immediate danger.
            </p>
          </div>
        </div>
      </div>

      {/* Big Red SOS Button Container */}
      <div className="rounded-3xl border-2 border-destructive/40 bg-gradient-to-b from-destructive/15 via-card to-background p-8 sm:p-12 text-center shadow-lg space-y-6">
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute h-48 w-48 rounded-full bg-destructive/20 animate-ping" />
          <div className="absolute h-40 w-40 rounded-full bg-destructive/30" />
          <button
            type="button"
            disabled={busy}
            onClick={() => setShowConfirm(true)}
            className="relative h-36 w-36 rounded-full bg-destructive text-destructive-foreground font-black text-3xl shadow-2xl flex flex-col items-center justify-center gap-1 hover:scale-105 active:scale-95 transition-transform cursor-pointer focus:outline-none focus:ring-4 focus:ring-destructive/50 disabled:opacity-50"
            aria-label="Activate Emergency SOS"
          >
            <Siren className="h-10 w-10 animate-bounce" />
            <span>SOS</span>
          </button>
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <p className="text-base font-bold text-foreground">
            Tap button above to initiate critical dispatch
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            By activating SOS, your browser will request location permissions to transmit accurate
            GPS coordinates directly to tourist safety responders and emergency contacts.
          </p>
        </div>

        {busy && (
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-destructive animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{geoStatus || "Transmitting emergency signal…"}</span>
          </div>
        )}
      </div>

      {/* Optional Details (Can be filled before or left blank) */}
      <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Optional Quick Context</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          You can provide situational details now or trigger the SOS immediately without filling
          these in.
        </p>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="loc-text" className="text-xs font-medium">
              Landmark or Specific Location (e.g. Near Gate 3, Red Fort)
            </Label>
            <Input
              id="loc-text"
              placeholder="e.g. Hotel lobby, Terminal 2 near taxi stand"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              disabled={busy}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc-text" className="text-xs font-medium">
              Brief Situation Note (e.g. Medical emergency, severe pain)
            </Label>
            <Textarea
              id="desc-text"
              rows={2}
              placeholder="e.g. Medical assistance needed immediately for 1 person"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={busy}
            />
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle>Confirm Emergency SOS Dispatch</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-2 text-sm text-foreground">
              <span className="block">
                Are you sure you want to broadcast a <strong>critical emergency SOS</strong>?
              </span>
              <span className="block text-xs text-muted-foreground">
                This will instantly alert emergency response teams and your designated emergency
                contacts with your live location.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTriggerSos}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
              disabled={busy}
            >
              Yes, Trigger Emergency SOS
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

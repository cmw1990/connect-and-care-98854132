
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client"; 
import { Loader2 } from "lucide-react";
import { OverdueAlert } from "./components/OverdueAlert";  
import { ReminderSettings } from "./components/ReminderSettings";
import { UpcomingReminders } from "./components/UpcomingReminders";
import type { MedicationSchedule, MedicationPortalSettings } from "@/types/medication";

interface MedicationRemindersProps {
  groupId: string;
}

const fetchPortalSettings = async (groupId: string): Promise<MedicationPortalSettings> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      id: '',
      group_id: groupId,
      reminder_preferences: {
        preferred_channels: []
      },
      accessibility_settings: {
        voice_reminders: false
      }
    };
  }

  const { data, error } = await supabase
    .from('medication_portal_settings')
    .select('*')
    .eq('group_id', groupId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  
  if (!data) {
    return {
      id: '',
      group_id: groupId,
      reminder_preferences: {
        preferred_channels: []
      },
      accessibility_settings: {
        voice_reminders: false
      }
    };
  }

  return data as MedicationPortalSettings;
};

const fetchOverdueCount = async (groupId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('medication_logs')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId)
    .eq('status', 'overdue');

  if (error) throw error;
  return count ?? 0;
};

const fetchMedicationSchedules = async (groupId: string): Promise<MedicationSchedule[]> => {
  const { data, error } = await supabase
    .from('medication_schedules')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
};

export const MedicationReminders = ({ groupId }: MedicationRemindersProps) => {
  const portalSettingsQuery = useQuery({
    queryKey: ['portal-settings', groupId],
    queryFn: () => fetchPortalSettings(groupId)
  });

  const overdueQuery = useQuery({
    queryKey: ['overduemedications', groupId],
    queryFn: () => fetchOverdueCount(groupId),
    refetchInterval: 60000 // Refresh every minute
  });

  const schedulesQuery = useQuery({
    queryKey: ['medicationSchedules', groupId],
    queryFn: () => fetchMedicationSchedules(groupId)
  });

  if (portalSettingsQuery.error) {
    return (
      <div className="p-4 bg-destructive/10 rounded-lg text-destructive">
        Error loading settings: {portalSettingsQuery.error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {portalSettingsQuery.isLoading || overdueQuery.isLoading || schedulesQuery.isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <OverdueAlert overdueCount={overdueQuery.data ?? 0} />
          
          <div className="grid gap-4 md:grid-cols-2">
            <ReminderSettings 
              settings={portalSettingsQuery.data!} 
              groupId={groupId} 
            />
            <UpcomingReminders 
              schedules={schedulesQuery.data ?? []} 
            />
          </div>
        </>
      )}
    </div>
  );
};

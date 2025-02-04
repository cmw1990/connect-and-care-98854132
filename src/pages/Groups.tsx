import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users } from "lucide-react";
import { GroupsList } from "@/components/groups/GroupsList";
import { CareComparisonDialog } from "@/components/comparison/CareComparisonDialog";
import { CareAssistant } from "@/components/ai/CareAssistant";
import { CareTeamCalendar } from "@/components/calendar/CareTeamCalendar";
import { CareTeamPresence } from "@/components/groups/CareTeamPresence";
import { CareQualityMetrics } from "@/components/metrics/CareQualityMetrics";
import { CareUpdates } from "@/components/groups/CareUpdates";
import { WellnessTracker } from "@/components/wellness/WellnessTracker";
import type { CareGroup, GroupPrivacySettings } from "@/types/groups";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

const Groups = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [groups, setGroups] = useState<CareGroup[]>([]);
  const [myGroups, setMyGroups] = useState<CareGroup[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingGroup, setEditingGroup] = useState<CareGroup | null>(null);

  const fetchGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to view groups",
          variant: "destructive",
        });
        return;
      }

      // Fetch groups where user is a member
      const { data: memberGroups, error: memberError } = await supabase
        .from('care_groups')
        .select(`
          id,
          name,
          description,
          created_at,
          created_by,
          privacy_settings,
          care_group_members!inner (
            id,
            role
          )
        `)
        .eq('care_group_members.user_id', user.id);

      if (memberError) throw memberError;

      // Format member groups
      const formattedMemberGroups = memberGroups?.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description,
        created_at: group.created_at,
        member_count: group.care_group_members?.length || 0,
        is_owner: group.created_by === user.id,
        is_public: ((group.privacy_settings as unknown) as GroupPrivacySettings)?.visibility === 'public'
      })) || [];

      setMyGroups(formattedMemberGroups);

      // Fetch all public groups
      const { data: publicGroups, error: publicError } = await supabase
        .from('care_groups')
        .select(`
          id,
          name,
          description,
          created_at,
          privacy_settings,
          care_group_members (
            id
          )
        `)
        .eq('privacy_settings->>visibility', 'public');

      if (publicError) throw publicError;

      const formattedPublicGroups = publicGroups?.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description,
        created_at: group.created_at,
        member_count: group.care_group_members?.length || 0,
        is_public: true
      })) || [];

      setGroups(formattedPublicGroups);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Error",
        description: "Failed to load care groups. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleSubmit = useCallback(async () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (editingGroup) {
        const { error } = await supabase
          .from('care_groups')
          .update({
            name: newGroupName.trim(),
            description: newGroupDescription.trim(),
            privacy_settings: { visibility: isPublic ? 'public' : 'private' }
          })
          .eq('id', editingGroup.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Care group updated successfully",
        });
      } else {
        // Create new group
        const { data: group, error: groupError } = await supabase
          .from('care_groups')
          .insert({
            name: newGroupName.trim(),
            description: newGroupDescription.trim(),
            created_by: user.id,
            privacy_settings: { visibility: isPublic ? 'public' : 'private' }
          })
          .select()
          .single();

        if (groupError) throw groupError;

        // Add creator as member with admin role
        const { error: memberError } = await supabase
          .from('care_group_members')
          .insert({
            group_id: group.id,
            user_id: user.id,
            role: 'admin'
          });

        if (memberError) throw memberError;

        toast({
          title: "Success",
          description: "Care group created successfully",
        });
      }

      setNewGroupName("");
      setNewGroupDescription("");
      setIsPublic(false);
      setIsDialogOpen(false);
      setEditingGroup(null);
      await fetchGroups();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingGroup ? 'update' : 'create'} care group. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [newGroupName, newGroupDescription, isPublic, editingGroup, toast, fetchGroups]);

  const handleEdit = (group: CareGroup) => {
    setEditingGroup(group);
    setNewGroupName(group.name);
    setNewGroupDescription(group.description || '');
    setIsDialogOpen(true);
  };

  const handleDelete = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from('care_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
      
      await fetchGroups();
      
      toast({
        title: "Success",
        description: "Group deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: "Error",
        description: "Failed to delete care group",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-100 to-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-8 w-8 text-primary-600" />
              Care Groups
            </h1>
            <CareComparisonDialog />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingGroup(null);
              setNewGroupName("");
              setNewGroupDescription("");
              setIsPublic(false);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                <Plus className="mr-2 h-4 w-4" />
                New Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {editingGroup ? (
                    <>
                      <Edit className="h-5 w-5 text-primary-600" />
                      Edit Care Group
                    </>
                  ) : (
                    <>
                      <Users className="h-5 w-5 text-primary-600" />
                      Create New Care Group
                    </>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {editingGroup 
                    ? 'Update your care group details below.' 
                    : 'Create a new care group to collaborate with others.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Enter group name"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="Enter group description"
                    className="w-full"
                    rows={4}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="public"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                  />
                  <Label htmlFor="public">Make group public</Label>
                </div>
                <Button 
                  onClick={handleSubmit} 
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      {editingGroup ? "Updating..." : "Creating..."}
                    </div>
                  ) : (
                    editingGroup ? "Update Group" : "Create Group"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Tabs defaultValue="my-groups" className="w-full">
              <TabsList className="mb-4 bg-white shadow-sm">
                <TabsTrigger value="my-groups" className="data-[state=active]:bg-primary-100">
                  My Care Groups
                </TabsTrigger>
                <TabsTrigger value="all-groups" className="data-[state=active]:bg-primary-100">
                  Public Groups
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="my-groups">
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : myGroups.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12 bg-white rounded-lg shadow-sm"
                  >
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No groups yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new care group.</p>
                    <div className="mt-6">
                      <Button
                        onClick={() => setIsDialogOpen(true)}
                        className="bg-primary-600 hover:bg-primary-700 text-white"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Group
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {myGroups.map((group) => (
                      <div key={group.id} className="mb-8 animate-fade-in">
                        <GroupsList 
                          groups={[group]}
                          onDelete={handleDelete}
                          onEdit={handleEdit}
                        />
                        <div className="mt-4 space-y-4">
                          <CareTeamPresence groupId={group.id} />
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <CareUpdates groupId={group.id} />
                            <WellnessTracker groupId={group.id} />
                          </div>
                          <CareTeamCalendar groupId={group.id} />
                          <CareQualityMetrics groupId={group.id} />
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="all-groups">
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : groups.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12 bg-white rounded-lg shadow-sm"
                  >
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No public groups available</h3>
                    <p className="mt-1 text-sm text-gray-500">Create a new public group to get started.</p>
                  </motion.div>
                ) : (
                  <GroupsList 
                    groups={groups}
                    showActions={false}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
          <div className="hidden lg:block">
            <CareAssistant />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Groups;

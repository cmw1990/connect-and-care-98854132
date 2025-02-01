import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/navigation/navbar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users } from "lucide-react";
import { GroupsList } from "@/components/groups/GroupsList";
import { CareComparisonDialog } from "@/components/comparison/CareComparisonDialog";
import type { CareGroup } from "@/types/groups";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Groups = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [groups, setGroups] = useState<CareGroup[]>([]);
  const [myGroups, setMyGroups] = useState<CareGroup[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingGroup, setEditingGroup] = useState<CareGroup | null>(null);

  const fetchGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      // Fetch all groups where user is a member
      const { data: memberGroups, error: memberError } = await supabase
        .from('care_groups')
        .select(`
          id,
          name,
          description,
          created_at,
          created_by,
          care_group_members!care_group_members_group_id_fkey (
            id,
            role
          )
        `)
        .eq('care_group_members.user_id', userId);

      if (memberError) throw memberError;

      // Format member groups
      const formattedMemberGroups = memberGroups?.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description,
        created_at: group.created_at,
        member_count: group.care_group_members?.length || 0,
        is_owner: group.created_by === userId
      })) || [];

      setMyGroups(formattedMemberGroups);

      // Fetch all accessible groups
      const { data: allGroups, error: allError } = await supabase
        .from('care_groups')
        .select(`
          id,
          name,
          description,
          created_at,
          care_group_members!care_group_members_group_id_fkey (
            id
          )
        `);

      if (allError) throw allError;

      const formattedAllGroups = allGroups?.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description,
        created_at: group.created_at,
        member_count: group.care_group_members?.length || 0
      })) || [];

      setGroups(formattedAllGroups);
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
      
      if (editingGroup) {
        const { error } = await supabase
          .from('care_groups')
          .update({
            name: newGroupName.trim(),
            description: newGroupDescription.trim()
          })
          .eq('id', editingGroup.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Care group updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('care_groups')
          .insert({
            name: newGroupName.trim(),
            description: newGroupDescription.trim(),
            created_by: (await supabase.auth.getUser()).data.user?.id
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Care group created successfully",
        });
      }

      setNewGroupName("");
      setNewGroupDescription("");
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
  }, [newGroupName, newGroupDescription, editingGroup, toast, fetchGroups]);

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
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900">Care Groups</h1>
            <CareComparisonDialog />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingGroup(null);
              setNewGroupName("");
              setNewGroupDescription("");
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingGroup ? 'Edit Care Group' : 'Create New Care Group'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Enter group name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="Enter group description"
                  />
                </div>
                <Button 
                  onClick={handleSubmit} 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (editingGroup ? "Updating..." : "Creating...") : (editingGroup ? "Update Group" : "Create Group")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="my-groups" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="my-groups">My Care Groups</TabsTrigger>
            <TabsTrigger value="all-groups">All Groups</TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-groups">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : myGroups.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No groups yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new care group.</p>
              </div>
            ) : (
              <GroupsList 
                groups={myGroups}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            )}
          </TabsContent>
          
          <TabsContent value="all-groups">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No groups available</h3>
                <p className="mt-1 text-sm text-gray-500">Create a new care group to get started.</p>
              </div>
            ) : (
              <GroupsList 
                groups={groups}
                showActions={false}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Groups;
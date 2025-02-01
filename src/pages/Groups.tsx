import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import { Plus } from "lucide-react";
import { CareComparison } from "@/components/comparison/CareComparison";
import { GroupsList } from "@/components/groups/GroupsList";
import type { CareGroup } from "@/types/groups";

const Groups = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [groups, setGroups] = useState<CareGroup[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Fetch groups with a simpler query first
      const { data: groupsData, error: groupsError } = await supabase
        .from('care_groups')
        .select(`
          id,
          name,
          description,
          created_at
        `);

      if (groupsError) {
        console.error('Error fetching groups:', groupsError);
        throw groupsError;
      }

      if (!groupsData) {
        setGroups([]);
        return;
      }

      // Then get member counts in a separate query
      const groupsWithCount = await Promise.all(
        groupsData.map(async (group) => {
          try {
            const { count, error: countError } = await supabase
              .from('care_group_members')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', group.id);

            if (countError) {
              console.error('Error fetching member count:', countError);
              return { ...group, member_count: 0 };
            }

            return {
              ...group,
              member_count: count || 0
            };
          } catch (error) {
            console.error('Error processing group:', error);
            return { ...group, member_count: 0 };
          }
        })
      );

      setGroups(groupsWithCount);
    } catch (error) {
      console.error('Error in fetchGroups:', error);
      toast({
        title: "Error",
        description: "Failed to load care groups. Please try again.",
        variant: "destructive",
      });
    }
  }, [navigate, toast]);

  const createGroup = useCallback(async () => {
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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Create the group
      const { data: newGroup, error: groupError } = await supabase
        .from('care_groups')
        .insert([
          {
            name: newGroupName.trim(),
            description: newGroupDescription.trim(),
            created_by: session.user.id,
          }
        ])
        .select()
        .single();

      if (groupError) {
        console.error('Error creating group:', groupError);
        throw groupError;
      }

      if (!newGroup) {
        throw new Error('No group data returned after creation');
      }

      // Add the creator as an admin member
      const { error: memberError } = await supabase
        .from('care_group_members')
        .insert([
          {
            group_id: newGroup.id,
            user_id: session.user.id,
            role: 'admin'
          }
        ]);

      if (memberError) {
        console.error('Error adding member:', memberError);
        throw memberError;
      }

      setNewGroupName("");
      setNewGroupDescription("");
      setIsDialogOpen(false);
      await fetchGroups();
      
      toast({
        title: "Success",
        description: "Care group created successfully",
      });
    } catch (error) {
      console.error('Error in createGroup:', error);
      toast({
        title: "Error",
        description: "Failed to create care group. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [newGroupName, newGroupDescription, navigate, toast, fetchGroups]);

  useEffect(() => {
    fetchGroups();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'care_groups'
        },
        () => {
          fetchGroups();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchGroups]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-100 to-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Care Groups</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Care Group</DialogTitle>
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
                  onClick={createGroup} 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating..." : "Create Group"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <GroupsList groups={groups} />

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Care Comparison</h2>
          <CareComparison />
        </div>
      </main>
    </div>
  );
};

export default Groups;
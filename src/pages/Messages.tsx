import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  type: string;
}

interface Discussion {
  id: string;
  content: string;
  created_at: string;
  group_name?: string;
  created_by_name?: string;
}

export default function Messages() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
    fetchDiscussions();
    subscribeToNotifications();
  }, []);

  const subscribeToNotifications = () => {
    // Subscribe to group posts
    const channel = supabase
      .channel('public:group_posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_posts'
        },
        (payload) => {
          toast({
            title: "New Group Post",
            description: "Someone posted in your care group",
          });
          fetchDiscussions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchNotifications = async () => {
    try {
      // In a real app, you would fetch notifications from your backend
      const dummyNotifications = [
        {
          id: "1",
          title: "New Task Assigned",
          message: "You have been assigned a new task in Family Care Group",
          created_at: new Date().toISOString(),
          type: "task",
        },
        {
          id: "2",
          title: "Medication Reminder",
          message: "Time to take morning medications",
          created_at: new Date().toISOString(),
          type: "medication",
        },
      ];
      setNotifications(dummyNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    }
  };

  const fetchDiscussions = async () => {
    try {
      const { data: groupPosts, error } = await supabase
        .from("group_posts")
        .select(`
          id,
          content,
          created_at,
          care_groups(name),
          profiles(first_name, last_name)
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedDiscussions = groupPosts.map((post: any) => ({
        id: post.id,
        content: post.content,
        created_at: post.created_at,
        group_name: post.care_groups?.name || "Unknown Group",
        created_by_name: post.profiles
          ? `${post.profiles.first_name || ""} ${post.profiles.last_name || ""}`
          : "Unknown User",
      }));

      setDiscussions(formattedDiscussions);
    } catch (error) {
      console.error("Error fetching discussions:", error);
      toast({
        title: "Error",
        description: "Failed to load discussions",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Tabs defaultValue="notifications" className="w-full h-full">
        <TabsList className="fixed top-0 left-0 right-0 z-10 grid w-full grid-cols-2 bg-white border-b">
          <TabsTrigger value="notifications" className="p-4">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="discussions" className="p-4">
            <MessageSquare className="h-4 w-4 mr-2" />
            Discussions
          </TabsTrigger>
        </TabsList>
        <div className="pt-16 pb-20">
          <TabsContent value="notifications" className="m-0">
            <div className="space-y-2 p-4">
              {notifications.map((notification) => (
                <Card key={notification.id} className="shadow-sm">
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-medium">{notification.title}</h3>
                    <p className="text-sm text-gray-600">
                      {notification.message}
                    </p>
                    <span className="text-xs text-gray-400">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="discussions" className="m-0">
            <div className="space-y-2 p-4">
              {discussions.map((discussion) => (
                <Card key={discussion.id} className="shadow-sm">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium">
                        {discussion.created_by_name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {discussion.group_name}
                      </span>
                    </div>
                    <p className="text-sm">{discussion.content}</p>
                    <span className="text-xs text-gray-400">
                      {new Date(discussion.created_at).toLocaleDateString()}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
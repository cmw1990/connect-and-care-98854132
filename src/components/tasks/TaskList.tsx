import { Button } from "@/components/ui/button";
import { Check, Clock, Tag, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Task {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  status: string;
  priority: string;
  tags?: string[];
  recurring?: boolean;
  recurrence_pattern?: { type: string } | null;
  reminder_time?: string;
}

interface TaskListProps {
  tasks: Task[] | undefined;
  onTaskUpdated: () => void;
}

export const TaskList = ({ tasks, onTaskUpdated }: TaskListProps) => {
  const { toast } = useToast();

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Task marked as ${newStatus}`,
      });

      onTaskUpdated();
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const formatReminderTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  return (
    <div className="space-y-2">
      {tasks?.map((task) => (
        <div 
          key={task.id}
          className="flex flex-col p-4 bg-gray-50 rounded-md space-y-2"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{task.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
              {task.description && (
                <p className="text-sm text-gray-600">{task.description}</p>
              )}
              <p className="text-sm text-gray-600">
                Due: {new Date(task.due_date).toLocaleDateString()}
              </p>
              {task.reminder_time && (
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Reminder: {formatReminderTime(task.reminder_time)}
                </p>
              )}
            </div>
            {task.status === 'pending' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600"
                  onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600"
                  onClick={() => handleUpdateTaskStatus(task.id, 'cancelled')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {task.status !== 'pending' && (
              <span className={`text-sm ${
                task.status === 'completed' ? 'text-green-600' : 'text-red-600'
              }`}>
                {task.status}
              </span>
            )}
          </div>
          
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {task.tags.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md"
                >
                  <Tag className="h-3 w-3" />
                  <span className="text-sm">{tag}</span>
                </div>
              ))}
            </div>
          )}
          
          {task.recurring && task.recurrence_pattern?.type && (
            <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full self-start">
              Recurring ({task.recurrence_pattern.type})
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, Clock, AlertCircle, Circle, Trash2, Edit, User } from 'lucide-react';
import { getTasksForQuote, getTaskStats, deleteTask, updateTask } from '../../lib/supabase';
import { TaskModal } from './TaskModal';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
}

interface TaskManagerProps {
  quoteId: string;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ quoteId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0
  });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'overdue'>('all');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  useEffect(() => {
    if (quoteId) {
      fetchTasks();
      fetchStats();
    }
  }, [quoteId]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await getTasksForQuote(quoteId);
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getTaskStats(quoteId);
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch task stats:', error);
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      await deleteTask(taskToDelete.id);
      await fetchTasks();
      await fetchStats();
      setTaskToDelete(null);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      await updateTask(taskId, { status: newStatus });
      await fetchTasks();
      await fetchStats();
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleTaskModalClose = async (refresh: boolean) => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
    if (refresh) {
      await fetchTasks();
      await fetchStats();
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'pending':
        return <Circle className="h-5 w-5 text-gray-400" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    }
  };

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'completed' || task.status === 'cancelled') {
      return false;
    }
    return new Date(task.due_date) < new Date();
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'overdue') return isOverdue(task);
    return task.status === filter;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tasks
        </h3>
        <button
          onClick={handleCreateTask}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-lg border-2 transition-colors ${
            filter === 'all'
              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</div>
        </button>

        <button
          onClick={() => setFilter('pending')}
          className={`p-4 rounded-lg border-2 transition-colors ${
            filter === 'pending'
              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="text-2xl font-bold text-gray-500 dark:text-gray-400">{stats.pending}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
        </button>

        <button
          onClick={() => setFilter('in_progress')}
          className={`p-4 rounded-lg border-2 transition-colors ${
            filter === 'in_progress'
              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.in_progress}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">In Progress</div>
        </button>

        <button
          onClick={() => setFilter('completed')}
          className={`p-4 rounded-lg border-2 transition-colors ${
            filter === 'completed'
              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
        </button>

        <button
          onClick={() => setFilter('overdue')}
          className={`p-4 rounded-lg border-2 transition-colors ${
            filter === 'overdue'
              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Overdue</div>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {filter === 'all' ? 'No tasks yet' : `No ${filter.replace('_', ' ')} tasks`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-lg border-2 transition-colors ${
                isOverdue(task)
                  ? 'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="mt-1">
                    {getStatusIcon(task.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {task.title}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {isOverdue(task) && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                          Overdue
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      {task.assigned_to_name && (
                        <span className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{task.assigned_to_name}</span>
                        </span>
                      )}
                      {task.due_date && (
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        </span>
                      )}
                      <span>Created by {task.created_by_name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {task.status !== 'completed' && task.status !== 'cancelled' && (
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value as Task['status'])}
                      className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Complete</option>
                      <option value="cancelled">Cancel</option>
                    </select>
                  )}
                  <button
                    onClick={() => handleEditTask(task)}
                    className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setTaskToDelete(task)}
                    className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isTaskModalOpen && (
        <TaskModal
          quoteId={quoteId}
          task={editingTask}
          onClose={handleTaskModalClose}
        />
      )}

      <DeleteConfirmationModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message={`Are you sure you want to delete the task "${taskToDelete?.title}"? This action cannot be undone.`}
      />
    </div>
  );
};

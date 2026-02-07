import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserWithDetails {
  id: string;
  phone: string;
  first_name: string;
  last_name: string;
  school_name: string | null;
  grade: number | null;
  status: string;
  created_at: string;
  roles: string[];
  enrolled_classes: number;
}

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async (): Promise<UserWithDetails[]> => {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Fetch enrollment counts
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('class_enrollments')
        .select('user_id')
        .eq('status', 'ACTIVE');

      if (enrollmentsError) throw enrollmentsError;

      // Create a map of user_id to roles
      const rolesMap = new Map<string, string[]>();
      roles?.forEach(r => {
        const existing = rolesMap.get(r.user_id) || [];
        existing.push(r.role);
        rolesMap.set(r.user_id, existing);
      });

      // Create a map of user_id to enrollment count
      const enrollmentCountMap = new Map<string, number>();
      enrollments?.forEach(e => {
        enrollmentCountMap.set(e.user_id, (enrollmentCountMap.get(e.user_id) || 0) + 1);
      });

      // Combine data
      return (profiles || []).map(profile => ({
        id: profile.id,
        phone: profile.phone,
        first_name: profile.first_name,
        last_name: profile.last_name,
        school_name: profile.school_name,
        grade: profile.grade,
        status: profile.status,
        created_at: profile.created_at,
        roles: rolesMap.get(profile.id) || ['student'],
        enrolled_classes: enrollmentCountMap.get(profile.id) || 0,
      }));
    },
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user status');
    },
  });
};

export const useAddModeratorRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Check if already has moderator role
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', 'moderator')
        .maybeSingle();

      if (existing) {
        throw new Error('User already has moderator role');
      }

      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'moderator' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Moderator role added successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add moderator role');
    },
  });
};

export const useRemoveModeratorRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'moderator');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Moderator role removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove moderator role');
    },
  });
};

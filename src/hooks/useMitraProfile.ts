
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MitraProfile {
  id: string;
  user_id: string;
  name: string;
  address: string;
  whatsapp: string;
  email: string;
  work_location: string;
  ktp_url?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export const useMitraProfile = () => {
  const [profile, setProfile] = useState<MitraProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('mitra_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching mitra profile:', error);
        return;
      }

      if (data) {
        // Type assertion to ensure status is properly typed
        const typedProfile: MitraProfile = {
          ...data,
          status: data.status as 'pending' | 'accepted' | 'rejected'
        };
        setProfile(typedProfile);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (profileData: Omit<MitraProfile, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'status'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Anda harus login terlebih dahulu",
          variant: "destructive"
        });
        return null;
      }

      const { data, error } = await supabase
        .from('mitra_profiles')
        .insert([{ ...profileData, user_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error('Error creating mitra profile:', error);
        toast({
          title: "Error",
          description: "Gagal membuat profil mitra",
          variant: "destructive"
        });
        return null;
      }

      if (data) {
        // Type assertion to ensure status is properly typed
        const typedProfile: MitraProfile = {
          ...data,
          status: data.status as 'pending' | 'accepted' | 'rejected'
        };
        setProfile(typedProfile);
        return typedProfile;
      }
      return null;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  const getAllProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('mitra_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all mitra profiles:', error);
        return [];
      }

      if (data) {
        // Type assertion for all profiles
        const typedProfiles: MitraProfile[] = data.map(profile => ({
          ...profile,
          status: profile.status as 'pending' | 'accepted' | 'rejected'
        }));
        return typedProfiles;
      }

      return [];
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  };

  const updateProfileStatus = async (profileId: string, status: 'pending' | 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('mitra_profiles')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', profileId);

      if (error) {
        console.error('Error updating profile status:', error);
        toast({
          title: "Error",
          description: "Gagal memperbarui status mitra",
          variant: "destructive"
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    createProfile,
    getAllProfiles,
    updateProfileStatus,
    refetch: fetchProfile
  };
};

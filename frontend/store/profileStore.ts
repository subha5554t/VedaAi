import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProfileState {
  name: string;
  email: string;
  school: string;
  city: string;
  setProfile: (data: Partial<Omit<ProfileState, 'setProfile'>>) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      name: 'John Doe',
      email: 'john@dps.edu.in',
      school: 'Delhi Public School',
      city: 'Bokaro Steel City',
      setProfile: (data) => set((state) => ({ ...state, ...data })),
    }),
    {
      name: 'vedaai-profile',
    }
  )
);
'use client';

import React, { useEffect, useState } from 'react';
import WorkspaceLayout from '../../../components/WorkspaceLayout';
import ProfileAvatar from '../../../components/ProfileAvatar';
import ImageUpload from '../../../components/ImageUpload';
import ProfileForm from '../../../components/ProfileForm';
import ThemeToggle from '../../../components/ThemeToggle';
import { useAuth } from '../../../context/authContext';
import { useToast } from '../../../context/toastContext';
import {
  getUserProfileApi,
  updateUserProfileApi,
  uploadProfileImageApi,
  removeProfileImageApi,
} from '../../../services/api';
import { Shield, Star, CheckCircle, Mail, Calendar, Sparkles, RefreshCw, Key } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState<boolean>(true);
  const [profileData, setProfileData] = useState<any>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getUserProfileApi();
      if (res.success) {
        setProfileData(res.user);
      }
    } catch (err: any) {
      console.error('Fetch profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (name: string, bio: string) => {
    const res = await updateUserProfileApi(name, bio);
    if (res.success) {
      setProfileData(res.user);
      await refreshUser();
    }
  };

  const handleUploadImage = async (base64Image: string) => {
    const res = await uploadProfileImageApi(base64Image);
    if (res.success) {
      setProfileData(res.user);
      await refreshUser();
    }
  };

  const handleRemoveImage = async () => {
    const res = await removeProfileImageApi();
    if (res.success) {
      setProfileData(res.user);
      await refreshUser();
    }
  };

  const activeUser = profileData || user;

  const getPlanBadge = () => {
    if (!activeUser) return null;
    if (activeUser.role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/40 text-amber-400 border border-amber-900/40">
          <Shield className="w-3.5 h-3.5 fill-current" /> Admin Account
        </span>
      );
    }
    if (activeUser.premiumAccess) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-indigo-400 border border-indigo-500/30">
          <Star className="w-3.5 h-3.5 fill-current" /> Premium Member
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-900 text-neutral-400 border border-neutral-800">
        <CheckCircle className="w-3.5 h-3.5" /> Free Plan
      </span>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Member';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (_) {
      return 'Member';
    }
  };

  return (
    <WorkspaceLayout>
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900/80 pb-6">
          <div>
            <h1 className="text-2xl font-black text-neutral-100 tracking-tight flex items-center gap-3">
              User Profile
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Manage your personal information, profile photo, and account preferences.
            </p>
          </div>
          <ThemeToggle />
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-16 text-neutral-500 gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
            <span className="text-sm font-medium">Loading profile details...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Profile Card & Quick Info */}
            <div className="md:col-span-1 flex flex-col gap-6">
              {/* Profile Card */}
              <div className="p-6 rounded-2xl bg-neutral-950/80 border border-neutral-900/80 flex flex-col items-center text-center gap-4 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-r from-indigo-900/30 via-violet-900/20 to-purple-900/30 -z-0" />

                <div className="mt-4 z-10">
                  <ProfileAvatar
                    name={activeUser?.name || 'User'}
                    email={activeUser?.email || ''}
                    imageUrl={activeUser?.profileImageUrl || activeUser?.profileImage}
                    role={activeUser?.role}
                    premiumAccess={activeUser?.premiumAccess}
                    size="xl"
                  />
                </div>

                <div className="flex flex-col items-center gap-1 z-10 w-full">
                  <h2 className="text-lg font-bold text-neutral-100 truncate max-w-full">
                    {activeUser?.name}
                  </h2>
                  <span className="text-xs text-neutral-500 truncate max-w-full flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {activeUser?.email}
                  </span>
                  <div className="mt-3">{getPlanBadge()}</div>
                </div>

                {activeUser?.bio && (
                  <p className="text-xs text-neutral-400 italic bg-neutral-900/60 p-3 rounded-xl border border-neutral-800/60 w-full text-left font-normal mt-2">
                    "{activeUser.bio}"
                  </p>
                )}
              </div>

              {/* Account Stats / Details */}
              <div className="p-5 rounded-2xl bg-neutral-950/70 border border-neutral-900/80 flex flex-col gap-3">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Account Details
                </h3>

                <div className="flex items-center justify-between text-xs py-1 border-b border-neutral-900">
                  <span className="text-neutral-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Joined
                  </span>
                  <span className="text-neutral-300 font-semibold">
                    {formatDate(activeUser?.createdAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1 border-b border-neutral-900">
                  <span className="text-neutral-500">Account Type</span>
                  <span className="text-neutral-300 font-semibold capitalize">
                    {activeUser?.role || 'User'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-neutral-500">Credits Status</span>
                  <span className="text-neutral-300 font-semibold">
                    {activeUser?.premiumAccess
                      ? 'Unlimited'
                      : `${activeUser?.usedCredits || 0} / ${activeUser?.freeCredits || 100}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Image Upload & Edit Profile Form */}
            <div className="md:col-span-2 flex flex-col gap-6">
              {/* Profile Image Management */}
              <ImageUpload
                currentImageUrl={activeUser?.profileImageUrl || activeUser?.profileImage}
                onUpload={handleUploadImage}
                onRemove={handleRemoveImage}
              />

              {/* Personal Information Form */}
              <ProfileForm
                initialName={activeUser?.name || ''}
                initialBio={activeUser?.bio || ''}
                onSave={handleSaveProfile}
              />
            </div>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  );
}

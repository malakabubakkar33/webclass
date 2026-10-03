import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { api } from '../../services/api.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Avatar } from '../../components/ui/Avatar.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { LogoutModal } from '../../components/ui/LogoutModal.js';
import { Edit2, Lock, LogOut, Camera, ShieldCheck, Mail, Phone, Briefcase, Upload, Loader2 } from 'lucide-react';

export const TeacherProfilePage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const { success, error } = useToast();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  // Edit state
  const [fullName, setFullName] = useState(user?.fullName || 'Prof. Alex Vance');
  const [mobileNumber, setMobileNumber] = useState(user?.mobileNumber || '+1 (555) 019-2834');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [bio, setBio] = useState('Lead Full-Stack Web Development Architect & Classroom Instructor with 12+ years of production experience.');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Synchronize local form and preview state with authenticated user state
  React.useEffect(() => {
    if (user) {
      if (user.fullName) setFullName(user.fullName);
      if (user.mobileNumber) setMobileNumber(user.mobileNumber);
      if (user.avatarUrl) setAvatarUrl(user.avatarUrl);
    }
  }, [user]);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateProfile({ fullName, mobileNumber, avatarUrl, bio });
      await refreshUser();
      success('Instructor profile updated successfully');
      setIsEditOpen(false);
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      error('New passwords do not match');
      return;
    }
    setIsChangingPass(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      success('Admin password updated successfully');
      setIsPasswordOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Password change failed');
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Teacher & Admin Profile
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 mt-1">
            Sole instructor profile and administrative security credentials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              setFullName(user?.fullName || '');
              setMobileNumber(user?.mobileNumber || '');
              setAvatarUrl(user?.avatarUrl || '');
              setIsEditOpen(true);
            }}
            variant="outline"
            size="sm"
            leftIcon={<Edit2 className="w-4 h-4" />}
          >
            Edit Profile
          </Button>
          <Button
            onClick={() => setIsPasswordOpen(true)}
            variant="outline"
            size="sm"
            leftIcon={<Lock className="w-4 h-4" />}
          >
            Change Password
          </Button>
        </div>
      </div>

      {/* Main Profile Card */}
      <Card className="p-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-8 border-b border-slate-100">
          <div className="relative">
            <Avatar
              src={user?.avatarUrl}
              name={user?.fullName || 'Teacher'}
              size="xl"
              className="ring-4 ring-secondary-100 shadow-md w-24 h-24 text-2xl"
            />
            <label
              className="absolute bottom-0 right-0 p-2 bg-secondary-600 text-white rounded-full shadow-sm hover:bg-secondary-700 transition cursor-pointer"
              title="Upload new photo from device"
            >
              {isUploadingPhoto ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              <input
                type="file"
                accept="image/*"
                disabled={isUploadingPhoto}
                className="hidden"
                onChange={async (e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setIsUploadingPhoto(true);
                    try {
                      const uploadData = new FormData();
                      uploadData.append('avatar', file);
                      const res = await api.uploadAvatar(uploadData);
                      if (res.data?.success && res.data.data?.avatarUrl) {
                        const newAvatar = res.data.data.avatarUrl;
                        await api.updateProfile({ avatarUrl: newAvatar });
                        await refreshUser();
                        setAvatarUrl(newAvatar);
                        success('Teacher photo updated successfully from device!');
                      }
                    } catch (err: any) {
                      error(err.response?.data?.message || 'Failed to upload photo');
                    } finally {
                      setIsUploadingPhoto(false);
                    }
                  }
                }}
              />
            </label>
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-2xl font-extrabold text-navy-900 tracking-tight">
                {user?.fullName}
              </h2>
              <Badge variant="purple" size="sm">Admin & Teacher</Badge>
            </div>
            <p className="text-xs text-navy-500 font-medium">@{user?.username} • Sole Class Instructor</p>
            <p className="text-xs text-navy-600 italic mt-2 max-w-xl">
              "{bio}"
            </p>
          </div>
        </div>

        {/* Detailed Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Teacher Name</p>
            <p className="text-sm font-semibold text-navy-900 mt-1">{user?.fullName}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Admin Username</p>
            <p className="text-sm font-semibold text-navy-900 mt-1">{user?.username}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
            <p className="text-sm font-semibold text-navy-900 mt-1">{user?.email}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Class Cohort</p>
            <p className="text-sm font-semibold text-navy-900 mt-1">Full-Stack Web Development</p>
          </div>
        </div>

        {/* Logout */}
        <div className="pt-6 border-t border-slate-100 flex justify-end">
          <Button
            onClick={() => setIsLogoutOpen(true)}
            variant="danger"
            size="sm"
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out of Teacher Portal
          </Button>
        </div>
      </Card>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Instructor Details"
        description="Update your name, bio, or upload your photo from device."
        maxWidth="md"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Teacher Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Mobile Number"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
          />

          {/* Device Profile Photo Upload */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-semibold text-navy-700 uppercase tracking-wide">
              Teacher Photo (Upload from Device)
            </label>
            <div className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <Avatar
                src={avatarUrl}
                name={fullName || 'Teacher'}
                size="lg"
                className="w-14 h-14 ring-2 ring-secondary-100 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-navy-900">Select Image from Device</p>
                <p className="text-[11px] text-slate-500 truncate">JPEG, PNG, WebP up to 10MB</p>
                <div className="mt-2">
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-secondary-500 text-secondary-600 text-xs font-semibold rounded-lg shadow-2xs cursor-pointer hover:bg-secondary-50/50 transition">
                    {isUploadingPhoto ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Choose Photo</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingPhoto}
                      className="hidden"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setIsUploadingPhoto(true);
                          try {
                            const uploadData = new FormData();
                            uploadData.append('avatar', file);
                            const res = await api.uploadAvatar(uploadData);
                            if (res.data?.success && res.data.data?.avatarUrl) {
                              setAvatarUrl(res.data.data.avatarUrl);
                              success('Device photo uploaded');
                            }
                          } catch (err: any) {
                            error(err.response?.data?.message || 'Failed to upload photo');
                          } finally {
                            setIsUploadingPhoto(false);
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-navy-700 uppercase tracking-wide">
              Instructor Bio
            </label>
            <textarea
              rows={3}
              className="w-full bg-white text-navy-900 text-sm rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:border-secondary-600"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving || isUploadingPhoto}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordOpen}
        onClose={() => setIsPasswordOpen(false)}
        title="Change Admin Password"
        description="Update your credentials for the teacher dashboard."
        maxWidth="sm"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsPasswordOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isChangingPass}>
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

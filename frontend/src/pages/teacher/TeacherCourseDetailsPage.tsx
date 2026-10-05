import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import {
  Folder,
  FolderOpen,
  Plus,
  Upload,
  Video,
  Edit,
  Trash2,
  ArrowLeft,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronRight,
  FileVideo,
  CheckCircle2,
  HardDrive,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  isGoogleDriveUrl,
  extractGoogleDriveFileId,
  openVideoInGoogleDrive,
} from '../../utils/driveUtils.js';

export const TeacherCourseDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [courseData, setCourseData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openTopicIds, setOpenTopicIds] = useState<Set<string>>(new Set());

  // Topic Modals
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [topicTitle, setTopicTitle] = useState('');
  const [topicDescription, setTopicDescription] = useState('');

  const [isEditTopicOpen, setIsEditTopicOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<any>(null);

  const [isDeleteTopicOpen, setIsDeleteTopicOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<any>(null);

  // Video Upload Modal
  const [isUploadVideoOpen, setIsUploadVideoOpen] = useState(false);
  const [targetTopicId, setTargetTopicId] = useState<string>('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDesc, setVideoDesc] = useState('');
  const [videoDuration, setVideoDuration] = useState('15:00');
  const [videoSourceType, setVideoSourceType] = useState<'drive' | 'file'>('drive');
  const [driveLink, setDriveLink] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrlFallback, setVideoUrlFallback] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Edit Video Modal
  const [isEditVideoOpen, setIsEditVideoOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [editVideoTitle, setEditVideoTitle] = useState('');
  const [editVideoDesc, setEditVideoDesc] = useState('');
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editVideoDuration, setEditVideoDuration] = useState('15:00');
  const [isSavingVideo, setIsSavingVideo] = useState(false);

  // Delete Video Modal
  const [isDeleteVideoOpen, setIsDeleteVideoOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<any>(null);

  const fetchCourse = async () => {
    if (!id) return;
    try {
      const res = await api.getCourseById(id);
      if (res.data?.success) {
        const data = res.data.data;
        setCourseData(data);
        const openSet = new Set<string>(data.topics.map((t: any) => t.id));
        setOpenTopicIds(openSet);
      }
    } catch (err) {
      console.error('Failed to load course details', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const toggleTopic = (topicId: string) => {
    setOpenTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  };

  // Add Topic Handler
  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicTitle.trim()) {
      error('Topic title is required');
      return;
    }
    try {
      await api.createTopic({ courseId: id!, title: topicTitle, description: topicDescription });
      success('Topic folder created successfully!');
      setIsAddTopicOpen(false);
      setTopicTitle('');
      setTopicDescription('');
      fetchCourse();
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Failed to create topic');
    }
  };

  // Edit Topic Handler
  const handleEditTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic) return;
    try {
      await api.updateTopic(editingTopic.id, { title: topicTitle, description: topicDescription });
      success('Topic folder updated successfully!');
      setIsEditTopicOpen(false);
      setEditingTopic(null);
      fetchCourse();
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Failed to update topic');
    }
  };

  // Delete Topic Handler
  const handleDeleteTopic = async () => {
    if (!topicToDelete) return;
    try {
      await api.deleteTopic(topicToDelete.id);
      success('Topic folder deleted successfully');
      setIsDeleteTopicOpen(false);
      setTopicToDelete(null);
      fetchCourse();
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Failed to delete topic');
    }
  };

  // Upload Video Handler
  const handleUploadVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim()) {
      error('Video title is required');
      return;
    }
    if (!targetTopicId) {
      error('Please select a topic folder');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    try {
      let finalVideoUrl = videoUrlFallback;
      let finalStoragePath = '';

      if (videoSourceType === 'drive') {
        if (!driveLink.trim()) {
          error('Please provide a Google Drive video link');
          setIsUploading(false);
          return;
        }
        finalVideoUrl = driveLink.trim();
        finalStoragePath = ''; // 0 bytes used in Supabase storage
        setUploadProgress(70);
      } else if (selectedFile) {
        // Upload multipart file to Supabase storage
        const formData = new FormData();
        formData.append('video', selectedFile);

        setUploadProgress(40);
        const uploadRes = await api.uploadVideoFile(formData);
        if (uploadRes.data?.success) {
          finalVideoUrl = uploadRes.data.data.url;
          finalStoragePath = uploadRes.data.data.storagePath;
          setUploadProgress(75);
        }
      }

      setUploadProgress(85);

      // Create video record in database & trigger emails / notifications
      await api.createVideo({
        courseId: id,
        topicId: targetTopicId,
        title: videoTitle,
        description: videoDesc,
        videoUrl: finalVideoUrl,
        storagePath: finalStoragePath,
        thumbnailUrl: courseData.course.thumbnail_url,
        duration: videoDuration,
      });

      setUploadProgress(100);
      success(
        videoSourceType === 'drive'
          ? 'Google Drive video lesson published! Supabase storage is preserved.'
          : 'Video lesson uploaded and published!',
        'Lesson Created 🎉'
      );

      setIsUploadVideoOpen(false);
      setVideoTitle('');
      setVideoDesc('');
      setDriveLink('');
      setSelectedFile(null);
      setUploadProgress(0);
      fetchCourse();
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Video upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Edit Video Handler
  const handleEditVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;
    if (!editVideoTitle.trim()) {
      error('Video title is required');
      return;
    }
    if (!editVideoUrl.trim()) {
      error('Video URL is required');
      return;
    }

    setIsSavingVideo(true);
    try {
      await api.updateVideo(editingVideo.id, {
        title: editVideoTitle.trim(),
        description: editVideoDesc.trim(),
        videoUrl: editVideoUrl.trim(),
        duration: editVideoDuration.trim() || '15:00',
      });

      success('Video updated! New Google Drive playback settings applied.', 'Lesson Updated 🎉');
      setIsEditVideoOpen(false);
      setEditingVideo(null);
      fetchCourse();
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Failed to update video');
    } finally {
      setIsSavingVideo(false);
    }
  };

  // Delete Video Handler
  const handleDeleteVideo = async () => {
    if (!videoToDelete) return;
    try {
      await api.deleteVideo(videoToDelete.id);
      success('Video lesson removed successfully');
      setIsDeleteVideoOpen(false);
      setVideoToDelete(null);
      fetchCourse();
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Failed to delete video');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 rounded-3xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
        <h3 className="text-lg font-bold text-navy-900">Course Not Found</h3>
        <Button onClick={() => navigate('/teacher/courses')} className="mt-4" variant="primary">
          Back to Courses
        </Button>
      </div>
    );
  }

  const { course, topics, totalTopics, totalVideos } = courseData;

  return (
    <div className="space-y-8">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/teacher/courses')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-navy-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Course List
        </button>
      </div>

      {/* Course Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-5">
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-2 ring-primary-100 shadow-md flex-shrink-0"
          />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="blue" size="sm">{course.level}</Badge>
              <Badge variant="slate" size="sm">{course.is_published ? 'Published' : 'Draft'}</Badge>
            </div>
            <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
              {course.title}
            </h1>
            <p className="text-xs text-navy-600 line-clamp-2 max-w-2xl leading-relaxed">
              {course.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Button
            onClick={() => {
              setTopicTitle('');
              setTopicDescription('');
              setIsAddTopicOpen(true);
            }}
            variant="outline"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Topic
          </Button>

          <Button
            onClick={() => {
              if (topics.length === 0) {
                error('Please create a topic folder first before uploading a video');
                return;
              }
              setTargetTopicId(topics[0]?.id || '');
              setIsUploadVideoOpen(true);
            }}
            variant="primary"
            size="md"
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Upload Video
          </Button>
        </div>
      </div>

      {/* Topics & Videos Syllabus Tree */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy-900 tracking-tight flex items-center gap-2">
            <Folder className="w-5 h-5 text-secondary-600" />
            Curriculum Topics & Video Lessons ({totalTopics} Folders, {totalVideos} Videos)
          </h2>
          <span className="text-xs text-slate-500 font-semibold">
            All videos are instantly accessible to students
          </span>
        </div>

        {topics.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <Folder className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-navy-900">No Topics Created Yet</h4>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Create your first topic folder (e.g. "Introduction to HTML") to start uploading videos.
            </p>
            <Button
              onClick={() => setIsAddTopicOpen(true)}
              variant="primary"
              size="sm"
            >
              Create Topic Folder
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {topics.map((topic: any, tIdx: number) => {
              const isOpen = openTopicIds.has(topic.id);

              return (
                <div
                  key={topic.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
                >
                  {/* Topic Header Bar */}
                  <div
                    onClick={() => toggleTopic(topic.id)}
                    className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-secondary-600">
                        {isOpen ? (
                          <FolderOpen className="w-5 h-5 fill-secondary-50" />
                        ) : (
                          <Folder className="w-5 h-5 fill-secondary-50" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">
                            Folder {tIdx + 1}:
                          </span>
                          <h3 className="text-sm sm:text-base font-bold text-navy-900">
                            {topic.title}
                          </h3>
                        </div>
                        {topic.description && (
                          <p className="text-xs text-navy-500 mt-0.5">{topic.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <span className="text-xs text-slate-500 font-semibold mr-2">
                        {topic.videos.length} lessons
                      </span>

                      {/* Add Video inside this topic */}
                      <button
                        onClick={() => {
                          setTargetTopicId(topic.id);
                          setIsUploadVideoOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition flex items-center gap-1"
                        title="Upload lesson to this topic"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Lesson
                      </button>

                      {/* Edit Topic */}
                      <button
                        onClick={() => {
                          setEditingTopic(topic);
                          setTopicTitle(topic.title);
                          setTopicDescription(topic.description || '');
                          setIsEditTopicOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-navy-900 hover:bg-slate-100 rounded-lg transition"
                        title="Edit Topic"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Topic */}
                      <button
                        onClick={() => {
                          setTopicToDelete(topic);
                          setIsDeleteTopicOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Topic"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => toggleTopic(topic.id)}
                        className="p-1 text-slate-400"
                      >
                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Lessons list inside topic */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="divide-y divide-slate-100 bg-slate-50/30 border-t border-slate-100"
                      >
                        {topic.videos.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400">
                            No video lessons inside this folder yet. Click "Add Lesson" above to upload one!
                          </div>
                        ) : (
                          topic.videos.map((vid: any, vIdx: number) => (
                            <div
                              key={vid.id}
                              className="p-3.5 sm:px-6 flex items-center justify-between hover:bg-white transition"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0">
                                  <Video className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <h4 className="text-xs sm:text-sm font-semibold text-navy-900">
                                    {vIdx + 1}. {vid.title}
                                  </h4>
                                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                    {vid.description}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                {isGoogleDriveUrl(vid.video_url) ? (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 inline-flex items-center gap-1">
                                    <HardDrive className="w-3 h-3 text-amber-600" />
                                    <span className="hidden sm:inline">Drive</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 hidden sm:inline-block">
                                    Direct
                                  </span>
                                )}

                                <span className="text-[11px] font-medium text-slate-400 hidden sm:flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {vid.duration}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => openVideoInGoogleDrive(vid.video_url)}
                                  className="p-1 text-slate-400 hover:text-amber-600 rounded-md transition"
                                  title="Open directly in Google Drive"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => navigate(`/student/videos/${vid.id}`)}
                                  className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                                >
                                  Preview
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingVideo(vid);
                                    setEditVideoTitle(vid.title || '');
                                    setEditVideoDesc(vid.description || '');
                                    setEditVideoUrl(vid.video_url || '');
                                    setEditVideoDuration(vid.duration || '15:00');
                                    setIsEditVideoOpen(true);
                                  }}
                                  className="p-1 text-slate-400 hover:text-primary-600 rounded-md transition"
                                  title="Edit Video & Google Drive Link"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => {
                                    setVideoToDelete(vid);
                                    setIsDeleteVideoOpen(true);
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition"
                                  title="Delete Video"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Topic Modal */}
      <Modal
        isOpen={isAddTopicOpen}
        onClose={() => setIsAddTopicOpen(false)}
        title="Add Curriculum Topic"
        description="Create a folder-style topic to group lessons together."
        maxWidth="sm"
      >
        <form onSubmit={handleAddTopic} className="space-y-4">
          <Input
            label="Topic Title"
            placeholder="e.g. HTML Forms & Validation"
            value={topicTitle}
            onChange={(e) => setTopicTitle(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Brief Description"
            placeholder="e.g. Input types, attributes, and user validation."
            value={topicDescription}
            onChange={(e) => setTopicDescription(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddTopicOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Topic
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Topic Modal */}
      <Modal
        isOpen={isEditTopicOpen}
        onClose={() => setIsEditTopicOpen(false)}
        title="Edit Topic Folder"
        description="Update folder name or description."
        maxWidth="sm"
      >
        <form onSubmit={handleEditTopic} className="space-y-4">
          <Input
            label="Topic Title"
            value={topicTitle}
            onChange={(e) => setTopicTitle(e.target.value)}
            required
          />
          <Input
            label="Brief Description"
            value={topicDescription}
            onChange={(e) => setTopicDescription(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditTopicOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Update Topic
            </Button>
          </div>
        </form>
      </Modal>

      {/* Upload Video Modal */}
      <Modal
        isOpen={isUploadVideoOpen}
        onClose={() => {
          if (!isUploading) setIsUploadVideoOpen(false);
        }}
        title="Upload & Publish Video Lesson"
        description="Upload course video directly to storage. Students will be notified immediately."
        maxWidth="md"
      >
        <form onSubmit={handleUploadVideo} className="space-y-4">
          <Input
            label="Video Title"
            placeholder="e.g. Mastering the useEffect Hook"
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-navy-700 uppercase tracking-wide">
              Lesson Description
            </label>
            <textarea
              rows={2}
              className="w-full bg-white text-navy-900 text-sm rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:border-primary-600 transition"
              placeholder="What concepts are covered in this lesson?"
              value={videoDesc}
              onChange={(e) => setVideoDesc(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-navy-700 uppercase tracking-wide">
                Assign to Topic Folder
              </label>
              <select
                className="w-full bg-white text-navy-900 text-sm font-medium rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:border-primary-600"
                value={targetTopicId}
                onChange={(e) => setTargetTopicId(e.target.value)}
                required
              >
                {topics.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    📁 {t.title}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Estimated Duration"
              placeholder="e.g. 18:45"
              value={videoDuration}
              onChange={(e) => setVideoDuration(e.target.value)}
            />
          </div>

          {/* Video Hosting Source Switcher */}
          <div className="space-y-2 text-left">
            <label className="block text-xs font-semibold text-navy-700 uppercase tracking-wide">
              Video Hosting Source
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setVideoSourceType('drive')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  videoSourceType === 'drive'
                    ? 'bg-white text-primary-700 shadow-xs'
                    : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5 text-amber-500" />
                <span>Google Drive (0 Storage)</span>
              </button>

              <button
                type="button"
                onClick={() => setVideoSourceType('file')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  videoSourceType === 'file'
                    ? 'bg-white text-primary-700 shadow-xs'
                    : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                <FileVideo className="w-3.5 h-3.5 text-primary-600" />
                <span>Upload Video File</span>
              </button>
            </div>
          </div>

          {/* Google Drive Option */}
          {videoSourceType === 'drive' ? (
            <div className="space-y-3 p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-left">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-navy-900">
                    Google Drive Stream (Recommended)
                  </h5>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Saves Supabase storage limit (0 MB used). Streams fast directly from Google.
                  </p>
                </div>
              </div>

              <Input
                label="Google Drive Video Share Link"
                placeholder="https://drive.google.com/file/d/1x.../view?usp=sharing"
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
                required
              />

              {driveLink.trim() && (
                <div className="pt-1">
                  {isGoogleDriveUrl(driveLink) ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Valid Google Drive File ID: {extractGoogleDriveFileId(driveLink)}
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-lg inline-block">
                      Make sure the link includes drive.google.com or file ID.
                    </span>
                  )}
                </div>
              )}

              <div className="p-3 bg-white/80 rounded-xl border border-amber-200/60 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-navy-900">Quick steps to get link:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-slate-500">
                  <li>Upload your MP4 video to Google Drive.</li>
                  <li>Right click &rarr; <b>Share</b> &rarr; change General access to <b>Anyone with the link</b>.</li>
                  <li>Click <b>Copy link</b> and paste it above.</li>
                </ol>
              </div>
            </div>
          ) : (
            /* File Upload Selector */
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-navy-700 uppercase tracking-wide">
                Video File (MP4, WebM, MKV)
              </label>
              <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50 hover:bg-slate-50 transition">
                <FileVideo className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="text-xs text-navy-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  {selectedFile ? `Selected: ${selectedFile.name} (${Math.round(selectedFile.size / 1024 / 1024)} MB)` : 'Or leave empty to use sample educational stream URL'}
                </p>
              </div>
            </div>
          )}

          {/* Upload progress indicator */}
          {isUploading && (
            <div className="space-y-1.5 py-2">
              <div className="flex justify-between text-xs font-bold text-navy-800">
                <span>Publishing & Notifying Students...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary-600 to-secondary-600 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUploadVideoOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isUploading}
            >
              {videoSourceType === 'drive' ? 'Save Google Drive Lesson' : 'Upload & Publish Video'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Video Modal (Update Title / Drive Link) */}
      <Modal
        isOpen={isEditVideoOpen}
        onClose={() => {
          if (!isSavingVideo) setIsEditVideoOpen(false);
        }}
        title="Edit Video Lesson & Stream URL"
        description="Update lesson details or switch hosting to Google Drive to conserve Supabase storage."
        maxWidth="md"
      >
        <form onSubmit={handleEditVideo} className="space-y-4">
          <Input
            label="Lesson Title"
            value={editVideoTitle}
            onChange={(e) => setEditVideoTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-navy-700 uppercase tracking-wide">
              Lesson Description
            </label>
            <textarea
              rows={2}
              className="w-full bg-white text-navy-900 text-sm rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:border-primary-600 transition"
              value={editVideoDesc}
              onChange={(e) => setEditVideoDesc(e.target.value)}
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-navy-700 uppercase tracking-wide">
              Video URL (Google Drive Share Link or Video URL)
            </label>
            <Input
              placeholder="Paste Google Drive share link (https://drive.google.com/file/d/...)"
              value={editVideoUrl}
              onChange={(e) => setEditVideoUrl(e.target.value)}
              required
            />
            {editVideoUrl.trim() && isGoogleDriveUrl(editVideoUrl) ? (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Google Drive embed supported (File ID: {extractGoogleDriveFileId(editVideoUrl)})
              </span>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                Paste a Google Drive link to enable 0-byte streaming directly from Drive.
              </p>
            )}
          </div>

          <Input
            label="Duration"
            placeholder="e.g. 15:00"
            value={editVideoDuration}
            onChange={(e) => setEditVideoDuration(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditVideoOpen(false)}
              disabled={isSavingVideo}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSavingVideo}
            >
              Update Lesson
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Topic Dialog */}
      <ConfirmDialog
        isOpen={isDeleteTopicOpen}
        onClose={() => setIsDeleteTopicOpen(false)}
        onConfirm={handleDeleteTopic}
        title="Delete Topic Folder"
        message={`Are you sure you want to delete topic "${topicToDelete?.title}"? All associated lesson videos inside it will also be deleted.`}
        confirmText="Delete Topic"
        isDangerous
      />

      {/* Delete Video Dialog */}
      <ConfirmDialog
        isOpen={isDeleteVideoOpen}
        onClose={() => setIsDeleteVideoOpen(false)}
        onConfirm={handleDeleteVideo}
        title="Delete Video Lesson"
        message={`Are you sure you want to delete lesson "${videoToDelete?.title}"?`}
        confirmText="Delete Lesson"
        isDangerous
      />
    </div>
  );
};

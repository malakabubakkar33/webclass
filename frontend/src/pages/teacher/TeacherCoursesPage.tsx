import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Select } from '../../components/ui/Select.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import {
  BookOpen,
  Folder,
  Video,
  Plus,
  Edit,
  Trash2,
  ArrowRight,
  Sparkles,
  Calendar,
} from 'lucide-react';

export const TeacherCoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialAction = searchParams.get('action');

  const { success, error } = useToast();

  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(initialAction === 'new-course');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600',
    level: 'Beginner',
    is_published: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCourses = async () => {
    try {
      const res = await api.getCourses();
      if (res.data?.success) {
        setCourses(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      error('Course title is required');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.createCourse(formData);
      success('Course created successfully!', 'Course Added');
      setIsCreateOpen(false);
      setFormData({
        title: '',
        description: '',
        thumbnail_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600',
        level: 'Beginner',
        is_published: true,
      });
      fetchCourses();
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Failed to create course');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setIsSubmitting(true);
    try {
      await api.updateCourse(selectedCourse.id, formData);
      success('Course details updated successfully!');
      setIsEditOpen(false);
      fetchCourses();
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Failed to update course');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    setIsSubmitting(true);
    try {
      await api.deleteCourse(courseToDelete.id);
      success('Course deleted successfully');
      setIsDeleteOpen(false);
      setCourseToDelete(null);
      fetchCourses();
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Failed to delete course');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (course: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      thumbnail_url: course.thumbnail_url,
      level: course.level,
      is_published: course.is_published,
    });
    setIsEditOpen(true);
  };

  const openDeleteModal = (course: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setCourseToDelete(course);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Course Management
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 mt-1">
            Create, edit, organize topics, and upload video lessons for your students.
          </p>
        </div>

        <Button
          onClick={() => {
            setFormData({
              title: '',
              description: '',
              thumbnail_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600',
              level: 'Beginner',
              is_published: true,
            });
            setIsCreateOpen(true);
          }}
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Course
        </Button>
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Skeleton key={n} className="h-80" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs col-span-full">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-navy-900">No courses created yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Start building your curriculum by clicking the button below to add your first course.
          </p>
          <Button onClick={() => setIsCreateOpen(true)} variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Add Your First Course
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card
              key={course.id}
              hoverable
              className="flex flex-col justify-between group cursor-pointer"
              onClick={() => navigate(`/teacher/courses/${course.id}`)}
            >
              <div>
                <div className="relative mb-4 rounded-2xl overflow-hidden aspect-video bg-slate-100">
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant="blue" size="sm">{course.level}</Badge>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={(e) => openEditModal(course, e)}
                      className="p-1.5 bg-white/90 hover:bg-white text-navy-800 rounded-xl shadow-xs transition"
                      title="Edit Course"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => openDeleteModal(course, e)}
                      className="p-1.5 bg-white/90 hover:bg-rose-50 text-rose-600 rounded-xl shadow-xs transition"
                      title="Delete Course"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-navy-900 group-hover:text-primary-600 transition tracking-tight">
                  {course.title}
                </h3>
                <p className="text-xs text-navy-600 mt-2 line-clamp-2 leading-relaxed">
                  {course.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Folder className="w-3.5 h-3.5 text-secondary-600" />
                    {course.topicsCount} topics
                  </span>
                  <span className="flex items-center gap-1">
                    <Video className="w-3.5 h-3.5 text-primary-600" />
                    {course.videosCount} lessons
                  </span>
                </div>

                <span className="text-primary-600 group-hover:translate-x-1 transition flex items-center gap-1 font-bold">
                  Manage &rarr;
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Course"
        description="Add a new web development course module to the classroom syllabus."
        maxWidth="md"
      >
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <Input
            label="Course Title"
            placeholder="e.g. Next.js 14 Full-Stack Production"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-navy-700 uppercase tracking-wide">
              Description
            </label>
            <textarea
              rows={3}
              className="w-full bg-white text-navy-900 text-sm rounded-xl border border-slate-200 p-3 focus:outline-none focus:border-primary-600 transition"
              placeholder="Outline what students will learn..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Level"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
              options={[
                { label: 'Beginner', value: 'Beginner' },
                { label: 'Intermediate', value: 'Intermediate' },
                { label: 'Advanced', value: 'Advanced' },
              ]}
            />

            <Select
              label="Status"
              value={formData.is_published ? 'published' : 'draft'}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.value === 'published' })}
              options={[
                { label: 'Published (Active)', value: 'published' },
                { label: 'Draft (Hidden)', value: 'draft' },
              ]}
            />
          </div>

          <Input
            label="Thumbnail URL"
            value={formData.thumbnail_url}
            onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
            helperText="Link to an image representing this technology"
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Create Course
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Course Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Course Details"
        description="Update title, description, or thumbnail image."
        maxWidth="md"
      >
        <form onSubmit={handleEditCourse} className="space-y-4">
          <Input
            label="Course Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-navy-700 uppercase tracking-wide">
              Description
            </label>
            <textarea
              rows={3}
              className="w-full bg-white text-navy-900 text-sm rounded-xl border border-slate-200 p-3 focus:outline-none focus:border-primary-600 transition"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Level"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
              options={[
                { label: 'Beginner', value: 'Beginner' },
                { label: 'Intermediate', value: 'Intermediate' },
                { label: 'Advanced', value: 'Advanced' },
              ]}
            />

            <Select
              label="Status"
              value={formData.is_published ? 'published' : 'draft'}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.value === 'published' })}
              options={[
                { label: 'Published (Active)', value: 'published' },
                { label: 'Draft (Hidden)', value: 'draft' },
              ]}
            />
          </div>

          <Input
            label="Thumbnail URL"
            value={formData.thumbnail_url}
            onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteCourse}
        title="Delete Course"
        message={`Are you sure you want to delete "${courseToDelete?.title}"? All associated topics, video records, and student progress will be removed.`}
        confirmText="Delete Course"
        isDangerous
        isLoading={isSubmitting}
      />
    </div>
  );
};

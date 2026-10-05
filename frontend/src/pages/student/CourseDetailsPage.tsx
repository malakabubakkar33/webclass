import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { ProgressBar } from '../../components/ui/ProgressBar.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import {
  Folder,
  FolderOpen,
  Play,
  CheckCircle2,
  Circle,
  Video,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  Sparkles,
  Search,
  Check,
  ChevronRight,
  Layers,
  Flame,
  ArrowUpRight,
  HardDrive,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isGoogleDriveUrl, openVideoInGoogleDrive } from '../../utils/driveUtils.js';

export const CourseDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [roadmapData, setRoadmapData] = useState<any>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [topicSearchQuery, setTopicSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoadmap = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getCourseRoadmap(id);
      if (res.data?.success) {
        const data = res.data.data;
        setRoadmapData(data);
        // Default select active or first topic
        const currentTopic = data.topics.find((t: any) => t.isCurrent) || data.topics[0];
        if (currentTopic) {
          setSelectedTopicId(currentTopic.id);
        }
      } else {
        setError(res.data?.message || 'Unable to load course roadmap');
      }
    } catch (err: any) {
      console.error('Failed to load course roadmap', err);
      setError('Unable to load course curriculum. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-5 h-96 rounded-3xl" />
          <Skeleton className="lg:col-span-7 h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !roadmapData) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 max-w-lg mx-auto my-12 shadow-xs">
        <h3 className="text-lg font-bold text-navy-900">Course Curriculum Not Found</h3>
        <p className="text-xs text-slate-500 mt-2 mb-6">{error || 'Could not locate this course syllabus.'}</p>
        <Button onClick={() => navigate('/student/courses')} variant="primary" size="md">
          Back to Courses
        </Button>
      </div>
    );
  }

  const { course, topics, latestTeacherContent, continueWhereLeftOff } = roadmapData;

  // Filter topics and lessons by instant topic search
  const filteredTopics = topics.filter((t: any) => {
    const q = topicSearchQuery.toLowerCase().trim();
    if (!q) return true;
    const matchesTopic = t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q));
    const matchesLesson = t.lessons.some((l: any) => l.title.toLowerCase().includes(q));
    return matchesTopic || matchesLesson;
  });

  const activeTopic = topics.find((t: any) => t.id === selectedTopicId) || filteredTopics[0] || topics[0];

  const rawLessons = activeTopic?.lessons || [];
  const uniqueLessons = Array.from(
    new Map(rawLessons.map((l: any) => [l.id, l])).values()
  );

  // Active lessons can also be filtered if search matches inside
  const displayedLessons = uniqueLessons.filter((l: any) => {
    const q = topicSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      l.title.toLowerCase().includes(q) ||
      (activeTopic.title.toLowerCase().includes(q))
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8 pb-12"
    >
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/student/courses')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-navy-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. COURSE HERO HEADER */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-2 ring-primary-100 shadow-md shrink-0"
          />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="blue" size="sm">{course.level || 'Beginner'}</Badge>
              <span className="text-xs text-slate-400 font-semibold">• Web Development Track</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              {course.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed font-normal">
              {course.description}
            </p>

            <div className="flex items-center gap-4 text-xs font-bold text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-primary-600" />
                {course.totalTopics} Topics
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-secondary-600" />
                {course.totalVideos} Lessons
              </span>
              <span>•</span>
              <span className="text-primary-600">
                {course.progressPercentage}% Completed
              </span>
            </div>
          </div>
        </div>

        {/* Continue Learning CTA */}
        <div className="w-full lg:w-auto shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {continueWhereLeftOff ? (
            <Button
              onClick={() => navigate(`/student/lessons/${continueWhereLeftOff.videoId}`)}
              size="lg"
              variant="primary"
              className="shadow-sm shadow-primary-500/20"
              leftIcon={<Play className="w-4 h-4 fill-current" />}
            >
              Continue Learning &rarr;
            </Button>
          ) : (
            <Button
              onClick={() => {
                const firstLesson = topics[0]?.lessons[0];
                if (firstLesson) navigate(`/student/lessons/${firstLesson.id}`);
              }}
              size="lg"
              variant="primary"
              leftIcon={<Play className="w-4 h-4 fill-current" />}
            >
              Start Course &rarr;
            </Button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. LATEST FROM YOUR TEACHER (PRIORITY BANNER) */}
      {/* ========================================================================= */}
      {latestTeacherContent && (
        <div className="bg-gradient-to-r from-blue-50/90 via-purple-50/50 to-indigo-50/70 rounded-3xl border border-blue-200/80 p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-secondary-600 text-white flex items-center justify-center shadow-md shadow-primary-500/20 shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-white bg-secondary-600 px-2 py-0.5 rounded-md shadow-2xs">
                  NEW LESSON
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Topic: {latestTeacherContent.topicTitle}
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  • Published {latestTeacherContent.publishedDate}
                </span>
              </div>
              <h3 className="text-base font-bold text-navy-900 tracking-tight">
                {latestTeacherContent.title}
              </h3>
              <p className="text-xs text-slate-600 line-clamp-1 max-w-xl font-normal mt-0.5">
                {latestTeacherContent.description || 'Watch the newly published video tutorial.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            {latestTeacherContent.videoUrl && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openVideoInGoogleDrive(latestTeacherContent.videoUrl);
                }}
                className="px-3 py-2 rounded-xl bg-amber-100/80 hover:bg-amber-200/90 text-amber-900 text-xs font-bold border border-amber-300/80 flex items-center gap-1.5 transition shadow-2xs"
                title="Open directly in Google Drive"
              >
                <HardDrive className="w-3.5 h-3.5 text-amber-700" />
                <span>Open in Drive</span>
                <ExternalLink className="w-3 h-3 text-amber-700" />
              </button>
            )}
            <Button
              onClick={() => navigate(`/student/lessons/${latestTeacherContent.videoId}`)}
              variant="primary"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="flex-1 sm:flex-initial"
            >
              Start New Lesson &rarr;
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CURRICULUM SEARCH BAR */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-base font-extrabold text-navy-900 tracking-tight">
            Course Curriculum Roadmap
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Select a topic on the left to inspect its lesson lectures.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search topics or lessons..."
            value={topicSearchQuery}
            onChange={(e) => setTopicSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-navy-900 rounded-xl border border-slate-200/80 focus:outline-none focus:border-primary-600 focus:bg-white transition"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TWO-PART ROADMAP LAYOUT (LEFT: TOPICS ROADMAP, RIGHT: TOPIC CONTENT) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: COURSE TOPIC NAVIGATION (5 COLS) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="px-2 py-1 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Curriculum Modules ({filteredTopics.length})</span>
            <span>Status</span>
          </div>

          <div className="space-y-2.5">
            {filteredTopics.map((topic: any) => {
              const isSelected = topic.id === (activeTopic?.id);
              const isFinished = topic.isCompleted;

              return (
                <div
                  key={topic.id}
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-50/70 border-primary-500 shadow-sm ring-1 ring-primary-500/20'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Topic Number Tag */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition ${
                        isSelected
                          ? 'bg-primary-600 text-white shadow-xs'
                          : isFinished
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {topic.topicNumber}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-xs sm:text-sm font-bold truncate tracking-tight ${
                            isSelected ? 'text-primary-700' : 'text-navy-900'
                          }`}
                        >
                          {topic.title}
                        </h4>
                        {topic.isNew && (
                          <span className="text-[9px] font-black uppercase tracking-wider text-white bg-secondary-600 px-1.5 py-0.5 rounded-md shrink-0">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                        {topic.lessonCount} {topic.lessonCount === 1 ? 'lesson' : 'lessons'} •{' '}
                        {topic.completedCount} finished
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {isFinished ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                        <Check className="w-3 h-3 stroke-[3]" />
                        Done
                      </span>
                    ) : topic.isCurrent ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-primary-700 bg-blue-100/70 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Current
                      </span>
                    ) : (
                      <ChevronRight
                        className={`w-4 h-4 transition ${
                          isSelected ? 'text-primary-600 translate-x-0.5' : 'text-slate-300'
                        }`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: SELECTED TOPIC CONTENT (7 COLS) */}
        <div className="lg:col-span-7">
          {activeTopic ? (
            <Card className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-xs space-y-6">
              {/* Selected Topic Header */}
              <div className="pb-5 border-b border-slate-100">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/60">
                    MODULE {activeTopic.topicNumber}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {activeTopic.completedCount} / {activeTopic.lessonCount} Lessons Completed
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-navy-900 tracking-tight">
                  {activeTopic.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 leading-relaxed">
                  {activeTopic.description || 'Watch all lessons in this module to build and solidify your skills.'}
                </p>
              </div>

              {/* Lesson Cards List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Lessons in this Module
                </h4>

                {displayedLessons.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl">
                    No lessons found matching &quot;{topicSearchQuery}&quot;
                  </div>
                ) : (
                  displayedLessons.map((lesson: any) => (
                    <div
                      key={lesson.id}
                      onClick={() => navigate(`/student/lessons/${lesson.id}`)}
                      className="p-4 rounded-2xl border border-slate-200/80 hover:border-primary-300 hover:bg-blue-50/30 transition cursor-pointer flex items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Status Icon */}
                        <div className="shrink-0">
                          {lesson.isCompleted ? (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-primary-100 text-slate-400 group-hover:text-primary-600 flex items-center justify-center transition">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400">
                              {lesson.lessonNumber}.
                            </span>
                            <h5 className="text-xs sm:text-sm font-bold text-navy-900 group-hover:text-primary-600 transition truncate">
                              {lesson.title}
                            </h5>
                            {lesson.isNew && (
                              <span className="text-[9px] font-black uppercase text-white bg-secondary-600 px-1.5 py-0.5 rounded-md shadow-2xs">
                                NEW
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {lesson.duration}
                            </span>
                            <span>•</span>
                            <span className={lesson.isCompleted ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                              {lesson.isCompleted ? '✓ Completed' : '○ Not Started'}
                            </span>
                            {isGoogleDriveUrl(lesson.video_url) && (
                              <>
                                <span>•</span>
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80 inline-flex items-center gap-1">
                                  <HardDrive className="w-2.5 h-2.5 text-amber-600" />
                                  Drive Stream
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openVideoInGoogleDrive(lesson.video_url);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 flex items-center gap-1.5 transition shadow-2xs"
                          title="Open directly in Google Drive (Zero database bandwidth used)"
                        >
                          <HardDrive className="w-3.5 h-3.5 text-amber-600" />
                          <span className="hidden sm:inline">Drive</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>

                        <Button
                          size="sm"
                          variant={lesson.isCompleted ? 'outline' : 'primary'}
                          className="text-xs font-bold"
                        >
                          {lesson.isCompleted ? 'Review' : 'Watch'} &rarr;
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center text-slate-400 text-xs">
              Select a module from the left curriculum list to preview lessons.
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
};

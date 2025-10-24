'use client';

import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../lib/authContext';
import { supabase } from '../../lib/supabaseClient';

type VideoRecord = {
  id: string;
  file_path: string;
  created_at: string | null;
};

type DownloadUrlMap = Record<string, string>;

export default function AccountPage() {
  const { user, isLoading } = useAuth();
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [isFetchingVideos, setIsFetchingVideos] = useState(false);
  const [videosError, setVideosError] = useState<string | null>(null);
  const [downloadUrls, setDownloadUrls] = useState<DownloadUrlMap>({});
  const [isSigningUrl, setIsSigningUrl] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;

    if (!user) {
      setVideos([]);
      return;
    }

    const fetchVideos = async () => {
      try {
        setIsFetchingVideos(true);
        setVideosError(null);

        // Fetch only the authenticated user's videos. RLS policies should enforce this on Supabase.
        const { data, error } = await supabase
          .from('videos')
          .select('id, file_path, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (!isMounted) {
          return;
        }

        setVideos(data ?? []);
      } catch (error) {
        console.error('Failed to fetch videos for the current user.', error);
        if (!isMounted) {
          return;
        }
        setVideosError('Unable to load saved videos.');
      } finally {
        if (isMounted) {
          setIsFetchingVideos(false);
        }
      }
    };

    fetchVideos();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const formattedVideos = useMemo(
    () =>
      videos.map((video) => ({
        ...video,
        created_at: video.created_at ?? null
      })),
    [videos]
  );

  const handleDownload = async (video: VideoRecord) => {
    try {
      setIsSigningUrl((previous) => ({ ...previous, [video.id]: true }));
      setVideosError(null);

      const { data, error } = await supabase
        .storage
        .from('videos')
        // Generate a time-limited download URL for the private video file.
        .createSignedUrl(video.file_path, 60 * 60);

      if (error) {
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error('The video URL could not be generated.');
      }

      setDownloadUrls((previous) => ({ ...previous, [video.id]: data.signedUrl }));
    } catch (error) {
      console.error('Failed to create a signed download URL for the video.', error);
      setVideosError('Unable to create a download link right now.');
    } finally {
      setIsSigningUrl((previous) => ({ ...previous, [video.id]: false }));
    }
  };

  if (isLoading) {
    return (
      <section style={{ margin: '0 auto', padding: '3rem 1rem', maxWidth: '640px' }}>
        <p>Checking your account…</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section style={{ margin: '0 auto', padding: '3rem 1rem', maxWidth: '640px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>My Videos</h1>
        <p>You need to log in to view your saved videos.</p>
      </section>
    );
  }

  return (
    <section
      style={{
        margin: '0 auto',
        padding: '3rem 1rem',
        maxWidth: '720px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}
    >
      <header>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>My Videos</h1>
        <p>Access videos that were generated while you were logged in.</p>
      </header>

      {videosError && (
        <p role="alert" style={{ color: '#dc2626' }}>
          {videosError}
        </p>
      )}

      {isFetchingVideos ? (
        <p>Loading saved videos…</p>
      ) : formattedVideos.length === 0 ? (
        <p>No videos have been saved yet. Generate a new video from the home page.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {formattedVideos.map((video) => {
            const isGeneratingSignedUrl = isSigningUrl[video.id];
            const downloadUrl = downloadUrls[video.id];
            const createdAt = video.created_at ? new Date(video.created_at) : null;

            return (
              <li
                key={video.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  backgroundColor: '#fff',
                  borderRadius: '0.75rem',
                  border: '1px solid #e5e7eb',
                  padding: '1rem'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontWeight: 600 }}>Video saved on {createdAt ? createdAt.toLocaleString() : 'unknown date'}</span>
                  <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{video.file_path}</span>
                </div>
                {downloadUrl ? (
                  <a href={downloadUrl} download style={{ color: '#6366f1' }}>
                    Download
                  </a>
                ) : (
                  <button type="button" onClick={() => handleDownload(video)} disabled={isGeneratingSignedUrl}>
                    {isGeneratingSignedUrl ? 'Preparing…' : 'Get download link'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

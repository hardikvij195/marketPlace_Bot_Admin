/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState, useRef } from "react";
import { X, UploadCloud, Trash2, Edit } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { showToast } from "@/hooks/useToast";
import Modal from "../_components/Modal";

export default function VideoManager() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredVideos, setFilteredVideos] = useState([]);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoToEdit, setVideoToEdit] = useState(null);
  const fileInputRef = useRef(null);

  const [videoName, setVideoName] = useState("");
  const [videoDescription, setVideoDescription] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);

  const VIDEO_BUCKET = "video-bucket";

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch video metadata from the 'videos' PostgreSQL table
      const { data: dbVideos, error: dbError } = await supabaseBrowser
        .from("videos")
        .select("*")
        .order("uploaded_at", { ascending: false });

      if (dbError) {
        throw new Error(
          dbError.message || "Failed to fetch video metadata from database."
        );
      }

      // For each video record from the database, get its public URL from Storage
      const videosWithUrls = await Promise.all(
        dbVideos.map(async (video) => {
          const { data: publicUrlData } = supabaseBrowser.storage
            .from(VIDEO_BUCKET)
            .getPublicUrl(video.file_path);

          return {
            ...video, // Contains id, title, description, file_path, uploaded_at
            publicUrl: publicUrlData.publicUrl,
          };
        })
      );

      setVideos(videosWithUrls);
      setFilteredVideos(videosWithUrls);
    } catch (err) {
      setError(err.message || "Failed to fetch videos.");
      showToast({
        title: "Error",
        description: err.message || "Failed to load videos.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUploadOrUpdateVideo = async () => {
    if (!videoName.trim()) {
      showToast({
        title: "Validation Error",
        description: "Video title cannot be empty.",
      });
      return;
    }

    if (!selectedFile && !videoToEdit) {
      showToast({
        title: "Validation Error",
        description: "Please select a video file to upload.",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      let storageFilePath = videoToEdit
        ? videoToEdit.file_path
        : selectedFile.name;
      let uploadError = null;

      if (selectedFile) {
        const { data: uploadData, error: storageUploadError } =
          await supabaseBrowser.storage
            .from(VIDEO_BUCKET)
            .upload(storageFilePath, selectedFile, {
              cacheControl: "3600",
              upsert: videoToEdit ? true : false,
              contentType: selectedFile.type,
            });
        uploadError = storageUploadError;
        if (uploadData) {
          storageFilePath = uploadData.path;
        }
      }

      if (uploadError) {
        throw new Error(
          uploadError.message || "Failed to upload video file to storage."
        );
      }

      if (videoToEdit) {
        const { error: updateDbError } = await supabaseBrowser
          .from("videos")
          .update({
            title: videoName.trim(),
            description: videoDescription.trim(),
            uploaded_at: new Date().toISOString(),
          })
          .eq("id", videoToEdit.id);

        if (updateDbError) {
          throw new Error(
            updateDbError.message ||
              "Failed to update video metadata in database."
          );
        }
      } else {
        const { error: insertDbError } = await supabaseBrowser
          .from("videos")
          .insert({
            title: videoName.trim(),
            description: videoDescription.trim(),
            file_path: storageFilePath,
          });

        if (insertDbError) {
          throw new Error(
            insertDbError.message ||
              "Failed to insert video metadata into database."
          );
        }
      }

      showToast({
        title: "Success",
        description: videoToEdit
          ? "Video updated successfully!"
          : "Video uploaded successfully!",
      });
      closeUploadModal();
      fetchVideos();
    } catch (err) {
      setError(err.message || "Failed to upload/update video.");
      showToast({
        title: "Error",
        description: err.message || "Failed to upload/update video.",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const openUploadModal = (video = null) => {
    setVideoToEdit(video);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setVideoName(video?.title || "");
    setVideoDescription(video?.description || "");
    setIsUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setVideoToEdit(null);
    setSelectedFile(null);
    setUploadProgress(0);
    setVideoName("");
    setVideoDescription("");
  };

  const openDeleteModal = (video) => {
    setVideoToDelete(video);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setVideoToDelete(null);
  };

  const confirmDelete = async () => {
    if (!videoToDelete) return;

    setUploading(true);
    setError(null);

    try {
      const { error: deleteDbError } = await supabaseBrowser
        .from("videos")
        .delete()
        .eq("id", videoToDelete.id);

      if (deleteDbError) {
        throw new Error(
          deleteDbError.message ||
            "Failed to delete video metadata from database."
        );
      }

      const { error: deleteStorageError } = await supabaseBrowser.storage
        .from(VIDEO_BUCKET)
        .remove([videoToDelete.file_path]);

      if (deleteStorageError) {
        throw new Error(
          deleteStorageError.message ||
            "Failed to delete video file from storage."
        );
      }

      showToast({
        title: "Success",
        description: "Video deleted successfully!",
      });
      closeDeleteModal();
      fetchVideos();
    } catch (err) {
      setError(err.message || "Failed to delete video.");
      showToast({
        title: "Error",
        description: err.message || "Failed to delete video.",
      });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredVideos(videos);
    } else {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = videos.filter(
        (video) =>
          (video.title || "").toLowerCase().includes(lowerCaseQuery) ||
          (video.description || "").toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredVideos(filtered);
    }
  }, [searchQuery, videos]);

  return (
    <div className="my-8 px-4">
      {error && (
        <div className="text-red-500 text-center my-4">Error: {error}</div>
      )}

      <div className="mb-8 container mx-auto relative flex flex-col md:flex-row items-center gap-4">
        <input
          type="text"
          placeholder="Search videos by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 ps-5 border border-gray-300 rounded-lg focus:ring focus:ring-primary/30 focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black md:relative md:top-auto md:right-auto md:translate-y-0"
          >
            <X />
          </button>
        )}
        <button
          onClick={() => openUploadModal()}
          className="md:mt-0 px-20 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-800 cursor-pointer transition-colors flex items-center justify-center gap-2"
        >
          <UploadCloud size={20} />
          <span>Upload</span>
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 container mx-auto w-[90%] my-8">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="bg-gray-200 animate-pulse rounded-lg p-4 flex flex-col"
            >
              <div className="bg-gray-300 w-full h-48 rounded-md mb-4"></div>
              <div className="bg-gray-300 w-3/4 h-4 rounded mb-2"></div>
              <div className="bg-gray-300 w-1/2 h-4 rounded mb-2"></div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredVideos.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 container mx-auto lg:w-[90%]">
          {filteredVideos.map((video) => (
            <li
              key={video.id}
              className="bg-white rounded-2xl shadow-xl p-4 flex flex-col items-center justify-between relative"
            >
              <div className="w-full mb-4 h-48 relative flex items-center justify-center bg-gray-100 rounded-md overflow-hidden">
                <video
                  src={video.publicUrl}
                  controls
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://placehold.co/600x400/E0E0E0/6C757D?text=Video+Error";
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              <h2 className="text-lg font-medium text-primary mb-2 text-center break-words w-full px-2">
                {video.title}
              </h2>
              {video.description && (
                <p className="text-gray-600 text-sm mb-2 text-center px-2 line-clamp-3">
                  {video.description}
                </p>
              )}
              <p className="text-gray-600 text-sm mb-4">
                File: {video.file_path}
              </p>
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => openUploadModal(video)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-1"
                >
                  <Edit size={16} /> Update
                </button>
                <button
                  onClick={() => openDeleteModal(video)}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-1"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && filteredVideos.length === 0 && searchQuery.trim() !== "" && (
        <div className="flex items-center flex-col justify-center px-4 mt-12">
          <img
            src="https://placehold.co/600x400/E0E0E0/6C757D?text=No+Results"
            className="h-80 w-auto mb-4"
            alt="No results"
          />
          <p className="fredoka-light text-primary text-lg text-center">
            No videos found matching your search.
          </p>
        </div>
      )}

      {!loading && videos.length === 0 && searchQuery.trim() === "" && (
        <div className="flex items-center flex-col justify-center px-4 mt-12">
          <img
            src="https://placehold.co/600x400/E0E0E0/6C757D?text=No+Videos"
            className="h-80 w-auto mb-4"
            alt="No videos"
          />
          <p className="fredoka-light text-primary text-lg text-center">
            No videos uploaded yet. Click "Upload New Video" to add some!
          </p>
        </div>
      )}

      {isUploadModalOpen && (
        <Modal isOpen={isUploadModalOpen} onClose={closeUploadModal}>
          <div className=" rounded-lg p-6 w-full max-w-md relative">
            <h2 className="text-xl font-semibold mb-4 text-primary">
              {videoToEdit ? "Update Video" : "Upload New Video"}
            </h2>

            {videoToEdit && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Current File Name:</span>{" "}
                  {videoToEdit.file_path}
                </p>
                <p className="text-xs text-gray-500">
                  Uploading a new file will replace the content at this path.
                </p>
              </div>
            )}

            <div className="mb-4">
              <label
                htmlFor="videoName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Video Title
              </label>
              <input
                type="text"
                id="videoName"
                placeholder="Enter video title"
                value={videoName}
                onChange={(e) => setVideoName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-primary/30 focus:outline-none"
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="videoDescription"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description (5 lines)
              </label>
              <textarea
                id="videoDescription"
                placeholder="Enter video description"
                value={videoDescription}
                onChange={(e) => setVideoDescription(e.target.value)}
                rows={5}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-primary/30 focus:outline-none resize-y"
              ></textarea>
            </div>

            <div className="mb-4">
              <label
                htmlFor="fileUpload"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {videoToEdit
                  ? "Select New Video File (Optional)"
                  : "Select Video File"}
              </label>
              <input
                type="file"
                id="fileUpload"
                accept="video/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="w-full p-2 border border-gray-300 rounded-md"
                required={!videoToEdit}
              />
            </div>

            {selectedFile && (
              <p className="text-sm text-gray-700 mb-2">
                Selected:{" "}
                <span className="font-medium">{selectedFile.name}</span> (
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}

            {uploading && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                disabled={uploading}
                onClick={closeUploadModal}
                className="px-4 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                disabled={
                  uploading ||
                  !videoName.trim() ||
                  (!selectedFile && !videoToEdit)
                }
                onClick={handleUploadOrUpdateVideo}
                className="px-4 py-2 text-sm rounded bg-primary text-white hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {uploading
                  ? "Processing..."
                  : videoToEdit
                  ? "Update Video"
                  : "Upload Video"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {isDeleteModalOpen && (
        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
          <div className=" rounded-lg p-6 w-full max-w-sm relative">
            <h2 className="text-lg font-semibold mb-2">Confirm Deletion?</h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete "
              <span className="font-medium">
                {videoToDelete?.title || videoToDelete?.name}
              </span>
              "? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                disabled={uploading}
                onClick={closeDeleteModal}
                className="px-4 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                disabled={uploading}
                onClick={confirmDelete}
                className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {uploading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

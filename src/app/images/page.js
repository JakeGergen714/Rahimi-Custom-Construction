// components/Images.js
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { AiOutlineMenu, AiOutlineClose } from 'react-icons/ai';
import imageCompression from 'browser-image-compression';

const Images = () => {
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]); // State for uploaded images
  const [remainingStorage, setRemainingStorage] = useState(null); // State for remaining storage
  const menuRef = useRef(null);

  const MAX_STORAGE_LIMIT = 1 * 1024 ** 3; // 5 GB in bytes

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // Close sidebar on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch images from the server
  const fetchImages = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/image-fetch-all');
      const data = await response.json();

      console.log(data);

      if (response.ok) {
        setUploadedImages(data.images); // Set images in state
      } else {
        console.error('Error fetching images:', data.error);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch remaining storage from the server
  const fetchRemainingStorage = async () => {
    try {
      const response = await fetch('/api/image-storage-remaining');
      const data = await response.json();

      if (response.ok) {
        setRemainingStorage(data.remainingStorage);
      } else {
        console.error('Error fetching remaining storage:', data.error);
      }
    } catch (error) {
      console.error('Error fetching remaining storage:', error);
    }
  };

  // Fetch images and remaining storage when the component mounts
  useEffect(() => {
    fetchImages();
    fetchRemainingStorage();
  }, []);

  // Calculate used storage and percentage
  const usedStorage =
    remainingStorage !== null ? MAX_STORAGE_LIMIT - remainingStorage : 0;
  const usedPercentage =
    remainingStorage !== null ? (usedStorage / MAX_STORAGE_LIMIT) * 100 : 0;

  // Handle file selection and upload
  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files);
    setLoading(true);

    try {
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          console.log('Original File:', file.name, file.type, file.size);

          // Set compression options
          const options = {
            maxSizeMB: 1, // Maximum size in MB
            maxWidthOrHeight: 1920, // Maximum width or height in pixels
            useWebWorker: true,
            fileType: 'image/webp', // Convert to WebP format
          };

          // Compress and resize image
          const compressedFile = await imageCompression(file, options);

          console.log(
            'Compressed File:',
            decodeURIComponent(compressedFile.name),
            compressedFile.type,
            compressedFile.size
          );

          // Send compressed file size to the server
          const response = await fetch('/api/image-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: compressedFile.name,
              fileType: compressedFile.type,
              fileSize: compressedFile.size, // Send the size in bytes
            }),
          });

          // Handle storage limit exceeded error
          if (!response.ok) {
            const errorData = await response.json();
            alert(errorData.error || 'An error occurred during upload.');
            return null;
          }

          const { uploadUrl, imageUrl } = await response.json();
          console.log('Presigned Upload URL:', uploadUrl);

          // Upload the file to S3
          await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': compressedFile.type },
            body: compressedFile,
          });

          return {
            id: imageUrl.split('/').pop(),
            name: file.name,
            imageUrl: imageUrl,
          };
        })
      );

      // Filter out any null results (in case of errors)
      const successfulUploads = uploadedFiles.filter((file) => file !== null);

      console.log(successfulUploads);

      // Refresh the image list and remaining storage
      fetchImages();
      fetchRemainingStorage();
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete image
  const handleDeleteImage = async (id, s3Key) => {
    console.log('Deleting image with:', { id, s3Key }); // Log the values

    try {
      // Call backend to delete the image
      const response = await fetch('/api/image-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, s3Key }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Error deleting image:', error.error);
        return;
      }

      // Update state to remove the deleted image
      setUploadedImages((prevImages) =>
        prevImages.filter((image) => image.id !== id)
      );

      // Update remaining storage
      fetchRemainingStorage();
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  return (
    <div className='flex h-screen'>
      {/* Hamburger Icon */}
      <div className='fixed top-4 left-4 z-50 md:hidden'>
        <button onClick={toggleSidebar} className='text-white text-2xl'>
          {isSidebarOpen ? <AiOutlineClose /> : <AiOutlineMenu />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        ref={menuRef}
        className={`fixed left-0 top-0 h-full w-32 bg-slate-700 p-4 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 md:translate-x-0 md:static`}
      >
        <ul>
          <li className='mb-6 pt-4'>
            <a
              href='/invoices'
              className='text-white hover:text-blue-500 text-xl'
            >
              Invoices
            </a>
          </li>
          <li className='mb-6 pt-4'>
            <a
              href='/proposal'
              className='text-white hover:text-blue-500 text-xl'
            >
              Proposals
            </a>
          </li>
          <li className='mb-6 pt-4'>
            <a
              href='/images'
              className='text-white hover:text-blue-500 text-xl'
            >
              Images
            </a>
          </li>
        </ul>
      </div>

      {/* Main content area */}
      <div className='flex-1 main-content-container bg-gray-200 w-4/5 h-full p-6'>
        <div className='innerContainer sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto flex flex-col h-full'>
          <h1 className='text-3xl font-semibold mb-6 text-black'>
            Admin Panel
          </h1>

          {/* Image Upload */}
          <div className='bg-white p-4 shadow rounded-lg max-w-full flex flex-col flex-grow h-full min-h-0'>
            <h2 className='text-2xl font-medium mb-4 text-black'>Images</h2>

            {/* Display Remaining Storage */}
            {remainingStorage !== null && (
              <>
                <p className='text-gray-600 mb-2'>
                  Remaining Storage: {(remainingStorage / 1024 ** 3).toFixed(2)}{' '}
                  GB
                </p>
                {/* Progress Bar */}
                <div className='w-full bg-gray-300 rounded-full h-4 mb-4'>
                  <div
                    className='bg-blue-600 h-4 rounded-full'
                    style={{ width: `${usedPercentage}%` }}
                  ></div>
                </div>
              </>
            )}

            {/* File Upload */}
            <div className='flex flex-wrap pt-4 border-b pb-2 gap-2 sm:gap-4'>
              <input
                type='file'
                accept='image/*'
                multiple
                onChange={handleFileChange}
                className='hidden'
                id='file-upload'
              />
              <label
                htmlFor='file-upload'
                className='bg-blue-500 text-white rounded-lg px-4 py-2 sm:px-6 hover:bg-blue-600 transition-all cursor-pointer'
              >
                + Add new Images
              </label>
            </div>

            {loading && (
              <div className='flex justify-center items-center h-full'>
                <div className='spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-blue-600'>
                  <span className='sr-only text-black'>Loading...</span>
                </div>
              </div>
            )}

            {/* Uploaded Images Gallery */}
            {!loading && uploadedImages.length > 0 && (
              <div className='grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 overflow-auto max-h-[calc(100vh-200px)]'>
                {uploadedImages.map((image) => (
                  <div
                    key={image.id}
                    className='relative flex flex-col items-center'
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.name}
                      className='w-full h-auto rounded-lg shadow'
                    />
                    <button
                      onClick={() => {
                        console.log(image); // Log the full image object for debugging
                        if (!image.imageUrl) {
                          console.error('Image URL is missing:', image);
                          return;
                        }

                        try {
                          const url = new URL(image.imageUrl);
                          const s3Key = url.pathname.slice(1); // Extract S3 key by removing the leading "/"
                          console.log('Extracted S3 Key:', s3Key);
                          handleDeleteImage(image.id, s3Key);
                        } catch (error) {
                          console.error('Error extracting S3 Key:', error);
                        }
                      }}
                      className='absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center'
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!loading && uploadedImages.length === 0 && (
              <p className='text-gray-600 text-center mt-4'>
                No images uploaded yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Images;

// components/Images.js
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { AiOutlineMenu, AiOutlineClose } from 'react-icons/ai';
import imageCompression from 'browser-image-compression';
import AddProjectModal from './AddProjectModal'; // Import the modal

const Images = () => {
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]); // State for uploaded projects
  const [selectedProject, setSelectedProject] = useState(null); // State for selected project to edit
  const [remainingStorage, setRemainingStorage] = useState(null); // State for remaining storage
  const menuRef = useRef(null);

  const MAX_STORAGE_LIMIT = 1 * 1024 ** 3; // 1 GB in bytes

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

  // Fetch projects from the server
  const fetchImages = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/image-fetch-all');
      const data = await response.json();

      console.log('Fetched Projects:', data.projects);

      if (response.ok) {
        setUploadedImages(data.projects); // Assuming 'projects' is the array of project objects
      } else {
        console.error('Error fetching projects:', data.error);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch projects and remaining storage when the component mounts
  useEffect(() => {
    fetchImages();
  }, []);

  // Calculate used storage and percentage
  const usedStorage =
    remainingStorage !== null ? MAX_STORAGE_LIMIT - remainingStorage : 0;
  const usedPercentage =
    remainingStorage !== null ? (usedStorage / MAX_STORAGE_LIMIT) * 100 : 0;

  const handleSaveProject = async (projectData) => {
    setSelectedProject(null);

    if (projectData.id) {
      // Editing an existing project
      console.log('Editing project:', projectData);

      try {
        // Prepare payload for backend
        const payload = {
          ...projectData,
          mainImage:
            projectData.mainImage instanceof File
              ? {
                  fileName: projectData.mainImage.fileName,
                  fileType: projectData.mainImage.fileType,
                }
              : {
                  s3Key: projectData.mainImage.s3Key,
                  fileName: projectData.mainImage.fileName,
                  fileType: projectData.mainImage.fileType,
                },
          additionalPictures: projectData.additionalPictures.map(
            (image) =>
              image instanceof File
                ? {
                    fileName: image.name,
                    fileType: image.type,
                  }
                : image // Preserve existing metadata if not changed
          ),
        };

        console.log('Payload for PUT:', payload); // Debugging

        const response = await fetch('/api/projects-edit', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Error editing project:', error.error);
          alert(error.error || 'An error occurred while editing the project.');
          return;
        }

        // Update the UI with the response data
        const {
          updatedProject,
          mainImageUploadUrl,
          additionalImageUploadUrls,
        } = await response.json();

        console.log('Response from PUT:', {
          updatedProject,
          mainImageUploadUrl,
          additionalImageUploadUrls,
        }); // Debugging

        // If there are new files to upload, upload them to S3
        if (mainImageUploadUrl) {
          console.log(
            'Uploading main image to S3...',
            mainImageUploadUrl,
            projectData.mainImage
          );
          await fetch(mainImageUploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': projectData.mainImage.type },
            body: projectData.mainImage.file,
          });
        }

        if (
          additionalImageUploadUrls?.length > 0 &&
          projectData.additionalPictures.length > 0
        ) {
          console.log(
            'Uploading additional images to S3...',
            additionalImageUploadUrls
          );
          console.log(projectData.additionalPictures);
          await Promise.all(
            additionalImageUploadUrls.map(({ uploadUrl, fileName }) => {
              const file = projectData.additionalPictures.find(
                (img) => img.fileName === fileName
              );
              console.log('found file', file);
              if (!file) {
                console.error(`File not found for fileName: ${fileName}`);
                return Promise.resolve(); // Skip if file not found
              }
              console.log(`Uploading file: ${file.fileName} to ${uploadUrl}`);
              return fetch(uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.fileType },
                body: file.file, // Send the entire File object
              }).then((res) => {
                if (!res.ok) {
                  throw new Error(`Failed to upload image: ${file.name}`);
                }
                return res;
              });
            })
          );
        }

        // Update the local state
        setUploadedImages((prev) =>
          prev.map((proj) =>
            proj.id === updatedProject.id ? updatedProject : proj
          )
        );
        console.log('Project updated successfully:', updatedProject);

        // Refetch projects to refresh the UI
        fetchImages();
      } catch (error) {
        console.error('Error updating project:', error);
        alert('An error occurred while updating the project.');
      }
    } else {
      // Adding a new project
      console.log('Adding new project:', projectData);
      handleProjectUpload(projectData);
    }
  };

  const handleEditProject = (project) => {
    setSelectedProject(project); // Set the project to be edited
    setIsModalOpen(true); // Open the modal
  };

  const handleProjectUpload = async (projectData) => {
    setLoading(true);
    console.log(
      'Uploading project with additionalPictures:',
      projectData.additionalPictures
    );

    try {
      // Upload project data to the server
      const response = await fetch('/api/project-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: projectData.id, // Include only if editing
          title: projectData.title,
          description: projectData.description,
          mainImage: projectData.mainImage, // Either { s3Key } or { fileName, fileType }
          additionalImages: projectData.additionalPictures, // Array of { s3Key } and { fileName, fileType }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'An error occurred during upload.');
        return;
      }

      const { mainImageUploadUrl, additionalImageUploadUrls } =
        await response.json();

      // Upload main image to S3 if a new main image is provided
      if (mainImageUploadUrl && projectData.mainImage.fileName) {
        console.log('Uploading main image to S3...');
        await fetch(mainImageUploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': projectData.mainImage.fileType },
          body: projectData.mainImage.file, // Ensure you pass the File object
        });
      }

      // Upload additional images to S3
      // Separate existing and new additional images
      const newAdditionalImages = projectData.additionalPictures.filter(
        (img) => img.fileName && img.fileType
      );

      await Promise.all(
        newAdditionalImages.map((file, index) => {
          const uploadUrl = additionalImageUploadUrls[index]?.uploadUrl;
          if (!uploadUrl) {
            console.error(
              `No upload URL provided for additional image at index ${index}. Skipping upload for this image.`
            );
            return Promise.resolve(); // Skip this image
          }

          console.log(`Uploading additional image ${file.fileName} to S3...`);
          return fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.fileType },
            body: file.file, // Ensure you pass the File object
          }).then((res) => {
            if (!res.ok) {
              throw new Error(
                `Failed to upload additional image: ${file.fileName}`
              );
            }
            return res;
          });
        })
      );

      // Refresh the project list or show a success message
      console.log('Project uploaded successfully!');
      fetchImages();
    } catch (error) {
      console.error('Error uploading project:', error);
      alert('An error occurred while uploading the project.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (project) => {
    console.log(project);
    // 1) Confirm with the user
    const ok = window.confirm(`Delete project “${project.title}”?`);
    if (!ok) return;

    try {
      // 2) Call DELETE endpoint
      const res = await fetch('/api/project-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Unknown error');

      // 3) Remove from state
      setUploadedImages((current) =>
        current.filter((p) => p.id !== project.id)
      );
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete project: ' + err.message);
    }
  };

  return (
    <div className='flex h-screen'>
      {/* Hamburger Icon */}
      <div className='fixed top-1 left-1 z-50 md:hidden'>
        <button onClick={toggleSidebar} className='text-black text-4xl'>
          {isSidebarOpen ? <AiOutlineClose /> : <AiOutlineMenu />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        ref={menuRef}
        className={`z-50 fixed left-0 top-0 h-full w-32 bg-slate-700 p-4 transform ${
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
          {/* Image Upload */}
          <div className='bg-white p-4 shadow rounded-lg max-w-full flex flex-col flex-grow h-full min-h-0'>
            <h2 className='text-2xl font-medium mb-4 text-black'>Images</h2>

            {/* File Upload */}
            <div className='flex flex-wrap pt-4 border-b pb-2 gap-2 sm:gap-4'>
              <button
                className='bg-blue-500 text-white rounded-lg px-4 py-2 sm:px-6 hover:bg-blue-600 transition-all cursor-pointer'
                onClick={() => {
                  setSelectedProject(null); // Reset the selected project to null
                  setIsModalOpen(true); // Open the modal
                }}
              >
                + Add Project
              </button>
              <AddProjectModal
                isOpen={isModalOpen}
                onClose={() => {
                  setIsModalOpen(false);
                  setSelectedProject(null);
                  console.log('closed');
                }}
                onSave={handleSaveProject}
                projectToEdit={selectedProject}
              />
            </div>

            {loading && (
              <div className='flex justify-center items-center h-full'>
                <div className='spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-blue-600'>
                  <span className='sr-only text-black'>Loading...</span>
                </div>
              </div>
            )}

            {/* Uploaded Projects Gallery */}
            {!loading && uploadedImages.length > 0 && (
              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4'>
                {uploadedImages.map((project) => (
                  <div
                    key={project.id} // Use DynamoDB 'id' as the key
                    className='relative rounded-lg overflow-hidden shadow-lg cursor-pointer'
                    onClick={() => handleEditProject(project)} // Open modal with project data
                  >
                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project);
                      }}
                      className='absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none z-10 '
                      aria-label='Delete project'
                    >
                      <AiOutlineClose size={16} />
                    </button>

                    {/* Main Image */}
                    {project.mainImage && (
                      <div
                        className='w-full h-48 bg-cover bg-center'
                        style={{
                          backgroundImage: `url(${project.mainImage.signedUrl})`,
                        }}
                      >
                        {/* Slate overlay */}
                        <div className='absolute inset-0 bg-slate-700 opacity-60'></div>
                      </div>
                    )}

                    {/* Title and Description */}
                    <div className='absolute inset-0 flex flex-col justify-center items-center p-4 text-white text-center'>
                      {/* Title */}
                      <h3 className='text-xl font-semibold'>{project.title}</h3>

                      {/* Description (truncated if too long) */}
                      <p className='text-sm mt-2'>
                        {project.description.length > 50
                          ? project.description.slice(0, 50) + '...'
                          : project.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && uploadedImages.length === 0 && (
              <p className='text-gray-600 text-center mt-4'>
                No projects uploaded yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Images;

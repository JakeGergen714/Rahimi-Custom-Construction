// components/AddProjectModal.js
import React, { useState, useEffect } from 'react';
import './AddProjectModal.css';

const AddProjectModal = ({ isOpen, onClose, onSave, projectToEdit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mainPicture, setMainPicture] = useState(null); // New main image File
  const [mainPicturePreview, setMainPicturePreview] = useState(null);
  const [additionalFiles, setAdditionalFiles] = useState([]); // New additional image Files
  const [additionalPreviews, setAdditionalPreviews] = useState([]); // Previews for new additional images
  const [existingAdditionalPictures, setExistingAdditionalPictures] = useState(
    []
  ); // Existing additional images

  // Synchronize state with projectToEdit
  useEffect(() => {
    if (projectToEdit) {
      console.log('Editing Project:', projectToEdit);

      setTitle(projectToEdit.title || '');
      setDescription(projectToEdit.description || '');
      setMainPicture(null); // Reset new main image

      // Revoke previous mainPicturePreview if any
      if (mainPicturePreview) {
        URL.revokeObjectURL(mainPicturePreview);
      }

      // Set preview to existing main image's signedUrl or keep null
      setMainPicturePreview(projectToEdit.mainImage?.signedUrl || null);
      setAdditionalFiles([]); // Reset new additional images
      setAdditionalPreviews([]); // Reset new additional previews

      console.log('pre additional ', projectToEdit.additionalImages);
      // Set existing additional pictures
      setExistingAdditionalPictures(
        projectToEdit.additionalImages
          ?.filter(
            (img) => img.s3Key && img.signedUrl && img.signedUrl !== 'undefined'
          )
          .map((img) => {
            console.log('parsing ', img);

            return {
              s3Key: img.s3Key,
              url: img.signedUrl,
              fileName: img.fileName, // Extracted fileName
              fileType: img.fileType, // Extracted fileType
            };
          }) || []
      );
    } else {
      // Reset all fields when adding a new project
      setTitle('');
      setDescription('');
      setMainPicture(null);
      setMainPicturePreview(null);
      setAdditionalFiles([]);
      setAdditionalPreviews([]);
      setExistingAdditionalPictures([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectToEdit]);

  // Handle main image change
  const handleMainPictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Revoke previous mainPicturePreview if any
      if (mainPicturePreview) {
        URL.revokeObjectURL(mainPicturePreview);
      }

      setMainPicture(file);
      setMainPicturePreview(URL.createObjectURL(file));
    }
  };

  // Handle additional images change
  const handleAdditionalPicturesChange = (e) => {
    const files = Array.from(e.target.files);
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];

    // Filter out invalid file types
    const filteredFiles = files.filter((file) =>
      validImageTypes.includes(file.type)
    );

    if (filteredFiles.length !== files.length) {
      alert('Some files were not valid image types and have been excluded.');
    }

    // Generate preview URLs for new additional images
    const newPreviews = filteredFiles.map((file) => URL.createObjectURL(file));

    // Update state for new additional images
    setAdditionalFiles((prev) => [...prev, ...filteredFiles]);
    setAdditionalPreviews((prev) => [...prev, ...newPreviews]);
  };

  // Handle deletion of additional pictures
  const handleDeleteAdditionalPicture = (index, isExisting) => {
    if (isExisting) {
      // Remove existing image from state
      const updatedExisting = [...existingAdditionalPictures];
      updatedExisting.splice(index, 1);
      setExistingAdditionalPictures(updatedExisting);
    } else {
      // Remove new image and revoke its object URL
      const updatedFiles = [...additionalFiles];
      const removedFile = updatedFiles.splice(index, 1)[0];
      setAdditionalFiles(updatedFiles);

      const updatedPreviews = [...additionalPreviews];
      const removedPreview = updatedPreviews.splice(index, 1)[0];
      setAdditionalPreviews(updatedPreviews);

      // Revoke the object URL to free memory
      URL.revokeObjectURL(removedPreview);
    }
  };

  // Handle save action
  // In Images.js

  const handleSave = () => {
    if (!title || !description) {
      alert('Please fill out all required fields.');
      return;
    }

    console.log('project to edit ', projectToEdit);
    console.log('main img', mainPicture);
    console.log('existing: ', existingAdditionalPictures);

    // Construct the payload
    const payload = {
      id: projectToEdit ? projectToEdit.id : null, // Include only if editing
      title,
      description,
      mainImage: mainPicture
        ? {
            fileName: mainPicture.name,
            fileType: mainPicture.type,
            file: mainPicture, // Include the File object
          }
        : projectToEdit
        ? {
            s3Key: projectToEdit.mainImage.s3Key,
            fileName: projectToEdit.mainImage.fileName,
            fileType: projectToEdit.mainImage.fileType,
          }
        : null, // Handle cases where mainImage might not be present
      additionalPictures: [
        // Existing additional images
        ...existingAdditionalPictures.map((img) => ({
          s3Key: img.s3Key,
          fileName: img.fileName,
          fileType: img.fileType,
        })),
        // New additional images
        ...additionalFiles.map((file) => ({
          fileName: file.name,
          fileType: file.type,
          file, // Include the File object
        })),
      ],
    };

    // Optional: Remove null fields to clean up the payload
    Object.keys(payload).forEach(
      (key) => payload[key] === null && delete payload[key]
    );

    console.log('Payload before sending:', payload);

    // Pass the payload to onSave
    onSave(payload);
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      // Revoke main picture preview URL
      if (mainPicturePreview) {
        URL.revokeObjectURL(mainPicturePreview);
      }

      // Revoke all additional pictures preview URLs
      additionalPreviews.forEach((url) => {
        URL.revokeObjectURL(url);
      });

      // No need to revoke existing images' URLs as they are from S3
    };
  }, [mainPicturePreview, additionalPreviews]);

  if (!isOpen) return null;

  return (
    <div className='modal-overlay'>
      <div className='modal-content'>
        <h2>{projectToEdit ? 'Edit Project' : 'Add New Project'}</h2>
        <div className='form-group'>
          <label>Project Title:</label>
          <input
            type='text'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Enter project title'
            required
          />
        </div>
        <div className='form-group'>
          <label>Project Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='Enter project description'
            required
          ></textarea>
        </div>
        <div className='form-group'>
          <label>Main Project Picture:</label>
          <input
            type='file'
            accept='image/*'
            onChange={handleMainPictureChange}
          />
          {mainPicturePreview && (
            <div className='image-preview'>
              <img
                src={mainPicturePreview}
                alt='Main Project Preview'
                className='preview-image'
                loading='lazy'
              />
            </div>
          )}
        </div>
        <div className='form-group'>
          <label>Additional Project Pictures:</label>
          <input
            type='file'
            accept='image/*'
            multiple
            onChange={handleAdditionalPicturesChange}
          />
          <div className='additional-images-previews scrollable-container'>
            {/* Existing Additional Images */}
            {existingAdditionalPictures.map((img, index) => (
              <div
                key={`existing-${img.s3Key || index}`}
                className='image-preview'
              >
                <img
                  src={img.url}
                  alt={`Additional Project Preview ${index + 1}`}
                  className='preview-image'
                />
                <button
                  className='remove-button'
                  onClick={() => handleDeleteAdditionalPicture(index, true)}
                >
                  &times;
                </button>
              </div>
            ))}
            {/* New Additional Images */}
            {additionalPreviews.map((url, index) => (
              <div key={`new-${index}`} className='image-preview'>
                <img
                  src={url}
                  alt={`Additional Project Preview ${
                    existingAdditionalPictures.length + index + 1
                  }`}
                  className='preview-image'
                />
                <button
                  className='remove-button'
                  onClick={() => handleDeleteAdditionalPicture(index, false)}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className='modal-actions'>
          <button onClick={onClose} className='cancel-button'>
            Cancel
          </button>
          <button onClick={handleSave} className='save-button'>
            {projectToEdit ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProjectModal;

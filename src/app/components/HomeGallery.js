'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PuffLoader } from 'react-spinners';
import GallerySlider from '../gallery/GallerySlider';

const HomeGallery = () => {
  const imagesPerPage = 4;
  const [currentPage, setCurrentPage] = useState(0);
  const [images, setImages] = useState([]);
  const [loadingStates, setLoadingStates] = useState(null);
  const [sliderVisible, setSliderVisible] = useState(false);
  const [sliderImages, setSliderImages] = useState([]);

  const totalPages = Math.ceil(images.length / imagesPerPage);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/image-fetch-all');
        const data = await response.json();

        if (response.ok) {
          const projects = data.projects;
          const preloadSizes = await Promise.all(
            projects.flatMap((project) => {
              const images = [
                { ...project.mainImage },
                ...(project.additionalImages || []),
              ];

              return images.map(
                (img) =>
                  new Promise((resolve) => {
                    const image = new window.Image();
                    image.src = img.signedUrl;
                    image.onload = () =>
                      resolve({
                        url: img.signedUrl,
                        width: image.naturalWidth,
                        height: image.naturalHeight,
                      });
                    image.onerror = () =>
                      resolve({
                        url: img.signedUrl,
                        width: 1200,
                        height: 800,
                      });
                  })
              );
            })
          );

          // Attach size info to each project/image
          projects.forEach((project) => {
            const all = [
              project.mainImage,
              ...(project.additionalImages || []),
            ];
            all.forEach((img) => {
              const size = preloadSizes.find((s) => s.url === img.signedUrl);
              if (size) {
                img.width = size.width;
                img.height = size.height;
              }
            });
          });

          setImages(projects);
          setLoadingStates(Array(projects.length).fill(true));
        } else {
          console.error('Error fetching projects:', data.error);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchImages();
  }, []);

  const handleClick = (pageIndex) => {
    setCurrentPage(pageIndex);
  };

  const currentImages = images.slice(
    currentPage * imagesPerPage,
    (currentPage + 1) * imagesPerPage
  );

  const handleImageLoad = (index) => {
    setLoadingStates((prev) =>
      prev.map((state, i) => (i === index ? false : state))
    );
  };

  const openSlider = (image) => {
    setSliderImages(image);
    setSliderVisible(true);
  };

  const closeSlider = () => {
    setSliderVisible(false);
    setSliderImages([]);
  };

  return (
    <div className='gallery-container'>
      <div className='absolute inset-0 bg-stone-950 opacity-70'></div>

      <div className='grid-container relative z-10'>
        <div className='text-4xl sm:text-5xl lg:text-7xl font-bold text-white tracking-tighter text-center pb-4 text-stone-200'>
          Our Portfolio
        </div>
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-4'>
          {currentImages.map((image, index) => (
            <div
              key={index}
              className='flex justify-center items-center relative'
              onClick={() => openSlider(image)}
            >
              <div className='relative w-full h-64 sm:w-h-200px sm:h-200px md:w-h-250px md:h-250px lg:w-h-300px lg:h-300px'>
                {loadingStates[index] && (
                  <div className='absolute inset-0 flex justify-center items-center bg-gray-600'>
                    <PuffLoader color='#36d7b7' size={50} />
                  </div>
                )}
                <Image
                  src={image.mainImage.signedUrl}
                  alt={image.alt || 'Portfolio image'}
                  layout='fill'
                  objectFit='cover'
                  sizes='(max-width: 640px) 100vw, 
                   (max-width: 768px) 50vw, 
                   (max-width: 1024px) 33.33vw, 
                   25vw'
                  onLoadingComplete={() => handleImageLoad(index)}
                />
                <div className='absolute inset-0 bg-slate-700 bg-opacity-50 flex flex-col justify-between p-4'>
                  <h3 className='text-white text-lg font-bold text-center truncate'>
                    {image.title}
                  </h3>
                  <div className='flex-1 flex items-center justify-center'>
                    <p className='text-gray-200 text-sm text-center overflow-hidden text-ellipsis whitespace-nowrap sm:whitespace-normal sm:line-clamp-2'>
                      {image.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className='flex justify-center mt-4'>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              className={`h-3 w-3 rounded-full mx-1 ${
                index === currentPage ? 'bg-white' : 'bg-gray-400'
              }`}
              onClick={() => handleClick(index)}
            ></button>
          ))}
        </div>
        {sliderVisible && (
          <div
            className='fixed inset-0 z-50 bg-black bg-opacity-80 flex justify-center items-center'
            style={{ backdropFilter: 'blur(8px)' }}
          >
            <button
              onClick={closeSlider}
              className='absolute top-4 right-4 text-white bg-red-600 rounded-full p-2 z-10'
            >
              Close
            </button>
            <div className='w-full z-10 max-w-4xl mx-auto px-4 sm:px-8 relative overflow-visible'>
              <GallerySlider projects={[sliderImages]} />
            </div>
          </div>
        )}
        <div className='flex justify-center p-4 relative'>
          <Link href='/gallery'>
            <div className='px-8 sm:px-12 lg:px-16 py-4 border border-white text-white uppercase tracking-widest text-lg hover:bg-slate-500 hover:text-white transition-all duration-300 bg-stone-500'>
              View Gallery
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomeGallery;

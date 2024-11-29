// components/HomeGallery.js
'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const HomeGallery = () => {
  const imagesPerPage = 4;
  const [currentPage, setCurrentPage] = useState(0);
  const [images, setImages] = useState([]);

  const totalPages = Math.ceil(images.length / imagesPerPage);

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/image-fetch-all');
      const data = await response.json();

      console.log(data);

      if (response.ok) {
        setImages(data.images); // Set images in state
      } else {
        console.error('Error fetching images:', data.error);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch images when the component mounts
  useEffect(() => {
    fetchImages();
  }, []);

  const handleClick = (pageIndex) => {
    setCurrentPage(pageIndex);
  };

  const currentImages = images.slice(
    currentPage * imagesPerPage,
    (currentPage + 1) * imagesPerPage
  );

  return (
    <div className='gallery-container'>
      <div className='absolute inset-0 bg-stone-950 opacity-70'></div>

      <div className='grid-container relative z-10'>
        {/* Portfolio Title */}
        <div className='text-4xl sm:text-5xl lg:text-7xl font-bold text-white tracking-tighter text-center pb-4 text-stone-200'>
          Our Portfolio
        </div>

        {/* Image Grid */}
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-4'>
          {currentImages.map((image, index) => (
            <div
              key={index}
              className='flex justify-center items-center relative'
            >
              <div className='relative w-full h-64 sm:w-h-200px sm:h-200px md:w-h-250px md:h-250px lg:w-h-300px lg:h-300px'>
                <Image
                  src={image.imageUrl}
                  alt={image.alt || 'Portfolio image'}
                  layout='fill'
                  objectFit='cover'
                />
                <div className='absolute inset-0 bg-orange-700 opacity-10'></div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Dots */}
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

        {/* Link to Gallery Page */}
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

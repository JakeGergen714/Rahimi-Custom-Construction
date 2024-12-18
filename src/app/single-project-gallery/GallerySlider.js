'use client'; // Make this client-side

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const Slider = dynamic(() => import('react-slick'), { ssr: false });

export default function GallerySlider({ projects }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log(projects);
    setLoading(false); // Set loading to false once the Slider component is mounted
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          arrows: false,
          dots: true,
        },
      },
    ],
  };

  // Combine mainImage and additionalImages for all projects
  const allImages = projects.flatMap((project) => [
    {
      signedUrl: project.mainImage.signedUrl,
      title: project.title,
      description: project.description,
    },
    ...project.additionalImages.map((image) => ({
      signedUrl: image.signedUrl,
      title: project.title,
      description: project.description,
    })),
  ]);

  return (
    <div className='items-center'>
      {loading && (
        <div className='flex justify-center items-center h-screen'>
          <div className='loader'></div>
        </div>
      )}
      {!loading && (
        <Slider {...settings}>
          {allImages.map((image, index) => (
            <div
              key={index}
              className='relative flex justify-center items-center h-[80vh] sm:h-screen'
            >
              {/* Image Slide */}
              <div className='relative w-full h-full flex justify-center items-center'>
                <Image
                  src={image.signedUrl}
                  layout='fill'
                  objectFit='cover'
                  alt={image.title}
                />
                {/* Overlay Text */}
                <div className='absolute bottom-0 left-0 bg-slate-700 bg-opacity-50 p-4 text-white'>
                  <h2 className='text-lg font-bold'>{image.title}</h2>
                  <p className='text-sm'>{image.description}</p>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      )}
    </div>
  );
}

'use client'; // Make this client-side

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const Slider = dynamic(() => import('react-slick'), { ssr: false });

export default function GallerySlider({ images }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set loading to false once the Slider component is mounted
    setLoading(false);
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

  return (
    <div className='items-center'>
      {loading && (
        <div className='flex justify-center items-center h-screen'>
          <div className='loader'></div>
        </div>
      )}
      {!loading && (
        <Slider {...settings}>
          {images.map((curImage, index) => (
            <div
              key={index}
              className='relative flex justify-center items-center h-[80vh] sm:h-screen'
            >
              <div className='relative w-full h-full flex justify-center items-center'>
                <Image
                  src={curImage.src}
                  layout='fill'
                  objectFit='contain'
                  alt={curImage.alt}
                />
              </div>
            </div>
          ))}
        </Slider>
      )}
      <style jsx>{`
        .loader {
          border: 8px solid #f3f3f3; /* Light gray */
          border-top: 8px solid #3498db; /* Blue */
          border-radius: 50%;
          width: 60px;
          height: 60px;
          animation: spin 1.5s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

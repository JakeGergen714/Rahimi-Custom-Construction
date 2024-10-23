'use client'; // Make this client-side

import dynamic from 'next/dynamic';
import Image from 'next/image';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const Slider = dynamic(() => import('react-slick'), { ssr: false });

export default function GallerySlider({ images }) {
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
              <div className='absolute bottom-0 w-full bg-black bg-opacity-70 text-white text-center py-3'>
                <p className='text-lg'>{curImage.alt}</p>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
}

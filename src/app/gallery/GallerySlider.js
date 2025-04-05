'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const Slider = dynamic(() => import('react-slick'), { ssr: false });

export default function GallerySlider({ projects }) {
  const allImages = projects.flatMap((project) => [
    {
      signedUrl: project.mainImage.signedUrl,
      title: project.title,
      description: project.description,
      width: project.mainImage.width,
      height: project.mainImage.height,
    },
    ...(project.additionalImages || []).map((image) => ({
      signedUrl: image.signedUrl,
      title: project.title,
      description: project.description,
      width: image.width,
      height: image.height,
    })),
  ]);

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

  if (allImages.length === 0) {
    return (
      <div className='flex justify-center items-center h-[80vh] text-white'>
        <p>Loading gallery...</p>
      </div>
    );
  }

  return (
    <div className='items-center'>
      <Slider {...settings}>
        {allImages.map((image, index) => (
          <div
            key={index}
            className='flex justify-center items-center h-[80vh] sm:h-screen'
          >
            <div className='flex justify-center items-center w-full h-full'>
              <div className='relative flex justify-center items-center max-w-full max-h-full overflow-auto'>
                <Image
                  src={image.signedUrl}
                  width={image.width || 1200}
                  height={image.height || 800}
                  className='w-auto h-auto max-w-full max-h-full object-contain'
                  alt={image.title}
                />
                <div className='absolute bottom-0 left-0 bg-slate-700 bg-opacity-50 p-4 text-white w-full'>
                  <h2 className='text-lg font-bold'>{image.title}</h2>
                  <p className='text-sm'>{image.description}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
}

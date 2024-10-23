import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { IoArrowBackCircleSharp } from 'react-icons/io5'; // Import the back arrow icon

// Dynamically import the client-side slider
const GallerySlider = dynamic(() => import('./GallerySlider'), { ssr: false });

// Server Component (SEO-optimized images rendered server-side)
export default function GalleryPage() {
  const images = [
    {
      src: '/slideshow/custom-shelf.jpeg',
      alt: 'Custom Shelving and Cabinets | Knoxville, TN',
    },
    {
      src: '/slideshow/custom-cabinet.jpeg',
      alt: 'Custom Shelving and Cabinets | Knoxville, TN',
    },
    {
      src: '/slideshow/custom-handrail.webp',
      alt: 'Custom Handrail and Stairs | Knoxville, TN',
    },
    {
      src: '/slideshow/custom-awning.jpeg',
      alt: 'Custom Awning | Outdoor BBQ Area | Knoxville, TN',
    },
    {
      src: '/slideshow/custom-bookcase-knoxville-tn.jpeg',
      alt: 'Custom Bookcase | Knoxville, TN',
    },
    {
      src: '/slideshow/custom-shelf-knoxville.jpeg',
      alt: 'Custom Shelf and Lighting | Knoxville, TN',
    },
    {
      src: '/slideshow/renovation.webp',
      alt: 'Custom Home Renovation | Knoxville, TN',
    },
  ];

  return (
    <div className='fixed inset-0 z-50 bg-black bg-opacity-80 justify-center items-center'>
      <div className='w-full max-w-4xl mx-auto px-4 sm:px-8'>
        {/* Back button */}
        <Link href='/'>
          <div className='absolute z-10 top-3 left-5 text-white text-[40px] sm:text-[50px]'>
            <IoArrowBackCircleSharp />
          </div>
        </Link>

        {/* Pre-rendered images for SEO */}
        <div className='hidden'>
          {images.map((image, index) => (
            <Image
              key={index}
              src={image.src}
              width={800}
              height={600}
              alt={image.alt}
            />
          ))}
        </div>

        {/* Client-side slider */}
        <GallerySlider images={images} />
      </div>
    </div>
  );
}

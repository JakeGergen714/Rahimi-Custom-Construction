import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { IoArrowBackCircleSharp } from 'react-icons/io5';
import { headers } from 'next/headers';

// Dynamically import the client-side slider
const GallerySlider = dynamic(() => import('./GallerySlider'), { ssr: false });

export default async function GalleryPage() {
  const headersList = headers();
  const host = headersList.get('host');

  const res = await fetch(`http://${host}/api/image-fetch-all`, {
    cache: 'no-store',
  });
  const data = await res.json();

  console.log(data);

  if (!data || !data.projects) {
    console.log(data);
    return (
      <div className='fixed inset-0 z-50 bg-black bg-opacity-80 flex justify-center items-center'>
        <p className='text-white text-center'>No images available.</p>
      </div>
    );
  }

  return (
    <div className='fixed inset-0 z-50 bg-black bg-opacity-80 flex justify-center items-center'>
      <div className='w-full max-w-4xl mx-auto px-4 sm:px-8 relative overflow-visible'>
        {/* Back button */}
        <div className='fixed inset-0'>
          <Link href='/'>
            <div className='absolute z-[1000] top-5 left-5 text-white text-[40px] sm:text-[50px]'>
              <IoArrowBackCircleSharp />
            </div>
          </Link>
        </div>

        {/* Client-side slider */}
        <GallerySlider projects={data.projects} />
      </div>
    </div>
  );
}

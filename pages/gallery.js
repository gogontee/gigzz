import { useState } from 'react';
import Image from 'next/image';
import Head from 'next/head';

export default function Gallery() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const images = [
    {
      id: 1,
      src: "https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/avatars/gigzzblack.png",
      alt: "Gigzz Black Logo",
      title: "Gigzz Main Logo"
    }
    // You can add more images here later
  ];

  return (
    <>
      <Head>
        <title>Gallery - Gigzz</title>
        <meta name="description" content="Gigzz image gallery" />
      </Head>

      <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Gigzz Gallery</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore our brand assets and logos
            </p>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {images.map((image) => (
              <div 
                key={image.id}
                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="aspect-w-1 aspect-h-1 w-full bg-gray-100 flex items-center justify-center p-6">
                  {loading && (
                    <div className="flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  {error && (
                    <div className="text-center text-red-600">
                      <p>Failed to load image</p>
                      <button 
                        onClick={() => {
                          setError(null);
                          setLoading(true);
                        }}
                        className="mt-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={300}
                    height={300}
                    className={`w-full h-auto object-contain transition-opacity duration-300 ${
                      loading ? 'opacity-0' : 'opacity-100'
                    }`}
                    onLoad={() => setLoading(false)}
                    onError={() => {
                      setLoading(false);
                      setError('Failed to load image');
                    }}
                    priority
                  />
                </div>
                
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {image.title}
                  </h3>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {image.alt}
                    </span>
                    <a
                      href={image.src}
                      download
                      className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                    >
                      Download
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State - if you want to add more images later */}
          {images.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🖼️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No images yet
              </h3>
              <p className="text-gray-600">
                Images will appear here once they are added to the gallery.
              </p>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-12 text-center">
            <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                About Gigzz Brand Assets
              </h2>
              <p className="text-gray-600 mb-4">
                This gallery contains official Gigzz brand logos and assets. 
                Feel free to download and use them in accordance with our brand guidelines.
              </p>
              <div className="flex justify-center gap-4">
                <button className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition">
                  Brand Guidelines
                </button>
                <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                  Contact Design Team
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
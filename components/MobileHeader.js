import Image from 'next/image';
import { useRouter } from 'next/navigation';

const MobileHeader = () => {
  const router = useRouter();

  const handleLogoClick = () => {
    router.push('/');
  };

  return (
    <div className="md:hidden flex justify-center items-center bg-transparent">
      <div 
        onClick={handleLogoClick}
        className="cursor-pointer"
      >
        <Image
          src="https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/avatars//gigzzblack.png"
          alt="Gigzz Logo"
          width={80}
          height={30}
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
};

export default MobileHeader;
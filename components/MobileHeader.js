import Image from 'next/image';

const MobileHeader = () => {
  return (
    <div className="md:hidden flex justify-center items-center bg-transparent">
      <Image
        src="https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/avatars//gigzzblack.png"
        alt="Gigzz Logo"
        width={80}
        height={30}
        className="object-contain"
        priority
      />
    </div>
  );
};

export default MobileHeader;

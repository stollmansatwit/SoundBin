
type UploadProps = {
  onOpen: () => void;
};

export function Upload({ onOpen }: UploadProps) {

  return (
    <div className="absolute flex items-left justify-left pt-2 pl-2 z-10">
      <button
        className="h-10 text-white rounded hover:underline hover:cursor-pointer hover:animate-pulse duration-100"
        onClick={onOpen}
      >
        Upload 📤
      </button>
    </div>

  );
}


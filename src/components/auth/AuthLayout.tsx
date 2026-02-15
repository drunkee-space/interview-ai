export default function AuthLayout({
  leftContent,
  children,
}: {
  leftContent: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bgMain flex items-center justify-center p-6">
      <div className="w-full max-w-[1500px] h-[80vh] bg-card rounded-3xl shadow-soft flex overflow-hidden">

        {/* LEFT PANEL */}
        <div className="w-1/2 bg-primary flex flex-col justify-center items-center text-white px-20">
          {leftContent}
        </div>

        {/* RIGHT PANEL */}
        <div className="w-1/2 flex flex-col justify-center px-24">
          {children}
        </div>

      </div>
    </div>
  );
}

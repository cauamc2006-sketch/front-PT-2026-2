import { Suspense } from "react";
import Navbar from "./../components/Navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={<nav className="bg-[#000000] w-full px-8 py-5 flex items-center justify-between shadow-md h-[83px]" />}>
        <Navbar />
      </Suspense>
      <main className="flex-grow">
        {children}
      </main>
    </>
  );
}
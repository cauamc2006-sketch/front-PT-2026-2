import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo ou Nome do Site */}
        <Link href="/" className="text-xl font-bold">
          Stock.io
        </Link>

        {/* Links de Navegação */}
        <div className="space-x-4">
          <Link href="/" className="hover:text-gray-300">
            Feed
          </Link>
          <Link href="/login" className="hover:text-gray-300">
            Login
          </Link>
          <Link href="/cadastro" className="hover:text-gray-300">
            Cadastro
          </Link>
        </div>
      </div>
    </nav>
  );
}
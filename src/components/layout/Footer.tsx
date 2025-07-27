import { useNavigate } from "react-router-dom";

export function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="bg-black border-t border-zinc-800 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* TheSet Section */}
          <div>
            <h3 className="text-white font-semibold mb-4">TheSet</h3>
            <p className="text-zinc-400 text-sm mb-4">
              A platform for fans to preview concert setlists through voting, connecting artists with 
              their audience.
            </p>
          </div>

          {/* Navigation Section */}
          <div>
            <h3 className="text-white font-semibold mb-4">Navigation</h3>
            <div className="space-y-2">
              <button 
                onClick={() => navigate('/')}
                className="block text-zinc-400 hover:text-white text-sm transition-colors"
              >
                Home
              </button>
              <button 
                onClick={() => navigate('/artists')}
                className="block text-zinc-400 hover:text-white text-sm transition-colors"
              >
                Artists
              </button>
              <button 
                onClick={() => navigate('/shows')}
                className="block text-zinc-400 hover:text-white text-sm transition-colors"
              >
                Shows
              </button>
              <button 
                onClick={() => navigate('/how-it-works')}
                className="block text-zinc-400 hover:text-white text-sm transition-colors"
              >
                How It Works
              </button>
            </div>
          </div>

          {/* Legal Section */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <div className="space-y-2">
              <a 
                href="#" 
                className="block text-zinc-400 hover:text-white text-sm transition-colors"
              >
                Privacy Policy
              </a>
              <a 
                href="#" 
                className="block text-zinc-400 hover:text-white text-sm transition-colors"
              >
                Terms of Service
              </a>
              <a 
                href="#" 
                className="block text-zinc-400 hover:text-white text-sm transition-colors"
              >
                About
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-zinc-500 text-sm">
            © 2025 TheSet. All rights reserved.
          </p>
          <p className="text-zinc-500 text-sm mt-4 md:mt-0">
            Made with ❤️ for music fans worldwide.
          </p>
        </div>
      </div>
    </footer>
  );
}

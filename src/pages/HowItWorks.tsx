import { TopNavigation } from "@/components/layout/TopNavigation";
import { Footer } from "@/components/layout/Footer";

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-black">
      <TopNavigation />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            How TheSet Works
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Shape the perfect concert experience by voting on setlists for your favorite artists' upcoming shows
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 mb-16">
          <div className="text-center">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-3xl font-bold text-white">1</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Find Your Artist</h3>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Search for your favorite artists and discover their upcoming concerts near you. 
              Connect your Spotify account for personalized recommendations.
            </p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-3xl font-bold text-white">2</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Vote on Songs</h3>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Cast your votes on songs you want to hear at the show. See what other fans are 
              voting for and suggest new songs to add to the setlist.
            </p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-3xl font-bold text-white">3</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Experience the Magic</h3>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Attend concerts with setlists shaped by fan preferences. Experience the joy of 
              hearing your favorite songs performed live.
            </p>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Why It Matters</h2>
          <div className="space-y-6 text-zinc-300">
            <p className="text-lg">
              Every concert is unique, but wouldn't it be amazing if the artist knew exactly what 
              songs the audience was hoping to hear? TheSet bridges that gap by giving fans a voice 
              in shaping the perfect setlist.
            </p>
            <p className="text-lg">
              Artists want to create memorable experiences for their fans. By voting on TheSet, 
              you're helping them understand what songs resonate most with their audience for each 
              specific show and venue.
            </p>
            <p className="text-lg">
              The result? More engaging concerts where both artists and fans are excited about 
              every song, creating unforgettable live music experiences.
            </p>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-zinc-400 mb-8">
            Join thousands of music fans shaping the future of live concerts
          </p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.href = '/'}
              className="bg-white text-black hover:bg-zinc-200 px-8 py-3 rounded-full font-semibold"
            >
              Explore Artists
            </button>
            <button
              onClick={() => window.location.href = '/shows'}
              className="border border-zinc-700 text-white hover:bg-zinc-800 px-8 py-3 rounded-full font-semibold"
            >
              Browse Shows
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
